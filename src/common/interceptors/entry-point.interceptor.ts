import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { ENTRY_POINT_KEY } from '../decorators/custom-http-entry-point.decorator';

@Injectable()
export class EntryPointInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EntryPointInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const entryPoint =
      this.reflector.get<string>(ENTRY_POINT_KEY, context.getHandler()) ?? 'unknown';

    const request = context.switchToHttp().getRequest();
    const requestId = request.requestId ?? '-';

    this.logger.log(`[ENTRY] ${entryPoint} | requestId: ${requestId}`);

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`[EXIT] ${entryPoint} | requestId: ${requestId}`),
        error: (err) =>
          this.logger.error(
            `[EXIT:ERROR] ${entryPoint} | requestId: ${requestId} | ${err?.message}`,
          ),
      }),
    );
  }
}
