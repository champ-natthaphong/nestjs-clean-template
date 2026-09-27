import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { buildErrorResponse, ResultCode, ResultCodes } from '../utils/response.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const contextType = host.getType();

    if (contextType === 'http') {
      this.handleHttpException(exception, host);
    } else {
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
      exception instanceof HttpException ? exception.message : 'Internal server error';

    const resultCode = this.mapStatusToResultCode(status);

    this.logger.error(
      `[HTTP:EXCEPTION] ${request.method} ${request.url} | status: ${status} | message: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json(buildErrorResponse(resultCode, message, status));
  }

  private mapStatusToResultCode(status: number): ResultCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ResultCodes.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ResultCodes.UNAUTHORIZED;
      case HttpStatus.NOT_FOUND:
        return ResultCodes.NOT_FOUND;
      case HttpStatus.INTERNAL_SERVER_ERROR:
      default:
        return ResultCodes.INTERNAL_ERROR;
    }
  }
}
