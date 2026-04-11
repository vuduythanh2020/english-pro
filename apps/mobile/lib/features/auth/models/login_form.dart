/// Model for login form validation.
///
/// Login validation is intentionally minimal compared to registration:
/// - Email: must be a valid email format
/// - Password: only non-empty check + max 128 chars (NO strength rules)
class LoginForm {
  const LoginForm({
    this.email = '',
    this.password = '',
  });

  final String email;
  final String password;

  static const int _passwordMaxLength = 128;

  /// Email regex pattern for basic validation.
  static final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  /// Whether the email is valid.
  bool get isEmailValid => _emailRegex.hasMatch(email);

  /// Whether the password is valid.
  /// Login only checks non-empty + max length — no strength requirement.
  bool get isPasswordValid =>
      password.isNotEmpty && password.length <= _passwordMaxLength;

  /// Whether the entire form is valid and ready for submission.
  bool get isValid => isEmailValid && isPasswordValid;

  /// Returns email validation error, or null if valid.
  String? get emailError {
    if (email.isEmpty) return null; // Don't show error for empty field
    if (!isEmailValid) return 'Email không hợp lệ';
    return null;
  }

  /// Returns password validation error, or null if valid.
  String? get passwordError {
    if (password.isEmpty) return null; // Don't show error for empty field
    if (password.length > _passwordMaxLength) {
      return 'Mật khẩu không được quá $_passwordMaxLength ký tự';
    }
    return null;
  }

  /// Creates a copy with updated fields.
  LoginForm copyWith({
    String? email,
    String? password,
  }) {
    return LoginForm(
      email: email ?? this.email,
      password: password ?? this.password,
    );
  }
}
