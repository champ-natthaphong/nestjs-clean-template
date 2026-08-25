# `@entronica/usb-be-template-module`

> Template scaffold สำหรับสร้าง **usb-be-\* module** ที่จะถูก plug เข้า aggregator app `usb-be-app-mychannel`.
> ทุก usb-be repo (cache module + experience module) clone จาก template นี้แล้ว rename + publish ขึ้น GitHub Packages

powered by `@corpais/eqxjs-stub` + `@corpais/eqxjs-kafka-server-confluent-kafkajs` (ผ่าน `@corpais/rat-common-lib`).

> **Requires Node.js >= 24** (kafka transport ใน `@corpais/rat-common-lib` 0.5.x ใช้ confluent-kafkajs ที่ pin Node 24)

## Dual-mode ของแต่ละ module

| Mode                      | Entrypoint                                                  | ใช้ตอน                                           |
| ------------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| **Standalone**            | `src/main.ts` (full kafka + http + healthcheck)             | Local dev, unit/integration test                 |
| **Embedded** (production) | `dist/app.module.ts` ถูก import เข้า `usb-be-app-mychannel` | Deploy จริง — aggregator boot Nest แค่ครั้งเดียว |

ดังนั้นทุก module:

- ใช้ **named DB connection** (กัน collision ใน aggregator)
- export `AppModule` จาก `app.module.ts` ให้ aggregator import ได้
- ตั้ง `assets/config/<moduleName>/` เป็น subdir per-module

---

## 📚 Reading Order — อ่านตามลำดับนี้

| #   | Document                                       | เนื้อหา                                                                  | เหมาะสำหรับ |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------ | ----------- |
| 1   | **README.md** (ไฟล์นี้)                        | Quick start, setup, project overview                                     | ทุกคน       |
| 2   | [CODING_GUIDELINES.md](CODING_GUIDELINES.md)   | ESLint rules, naming convention, commit convention, layer pattern        | Dev         |
| 3   | [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) | Unit / Integration / E2E test strategy, mock patterns, naming convention | Dev         |
| 4   | [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md) | Trunk-based + release tag, hotfix flow, feature flags                    | Dev / Lead  |

### Shared Libraries

| Library                   | README                                                           | เนื้อหา                                                                                     |
| ------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `@corpais/rat-common-lib` | [README](https://github.com/corpais/new_project_name-common-lib) | Filters, Guards, Interceptors, Base Classes, Kafka (Confluent), Feature Flags (OpenFeature) |

> 💡 **Feature Flags**: ดูวิธีใช้ OpenFeature ที่ [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md#feature-flags-แทน-long-lived-branches)

---

## Quick Start

### 1. Clone และ Install

```bash
git clone <repo-url> my-service
cd my-service

# Setup Git local config (ใช้ชื่อและเมลบริษัท)
git config user.name "Firstname Lastname"
git config user.email "firstname.l@entronica.co.th"
```

### 2. Setup .npmrc (จำเป็น — ต้องทำก่อน npm install)

`@corpais` packages อยู่ที่ **GitHub Package Registry** — ต้องมี `.npmrc` ก่อน install:

```ini
# .npmrc (project root — commit ได้)
registry=https://registry.npmjs.org/
@corpais:registry=https://npm.pkg.github.com
always-auth=true
```

auth token ตั้งค่าแยกที่ `~/.npmrc` (global) หรือใส่ env var:

```bash
# วิธี 1: ใส่ใน ~/.npmrc (global — ไม่ต้อง commit)
echo '//npm.pkg.github.com/:_authToken=<GITHUB_TOKEN>' >> ~/.npmrc

# วิธี 2: ใช้ npm login
npm login --registry=https://npm.pkg.github.com --scope=@corpais
```

> สร้าง token ที่: GitHub → Settings → Developer settings → Personal access tokens (scope: `read:packages`)

### 3. Install Dependencies

```bash
# ตรวจ node version (ต้อง >= 24)
node --version

npm install
```

> 💡 `npm install` จะ install Husky hooks อัตโนมัติ (format + lint + commitlint)

### 4. Setup Environment

```bash
cp .env.example .env
# แก้ค่าตามที่ต้องการ (DATABASE_URL, REDIS_URL, etc.)
```

### 5. Start Local Infra

```bash
docker-compose up -d
```

### 6. Run

```bash
npm run start:local
```

> 💡 เปิด VS Code → กด **Install All** เมื่อ popup แนะนำ extensions

---

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

> **ทำไมถึงมี subdir `portal-service/`?** เพื่อให้ aggregator app (`usb-be-app-mychannel`) ที่รวมหลาย service ในตัวเดียว สามารถ mount config ของแต่ละ child module แยกกันได้ — ดูเป็น pattern ของทุก usb-be repo (`taxonomy/`, `activity-logs-management/`, ฯลฯ). ตอน clone template ไปทำ service ใหม่ ให้ rename `portal-service/` เป็นชื่อ module ของพี่

---

## Key Commands

| Command                    | Description                  |
| -------------------------- | ---------------------------- |
| `npm run start:local`      | Dev mode with watch          |
| `npm run build`            | Build for production         |
| `npm run lint`             | Lint + auto fix              |
| `npm run format`           | Format all code              |
| `npm test`                 | Run unit + integration tests |
| `npm run test:unit`        | Unit tests only              |
| `npm run test:integration` | Integration tests only       |
| `npm run test:e2e`         | E2E tests                    |
| `npm run test:cov`         | Tests with coverage          |

---

## Docker Services

| Service   | Port  | Description                             |
| --------- | ----- | --------------------------------------- |
| MongoDB   | 27017 | Document database                       |
| Kafka     | 9092  | Message broker (KRaft — Confluent)      |
| Kafka UI  | 9333  | [localhost:9333](http://localhost:9333) |
| Redis     | 6379  | Cache & pub/sub                         |
| Jaeger UI | 16686 | OpenTelemetry traces                    |

---

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

---

## Commit Convention

ใช้ [Conventional Commits](https://www.conventionalcommits.org/) — Husky + commitlint enforce อัตโนมัติ

```bash
# ✅ ถูกต้อง
git commit -m "feat(order): add create endpoint"
git commit -m "fix(cache): handle redis timeout"
git commit -m "docs: update README"

# ❌ commitlint จะ reject
git commit -m "update code"
```

| Type       | ใช้เมื่อ           |
| ---------- | ------------------ |
| `feat`     | เพิ่ม feature ใหม่ |
| `fix`      | แก้ bug            |
| `docs`     | เปลี่ยน docs       |
| `refactor` | Refactor code      |
| `chore`    | งาน maintenance    |
| `test`     | เพิ่ม/แก้ test     |

## YAML Configuration Guide

> Topic และ API service ทั้งหมดอ่านจาก YAML config — เพิ่ม/แก้ที่ YAML แล้วใช้ได้เลย

### YAML Config Files

```
assets/config/portal-service/    ← <moduleName>/  (rename ตาม service ตอน clone)
├── local.config.yaml             ← Local dev
├── dev.config.yaml               ← Dev environment
├── staging.config.yaml           ← Staging
├── prod.config.yaml              ← Production
└── test.config.yaml              ← Unit/integration tests
```

> ⚠️ **ต้องเพิ่มทุก environment** — ถ้าขาดจะ exit ตอน startup
> ถ้า rename `portal-service/` → ต้องแก้ `configPath` ใน `src/app.module.ts` + `src/main.ts` ให้ตรงด้วย

---

### เพิ่ม Kafka Topic (Produce)

**Step 1:** เพิ่มใน YAML ทุก environment

```yaml
# assets/config/local.config.yaml
topics:
  produce:
    atn:
      new-registration-request: 'esb.atn.registration.request.v1'
      suspend-sim-request: 'esb.atn.sim.suspend.request.v1' # ← เพิ่ม
```

**Step 2:** เพิ่ม property ใน `src/shared/constants/topics.ts`

```typescript
export const PRODUCER_TOPICS: Record<string, string> = {
  // ATN
  atnNewRegistrationRequest: config.get<string>('topics.produce.atn.new-registration-request'),
  atnSuspendSimRequest: config.get<string>('topics.produce.atn.suspend-sim-request'), // ← เพิ่ม
};
```

**Step 3:** ใช้ใน Producer

```typescript
async requestSuspendSim(data: MessageContextDto): Promise<void> {
  await this.publish(PRODUCER_TOPICS.atnSuspendSimRequest, data);
}
```

> ✅ `ProducersModule` validate ตอน startup ด้วย `validateProducer(PRODUCER_TOPICS)` — ถ้า topic ไม่มีค่าจะ exit

---

### เพิ่ม Kafka Topic (Consume)

**Step 1:** เพิ่มใน YAML ทุก environment

```yaml
topics:
  consume:
    atn:
      suspend-sim-response: 'esb.atn.sim.suspend.response.v1' # ← เพิ่ม
```

**Step 2:** เพิ่ม property ใน `src/shared/constants/topics.ts`

```typescript
export const CONSUMER_TOPICS: Record<string, string> = {
  atnRegistrationResponse: config.get<string>('topics.consume.atn.new-registration-response'),
  atnSuspendSimResponse: config.get<string>('topics.consume.atn.suspend-sim-response'), // ← เพิ่ม
};
```

**Step 3:** ใช้ใน Consumer Controller

```typescript
@EntryPoint(CONSUMER_TOPICS.atnSuspendSimResponse)
@UsePipes(new RemoveAtSymbolPipe())
async handleSuspendSimResponse(
  @ToObjectDecorator() data: MessageContextDto,
) {
  await this.manager.handleSuspendSimResponse(data);
}
```

> ✅ Kafka consumer validate ผ่าน `ConfigValidatorService.validateConsumer(CONSUMER_TOPICS)`

---

### เพิ่ม ESB API Service

**Step 1:** เพิ่มใน YAML (ต้องมี `url` + `method` เสมอ)

```yaml
api-services:
  esb:
    atn:
      suspend-sim: # ← เพิ่ม
        url: http://192.168.30.113:3090/esb/atn/v1/suspend-sim
        method: 'POST'
        timeout: 30000
        reject-unauthorized: false
```

**Step 2:** เพิ่ม config path ใน `src/external-services/constants/api-paths.ts`

```typescript
export const API_PATHS: Record<string, Record<string, string>> = {
  esb: {
    atn_suspend_sim: 'api-services.esb.atn.suspend-sim', // ← เพิ่ม
  },
};
```

**Step 3:** เพิ่ม method ใน ESB Service

```typescript
async suspendSim(data: { subscriberId: string }): Promise<IEsbResponse<unknown>> {
  return this.request<IEsbResponse>(API_PATHS.esb.atn_suspend_sim, { body: data });
}
```

> ✅ `ExternalServicesModule` validate ตอน startup ด้วย `validateExternal(this.config, API_PATHS)` — ต้องมี `url` และ `method` ทุก endpoint

---

### สรุป Checklist

| ทำอะไร                  | Files ที่ต้องแก้                                     |
| ----------------------- | ---------------------------------------------------- |
| **เพิ่ม Produce Topic** | YAML (ทุก env) → `topics.ts` → Producer method       |
| **เพิ่ม Consume Topic** | YAML (ทุก env) → `topics.ts` → Consumer Controller   |
| **เพิ่ม ESB API**       | YAML (ทุก env) → `api-paths.ts` → ESB Service method |

---

## Creating a New Module

> ขั้นตอนสำหรับ dev ตั้ง repo ใหม่จาก template นี้

### 1. Clone template

```bash
git clone https://github.com/corpais/new_project_name-portal-service.git usb-be-experience-module-my-feature
cd usb-be-experience-module-my-feature
# (rebase remote ที่ devops จัดให้หลัง init)
```

### 2. Rename package + scope

แก้ `package.json`:

```json
{
  "name": "@entronica/usb-be-experience-module-my-feature",
  "description": "experience-module-my-feature",
  "repository": {
    "type": "git",
    "url": "https://github.com/entronica/usb-be-experience-module-my-feature.git"
  }
}
```

> ⚠️ **scope ต้องเป็น `@corpais`** เพราะ aggregator (`usb-be-app-mychannel`) import ผ่านชื่อนี้

### 3. Rename DB connection name

แก้ `src/shared/constants/database.ts`:

```ts
export const DATABASE_CONNECTION_NAME = 'myFeatureConnection'; // ← ห้ามชนกับ module อื่นใน aggregator
```

### 4. Rename module config dir

```bash
# rename assets/config/portal-service/ → assets/config/<my-module-name>/
git mv assets/config/portal-service assets/config/my-feature
```

แล้วแก้ `configPath` ใน 2 ไฟล์ให้ตรง:

- `src/app.module.ts` — `configPath: join(process.cwd(), 'assets', 'config', 'my-feature')`
- `src/main.ts` — segment `'portal-service'` ใน `join(...)` → `'my-feature'`

> 💡 subdir name = **functional domain name**, ไม่จำเป็นต้องตรงกับ repo name เป๊ะ
> (`device-purchase` repo → `assets/config/accessory/`, `shift-management` repo → `assets/config/shift-management-for-payment/`)

### 5. Setup local

```bash
# สร้าง ~/.npmrc (ถ้ายังไม่มี) — แก้ <GITHUB_TOKEN>
cp .env.example .env         # แก้ DATABASE_URL, etc.
npm install
```

### 6. Update YAML config

```yaml
# assets/config/my-feature/local.config.yaml
app:
  name: 'my-feature'
  component-name: 'resource.my-feature'
  auth-token: 'local-dev-token'
```

### 7. สร้าง Feature Module

```
src/modules/product/
├── controllers/product.controller.ts
├── managers/product.manager.ts
├── services/product.service.ts
├── dtos/create-product.dto.ts
└── product.module.ts
```

### 8. Register ใน ModulesModule

```typescript
// src/modules/modules.module.ts
@Module({
  imports: [ProductModule],
})
export class ModulesModule {}
```

### 9. Run standalone (local dev)

```bash
npm run start:local
```

### 10. Plug into `usb-be-app-mychannel` (aggregator)

หลัง release version แรกของ module — ต้อง wire เข้า aggregator **2 repo**:

#### 10.1 `usb-be-app-mychannel` (aggregator code)

```bash
cd usb-be-app-mychannel

# 1. install module ตาม version ที่เพิ่ง publish
npm install @entronica/usb-be-experience-module-my-feature@0.0.1
```

แก้ `src/import-module.utils.ts`:

```ts
// เพิ่ม import
import { AppModule as MyFeatureModule } from '@entronica/usb-be-experience-module-my-feature/dist/app.module';

// เพิ่มเข้า MODULE_ENTRIES
const MODULE_ENTRIES: readonly ModuleEntry[] = [
  // ...
  {
    envKey: 'FEATURE_MODULE_EXPERIENCE_MODULE_MY_FEATURE_ENABLE',
    module: MyFeatureModule,
  },
];
```

จากนั้น aggregator dev → push to `develop` (CI build container + bump helm chart) / `sit`

#### 10.2 `helm-usb-be-app-mychannel` (helm chart deployment)

> Helm repo ใช้ **branch-per-env** + **branch-per-module-WIP**:
>
> - `develop` = default branch สำหรับ dev env (ใช้ `dev.config.yaml`)
> - `sit` = sit env branch (ใช้ `sit.config.yaml`)
> - WIP branch: `feature/<my-feature>` (off `develop`), `feature/<my-feature>-sit` (off `sit`)

**ทำซ้ำ 1 รอบต่อ env** (อย่างน้อย dev + sit):

```bash
cd helm-usb-be-app-mychannel

# --- DEV env ---
git checkout develop && git pull
git checkout -b feature/my-feature

# 1. เพิ่ม config file
mkdir -p assets/config/my-feature
cp <ของจาก module ตอน clone> assets/config/my-feature/dev.config.yaml
# แล้ว tweak ค่าตาม dev env (DB url, ESB host, feature flags)

# 2. แก้ values.yaml — เพิ่ม 2 จุด
```

ใน `values.yaml` เพิ่ม (เรียง alphabetical ตาม pattern):

```yaml
base-chart:
  deployment:
    volumeMounts:
      # ... existing entries
      - name: be-mychannel-config-my-feature # ← เพิ่ม
        mountPath: /app/assets/config/my-feature/dev.config.yaml
        subPath: dev.config.yaml

    volumes:
      # ... existing entries
      - name: be-mychannel-config-my-feature # ← เพิ่ม
        configMap:
          name: be-mychannel-config-my-feature
```

```bash
# 3. PR → develop → CI deploy DEV
git push -u origin feature/my-feature
gh pr create --base develop

# --- SIT env (ทำซ้ำ) ---
git checkout sit && git pull
git checkout -b feature/my-feature-sit

# เพิ่ม assets/config/my-feature/sit.config.yaml + values.yaml volumeMounts/volumes
# (mountPath / subPath เปลี่ยนเป็น sit.config.yaml)
git push -u origin feature/my-feature-sit
gh pr create --base sit
```

> 💡 ConfigMap (`be-mychannel-config-<moduleName>`) ถูก generate อัตโนมัติจาก base-chart helper template โดยอ่านจาก `assets/config/<moduleName>/<zone>.config.yaml` — ไม่ต้องสร้าง ConfigMap manifest เอง

#### 10.3 Enable flag ตอน deploy

ใน aggregator's deployment env:

```
FEATURE_MODULE_EXPERIENCE_MODULE_MY_FEATURE_ENABLE=true
```

→ aggregator boot จะ load module เข้า Nest. ถ้า false → module npm install อยู่ แต่ไม่ active

---

## Release Flow

ใช้ `release-it` — bump version + git tag + push (publish ปล่อยให้ CI handle)

```bash
npm run release                  # interactive — เลือก patch/minor/major
npm run release -- --patch       # bug fix
npm run release -- --minor       # new feature (pre-1.0 = breaking ก็ minor ได้)
npm run release -- --major       # post-1.0 breaking
npm run release -- --preRelease=dev  # pre-release (e.g. 0.1.0-dev.0)
```

Flow:

1. `before:init` hook → `npm run build`
2. bump `version` ใน `package.json`
3. commit `chore: release v${version}`
4. tag `v${version}`
5. push commit + tag → main

> `.release-it.json` ตั้ง `"npm": { "publish": false }` — ไม่ให้ release-it ยิง `npm publish` จาก local
> **CI workflow `npm-publish.yml`** (devops จัดให้หลัง init repo) ดัก trigger จาก push to `main` แล้ว publish ขึ้น GitHub Packages เอง — กัน accidental publish จากเครื่อง dev + ใช้ CI token แทน personal token
