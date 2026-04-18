import { Module } from '@nestjs/common';
import { OpenAiProvider } from './llm/openai.provider.js';
import { GeminiProvider } from './llm/gemini.provider.js';
import { GoogleSpeechProvider } from './stt/google-speech.provider.js';
import { WhisperProvider } from './stt/whisper.provider.js';
import { GoogleTtsProvider } from './tts/google-tts.provider.js';
import { ElevenLabsProvider } from './tts/elevenlabs.provider.js';
import { AzureSpeechProvider } from './pronunciation/azure-speech.provider.js';
import { AiProviderFactory } from './ai-provider.factory.js';

const providers = [
    OpenAiProvider,
    GeminiProvider,
    GoogleSpeechProvider,
    WhisperProvider,
    GoogleTtsProvider,
    ElevenLabsProvider,
    AzureSpeechProvider,
    AiProviderFactory,
];

@Module({
    providers,
    exports: [AiProviderFactory],
})
export class ProvidersModule { }
