import 'package:equatable/equatable.dart';

/// Events for [RegistrationBloc].
sealed class RegistrationEvent extends Equatable {
  const RegistrationEvent();

  @override
  List<Object?> get props => [];
}

/// Email field changed.
class RegistrationEmailChanged extends RegistrationEvent {
  const RegistrationEmailChanged(this.email);
  final String email;

  @override
  List<Object?> get props => [email];
}

/// Password field changed.
class RegistrationPasswordChanged extends RegistrationEvent {
  const RegistrationPasswordChanged(this.password);
  final String password;

  @override
  List<Object?> get props => [password];
}

/// Display name field changed.
class RegistrationDisplayNameChanged extends RegistrationEvent {
  const RegistrationDisplayNameChanged(this.displayName);
  final String displayName;

  @override
  List<Object?> get props => [displayName];
}

/// Form submitted for registration.
class RegistrationSubmitted extends RegistrationEvent {
  const RegistrationSubmitted();
}
