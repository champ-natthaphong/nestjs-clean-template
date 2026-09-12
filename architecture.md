0642393284

## Layer Pattern (สำคัญ!)

```
Controller  →  Manager  →  Service  →  Repository / ExternalService / Producer
   │              │            │
   │              │            └── Business logic, DB queries, ESB calls
   │              └── Orchestrate + try/catch + flush + unified response
   └── Route definition + Guard + Interceptor (ห้ามมี business logic)
```

> **Pattern นี้ใช้ทั้ง REST และ Kafka consumer** — ต่างกันแค่ Controller layer

### REST Controller → delegate อย่างเดียว

```typescript
@Controller('orders')
@UseGuards(AuthGuard) // ← validate token
@UseInterceptors(CustomRestInterceptor) // ← init logger context
export class OrderController {
  @CustomHttpEntryPoint('getOrders')
  @Get()
  async getOrders(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleGetOrders(req, res); // ← delegate
  }
}
```

### Kafka Consumer Controller → delegate อย่างเดียว

```typescript
@Controller()
@UseInterceptors(AppInterceptor) // ← Kafka context
export class RegistrationController {
  @EntryPoint(CONSUMER_TOPICS.atnRegistrationResponse)
  @UsePipes(new RemoveAtSymbolPipe())
  async handleRegistrationResponse(@ToObjectDecorator() data: MessageContextDto) {
    await this.manager.handleRegistrationResponse(data);
  }
}
```

### REST Manager → try/catch + unified response + flush

```typescript
async handleGetOrders(req: Request, res: Response) {
  try {
    const result = await this.service.getOrders();
    res.json(buildSuccessResponse(result));
    this.summaryFlush.flush();                    // ← structured log
  } catch (error) {
    this.summaryFlush.flushError(error);          // ← error log
    this.sendErrorResponse(res, error);           // ← unified JSON
  }
}
```

### Kafka Consumer Manager → try/catch + flush + graceful shutdown

```typescript
async handleRegistrationResponse(data: MessageContextDto) {
  try {
    await this.registrationService.processRegistrationResponse(data);
    this.summaryFlush.flush();
  } catch (error) {
    this.summaryFlush.flushError(error);
  }
}
```

### Service → pure business logic

```typescript
async getOrders(): Promise<Order[]> {
  return this.orderRepository.findAll();  // ← ไม่มี Request/Response
}
```

---

## API Response Format

ทุก endpoint ใช้ format เดียวกัน — TMF-based result codes + Thai messages

```typescript
import { buildSuccessResponse, buildErrorResponse, ResultCodes } from '@corpais/rat-common-lib';

// Success (default resultCode = '20000')
res.json(buildSuccessResponse(data));

// Success with custom code
res.status(201).json(buildSuccessResponse(newOrder, ResultCodes.CREATED));

// Error
res.status(404).json(buildErrorResponse(ResultCodes.NOT_FOUND, 'Order not found', 404));
```

```json
// Success Response
{
  "resultCode": "20000",
  "resultDescription": "Success",
  "developerMessage": "",
  "data": { ... }
}

// Error Response
{
  "resultCode": "40400",
  "resultDescription": "Resource not found",
  "developerMessage": "Order not found",
  "data": { "message": "ไม่พบข้อมูลที่ร้องขอ", "messageList": [] }
}
```

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



src/common/
  ├── guards/
  │   └── auth.guard.ts                         ← Basic Auth
  ├── interceptors/
  │   ├── custom-rest.interceptor.ts            ← HTTP log + requestId
  │   ├── entry-point.interceptor.ts            ← HTTP entry point log
  │   └── app.interceptor.ts                    ← Kafka consumer log
  ├── decorators/
  │   ├── custom-http-entry-point.decorator.ts  ← @CustomHttpEntryPoint (REST)
  │   ├── entry-point.decorator.ts              ← @EntryPoint (Kafka)
  │   └── to-object.decorator.ts               ← @ToObjectDecorator (parse payload)
  ├── pipes/
  │   └── remove-at-symbol.pipe.ts             ← ตัด @ ออกจาก string
  └── index.ts                                  ← barrel export

```

## main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
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
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints ?? {}).join('. ') + '.',
        }));
        return new BadRequestException({ errors: messages });
      },
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

```

```
