// src/common/logger/system-logger.service.ts
import { Injectable, LoggerService, Logger } from '@nestjs/common';

@Injectable()
export class SystemLoggerService implements LoggerService {
  private readonly logger = new Logger('System');

  log(message: string, context?: string): void {
    this.logger.log(message, context);
  }

  info(message: string, context?: string): void {
    this.logger.log(message, context); // NestJS ไม่มี info level ใช้ log แทน
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, context);
  }
}
