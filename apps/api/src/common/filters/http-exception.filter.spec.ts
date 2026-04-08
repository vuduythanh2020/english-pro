import { HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { ArgumentsHost } from '@nestjs/common';

function createMockHost(requestId = 'test-request-id'): ArgumentsHost {
  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  const mockResponse = { status: mockStatus };
  const mockRequest = { requestId, url: '/test', method: 'GET' };

  return {
    switchToHttp: () => ({
      getResponse: () => mockResponse,
      getRequest: () => mockRequest,
    }),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    const host = createMockHost();
    filter.catch(exception, host);

    const response = host.switchToHttp().getResponse();
    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.status().json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Not Found',
        meta: expect.objectContaining({
          requestId: 'test-request-id',
          timestamp: expect.any(String),
        }),
      }),
    );
  });

  it('should handle HttpException with object response', () => {
    const exception = new HttpException(
      {
        message: 'Custom message',
        error: 'CUSTOM_ERROR',
        details: { field: 'name' },
      },
      HttpStatus.BAD_REQUEST,
    );
    const host = createMockHost();
    filter.catch(exception, host);

    const response = host.switchToHttp().getResponse();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.status().json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'CUSTOM_ERROR',
        message: 'Custom message',
        details: { field: 'name' },
      }),
    );
  });

  it('should handle class-validator errors (array of messages)', () => {
    const exception = new BadRequestException({
      message: ['email must be an email', 'name should not be empty'],
      error: 'Bad Request',
    });
    const host = createMockHost();
    filter.catch(exception, host);

    const response = host.switchToHttp().getResponse();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.status().json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          errors: ['email must be an email', 'name should not be empty'],
        },
      }),
    );
  });

  it('should handle unknown exceptions as 500', () => {
    const exception = new Error('Something went wrong');
    const host = createMockHost();
    filter.catch(exception, host);

    const response = host.switchToHttp().getResponse();
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.status().json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }),
    );
  });

  it('should handle non-Error unknown exceptions', () => {
    const host = createMockHost();
    filter.catch('string error', host);

    const response = host.switchToHttp().getResponse();
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.status().json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }),
    );
  });

  it('should include requestId as "unknown" when not set', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockResponse = { status: mockStatus };
    const mockRequest = { requestId: undefined, url: '/test', method: 'GET' };

    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ArgumentsHost;

    const exception = new HttpException('Test', 400);
    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({
          requestId: 'unknown',
        }),
      }),
    );
  });
});
