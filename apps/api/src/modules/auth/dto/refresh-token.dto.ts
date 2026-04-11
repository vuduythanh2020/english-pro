import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for refresh token exchange.
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token là bắt buộc' })
  refreshToken!: string;
}
