import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const contextType = host.getType();

    if (contextType === 'http') {
      this.handleHttpException(exception, host);
    } else {
      // Kafka / RPC context
      this.logger.error('[KAFKA:EXCEPTION]', exception);
    }
  }

  private handleHttpException(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    this.logger.error(
      `[HTTP:EXCEPTION] ${request.method} ${request.url} | status: ${status} | message: ${JSON.stringify(message)}`,
    );

    response.status(status).json({
      resultCode: String(status),
      resultDescription: 'Error',
      developerMessage: typeof message === 'string' ? message : JSON.stringify(message),
      data: {
        message: typeof message === 'object' ? message : { error: message },
        messageList: [],
      },
    });
  }
}
