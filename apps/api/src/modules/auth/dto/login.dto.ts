import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO for parent login.
 *
 * Password validation: only checks existence (non-empty, max 128 chars).
 * DOES NOT check password strength — this is login, not registration.
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
  @MaxLength(128, { message: 'Mật khẩu không được quá 128 ký tự' })
  password!: string;
}
