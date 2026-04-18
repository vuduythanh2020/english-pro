/**
 * RED PHASE — ATDD Scaffold: HealthController
 * Story 3.1: AI Provider Abstraction Layer & BullMQ Pipeline
 *
 * AC covered: AC5 — GET /health returns per-provider status (healthy/degraded/unavailable) — P1
 *
 * Expected response:
 * {
 *   status: 'healthy' | 'degraded' | 'unavailable',
 *   providers: {
 *     llm: 'healthy' | 'degraded' | 'unavailable',
 *     stt: 'healthy' | 'degraded' | 'unavailable',
 *     tts: 'healthy' | 'degraded' | 'unavailable',
 *     pronunciation: 'healthy' | 'degraded' | 'unavailable',
 *   }
 * }
 */

import { HealthController } from './health.controller';
import { AiProviderFactory } from '../providers/ai-provider.factory';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const mockProviders = [
    { name: 'openai', type: 'llm', checkHealth: jest.fn().mockResolvedValue('healthy') },
    { name: 'google-speech', type: 'stt', checkHealth: jest.fn().mockResolvedValue('healthy') },
    { name: 'google-tts', type: 'tts', checkHealth: jest.fn().mockResolvedValue('healthy') },
    { name: 'azure-speech', type: 'pronunciation', checkHealth: jest.fn().mockResolvedValue('healthy') },
];

const mockFactory = {
    getAllProviders: jest.fn().mockReturnValue(mockProviders),
};

describe('HealthController (RED PHASE — AC5 P1)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let controller: any;

    beforeEach(() => {
        void mockLogger;
        // TODO: Replace with actual NestJS test module when implemented
    });

    afterEach(() => jest.clearAllMocks());

    it('[P1] should respond to GET /health endpoint', async () => {
        // THIS TEST WILL FAIL — HealthController not implemented yet
        const result = await controller.getHealth();
        expect(result).toBeDefined();
    });

    it('[P1] should call checkHealth() on each configured provider', async () => {
        // THIS TEST WILL FAIL — HealthController not implemented yet
        await controller.getHealth();

        // Each provider's checkHealth should be called
        mockProviders.forEach(p => {
            expect(p.checkHealth).toHaveBeenCalled();
        });
    });

    it('[P1] should return all provider statuses in response', async () => {
        // THIS TEST WILL FAIL — HealthController not implemented yet
        const result = await controller.getHealth();

        expect(result).toMatchObject({
            providers: {
                llm: expect.stringMatching(/^(healthy|degraded|unavailable)$/),
                stt: expect.stringMatching(/^(healthy|degraded|unavailable)$/),
                tts: expect.stringMatching(/^(healthy|degraded|unavailable)$/),
                pronunciation: expect.stringMatching(/^(healthy|degraded|unavailable)$/),
            },
        });
    });

    it('[P1] should return overall "healthy" when all providers are healthy', async () => {
        // THIS TEST WILL FAIL — HealthController not implemented yet
        mockProviders.forEach(p => p.checkHealth.mockResolvedValue('healthy'));

        const result = await controller.getHealth();

        expect(result.status).toBe('healthy');
    });

    it('[P1] should return overall "degraded" when at least one provider is degraded', async () => {
        // THIS TEST WILL FAIL — HealthController not implemented yet
        mockProviders[0].checkHealth.mockResolvedValue('degraded'); // LLM degraded
        mockProviders.slice(1).forEach(p => p.checkHealth.mockResolvedValue('healthy'));

        const result = await controller.getHealth();

        expect(result.status).toBe('degraded');
        expect(result.providers.llm).toBe('degraded');
    });

    it('[P1] should return overall "unavailable" when a critical provider is unavailable', async () => {
        // THIS TEST WILL FAIL — HealthController not implemented yet
        mockProviders[0].checkHealth.mockResolvedValue('unavailable'); // LLM unavailable
        mockProviders.slice(1).forEach(p => p.checkHealth.mockResolvedValue('healthy'));

        const result = await controller.getHealth();

        expect(result.status).toBe('unavailable');
    });

    it('[P1] should complete health check within 2s timeout per provider', async () => {
        // THIS TEST WILL FAIL — HealthController not implemented yet
        // Dev Notes: health check < 2s timeout (NFR)
        mockProviders.forEach(p => p.checkHealth.mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve('healthy'), 50)), // 50ms mock latency
        ));

        const start = Date.now();
        await controller.getHealth();
        const elapsed = Date.now() - start;

        // All 4 providers in parallel should complete in < 500ms (not 4 × 50ms sequentially)
        expect(elapsed).toBeLessThan(500);
    });

    it('[P1] should handle provider checkHealth() throwing (return "unavailable" for that provider)', async () => {
        // THIS TEST WILL FAIL — HealthController not implemented yet
        mockProviders[2].checkHealth.mockRejectedValue(new Error('TTS service down'));
        mockProviders.filter((_, i) => i !== 2).forEach(p => p.checkHealth.mockResolvedValue('healthy'));

        const result = await controller.getHealth();

        expect(result.providers.tts).toBe('unavailable');
        expect(mockLogger.error).toHaveBeenCalled();
    });
});
