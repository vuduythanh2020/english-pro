/**
 * RED PHASE — ATDD Scaffold: ConversationService (API side — BullMQ Producer)
 * Story 3.1: AI Provider Abstraction Layer & BullMQ Pipeline
 *
 * AC covered: AC1 — API server enqueues conversation job to BullMQ (STT queue) — P0
 *
 * Architecture:
 * - API server is the PRODUCER (enqueues jobs)
 * - AI Worker is the CONSUMER (processes jobs)
 * - Communication via BullMQ only (no direct HTTP between API and AI Worker)
 * - Queue name: 'ai-stt' (first stage)
 */

import { ConversationService } from './conversation.service';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../common/constants/queue.constants';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const mockSttQueue = {
    name: 'ai-stt',
    add: jest.fn(),
};

describe('ConversationService (RED PHASE — API Producer, AC1 P0)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let service: any;

    beforeEach(() => {
        void mockLogger;
        void mockSttQueue;
        // TODO: Create NestJS test module when ConversationService is implemented:
        // const module = await Test.createTestingModule({
        //   providers: [
        //     ConversationService,
        //     { provide: getQueueToken(QUEUE_NAMES.STT), useValue: mockSttQueue },
        //     { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
        //   ],
        // }).compile();
        // service = module.get<ConversationService>(ConversationService);
    });

    afterEach(() => jest.clearAllMocks());

    it('[P0] should add conversation job to ai-stt queue via enqueueConversation()', async () => {
        // THIS TEST WILL FAIL — ConversationService not implemented yet
        const payload = {
            sessionId: 'session-api-001',
            audioBuffer: Buffer.from('raw-audio').toString('base64'),
            userId: 'user-abc',
            childId: 'child-xyz',
            languageCode: 'en-US',
        };

        mockSttQueue.add.mockResolvedValue({ id: 'queued-job-id' });

        const result = await service.enqueueConversation(payload);

        expect(mockSttQueue.add).toHaveBeenCalledWith(
            'stt-job',
            expect.objectContaining({
                sessionId: 'session-api-001',
                audioBuffer: expect.any(String),
                userId: 'user-abc',
                childId: 'child-xyz',
            }),
            expect.objectContaining({
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            }),
        );
        expect(result).toMatchObject({
            jobId: expect.any(String),
            sessionId: 'session-api-001',
            status: 'queued',
        });
    });

    it('[P0] should NOT make direct HTTP call to AI Worker service (only via BullMQ)', async () => {
        // THIS TEST WILL FAIL — ConversationService not implemented yet
        // Anti-pattern check: no HttpService or direct URL calls to AI Worker
        // This is enforced by only injecting the queue, not any HTTP client
        const payload = { sessionId: 'session-no-http', audioBuffer: 'base64audio' };
        mockSttQueue.add.mockResolvedValue({ id: 'job' });

        await service.enqueueConversation(payload);

        // Only queue.add should be called — no HTTP calls
        expect(mockSttQueue.add).toHaveBeenCalledTimes(1);
    });

    it('[P0] should use ai-stt queue name (first pipeline stage)', async () => {
        // THIS TEST WILL FAIL — ConversationService not implemented yet
        mockSttQueue.add.mockResolvedValue({ id: 'job' });

        await service.enqueueConversation({ sessionId: 'test', audioBuffer: 'base64' });

        // Verify correct queue is used (ai-stt, NOT ai-llm or ai-tts directly)
        expect(mockSttQueue.name).toBe('ai-stt');
        expect(mockSttQueue.add).toHaveBeenCalled();
    });

    it('[P0] should log job enqueue via Winston with sessionId context', async () => {
        // THIS TEST WILL FAIL — ConversationService not implemented yet
        mockSttQueue.add.mockResolvedValue({ id: 'job-log' });

        await service.enqueueConversation({ sessionId: 'session-log-test', audioBuffer: 'base64' });

        expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('enqueue'),
            expect.objectContaining({ sessionId: 'session-log-test' }),
        );
    });

    it('[P1] should throw and log error if queue is unavailable', async () => {
        // THIS TEST WILL FAIL — ConversationService not implemented yet
        mockSttQueue.add.mockRejectedValue(new Error('Redis connection lost'));

        await expect(service.enqueueConversation({ sessionId: 'fail-session', audioBuffer: 'base64' }))
            .rejects.toThrow('Redis connection lost');

        expect(mockLogger.error).toHaveBeenCalled();
    });

    it('[P1] should serialize audioBuffer as base64 string in job payload', async () => {
        // THIS TEST WILL FAIL — ConversationService not implemented yet
        // BullMQ jobs must be JSON-serializable — Buffer cannot be used directly
        const rawBuffer = Buffer.from('actual-audio-bytes');
        mockSttQueue.add.mockResolvedValue({ id: 'job' });

        await service.enqueueConversation({ sessionId: 'serialize-test', audioBuffer: rawBuffer });

        const jobData = mockSttQueue.add.mock.calls[0][1]; // 2nd arg = data
        expect(typeof jobData.audioBuffer).toBe('string'); // Must be string, not Buffer
    });
});
