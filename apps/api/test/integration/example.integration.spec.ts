// test/integration/example.integration.spec.ts
// Example integration test demonstrating test support usage
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from '../../src/app.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createMockPrismaService } from '../support/fixtures/prisma.fixture';
import { parentFactory, childProfileFactory } from '../support/factories';
import { testUuid } from '../support/helpers/test-utils';

describe('AppService (Integration Example)', () => {
  let service: AppService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should demonstrate factory usage', () => {
    // Given: test data created via factories
    const parent = parentFactory({
      id: testUuid('1'),
      email: 'integration@test.com',
    });

    const child = childProfileFactory({
      parentId: parent.id,
      displayName: 'Test Child',
      age: 7,
    });

    // Then: factories produce valid data
    expect(parent.email).toBe('integration@test.com');
    expect(child.parentId).toBe(parent.id);
    expect(child.age).toBe(7);
    expect(child.level).toBe('beginner');
  });

  it('should demonstrate mock prisma usage', async () => {
    // Given: mock configured to return factory data
    const parent = parentFactory();
    mockPrisma.parent.findUnique.mockResolvedValue(parent);

    // When: query through mock
    const result = await mockPrisma.parent.findUnique({
      where: { id: parent.id },
    });

    // Then: mock returns factory data
    expect(result).toEqual(parent);
    expect(mockPrisma.parent.findUnique).toHaveBeenCalledWith({
      where: { id: parent.id },
    });
  });
});
