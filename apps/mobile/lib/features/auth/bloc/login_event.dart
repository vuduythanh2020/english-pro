import 'package:equatable/equatable.dart';

/// Events for [LoginBloc].
sealed class LoginEvent extends Equatable {
  const LoginEvent();

  @override
  List<Object?> get props => [];
}

/// Email field changed.
class LoginEmailChanged extends LoginEvent {
  const LoginEmailChanged(this.email);
  final String email;

  @override
  List<Object?> get props => [email];
}

/// Password field changed.
class LoginPasswordChanged extends LoginEvent {
  const LoginPasswordChanged(this.password);
  final String password;

  @override
  List<Object?> get props => [password];
}

/// Form submitted for login.
class LoginSubmitted extends LoginEvent {
  const LoginSubmitted();
}
