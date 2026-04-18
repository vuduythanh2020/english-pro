/**
 * RED PHASE — ATDD Scaffold: OpenAiProvider
 * Story 3.1: AI Provider Abstraction Layer & BullMQ Pipeline
 *
 * Tests are skipped (TDD red phase). Activate by removing `x` prefix when implementing.
 * AC covered: AC2 (factory loads correct provider), AC3 (OCP: new adapter only)
 *
 * NOTE: @nestjs/config must be installed first (Task 2.2)
 * NOTE: OpenAiProvider must be created (Task 3.2)
 */
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

// THIS FILE WILL FAIL COMPILATION until OpenAiProvider is implemented
import { OpenAiProvider } from './openai.provider';

const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
};

describe('OpenAiProvider (RED PHASE — AC2, AC3)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let provider: any; // Replace with OpenAiProvider when implemented

    beforeEach(() => {
        // TODO: Replace with actual NestJS test module when OpenAiProvider is implemented:
        // const module = await Test.createTestingModule({
        //   providers: [
        //     OpenAiProvider,
        //     { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('openai') } },
        //     { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
        //   ],
        // }).compile();
        // provider = module.get<OpenAiProvider>(OpenAiProvider);
        void WINSTON_MODULE_NEST_PROVIDER; // keep import used
    });

    afterEach(() => jest.clearAllMocks());

    // --- Interface Compliance (AC3: OCP) ---

    it('[P1] should have correct provider name "openai"', () => {
        // THIS TEST WILL FAIL — OpenAiProvider not implemented yet
        expect(provider.name).toBe('openai');
    });

    it('[P1] should have correct provider type "llm"', () => {
        // THIS TEST WILL FAIL — OpenAiProvider not implemented yet
        expect(provider.type).toBe('llm');
    });

    it('[P1] should implement AiProvider interface with checkHealth method', () => {
        // THIS TEST WILL FAIL — OpenAiProvider not implemented yet
        expect(typeof provider.checkHealth).toBe('function');
    });

    it('[P1] should implement LlmProvider interface with generateResponse method', () => {
        // THIS TEST WILL FAIL — OpenAiProvider not implemented yet
        expect(typeof provider.generateResponse).toBe('function');
    });

    // --- Health Check (AC5 partial) ---

    it('[P1] should return "healthy" status from checkHealth() by default', async () => {
        // THIS TEST WILL FAIL — OpenAiProvider not implemented yet
        const status = await provider.checkHealth();
        expect(status).toBe('healthy');
    });

    it('[P1] should return a valid ProviderHealthStatus value', async () => {
        // THIS TEST WILL FAIL — OpenAiProvider not implemented yet
        const status = await provider.checkHealth();
        expect(['healthy', 'degraded', 'unavailable']).toContain(status);
    });

    // --- generateResponse (AC2) ---

    it('[P1] should return LlmResult with text and metadata', async () => {
        // THIS TEST WILL FAIL — OpenAiProvider not implemented yet
        const messages = [{ role: 'user' as const, content: 'Hello Max!' }];
        const options = { maxTokens: 150, temperature: 0.7 };

        const result = await provider.generateResponse(messages, options);

        expect(result).toMatchObject({
            text: expect.any(String),
            tokensUsed: expect.any(Number),
            model: expect.any(String),
        });
        expect(result.text.length).toBeGreaterThan(0);
    });

    it('[P1] should simulate realistic latency (>= 100ms) per stub requirements', async () => {
        // THIS TEST WILL FAIL — OpenAiProvider not implemented yet
        // Dev Notes: Stubs MUST include configurable latency (await sleep(100))
        const messages = [{ role: 'user' as const, content: 'Test latency' }];
        const start = Date.now();
        await provider.generateResponse(messages, {});
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    it('[P1] should log calls via Winston logger (not console.log)', async () => {
        // THIS TEST WILL FAIL — OpenAiProvider not implemented yet
        const messages = [{ role: 'user' as const, content: 'Test logging' }];
        await provider.generateResponse(messages, {});
        expect(mockLogger.log).toHaveBeenCalled();
    });
});
