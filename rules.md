# AI Rules — `@entronica/usb-be-template-module`

> **Canonical source.** `.cursorrules` and `.github/copilot-instructions.md` mirror this file verbatim — only the header differs. Update all three together when these rules change.
> If you use an AI tool that doesn't auto-load `.cursorrules` or `copilot-instructions.md`, paste this entire file into the system prompt.

---

You are an expert NestJS / Node.js backend developer. When writing, generating, or refactoring code in **this repository — a `usb-be-*` module that gets plugged into `usb-be-app-mychannel`** — strictly follow the rules below.

## Reference docs in this repo

| Doc                                            | Read when…                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| [README.md](README.md)                         | Setting up locally, creating a new module from this template, releasing |
| [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md) | Anything involving branches, tags, hotfixes, feature flags              |
| [CODING_GUIDELINES.md](CODING_GUIDELINES.md)   | ESLint rules in detail, commit convention, layer-pattern code examples  |
| [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) | Writing unit / integration / E2E tests — mock templates, test layout    |

---

## 0. Repo context (read first)

This repo is a **module**, not a standalone microservice. It is one of ~16 modules consumed by `usb-be-app-mychannel`.

- **Two module layers exist:**
  - `usb-be-cache-module-tmf{XXX}-{name}` — cache/data layer following TMF Open API specs (e.g. tmf629 customer, tmf666 account, tmf720 digital identity).
  - `usb-be-experience-module-{name}` — orchestration / UX flow (e.g. taxonomy, package-changing, product-recommendation).
- **Dual-mode runtime:**
  - **Standalone** — `src/main.ts` boots Nest + Kafka + healthcheck. Used for local dev and tests.
  - **Embedded (production)** — `dist/app.module.ts` is imported by `usb-be-app-mychannel`'s `import-module.utils.ts`. The aggregator boots Nest **once**; this module's `main.ts` is dead code in this mode.
- **Distribution:** published to GitHub Packages as `@entronica/usb-be-*-module-*`. The aggregator pins **exact versions** (no semver ranges).
- **Activation:** controlled by `FEATURE_MODULE_*_ENABLE` env vars in the aggregator. A module can be installed but inactive.

When generating code, this means:

- Anything wired into `app.module.ts` MUST work both standalone and embedded.
- Don't create per-module HTTP server bootstrap logic outside `main.ts` — the aggregator owns the HTTP server in production.
- Prefer DI-scoped state over module-level singletons that assume a single Nest app context.

---

## 1. Layer pattern (strictly enforced)

`Controller → Manager → Service → Repository / ExternalService / Producer`

- **Controller** — routing, guards, interceptors, DTO extraction. **No business logic.** Always delegate to the Manager.
  - Use `@Controller('')` (empty prefix) and put the full path in the method decorator (`@Post('api/v1/order')`). Per-module URL namespacing is the dev's responsibility — there is no framework-level prefix.
  - REST: `@UseGuards(AuthGuard)` + `@UseInterceptors(CustomRestInterceptor)` at class level, `@CustomHttpEntryPoint('actionName')` on methods.
  - Kafka: `@UseInterceptors(AppInterceptor)` at class level, `@EntryPoint(CONSUMER_TOPICS.xxx)` + `@UsePipes(new RemoveAtSymbolPipe())` on methods.
- **Manager** — orchestrates services, owns try/catch, formats responses.
  - **Success:** `res.json(buildSuccessResponse(data))` then `this.summaryFlush.flush()` exactly once.
  - **Error:** `this.summaryFlush.flushError(error)` then `this.sendErrorResponse(res, error)` (returns unified JSON via `buildErrorResponse`).
- **Service** — pure business logic. MUST NOT touch HTTP `Request` / `Response`.
- **Repository / ExternalService / Producer** — extends `BaseMongooseRepository`, `BaseExternalService`, or `BaseKafkaProducer` from `@corpais/rat-common-lib`.

See [CODING_GUIDELINES.md §11](CODING_GUIDELINES.md#11-layer-pattern-rules-️) for full code examples.

---

## 2. API response shape (unified)

All HTTP responses go through the wrappers from `@corpais/rat-common-lib`. Never return ad-hoc objects.

| Helper                 | Signature                                                                     |
| ---------------------- | ----------------------------------------------------------------------------- |
| `buildSuccessResponse` | `(data, code? = '20000')` — data first, default code `20000`                  |
| `buildErrorResponse`   | `(resultCode, developerMessage, httpStatus?, messageList?)`                   |
| `buildResultCode`      | `(httpStatus) → TResultCode` — maps HTTP → result code (e.g. `404 → '40400'`) |

```typescript
import {
  buildSuccessResponse,
  buildErrorResponse,
  buildResultCode,
  ResultCodes,
} from '@corpais/rat-common-lib';

// Success
res.status(200).json(buildSuccessResponse(data));
res.status(201).json(buildSuccessResponse(newOrder, ResultCodes.CREATED));

// Error
res.status(404).json(buildErrorResponse(ResultCodes.NOT_FOUND, 'Order not found', 404));
res
  .status(422)
  .json(buildErrorResponse(ResultCodes.VALIDATION_ERROR, 'Invalid', 422, ['name is required']));
```

---

## 3. Error handling

- Errors MUST be caught in the Manager (Guard rejections are the only exception — `AllExceptionsFilter` handles those).
- The Manager's catch block MUST call `this.summaryFlush.flushError(error)` before responding.
- Use `buildResultCode(httpStatus)` to map HTTP status → result code in the unified error response.

---

## 4. Logging — no `console`

- NEVER `console.log` / `console.error` (lint will warn).
- ALWAYS the injected logger:
  ```typescript
  this.logger.info(LoggerAction.APP_LOGIC('Processing order'), data);
  this.logger.error(LoggerAction.FAILED('Order rejected'), error);
  ```
- Mask sensitive data with masking configs:
  ```typescript
  [{ maskingType: MaskingType.msisdn, maskingField: 'phoneNumber' }];
  ```

---

## 5. TypeScript / ESLint

- **No `any`** — use a specific type, an interface, or `unknown` if truly unknown.
- **No unused vars** — prefix intentionally unused with `_` (e.g. `_context`).
- **No floating promises** — `await` every promise, or prefix with `void` if fire-and-forget is intentional.

---

## 6. Naming conventions

| Kind       | Rule                                                                      | Example                                |
| ---------- | ------------------------------------------------------------------------- | -------------------------------------- |
| Interface  | `I` prefix, PascalCase                                                    | `IOrderEntity`                         |
| Enum       | `E` prefix, PascalCase                                                    | `EOrderStatus`                         |
| Type alias | `T` prefix, PascalCase                                                    | `TResultCode`                          |
| Class      | PascalCase, no prefix                                                     | `OrderService`                         |
| Boolean    | affirmative phrase: `is` / `has` / `can` / `should` / `allow` / `enabled` | `isActive`, `hasPermission`, `canEdit` |

Don't: `status`, `check`, `flag`, `isNotActive`, `isHasPermission`.

---

## 7. Adding Kafka topics or ESB APIs

Both must be declared in **all** YAML config files (every env: local, dev, sit, staging, prod, test) and mapped in their constants file. Startup-time `ConfigValidatorService` will exit the process if anything is missing.

| Adding…          | YAML                                                                         | Constant                                                      |
| ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Producer topic   | `topics.produce.<group>.<key>` in `assets/config/<moduleName>/*.config.yaml` | `PRODUCER_TOPICS` in `src/shared/constants/topics.ts`         |
| Consumer topic   | `topics.consume.<group>.<key>` in YAML                                       | `CONSUMER_TOPICS` in `src/shared/constants/topics.ts`         |
| ESB external API | `api-services.esb.<group>.<endpoint>` (must include `url` + `method`)        | `API_PATHS` in `src/external-services/constants/api-paths.ts` |

---

## 8. Tests

When you add or change a Service, Manager, or Controller, also write/update its test. Follow [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md):

- **Unit** — `test/unit/<mirrors src path>/<class>.spec.ts`. Mock all dependencies.
- **Integration** — `test/integration/<domain>.integration.spec.ts`. Real Mongoose via `MongoMemoryServer`; mock external services.
- **E2E** — `test/e2e/<domain>.e2e-spec.ts`. Real HTTP via `supertest`; override `AuthGuard` and `CustomRestInterceptor`.

Naming: `describe('OrderService', () => describe('createOrder', () => it('should ...', ...)))`.

---

## 9. Module conventions (embedded-mode hygiene)

These rules exist because this module shares a Nest app with ~15 sibling modules inside the aggregator.

### 9.1 Named DB connection — REQUIRED

`DatabaseModule.forRoot` MUST receive `connectionName: DATABASE_CONNECTION_NAME`. The constant lives in `src/shared/constants/database.ts` and its value MUST be unique across all modules.

```typescript
// src/shared/constants/database.ts
export const DATABASE_CONNECTION_NAME = 'taxonomyConnection'; // ← unique per module
```

```typescript
// src/app.module.ts
import { DATABASE_CONNECTION_NAME } from './shared/constants/database';

DatabaseModule.forRoot({
  url: process.env.DATABASE_URL ?? '',
  authType: process.env.DATABASE_AUTH_TYPE ?? '',
  cert: process.env.DATABASE_CERT ?? '',
  dbName: process.env.DATABASE_NAME ?? '',
  connectionName: DATABASE_CONNECTION_NAME, // ← gates collisions in aggregator
});
```

Don't use the default Mongoose connection — sibling modules will trample each other.

### 9.2 Config subdir = functional name

YAML configs live in `assets/config/<moduleName>/`. `<moduleName>` is the _functional_ domain name — usually the trailing segment of the repo name, but not always (`usb-be-experience-module-device-purchase` uses `accessory/`, `shift-management` uses `shift-management-for-payment/`). Pick a name that describes the domain, then use it consistently:

- `src/app.module.ts` → `FrameworkModule.register({ configPath: join(process.cwd(), 'assets', 'config', '<moduleName>') })`
- `src/main.ts` → `join(process.cwd(), 'assets', 'config', '<moduleName>', \`\${zone}.config.yaml\`)`

### 9.3 Kafka transport — 0.5.x shape

Use `CustomServerConfluentKafkaJS` from `@corpais/rat-common-lib` (>= 0.5.0). Connection details (brokers, SASL, SSL) come from `KAFKA_CONSUMER_*` / `KAFKA_PRODUCER_*` env vars; the constructor only takes consumer/producer overrides like `group.id`.

```typescript
// src/main.ts
import { CustomServerConfluentKafkaJS } from '@corpais/rat-common-lib';

const kafkaConf = config['kafka'] as Record<string, Record<string, unknown>>;

app.connectMicroservice<MicroserviceOptions>({
  strategy: new CustomServerConfluentKafkaJS({
    'group.id': kafkaConf.consumer['group-id'] as string,
    'allow.auto.create.topics': kafkaConf.consumer['allow-auto-topic-creation'] as boolean,
  }),
});
```

DO NOT reintroduce the 0.4.x style `new CustomServerConfluentKafka({ options: { client: {...}, consumer: {...} } })` — that API is gone.

### 9.4 DatabaseModule / RedisCacheModule are optional

Many cache modules comment them out in `app.module.ts` because the aggregator doesn't provision per-module databases. Keep them imported only if persistence is genuinely needed — otherwise leave them commented to avoid spurious connection attempts at boot.

### 9.5 Release flow

Bump versions via `npm run release` (release-it). It builds, commits `chore: release v${version}`, tags `v${version}`, and pushes. **It does NOT run `npm publish`** — the CI workflow `npm-publish.yml` does that on push to `main`. Don't add a `npm publish` step to local scripts. Don't bump version manually in `package.json`.

### 9.6 Forking this template — required renames

When a dev clones this template to start a new module, they MUST update:

1. `package.json` — `name` (`@entronica/usb-be-{type}-module-{name}`) and `repository.url`.
2. `src/shared/constants/database.ts` — `DATABASE_CONNECTION_NAME` value.
3. `assets/config/<moduleName>/` — rename the directory.
4. `src/app.module.ts` and `src/main.ts` — update the `<moduleName>` segment in `configPath` / `join(...)`.

If the dev forgets any of these, the module either won't start (config path mismatch) or will collide with siblings in the aggregator (default DB connection).

---

## 10. Plugging into `usb-be-app-mychannel`

Rare for module-internal work, but every new module needs this wiring. Two repos to touch:

### 10.1 `usb-be-app-mychannel` (aggregator code)

- `npm install @entronica/usb-be-{type}-module-{name}@<exact-version>`.
- Add to `src/import-module.utils.ts`:

  ```typescript
  import { AppModule as MyModuleModule } from '@entronica/usb-be-{type}-module-{name}/dist/app.module';

  // append to MODULE_ENTRIES
  { envKey: 'FEATURE_MODULE_{TYPE}_MODULE_{NAME}_ENABLE', module: MyModuleModule },
  ```

- Aggregator pins **exact versions** (e.g. `"0.0.34"`), not ranges.

### 10.2 `helm-usb-be-app-mychannel` (deployment)

Branch model: `develop` = dev env (`dev.config.yaml`), `sit` = sit env (`sit.config.yaml`). Each env needs its own PR off the env branch, named `feature/<moduleName>` or `feature/<moduleName>-sit`.

Each PR adds:

- `assets/config/<moduleName>/<zone>.config.yaml` — the config for that env.
- `values.yaml` — paired entries (alphabetised among siblings):
  ```yaml
  base-chart:
    deployment:
      volumeMounts:
        - name: be-mychannel-config-<moduleName>
          mountPath: /app/assets/config/<moduleName>/<zone>.config.yaml
          subPath: <zone>.config.yaml
      volumes:
        - name: be-mychannel-config-<moduleName>
          configMap:
            name: be-mychannel-config-<moduleName>
  ```

The ConfigMap (`be-mychannel-config-<moduleName>`) is auto-generated by the base-chart helper from the YAML file — DO NOT author a ConfigMap manifest.

---

## Pre-flight checklist

Before emitting code, verify:

1. **Embedded-mode safe** — named DB connection, no app-level singletons that break under aggregator.
2. **Layer respected** — Controller delegates, Manager has try/catch + flush, Service has no HTTP types.
3. **Response wrappers used** — `buildSuccessResponse(data, code?)`, `buildErrorResponse(code, devMsg, status?)`.
4. **Manager logs errors** — `this.summaryFlush.flushError(error)` before sending the response.
5. **Naming correct** — `I` / `E` / `T` prefixes; affirmative-phrase booleans.
6. **No `console`** — injected logger only.
7. **Promises handled** — `await` everywhere, or explicit `void`.
8. **Topics / APIs registered twice** — YAML for every env AND the matching constants file (`PRODUCER_TOPICS` / `CONSUMER_TOPICS` / `API_PATHS`).
9. **Kafka transport on 0.5.x shape** — `CustomServerConfluentKafkaJS` with flat `'group.id'` keys, env-driven brokers.
10. **Test added/updated** — unit test mirrors the file path; mock at the right layer per [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md).

When a rule and observed code disagree, ask the user before changing the rule — drift in this file affects every module forked from the template.
