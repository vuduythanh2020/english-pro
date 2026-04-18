export const QUEUE_NAMES = {
    STT: 'ai-stt',
    LLM: 'ai-llm',
    TTS: 'ai-tts',
    PRONUNCIATION: 'ai-pronunciation',
} as const;

export const DEFAULT_JOB_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 1000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
};
