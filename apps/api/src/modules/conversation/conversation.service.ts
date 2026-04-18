import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SttJobPayload } from '@english-pro/shared-types';

const QUEUE_NAME_STT = 'ai-stt';

const DEFAULT_JOB_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 1000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
};

@Injectable()
export class ConversationService {
    private readonly logger = new Logger(ConversationService.name);

    constructor(
        @InjectQueue(QUEUE_NAME_STT) private readonly sttQueue: Queue,
    ) { }

    async enqueueConversation(payload: SttJobPayload): Promise<string> {
        this.logger.log(
            `Enqueueing conversation for session ${payload.sessionId}`,
        );

        const job = await this.sttQueue.add(
            'transcribe',
            payload,
            DEFAULT_JOB_OPTIONS,
        );

        this.logger.log(
            `STT job ${job.id} enqueued for session ${payload.sessionId}`,
        );
        return job.id!;
    }
}
