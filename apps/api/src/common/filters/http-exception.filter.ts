import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId || 'unknown';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';
    let error = 'INTERNAL_ERROR';
    let details: Record<string, unknown> | undefined = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = HttpStatus[statusCode] || 'ERROR';
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;

        // Handle class-validator errors (array of messages)
        if (Array.isArray(resp.message)) {
          message = 'Validation failed';
          error = 'VALIDATION_ERROR';
          details = { errors: resp.message };
        } else {
          message = resp.message || exception.message;
          error = resp.error || HttpStatus[statusCode] || 'ERROR';
          details = resp.details;
        }
      }
    } else {
      // Unknown error — log full stack
      const errorMessage =
        exception instanceof Error ? exception.message : String(exception);
      this.logger.error(
        `Unhandled exception: ${errorMessage}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      details,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  }
}
