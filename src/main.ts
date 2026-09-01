import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { APP_CONFIG, AppConfig } from './shared/config/condfig.token';

async function bootstrap() {
  const logger = new Logger('Information');
  const app = await NestFactory.create(AppModule, { cors: true });
  const config = app.get<AppConfig>(APP_CONFIG);

  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = config.app.port ?? process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Environment: ${process.env.ZONE ?? 'local'}`);
  logger.log(`HTTP server listening on port ${port}`);
  logger.log('Application bootstrap completed');
}

bootstrap().catch((err) => {
  console.error('--XX-- Error during application bootstrap:', err);
  process.exit(1);
});
