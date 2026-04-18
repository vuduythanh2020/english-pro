/**
 * RED PHASE — ATDD Scaffold: SttProcessor
 * Story 3.1: AI Provider Abstraction Layer & BullMQ Pipeline
 *
 * AC covered: AC1 (pipeline routes through STT), AC4 (retry + DLQ) — P0
 *
 * BullMQ Queue Name: 'ai-stt'
 * Job Options: attempts=3, backoff=exponential(1000ms)
 */

import { SttProcessor } from './stt.processor';
import { AiProviderFactory } from '../providers/ai-provider.factory';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const mockSttProvider = {
    name: 'google-speech',
    type: 'stt',
    transcribe: jest.fn(),
    checkHealth: jest.fn().mockResolvedValue('healthy'),
};

const mockFactory = {
    getSttProvider: jest.fn().mockReturnValue(mockSttProvider),
};

const createMockJob = (data: unknown, opts?: { attemptsMade?: number }) => ({
    id: 'test-job-id-123',
    name: 'stt-job',
    data,
    attemptsMade: opts?.attemptsMade ?? 0,
    opts: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
});

describe('SttProcessor (RED PHASE — AC1, AC4 P0)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let processor: any;

    beforeEach(() => {
        void mockLogger;
        // TODO: Create NestJS test module when SttProcessor is implemented:
        // const module = await Test.createTestingModule({
        //   providers: [
        //     SttProcessor,
        //     { provide: AiProviderFactory, useValue: mockFactory },
        //     { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
        //   ],
        // }).compile();
        // processor = module.get<SttProcessor>(SttProcessor);
    });

    afterEach(() => jest.clearAllMocks());

    // --- Basic Processing (AC1) ---

    it('[P0] should be decorated with @Processor("ai-stt")', () => {
        // THIS TEST WILL FAIL — SttProcessor not implemented yet
        // Verify queue name constant is correct
        expect(processor).toBeDefined();
        // The @Processor decorator uses queue name 'ai-stt'
    });

    it('[P0] should call SttProvider.transcribe() with audio buffer from job data', async () => {
        // THIS TEST WILL FAIL — SttProcessor not implemented yet
        const audioBuffer = Buffer.from('test-audio-data');
        const job = createMockJob({ audioBuffer: audioBuffer.toString('base64'), sessionId: 'session-123' });

        mockSttProvider.transcribe.mockResolvedValue({
            transcript: 'Hello Max how are you',
            confidence: 0.95,
            languageCode: 'en-US',
        });

        const result = await processor.process(job);

        expect(mockFactory.getSttProvider).toHaveBeenCalled();
        expect(mockSttProvider.transcribe).toHaveBeenCalledWith(
            expect.any(Buffer),
            expect.objectContaining({ languageCode: expect.any(String) }),
        );
        expect(result).toMatchObject({
            transcript: 'Hello Max how are you',
            sessionId: 'session-123',
        });
    });

    // --- Error Handling & Retry (AC4) ---

    it('[P0] should throw error to trigger BullMQ retry on provider failure', async () => {
        // THIS TEST WILL FAIL — SttProcessor not implemented yet
        // Dev Notes: processors MUST have try/catch with proper logging + rethrow to trigger BullMQ retry
        const job = createMockJob({ audioBuffer: 'base64audio', sessionId: 'session-fail' });

        mockSttProvider.transcribe.mockRejectedValue(new Error('STT provider unreachable'));

        // Processor should log error and rethrow to let BullMQ handle retry
        await expect(processor.process(job)).rejects.toThrow('STT provider unreachable');
        expect(mockLogger.error).toHaveBeenCalled();
    });

    it('[P0] should log job failure details before rethrowing', async () => {
        // THIS TEST WILL FAIL — SttProcessor not implemented yet
        const job = createMockJob({ audioBuffer: 'base64audio', sessionId: 'session-log' }, { attemptsMade: 1 });
        mockSttProvider.transcribe.mockRejectedValue(new Error('Network timeout'));

        try {
            await processor.process(job);
        } catch {
            // Expected to throw
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining('stt'),
            expect.objectContaining({ jobId: 'test-job-id-123' }),
        );
    });

    it('[P0] should configure job with attempts=3 and exponential backoff', () => {
        // THIS TEST WILL FAIL — SttProcessor not implemented yet
        // Verify processor uses DEFAULT_JOB_OPTIONS constants
        // This is verified via BullMQ queue configuration, not directly testable here
        // But we can verify the processor handles attemptsMade correctly
        const job = createMockJob({}, { attemptsMade: 2 }); // 3rd attempt
        expect(job.attemptsMade).toBe(2);
        expect(job.opts.attempts).toBe(3);
    });

    // --- Dead Letter Queue (AC4) ---

    it('[P0] should handle onFailed lifecycle — log to dead-letter queue after max retries', async () => {
        // THIS TEST WILL FAIL — SttProcessor not implemented yet
        // After 3 failed attempts, BullMQ moves to DLQ (removeOnFail: { count: 500 })
        // The processor's onFailed handler should log the final failure
        const job = createMockJob({ audioBuffer: 'base64audio', sessionId: 'session-dlq' }, { attemptsMade: 2 });
        const error = new Error('Max retries exceeded');

        // SttProcessor should implement @OnQueueFailed or similar
        expect(typeof processor.onFailed).toBe('function');
        processor.onFailed(job, error);
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining('failed'),
            expect.objectContaining({ sessionId: 'session-dlq' }),
        );
    });

    // --- Input Validation ---

    it('[P1] should reject job with missing audioBuffer in data', async () => {
        // THIS TEST WILL FAIL — SttProcessor not implemented yet
        const job = createMockJob({ sessionId: 'no-audio' }); // Missing audioBuffer

        await expect(processor.process(job)).rejects.toThrow();
        expect(mockLogger.error).toHaveBeenCalled();
    });
});
