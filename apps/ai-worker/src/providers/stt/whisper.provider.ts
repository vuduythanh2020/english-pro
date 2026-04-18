import { Injectable, Logger } from '@nestjs/common';
import {
    AudioBuffer,
    ProviderHealthStatus,
    SttOptions,
    SttResult,
} from '@english-pro/shared-types';
import { ISttProvider } from '../ai-provider.interface.js';

@Injectable()
export class WhisperProvider implements ISttProvider {
    readonly name = 'whisper';
    readonly type = 'stt' as const;
    private readonly logger = new Logger(WhisperProvider.name);

    async checkHealth(): Promise<ProviderHealthStatus> {
        this.logger.debug('Whisper health check (stub)');
        return 'healthy';
    }

    async transcribe(
        audio: AudioBuffer,
        options?: SttOptions,
    ): Promise<SttResult> {
        this.logger.debug(`Whisper transcribe stub — ${audio.byteLength} bytes`);
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
            transcript: 'This is a stub transcription from Whisper.',
            confidence: 0.92,
            languageCode: options?.languageCode || 'en-US',
        };
    }
}
