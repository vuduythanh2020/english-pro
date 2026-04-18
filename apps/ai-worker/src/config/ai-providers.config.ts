import { registerAs } from '@nestjs/config';

export const aiProvidersConfig = registerAs('aiProviders', () => ({
    llm: {
        primary: process.env.AI_LLM_PRIMARY || 'openai',
        secondary: process.env.AI_LLM_SECONDARY || 'gemini',
    },
    stt: {
        primary: process.env.AI_STT_PRIMARY || 'google-speech',
        secondary: process.env.AI_STT_SECONDARY || 'whisper',
    },
    tts: {
        primary: process.env.AI_TTS_PRIMARY || 'google-tts',
        secondary: process.env.AI_TTS_SECONDARY || 'elevenlabs',
    },
    pronunciation: {
        primary: process.env.AI_PRONUNCIATION_PRIMARY || 'azure-speech',
        secondary: null, // graceful degradation only — no secondary
    },
}));
