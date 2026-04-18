import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PronunciationJobPayload, PronunciationResult } from '@english-pro/shared-types';
import { AiProviderFactory } from '../providers/ai-provider.factory.js';
import { QUEUE_NAMES } from '../config/queue.constants.js';

@Processor(QUEUE_NAMES.PRONUNCIATION)
export class PronunciationProcessor extends WorkerHost {
    private readonly logger = new Logger(PronunciationProcessor.name);

    constructor(private readonly providerFactory: AiProviderFactory) {
        super();
    }

    async process(job: Job<PronunciationJobPayload>): Promise<PronunciationResult> {
        this.logger.log(`Processing Pronunciation job ${job.id} for session ${job.data.sessionId}`);

        const { audioBuffer, referenceText, locale } = job.data;
        if (!audioBuffer || !referenceText) {
            throw new Error('Missing audioBuffer or referenceText in Pronunciation job data');
        }

        const provider = this.providerFactory.getPronunciationProvider();
        const audio = Uint8Array.from(Buffer.from(audioBuffer, 'base64'));
        const result = await provider.assess(audio, referenceText, { locale });

        this.logger.log(`Pronunciation job ${job.id} completed — score: ${result.overallScore}`);
        return result;
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        this.logger.error(
            `Pronunciation job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
            error.stack,
        );
    }
}
