import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    SttJobPayload,
    LlmJobPayload,
    TtsJobPayload,
    PronunciationJobPayload,
} from '@english-pro/shared-types';
import { QUEUE_NAMES, DEFAULT_JOB_OPTIONS } from '../config/queue.constants.js';

@Injectable()
export class ConversationPipelineService {
    private readonly logger = new Logger(ConversationPipelineService.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.STT) private readonly sttQueue: Queue,
        @InjectQueue(QUEUE_NAMES.LLM) private readonly llmQueue: Queue,
        @InjectQueue(QUEUE_NAMES.TTS) private readonly ttsQueue: Queue,
        @InjectQueue(QUEUE_NAMES.PRONUNCIATION)
        private readonly pronunciationQueue: Queue,
    ) { }

    async startConversationPipeline(payload: SttJobPayload): Promise<string> {
        this.logger.log(`Starting pipeline for session ${payload.sessionId}`);

        const job = await this.sttQueue.add(
            'transcribe',
            payload,
            DEFAULT_JOB_OPTIONS,
        );

        this.logger.log(`STT job ${job.id} enqueued for session ${payload.sessionId}`);
        return job.id!;
    }

    async chainSttToLlm(
        sessionId: string,
        transcript: string,
        conversationHistory?: Array<{ role: string; content: string }>,
    ): Promise<string> {
        this.logger.log(`Chaining STT→LLM for session ${sessionId}`);

        const payload: LlmJobPayload = {
            sessionId,
            transcript,
            conversationHistory,
        };
        const job = await this.llmQueue.add(
            'generate',
            payload,
            DEFAULT_JOB_OPTIONS,
        );

        this.logger.log(`LLM job ${job.id} enqueued for session ${sessionId}`);
        return job.id!;
    }

    async chainLlmToTts(
        sessionId: string,
        responseText: string,
        voiceOptions?: { voice?: string; speed?: number; languageCode?: string },
    ): Promise<string> {
        this.logger.log(`Chaining LLM→TTS for session ${sessionId}`);

        const payload: TtsJobPayload = {
            sessionId,
            responseText,
            voiceOptions,
        };
        const job = await this.ttsQueue.add(
            'synthesize',
            payload,
            DEFAULT_JOB_OPTIONS,
        );

        this.logger.log(`TTS job ${job.id} enqueued for session ${sessionId}`);
        return job.id!;
    }

    async enqueuePronunciation(
        sessionId: string,
        audioBuffer: string,
        referenceText: string,
        locale?: string,
    ): Promise<string> {
        this.logger.log(`Enqueueing pronunciation assessment for session ${sessionId} (parallel)`);

        const payload: PronunciationJobPayload = {
            sessionId,
            audioBuffer,
            referenceText,
            locale,
        };
        const job = await this.pronunciationQueue.add(
            'assess',
            payload,
            DEFAULT_JOB_OPTIONS,
        );

        this.logger.log(`Pronunciation job ${job.id} enqueued for session ${sessionId}`);
        return job.id!;
    }
}
