import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

/**
 * DTO for granting parental consent.
 *
 * Used by `POST /api/v1/consent` to record the parent's consent
 * along with the declared child age.
 */
export class CreateConsentDto {
  @IsInt({ message: 'Tuổi phải là số nguyên' })
  @Min(1, { message: 'Tuổi phải từ 1 đến 18' })
  @Max(18, { message: 'Tuổi phải từ 1 đến 18' })
  childAge!: number;

  @IsString()
  @IsNotEmpty({ message: 'Phiên bản consent là bắt buộc' })
  consentVersion: string = '1.0';
}
