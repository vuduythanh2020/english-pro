import {
    AudioBuffer,
    ProviderHealthStatus,
    SttOptions,
    SttResult,
    LlmOptions,
    LlmResult,
    TtsOptions,
    PronunciationOptions,
    PronunciationResult,
    ConversationMessage,
} from '@english-pro/shared-types';

export interface IAiProvider {
    readonly name: string;
    checkHealth(): Promise<ProviderHealthStatus>;
}

export interface ISttProvider extends IAiProvider {
    readonly type: 'stt';
    transcribe(audio: AudioBuffer, options?: SttOptions): Promise<SttResult>;
}

export interface ILlmProvider extends IAiProvider {
    readonly type: 'llm';
    generateResponse(
        messages: ConversationMessage[],
        options?: LlmOptions,
    ): Promise<LlmResult>;
}

export interface ITtsProvider extends IAiProvider {
    readonly type: 'tts';
    synthesize(text: string, options?: TtsOptions): Promise<AudioBuffer>;
}

export interface IPronunciationProvider extends IAiProvider {
    readonly type: 'pronunciation';
    assess(
        audio: AudioBuffer,
        referenceText: string,
        options?: PronunciationOptions,
    ): Promise<PronunciationResult>;
}

export const PROVIDER_TOKENS = {
    OPENAI: 'OPENAI_PROVIDER',
    GEMINI: 'GEMINI_PROVIDER',
    GOOGLE_SPEECH: 'GOOGLE_SPEECH_PROVIDER',
    WHISPER: 'WHISPER_PROVIDER',
    GOOGLE_TTS: 'GOOGLE_TTS_PROVIDER',
    ELEVENLABS: 'ELEVENLABS_PROVIDER',
    AZURE_SPEECH: 'AZURE_SPEECH_PROVIDER',
} as const;
