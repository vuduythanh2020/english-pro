/**
 * RED PHASE — ATDD Scaffold: GoogleSpeechProvider (STT)
 * Story 3.1: AI Provider Abstraction Layer & BullMQ Pipeline
 * AC covered: AC2, AC3
 */
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { GoogleSpeechProvider } from './google-speech.provider'; // Uncomment when implemented

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

describe('GoogleSpeechProvider (RED PHASE — AC2, AC3)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let provider: any;

    beforeEach(() => {
        void WINSTON_MODULE_NEST_PROVIDER;
        void mockLogger;
        // TODO: Replace with actual NestJS test module when implemented
    });

    afterEach(() => jest.clearAllMocks());

    it('[P1] should have correct provider name "google-speech"', () => {
        expect(provider.name).toBe('google-speech');
    });

    it('[P1] should have correct provider type "stt"', () => {
        expect(provider.type).toBe('stt');
    });

    it('[P1] should implement checkHealth method', () => {
        expect(typeof provider.checkHealth).toBe('function');
    });

    it('[P1] should implement transcribe method', () => {
        expect(typeof provider.transcribe).toBe('function');
    });

    it('[P1] should return "healthy" from checkHealth() by default', async () => {
        const status = await provider.checkHealth();
        expect(status).toBe('healthy');
    });

    it('[P1] should return SttResult with transcript and confidence', async () => {
        // THIS TEST WILL FAIL — GoogleSpeechProvider not implemented yet
        const audioBuffer = Buffer.from('fake-audio-data');
        const options = { languageCode: 'en-US' };

        const result = await provider.transcribe(audioBuffer, options);

        expect(result).toMatchObject({
            transcript: expect.any(String),
            confidence: expect.any(Number),
            languageCode: expect.any(String),
        });
        expect(result.transcript.length).toBeGreaterThan(0);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('[P1] should simulate latency >= 100ms per stub requirements', async () => {
        const audioBuffer = Buffer.from('fake-audio-data');
        const start = Date.now();
        await provider.transcribe(audioBuffer, {});
        expect(Date.now() - start).toBeGreaterThanOrEqual(100);
    });
});
