import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import {
  AllExceptionsFilter,
  AppValidationPipe,
  ConfigService,
  CustomServerConfluentKafkaJS,
  HealthCheck,
  HealthCheckBuilder,
  setupGracefulShutdown,
  setupSwagger,
  SystemLoggerService,
} from './common';
import { KafkaAdminService } from './common/kafka/kafka-admin.service';
import { kafkaConfig } from './common/kafka/kafka.config';
import chalk from 'chalk';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const configService = new ConfigService();
  const port = configService.get<number>('port') ?? 3080;
  const healthCheckPort = configService.get<number>('healthCheckPort') ?? 3001;
  const dbName = configService.get<string>('database.name');
  const dbUrl = configService.get<string>('database.url');
  const kafkaBrokers = configService.get<string>('kafka.brokers');
  const kafkaOptions = kafkaConfig();
  const app = await NestFactory.create(AppModule);

  setupSwagger(app);

  const kafkaAdmin = app.get(KafkaAdminService);
  await kafkaAdmin.ensureTopicsExist();

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
      .setDbs([{ dbName, connectionString: dbUrl }])
      .setKafkaOpt(kafkaOptions),
  );

  const sysLog = app.get(SystemLoggerService);
  sysLog.info(`Kafka ready (${chalk.magenta(kafkaBrokers)})`);
  sysLog.info(`HTTP server listening on port ${chalk.cyan(port)}`);
  sysLog.info(`Health check on port ${chalk.cyan(healthCheckPort)}`);
  sysLog.info(chalk.green('Application bootstrap completed'));
}

bootstrap().catch((err: unknown) => {
  const logger = new SystemLoggerService();
  logger.error(
    'Error during application bootstrap:',
    err instanceof Error ? err.stack : String(err),
  );
  process.exit(1);
});
