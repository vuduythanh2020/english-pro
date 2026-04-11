import 'package:english_pro/features/auth/models/login_form.dart';
import 'package:equatable/equatable.dart';

/// States for [LoginBloc].
sealed class LoginState extends Equatable {
  const LoginState({required this.form});

  final LoginForm form;

  @override
  List<Object?> get props => [form.email, form.password];
}

/// Initial state — form is empty, no submission attempted.
class LoginInitial extends LoginState {
  const LoginInitial({super.form = const LoginForm()});
}

/// Validating input (client-side).
class LoginValidating extends LoginState {
  const LoginValidating({required super.form});
}

/// Submitting to server.
class LoginSubmitting extends LoginState {
  const LoginSubmitting({required super.form});
}

/// Login succeeded — contains tokens for AuthBloc.
class LoginSuccess extends LoginState {
  const LoginSuccess({
    required super.form,
    required this.accessToken,
    required this.refreshToken,
  });

  final String accessToken;
  final String refreshToken;

  @override
  List<Object?> get props => [
    ...super.props,
    accessToken,
    refreshToken,
  ];
}

/// Login failed.
///
/// [errorId] is a unique timestamp that forces BlocListener to re-fire
/// even when [error] is the same string as the previous failure.
/// This ensures the SnackBar re-shows if the user submits with the
/// same invalid credentials twice (pattern from Story 2.1 P8 fix).
class LoginFailure extends LoginState {
  LoginFailure({
    required super.form,
    required this.error,
  }) : errorId = DateTime.now().microsecondsSinceEpoch;

  final String error;

  /// Unique ID to distinguish repeated failures with the same message.
  final int errorId;

  @override
  List<Object?> get props => [...super.props, error, errorId];
}
