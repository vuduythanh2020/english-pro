import { Injectable, Logger } from '@nestjs/common';
import {
    ProviderHealthStatus,
    LlmOptions,
    LlmResult,
    ConversationMessage,
} from '@english-pro/shared-types';
import { ILlmProvider } from '../ai-provider.interface.js';

@Injectable()
export class GeminiProvider implements ILlmProvider {
    readonly name = 'gemini';
    readonly type = 'llm' as const;
    private readonly logger = new Logger(GeminiProvider.name);

    async checkHealth(): Promise<ProviderHealthStatus> {
        this.logger.debug('Gemini health check (stub)');
        return 'healthy';
    }

    async generateResponse(
        messages: ConversationMessage[],
        options?: LlmOptions,
    ): Promise<LlmResult> {
        this.logger.debug(
            `Gemini generateResponse stub — ${messages.length} messages`,
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
            text: 'This is a stub response from Gemini provider.',
            tokensUsed: 38,
            model: options?.model || 'gemini-pro',
            finishReason: 'stop',
        };
    }
}
