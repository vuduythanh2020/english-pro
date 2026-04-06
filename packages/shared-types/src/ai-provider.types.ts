export interface AiProviderConfig {
    type: 'llm' | 'stt' | 'tts' | 'pronunciation';
    provider: string;
    apiKey: string;
    endpoint?: string;
}
