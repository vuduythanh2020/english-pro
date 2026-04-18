/**
 * RED PHASE — Integration Test Scaffold: BullMQ Pipeline End-to-End
 * Story 3.1: AI Provider Abstraction Layer & BullMQ Pipeline
 *
 * AC covered:
 *   AC1 — BullMQ pipeline routes through STT → LLM → TTS (P0)
 *   AC4 — Retry exponential backoff + dead-letter queue (P0)
 *
 * Architecture:
 *   - ConversationPipelineService (ai-worker) orchestrates queue chaining
 *   - ConversationService (api) is the BullMQ producer
 *   - All queues: 'ai-stt', 'ai-llm', 'ai-tts', 'ai-pronunciation'
 *
 * Activate by removing `x` prefix when implementation is complete.
 *
 * Dev Notes for implementation:
 *   - Queue names must be: QUEUE_NAMES.STT='ai-stt', LLM='ai-llm', TTS='ai-tts', PRONUNCIATION='ai-pronunciation'
 *   - DEFAULT_JOB_OPTIONS: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
 *   - ConversationPipelineService listens for completion events and chains stages
 *   - Pronunciation runs in parallel with LLM (non-blocking main flow)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConversationPipelineService } from './conversation-pipeline.service';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES, DEFAULT_JOB_OPTIONS } from '../constants/queue.constants';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

// Mock queue factory helper
const createMockQueue = (name: string) => ({
    name,
    add: jest.fn(),
    getJob: jest.fn(),
    getJobs: jest.fn().mockResolvedValue([]),
    obliterate: jest.fn(),
});

describe('[Integration] BullMQ Pipeline — STT → LLM → TTS (RED PHASE — AC1, AC4 P0)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pipelineService: any;
    let sttQueue: ReturnType<typeof createMockQueue>;
    let llmQueue: ReturnType<typeof createMockQueue>;
    let ttsQueue: ReturnType<typeof createMockQueue>;
    let pronunciationQueue: ReturnType<typeof createMockQueue>;

    beforeEach(async () => {
        sttQueue = createMockQueue('ai-stt');
        llmQueue = createMockQueue('ai-llm');
        ttsQueue = createMockQueue('ai-tts');
        pronunciationQueue = createMockQueue('ai-pronunciation');

        void mockLogger;
        void pipelineService;

        // TODO: Bootstrap NestJS module when implemented:
        // const module: TestingModule = await Test.createTestingModule({
        //   providers: [
        //     ConversationPipelineService,
        //     { provide: getQueueToken(QUEUE_NAMES.STT), useValue: sttQueue },
        //     { provide: getQueueToken(QUEUE_NAMES.LLM), useValue: llmQueue },
        //     { provide: getQueueToken(QUEUE_NAMES.TTS), useValue: ttsQueue },
        //     { provide: getQueueToken(QUEUE_NAMES.PRONUNCIATION), useValue: pronunciationQueue },
        //     { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
        //   ],
        // }).compile();
        // pipelineService = module.get<ConversationPipelineService>(ConversationPipelineService);
    });

    afterEach(() => jest.clearAllMocks());

    // ─────────────────────────────────────────────────
    // AC1: Full pipeline flow STT → LLM → TTS
    // ─────────────────────────────────────────────────

    describe('[P0] AC1 — Full pipeline routing', () => {
        it('should enqueue STT job when startConversationPipeline() is called', async () => {
            // WILL FAIL — ConversationPipelineService not implemented yet
            const payload = {
                sessionId: 'int-session-001',
                audioBuffer: Buffer.from('voice-input').toString('base64'),
                userId: 'user-int-001',
                childId: 'child-int-001',
            };
            sttQueue.add.mockResolvedValue({ id: 'stt-job-int-001' });

            await pipelineService.startConversationPipeline(payload);

            // Given: pipeline starts
            // When: startConversationPipeline() called
            // Then: STT queue receives first job
            expect(sttQueue.add).toHaveBeenCalledWith(
                'stt-job',
                expect.objectContaining({
                    sessionId: 'int-session-001',
                    audioBuffer: expect.any(String),
                }),
                expect.objectContaining({
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 },
                }),
            );
            expect(llmQueue.add).not.toHaveBeenCalled(); // STT not yet complete
            expect(ttsQueue.add).not.toHaveBeenCalled();
        });

        it('should chain STT → LLM on STT completion event', async () => {
            // WILL FAIL — ConversationPipelineService not implemented yet
            llmQueue.add.mockResolvedValue({ id: 'llm-job-int-001' });

            const sttResult = {
                transcript: 'Hello Max, what is your favourite animal?',
                confidence: 0.97,
                sessionId: 'int-session-chain-001',
            };

            await pipelineService.onSttComplete(sttResult);

            // Given: STT stage completed
            // When: onSttComplete() event fires
            // Then: LLM queue receives transcript
            expect(llmQueue.add).toHaveBeenCalledWith(
                'llm-job',
                expect.objectContaining({
                    transcript: 'Hello Max, what is your favourite animal?',
                    sessionId: 'int-session-chain-001',
                }),
                expect.objectContaining({ attempts: 3 }),
            );
            expect(ttsQueue.add).not.toHaveBeenCalled(); // LLM not yet complete
        });

        it('should chain LLM → TTS on LLM completion event', async () => {
            // WILL FAIL — ConversationPipelineService not implemented yet
            ttsQueue.add.mockResolvedValue({ id: 'tts-job-int-001' });

            const llmResult = {
                responseText: 'My favourite animal is a dolphin! Dolphins are very smart.',
                tokensUsed: 28,
                sessionId: 'int-session-chain-001',
            };

            await pipelineService.onLlmComplete(llmResult);

            // Given: LLM stage completed
            // When: onLlmComplete() event fires
            // Then: TTS queue receives response text
            expect(ttsQueue.add).toHaveBeenCalledWith(
                'tts-job',
                expect.objectContaining({
                    responseText: 'My favourite animal is a dolphin! Dolphins are very smart.',
                    sessionId: 'int-session-chain-001',
                }),
                expect.objectContaining({ attempts: 3 }),
            );
        });

        it('should run pronunciation in parallel with LLM (non-blocking)', async () => {
            // WILL FAIL — ConversationPipelineService not implemented yet
            llmQueue.add.mockResolvedValue({ id: 'llm-job' });
            pronunciationQueue.add.mockResolvedValue({ id: 'pron-job' });

            const sttResult = {
                transcript: 'My name is Max.',
                audioBuffer: Buffer.from('audio').toString('base64'),
                sessionId: 'int-session-parallel',
            };

            await pipelineService.onSttComplete(sttResult);

            // Given: STT completed
            // When: onSttComplete() fires
            // Then: BOTH LLM and pronunciation queues receive jobs (parallel, not sequential)
            expect(llmQueue.add).toHaveBeenCalled();
            expect(pronunciationQueue.add).toHaveBeenCalledWith(
                'pronunciation-job',
                expect.objectContaining({
                    audioBuffer: expect.any(String),
                    referenceText: 'My name is Max.',
                    sessionId: 'int-session-parallel',
                }),
                expect.any(Object),
            );
        });
    });

    // ─────────────────────────────────────────────────
    // AC4: Retry configuration and DLQ
    // ─────────────────────────────────────────────────

    describe('[P0] AC4 — Retry exponential backoff & DLQ', () => {
        it('should use DEFAULT_JOB_OPTIONS for all queue operations', async () => {
            // WILL FAIL — ConversationPipelineService not implemented yet
            sttQueue.add.mockResolvedValue({ id: 'job' });

            await pipelineService.startConversationPipeline({
                sessionId: 'session-job-opts',
                audioBuffer: 'base64audio',
            });

            const jobOptions = sttQueue.add.mock.calls[0][2];
            expect(jobOptions).toMatchObject({
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            });
        });

        it('should apply same job options when chaining LLM and TTS', async () => {
            // WILL FAIL — ConversationPipelineService not implemented yet
            llmQueue.add.mockResolvedValue({ id: 'llm-job' });
            ttsQueue.add.mockResolvedValue({ id: 'tts-job' });

            await pipelineService.onSttComplete({
                transcript: 'retry options test',
                sessionId: 'session-retry',
            });
            await pipelineService.onLlmComplete({
                responseText: 'retry options test response',
                sessionId: 'session-retry',
            });

            const llmOpts = llmQueue.add.mock.calls[0][2];
            const ttsOpts = ttsQueue.add.mock.calls[0][2];

            expect(llmOpts).toMatchObject({ attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
            expect(ttsOpts).toMatchObject({ attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
        });
    });

    // ─────────────────────────────────────────────────
    // Pipeline integrity
    // ─────────────────────────────────────────────────

    describe('[P1] Pipeline integrity', () => {
        it('should log each pipeline stage transition via Winston', async () => {
            // WILL FAIL — ConversationPipelineService not implemented yet
            sttQueue.add.mockResolvedValue({ id: 'stt-job' });
            llmQueue.add.mockResolvedValue({ id: 'llm-job' });
            ttsQueue.add.mockResolvedValue({ id: 'tts-job' });

            await pipelineService.startConversationPipeline({ sessionId: 'log-session', audioBuffer: 'base64' });
            await pipelineService.onSttComplete({ transcript: 'test', sessionId: 'log-session' });
            await pipelineService.onLlmComplete({ responseText: 'test response', sessionId: 'log-session' });

            expect(mockLogger.log).toHaveBeenCalledTimes(3);
        });

        it('should propagate sessionId throughout all pipeline stages', async () => {
            // WILL FAIL — ConversationPipelineService not implemented yet
            sttQueue.add.mockResolvedValue({ id: 'stt-job' });
            llmQueue.add.mockResolvedValue({ id: 'llm-job' });
            ttsQueue.add.mockResolvedValue({ id: 'tts-job' });

            const SESSION = 'session-propagate-test';

            await pipelineService.startConversationPipeline({ sessionId: SESSION, audioBuffer: 'base64' });
            await pipelineService.onSttComplete({ transcript: 'test', sessionId: SESSION });
            await pipelineService.onLlmComplete({ responseText: 'response', sessionId: SESSION });

            // Each queue job must carry the sessionId
            expect(sttQueue.add.mock.calls[0][1]).toMatchObject({ sessionId: SESSION });
            expect(llmQueue.add.mock.calls[0][1]).toMatchObject({ sessionId: SESSION });
            expect(ttsQueue.add.mock.calls[0][1]).toMatchObject({ sessionId: SESSION });
        });

        it('should handle empty transcript gracefully (edge case)', async () => {
            // WILL FAIL — ConversationPipelineService not implemented yet
            llmQueue.add.mockResolvedValue({ id: 'llm-job' });

            // Empty transcript from STT should still chain (not crash)
            await pipelineService.onSttComplete({ transcript: '', sessionId: 'empty-transcript' });

            // Pipeline should handle gracefully — either skip or pass empty string
            // Exact behavior depends on implementation, but should NOT throw
        });
    });
});
