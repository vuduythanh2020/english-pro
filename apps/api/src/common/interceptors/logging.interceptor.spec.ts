import { ExecutionContext, CallHandler, Logger } from '@nestjs/common';
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

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
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
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/v1/test 200'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[user:user-123]'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[req:req-abc]'),
      );
      done();
    });
  });

  it('should log "anonymous" when no user', (done) => {
    const context = createMockContext('POST', '/api/v1/data');
    const callHandler = createMockCallHandler();

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[user:anonymous]'),
      );
      done();
    });
  });

  it('should log errors', (done) => {
    const context = createMockContext('GET', '/api/v1/fail');
    const callHandler = createErrorCallHandler(new Error('Test error'));

    interceptor.intercept(context, callHandler).subscribe({
      error: () => {
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('GET /api/v1/fail ERROR'),
        );
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Test error'),
        );
        done();
      },
    });
  });

  it('should include duration in milliseconds', (done) => {
    const context = createMockContext('GET', '/api/v1/test');
    const callHandler = createMockCallHandler();

    interceptor.intercept(context, callHandler).subscribe(() => {
      expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/\d+ms/));
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
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[req:unknown]'),
      );
      done();
    });
  });
});
