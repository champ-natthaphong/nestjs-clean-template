// src/common/logger/summary-flush.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SummaryFlush {
  private readonly logger = new Logger(SummaryFlush.name);

  flush(): void {
    this.logger.log('[SUMMARY] success');
  }

  flushError(error: unknown): void {
    this.logger.error(`[SUMMARY] error: ${(error as Error)?.message}`);
  }
}
