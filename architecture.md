# NestJS Clean Template — Project Documentation

## Project Structure

```
nestjs-clean-template/
├── assets/
│   └── config/
│       └── portal-service/
│           └── local.config.yaml      # App config (non-secret)
├── src/
│   ├── common/                        # Shared utilities
│   │   ├── config/config.service.ts   # อ่าน yaml config
│   │   ├── decorators/
│   │   │   ├── custom-http-entry-point.decorator.ts
│   │   │   ├── public.decorator.ts    # @Public() — bypass JWT
│   │   │   └── roles.decorator.ts     # @Roles('admin')
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts          # Basic Auth (เดิม)
│   │   │   ├── jwt-auth.guard.ts      # JWT Guard (ใหม่)
│   │   │   └── roles.guard.ts         # Role Guard (ใหม่)
│   │   ├── interceptors/
│   │   │   ├── custom-rest.interceptor.ts
│   │   │   └── app.interceptor.ts
│   │   ├── logger/
│   │   │   ├── system-logger.service.ts
│   │   │   └── summary-flush.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts        # JWT Strategy (ใหม่)
│   │   ├── utils/
│   │   │   └── response.util.ts       # buildSuccessResponse/buildErrorResponse
│   │   └── index.ts                   # Export ทุกอย่าง
│   ├── database/
│   │   ├── migrations/                # Migration files
│   │   ├── data-source.ts             # TypeORM CLI config
│   │   └── database-registry.module.ts # TypeORM app config
│   ├── modules/
│   │   ├── auth/                      # (ใหม่)
│   │   │   ├── controllers/auth.controller.ts
│   │   │   ├── managers/auth.manager.ts
│   │   │   ├── services/auth.service.ts
│   │   │   ├── dto/auth.dto.ts
│   │   │   └── auth.module.ts
│   │   ├── users/
│   │   │   ├── controllers/user.controller.ts
│   │   │   ├── managers/user.manager.ts
│   │   │   ├── services/user.service.ts
│   │   │   ├── repositories/user.repository.ts
│   │   │   ├── entities/user.entity.ts
│   │   │   ├── dto/user.dto.ts
│   │   │   └── users.module.ts
│   │   └── notification/
│   │       └── entities/notification.entity.ts
│   └── app.module.ts
├── .env.example                       # Template env
├── .env.development.local             # Local env (ไม่ commit)
├── docker-compose.yml
└── package.json
```

---

## Pattern หลักของโปรเจกต์

```
Request → Controller → Manager → Service → Repository → Database
```

| Layer      | หน้าที่                          |
| ---------- | -------------------------------- |
| Controller | รับ request, ส่งต่อ Manager      |
| Manager    | จัดการ try/catch, build response |
| Service    | Business logic                   |
| Repository | Database queries                 |

---

## Response Format

```typescript
// Success
{
  resultCode: '20000',
  resultDescription: 'Success',
  developerMessage: '',
  data: { ... }
}

// Error
{
  resultCode: '40400',
  resultDescription: 'Error',
  developerMessage: 'User not found',
  data: { message: '...', messageList: [] }
}
```

### Result Codes

| Code  | ความหมาย       |
| ----- | -------------- |
| 20000 | Success        |
| 20100 | Created        |
| 40000 | Bad Request    |
| 40100 | Unauthorized   |
| 40400 | Not Found      |
| 50000 | Internal Error |

---

## Auth Flow

```
POST /auth/register → สร้าง user + return JWT
POST /auth/login    → login + return JWT

Authorization: Bearer <token>  ← ใส่ใน header ทุก request
```

### Role Guard

```typescript
@Roles('admin')   // เฉพาะ admin
@Roles('user')    // เฉพาะ user
// ไม่ใส่ = ทุก role เข้าได้ (แต่ต้อง login)

@Public()         // ไม่ต้อง login เลย
```

---

## Environment Variables

```env
# App
ZONE=local
PORT=31000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=nestjs_clean_template
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password
DATABASE_URL=postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}

# Connection Pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=1d

# Basic Auth (เดิม)
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=your_secret_password
```

---

## Commands ที่ใช้บ่อย

```bash
# Dev
npm run start:local

# Build
npm run build

# Migration
npm run migration:generate --name=CreateUserTable
npm run migration:run
npm run migration:revert

# Test
npm run test
npm run test:cov
npm run test:e2e

# Lint & Format
npm run lint
npm run format

# TypeScript check
npm run typecheck
```

---

## Docker

```bash
# Start services (postgres, kafka)
docker-compose up -d

# Stop
docker-compose down

# Clean up ทุก 1-2 อาทิตย์
docker system prune -a
```

---

## WSL Maintenance

```bash
# เคลียร์ cache
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# อัพเดท Linux
sudo apt update && sudo apt upgrade -y && sudo apt autoremove -y
```

---

## ไฟล์ที่ยังต้อง Implement

```
⏳ src/modules/auth/auth.module.ts
⏳ src/modules/auth/controllers/auth.controller.ts
⏳ src/modules/auth/managers/auth.manager.ts
⏳ src/modules/auth/services/auth.service.ts
⏳ src/modules/auth/dto/auth.dto.ts
⏳ src/common/strategies/jwt.strategy.ts
⏳ src/common/guards/jwt-auth.guard.ts
⏳ src/common/guards/roles.guard.ts
⏳ src/common/decorators/public.decorator.ts
⏳ src/common/decorators/roles.decorator.ts
⏳ แก้ user.entity.ts → เพิ่ม firstName, lastName, password, role, isActive, deletedAt
⏳ แก้ user.dto.ts → เพิ่ม firstName, lastName, password
⏳ แก้ user.repository.ts → เพิ่ม findByEmailWithPassword
⏳ แก้ user.controller.ts → เปลี่ยนเป็น JwtAuthGuard + RolesGuard
⏳ แก้ common/index.ts → export ไฟล์ใหม่
⏳ เพิ่ม JWT_SECRET ใน .env.example
```

---

## Dependencies ที่ต้องติดตั้ง

```bash
npm install bcrypt @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/bcrypt @types/passport-jwt
```

---

## Database Config (database-registry.module.ts)

```typescript
TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432'),
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database: process.env.DATABASE_NAME ?? 'nestjs_clean_template',
    entities: [UserEntity, NotificationEntity],
    migrations: ['dist/database/migrations/*.js'],
    migrationsRun: false,
    migrationsTableName: 'migrations',
    extra: {
      min: parseInt(process.env.DATABASE_POOL_MIN ?? '2'),
      max: parseInt(process.env.DATABASE_POOL_MAX ?? '10'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    synchronize: process.env.ZONE === 'local',
    logging: process.env.ZONE === 'local',
    ssl: process.env.ZONE === 'production'
      ? { rejectUnauthorized: false }
      : false,
  }),
}),
```

---

## Tech Stack

| ประเภท        | เทคโนโลยี         |
| ------------- | ----------------- |
| Framework     | NestJS 11         |
| Language      | TypeScript 5      |
| Database      | PostgreSQL        |
| ORM           | TypeORM 1.1.1     |
| Auth          | JWT + Passport    |
| Message Queue | Kafka (KafkaJS)   |
| Validation    | class-validator   |
| Config        | js-yaml + dotenv  |
| Testing       | Jest              |
| Linting       | ESLint + Prettier |
