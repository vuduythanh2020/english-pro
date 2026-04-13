import 'dart:convert';

import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';

/// Manages application-wide authentication state.
///
/// Uses [HydratedBloc] so the auth *status* persists across restarts,
/// but **tokens are never serialised** – they are always read from
/// [SecureStorageService] (iOS Keychain / Android Keystore).
class AuthBloc extends HydratedBloc<AuthEvent, AuthState> {
  AuthBloc({required SecureStorageService storageService})
    : _storageService = storageService,
      super(const AuthInitial()) {
    on<AuthStarted>(_onAuthStarted);
    on<AuthLoggedIn>(_onAuthLoggedIn);
    on<AuthLoggedOut>(_onAuthLoggedOut);
    on<AuthTokenRefreshed>(_onAuthTokenRefreshed);
    on<AuthConsentGranted>(_onAuthConsentGranted);
    on<AuthChildProfileCreated>(_onAuthChildProfileCreated);
    on<AuthChildSessionStarted>(_onAuthChildSessionStarted);
    on<AuthChildSessionEnded>(_onAuthChildSessionEnded);
  }

  final SecureStorageService _storageService;

  Future<void> _onAuthStarted(
    AuthStarted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final token = await _storageService.getAccessToken();
    if (token != null && token.isNotEmpty) {
      // Check if there's an active child session
      final childJwt = await _storageService.getChildJwt();
      final childId = await _storageService.getChildId();

      if (childJwt != null &&
          childJwt.isNotEmpty &&
          childId != null &&
          childId.isNotEmpty) {
        // Validate child JWT is not expired
        if (_isJwtValid(childJwt)) {
          final claims = _decodeJwtPayload(childJwt);
          final parentId =
              claims?['parentId'] as String? ??
              claims?['sub'] as String? ??
              '';
          // Prefer the dedicated parent token snapshot written at switch time;
          // fall back to the main access token slot if snapshot is absent.
          final parentAccessToken =
              await _storageService.getParentAccessToken() ?? token;
          emit(
            AuthChildSessionActive(
              childJwt: childJwt,
              childId: childId,
              parentId: parentId,
              parentAccessToken: parentAccessToken,
            ),
          );
          return;
        } else {
          // Child JWT expired — clear and fall through to parent mode
          await _storageService.clearChildJwt();
          await _storageService.clearChildId();
        }
      }

      final hasConsent = await _storageService.getHasConsent();
      final hasChildProfile = await _storageService.getHasChildProfile();
      emit(
        AuthAuthenticated(
          accessToken: token,
          hasConsent: hasConsent,
          hasChildProfile: hasChildProfile,
        ),
      );
    } else {
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onAuthLoggedIn(
    AuthLoggedIn event,
    Emitter<AuthState> emit,
  ) async {
    await _storageService.saveAccessToken(event.accessToken);
    await _storageService.saveRefreshToken(event.refreshToken);
    emit(
      AuthAuthenticated(
        accessToken: event.accessToken,
        refreshToken: event.refreshToken,
      ),
    );
  }

  Future<void> _onAuthLoggedOut(
    AuthLoggedOut event,
    Emitter<AuthState> emit,
  ) async {
    // clearAll() already removes all keys including child JWT and child ID
    await _storageService.clearAll();
    emit(const AuthUnauthenticated());
  }

  Future<void> _onAuthTokenRefreshed(
    AuthTokenRefreshed event,
    Emitter<AuthState> emit,
  ) async {
    await _storageService.saveAccessToken(event.accessToken);
    if (event.refreshToken != null) {
      await _storageService.saveRefreshToken(event.refreshToken!);
    }
    final currentState = state;
    if (currentState is AuthAuthenticated) {
      emit(
        AuthAuthenticated(
          accessToken: event.accessToken,
          refreshToken: event.refreshToken ?? currentState.refreshToken,
          userRole: currentState.userRole,
          hasConsent: currentState.hasConsent,
          hasChildProfile: currentState.hasChildProfile,
        ),
      );
    }
  }

  Future<void> _onAuthConsentGranted(
    AuthConsentGranted event,
    Emitter<AuthState> emit,
  ) async {
    await _storageService.saveHasConsent(true);
    final currentState = state;
    if (currentState is AuthAuthenticated) {
      emit(
        AuthAuthenticated(
          accessToken: currentState.accessToken,
          refreshToken: currentState.refreshToken,
          userRole: currentState.userRole,
          hasConsent: true,
          hasChildProfile: currentState.hasChildProfile,
        ),
      );
    } else {
      // Edge case: AuthBloc not yet in AuthAuthenticated (e.g. mid token-refresh).
      // Re-read token from secure storage to recover gracefully instead of
      // leaving the user stuck on /consent with no feedback.
      final token = await _storageService.getAccessToken();
      if (token != null && token.isNotEmpty) {
        emit(AuthAuthenticated(accessToken: token, hasConsent: true));
      }
      // If token is gone (concurrent logout), do nothing — user will be
      // redirected to login by AuthGuard on next navigation.
    }
  }

  /// Handles [AuthChildProfileCreated]: persists the flag and updates state.
  ///
  /// Called after parent successfully creates a child profile (Story 2.4).
  /// GoRouter re-evaluates guards via GoRouterRefreshStream → redirects
  /// from `/child-profile-setup` → `/profile-selection`.
  Future<void> _onAuthChildProfileCreated(
    AuthChildProfileCreated event,
    Emitter<AuthState> emit,
  ) async {
    await _storageService.saveHasChildProfile(true);
    final currentState = state;
    if (currentState is AuthAuthenticated) {
      emit(
        AuthAuthenticated(
          accessToken: currentState.accessToken,
          refreshToken: currentState.refreshToken,
          userRole: currentState.userRole,
          hasConsent: currentState.hasConsent,
          hasChildProfile: true,
        ),
      );
    } else {
      // Edge case: recover gracefully from unexpected state (e.g. mid token-refresh).
      // Read BOTH flags from storage so we don't inadvertently reset hasConsent to
      // false for a user who already granted consent in a previous session.
      final token = await _storageService.getAccessToken();
      if (token != null && token.isNotEmpty) {
        final hasConsent = await _storageService.getHasConsent();
        emit(AuthAuthenticated(
          accessToken: token,
          hasConsent: hasConsent,
          hasChildProfile: true,
        ));
      }
      // If token is gone (concurrent logout), do nothing — user will be
      // redirected to login by AuthGuard on next navigation.
    }
  }

  /// Handles [AuthChildSessionStarted]: persists child JWT and child ID,
  /// then emits [AuthChildSessionActive].
  ///
  /// Called after parent taps a child profile on the profile selection
  /// screen and the `switch-to-child` API returns a child JWT (Story 2.5).
  Future<void> _onAuthChildSessionStarted(
    AuthChildSessionStarted event,
    Emitter<AuthState> emit,
  ) async {
    await _storageService.saveChildJwt(event.childJwt);
    await _storageService.saveChildId(event.childId);

    // Parse parentId from child JWT claims
    final claims = _decodeJwtPayload(event.childJwt);
    final parentId =
        claims?['parentId'] as String? ?? claims?['sub'] as String? ?? '';

    // Preserve parent access token from current state and persist it
    // in a dedicated key so it survives app restarts during child sessions.
    String? parentAccessToken;
    final currentState = state;
    if (currentState is AuthAuthenticated) {
      parentAccessToken = currentState.accessToken;
    } else {
      parentAccessToken = await _storageService.getAccessToken();
    }

    if (parentAccessToken != null && parentAccessToken.isNotEmpty) {
      await _storageService.saveParentAccessToken(parentAccessToken);
    }

    emit(
      AuthChildSessionActive(
        childJwt: event.childJwt,
        childId: event.childId,
        parentId: parentId,
        parentAccessToken: parentAccessToken,
      ),
    );
  }

  /// Handles [AuthChildSessionEnded]: clears child JWT/ID from storage
  /// and restores the parent session.
  ///
  /// GoRouter re-evaluates guards → redirects to `/profile-selection`.
  Future<void> _onAuthChildSessionEnded(
    AuthChildSessionEnded event,
    Emitter<AuthState> emit,
  ) async {
    if (state is! AuthChildSessionActive) return;

    // Preserve parent token before clearing child data
    String? parentToken;
    final currentState = state;
    if (currentState is AuthChildSessionActive) {
      parentToken = currentState.parentAccessToken;
    }

    await _storageService.clearChildJwt();
    await _storageService.clearChildId();
    await _storageService.clearParentAccessToken();

    // Fallback: read parent token from storage if not in state
    parentToken ??= await _storageService.getAccessToken();

    if (parentToken != null && parentToken.isNotEmpty) {
      final hasConsent = await _storageService.getHasConsent();
      final hasChildProfile = await _storageService.getHasChildProfile();
      emit(
        AuthAuthenticated(
          accessToken: parentToken,
          hasConsent: hasConsent,
          hasChildProfile: hasChildProfile,
        ),
      );
    } else {
      // No parent token available — force full logout
      await _storageService.clearAll();
      emit(const AuthUnauthenticated());
    }
  }

  // ── JWT Utilities ──────────────────────────────────────────────────

  /// Decodes a JWT payload without verifying the signature.
  ///
  /// Returns `null` if the token is malformed.
  /// Used only for extracting claims (parentId, exp) on the client side.
  Map<String, dynamic>? _decodeJwtPayload(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;

      // JWT payload is base64url-encoded
      final payload = parts[1];
      // Pad to multiple of 4 for base64 decoding
      final normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final json = jsonDecode(decoded);
      if (json is Map<String, dynamic>) return json;
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Checks if a JWT is not expired based on its `exp` claim.
  ///
  /// Returns `false` if the token is malformed or missing `exp`.
  bool _isJwtValid(String token) {
    final claims = _decodeJwtPayload(token);
    if (claims == null) return false;
    final exp = claims['exp'];
    if (exp is! int) return false;
    final expiryDate = DateTime.fromMillisecondsSinceEpoch(exp * 1000);
    // Add a 30-second buffer to avoid race conditions
    return expiryDate.isAfter(DateTime.now().add(const Duration(seconds: 30)));
  }

  // ── HydratedBloc serialisation ─────────────────────────────────────
  // SECURITY DECISION: AuthBloc extends HydratedBloc so the
  // application infrastructure can rely on a single
  // `HydratedBloc.storage` initialisation for all blocs. However,
  // AuthBloc intentionally opts out of persistence: tokens are
  // **never** written to the HydratedBloc JSON file (which is
  // plaintext on disk). On every cold start the bloc re-reads
  // credentials from [SecureStorageService] via [AuthStarted].
  //
  // Future blocs (e.g. SettingsBloc, OnboardingBloc) will use
  // HydratedBloc with real serialisation.

  @override
  AuthState? fromJson(Map<String, dynamic> json) => null;

  @override
  Map<String, dynamic>? toJson(AuthState state) => null;
}
