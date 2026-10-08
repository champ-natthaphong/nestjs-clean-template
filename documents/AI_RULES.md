# AI Rules

Rules for AI coding assistants (Claude Code, Cursor, Copilot, etc.) working in this repository.

> Canonical source. If you also keep `CLAUDE.md`, `.cursorrules` or `.github/copilot-instructions.md`, keep them identical to this file (only the header differs), and update all of them together.

You are an expert NestJS / Node.js backend developer. When writing, generating, or refactoring code in this repository, follow the rules below.

## Reference docs

| Doc                                            | Read when                                               |
| ---------------------------------------------- | ------------------------------------------------------- |
| [README.md](README.md)                         | Setting up locally, project overview                    |
| [CODING_GUIDELINES.md](CODING_GUIDELINES.md)   | ESLint rules, naming, commit convention, layer examples |
| [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) | Writing unit / integration / e2e tests                  |
| [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md) | Branches, tags, releases, hotfixes, feature flags       |

## 0. Project context

- NestJS 11, TypeScript, Node.js >= 24.
- REST and Kafka consumers live in the same app.
- Database: PostgreSQL with TypeORM. Schema changes go through migrations.
- Shared building blocks (guards, interceptors, filters, pipes, logger, response helpers, Kafka transport) live in `src/common/`. Reuse them; do not duplicate them inside feature modules.
- Feature code lives in `src/modules/<name>/`.

## 1. Layer pattern (strict)

`Controller → Manager → Service → Repository`

- **Controller**: routing, guards, interceptors, request extraction. No business logic. Always delegate to the Manager.
  - REST: `@UseGuards(AuthGuard)` and `@UseInterceptors(CustomRestInterceptor)` at class level, `@CustomHttpEntryPoint('actionName')` on methods.
  - Kafka: `@UseInterceptors(AppInterceptor)` at class level, `@EntryPoint(topic)` on methods.
- **Manager**: orchestration, try/catch, response formatting.
  - Success: send `buildSuccessResponse(data)`, then flush the summary log once.
  - Error: log the error, then send the unified error response.
- **Service**: pure business logic. Never touches `Request` / `Response`.
- **Repository**: database access only.

See [CODING_GUIDELINES.md](CODING_GUIDELINES.md#4-layer-rules) for code examples.

## 2. API responses

Never return ad-hoc objects. Always use the response helpers in `src/common`.

```typescript
res.status(HttpStatus.OK).json(buildSuccessResponse(data));
res.status(HttpStatus.NOT_FOUND).json(buildErrorResponse(/* code, message, status */));
```

## 3. Error handling

- Services throw; Managers catch.
- The Manager's `catch` always logs the error before responding.
- The global exception filter is a safety net (guards, validation), not a replacement for the Manager's `catch`.

## 4. Logging

- Never use `console.*`. Use the injected logger.
- Never log secrets, tokens, passwords, or full personal data. Mask sensitive fields.

## 5. TypeScript and ESLint

- No `any`. Use a specific type, a generic, or `unknown` with a type guard.
- No unused variables. Prefix intentionally unused params with `_`.
- No floating promises. `await`, or use `void` when fire-and-forget is intentional.
- Keep functions under 150 lines and cyclomatic complexity under 15.

## 5.1 Naming

| Kind       | Rule                            | Example                     |
| ---------- | ------------------------------- | --------------------------- |
| Interface  | `I` prefix                      | `IOrderQuery`               |
| Enum       | `E` prefix                      | `EOrderStatus`              |
| Type alias | `T` prefix                      | `TOrderPayload`             |
| Class      | PascalCase, no prefix           | `OrderService`              |
| Boolean    | `is` / `has` / `can` / `should` | `isActive`, `hasPermission` |

Do not use `flag`, `status`, `check`, `isNotActive`, or `isHasPermission`.

## 6. Database (TypeORM)

- Never edit an applied migration. Create a new one.
- Generate migrations with `npm run migration:generate`; review the SQL before committing.
- Never use `synchronize: true` outside local throwaway setups.
- Put queries in repositories, not in services or controllers.

## 7. Kafka topics

- Topic names come from configuration, never hard-coded in handlers.
- Expose them through the shared constants (`PRODUCER_TOPICS` / `CONSUMER_TOPICS`) and use those constants in `@EntryPoint(...)` and producers.
- Validate required topics at startup so a missing one fails fast.

## 8. Configuration and secrets

- All secrets come from environment variables. Never commit real values.
- Every new variable is added to `.env.example` with a dummy value and documented in the README.
- Do not add internal hostnames, IP addresses or real credentials anywhere in the repo.

## 9. Tests

When you add or change a Service, Manager or Controller, add or update its test. Follow [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md):

- Unit: `test/unit/<mirrors src path>/<class>.spec.ts`, mock all dependencies.
- Integration: `test/integration/<domain>.integration-spec.ts`, real PostgreSQL, mock Kafka and external HTTP.
- E2E: `test/e2e/<domain>.e2e-spec.ts`, real HTTP via `supertest`, override the auth guard.
- `describe` uses the class or method name; `it` starts with `should`.

## 10. Git, commits and releases

- Conventional Commits, enforced by commitlint (`feat(scope): subject`).
- Trunk-based: branch from `main`, merge by PR. See [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md).
- Never bump `version` in `package.json` by hand; use `npm run release`.
- Never force-push to `main`.

## 11. Boundaries for the AI

- Do not add new dependencies without saying why.
- Do not rewrite or reformat unrelated files.
- Do not weaken lint, type or test rules to make a change pass.
- Do not invent APIs of project code; read the file first.

## Pre-flight checklist

Before finishing a change, verify:

1. Layers respected: Controller delegates, Manager has try/catch, Service has no HTTP types.
2. Response helpers used for every HTTP response.
3. Manager logs errors before responding.
4. Naming correct (`I` / `E` / `T`, affirmative booleans).
5. No `console`, no `any`, no floating promises.
6. Topics and env vars registered in config, constants and `.env.example`.
7. Migration added for any entity change.
8. Tests added or updated at the right level.
9. Lint, format and tests pass.

When a rule and the observed code disagree, ask the user before changing the rule.
