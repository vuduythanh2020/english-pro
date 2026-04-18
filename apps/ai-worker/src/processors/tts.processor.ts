import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TtsJobPayload } from '@english-pro/shared-types';
import { AiProviderFactory } from '../providers/ai-provider.factory.js';
import { QUEUE_NAMES } from '../config/queue.constants.js';

@Processor(QUEUE_NAMES.TTS)
export class TtsProcessor extends WorkerHost {
    private readonly logger = new Logger(TtsProcessor.name);

    constructor(private readonly providerFactory: AiProviderFactory) {
        super();
    }

    async process(job: Job<TtsJobPayload>): Promise<{ audioBase64: string }> {
        this.logger.log(`Processing TTS job ${job.id} for session ${job.data.sessionId}`);

        const { responseText, voiceOptions } = job.data;
        if (!responseText) {
            throw new Error('Missing responseText in TTS job data');
        }
        const provider = this.providerFactory.getTtsProvider();
        const audioBuffer = await provider.synthesize(responseText, voiceOptions);

        const audioBase64 = Buffer.from(audioBuffer).toString('base64');
        this.logger.log(`TTS job ${job.id} completed — ${audioBase64.length} base64 chars`);
        return { audioBase64 };
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        this.logger.error(
            `TTS job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
            error.stack,
        );
    }
}
