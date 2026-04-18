import { Injectable, Logger } from '@nestjs/common';
import {
    AudioBuffer,
    ProviderHealthStatus,
    LlmOptions,
    LlmResult,
    ConversationMessage,
} from '@english-pro/shared-types';
import { ILlmProvider } from '../ai-provider.interface.js';

@Injectable()
export class OpenAiProvider implements ILlmProvider {
    readonly name = 'openai';
    readonly type = 'llm' as const;
    private readonly logger = new Logger(OpenAiProvider.name);

    async checkHealth(): Promise<ProviderHealthStatus> {
        this.logger.debug('OpenAI health check (stub)');
        return 'healthy';
    }

    async generateResponse(
        messages: ConversationMessage[],
        options?: LlmOptions,
    ): Promise<LlmResult> {
        this.logger.debug(
            `OpenAI generateResponse stub — ${messages.length} messages`,
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
            text: 'This is a stub response from OpenAI provider.',
            tokensUsed: 42,
            model: options?.model || 'gpt-4o-mini',
            finishReason: 'stop',
        };
    }
}
