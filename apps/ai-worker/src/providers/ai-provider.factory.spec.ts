/**
 * RED PHASE — ATDD Scaffold: AiProviderFactory
 * Story 3.1: AI Provider Abstraction Layer & BullMQ Pipeline
 *
 * Tests are skipped (TDD red phase). Activate by removing `x` prefix when implementing.
 * AC covered: AC2 — factory loads correct provider per config (P0)
 *
 * Config structure (from ai-providers.config.ts):
 *   aiProviders.llm.primary = 'openai' | 'gemini'
 *   aiProviders.stt.primary = 'google-speech' | 'whisper'
 *   aiProviders.tts.primary = 'google-tts' | 'elevenlabs'
 *   aiProviders.pronunciation.primary = 'azure-speech'
 */

import { AiProviderFactory } from './ai-provider.factory'; // Uncomment when implemented
import { OpenAiProvider } from './llm/openai.provider';
import { GeminiProvider } from './llm/gemini.provider';
import { GoogleSpeechProvider } from './stt/google-speech.provider';
import { WhisperProvider } from './stt/whisper.provider';
import { GoogleTtsProvider } from './tts/google-tts.provider';
import { ElevenLabsProvider } from './tts/elevenlabs.provider';
import { AzureSpeechProvider } from './pronunciation/azure-speech.provider';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

describe('AiProviderFactory (RED PHASE — AC2 P0)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let factory: any;

    // Mocked providers
    const mockOpenAiProvider = { name: 'openai', type: 'llm', checkHealth: jest.fn(), generateResponse: jest.fn() };
    const mockGeminiProvider = { name: 'gemini', type: 'llm', checkHealth: jest.fn(), generateResponse: jest.fn() };
    const mockGoogleSpeechProvider = { name: 'google-speech', type: 'stt', checkHealth: jest.fn(), transcribe: jest.fn() };
    const mockWhisperProvider = { name: 'whisper', type: 'stt', checkHealth: jest.fn(), transcribe: jest.fn() };
    const mockGoogleTtsProvider = { name: 'google-tts', type: 'tts', checkHealth: jest.fn(), synthesize: jest.fn() };
    const mockElevenLabsProvider = { name: 'elevenlabs', type: 'tts', checkHealth: jest.fn(), synthesize: jest.fn() };
    const mockAzureSpeechProvider = { name: 'azure-speech', type: 'pronunciation', checkHealth: jest.fn(), assess: jest.fn() };

    beforeEach(() => {
        void mockLogger;
        // TODO: Create NestJS test module with AiProviderFactory and all providers when implemented
        // const module = await Test.createTestingModule({
        //   providers: [
        //     AiProviderFactory,
        //     { provide: OpenAiProvider, useValue: mockOpenAiProvider },
        //     { provide: GeminiProvider, useValue: mockGeminiProvider },
        //     { provide: GoogleSpeechProvider, useValue: mockGoogleSpeechProvider },
        //     { provide: WhisperProvider, useValue: mockWhisperProvider },
        //     { provide: GoogleTtsProvider, useValue: mockGoogleTtsProvider },
        //     { provide: ElevenLabsProvider, useValue: mockElevenLabsProvider },
        //     { provide: AzureSpeechProvider, useValue: mockAzureSpeechProvider },
        //     {
        //       provide: ConfigService,
        //       useValue: {
        //         get: jest.fn((key) => {
        //           const cfg = {
        //             'aiProviders.llm.primary': 'openai',
        //             'aiProviders.stt.primary': 'google-speech',
        //             'aiProviders.tts.primary': 'google-tts',
        //             'aiProviders.pronunciation.primary': 'azure-speech',
        //           };
        //           return cfg[key];
        //         }),
        //       },
        //     },
        //     { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
        //   ],
        // }).compile();
        // factory = module.get<AiProviderFactory>(AiProviderFactory);
    });

    afterEach(() => jest.clearAllMocks());

    // --- LLM Provider Selection (AC2) ---

    it('[P0] should return OpenAiProvider when config.aiProviders.llm.primary = "openai"', () => {
        // THIS TEST WILL FAIL — AiProviderFactory not implemented yet
        const provider = factory.getLlmProvider();
        expect(provider.name).toBe('openai');
        expect(provider.type).toBe('llm');
    });

    it('[P0] should return GeminiProvider when config.aiProviders.llm.primary = "gemini"', () => {
        // THIS TEST WILL FAIL — AiProviderFactory not implemented yet
        // Configure with gemini as primary
        const provider = factory.getLlmProvider();
        expect(provider.name).toBe('gemini');
    });

    // --- STT Provider Selection (AC2) ---

    it('[P0] should return GoogleSpeechProvider when config.aiProviders.stt.primary = "google-speech"', () => {
        // THIS TEST WILL FAIL — AiProviderFactory not implemented yet
        const provider = factory.getSttProvider();
        expect(provider.name).toBe('google-speech');
        expect(provider.type).toBe('stt');
    });

    it('[P0] should return WhisperProvider when config.aiProviders.stt.primary = "whisper"', () => {
        // THIS TEST WILL FAIL — AiProviderFactory not implemented yet
        const provider = factory.getSttProvider();
        expect(provider.name).toBe('whisper');
    });

    // --- TTS Provider Selection (AC2) ---

    it('[P0] should return GoogleTtsProvider when config.aiProviders.tts.primary = "google-tts"', () => {
        // THIS TEST WILL FAIL — AiProviderFactory not implemented yet
        const provider = factory.getTtsProvider();
        expect(provider.name).toBe('google-tts');
        expect(provider.type).toBe('tts');
    });

    it('[P0] should return ElevenLabsProvider when config.aiProviders.tts.primary = "elevenlabs"', () => {
        // THIS TEST WILL FAIL — AiProviderFactory not implemented yet
        const provider = factory.getTtsProvider();
        expect(provider.name).toBe('elevenlabs');
    });

    // --- Pronunciation Provider Selection (AC2) ---

    it('[P0] should return AzureSpeechProvider when config.aiProviders.pronunciation.primary = "azure-speech"', () => {
        // THIS TEST WILL FAIL — AiProviderFactory not implemented yet
        const provider = factory.getPronunciationProvider();
        expect(provider.name).toBe('azure-speech');
        expect(provider.type).toBe('pronunciation');
    });

    // --- All Providers Health (AC5 partial) ---

    it('[P1] should return all providers for health check aggregation', () => {
        // THIS TEST WILL FAIL — AiProviderFactory not implemented yet
        const providers = factory.getAllProviders();
        expect(providers).toHaveLength(4); // llm, stt, tts, pronunciation
        const types = providers.map((p: unknown) => (p as { type: string }).type);
        expect(types).toContain('llm');
        expect(types).toContain('stt');
        expect(types).toContain('tts');
        expect(types).toContain('pronunciation');
    });

    // --- OCP: No code change needed (AC3) ---

    it('[P1] should throw clear error when unknown provider name is configured', () => {
        // THIS TEST WILL FAIL — AiProviderFactory not implemented yet
        // This validates that factory has a known provider registry and throws on unknown
        expect(() => factory.getLlmProvider('unknown-provider')).toThrow();
    });

    // --- NestJS DI Usage (no manual new) ---

    it('[P1] should use NestJS DI (providers injected, not manually instantiated)', () => {
        // THIS TEST WILL FAIL — AiProviderFactory not implemented yet
        // Validate that factory is an @Injectable() with injected dependencies
        // (factory instance should exist from module.get(), not new Factory())
        expect(factory).toBeDefined();
        // Indirect check: providers should be the mocked instances from DI
        const llmProvider = factory.getLlmProvider();
        expect(llmProvider).toBe(mockOpenAiProvider); // same reference via DI
    });
});
