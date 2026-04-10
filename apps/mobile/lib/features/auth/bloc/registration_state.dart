import 'package:english_pro/features/auth/models/registration_form.dart';
import 'package:equatable/equatable.dart';

/// States for [RegistrationBloc].
sealed class RegistrationState extends Equatable {
  const RegistrationState({required this.form});

  final RegistrationForm form;

  @override
  List<Object?> get props => [form.email, form.password, form.displayName];
}

/// Initial state — form is empty, no submission attempted.
class RegistrationInitial extends RegistrationState {
  const RegistrationInitial({super.form = const RegistrationForm()});
}

/// Validating input (client-side).
class RegistrationValidating extends RegistrationState {
  const RegistrationValidating({required super.form});
}

/// Submitting to server.
class RegistrationSubmitting extends RegistrationState {
  const RegistrationSubmitting({required super.form});
}

/// Registration succeeded — contains tokens for AuthBloc.
class RegistrationSuccess extends RegistrationState {
  const RegistrationSuccess({
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

/// Registration failed.
///
/// [errorId] is a unique timestamp that forces BlocListener to re-fire
/// even when [error] is the same string as the previous failure.
/// This ensures the SnackBar re-shows if the user submits with the
/// same invalid data twice.
class RegistrationFailure extends RegistrationState {
  RegistrationFailure({
    required super.form,
    required this.error,
  }) : errorId = DateTime.now().microsecondsSinceEpoch;

  final String error;

  /// Unique ID to distinguish repeated failures with the same message.
  final int errorId;

  @override
  List<Object?> get props => [...super.props, error, errorId];
}
