// src/common/logger/system-logger.service.ts
import { Injectable, LoggerService, Logger } from '@nestjs/common';

@Injectable()
export class SystemLoggerService implements LoggerService {
  private readonly logger = new Logger('System');

  log(message: string, context?: string): void {
    context ? this.logger.log(message, context) : this.logger.log(message);
  }

  info(message: string, context?: string): void {
    context ? this.logger.log(message, context) : this.logger.log(message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string): void {
    context ? this.logger.warn(message, context) : this.logger.warn(message);
  }

  debug(message: string, context?: string): void {
    context ? this.logger.debug(message, context) : this.logger.debug(message);
  }

  verbose(message: string, context?: string): void {
    context ? this.logger.verbose(message, context) : this.logger.verbose(message);
  }
}
