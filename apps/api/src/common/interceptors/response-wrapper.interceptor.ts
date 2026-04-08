import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

const EXCLUDE_PATHS = ['/api/docs', '/health', '/api/v1/health'];

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = uuidv4();
    request.requestId = requestId;

    // Skip wrapping for excluded paths
    if (EXCLUDE_PATHS.some((path) => request.url.startsWith(path))) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        data: data ?? null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      })),
    );
  }
}
