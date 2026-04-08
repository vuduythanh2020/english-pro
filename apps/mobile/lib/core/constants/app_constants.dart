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

  // ── Hive Box Names ─────────────────────────────────────────────────────
  /// Box for user settings / preferences.
  static const String settingsBox = 'settings';

  /// Box for child profile data.
  static const String profilesBox = 'profiles';

  /// Box for learning progress cache.
  static const String progressBox = 'progress';
}
