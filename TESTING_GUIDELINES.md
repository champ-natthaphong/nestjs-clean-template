# Testing Guidelines — rat Services

> คู่มือการเขียน test สำหรับทีม, แบ่งเป็น 3 ระดับ: Unit → Integration → E2E

## สารบัญ

| #   | หัวข้อ                                    |
| --- | ----------------------------------------- |
| 1   | [Test Pyramid](#1-test-pyramid)           |
| 2   | [โครงสร้างไฟล์](#2-โครงสร้างไฟล์)         |
| 3   | [Unit Test](#3-unit-test)                 |
| 4   | [Integration Test](#4-integration-test)   |
| 5   | [E2E Test](#5-e2e-test)                   |
| 6   | [Mock Strategy](#6-mock-strategy)         |
| 7   | [Naming Convention](#7-naming-convention) |
| 8   | [คำสั่ง Run](#8-คำสั่ง-run)               |
| 9   | [Do's & Don'ts](#9-dos--donts)            |

---

## 1. Test Pyramid

```
        ┌─────────┐
        │   E2E   │   ← น้อยสุด, ทดสอบ HTTP ครบ flow
        ├─────────┤
        │  Integ  │   ← กลาง, ทดสอบ service + real DB
        ├─────────┤
        │  Unit   │   ← มากสุด, ทดสอบ logic ย่อย
        └─────────┘
```

| Level           | Mock อะไร                   | ทดสอบอะไร                                     | ความเร็ว   |
| --------------- | --------------------------- | --------------------------------------------- | ---------- |
| **Unit**        | ทุก dependency              | Business logic ใน service/manager             | ⚡ เร็วมาก |
| **Integration** | เฉพาะ external (ESB, Cache) | Service → Repository → MongoDB                | ⚡ เร็ว    |
| **E2E**         | เฉพาะ external (ESB, Cache) | HTTP Request → Controller → Manager → Service | 🐢 ช้าสุด  |

---

## 2. โครงสร้างไฟล์

```
test/
├── unit/                              ← Unit tests
│   ├── shared/                        (matches src/shared/)
│   │   ├── constants/
│   │   │   └── topics.spec.ts
│   │   └── utils/
│   │       └── sanitize.spec.ts
│   ├── external-services/             (matches src/external-services/)
│   │   └── constants/
│   │       └── api-paths.spec.ts
│   └── modules/
│       └── order/                     (matches src/modules/order/)
│           ├── services/
│           │   └── order.service.spec.ts
│           └── managers/
│               └── order.manager.spec.ts
├── integration/                       ← Integration tests
│   └── order.integration.spec.ts
├── e2e/                               ← E2E tests
│   └── order.e2e-spec.ts
└── jest-e2e.json                      ← Jest config สำหรับ E2E
```

**กฎ:**

- Unit test → วางตาม path ของ source file (`test/unit/modules/order/services/`)
- Integration test → วางที่ `test/integration/` ตั้งชื่อ `<domain>.integration.spec.ts`
- E2E test → วางที่ `test/e2e/` ตั้งชื่อ `<domain>.e2e-spec.ts`

---

## 3. Unit Test

### เมื่อไหร่ต้องเขียน

ทุก **Service** และ **Manager** ต้องมี unit test

### โครงสร้าง

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '@src/modules/order/services/order.service';
import { OrderRepository } from '@src/database/order/order.repository';
import {
  BaseCacheService,
  CustomLoggerService,
  MessageContextService,
} from '@corpais/rat-common-lib';
import { EsbAtnService } from '@src/external-services/esb-atn/esb-atn.service';

describe('OrderService', () => {
  let service: OrderService;

  // ─── Mocks ─────────────────────────────────────────────
  const mockOrderRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockCache = { get: jest.fn(), set: jest.fn() };
  const mockEsbAtn = { getSubProfile: jest.fn() };
  const mockLogger = { info: jest.fn(), debug: jest.fn(), error: jest.fn() };
  const mockMessageContext = {
    updateMessageProperties: jest.fn(),
    cloneContextMessage: jest.fn().mockImplementation((data) => data),
  };

  // ─── Setup ─────────────────────────────────────────────
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderRepository, useValue: mockOrderRepo },
        { provide: BaseCacheService, useValue: mockCache },
        { provide: EsbAtnService, useValue: mockEsbAtn },
        { provide: CustomLoggerService, useValue: mockLogger },
        { provide: MessageContextService, useValue: mockMessageContext },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    jest.clearAllMocks();
  });

  // ─── Tests ─────────────────────────────────────────────
  describe('getOrders', () => {
    it('should return all orders', async () => {
      const mockOrders = [{ subscriberId: 'SUB001' }];
      mockOrderRepo.findAll.mockResolvedValue(mockOrders);

      const result = await service.getOrders();

      expect(result).toEqual(mockOrders);
      expect(mockOrderRepo.findAll).toHaveBeenCalled();
    });
  });
});
```

### Pattern สำคัญ

| Pattern    | ตัวอย่าง                                                                      |
| ---------- | ----------------------------------------------------------------------------- |
| Happy path | `mockRepo.findAll.mockResolvedValue(data)`                                    |
| Error path | `mockRepo.create.mockRejectedValue(new Error('DB error'))`                    |
| Exception  | `await expect(service.get('999')).rejects.toThrow(NotFoundException)`         |
| Cache HIT  | `mockCache.get.mockResolvedValue(cached); expect(esb).not.toHaveBeenCalled()` |
| Cache MISS | `mockCache.get.mockResolvedValue(null); expect(esb).toHaveBeenCalled()`       |

---

## 4. Integration Test

### เมื่อไหร่ต้องเขียน

เมื่อมี **MongoDB query** ที่ซับซ้อน หรือต้องทดสอบ **Service + Repository** ทำงานร่วมกัน

### โครงสร้าง

```typescript
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('OrderService (integration)', () => {
  let mongod: MongoMemoryServer;
  let module: TestingModule;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()), // ← real MongoDB
        MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
      ],
      providers: [
        OrderService,
        OrderRepository, // ← real Repository
        { provide: BaseCacheService, useValue: mockCache }, // ← mock external
        { provide: EsbAtnService, useValue: mockEsbAtn },
        // ...
      ],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    await repository['model'].deleteMany({}); // ← ล้าง DB ทุกรอบ
    jest.clearAllMocks();
  });
});
```

### ต่างจาก Unit Test ยังไง

|             | Unit                     | Integration         |
| ----------- | ------------------------ | ------------------- |
| Repository  | `{ findAll: jest.fn() }` | **ตัวจริง**         |
| MongoDB     | ไม่ใช้                   | `MongoMemoryServer` |
| ESB / Cache | mock                     | mock                |
| ความเร็ว    | < 1s                     | 2-3s                |

---

## 5. E2E Test

### เมื่อไหร่ต้องเขียน

ทุก **Controller** ต้องมี E2E test — ทดสอบผ่าน HTTP จริง

### โครงสร้าง

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CustomRestInterceptor, ConfigService, AuthGuard } from '@corpais/rat-common-lib';

describe('Order API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        OrderManager,
        OrderService,
        { provide: OrderRepository, useValue: mockOrderRepo },
        // ... mock ทุก dependency ...
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-token') },
        },
      ],
    })
      // ─── Override framework guards/interceptors ────────
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(CustomRestInterceptor)
      .useValue({
        intercept: (_ctx: unknown, next: { handle: () => unknown }) => next.handle(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Test HTTP endpoints ──────────────────────────────
  it('GET /orders → 200', async () => {
    mockOrderRepo.findAll.mockResolvedValue([]);

    const response = await request(app.getHttpServer()).get('/orders');

    expect(response.status).toBe(200);
  });

  it('POST /orders → 201', async () => {
    mockOrderRepo.create.mockResolvedValue(savedOrder);

    const response = await request(app.getHttpServer())
      .post('/orders')
      .send({ subscriberId: 'SUB001', packageId: 'PKG001' });

    expect(response.status).toBe(201);
  });
});
```

### ⚠️ สิ่งที่ต้องจำ

1. **ต้อง override `AuthGuard`** — ไม่งั้นทุก request จะโดน 401
2. **ต้อง override `CustomRestInterceptor`** — ไม่งั้น `Reflector` จะ resolve ไม่ได้
3. **ต้อง provide `ConfigService`** — เพราะ `AuthGuard` ต้องใช้
4. **jest config อยู่ที่ `test/jest-e2e.json`** — ต้องมี `@src` moduleNameMapper

---

## 6. Mock Strategy

### แต่ละ Layer Mock อะไร

```
Layer             Unit              Integration         E2E
──────────────────────────────────────────────────────────────
Controller        —                 —                   ตัวจริง
Manager           ตัวจริง           —                   ตัวจริง
Service           ตัวจริง           ตัวจริง             ตัวจริง
Repository        mock              ตัวจริง             mock
MongoDB           —                 MongoMemoryServer   —
ESB (HTTP)        mock              mock                mock
ESB (Kafka)       mock              mock                mock
Redis Cache       mock              mock                mock
Logger            mock              mock                mock
AuthGuard         —                 —                   override
Interceptor       —                 —                   override
```

### Mock Templates — ใช้ได้ทุก test

```typescript
// Repository
const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySubscriberId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Cache (Redis)
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

// ESB Service (HTTP)
const mockEsbService = {
  getSubProfile: jest.fn(),
  getPackageDetail: jest.fn(),
};

// ESB Producer (Kafka)
const mockProducer = {
  requestActivateSim: jest.fn(),
};

// Logger
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  setDependencyMetadata: jest.fn().mockReturnThis(),
};

// MessageContext
const mockMessageContext = {
  updateMessageProperties: jest.fn(),
  cloneContextMessage: jest.fn().mockImplementation((data) => data),
  getRawContextMessage: jest.fn().mockReturnValue({}),
};

// FlushSummaryLog (E2E only)
const mockFlush = {
  flush: jest.fn(),
  flushError: jest.fn(),
};
```

---

## 7. Naming Convention

### ไฟล์

| Type        | Pattern                        | Example                     |
| ----------- | ------------------------------ | --------------------------- |
| Unit        | `<class>.spec.ts`              | `order.service.spec.ts`     |
| Integration | `<domain>.integration.spec.ts` | `order.integration.spec.ts` |
| E2E         | `<domain>.e2e-spec.ts`         | `order.e2e-spec.ts`         |

### describe / it

```typescript
// describe ใช้ชื่อ class หรือ method
describe('OrderService', () => {
  describe('createOrder', () => {

    // it ขึ้นต้นด้วย should
    it('should use cached profile on Redis HIT', ...);
    it('should call ESB ATN on Redis MISS', ...);
    it('should throw NotFoundException when not found', ...);
    it('should propagate error when repository fails', ...);
  });
});
```

### Test Cases ที่ควรมี

1. ✅ **Happy path** — input ถูกต้อง response ถูกต้อง
2. ❌ **Error path** — dependency throw error
3. 🚫 **Not found** — data ไม่เจอ
4. 📦 **Cache HIT/MISS** — ถ้ามี caching
5. 🔗 **Side effects** — verify ว่า ESB/Kafka ถูกเรียก

---

## 8. คำสั่ง Run

```bash
# Unit tests
npm run test:unit

# Integration tests (ใช้ MongoMemoryServer)
npm run test:integration

# E2E tests
npm run test:e2e

# ทุก tests
npm run test

# Coverage report
npm run test:cov

# Watch mode (dev)
npx jest --watch --testPathPatterns=test/unit
```

---

## 9. Do's & Don'ts

### ✅ Do

- ทุก `describe` block ขึ้นด้วย class name / method name
- ทุก `it` block ขึ้นต้นด้วย `should`
- `beforeEach` → `jest.clearAllMocks()` ทุกรอบ
- Mock เฉพาะ method ที่ใช้ ไม่ต้อง mock ทุก method ของ class
- ใช้ `expect.objectContaining({})` สำหรับ partial match
- ใช้ `mockResolvedValue` / `mockRejectedValue` สำหรับ async
- แยก Arrange / Act / Assert ชัดเจน
- เพิ่ม comment `// ─── Section ───` แบ่ง block ให้อ่านง่าย

### ❌ Don't

- ❌ อย่าเขียน test ที่ depend กัน (test A ต้องรันก่อน test B)
- ❌ อย่า mock implementation ทั้งหมด — mock เฉพาะ return value
- ❌ อย่า test implementation detail (เช่น เรียก function กี่ครั้ง) ถ้าไม่จำเป็น
- ❌ อย่าใช้ `any` ใน test — ใช้ `as unknown as Type` แทน
- ❌ อย่า skip test (`it.skip` / `xit`) โดยไม่มีเหตุผล
- ❌ อย่าเขียน test ที่ pass เสมอ (no assertion)
- ❌ อย่า `console.log` ใน test — ใช้ `expect` แทน
