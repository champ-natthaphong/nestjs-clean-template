# NestJS Microservice Starter

A clean, opinionated NestJS 11 starter for building REST + Kafka microservices with a strict layered architecture, structured logging, and production-ready defaults.

![Node](https://img.shields.io/badge/node-%3E%3D24-green) ![NestJS](https://img.shields.io/badge/NestJS-11-red) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Layered architecture** — Controller → Manager → Service → Repository
- **REST + Kafka consumer** in the same codebase (Confluent KafkaJS, KRaft mode, no Zookeeper)
- **PostgreSQL + TypeORM** with migrations and seed scripts
- **Auth** — JWT / Passport + bcrypt, Basic Auth guard for internal endpoints
- **Security** — Helmet, `@nestjs/throttler` rate limiting, global validation pipe
- **Observability** — structured logger, request ID, HTTP/Kafka entry-point logging, health checks
- **Swagger** API docs
- **Graceful shutdown** (SIGTERM / SIGINT)
- **Quality tooling** — Jest (unit + e2e), ESLint, Prettier, Husky, commitlint
- **Docker Compose** for local infra (PostgreSQL, Kafka, Kafka UI)

## Documentation

Read in this order:

| #   | Document                                       | Contents                                                           | Audience              |
| --- | ---------------------------------------------- | ------------------------------------------------------------------ | --------------------- |
| 1   | **README.md** (this file)                      | Quick start, architecture, project overview                        | Everyone              |
| 2   | [CODING_GUIDELINES.md](CODING_GUIDELINES.md)   | ESLint rules, naming conventions, commit convention, layer pattern | Developers            |
| 3   | [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) | Unit / integration / e2e strategy, mock patterns, test naming      | Developers            |
| 4   | [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md) | Trunk-based development, release tags, hotfix flow, feature flags  | Developers / Leads    |
| 5   | [AI_RULES.md](AI_RULES.md)                     | Rules for AI coding assistants (Claude Code, Cursor, Copilot)      | Developers / AI tools |

## Quick Start

### Prerequisites

- Node.js >= 24
- Docker & Docker Compose

### Setup

```bash
git clone https://github.com/champ-natthaphong/nestjs-clean-template.git
cd nestjs-clean-template

npm install
cp .env.example .env      # adjust values as needed

docker-compose up -d      # PostgreSQL, Kafka, Kafka UI
npm run migration:run
npm run start:dev
```

| Service      | URL / Port                                           |
| ------------ | ---------------------------------------------------- |
| API          | http://localhost:31000/api/v1                        |
| Swagger      | http://localhost:31000/docs (only when `ZONE=local`) |
| Health check | http://localhost:3001                                |
| Kafka UI     | http://localhost:9333                                |

> Ports come from `.env` (`PORT`, `HEALTH_CHECK_PORT`).

## Architecture

```
Controller  →  Manager  →  Service  →  Repository
```

| Layer          | Responsibility                                            |
| -------------- | --------------------------------------------------------- |
| **Controller** | Routing, guards, interceptors. **No business logic.**     |
| **Manager**    | Orchestration, try/catch, logging flush, unified response |
| **Service**    | Pure business logic (no `Request` / `Response`)           |
| **Repository** | Database access                                           |

The same pattern applies to REST handlers and Kafka consumers — only the Controller layer differs.

### Example: REST

```typescript
@Controller('notifications')
@UseGuards(AuthGuard)
@UseInterceptors(CustomRestInterceptor)
export class NotificationController {
  constructor(private readonly manager: NotificationManager) {}

  @CustomHttpEntryPoint('getNotifications')
  @Get('user/:userId')
  async getByUser(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleGetByUser(req, res);
  }
}
```

### Example: Kafka consumer

```typescript
@Controller()
@UseInterceptors(AppInterceptor)
export class NotificationConsumer {
  constructor(private readonly manager: NotificationManager) {}

  @EntryPoint(CONSUMER_TOPICS.notificationCreated)
  async handleCreated(@ToObjectDecorator() data: MessageContextDto) {
    await this.manager.handleCreated(data);
  }
}
```

## Project Structure

```
src/
├── main.ts                     # Bootstrap, global pipes/filters, Kafka microservice
├── app.module.ts               # Root module
├── common/                     # Shared building blocks
│   ├── guards/                 # Basic Auth guard
│   ├── interceptors/           # REST + Kafka logging interceptors
│   ├── decorators/             # @CustomHttpEntryPoint, @EntryPoint, @ToObjectDecorator
│   ├── pipes/                  # Validation + sanitizing pipes
│   ├── filters/                # Global exception filter
│   ├── logger/                 # Structured logger
│   ├── health/                 # Health check builder
│   ├── kafka/                  # Custom Confluent KafkaJS transport
│   └── utils/                  # Graceful shutdown, helpers
├── database/                   # TypeORM config, migrations, seeds
└── modules/
    └── notification/           # Example feature module
        ├── controllers/
        ├── managers/
        ├── services/
        ├── repositories/
        └── dtos/
```

## API Endpoints

Base path: `/api/v1` (global prefix `api` + URI versioning, default version `v1`).

### Auth

| Method | Endpoint                | Description          |
| ------ | ----------------------- | -------------------- |
| `POST` | `/api/v1/auth/register` | Register a user      |
| `POST` | `/api/v1/auth/login`    | Log in               |
| `POST` | `/api/v1/auth/refresh`  | Refresh access token |
| `POST` | `/api/v1/auth/logout`   | Log out              |

### Users

| Method   | Endpoint                          | Description                 |
| -------- | --------------------------------- | --------------------------- |
| `GET`    | `/api/v1/users`                   | List users                  |
| `GET`    | `/api/v1/users/:id`               | Get a user                  |
| `GET`    | `/api/v1/users/:id/notifications` | List a user's notifications |
| `POST`   | `/api/v1/users`                   | Create a user               |
| `PUT`    | `/api/v1/users/:id`               | Update a user               |
| `DELETE` | `/api/v1/users/:id`               | Delete a user               |

### Notifications

| Method   | Endpoint                                      | Description             |
| -------- | --------------------------------------------- | ----------------------- |
| `GET`    | `/api/v1/notifications/user/:userId`          | List user notifications |
| `GET`    | `/api/v1/notifications/user/:userId/unread`   | List unread             |
| `POST`   | `/api/v1/notifications`                       | Create a notification   |
| `PATCH`  | `/api/v1/notifications/:id/read`              | Mark as read            |
| `PATCH`  | `/api/v1/notifications/user/:userId/read-all` | Mark all as read        |
| `DELETE` | `/api/v1/notifications/:id`                   | Delete a notification   |

The notification module also consumes Kafka events to create notifications asynchronously.

## Configuration

Environment variables live in `.env` (copy from `.env.example`). Non-secret settings (Kafka topics, log levels, throttling, feature flags) live in `assets/config/local.config.yaml`.

| Variable                                                                                    | Description                                 |
| ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `PORT`                                                                                      | HTTP port (default `31000`)                 |
| `HEALTH_CHECK_PORT`                                                                         | Health check port (`3001`)                  |
| `ZONE`                                                                                      | Set to `local` to enable Swagger at `/docs` |
| `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_USER` / `DATABASE_PASSWORD` / `DATABASE_NAME` | PostgreSQL connection                       |
| `DATABASE_URL`                                                                              | Built from the values above                 |

See `.env.example` for the full list (JWT, Kafka, Basic Auth).

> Never commit real secrets. Only commit `.env.example` with dummy values.

## Scripts

| Command                      | Description                     |
| ---------------------------- | ------------------------------- |
| `npm run start:dev`          | Dev mode with watch             |
| `npm run build`              | Production build                |
| `npm run start:prod:migrate` | Run migrations, then start prod |
| `npm run migration:generate` | Generate a migration            |
| `npm run migration:run`      | Apply migrations                |
| `npm run migration:revert`   | Revert last migration           |
| `npm run seed`               | Seed the database               |
| `npm run lint`               | Lint + auto fix                 |
| `npm run format`             | Format code                     |
| `npm test`                   | Unit tests                      |
| `npm run test:e2e`           | E2E tests                       |
| `npm run test:cov`           | Coverage                        |

## Adding a New Feature Module

1. Create `src/modules/<name>/` with `controllers`, `managers`, `services`, `repositories`, `dtos`.
2. Register the module in `src/modules/modules.module.ts`.
3. For Kafka: add the topic to config, expose it in `CONSUMER_TOPICS` / `PRODUCER_TOPICS`, then use `@EntryPoint(...)`.
4. Generate a migration if you added entities: `npm run migration:generate`.

## Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/), enforced by Husky + commitlint.

```bash
git commit -m "feat(notification): add mark-all-read endpoint"
git commit -m "fix(kafka): handle consumer reconnect"
```

## License

[MIT](LICENSE) © Natthaphong Thammabut
