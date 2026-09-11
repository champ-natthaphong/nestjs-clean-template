// src/common/utils/setup-graceful-shutdown.ts
import { INestApplication, Logger } from '@nestjs/common';

const logger = new Logger('GracefulShutdown');

export function setupGracefulShutdown({ app }: { app: INestApplication }): void {
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal} — starting graceful shutdown...`);
    try {
      await app.close();
      logger.log('Application closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error(`Error during shutdown: ${(error as Error)?.message}`);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception: ${error.message}`, error.stack);
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled rejection: ${reason}`);
    shutdown('unhandledRejection');
  });

  logger.log('Graceful shutdown handlers registered');
}
