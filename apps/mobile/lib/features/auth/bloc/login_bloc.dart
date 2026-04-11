import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/features/auth/bloc/login_event.dart';
import 'package:english_pro/features/auth/bloc/login_state.dart';
import 'package:english_pro/features/auth/repositories/auth_repository.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// Manages login form state and submission.
///
/// Validates client-side (email format + non-empty password only — no strength check)
/// before calling [AuthRepository.login], then emits [LoginSuccess] with tokens
/// for the [AuthBloc] to consume.
class LoginBloc extends Bloc<LoginEvent, LoginState> {
  LoginBloc({required AuthRepository authRepository})
    : _authRepository = authRepository,
      super(const LoginInitial()) {
    on<LoginEmailChanged>(_onEmailChanged);
    on<LoginPasswordChanged>(_onPasswordChanged);
    on<LoginSubmitted>(_onSubmitted);
  }

  final AuthRepository _authRepository;

  void _onEmailChanged(
    LoginEmailChanged event,
    Emitter<LoginState> emit,
  ) {
    final updatedForm = state.form.copyWith(email: event.email);
    emit(LoginValidating(form: updatedForm));
  }

  void _onPasswordChanged(
    LoginPasswordChanged event,
    Emitter<LoginState> emit,
  ) {
    final updatedForm = state.form.copyWith(password: event.password);
    emit(LoginValidating(form: updatedForm));
  }

  Future<void> _onSubmitted(
    LoginSubmitted event,
    Emitter<LoginState> emit,
  ) async {
    final form = state.form;

    // Client-side validation
    if (!form.isValid) {
      emit(
        LoginFailure(
          form: form,
          error: form.emailError ??
              form.passwordError ??
              'Vui lòng kiểm tra lại thông tin',
        ),
      );
      return;
    }

    emit(LoginSubmitting(form: form));

    try {
      final result = await _authRepository.login(
        email: form.email,
        password: form.password,
      );

      // Safe extraction with null fallback — avoids crash if server returns unexpected shape
      final accessToken = result['accessToken'] as String? ?? '';
      final refreshToken = result['refreshToken'] as String? ?? '';

      emit(
        LoginSuccess(
          form: form,
          accessToken: accessToken,
          refreshToken: refreshToken,
        ),
      );
    } on AppException catch (e) {
      emit(LoginFailure(form: form, error: e.message));
    } on Exception catch (_) {
      emit(
        LoginFailure(
          form: form,
          error: 'Đăng nhập thất bại. Vui lòng thử lại.',
        ),
      );
    }
  }
}
