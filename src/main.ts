import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

import {
  AllExceptionsFilter,
  AppValidationPipe,
  CustomServerConfluentKafkaJS,
  HealthCheck,
  HealthCheckBuilder,
  setupGracefulShutdown,
  SystemLoggerService,
} from './common';

import { AppModule } from './app.module';
import { removePathTraversalCharacters } from './shared/utils/sanitize';
import { VersioningType } from '@nestjs/common';

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
console.log({ config });

function kafkaConfig() {
  const kafkaConf = config['kafka'] as Record<string, Record<string, unknown>>;
  return {
    client: {
      brokers: [process.env.BROKERS!],
      clientId: kafkaConf.client['client-id'] as string,
      ssl: kafkaConf.client['ssl'] as boolean,
      sasl:
        removePathTraversalCharacters(process.env.ZONE) !== 'local'
          ? {
              mechanism: 'plain' as const,
              username: process.env.API_KEY!,
              password: process.env.API_SECRET!,
            }
          : undefined,
      requestTimeout: kafkaConf.client['request-timeout'] as number,
      enforceRequestTimeout: kafkaConf.client['enforce-request-timeout'] as boolean,
      retry: {
        initialRetryTime: kafkaConf.client['initial-retry-time'] as number,
        retries: kafkaConf.client['retries'] as number,
      },
      connectionTimeout: kafkaConf.client['connection-timeout'] as number,
    },
    consumer: {
      groupId: kafkaConf.consumer['group-id'] as string,
      allowAutoTopicCreation: kafkaConf.consumer['allow-auto-topic-creation'] as boolean,
    },
  };
}

async function bootstrap(): Promise<void> {
  const port = process.env.PORT || 3080;
  const healthCheckPort = process.env.HEALTH_CHECK_PORT || 3001;
  const kafkaConf = config['kafka'] as Record<string, Record<string, unknown>>;
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api'); // ← เพิ่ม
  // URI Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.connectMicroservice<MicroserviceOptions>({
    strategy: new CustomServerConfluentKafkaJS({
      'group.id': kafkaConf.consumer['group-id'] as string,
      'allow.auto.create.topics': kafkaConf.consumer['allow-auto-topic-creation'] as boolean,
    }),
  });
  await app.startAllMicroservices();

  await app.listen(port);

  setupGracefulShutdown({ app });

  await HealthCheck.startHealthCheckWithDependenciesService(
    new HealthCheckBuilder()
      .setPort(Number(healthCheckPort))
      .setDbs([{ dbName: process.env.DATABASE_NAME!, connectionString: process.env.DATABASE_URL! }])
      .setKafkaOpt(kafkaConfig()),
  );

  const sysLog = app.get(SystemLoggerService);
  sysLog.info(`Kafka ready (${process.env.BROKERS})`);
  sysLog.info(`HTTP server listening on port ${port}`);
  sysLog.info(`Health check on port ${healthCheckPort}`);
  sysLog.info('Application bootstrap completed');
}

bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
  process.exit(1);
});
