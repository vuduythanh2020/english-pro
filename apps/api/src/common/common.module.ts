import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ParentalGateGuard } from './guards/parental-gate.guard';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ResponseWrapperInterceptor } from './interceptors/response-wrapper.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Module({
  providers: [
    // Guards — order matters: Auth → Roles → ParentalGate
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ParentalGateGuard },
    // Filters
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    // Interceptors — ResponseWrapper must be registered LAST (NestJS LIFO = outermost execution)
    // Execution order: ResponseWrapper (outer, sets requestId) → Logging (inner, reads requestId)
    { provide: APP_INTERCEPTOR, useClass: ResponseWrapperInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class CommonModule { }
