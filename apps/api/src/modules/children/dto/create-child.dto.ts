import {
    IsString,
    IsNotEmpty,
    MaxLength,
    IsInt,
    Min,
    Max,
    IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new child profile.
 *
 * Validates the child's display name and optional avatar selection.
 * Avatar defaults to 1 (Orange Fox) if not provided.
 */
export class CreateChildDto {
    @ApiProperty({
        description: 'Display name for the child profile',
        example: 'Bé Nam',
        maxLength: 20,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    displayName!: string;

    @ApiPropertyOptional({
        description: 'Avatar ID (1–6). Defaults to 1 if not provided.',
        example: 3,
        minimum: 1,
        maximum: 6,
    })
    @IsInt()
    @Min(1)
    @Max(6)
    @IsOptional()
    avatarId?: number;
}
