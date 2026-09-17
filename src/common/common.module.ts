// src/common/common.module.ts
import { Global, Module } from '@nestjs/common';
import { SummaryFlush } from './logger/summary-flush';
import { SystemLoggerService } from './logger/system-logger.service';

@Global()
@Module({
  providers: [SummaryFlush, SystemLoggerService],
  exports: [SummaryFlush, SystemLoggerService],
})
export class CommonModule {}
