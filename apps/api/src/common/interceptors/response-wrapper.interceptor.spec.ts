import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseWrapperInterceptor } from './response-wrapper.interceptor';

// Mock uuid module to avoid ESM issues
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234-5678-abcd-ef0123456789',
}));

function createMockContext(url: string): ExecutionContext {
  const request: any = { url, requestId: undefined };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function createMockCallHandler(data: any): CallHandler {
  return {
    handle: () => of(data),
  };
}

describe('ResponseWrapperInterceptor', () => {
  let interceptor: ResponseWrapperInterceptor;

  beforeEach(() => {
    interceptor = new ResponseWrapperInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap response data in { data, meta } format', (done) => {
    const context = createMockContext('/api/v1/test');
    const callHandler = createMockCallHandler({ message: 'hello' });

    interceptor.intercept(context, callHandler).subscribe((result) => {
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toEqual({ message: 'hello' });
      expect(result.meta).toHaveProperty('timestamp');
      expect(result.meta).toHaveProperty('requestId');
      expect(result.meta.requestId).toBe(
        'mock-uuid-1234-5678-abcd-ef0123456789',
      );
      done();
    });
  });

  it('should attach requestId to the request object', (done) => {
    const context = createMockContext('/api/v1/test');
    const callHandler = createMockCallHandler({});

    interceptor.intercept(context, callHandler).subscribe(() => {
      const request = context.switchToHttp().getRequest();
      expect(request.requestId).toBe('mock-uuid-1234-5678-abcd-ef0123456789');
      done();
    });
  });

  it('should skip wrapping for /api/docs path', (done) => {
    const context = createMockContext('/api/docs');
    const callHandler = createMockCallHandler({ swagger: true });

    interceptor.intercept(context, callHandler).subscribe((result) => {
      // Should return raw data without wrapping
      expect(result).toEqual({ swagger: true });
      expect(result).not.toHaveProperty('meta');
      done();
    });
  });

  it('should skip wrapping for /health path', (done) => {
    const context = createMockContext('/health');
    const callHandler = createMockCallHandler({ status: 'ok' });

    interceptor.intercept(context, callHandler).subscribe((result) => {
      expect(result).toEqual({ status: 'ok' });
      expect(result).not.toHaveProperty('meta');
      done();
    });
  });

  it('should skip wrapping for /api/v1/health path', (done) => {
    const context = createMockContext('/api/v1/health');
    const callHandler = createMockCallHandler({ status: 'ok' });

    interceptor.intercept(context, callHandler).subscribe((result) => {
      expect(result).toEqual({ status: 'ok' });
      done();
    });
  });

  it('should handle null data', (done) => {
    const context = createMockContext('/api/v1/test');
    const callHandler = createMockCallHandler(null);

    interceptor.intercept(context, callHandler).subscribe((result) => {
      expect(result.data).toBeNull();
      expect(result.meta).toBeDefined();
      done();
    });
  });

  it('should normalize undefined data to null', (done) => {
    const context = createMockContext('/api/v1/test');
    const callHandler = createMockCallHandler(undefined);

    interceptor.intercept(context, callHandler).subscribe((result) => {
      // undefined data must become null so JSON.stringify includes the key
      expect(result).toHaveProperty('data');
      expect(result.data).toBeNull();
      expect(result.meta).toBeDefined();
      done();
    });
  });

  it('should handle array data', (done) => {
    const context = createMockContext('/api/v1/test');
    const callHandler = createMockCallHandler([1, 2, 3]);

    interceptor.intercept(context, callHandler).subscribe((result) => {
      expect(result.data).toEqual([1, 2, 3]);
      expect(result.meta).toBeDefined();
      done();
    });
  });
});
