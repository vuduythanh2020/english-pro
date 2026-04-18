/**
 * RED PHASE — ATDD Scaffold: GeminiProvider
 * Story 3.1: AI Provider Abstraction Layer & BullMQ Pipeline
 * AC covered: AC2, AC3
 */
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { GeminiProvider } from './gemini.provider'; // Uncomment when implemented

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

describe('GeminiProvider (RED PHASE — AC2, AC3)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let provider: any;

    beforeEach(() => {
        void WINSTON_MODULE_NEST_PROVIDER;
        // TODO: Replace with actual NestJS test module when implemented
    });

    afterEach(() => jest.clearAllMocks());

    it('[P1] should have correct provider name "gemini"', () => {
        expect(provider.name).toBe('gemini');
    });

    it('[P1] should have correct provider type "llm"', () => {
        expect(provider.type).toBe('llm');
    });

    it('[P1] should implement checkHealth method', () => {
        expect(typeof provider.checkHealth).toBe('function');
    });

    it('[P1] should implement generateResponse method', () => {
        expect(typeof provider.generateResponse).toBe('function');
    });

    it('[P1] should return "healthy" from checkHealth() by default', async () => {
        const status = await provider.checkHealth();
        expect(status).toBe('healthy');
    });

    it('[P1] should return LlmResult with text and metadata', async () => {
        const messages = [{ role: 'user' as const, content: 'Hello from Gemini test!' }];
        const result = await provider.generateResponse(messages, { maxTokens: 100 });
        expect(result).toMatchObject({
            text: expect.any(String),
            tokensUsed: expect.any(Number),
            model: expect.any(String),
        });
    });

    it('[P1] should simulate latency >= 100ms', async () => {
        const start = Date.now();
        await provider.generateResponse([{ role: 'user' as const, content: 'Latency test' }], {});
        expect(Date.now() - start).toBeGreaterThanOrEqual(100);
    });

    it('[P1] should log via Winston (not console.log)', async () => {
        await provider.generateResponse([{ role: 'user' as const, content: 'Log test' }], {});
        expect(mockLogger.log).toHaveBeenCalled();
    });
});
