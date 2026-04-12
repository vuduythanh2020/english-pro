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
  }

  final SecureStorageService _storageService;

  Future<void> _onAuthStarted(
    AuthStarted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final token = await _storageService.getAccessToken();
    if (token != null && token.isNotEmpty) {
      final hasConsent = await _storageService.getHasConsent();
      emit(AuthAuthenticated(accessToken: token, hasConsent: hasConsent));
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
