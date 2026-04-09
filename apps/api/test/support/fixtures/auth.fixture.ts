// test/support/fixtures/auth.fixture.ts
// Auth test helpers — JWT token generation and user context mocking
import * as jwt from 'jsonwebtoken';

export interface TestJwtPayload {
    sub: string;
    email?: string;
    role?: 'PARENT' | 'CHILD';
    parentId?: string;
    childId?: string;
}

const TEST_JWT_SECRET = 'test-jwt-secret-for-testing-only';

/**
 * Creates a valid JWT token for test requests.
 *
 * @example
 * const token = createTestToken({ sub: parentId, role: 'PARENT' });
 * request(app.getHttpServer())
 *   .get('/api/v1/children')
 *   .set('Authorization', `Bearer ${token}`)
 */
export function createTestToken(
    payload: Partial<TestJwtPayload>,
    options?: { expiresInSeconds?: number },
): string {
    const defaults: TestJwtPayload = {
        sub: payload.sub || 'test-user-id',
        email: payload.email || 'test@example.com',
        role: payload.role || 'PARENT',
        ...payload,
    };

    return jwt.sign(defaults, TEST_JWT_SECRET, {
        expiresIn: options?.expiresInSeconds ?? 3600,
    });
}

/**
 * Creates a parent JWT token with standard claims.
 */
export function createParentToken(parentId: string, email?: string): string {
    return createTestToken({
        sub: parentId,
        email: email || `parent-${parentId}@test.com`,
        role: 'PARENT',
        parentId,
    });
}

/**
 * Creates a child JWT token with standard claims.
 */
export function createChildToken(
    childId: string,
    parentId: string,
): string {
    return createTestToken({
        sub: childId,
        role: 'CHILD',
        childId,
        parentId,
    });
}

/**
 * Creates an expired token for testing auth rejection.
 */
export function createExpiredToken(
    payload?: Partial<TestJwtPayload>,
): string {
    return createTestToken(payload || {}, { expiresInSeconds: -1 });
}

/**
 * Mock AuthGuard that allows all requests (for testing non-auth logic).
 */
export const MockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
};

/**
 * Mock RolesGuard that allows all requests.
 */
export const MockRolesGuard = {
    canActivate: jest.fn().mockReturnValue(true),
};
