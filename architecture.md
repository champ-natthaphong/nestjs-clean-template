# NestJS Clean Template — สรุปโปรเจกต์

---

## 📦 Tech Stack

| ส่วน           | เทคโนโลยี                                             |
| -------------- | ----------------------------------------------------- |
| Framework      | NestJS v11                                            |
| ORM            | TypeORM (branch: feature/replace-prisma-with-typeorm) |
| Database       | PostgreSQL                                            |
| Message Queue  | Kafka (Confluent KRaft mode)                          |
| Infrastructure | Docker Compose                                        |
| Language       | TypeScript 5                                          |

---

## 🏗️ Architecture Pattern

```
Controller → Manager → Service → Repository
```

| Layer      | หน้าที่                                                    |
| ---------- | ---------------------------------------------------------- |
| Controller | route + guard + interceptor เท่านั้น ห้ามมี business logic |
| Manager    | try/catch + flush + unified response                       |
| Service    | pure business logic                                        |
| Repository | DB queries                                                 |

### ตัวอย่าง REST Controller

```typescript
@Controller('users')
@UseGuards(AuthGuard)
@UseInterceptors(CustomRestInterceptor)
export class UserController {
  @CustomHttpEntryPoint('getAllUsers')
  @Get()
  async getAllUsers(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleGetAllUsers(req, res); // ← delegate only
  }
}
```

### ตัวอย่าง Kafka Consumer Controller

```typescript
@Controller()
@UseInterceptors(AppInterceptor)
export class NotificationConsumerController {
  @EntryPoint(CONSUMER_TOPICS.notificationIncoming)
  @UsePipes(new RemoveAtSymbolPipe())
  async handleIncomingNotification(@ToObjectDecorator() data: NotificationMessageDto) {
    await this.manager.handleIncomingNotification(data);
  }
}
```

### ตัวอย่าง Manager

```typescript
async handleGetAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await this.userService.getAllUsers();
    res.json(buildSuccessResponse(users));
    this.summaryFlush.flush();
  } catch (error) {
    this.summaryFlush.flushError(error);
    this.sendErrorResponse(res, error);
  }
}
```

---

## 📁 Project Structure

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── guards/auth.guard.ts                        # Basic Auth
│   ├── interceptors/
│   │   ├── custom-rest.interceptor.ts              # HTTP log + requestId
│   │   ├── entry-point.interceptor.ts              # HTTP entry point log
│   │   └── app.interceptor.ts                     # Kafka consumer log
│   ├── decorators/
│   │   ├── custom-http-entry-point.decorator.ts   # @CustomHttpEntryPoint
│   │   ├── entry-point.decorator.ts               # @EntryPoint (Kafka)
│   │   └── to-object.decorator.ts                 # @ToObjectDecorator
│   ├── pipes/
│   │   ├── app-validation.pipe.ts                 # global validation
│   │   └── remove-at-symbol.pipe.ts               # ตัด @ จาก Kafka message
│   ├── filters/all-exceptions.filter.ts           # catch ทุก exception
│   ├── logger/
│   │   ├── system-logger.service.ts               # structured logger
│   │   └── summary-flush.ts                       # flush log per request
│   ├── health/health-check.builder.ts             # health check endpoint
│   ├── kafka/custom-server-confluent-kafkajs.ts   # custom Kafka transport
│   ├── utils/
│   │   ├── response.util.ts                       # buildSuccessResponse/buildErrorResponse
│   │   └── setup-graceful-shutdown.ts             # SIGTERM/SIGINT handler
│   └── index.ts                                   # barrel export
├── database/
│   ├── database-registry.module.ts                # TypeORM forRootAsync
│   └── data-source.ts                             # migration data source
├── shared/
│   └── constants/topics.ts                        # CONSUMER_TOPICS / PRODUCER_TOPICS
└── modules/
    ├── modules.module.ts
    ├── users/
    │   ├── user.module.ts
    │   ├── controllers/user.controller.ts
    │   ├── managers/user.manager.ts
    │   ├── services/user.service.ts
    │   ├── repositories/user.repository.ts
    │   ├── entities/user.entity.ts
    │   └── dto/user.dto.ts
    └── notification/
        ├── notification.module.ts
        ├── controllers/
        │   ├── notification.controller.ts
        │   └── notification-consumer.controller.ts
        ├── managers/notification.manager.ts
        ├── services/notification.service.ts
        ├── repositories/notification.repository.ts
        ├── entities/notification.entity.ts
        └── dto/notification.dto.ts
```

---

## 🗄️ TypeORM

### database-registry.module.ts

```typescript
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [User, Notification],
        synchronize: process.env.ZONE === 'local', // dev only ⚠️
        logging: process.env.ZONE === 'local',
      }),
    }),
  ],
})
export class DatabaseModule {}
```

### Entities

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column({ unique: true }) email: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @OneToMany(() => Notification, (n) => n.user) notifications: Notification[];
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Column() title: string;
  @Column() message: string;
  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.INFO })
  type: NotificationType;
  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;
  @Column({ default: false }) isRead: boolean;
  @Column({ type: 'timestamp', nullable: true }) readAt: Date | null;
  @Column({ type: 'jsonb', default: {} }) metadata: Record<string, any>;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @ManyToOne(() => User, (u) => u.notifications) @JoinColumn({ name: 'userId' }) user: User;
}
```

### Migration Commands

```bash
# สร้าง migration
npm run typeorm -- migration:generate src/database/migrations/init -d src/database/data-source.ts

# รัน migration
npm run typeorm -- migration:run -d src/database/data-source.ts

# ย้อน migration
npm run typeorm -- migration:revert -d src/database/data-source.ts
```

---

## 🌐 API Response Format

```json
// Success
{ "resultCode": "20000", "resultDescription": "Success", "developerMessage": "", "data": {} }

// Error
{ "resultCode": "40400", "resultDescription": "Error", "developerMessage": "...", "data": { "message": "...", "messageList": [] } }
```

### ResultCodes

| Code  | ความหมาย       |
| ----- | -------------- |
| 20000 | Success        |
| 20100 | Created        |
| 40000 | Bad Request    |
| 40100 | Unauthorized   |
| 40400 | Not Found      |
| 50000 | Internal Error |

---

## 📡 REST Endpoints

### Users `/users`

| Method | Path                       | Action                       |
| ------ | -------------------------- | ---------------------------- |
| GET    | `/users`                   | ดึงทั้งหมด                   |
| GET    | `/users/:id`               | ดึงตาม id                    |
| GET    | `/users/:id/notifications` | ดึง user พร้อม notifications |
| POST   | `/users`                   | สร้างใหม่                    |
| PUT    | `/users/:id`               | แก้ไข                        |
| DELETE | `/users/:id`               | ลบ                           |

### Notifications `/notifications`

| Method | Path                                   | Action           |
| ------ | -------------------------------------- | ---------------- |
| GET    | `/notifications/user/:userId`          | ดึงทั้งหมด       |
| GET    | `/notifications/user/:userId/unread`   | ดึงที่ยังไม่อ่าน |
| POST   | `/notifications`                       | สร้างใหม่        |
| PATCH  | `/notifications/:id/read`              | mark อ่านแล้ว    |
| PATCH  | `/notifications/user/:userId/read-all` | mark ทั้งหมด     |
| DELETE | `/notifications/:id`                   | ลบ               |

---

## ⚡ Kafka

### Flow

```
Producer (Service อื่น) → [Kafka Topic] → NotificationConsumerController
                                           → NotificationManager
                                           → NotificationService
                                           → NotificationRepository → DB
```

### Config ใน main.ts

```typescript
app.connectMicroservice<MicroserviceOptions>({
  strategy: new CustomServerConfluentKafkaJS({
    'group.id': 'nestjs-clean-template-group',
    'allow.auto.create.topics': false,
  }),
});
await app.startAllMicroservices();
await app.listen(port);
```

### CustomServerConfluentKafkaJS

- extends `Server` + implements `CustomTransportStrategy`
- ต้อง implement: `listen()`, `close()`, `on()`, `unwrap()`
- SASL เปิดอัตโนมัติเมื่อ `ZONE !== 'local'`
- ห้ามประกาศ `private logger` ซ้ำ (base class มีให้แล้ว)

### Topics

```typescript
export const CONSUMER_TOPICS = {
  notificationIncoming: process.env.TOPIC_NOTIFICATION_INCOMING ?? 'notification.incoming',
};
```

---

## 🐳 Docker Compose

| Service  | Port | หน้าที่              |
| -------- | ---- | -------------------- |
| postgres | 5432 | PostgreSQL           |
| kafka    | 9092 | Kafka broker (KRaft) |
| kafka-ui | 9333 | Kafka Web UI         |

### Kafka Connection

- Host machine → `localhost:9092`
- Docker network → `kafka:29092`
- Kafka UI bootstrap → `kafka:29092`

### KRaft Mode — Environment ที่สำคัญ

| Variable                               | ความหมาย                              |
| -------------------------------------- | ------------------------------------- |
| KAFKA_PROCESS_ROLES                    | broker,controller — ไม่ต้อง Zookeeper |
| KAFKA_LISTENERS                        | port ที่เปิดรับฟังจริง                |
| KAFKA_ADVERTISED_LISTENERS             | บอก client ว่าต่อมาที่ไหน             |
| CLUSTER_ID                             | ต้องคงที่ ถ้าเปลี่ยนจะ boot ไม่ขึ้น   |
| KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS | ตั้ง 0 สำหรับ dev                     |

---

## 🔐 Common Lib (`src/common/`)

### AuthGuard — Basic Auth

```
Header: Authorization: Basic <base64(username:password)>
```

```env
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=secret
```

### Decorators

```typescript
@CustomHttpEntryPoint('name')  // REST — log entry/exit
@EntryPoint('topic.name')      // Kafka — subscribe + log
@ToObjectDecorator()           // Kafka — parse payload เป็น object
```

### Pipes

```typescript
new AppValidationPipe(); // global validation + custom error format
new RemoveAtSymbolPipe(); // ตัด @ ออกจาก string ทุก field
```

### Utils

```typescript
buildSuccessResponse(data); // { resultCode: '20000', data }
buildErrorResponse(code, message); // { resultCode, developerMessage }
setupGracefulShutdown({ app }); // handle SIGTERM/SIGINT
```

---

## ⚙️ Environment Variables

```env
# App
PORT=3080
HEALTH_CHECK_PORT=3001
ZONE=local

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_template

# Auth
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=secret

# Kafka
BROKERS=localhost:9092
KAFKA_CLIENT_ID=nestjs-clean-template
API_KEY=
API_SECRET=

# Topics
TOPIC_NOTIFICATION_INCOMING=notification.incoming
```

---

## 📦 NPM Scripts

```bash
npm run start:local       # dev with watch
npm run start:prod        # production
npm run build             # compile TypeScript
npm run lint              # eslint fix
npm run test              # jest

# TypeORM Migration
npm run typeorm -- migration:generate src/database/migrations/<name> -d src/database/data-source.ts
npm run typeorm -- migration:run -d src/database/data-source.ts
npm run typeorm -- migration:revert -d src/database/data-source.ts
```

---

## 🌿 Git Branches

| Branch                              | ใช้ทำอะไร            |
| ----------------------------------- | -------------------- |
| main                                | stable — Prisma ORM  |
| feature/replace-prisma-with-typeorm | TypeORM (ใช้งานอยู่) |

```bash
git checkout -b feature/<ชื่อ>       # สร้าง branch ใหม่
git commit -m "feat: <สิ่งที่ทำ>"    # commit
git checkout main && git merge feature/<ชื่อ>  # merge
```

---

## 🔑 Key Concepts ที่ได้เรียนรู้

### isolatedModules + emitDecoratorMetadata

ต้องใช้ `import type` สำหรับ type ที่ใช้ใน method parameter ที่มี decorator:

```typescript
import type { Request, Response } from 'express'; // ← ต้องมี type
```

### TypeORM vs Prisma

|                | TypeORM                   | Prisma                 |
| -------------- | ------------------------- | ---------------------- |
| Schema         | Entity class decorator    | schema.prisma file     |
| Migration      | migration:generate + run  | prisma migrate dev     |
| Query          | repo.find() / repo.save() | prisma.user.findMany() |
| Type safety    | decorator-based           | auto generated types   |
| Learning curve | ยืดหยุ่นกว่า              | ง่ายกว่า               |

### Prisma v7 Gotchas

- `provider = "prisma-client-js"` (ไม่ใช่ `prisma-client`)
- `output = "../src/generated/prisma"` — path relative จาก `prisma/` folder
- `tsconfig.json` ต้องใช้ `module: commonjs` ไม่ใช่ `nodenext`
- ลบ `resolvePackageJsonExports` ออกเมื่อใช้ `moduleResolution: node`

### Kafka KRaft Mode

- ไม่ต้อง Zookeeper แยก — node เดียวทำหน้าที่ทั้ง broker + controller
- `CLUSTER_ID` ต้องคงที่ตลอด
- `KAFKA_ADVERTISED_LISTENERS` คือที่อยู่ที่ client ใช้ต่อ (ต่างจาก LISTENERS)
