import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CustomRestInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CustomRestInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) ?? uuidv4();
    const method = request.method;
    const url = request.url;
    const startTime = Date.now();

    // Attach requestId to request for downstream use
    (request as any).requestId = requestId;

    this.logger.log(`[START] ${method} ${url} | requestId: ${requestId}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[END] ${method} ${url} | requestId: ${requestId} | duration: ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[ERROR] ${method} ${url} | requestId: ${requestId} | duration: ${duration}ms | error: ${error?.message}`,
          );
        },
      }),
    );
  }
}
