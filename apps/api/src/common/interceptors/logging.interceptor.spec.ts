/* eslint-disable @typescript-eslint/unbound-method */
import { ExecutionContext, CallHandler } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

function createMockContext(
  method = 'GET',
  url = '/test',
  user: any = undefined,
  requestId = 'req-123',
): ExecutionContext {
  const request: any = { method, url, user, requestId };
  const response: any = { statusCode: 200 };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

function createMockCallHandler(data?: any): CallHandler {
  return {
    handle: () => of(data ?? {}),
  };
}

function createErrorCallHandler(error: Error): CallHandler {
  return {
    handle: () => throwError(() => error),
  };
}

function createMockLogger(): LoggerService {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
}

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockLogger: LoggerService;

  beforeEach(() => {
    mockLogger = createMockLogger();
    interceptor = new LoggingInterceptor(mockLogger);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log successful requests', (done) => {
    const context = createMockContext(
      'GET',
      '/api/v1/test',
      { userId: 'user-123' },
      'req-abc',
    );
    const callHandler = createMockCallHandler({ data: 'test' });

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/v1/test 200'),
        'HTTP',
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('[user:user-123]'),
        'HTTP',
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('[req:req-abc]'),
        'HTTP',
      );
      done();
    });
  });

  it('should log "anonymous" when no user', (done) => {
    const context = createMockContext('POST', '/api/v1/data');
    const callHandler = createMockCallHandler();

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('[user:anonymous]'),
        'HTTP',
      );
      done();
    });
  });

  it('should log errors', (done) => {
    const context = createMockContext('GET', '/api/v1/fail');
    const callHandler = createErrorCallHandler(new Error('Test error'));

    interceptor.intercept(context, callHandler).subscribe({
      error: () => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('GET /api/v1/fail ERROR'),
          expect.any(String),
          'HTTP',
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('Test error'),
          expect.any(String),
          'HTTP',
        );
        done();
      },
    });
  });

  it('should include duration in milliseconds', (done) => {
    const context = createMockContext('GET', '/api/v1/test');
    const callHandler = createMockCallHandler();

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringMatching(/\d+ms/),
        'HTTP',
      );
      done();
    });
  });

  it('should log "unknown" when no requestId', (done) => {
    const request: any = { method: 'GET', url: '/test', user: undefined };
    // requestId is not set at all
    const response: any = { statusCode: 200 };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
    const callHandler = createMockCallHandler();

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('[req:unknown]'),
        'HTTP',
      );
      done();
    });
  });
});
