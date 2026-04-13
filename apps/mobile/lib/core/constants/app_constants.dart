/// Application-wide constants.
abstract final class AppConstants {
  // ── HTTP Timeouts ──────────────────────────────────────────────────────
  /// Connect timeout for Dio HTTP client.
  static const Duration connectTimeout = Duration(seconds: 30);

  /// Receive timeout for Dio HTTP client.
  static const Duration receiveTimeout = Duration(seconds: 30);

  /// Send timeout for Dio HTTP client.
  static const Duration sendTimeout = Duration(seconds: 30);

  // ── Retry Configuration ────────────────────────────────────────────────
  /// Maximum number of retry attempts for failed requests.
  static const int maxRetryCount = 3;

  /// Initial delay before the first retry (exponential backoff base).
  static const Duration initialRetryDelay = Duration(seconds: 1);

  // ── Secure Storage Keys ────────────────────────────────────────────────
  /// Key for the JWT access token in secure storage.
  static const String accessTokenKey = 'auth_access_token';

  /// Key for the JWT refresh token in secure storage.
  static const String refreshTokenKey = 'auth_refresh_token';

  /// Key for the parental consent flag in secure storage (Story 2.3).
  static const String hasConsentKey = 'has_consent';

  /// Key for the child profile flag in secure storage (Story 2.4).
  static const String hasChildProfileKey = 'has_child_profile';

  /// Key for the child JWT access token in secure storage (Story 2.5).
  static const String childAccessTokenKey = 'child_access_token';

  /// Key for the active child profile ID in secure storage (Story 2.5).
  static const String activeChildIdKey = 'active_child_id';

  /// Key for the parent access token preserved during a child session (Story 2.5).
  /// Written when switching to child, cleared when switching back or logging out.
  static const String parentAccessTokenKey = 'parent_access_token_snapshot';

  // ── Hive Box Names ─────────────────────────────────────────────────────
  /// Box for user settings / preferences.
  static const String settingsBox = 'settings';

  /// Box for child profile data.
  static const String profilesBox = 'profiles';

  /// Box for learning progress cache.
  static const String progressBox = 'progress';

  // ── Legal URLs ────────────────────────────────────────────────────
  /// Privacy policy URL shown on the parental consent screen (Story 2.3).
  static const String privacyPolicyUrl =
      'https://englishpro.app/privacy-policy';
}
