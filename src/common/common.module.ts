// src/common/common.module.ts
import { Global, Module } from '@nestjs/common';
import { SummaryFlush } from './logger/summary-flush';
import { SystemLoggerService } from './logger/system-logger.service';
import { ConfigService } from './config/config.service';

@Global()
@Module({
  providers: [SummaryFlush, SystemLoggerService, ConfigService],
  exports: [SummaryFlush, SystemLoggerService, ConfigService],
})
export class CommonModule {}
