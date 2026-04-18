import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LlmJobPayload, LlmResult } from '@english-pro/shared-types';
import type { ConversationMessage } from '@english-pro/shared-types';
import { AiProviderFactory } from '../providers/ai-provider.factory.js';
import { QUEUE_NAMES } from '../config/queue.constants.js';

@Processor(QUEUE_NAMES.LLM)
export class LlmProcessor extends WorkerHost {
    private readonly logger = new Logger(LlmProcessor.name);

    constructor(private readonly providerFactory: AiProviderFactory) {
        super();
    }

    async process(job: Job<LlmJobPayload>): Promise<LlmResult> {
        this.logger.log(`Processing LLM job ${job.id} for session ${job.data.sessionId}`);

        const { transcript, conversationHistory } = job.data;
        const history: ConversationMessage[] = (conversationHistory || []).map((m) => ({
            role: m.role as ConversationMessage['role'],
            content: m.content,
            timestamp: new Date().toISOString(),
        }));
        const messages: ConversationMessage[] = [
            ...history,
            { role: 'user', content: transcript, timestamp: new Date().toISOString() },
        ];

        const provider = this.providerFactory.getLlmProvider();
        const result = await provider.generateResponse(messages, {});

        this.logger.log(`LLM job ${job.id} completed — ${result.tokensUsed} tokens`);
        return result;
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        this.logger.error(
            `LLM job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
            error.stack,
        );
    }
}
