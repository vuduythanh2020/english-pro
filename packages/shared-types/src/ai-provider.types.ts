/** Represents raw binary audio data — Buffer in Node.js, Uint8Array in browser */
export type AudioBuffer = Uint8Array;

/** Health status of an AI provider */
export type ProviderHealthStatus = 'healthy' | 'degraded' | 'unavailable';

/** Configuration for an AI provider (legacy — used for config-driven setup) */
export interface AiProviderConfig {
    type: 'llm' | 'stt' | 'tts' | 'pronunciation';
    provider: string;
    apiKey: string;
    endpoint?: string;
}

// ─────────────────────────────────────────────────────────
// STT (Speech-to-Text) Types
// ─────────────────────────────────────────────────────────

export interface SttOptions {
    languageCode?: string;
    model?: string;
    encoding?: string;
    sampleRateHertz?: number;
}

export interface SttResult {
    transcript: string;
    confidence: number;
    languageCode: string;
    words?: Array<{ word: string; startTime: number; endTime: number }>;
}

export interface SttProvider {
    readonly name: string;
    readonly type: 'stt';
    checkHealth(): Promise<ProviderHealthStatus>;
    transcribe(audio: AudioBuffer, options: SttOptions): Promise<SttResult>;
}

// ─────────────────────────────────────────────────────────
// LLM (Large Language Model) Types
// ─────────────────────────────────────────────────────────

export interface LlmOptions {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
    model?: string;
}

export interface LlmResult {
    text: string;
    tokensUsed: number;
    model: string;
    finishReason?: string;
}

export interface LlmProvider {
    readonly name: string;
    readonly type: 'llm';
    checkHealth(): Promise<ProviderHealthStatus>;
    generateResponse(messages: import('./conversation.types').ConversationMessage[], options: LlmOptions): Promise<LlmResult>;
}

// ─────────────────────────────────────────────────────────
// TTS (Text-to-Speech) Types
// ─────────────────────────────────────────────────────────

export interface TtsOptions {
    voice?: string;
    voiceId?: string;
    speed?: number;
    languageCode?: string;
    audioFormat?: 'mp3' | 'wav' | 'ogg';
}

export interface TtsProvider {
    readonly name: string;
    readonly type: 'tts';
    checkHealth(): Promise<ProviderHealthStatus>;
    synthesize(text: string, options: TtsOptions): Promise<AudioBuffer>;
}

// ─────────────────────────────────────────────────────────
// Pronunciation Assessment Types
// ─────────────────────────────────────────────────────────

export interface PronunciationOptions {
    locale?: string;
    granularity?: 'phoneme' | 'word' | 'fullText';
    enableMiscue?: boolean;
}

export interface PhonemeScore {
    phoneme: string;
    accuracyScore: number;
    offset?: number;
    duration?: number;
}

export interface PronunciationResult {
    overallScore: number;
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    phonemes: PhonemeScore[];
    words?: Array<{ word: string; accuracyScore: number; errorType?: string }>;
}

export interface PronunciationProvider {
    readonly name: string;
    readonly type: 'pronunciation';
    checkHealth(): Promise<ProviderHealthStatus>;
    assess(audio: AudioBuffer, referenceText: string, options: PronunciationOptions): Promise<PronunciationResult>;
}
