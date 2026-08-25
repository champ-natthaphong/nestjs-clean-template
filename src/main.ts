import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { removePathTraversalCharacters } from './shared/utils/sanitize';

const config = yaml.load(
  readFileSync(
    join(
      process.cwd(),
      'assets',
      'config',
      'portal-service',
      `${removePathTraversalCharacters(process.env.ZONE)}.config.yaml`,
    ),
    'utf8',
  ),
) as Record<string, unknown>;
console.log({ config: config });

async function bootstrap() {
  const logger = new Logger('Information');

  logger.log('Starting application...');
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Environment: ${process.env.ZONE ?? 'local'}`);
  logger.log(`HTTP server listening on port ${process.env.PORT ?? 3000}`);
  logger.log('Application bootstrap completed');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('--XX-- Error during application bootstrap:', err);
  process.exit(1);
});
