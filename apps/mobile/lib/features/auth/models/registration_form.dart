/// Model for registration form validation.
///
/// Provides client-side validation for email and password fields
/// before submission to the API.
class RegistrationForm {
  const RegistrationForm({
    this.email = '',
    this.password = '',
    this.displayName = '',
  });

  final String email;
  final String password;
  final String displayName;

  static const int _displayNameMaxLength = 50;

  /// Email regex pattern for basic validation.
  static final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  /// Password must have: min 8 chars, 1 uppercase, 1 number.
  static final RegExp _passwordRegex = RegExp(r'^(?=.*[A-Z])(?=.*\d).{8,}$');

  /// Whether the email is valid.
  bool get isEmailValid => _emailRegex.hasMatch(email);

  /// Whether the password meets strength requirements.
  bool get isPasswordValid => _passwordRegex.hasMatch(password);

  /// Whether the password has at least 8 characters.
  bool get hasMinLength => password.length >= 8;

  /// Whether the password contains at least one uppercase letter.
  bool get hasUppercase => RegExp('[A-Z]').hasMatch(password);

  /// Whether the password contains at least one digit.
  bool get hasDigit => RegExp(r'\d').hasMatch(password);

  /// Whether the displayName is valid (empty is allowed; non-empty must be ≤50 chars and non-whitespace-only).
  bool get isDisplayNameValid {
    if (displayName.isEmpty) return true;
    final trimmed = displayName.trim();
    return trimmed.isNotEmpty && trimmed.length <= _displayNameMaxLength;
  }

  /// Whether the entire form is valid and ready for submission.
  bool get isValid => isEmailValid && isPasswordValid && isDisplayNameValid;

  /// Returns email validation error, or null if valid.
  String? get emailError {
    if (email.isEmpty) return null; // Don't show error for empty field
    if (!isEmailValid) return 'Email không hợp lệ';
    return null;
  }

  /// Returns password validation error, or null if valid.
  String? get passwordError {
    if (password.isEmpty) return null; // Don't show error for empty field
    if (!hasMinLength) return 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!hasUppercase) return 'Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa';
    if (!hasDigit) return 'Mật khẩu phải chứa ít nhất 1 chữ số';
    return null;
  }

  /// Returns displayName validation error, or null if valid.
  ///
  /// Validates that a non-empty name is not whitespace-only and
  /// does not exceed [_displayNameMaxLength] characters — matching server-side DTO.
  String? get displayNameError {
    if (displayName.isEmpty) return null; // Optional field
    if (displayName.trim().isEmpty) return 'Tên hiển thị không được chỉ có khoảng trắng';
    if (displayName.trim().length > _displayNameMaxLength) {
      return 'Tên hiển thị không được quá $_displayNameMaxLength ký tự';
    }
    return null;
  }

  /// Creates a copy with updated fields.
  RegistrationForm copyWith({
    String? email,
    String? password,
    String? displayName,
  }) {
    return RegistrationForm(
      email: email ?? this.email,
      password: password ?? this.password,
      displayName: displayName ?? this.displayName,
    );
  }
}
