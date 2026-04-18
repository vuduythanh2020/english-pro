/**
 * RED PHASE — ATDD Scaffold: ElevenLabsProvider (TTS)
 * Story 3.1 — AC2, AC3
 */
describe('ElevenLabsProvider (RED PHASE — AC2, AC3)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let provider: any;

    it('[P1] should have provider name "elevenlabs"', () => {
        expect(provider.name).toBe('elevenlabs');
    });

    it('[P1] should have provider type "tts"', () => {
        expect(provider.type).toBe('tts');
    });

    it('[P1] should implement checkHealth and synthesize', () => {
        expect(typeof provider.checkHealth).toBe('function');
        expect(typeof provider.synthesize).toBe('function');
    });

    it('[P1] should return "healthy" from checkHealth()', async () => {
        expect(await provider.checkHealth()).toBe('healthy');
    });

    it('[P1] should return a Buffer from synthesize()', async () => {
        const result = await provider.synthesize('Hello from ElevenLabs!', { voiceId: 'test-voice-id' });
        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(0);
    });

    it('[P1] should simulate latency >= 100ms', async () => {
        const start = Date.now();
        await provider.synthesize('Test', {});
        expect(Date.now() - start).toBeGreaterThanOrEqual(100);
    });
});
