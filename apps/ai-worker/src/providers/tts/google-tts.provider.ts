import { Injectable, Logger } from '@nestjs/common';
import {
    AudioBuffer,
    ProviderHealthStatus,
    TtsOptions,
} from '@english-pro/shared-types';
import { ITtsProvider } from '../ai-provider.interface.js';

@Injectable()
export class GoogleTtsProvider implements ITtsProvider {
    readonly name = 'google-tts';
    readonly type = 'tts' as const;
    private readonly logger = new Logger(GoogleTtsProvider.name);

    async checkHealth(): Promise<ProviderHealthStatus> {
        this.logger.debug('Google TTS health check (stub)');
        return 'healthy';
    }

    async synthesize(text: string, options?: TtsOptions): Promise<AudioBuffer> {
        this.logger.debug(`Google TTS synthesize stub — ${text.length} chars`);
        await new Promise((resolve) => setTimeout(resolve, 100));
        return new Uint8Array([0x52, 0x49, 0x46, 0x46]); // RIFF header stub
    }
}
