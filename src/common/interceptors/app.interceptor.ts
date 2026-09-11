import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class AppInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AppInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();

    // Handle Kafka/RPC context
    if (contextType === 'rpc') {
      const rpcContext = context.switchToRpc();
      const data = rpcContext.getData();
      const topic = data?.topic ?? data?.pattern ?? 'unknown-topic';
      const startTime = Date.now();

      this.logger.log(`[KAFKA:START] topic: ${topic}`);

      return next.handle().pipe(
        tap({
          next: () => {
            const duration = Date.now() - startTime;
            this.logger.log(`[KAFKA:END] topic: ${topic} | duration: ${duration}ms`);
          },
          error: (error) => {
            const duration = Date.now() - startTime;
            this.logger.error(
              `[KAFKA:ERROR] topic: ${topic} | duration: ${duration}ms | error: ${error?.message}`,
            );
          },
        }),
      );
    }

    // Fallback for HTTP context
    return next.handle();
  }
}
