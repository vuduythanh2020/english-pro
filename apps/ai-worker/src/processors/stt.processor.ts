import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SttJobPayload } from '@english-pro/shared-types';
import { AiProviderFactory } from '../providers/ai-provider.factory.js';
import { QUEUE_NAMES } from '../config/queue.constants.js';

@Processor(QUEUE_NAMES.STT)
export class SttProcessor extends WorkerHost {
    private readonly logger = new Logger(SttProcessor.name);

    constructor(private readonly providerFactory: AiProviderFactory) {
        super();
    }

    async process(job: Job<SttJobPayload>): Promise<{ transcript: string; confidence: number; languageCode: string }> {
        this.logger.log(`Processing STT job ${job.id} for session ${job.data.sessionId}`);

        const { audioBuffer, languageCode } = job.data;
        if (!audioBuffer) {
            throw new Error('Missing audioBuffer in STT job data');
        }

        const provider = this.providerFactory.getSttProvider();
        const audio = Uint8Array.from(Buffer.from(audioBuffer, 'base64'));
        const result = await provider.transcribe(audio, { languageCode });

        this.logger.log(`STT job ${job.id} completed — transcript length: ${result.transcript.length}`);
        return result;
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        this.logger.error(
            `STT job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
            error.stack,
        );
    }
}
