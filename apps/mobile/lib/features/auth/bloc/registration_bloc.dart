import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/features/auth/bloc/registration_event.dart';
import 'package:english_pro/features/auth/bloc/registration_state.dart';
import 'package:english_pro/features/auth/repositories/auth_repository.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// Manages registration form state and submission.
///
/// Validates client-side before calling [AuthRepository.register],
/// then emits `RegistrationSuccess` with tokens for the AuthBloc.
class RegistrationBloc extends Bloc<RegistrationEvent, RegistrationState> {
  RegistrationBloc({required AuthRepository authRepository})
    : _authRepository = authRepository,
      super(const RegistrationInitial()) {
    on<RegistrationEmailChanged>(_onEmailChanged);
    on<RegistrationPasswordChanged>(_onPasswordChanged);
    on<RegistrationDisplayNameChanged>(_onDisplayNameChanged);
    on<RegistrationSubmitted>(_onSubmitted);
  }

  final AuthRepository _authRepository;

  void _onEmailChanged(
    RegistrationEmailChanged event,
    Emitter<RegistrationState> emit,
  ) {
    final updatedForm = state.form.copyWith(email: event.email);
    emit(RegistrationValidating(form: updatedForm));
  }

  void _onPasswordChanged(
    RegistrationPasswordChanged event,
    Emitter<RegistrationState> emit,
  ) {
    final updatedForm = state.form.copyWith(password: event.password);
    emit(RegistrationValidating(form: updatedForm));
  }

  void _onDisplayNameChanged(
    RegistrationDisplayNameChanged event,
    Emitter<RegistrationState> emit,
  ) {
    final updatedForm = state.form.copyWith(displayName: event.displayName);
    emit(RegistrationValidating(form: updatedForm));
  }

  Future<void> _onSubmitted(
    RegistrationSubmitted event,
    Emitter<RegistrationState> emit,
  ) async {
    final form = state.form;

    // Client-side validation
    if (!form.isValid) {
      emit(
        RegistrationFailure(
          form: form,
          error: form.emailError ??
              form.passwordError ??
              form.displayNameError ??
              'Vui lòng kiểm tra lại thông tin',
        ),
      );
      return;
    }

    emit(RegistrationSubmitting(form: form));

    // Trim displayName — reject whitespace-only values (consistent with server-side)
    final trimmedDisplayName = form.displayName.trim();

    try {
      final result = await _authRepository.register(
        email: form.email,
        password: form.password,
        displayName: trimmedDisplayName.isNotEmpty ? trimmedDisplayName : null,
      );

      // Safe extraction with null fallback — avoids crash if server returns unexpected shape
      final accessToken = result['accessToken'] as String? ?? '';
      final refreshToken = result['refreshToken'] as String? ?? '';

      emit(
        RegistrationSuccess(
          form: form,
          accessToken: accessToken,
          refreshToken: refreshToken,
        ),
      );
    } on AppException catch (e) {
      emit(RegistrationFailure(form: form, error: e.message));
    } on Exception catch (_) {
      emit(
        RegistrationFailure(
          form: form,
          error: 'Đăng ký thất bại. Vui lòng thử lại.',
        ),
      );
    }
  }
}
