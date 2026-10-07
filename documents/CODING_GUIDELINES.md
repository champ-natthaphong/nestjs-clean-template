# Coding Guidelines

Rules and conventions for this project. Most are enforced automatically by ESLint, Prettier, Husky and commitlint; the rest are conventions checked in code review.

## Contents

1. [TypeScript & ESLint rules](#1-typescript--eslint-rules)
2. [Naming conventions](#2-naming-conventions)
3. [Boolean naming](#3-boolean-naming)
4. [Layer rules](#4-layer-rules)
5. [API response format](#5-api-response-format)
6. [Error handling](#6-error-handling)
7. [Imports](#7-imports)
8. [Formatting (Prettier)](#8-formatting-prettier)
9. [Commit convention](#9-commit-convention)
10. [Git hooks](#10-git-hooks)

---

## 1. TypeScript & ESLint rules

| Rule                                      | Level      | Guidance                                                       |
| ----------------------------------------- | ---------- | -------------------------------------------------------------- |
| `@typescript-eslint/no-unused-vars`       | error      | Remove dead code. Prefix intentionally unused params with `_`. |
| `@typescript-eslint/no-explicit-any`      | error      | Use real types, generics, or `unknown` + a type guard.         |
| `@typescript-eslint/no-floating-promises` | warn       | `await` every promise, or mark fire-and-forget with `void`.    |
| `no-duplicate-imports`                    | error      | Merge imports from the same module.                            |
| `no-console`                              | warn       | Use the project logger instead.                                |
| `max-lines-per-function`                  | warn (150) | Extract private methods.                                       |
| `complexity`                              | warn (15)  | Prefer early returns and lookup maps over deep nesting.        |

Return types on functions are optional. Add them on public service methods where they help readers.

```typescript
// Bad
async processData(data: any): Promise<any> {
  return data.someField;
}

// Good
async processData(data: CreateExampleDto): Promise<ExampleEntity> {
  return this.repository.create(data);
}

// Good: unknown + guard
handle(data: unknown): void {
  if (isExampleDto(data)) {
    this.processData(data);
  }
}
```

```typescript
// Fire-and-forget on purpose
void this.sendNotification(data);
```

## 2. Naming conventions

| Kind        | Format                       | Example                                   |
| ----------- | ---------------------------- | ----------------------------------------- |
| Class       | `PascalCase`                 | `OrderService`                            |
| Interface   | `PascalCase` with `I` prefix | `IOrderQuery`                             |
| Enum        | `PascalCase` with `E` prefix | `EOrderStatus`                            |
| Type alias  | `PascalCase` with `T` prefix | `TOrderPayload`                           |
| Enum member | `UPPER_CASE`                 | `PENDING`                                 |
| File        | `kebab-case.<kind>.ts`       | `order.service.ts`, `create-order.dto.ts` |

## 3. Boolean naming

Name booleans so they read like a sentence, and prefer positive names.

| Prefix   | Use for               | Examples                |
| -------- | --------------------- | ----------------------- |
| `is`     | state                 | `isActive`, `isDeleted` |
| `has`    | ownership / existence | `hasPermission`         |
| `can`    | capability            | `canEdit`               |
| `should` | decisions             | `shouldRetry`           |

Avoid:

- Vague names: `flag`, `status`, `check`
- Negative names: `isNotActive` (use `!isActive`)
- Doubled prefixes: `isHasPermission`

## 4. Layer rules

```
Controller → Manager → Service → Repository
```

| Layer      | Does                                              | Must not                                    |
| ---------- | ------------------------------------------------- | ------------------------------------------- |
| Controller | Routes, guards, interceptors, delegate to Manager | Contain business logic or call repositories |
| Manager    | try/catch, log flush, build the response          | Contain domain rules                        |
| Service    | Pure business logic                               | Know about `Request` / `Response`           |
| Repository | Database queries                                  | Contain business rules                      |

The same applies to Kafka consumers: only the Controller differs (`@EntryPoint(topic)` instead of an HTTP route).

```typescript
// Controller: delegate only
@Post()
async create(@Req() req: Request, @Res() res: Response): Promise<void> {
  await this.manager.handleCreate(req, res);
}

// Manager: orchestrate + respond
async handleCreate(req: Request, res: Response): Promise<void> {
  try {
    const result = await this.service.create(req.body);
    res.status(HttpStatus.CREATED).json(buildSuccessResponse(result));
    this.summaryFlush.flush();
  } catch (error) {
    this.summaryFlush.flushError(error);
    this.sendErrorResponse(res, error);
  }
}

// Service: data in, data out
async create(data: CreateExampleDto): Promise<ExampleEntity> {
  return this.repository.create(data);
}
```

Every controller uses the auth guard and the request interceptor:

```typescript
@Controller('orders')
@UseGuards(AuthGuard)
@UseInterceptors(CustomRestInterceptor)
export class OrderController {}
```

## 5. API response format

Never hand-build response bodies. Always use the response helpers in `src/common`.

```json
// Success
{ "resultCode": "20000", "message": "Success", "data": { } }

// Error
{ "resultCode": "40400", "message": "Resource not found", "data": null }
```

> Adjust the field names above to match your own `buildSuccessResponse` / `buildErrorResponse` helpers.

## 6. Error handling

- Services throw (typically Nest `HttpException` subclasses). They never catch just to log.
- Managers catch, flush the structured log, and return the unified error response.
- The global exception filter is a safety net for anything that escapes (guard rejections, validation errors). It is not a substitute for the Manager's `catch`.

```
Guard rejection  → global exception filter → unified 401
Service throws   → Manager catch → flushError + error response
```

## 7. Imports

Order: Nest core → project common lib → third-party → relative.

```typescript
import { Injectable, HttpStatus } from '@nestjs/common';

import { buildSuccessResponse } from 'src/common';

import { Request, Response } from 'express';

import { ExampleService } from '../services/example.service';
```

## 8. Formatting (Prettier)

| Option          | Value  |
| --------------- | ------ |
| `singleQuote`   | `true` |
| `trailingComma` | `all`  |
| `printWidth`    | `100`  |
| `tabWidth`      | `2`    |
| `semi`          | `true` |
| `endOfLine`     | `lf`   |

```bash
npm run format        # write
npm run format:check  # CI
```

## 9. Commit convention

[Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint:

```
<type>(scope): <subject>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
Subject max 100 characters, type in lowercase.

```bash
git commit -m "feat(notification): add mark-all-read endpoint"   # ok
git commit -m "update code"                                      # rejected
```

## 10. Git hooks

Husky installs automatically on `npm install` (via the `prepare` script).

| Hook         | Runs          |
| ------------ | ------------- |
| `pre-commit` | format + lint |
| `commit-msg` | commitlint    |

## Editor setup

Recommended VS Code extensions: Prettier, ESLint, Error Lens, Jest, YAML, DotENV. Enable format-on-save and `source.fixAll.eslint` in `.vscode/settings.json`.
