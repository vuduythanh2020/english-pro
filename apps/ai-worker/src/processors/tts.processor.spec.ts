/**
 * RED PHASE — ATDD Scaffold: TtsProcessor
 * Story 3.1 — AC1 (final stage of pipeline), AC4 (retry + DLQ) — P0
 * Queue: 'ai-tts'
 */

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const mockTtsProvider = {
    name: 'google-tts',
    type: 'tts',
    synthesize: jest.fn(),
    checkHealth: jest.fn().mockResolvedValue('healthy'),
};

const mockFactory = {
    getTtsProvider: jest.fn().mockReturnValue(mockTtsProvider),
};

const createMockJob = (data: unknown) => ({
    id: 'tts-job-id-789',
    name: 'tts-job',
    data,
    attemptsMade: 0,
    opts: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
});

describe('TtsProcessor (RED PHASE — AC1, AC4 P0)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let processor: any;

    beforeEach(() => { void mockLogger; void mockFactory; });
    afterEach(() => jest.clearAllMocks());

    it('[P0] should call TtsProvider.synthesize() with responseText from LLM result', async () => {
        // THIS TEST WILL FAIL — TtsProcessor not implemented yet
        const mockAudioBuffer = Buffer.from('fake-mp3-audio');
        const job = createMockJob({
            responseText: "Hi there! I'm Max!",
            sessionId: 'session-789',
            voiceOptions: { voice: 'en-US-Neural2-A' },
        });

        mockTtsProvider.synthesize.mockResolvedValue(mockAudioBuffer);

        const result = await processor.process(job);

        expect(mockFactory.getTtsProvider).toHaveBeenCalled();
        expect(mockTtsProvider.synthesize).toHaveBeenCalledWith(
            "Hi there! I'm Max!",
            expect.any(Object),
        );
        expect(result).toMatchObject({
            audioBuffer: expect.any(Buffer),
            sessionId: 'session-789',
        });
    });

    it('[P0] should throw error to trigger retry on TTS failure', async () => {
        // THIS TEST WILL FAIL — TtsProcessor not implemented yet
        const job = createMockJob({ responseText: 'test', sessionId: 'fail-tts' });
        mockTtsProvider.synthesize.mockRejectedValue(new Error('TTS quota exceeded'));

        await expect(processor.process(job)).rejects.toThrow('TTS quota exceeded');
        expect(mockLogger.error).toHaveBeenCalled();
    });

    it('[P0] should implement onFailed handler for DLQ logging', () => {
        // THIS TEST WILL FAIL — TtsProcessor not implemented yet
        expect(typeof processor.onFailed).toBe('function');
    });

    it('[P1] should emit audio result as job completion event (for API to receive)', async () => {
        // THIS TEST WILL FAIL — TtsProcessor not implemented yet
        // TTS is final stage — result should be accessible as job completion result
        const job = createMockJob({ responseText: 'Final audio', sessionId: 'complete-session' });
        mockTtsProvider.synthesize.mockResolvedValue(Buffer.from('audio'));

        const result = await processor.process(job);
        expect(result.audioBuffer).toBeInstanceOf(Buffer);
        expect(result.sessionId).toBe('complete-session');
    });
});
