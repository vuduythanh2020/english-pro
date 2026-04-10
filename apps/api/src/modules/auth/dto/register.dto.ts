import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for parent registration.
 *
 * Password rules: min 8 chars, at least 1 uppercase letter, at least 1 number.
 * Regex: /^(?=.*[A-Z])(?=.*\d).{8,}$/
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(128, { message: 'Mật khẩu không được quá 128 ký tự' })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ số',
  })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Tên hiển thị không được quá 50 ký tự' })
  displayName?: string;
}
