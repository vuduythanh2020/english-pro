import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChildProfileDataDto {
    @ApiProperty({ description: 'Child profile UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
    id!: string;

    @ApiProperty({ description: 'Display name of the child', example: 'Bé Minh' })
    name!: string;

    @ApiProperty({ description: 'Avatar ID (1–8)', example: 1 })
    avatar!: number;

    @ApiPropertyOptional({ description: 'Age of the child', example: 7, nullable: true })
    age!: number | null;

    @ApiProperty({ description: 'When the profile was created', example: '2026-01-15T00:00:00.000Z' })
    createdAt!: Date;
}

export class ConversationSessionDataDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
    id!: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
    scenarioId!: string;

    @ApiProperty({ example: 'COMPLETED' })
    status!: string;

    @ApiProperty({ example: 300 })
    durationSeconds!: number;

    @ApiProperty({ example: 45 })
    wordsSpoken!: number;

    @ApiProperty({ example: 50 })
    xpEarned!: number;

    @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
    createdAt!: Date;
}

export class LearningProgressDataDto {
    @ApiProperty({ description: 'Total number of conversation sessions', example: 12 })
    totalSessions!: number;

    @ApiProperty({ description: 'Recent sessions (up to 50)', type: [ConversationSessionDataDto] })
    sessions!: ConversationSessionDataDto[];
}

export class PronunciationScoreDataDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
    sessionId!: string;

    @ApiProperty({ example: 'hello' })
    word!: string;

    @ApiPropertyOptional({ example: 'h-ɛ-l-oʊ', nullable: true })
    phoneme!: string | null;

    @ApiProperty({ description: 'Pronunciation accuracy score (0–100)', example: 85.5 })
    score!: number;

    @ApiPropertyOptional({ example: null, nullable: true })
    errorType!: string | null;

    @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
    createdAt!: Date;
}

export class BadgeDataDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440004' })
    id!: string;

    @ApiProperty({ example: 'FIRST_CONVERSATION' })
    badgeType!: string;

    @ApiProperty({ example: 'First Conversation' })
    name!: string;

    @ApiPropertyOptional({ example: 'Completed your first conversation!', nullable: true })
    description!: string | null;

    @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
    earnedAt!: Date;
}

/**
 * Full child data export DTO (Story 2.7).
 *
 * Returned by:
 *   GET /api/v1/users/children/:childId/data
 *   GET /api/v1/users/children/:childId/export (same shape, as attachment)
 *
 * NOTE: No voice data — never stored (FR24).
 */
export class ChildDataResponseDto {
    @ApiProperty({ description: 'Child profile information' })
    profile!: ChildProfileDataDto;

    @ApiProperty({ description: 'Learning progress data' })
    learningProgress!: LearningProgressDataDto;

    @ApiProperty({ description: 'Pronunciation score history (up to 100)', type: [PronunciationScoreDataDto] })
    pronunciationScores!: PronunciationScoreDataDto[];

    @ApiProperty({ description: 'Earned badges', type: [BadgeDataDto] })
    badges!: BadgeDataDto[];

    @ApiProperty({ description: 'ISO 8601 timestamp of when this data was exported', example: '2026-04-14T00:00:00.000Z' })
    exportedAt!: string;
}
