# Testing Guidelines

Three levels of tests: unit, integration, and e2e.

## 1. Test pyramid

```
      E2E          few, full HTTP flow
   Integration     some, service + real database
      Unit         many, isolated logic
```

| Level       | Real                              | Mocked                           | Speed     |
| ----------- | --------------------------------- | -------------------------------- | --------- |
| Unit        | The class under test              | All dependencies                 | Very fast |
| Integration | Service + Repository + PostgreSQL | Kafka, external HTTP             | Fast      |
| E2E         | Controller → Manager → Service    | Repository, Kafka, external HTTP | Slowest   |

## 2. File layout

```
test/
├── unit/                    mirrors src/
│   └── modules/notification/services/notification.service.spec.ts
├── integration/
│   └── notification.integration-spec.ts
├── e2e/
│   └── notification.e2e-spec.ts
└── jest-e2e.json
```

| Type        | File name                      |
| ----------- | ------------------------------ |
| Unit        | `<class>.spec.ts`              |
| Integration | `<domain>.integration-spec.ts` |
| E2E         | `<domain>.e2e-spec.ts`         |

## 3. Unit tests

Every Service and Manager has unit tests. Mock every dependency.

```typescript
describe('NotificationService', () => {
  let service: NotificationService;

  const mockRepo = { findByUser: jest.fn(), create: jest.fn() };
  const mockLogger = { info: jest.fn(), error: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationRepository, useValue: mockRepo },
        { provide: SystemLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get(NotificationService);
    jest.clearAllMocks();
  });

  describe('getByUser', () => {
    it('should return the user notifications', async () => {
      mockRepo.findByUser.mockResolvedValue([{ id: '1' }]);

      const result = await service.getByUser('u1');

      expect(result).toEqual([{ id: '1' }]);
    });

    it('should propagate repository errors', async () => {
      mockRepo.findByUser.mockRejectedValue(new Error('DB error'));

      await expect(service.getByUser('u1')).rejects.toThrow('DB error');
    });
  });
});
```

Cases to cover: happy path, error path, not found, and side effects (for example, a Kafka producer was called).

## 4. Integration tests

Write them when a query is non-trivial or when Service and Repository must be verified together. Use a real PostgreSQL instance (Testcontainers, or a dedicated database from `docker-compose`) and mock only external systems.

```typescript
beforeAll(async () => {
  module = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot(testDataSourceOptions),
      TypeOrmModule.forFeature([Notification]),
    ],
    providers: [NotificationService, NotificationRepository],
  }).compile();
});

beforeEach(async () => {
  await dataSource.query('TRUNCATE TABLE notifications RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await module.close();
});
```

Always reset database state between tests so tests never depend on each other.

## 5. E2E tests

Every Controller has e2e coverage through real HTTP (`supertest`).

```typescript
const moduleFixture = await Test.createTestingModule({
  controllers: [NotificationController],
  providers: [
    NotificationManager,
    NotificationService,
    { provide: NotificationRepository, useValue: mockRepo },
  ],
})
  .overrideGuard(AuthGuard)
  .useValue({ canActivate: () => true })
  .compile();

app = moduleFixture.createNestApplication();
await app.init();

const res = await request(app.getHttpServer()).get('/notifications/user/u1');
expect(res.status).toBe(200);
```

Remember:

- Override the auth guard, otherwise every request is a 401.
- Override or provide anything the interceptors need.
- Keep the `moduleNameMapper` for path aliases in `test/jest-e2e.json`.

## 6. Mock strategy

| Layer                   | Unit | Integration | E2E      |
| ----------------------- | ---- | ----------- | -------- |
| Controller              | –    | –           | real     |
| Manager                 | real | –           | real     |
| Service                 | real | real        | real     |
| Repository              | mock | real        | mock     |
| PostgreSQL              | –    | real        | –        |
| Kafka producer/consumer | mock | mock        | mock     |
| External HTTP           | mock | mock        | mock     |
| Logger                  | mock | mock        | mock     |
| Auth guard              | –    | –           | override |

## 7. Naming

- `describe` uses the class or method name.
- `it` starts with `should`.

```typescript
describe('NotificationService', () => {
  describe('markAsRead', () => {
    it('should mark the notification as read', ...);
    it('should throw NotFoundException when it does not exist', ...);
  });
});
```

## 8. Commands

```bash
npm test               # unit
npm run test:e2e       # e2e
npm run test:cov       # coverage
npx jest --watch test/unit
```

## 9. Do and don't

Do:

- Call `jest.clearAllMocks()` in `beforeEach`.
- Mock only the methods you use.
- Separate arrange / act / assert.
- Use `mockResolvedValue` / `mockRejectedValue` for async code.
- Use `expect.objectContaining` for partial matches.

Don't:

- Write tests that depend on execution order.
- Assert on implementation details (call counts) unless that is the behavior.
- Use `any`; use `as unknown as Type`.
- Leave `it.skip` / `xit` without a reason.
- Write tests with no assertion, or leave `console.log` in tests.
