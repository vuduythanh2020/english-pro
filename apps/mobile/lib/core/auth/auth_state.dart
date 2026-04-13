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

/// A child session is active — the parent selected a child profile
/// and a child-specific JWT was issued (Story 2.5).
///
/// GoRouter differentiates between [AuthAuthenticated] (parent mode)
/// and [AuthChildSessionActive] (child mode) to route to the
/// correct home screen.
class AuthChildSessionActive extends AuthState {
  const AuthChildSessionActive({
    required this.childJwt,
    required this.childId,
    required this.parentId,
    this.parentAccessToken,
  });

  /// The child-specific JWT used for API calls in child mode.
  final String childJwt;

  /// The active child profile ID.
  final String childId;

  /// The parent user ID (extracted from the child JWT claims).
  final String parentId;

  /// The parent's access token, preserved so we can restore
  /// the parent session when the child session ends.
  final String? parentAccessToken;

  /// Creates a copy with optionally overridden fields.
  AuthChildSessionActive copyWith({
    String? childJwt,
    String? childId,
    String? parentId,
    String? parentAccessToken,
  }) {
    return AuthChildSessionActive(
      childJwt: childJwt ?? this.childJwt,
      childId: childId ?? this.childId,
      parentId: parentId ?? this.parentId,
      parentAccessToken: parentAccessToken ?? this.parentAccessToken,
    );
  }

  @override
  List<Object?> get props => [
    childJwt,
    childId,
    parentId,
    parentAccessToken,
  ];
}
