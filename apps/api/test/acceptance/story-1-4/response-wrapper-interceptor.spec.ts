/**
 * ATDD Tests - Story 1.4: ResponseWrapperInterceptor
 * Test IDs: 1.4-UNIT-018 through 1.4-UNIT-020
 * Priority: P0/P1 (Response Consistency)
 * Status: 🔴 RED (failing before implementation)
 *
 * These tests validate that ResponseWrapperInterceptor wraps
 * success responses in { data, meta: { timestamp, requestId } } format.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';

const RESPONSE_WRAPPER_PATH = join(
  __dirname,
  '../../../src/common/interceptors/response-wrapper.interceptor.ts',
);

describe('Story 1.4: ResponseWrapperInterceptor @P0 @Unit', () => {
  // 1.4-UNIT-018: Wraps success response in standard format
  describe('1.4-UNIT-018: Success Response Wrapping', () => {
    it.skip('should have response-wrapper.interceptor.ts in src/common/interceptors/', () => {
      // RED: File does not exist yet
      expect(existsSync(RESPONSE_WRAPPER_PATH)).toBe(true);
    });

    it.skip('should wrap response data in { data, meta } format', async () => {
      // RED: ResponseWrapperInterceptor not implemented yet
      const { ResponseWrapperInterceptor } =
        await import('../../../src/common/interceptors/response-wrapper.interceptor');

      const interceptor = new ResponseWrapperInterceptor();

      const originalData = { id: 1, name: 'Test User' };
      const mockCallHandler = { handle: () => of(originalData) };
      const mockRequest = {
        url: '/api/v1/users',
        requestId: undefined as string | undefined,
      };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      const result$ = interceptor.intercept(
        mockContext,
        mockCallHandler as any,
      );
      const result = await lastValueFrom(result$);

      expect(result).toMatchObject({
        data: originalData,
        meta: {
          timestamp: expect.any(String),
          requestId: expect.any(String),
        },
      });
      // Verify timestamp is ISO format
      expect(result.meta.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });
  });

  // 1.4-UNIT-019: Generates UUID requestId
  describe('1.4-UNIT-019: RequestId Generation', () => {
    it.skip('should generate a UUID v4 requestId and attach to request', async () => {
      // RED: ResponseWrapperInterceptor not implemented yet
      const { ResponseWrapperInterceptor } =
        await import('../../../src/common/interceptors/response-wrapper.interceptor');

      const interceptor = new ResponseWrapperInterceptor();

      const mockCallHandler = { handle: () => of({ ok: true }) };
      const mockRequest = {
        url: '/api/v1/test',
        requestId: undefined as string | undefined,
      };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      const result$ = interceptor.intercept(
        mockContext,
        mockCallHandler as any,
      );
      const result = await lastValueFrom(result$);

      // UUID v4 format: 8-4-4-4-12 hex chars
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result.meta.requestId).toMatch(uuidV4Regex);

      // requestId should also be attached to request object for correlation
      expect(mockRequest.requestId).toBe(result.meta.requestId);
    });
  });

  // 1.4-UNIT-020: Skips wrapping for excluded paths
  describe('1.4-UNIT-020: Exclude Paths', () => {
    it.skip('should NOT wrap response for /api/docs path', async () => {
      // RED: ResponseWrapperInterceptor not implemented yet
      const { ResponseWrapperInterceptor } =
        await import('../../../src/common/interceptors/response-wrapper.interceptor');

      const interceptor = new ResponseWrapperInterceptor();

      const swaggerData = {
        openapi: '3.0.0',
        info: { title: 'English Pro API' },
      };
      const mockCallHandler = { handle: () => of(swaggerData) };
      const mockRequest = {
        url: '/api/docs',
        requestId: undefined as string | undefined,
      };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      const result$ = interceptor.intercept(
        mockContext,
        mockCallHandler as any,
      );
      const result = await lastValueFrom(result$);

      // Should return raw data, NOT wrapped in { data, meta }
      expect(result).toEqual(swaggerData);
      expect(result).not.toHaveProperty('meta');
    });

    it.skip('should NOT wrap response for /health path', async () => {
      // RED: ResponseWrapperInterceptor not implemented yet
      const { ResponseWrapperInterceptor } =
        await import('../../../src/common/interceptors/response-wrapper.interceptor');

      const interceptor = new ResponseWrapperInterceptor();

      const healthData = { status: 'ok' };
      const mockCallHandler = { handle: () => of(healthData) };
      const mockRequest = {
        url: '/health',
        requestId: undefined as string | undefined,
      };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      const result$ = interceptor.intercept(
        mockContext,
        mockCallHandler as any,
      );
      const result = await lastValueFrom(result$);

      expect(result).toEqual(healthData);
      expect(result).not.toHaveProperty('meta');
    });
  });
});
