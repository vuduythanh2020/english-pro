/**
 * Integration Test — CommonModule Guard Chain
 * Test ID: 1.0-INT-001
 * Priority: P0
 *
 * Validates:
 * - Guard execution order: Auth → Roles → ParentalGate
 * - ResponseWrapperInterceptor wraps success responses
 * - HttpExceptionFilter formats error responses
 * - Combined guard/decorator behavior
 *
 * NOTE: We replicate the CommonModule provider registrations instead of
 * importing CommonModule directly, because CommonModule has an `exports`
 * array that references classes not in `providers` (only in APP_GUARD tokens).
 * This is a known deferred issue tracked in deferred-work.md.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
    INestApplication,
    Controller,
    Get,
} from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as jwt from 'jsonwebtoken';
import * as winston from 'winston';
import supertest from 'supertest';

import { AuthGuard } from '../../src/common/guards/auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { ParentalGateGuard } from '../../src/common/guards/parental-gate.guard';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ResponseWrapperInterceptor } from '../../src/common/interceptors/response-wrapper.interceptor';
import { LoggingInterceptor } from '../../src/common/interceptors/logging.interceptor';
import { Public } from '../../src/common/decorators/public.decorator';
import { Roles } from '../../src/common/decorators/roles.decorator';
import { ParentOnly } from '../../src/common/decorators/parent-only.decorator';

const TEST_JWT_SECRET = 'test-secret-for-guard-chain';

function signToken(
    payload: Record<string, any>,
    options: jwt.SignOptions = {},
): string {
    return jwt.sign(payload, TEST_JWT_SECRET, {
        expiresIn: '1h',
        ...options,
    });
}

// Test controllers with different guard combinations
@Controller('test')
class TestController {
    @Get('public')
    @Public()
    getPublic() {
        return { status: 'public' };
    }

    @Get('authenticated')
    getAuthenticated() {
        return { status: 'authenticated' };
    }

    @Get('parent-only')
    @ParentOnly()
    getParentOnly() {
        return { status: 'parent-only' };
    }

    @Get('roles-parent')
    @Roles('PARENT')
    getRolesParent() {
        return { status: 'roles-parent' };
    }

    @Get('roles-child')
    @Roles('CHILD')
    getRolesChild() {
        return { status: 'roles-child' };
    }

    @Get('parent-and-role')
    @Roles('PARENT')
    @ParentOnly()
    getParentAndRole() {
        return { status: 'parent-and-role' };
    }
}

describe('CommonModule Guard Chain Integration', () => {
    let app: INestApplication;

    beforeAll(async () => {
        // Mirror CommonModule provider registrations manually
        // to avoid the export validation bug in CommonModule
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [
                        () => ({
                            SUPABASE_JWT_SECRET: TEST_JWT_SECRET,
                        }),
                    ],
                }),
                WinstonModule.forRoot({
                    transports: [new winston.transports.Console({ silent: true })],
                }),
            ],
            controllers: [TestController],
            providers: [
                // Guards — order matters: Auth → Roles → ParentalGate
                { provide: APP_GUARD, useClass: AuthGuard },
                { provide: APP_GUARD, useClass: RolesGuard },
                { provide: APP_GUARD, useClass: ParentalGateGuard },
                // Filters
                { provide: APP_FILTER, useClass: HttpExceptionFilter },
                // Interceptors
                { provide: APP_INTERCEPTOR, useClass: ResponseWrapperInterceptor },
                { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
            ],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        if (app) await app.close();
    });

    describe('Guard Execution Order: Auth → Roles → ParentalGate', () => {
        it('should allow @Public() endpoints without token', async () => {
            const response = await supertest(app.getHttpServer())
                .get('/test/public')
                .expect(200);

            expect(response.body.data.status).toBe('public');
        });

        it('should reject unauthenticated request to protected endpoint', async () => {
            await supertest(app.getHttpServer())
                .get('/test/authenticated')
                .expect(401);
        });

        it('should allow authenticated PARENT to access general endpoint', async () => {
            const token = signToken({
                sub: 'auth-user-1',
                email: 'parent@test.com',
                app_metadata: { role: 'PARENT', user_id: 'user-1' },
            });

            const response = await supertest(app.getHttpServer())
                .get('/test/authenticated')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.data.status).toBe('authenticated');
        });

        it('should reject CHILD from @ParentOnly() endpoint', async () => {
            const token = signToken({
                sub: 'auth-child-1',
                app_metadata: {
                    role: 'CHILD',
                    user_id: 'user-1',
                    child_id: 'child-1',
                },
            });

            await supertest(app.getHttpServer())
                .get('/test/parent-only')
                .set('Authorization', `Bearer ${token}`)
                .expect(403);
        });

        it('should allow PARENT to access @ParentOnly() endpoint', async () => {
            const token = signToken({
                sub: 'auth-user-2',
                email: 'parent2@test.com',
                app_metadata: { role: 'PARENT', user_id: 'user-2' },
            });

            const response = await supertest(app.getHttpServer())
                .get('/test/parent-only')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.data.status).toBe('parent-only');
        });

        it('should reject CHILD from @Roles(PARENT) endpoint', async () => {
            const token = signToken({
                sub: 'auth-child-2',
                app_metadata: { role: 'CHILD', child_id: 'child-2' },
            });

            await supertest(app.getHttpServer())
                .get('/test/roles-parent')
                .set('Authorization', `Bearer ${token}`)
                .expect(403);
        });

        it('should allow CHILD to access @Roles(CHILD) endpoint', async () => {
            const token = signToken({
                sub: 'auth-child-3',
                app_metadata: {
                    role: 'CHILD',
                    user_id: 'user-1',
                    child_id: 'child-3',
                },
            });

            const response = await supertest(app.getHttpServer())
                .get('/test/roles-child')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.data.status).toBe('roles-child');
        });

        it('should reject CHILD from combined @Roles(PARENT) + @ParentOnly() endpoint', async () => {
            const token = signToken({
                sub: 'auth-child-4',
                app_metadata: { role: 'CHILD', child_id: 'child-4' },
            });

            await supertest(app.getHttpServer())
                .get('/test/parent-and-role')
                .set('Authorization', `Bearer ${token}`)
                .expect(403);
        });

        it('should wrap success responses in ApiResponse format', async () => {
            const response = await supertest(app.getHttpServer())
                .get('/test/public')
                .expect(200);

            // ResponseWrapperInterceptor wraps in { data, meta }
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(response.body.meta).toHaveProperty('timestamp');
            expect(response.body.meta).toHaveProperty('requestId');
        });

        it('should return error in ApiErrorResponse format on 401', async () => {
            const response = await supertest(app.getHttpServer())
                .get('/test/authenticated')
                .expect(401);

            // HttpExceptionFilter wraps errors
            expect(response.body).toHaveProperty('statusCode', 401);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('meta');
        });
    });
});
