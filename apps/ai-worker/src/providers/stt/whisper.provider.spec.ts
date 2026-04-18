/**
 * RED PHASE — ATDD Scaffold: WhisperProvider (STT)
 * Story 3.1 — AC2, AC3
 */
describe('WhisperProvider (RED PHASE — AC2, AC3)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let provider: any;

    it('[P1] should have provider name "whisper"', () => {
        expect(provider.name).toBe('whisper');
    });

    it('[P1] should have provider type "stt"', () => {
        expect(provider.type).toBe('stt');
    });

    it('[P1] should implement checkHealth and transcribe', () => {
        expect(typeof provider.checkHealth).toBe('function');
        expect(typeof provider.transcribe).toBe('function');
    });

    it('[P1] should return "healthy" from checkHealth()', async () => {
        expect(await provider.checkHealth()).toBe('healthy');
    });

    it('[P1] should return SttResult with transcript', async () => {
        const result = await provider.transcribe(Buffer.from('audio'), { languageCode: 'en-US' });
        expect(result).toMatchObject({
            transcript: expect.any(String),
            confidence: expect.any(Number),
        });
    });

    it('[P1] should simulate latency >= 100ms', async () => {
        const start = Date.now();
        await provider.transcribe(Buffer.from('audio'), {});
        expect(Date.now() - start).toBeGreaterThanOrEqual(100);
    });
});
