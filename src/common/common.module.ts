// src/common/common.module.ts
import { Global, Module } from '@nestjs/common';
import { SummaryFlush } from './logger/summary-flush';

@Global()
@Module({
  providers: [SummaryFlush],
  exports: [SummaryFlush],
})
export class CommonModule {}
