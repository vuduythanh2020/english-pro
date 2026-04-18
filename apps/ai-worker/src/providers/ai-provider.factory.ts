import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    IAiProvider,
    ISttProvider,
    ILlmProvider,
    ITtsProvider,
    IPronunciationProvider,
    PROVIDER_TOKENS,
} from './ai-provider.interface.js';
import { OpenAiProvider } from './llm/openai.provider.js';
import { GeminiProvider } from './llm/gemini.provider.js';
import { GoogleSpeechProvider } from './stt/google-speech.provider.js';
import { WhisperProvider } from './stt/whisper.provider.js';
import { GoogleTtsProvider } from './tts/google-tts.provider.js';
import { ElevenLabsProvider } from './tts/elevenlabs.provider.js';
import { AzureSpeechProvider } from './pronunciation/azure-speech.provider.js';

@Injectable()
export class AiProviderFactory {
    private readonly logger = new Logger(AiProviderFactory.name);

    private readonly sttProviders: Map<string, ISttProvider>;
    private readonly llmProviders: Map<string, ILlmProvider>;
    private readonly ttsProviders: Map<string, ITtsProvider>;
    private readonly pronunciationProviders: Map<string, IPronunciationProvider>;

    constructor(
        private readonly config: ConfigService,
        private readonly openAi: OpenAiProvider,
        private readonly gemini: GeminiProvider,
        private readonly googleSpeech: GoogleSpeechProvider,
        private readonly whisper: WhisperProvider,
        private readonly googleTts: GoogleTtsProvider,
        private readonly elevenLabs: ElevenLabsProvider,
        private readonly azureSpeech: AzureSpeechProvider,
    ) {
        this.sttProviders = new Map<string, ISttProvider>([
            ['google-speech', this.googleSpeech],
            ['whisper', this.whisper],
        ]);
        this.llmProviders = new Map<string, ILlmProvider>([
            ['openai', this.openAi],
            ['gemini', this.gemini],
        ]);
        this.ttsProviders = new Map<string, ITtsProvider>([
            ['google-tts', this.googleTts],
            ['elevenlabs', this.elevenLabs],
        ]);
        this.pronunciationProviders = new Map<string, IPronunciationProvider>([
            ['azure-speech', this.azureSpeech],
        ]);
    }

    getSttProvider(): ISttProvider {
        const name =
            this.config.get<string>('aiProviders.stt.primary') || 'google-speech';
        const provider = this.sttProviders.get(name);
        if (!provider) {
            throw new Error(`Unknown STT provider: ${name}`);
        }
        this.logger.debug(`Resolved STT provider: ${name}`);
        return provider;
    }

    getLlmProvider(): ILlmProvider {
        const name =
            this.config.get<string>('aiProviders.llm.primary') || 'openai';
        const provider = this.llmProviders.get(name);
        if (!provider) {
            throw new Error(`Unknown LLM provider: ${name}`);
        }
        this.logger.debug(`Resolved LLM provider: ${name}`);
        return provider;
    }

    getTtsProvider(): ITtsProvider {
        const name =
            this.config.get<string>('aiProviders.tts.primary') || 'google-tts';
        const provider = this.ttsProviders.get(name);
        if (!provider) {
            throw new Error(`Unknown TTS provider: ${name}`);
        }
        this.logger.debug(`Resolved TTS provider: ${name}`);
        return provider;
    }

    getPronunciationProvider(): IPronunciationProvider {
        const name =
            this.config.get<string>('aiProviders.pronunciation.primary') ||
            'azure-speech';
        const provider = this.pronunciationProviders.get(name);
        if (!provider) {
            throw new Error(`Unknown Pronunciation provider: ${name}`);
        }
        this.logger.debug(`Resolved Pronunciation provider: ${name}`);
        return provider;
    }

    getAllProviders(): IAiProvider[] {
        return [
            ...this.sttProviders.values(),
            ...this.llmProviders.values(),
            ...this.ttsProviders.values(),
            ...this.pronunciationProviders.values(),
        ];
    }
}
