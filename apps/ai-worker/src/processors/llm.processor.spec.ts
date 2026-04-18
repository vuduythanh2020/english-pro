/**
 * RED PHASE — ATDD Scaffold: LlmProcessor
 * Story 3.1 — AC1 (pipeline chaining STT→LLM), AC4 (retry + DLQ) — P0
 * Queue: 'ai-llm'
 */

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const mockLlmProvider = {
    name: 'openai',
    type: 'llm',
    generateResponse: jest.fn(),
    checkHealth: jest.fn().mockResolvedValue('healthy'),
};

const mockFactory = {
    getLlmProvider: jest.fn().mockReturnValue(mockLlmProvider),
};

const createMockJob = (data: unknown, opts?: { attemptsMade?: number }) => ({
    id: 'llm-job-id-456',
    name: 'llm-job',
    data,
    attemptsMade: opts?.attemptsMade ?? 0,
    opts: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
});

describe('LlmProcessor (RED PHASE — AC1, AC4 P0)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let processor: any;

    beforeEach(() => {
        void mockLogger;
        void mockFactory;
    });

    afterEach(() => jest.clearAllMocks());

    it('[P0] should call LlmProvider.generateResponse() with transcript from STT result', async () => {
        // THIS TEST WILL FAIL — LlmProcessor not implemented yet
        const job = createMockJob({
            transcript: 'Hello Max, how are you?',
            sessionId: 'session-456',
            conversationHistory: [{ role: 'user', content: 'Hello Max!' }],
        });

        mockLlmProvider.generateResponse.mockResolvedValue({
            text: "Hi there! I'm Max and I'm doing great! How about you?",
            tokensUsed: 42,
            model: 'gpt-4o',
        });

        const result = await processor.process(job);

        expect(mockFactory.getLlmProvider).toHaveBeenCalled();
        expect(mockLlmProvider.generateResponse).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ role: 'user' })]),
            expect.any(Object),
        );
        expect(result).toMatchObject({
            responseText: expect.any(String),
            sessionId: 'session-456',
        });
    });

    it('[P0] should throw error to trigger BullMQ retry on LLM failure', async () => {
        // THIS TEST WILL FAIL — LlmProcessor not implemented yet
        const job = createMockJob({ transcript: 'test', sessionId: 'fail-session' });
        mockLlmProvider.generateResponse.mockRejectedValue(new Error('Rate limit exceeded'));

        await expect(processor.process(job)).rejects.toThrow('Rate limit exceeded');
        expect(mockLogger.error).toHaveBeenCalled();
    });

    it('[P0] should implement onFailed handler for DLQ logging', () => {
        // THIS TEST WILL FAIL — LlmProcessor not implemented yet
        expect(typeof processor.onFailed).toBe('function');
    });

    it('[P1] should include conversation context in LLM request', async () => {
        // THIS TEST WILL FAIL — LlmProcessor not implemented yet
        const history = [
            { role: 'assistant', content: 'Hello! I am Max.' },
            { role: 'user', content: 'Tell me about animals.' },
        ];
        const job = createMockJob({ transcript: 'What sound does a cat make?', sessionId: 'history-session', conversationHistory: history });

        mockLlmProvider.generateResponse.mockResolvedValue({ text: 'Meow!', tokensUsed: 10, model: 'gpt-4o' });

        await processor.process(job);

        // Should pass full history to LLM
        expect(mockLlmProvider.generateResponse).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ role: 'assistant' }),
                expect.objectContaining({ role: 'user' }),
            ]),
            expect.any(Object),
        );
    });
});
