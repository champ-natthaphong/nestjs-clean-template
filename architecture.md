src/
│
├── config/
│ ├── config.module.ts
│ ├── config.service.ts
│ ├── config.loader.ts
│ ├── config.validator.ts
│ ├── config.types.ts
│ └── index.ts
│
├── infrastructure/
│ ├── database/
│ │ ├── database.module.ts
│ │ └── prisma.service.ts
│ │
│ ├── redis/
│ │ ├── redis.module.ts
│ │ └── redis.service.ts
│ │
│ └── logger/
│
├── modules/
│ ├── users/
│ └── ...
│
├── app.module.ts
└── main.ts
│
config/
├── default.yaml
├── development.yaml
└── production.yaml
=============================================================================

## Project Structure

```
src/
├── main.ts                              # Bootstrap + global filters/pipes + Kafka microservice
├── app.module.ts                        # Root module (Framework + Database + Modules aggregator)
├── shared/
│   ├── constants/
│   │   └── topics.ts                    # PRODUCER_TOPICS + CONSUMER_TOPICS (YAML-loaded)
│   └── utils/
│       └── sanitize.ts                  # removePathTraversalCharacters (ZONE env sanitizer)
├── database/
│   └── database-registry.module.ts      # MongooseModule.forFeature() + repositories registry
├── external-services/                   # ESB HTTP clients (extend BaseExternalService)
│   ├── external-services.module.ts      # Validates api-paths on startup
│   └── constants/
│       └── api-paths.ts                 # API_PATHS — maps backend → YAML config path
├── producers/                           # ESB Kafka producers (extend BaseKafkaProducer)
│   └── producers.module.ts              # Validates producer topics on startup
└── modules/
    └── modules.module.ts                # Feature-modules aggregator (Controller → Manager → Service)

assets/
└── config/
    └── portal-service/                  # ← module name (rename ตาม service ตอน clone)
        ├── local.config.yaml            # Local dev config
        ├── dev.config.yaml              # Dev environment config
        ├── staging.config.yaml          # Staging config
        ├── prod.config.yaml             # Production config
        └── test.config.yaml             # Test environment config

```

## main.ts

```typescript
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
  logger.log('Starting application...!');
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
```

## app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database-registry.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ModulesModule } from './modules/modules.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'medium',
          ttl: 10000,
          limit: 20,
        },
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // --- Database (prisma + startup log) ------------------
    DatabaseModule,
    // --- Feature Modules ------------------------------------
    ModulesModule,
  ],
})
export class AppModule {}
```
