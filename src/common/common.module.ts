import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SummaryFlush } from './logger/summary-flush';
import { SystemLoggerService } from './logger/system-logger.service';
import { ConfigService } from './config/config.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Global()
@Module({
  providers: [
    SummaryFlush,
    SystemLoggerService,
    ConfigService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [SummaryFlush, SystemLoggerService, ConfigService],
})
export class CommonModule {}
