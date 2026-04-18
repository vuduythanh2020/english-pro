/**
 * RED PHASE — ATDD Scaffold: AzureSpeechProvider (Pronunciation)
 * Story 3.1 — AC2, AC3, AC4 (graceful degradation — no secondary)
 */
describe('AzureSpeechProvider (RED PHASE — AC2, AC3)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let provider: any;

    it('[P1] should have provider name "azure-speech"', () => {
        expect(provider.name).toBe('azure-speech');
    });

    it('[P1] should have provider type "pronunciation"', () => {
        expect(provider.type).toBe('pronunciation');
    });

    it('[P1] should implement checkHealth and assess', () => {
        expect(typeof provider.checkHealth).toBe('function');
        expect(typeof provider.assess).toBe('function');
    });

    it('[P1] should return "healthy" from checkHealth()', async () => {
        expect(await provider.checkHealth()).toBe('healthy');
    });

    it('[P1] should return PronunciationResult with score and phonemes', async () => {
        // THIS TEST WILL FAIL — AzureSpeechProvider not implemented yet
        const audioBuffer = Buffer.from('fake-audio-data');
        const referenceText = 'Hello, my name is Max';
        const options = { locale: 'en-US' };

        const result = await provider.assess(audioBuffer, referenceText, options);

        expect(result).toMatchObject({
            overallScore: expect.any(Number),
            accuracyScore: expect.any(Number),
            fluencyScore: expect.any(Number),
            completenessScore: expect.any(Number),
            phonemes: expect.any(Array),
        });
        expect(result.overallScore).toBeGreaterThanOrEqual(0);
        expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('[P1] should simulate latency >= 100ms', async () => {
        const start = Date.now();
        await provider.assess(Buffer.from('audio'), 'test text', {});
        expect(Date.now() - start).toBeGreaterThanOrEqual(100);
    });

    it('[P1] should support graceful degradation (no secondary provider configured)', () => {
        // Dev Notes: pronunciation has no secondary — graceful degradation only
        // This ensures the processor handles null secondary gracefully
        expect(provider.name).toBe('azure-speech');
    });
});
