import 'package:equatable/equatable.dart';

/// States emitted by `AuthBloc`.
sealed class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

/// Initial state before the auth check has completed.
class AuthInitial extends AuthState {
  const AuthInitial();
}

/// The authentication check / login / logout is in progress.
class AuthLoading extends AuthState {
  const AuthLoading();
}

/// The user is authenticated and has valid tokens.
class AuthAuthenticated extends AuthState {
  const AuthAuthenticated({
    required this.accessToken,
    this.refreshToken,
    this.userRole,
    this.hasConsent = false,
    this.hasChildProfile = false,
  });

  final String accessToken;
  final String? refreshToken;
  final String? userRole;

  /// Whether the parent has completed the parental consent flow.
  /// Defaults to `false`; set to `true` once consent is confirmed
  /// (wired in Story 2.3).
  final bool hasConsent;

  /// Whether the parent has created at least one child profile.
  /// Defaults to `false`; set to `true` once child profile is created
  /// (wired in Story 2.4).
  final bool hasChildProfile;

  @override
  List<Object?> get props => [
    accessToken,
    refreshToken,
    userRole,
    hasConsent,
    hasChildProfile,
  ];
}

/// The user is not authenticated (no tokens / expired).
class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}
