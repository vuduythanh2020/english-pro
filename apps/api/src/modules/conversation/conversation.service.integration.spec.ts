/**
 * RED PHASE — Integration Test: ConversationService (API BullMQ Producer)
 * Story 3.1: AI Provider Abstraction Layer & BullMQ Pipeline
 *
 * AC covered: AC1 — API enqueues conversation job to BullMQ (P0)
 *
 * Cross-service contract:
 *   API Server (producer) → [ai-stt queue] → AI Worker (consumer)
 *   No direct HTTP between API and AI Worker — BullMQ only
 *
 * Activate by removing `x` prefix when ConversationService is implemented.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from './conversation.service';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../common/constants/queue.constants';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const createMockSttQueue = () => ({
    name: 'ai-stt',
    add: jest.fn(),
    getJob: jest.fn(),
});

describe('[Integration] ConversationService — API Producer (RED PHASE — AC1 P0)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let service: any;
    let sttQueue: ReturnType<typeof createMockSttQueue>;

    beforeEach(async () => {
        sttQueue = createMockSttQueue();
        void mockLogger;
        void service;

        // TODO: Bootstrap NestJS module when implemented:
        // const module: TestingModule = await Test.createTestingModule({
        //   providers: [
        //     ConversationService,
        //     { provide: getQueueToken(QUEUE_NAMES.STT), useValue: sttQueue },
        //     { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
        //   ],
        // }).compile();
        // service = module.get<ConversationService>(ConversationService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('[P0] AC1 — Enqueue conversation to BullMQ', () => {
        it('should enqueue job to ai-stt queue with correct payload', async () => {
            // WILL FAIL — ConversationService not implemented yet
            const payload = {
                sessionId: 'api-int-session-001',
                audioBuffer: Buffer.from('voice-data').toString('base64'),
                userId: 'user-api-int-001',
                childId: 'child-api-int-001',
                languageCode: 'en-US',
            };
            sttQueue.add.mockResolvedValue({ id: 'queued-job-api-int-001' });

            // Given: API receives voice conversation request
            const result = await service.enqueueConversation(payload);

            // When: enqueueConversation() is called
            // Then: STT queue receives job with correct data
            expect(sttQueue.add).toHaveBeenCalledWith(
                'stt-job',
                expect.objectContaining({
                    sessionId: 'api-int-session-001',
                    audioBuffer: expect.any(String),
                    userId: 'user-api-int-001',
                    childId: 'child-api-int-001',
                }),
                expect.objectContaining({
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 },
                }),
            );

            // And: returns queued status
            expect(result).toMatchObject({
                jobId: expect.any(String),
                sessionId: 'api-int-session-001',
                status: 'queued',
            });
        });

        it('should serialize Buffer audioBuffer as base64 string (JSON-serializable)', async () => {
            // WILL FAIL — ConversationService not implemented yet
            // BullMQ jobs must be JSON-serializable — Buffer cannot be used directly
            const rawBuffer = Buffer.from('raw-voice-bytes');
            sttQueue.add.mockResolvedValue({ id: 'job' });

            await service.enqueueConversation({
                sessionId: 'buffer-serialize-test',
                audioBuffer: rawBuffer, // Pass raw Buffer (not pre-encoded)
            });

            const jobData = sttQueue.add.mock.calls[0][1];
            expect(typeof jobData.audioBuffer).toBe('string'); // Must be string
            expect(jobData.audioBuffer).toBe(rawBuffer.toString('base64')); // Must be base64
        });

        it('should use ai-stt queue as first pipeline stage (not ai-llm or ai-tts)', async () => {
            // WILL FAIL — ConversationService not implemented yet
            sttQueue.add.mockResolvedValue({ id: 'job' });

            await service.enqueueConversation({ sessionId: 'queue-name-test', audioBuffer: 'base64' });

            expect(sttQueue.name).toBe('ai-stt');
            expect(sttQueue.add).toHaveBeenCalledTimes(1);
        });

        it('should log enqueueing with sessionId context via Winston', async () => {
            // WILL FAIL — ConversationService not implemented yet
            sttQueue.add.mockResolvedValue({ id: 'log-job' });

            await service.enqueueConversation({ sessionId: 'log-session-api', audioBuffer: 'base64' });

            expect(mockLogger.log).toHaveBeenCalledWith(
                expect.stringContaining('enqueue'),
                expect.objectContaining({ sessionId: 'log-session-api' }),
            );
        });
    });

    describe('[P0] AC4 — Error handling in producer', () => {
        it('should throw and log error when queue is unavailable (Redis down)', async () => {
            // WILL FAIL — ConversationService not implemented yet
            sttQueue.add.mockRejectedValue(new Error('Redis connection refused'));

            await expect(
                service.enqueueConversation({ sessionId: 'redis-fail', audioBuffer: 'base64' }),
            ).rejects.toThrow('Redis connection refused');

            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('[P1] Payload validation', () => {
        it('should require sessionId in payload', async () => {
            // WILL FAIL — ConversationService not implemented yet
            await expect(
                service.enqueueConversation({ audioBuffer: 'base64' }), // Missing sessionId
            ).rejects.toThrow();
        });

        it('should handle enqueue with only required fields', async () => {
            // WILL FAIL — ConversationService not implemented yet
            sttQueue.add.mockResolvedValue({ id: 'minimal-job' });

            const result = await service.enqueueConversation({
                sessionId: 'minimal-session',
                audioBuffer: 'base64audio',
            });

            expect(result).toMatchObject({
                status: 'queued',
                sessionId: 'minimal-session',
            });
        });
    });
});
