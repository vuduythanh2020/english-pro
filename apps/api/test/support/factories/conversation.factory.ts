// test/support/factories/conversation.factory.ts
// Factory for ConversationScenario and ConversationSession test data

let scenarioCounter = 0;
let sessionCounter = 0;

function nextScenarioId(): string {
    scenarioCounter++;
    return `00000000-0000-4000-c000-${String(scenarioCounter).padStart(12, '0')}`;
}

function nextSessionId(): string {
    sessionCounter++;
    return `00000000-0000-4000-d000-${String(sessionCounter).padStart(12, '0')}`;
}

export interface ConversationScenarioFactoryInput {
    id?: string;
    title?: string;
    description?: string;
    level?: string;
    topicBoundaries?: Record<string, unknown>;
    maxTurns?: number;
    promptTemplate?: string;
    thumbnailUrl?: string | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export function conversationScenarioFactory(
    input?: ConversationScenarioFactoryInput,
) {
    const id = input?.id ?? nextScenarioId();
    const now = new Date();

    return {
        id,
        title: input?.title ?? `Scenario ${id.slice(-4)}`,
        description:
            input?.description ?? 'A test conversation scenario for kids',
        level: input?.level ?? 'beginner',
        topicBoundaries: input?.topicBoundaries ?? {
            allowed: ['greetings', 'animals'],
        },
        maxTurns: input?.maxTurns ?? 10,
        promptTemplate:
            input?.promptTemplate ??
            'You are a friendly English teacher for Vietnamese kids.',
        thumbnailUrl: input?.thumbnailUrl ?? null,
        isActive: input?.isActive ?? true,
        createdAt: input?.createdAt ?? now,
        updatedAt: input?.updatedAt ?? now,
    };
}

export interface ConversationSessionFactoryInput {
    id?: string;
    childId?: string;
    scenarioId?: string;
    status?: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    durationSeconds?: number;
    wordsSpoken?: number;
    xpEarned?: number;
    hintsUsed?: number;
    summaryText?: string | null;
    startedAt?: Date;
    endedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export function conversationSessionFactory(
    input?: ConversationSessionFactoryInput,
) {
    const id = input?.id ?? nextSessionId();
    const now = new Date();

    return {
        id,
        childId:
            input?.childId ?? '00000000-0000-4000-b000-000000000001',
        scenarioId:
            input?.scenarioId ?? '00000000-0000-4000-c000-000000000001',
        status: input?.status ?? 'ACTIVE',
        durationSeconds: input?.durationSeconds ?? 0,
        wordsSpoken: input?.wordsSpoken ?? 0,
        xpEarned: input?.xpEarned ?? 0,
        hintsUsed: input?.hintsUsed ?? 0,
        summaryText: input?.summaryText ?? null,
        startedAt: input?.startedAt ?? now,
        endedAt: input?.endedAt ?? null,
        createdAt: input?.createdAt ?? now,
        updatedAt: input?.updatedAt ?? now,
    };
}

export function resetConversationFactories(): void {
    scenarioCounter = 0;
    sessionCounter = 0;
}
