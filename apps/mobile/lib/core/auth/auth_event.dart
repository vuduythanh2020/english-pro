import 'package:equatable/equatable.dart';

/// Events consumed by `AuthBloc`.
sealed class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

/// Fired at app start to check stored auth state.
class AuthStarted extends AuthEvent {
  const AuthStarted();
}

/// Fired after a successful login – persists tokens.
class AuthLoggedIn extends AuthEvent {
  const AuthLoggedIn({
    required this.accessToken,
    required this.refreshToken,
  });

  final String accessToken;
  final String refreshToken;

  @override
  List<Object?> get props => [accessToken, refreshToken];
}

/// Fired when the user logs out or when a token refresh fails.
class AuthLoggedOut extends AuthEvent {
  const AuthLoggedOut();
}

/// Fired after a successful token refresh – updates stored tokens.
class AuthTokenRefreshed extends AuthEvent {
  const AuthTokenRefreshed({
    required this.accessToken,
    this.refreshToken,
  });

  final String accessToken;

  /// When the refresh endpoint rotates the refresh token, the new
  /// value is passed here so the in-memory auth state stays in sync
  /// with secure storage.
  final String? refreshToken;

  @override
  List<Object?> get props => [accessToken, refreshToken];
}

/// Fired after the parent grants parental consent (Story 2.3).
class AuthConsentGranted extends AuthEvent {
  const AuthConsentGranted();
}

/// Fired after the parent creates a child profile (Story 2.4).
class AuthChildProfileCreated extends AuthEvent {
  const AuthChildProfileCreated();
}
