import 'package:english_pro/core/constants/app_constants.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Wraps [FlutterSecureStorage] to provide typed access to JWT tokens
/// stored in the platform-native secure enclave
/// (iOS Keychain / Android Keystore).
class SecureStorageService {
  SecureStorageService({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  // ── Access Token ───────────────────────────────────────────────────

  /// Persists [token] as the JWT access token.
  Future<void> saveAccessToken(String token) =>
      _storage.write(key: AppConstants.accessTokenKey, value: token);

  /// Returns the stored access token, or `null` if none exists.
  Future<String?> getAccessToken() =>
      _storage.read(key: AppConstants.accessTokenKey);

  // ── Refresh Token ──────────────────────────────────────────────────

  /// Persists [token] as the JWT refresh token.
  Future<void> saveRefreshToken(String token) => _storage.write(
    key: AppConstants.refreshTokenKey,
    value: token,
  );

  /// Returns the stored refresh token, or `null` if none exists.
  Future<String?> getRefreshToken() =>
      _storage.read(key: AppConstants.refreshTokenKey);

  // ── Utility ────────────────────────────────────────────────────────

  /// Removes all stored values (access + refresh tokens).
  Future<void> clearAll() => _storage.deleteAll();
}
