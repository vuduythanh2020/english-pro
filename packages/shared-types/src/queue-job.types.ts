/** Generic queue job payload — base type */
export interface QueueJobPayload {
    jobType: 'stt' | 'llm' | 'tts' | 'pronunciation';
    sessionId: string;
    childId?: string;
    data: Record<string, unknown>;
}

/** STT job payload */
export interface SttJobPayload {
    sessionId: string;
    userId?: string;
    childId?: string;
    /** Base64-encoded audio data */
    audioBuffer: string;
    languageCode?: string;
}

/** LLM job payload (receives STT result) */
export interface LlmJobPayload {
    sessionId: string;
    userId?: string;
    childId?: string;
    /** Transcribed text from STT stage */
    transcript: string;
    /** Prior conversation for context */
    conversationHistory?: Array<{ role: string; content: string }>;
}

/** TTS job payload (receives LLM result) */
export interface TtsJobPayload {
    sessionId: string;
    userId?: string;
    childId?: string;
    /** AI-generated response text */
    responseText: string;
    voiceOptions?: {
        voice?: string;
        voiceId?: string;
        speed?: number;
        languageCode?: string;
    };
}

/** Pronunciation job payload (parallel to LLM) */
export interface PronunciationJobPayload {
    sessionId: string;
    userId?: string;
    childId?: string;
    /** Base64-encoded audio data */
    audioBuffer: string;
    /** The transcript from STT — used as reference text */
    referenceText: string;
    locale?: string;
}
