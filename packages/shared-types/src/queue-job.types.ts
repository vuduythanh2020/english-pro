export interface QueueJobPayload {
    jobType: 'stt' | 'llm' | 'tts' | 'pronunciation';
    sessionId: string;
    childId: string;
    data: Record<string, unknown>;
}
