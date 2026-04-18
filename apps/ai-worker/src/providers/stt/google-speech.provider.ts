import { Injectable, Logger } from '@nestjs/common';
import {
    AudioBuffer,
    ProviderHealthStatus,
    SttOptions,
    SttResult,
} from '@english-pro/shared-types';
import { ISttProvider } from '../ai-provider.interface.js';

@Injectable()
export class GoogleSpeechProvider implements ISttProvider {
    readonly name = 'google-speech';
    readonly type = 'stt' as const;
    private readonly logger = new Logger(GoogleSpeechProvider.name);

    async checkHealth(): Promise<ProviderHealthStatus> {
        this.logger.debug('Google Speech health check (stub)');
        return 'healthy';
    }

    async transcribe(
        audio: AudioBuffer,
        options?: SttOptions,
    ): Promise<SttResult> {
        this.logger.debug(
            `Google Speech transcribe stub — ${audio.byteLength} bytes`,
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
            transcript: 'This is a stub transcription from Google Speech.',
            confidence: 0.95,
            languageCode: options?.languageCode || 'en-US',
        };
    }
}
