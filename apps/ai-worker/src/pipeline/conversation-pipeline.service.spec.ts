/**
 * RED PHASE — ATDD Scaffold: ConversationPipelineService
 * Story 3.1: AI Provider Abstraction Layer & BullMQ Pipeline
 *
 * AC covered: AC1 — BullMQ pipeline routes through STT→LLM→TTS (P0)
 * Pipeline: STT → LLM → TTS (sequential chain)
 *           Pronunciation runs in parallel with LLM (non-blocking)
 *
 * Queue Names: 'ai-stt', 'ai-llm', 'ai-tts', 'ai-pronunciation'
 */

import { ConversationPipelineService } from './conversation-pipeline.service';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../constants/queue.constants';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const createMockQueue = (name: string) => ({
    name,
    add: jest.fn(),
    getJob: jest.fn(),
});

const mockSttQueue = createMockQueue('ai-stt');
const mockLlmQueue = createMockQueue('ai-llm');
const mockTtsQueue = createMockQueue('ai-tts');
const mockPronunciationQueue = createMockQueue('ai-pronunciation');

describe('ConversationPipelineService (RED PHASE — AC1 P0)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let service: any;

    beforeEach(() => {
        void mockLogger;
        // TODO: Create NestJS test module when implemented:
        // const module = await Test.createTestingModule({
        //   providers: [
        //     ConversationPipelineService,
        //     { provide: getQueueToken(QUEUE_NAMES.STT), useValue: mockSttQueue },
        //     { provide: getQueueToken(QUEUE_NAMES.LLM), useValue: mockLlmQueue },
        //     { provide: getQueueToken(QUEUE_NAMES.TTS), useValue: mockTtsQueue },
        //     { provide: getQueueToken(QUEUE_NAMES.PRONUNCIATION), useValue: mockPronunciationQueue },
        //     { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
        //   ],
        // }).compile();
        // service = module.get<ConversationPipelineService>(ConversationPipelineService);
    });

    afterEach(() => jest.clearAllMocks());

    // --- AC1: Pipeline Routes STT → LLM → TTS ---

    it('[P0] should add job to ai-stt queue when startConversationPipeline() is called', async () => {
        // THIS TEST WILL FAIL — ConversationPipelineService not implemented yet
        const payload = {
            sessionId: 'session-pipeline-001',
            audioBuffer: Buffer.from('raw-audio').toString('base64'),
            userId: 'user-123',
            childId: 'child-456',
        };

        mockSttQueue.add.mockResolvedValue({ id: 'stt-job-001' });

        await service.startConversationPipeline(payload);

        // STT queue should receive the first job
        expect(mockSttQueue.add).toHaveBeenCalledWith(
            'stt-job',
            expect.objectContaining({
                sessionId: 'session-pipeline-001',
                audioBuffer: expect.any(String),
            }),
            expect.objectContaining({
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            }),
        );
    });

    it('[P0] should chain STT result to LLM queue via job completion event', async () => {
        // THIS TEST WILL FAIL — ConversationPipelineService not implemented yet
        // After STT completes, pipeline should automatically enqueue LLM job
        const sttResult = {
            transcript: 'Hello Max, what animals live in the ocean?',
            sessionId: 'session-chain-001',
        };

        mockLlmQueue.add.mockResolvedValue({ id: 'llm-job-001' });

        await service.onSttComplete(sttResult);

        expect(mockLlmQueue.add).toHaveBeenCalledWith(
            'llm-job',
            expect.objectContaining({
                transcript: 'Hello Max, what animals live in the ocean?',
                sessionId: 'session-chain-001',
            }),
            expect.objectContaining({ attempts: 3 }),
        );
    });

    it('[P0] should chain LLM result to TTS queue via job completion event', async () => {
        // THIS TEST WILL FAIL — ConversationPipelineService not implemented yet
        const llmResult = {
            responseText: 'Great question! Ocean animals include fish, whales, and dolphins.',
            sessionId: 'session-chain-001',
        };

        mockTtsQueue.add.mockResolvedValue({ id: 'tts-job-001' });

        await service.onLlmComplete(llmResult);

        expect(mockTtsQueue.add).toHaveBeenCalledWith(
            'tts-job',
            expect.objectContaining({
                responseText: 'Great question! Ocean animals include fish, whales, and dolphins.',
                sessionId: 'session-chain-001',
            }),
            expect.objectContaining({ attempts: 3 }),
        );
    });

    // --- Pronunciation runs in parallel (AC1) ---

    it('[P0] should enqueue pronunciation job in parallel when STT completes (non-blocking)', async () => {
        // THIS TEST WILL FAIL — ConversationPipelineService not implemented yet
        // Pronunciation should start simultaneously with LLM, not blocking the chain
        const sttResult = {
            transcript: 'Hello Max',
            audioBuffer: Buffer.from('audio').toString('base64'),
            sessionId: 'session-parallel-001',
        };

        mockLlmQueue.add.mockResolvedValue({ id: 'llm-job-001' });
        mockPronunciationQueue.add.mockResolvedValue({ id: 'pron-job-001' });

        await service.onSttComplete(sttResult);

        // Both queues should receive jobs (parallel)
        expect(mockLlmQueue.add).toHaveBeenCalled();
        expect(mockPronunciationQueue.add).toHaveBeenCalledWith(
            'pronunciation-job',
            expect.objectContaining({
                audioBuffer: expect.any(String),
                referenceText: 'Hello Max',
                sessionId: 'session-parallel-001',
            }),
            expect.any(Object),
        );
    });

    // --- Job Options (AC4 dependency) ---

    it('[P0] should use DEFAULT_JOB_OPTIONS with attempts=3 and exponential backoff for all queues', async () => {
        // THIS TEST WILL FAIL — ConversationPipelineService not implemented yet
        const payload = { sessionId: 'session-options', audioBuffer: 'base64audio' };
        mockSttQueue.add.mockResolvedValue({ id: 'job' });

        await service.startConversationPipeline(payload);

        const callArgs = mockSttQueue.add.mock.calls[0];
        const jobOptions = callArgs[2]; // 3rd arg = options
        expect(jobOptions).toMatchObject({
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
        });
    });

    // --- Pipeline Integrity ---

    it('[P1] should not enqueue LLM or TTS jobs directly from startConversationPipeline (only STT)', async () => {
        // THIS TEST WILL FAIL — ConversationPipelineService not implemented yet
        // Pipeline starts at STT only — other stages triggered by completion events
        const payload = { sessionId: 'session-start', audioBuffer: 'base64audio' };
        mockSttQueue.add.mockResolvedValue({ id: 'stt-job' });

        await service.startConversationPipeline(payload);

        expect(mockSttQueue.add).toHaveBeenCalledTimes(1);
        expect(mockLlmQueue.add).not.toHaveBeenCalled();
        expect(mockTtsQueue.add).not.toHaveBeenCalled();
    });

    it('[P1] should log pipeline start and each stage transition', async () => {
        // THIS TEST WILL FAIL — ConversationPipelineService not implemented yet
        const payload = { sessionId: 'session-log', audioBuffer: 'base64audio' };
        mockSttQueue.add.mockResolvedValue({ id: 'stt-job' });

        await service.startConversationPipeline(payload);

        expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('pipeline'),
            expect.objectContaining({ sessionId: 'session-log' }),
        );
    });
});
