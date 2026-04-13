import { IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwitchChildDto {
    @ApiProperty({
        description: 'UUID of the child profile to switch to',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsString()
    @IsUUID('4')
    @IsNotEmpty()
    childId!: string;
}
