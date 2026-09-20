import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import chalk from 'chalk';
import {
  AllExceptionsFilter,
  AppValidationPipe,
  ConfigService,
  CustomServerConfluentKafkaJS,
  HealthCheck,
  HealthCheckBuilder,
  setupGracefulShutdown,
  SystemLoggerService,
} from './common';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { kafkaConfig } from './common/kafka/kafka.config';

async function bootstrap(): Promise<void> {
  const port = process.env.PORT || 3080;
  const healthCheckPort = process.env.HEALTH_CHECK_PORT || 3001;
  const configService = new ConfigService();
  const kafkaOptions = kafkaConfig();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.connectMicroservice<MicroserviceOptions>({
    strategy: new CustomServerConfluentKafkaJS({
      'group.id': configService.get<string>('kafka.consumer.group-id'),
      'allow.auto.create.topics': configService.get<boolean>(
        'kafka.consumer.allow-auto-topic-creation',
      ),
    }),
  });

  await app.startAllMicroservices();
  await app.listen(port);
  setupGracefulShutdown({ app });

  await HealthCheck.startHealthCheckWithDependenciesService(
    new HealthCheckBuilder()
      .setPort(Number(healthCheckPort))
      .setDbs([{ dbName: process.env.DATABASE_NAME!, connectionString: process.env.DATABASE_URL! }])
      .setKafkaOpt(kafkaOptions),
  );

  const sysLog = app.get(SystemLoggerService);
  sysLog.info(`Kafka ready (${chalk.magenta(process.env.BROKERS)})`);
  sysLog.info(`HTTP server listening on port ${chalk.cyan(port)}`);
  sysLog.info(`Health check on port ${chalk.cyan(healthCheckPort)}`);
  sysLog.info(chalk.green('Application bootstrap completed'));
}
bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
  process.exit(1);
});
