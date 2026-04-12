import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO representing a child profile.
 *
 * Returned by POST /api/v1/children (201) and GET /api/v1/children (200).
 */
export class ChildProfileDto {
    @ApiProperty({
        description: 'Unique identifier for the child profile',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id!: string;

    @ApiProperty({
        description: 'Parent user ID who owns this profile',
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    parentId!: string;

    @ApiProperty({
        description: 'Display name for the child',
        example: 'Bé Nam',
    })
    displayName!: string;

    @ApiProperty({
        description: 'Avatar ID (1–6)',
        example: 3,
    })
    avatarId!: number;

    @ApiProperty({
        description: 'Learning level',
        example: 'beginner',
    })
    level!: string;

    @ApiProperty({
        description: 'Total XP accumulated',
        example: 0,
    })
    xpTotal!: number;

    @ApiProperty({
        description: 'Profile creation timestamp',
        example: '2026-04-12T00:00:00.000Z',
    })
    createdAt!: Date;
}
