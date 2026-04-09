# Test Framework — English Pro API

## Tổng quan

Test framework cho **English Pro API** sử dụng Jest 30 + ts-jest trên NestJS 11 monorepo.

### Cấu trúc thư mục

```
test/
├── .env.test.example          # Biến môi trường mẫu cho tests
├── jest-e2e.json              # Config cho E2E tests
├── jest-integration.json      # Config cho Integration tests
├── jest-acceptance.json       # Config cho Acceptance tests
├── app.e2e-spec.ts            # E2E test mẫu (NestJS default)
│
├── acceptance/                # Story acceptance tests
│   ├── story-1-3/             # Database & Auth setup tests
│   └── story-1-4/             # Common infrastructure tests
│
├── integration/               # Integration tests
│   └── example.integration.spec.ts  # Ví dụ integration test
│
└── support/                   # Test support infrastructure
    ├── index.ts               # Barrel export (import tất cả từ đây)
    ├── jest-setup.ts          # Global Jest setup (timeout, etc.)
    │
    ├── fixtures/              # Test fixtures
    │   ├── index.ts
    │   ├── app.fixture.ts     # NestJS TestingModule fixture
    │   ├── auth.fixture.ts    # JWT token generation & mock guards
    │   └── prisma.fixture.ts  # Mock PrismaService
    │
    ├── factories/             # Data factories
    │   ├── index.ts
    │   ├── parent.factory.ts
    │   ├── child-profile.factory.ts
    │   └── conversation.factory.ts
    │
    └── helpers/               # Test utilities
        ├── index.ts
        ├── test-utils.ts      # UUID gen, date helpers, assertions
        └── database.helper.ts # DB truncate & seed helpers
```

## Thiết lập

### 1. Cài đặt dependencies

Tất cả dependencies test đã có sẵn trong `package.json`:
- `jest` ^30.0.0
- `ts-jest` ^29.2.5
- `supertest` ^7.0.0
- `@nestjs/testing` ^11.0.1
- `@types/jest` ^30.0.0
- `@types/supertest` ^7.0.0

### 2. Cấu hình môi trường test

```bash
cp test/.env.test.example test/.env.test
# Chỉnh sửa test/.env.test theo môi trường local
```

## Chạy Tests

### Unit Tests (src/)
```bash
pnpm test              # Chạy tất cả unit tests
pnpm test:watch        # Watch mode
pnpm test:cov          # Với coverage
```

### Integration Tests (test/integration/)
```bash
pnpm test:integration  # Chạy integration tests
```

### E2E Tests (test/)
```bash
pnpm test:e2e          # Chạy e2e tests
```

### Acceptance Tests (test/acceptance/)
```bash
pnpm test:acceptance           # Tất cả acceptance tests
pnpm test:acceptance:1-3       # Chỉ story 1.3
pnpm test:acceptance:1-4       # Chỉ story 1.4
```

### Tất cả tests
```bash
pnpm test:all          # Unit + Integration + Acceptance
```

### Debug
```bash
pnpm test:debug        # Chạy với --inspect-brk
```

## Architecture Overview

### Fixtures (`test/support/fixtures/`)

Fixtures cung cấp test infrastructure có thể tái sử dụng:

#### `prisma.fixture.ts`
- `createMockPrismaService()` — Mock đầy đủ PrismaService với tất cả models
- Hỗ trợ `$transaction` (cả callback và array mode)
- Mỗi model method (findUnique, create, update, ...) là `jest.fn()`

```typescript
import { createMockPrismaService } from '../support';

const mockPrisma = createMockPrismaService();
mockPrisma.parent.findUnique.mockResolvedValue(parentFactory());
```

#### `app.fixture.ts`
- `createAppFixture()` — Full NestJS app cho e2e testing
- `createTestModule()` — Minimal module cho isolation testing

#### `auth.fixture.ts`
- `createTestToken()` — Generate JWT token cho test requests
- `createParentToken()` / `createChildToken()` — Role-specific tokens
- `createExpiredToken()` — Expired token cho auth rejection tests
- `MockAuthGuard` / `MockRolesGuard` — Bypass guards khi test non-auth logic

### Factories (`test/support/factories/`)

Factories tạo test data với defaults hợp lý:

```typescript
import { parentFactory, childProfileFactory } from '../support';

// Defaults
const parent = parentFactory();

// Custom overrides
const custom = parentFactory({
  email: 'custom@test.com',
  isActive: false,
});

// Batch creation
const parents = parentFactoryMany(5);
```

**Có sẵn:** `parentFactory`, `childProfileFactory`, `conversationScenarioFactory`, `conversationSessionFactory`

### Helpers (`test/support/helpers/`)

#### `test-utils.ts`
- `testUuid(suffix)` — Tạo UUID deterministic cho testing
- `relativeDate(days)` — Tạo date tương đối từ hôm nay
- `delay(ms)` — Async delay (dùng tiết kiệm)
- `stripDynamicFields(obj)` — Bỏ id/createdAt/updatedAt cho snapshot
- `expectSuccessResponse(body)` — Assert API success format
- `expectErrorResponse(body, statusCode)` — Assert API error format

#### `database.helper.ts`
- `truncateAllTables(prisma)` — Xóa sạch data cho integration test cleanup
- `seedTestFamily(prisma)` — Seed parent + child tối thiểu

## Best Practices

### 1. Isolation
- Mỗi test phải độc lập, không phụ thuộc thứ tự chạy
- Dùng `beforeEach` để tạo mock/fixture mới cho mỗi test
- Integration tests: dùng `truncateAllTables()` trong `afterEach`

### 2. Naming Convention
- Unit tests: `*.spec.ts` trong `src/`
- Integration tests: `*.spec.ts` trong `test/integration/`
- E2E tests: `*.e2e-spec.ts` trong `test/`
- Acceptance tests: `*.spec.ts` trong `test/acceptance/story-X-Y/`

### 3. Test Structure (Given/When/Then)
```typescript
it('should return parent by id', async () => {
  // Given: mock data
  const parent = parentFactory({ id: testUuid('1') });
  mockPrisma.parent.findUnique.mockResolvedValue(parent);

  // When: call service
  const result = await service.findById(parent.id);

  // Then: verify result
  expect(result).toEqual(parent);
});
```

### 4. Factory Usage
- Luôn dùng factories thay vì hardcode test data
- Override chỉ các field liên quan đến test case
- Dùng `resetXxxFactory()` trong `beforeEach` nếu cần ID deterministic

### 5. Mock vs Real Database
- **Unit tests**: Luôn dùng `createMockPrismaService()`
- **Integration tests**: Dùng real database với cleanup
- **Acceptance tests**: Tùy yêu cầu story

## CI Integration

### Jest Config cho CI
Các jest config files đều hỗ trợ:
- `transformIgnorePatterns` cho ESM modules (uuid, etc.)
- `moduleNameMapper` cho import aliases
- `setupFiles` cho global setup

### Scripts sẵn sàng cho CI
```yaml
# GitHub Actions example
- run: pnpm --filter english-pro-api test
- run: pnpm --filter english-pro-api test:integration
- run: pnpm --filter english-pro-api test:acceptance
```

## Mở rộng

### Thêm Factory mới
1. Tạo `test/support/factories/your-model.factory.ts`
2. Export từ `test/support/factories/index.ts`
3. Thêm mock model vào `prisma.fixture.ts` nếu là model mới

### Thêm Fixture mới
1. Tạo `test/support/fixtures/your-fixture.ts`
2. Export từ `test/support/fixtures/index.ts`

### Thêm Helper mới
1. Tạo `test/support/helpers/your-helper.ts`
2. Export từ `test/support/helpers/index.ts`
