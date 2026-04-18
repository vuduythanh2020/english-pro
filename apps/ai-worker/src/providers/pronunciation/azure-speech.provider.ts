import { Injectable, Logger } from '@nestjs/common';
import {
    AudioBuffer,
    ProviderHealthStatus,
    PronunciationOptions,
    PronunciationResult,
} from '@english-pro/shared-types';
import { IPronunciationProvider } from '../ai-provider.interface.js';

@Injectable()
export class AzureSpeechProvider implements IPronunciationProvider {
    readonly name = 'azure-speech';
    readonly type = 'pronunciation' as const;
    private readonly logger = new Logger(AzureSpeechProvider.name);

    async checkHealth(): Promise<ProviderHealthStatus> {
        this.logger.debug('Azure Speech health check (stub)');
        return 'healthy';
    }

    async assess(
        audio: AudioBuffer,
        referenceText: string,
        options?: PronunciationOptions,
    ): Promise<PronunciationResult> {
        this.logger.debug(
            `Azure Speech assess stub — ${audio.byteLength} bytes, ref: "${referenceText}"`,
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
            overallScore: 85,
            accuracyScore: 88,
            fluencyScore: 82,
            completenessScore: 90,
            phonemes: [
                { phoneme: 'h', accuracyScore: 95 },
                { phoneme: 'ɛ', accuracyScore: 80 },
                { phoneme: 'l', accuracyScore: 90 },
                { phoneme: 'oʊ', accuracyScore: 75 },
            ],
        };
    }
}
