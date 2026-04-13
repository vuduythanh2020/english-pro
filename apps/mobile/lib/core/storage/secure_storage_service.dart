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

  // ── Parental Consent ──────────────────────────────────────────────

  /// Persists the parental consent flag.
  Future<void> saveHasConsent(bool value) => _storage.write(
    key: AppConstants.hasConsentKey,
    value: value.toString(),
  );

  /// Returns the stored consent flag, defaulting to `false`.
  Future<bool> getHasConsent() async {
    final value = await _storage.read(key: AppConstants.hasConsentKey);
    return value == 'true';
  }

  // ── Child Profile ──────────────────────────────────────────────────

  /// Persists the child profile creation flag (Story 2.4).
  Future<void> saveHasChildProfile(bool value) => _storage.write(
    key: AppConstants.hasChildProfileKey,
    value: value.toString(),
  );

  /// Returns the stored child profile flag, defaulting to `false` (Story 2.4).
  Future<bool> getHasChildProfile() async {
    final value = await _storage.read(key: AppConstants.hasChildProfileKey);
    return value == 'true';
  }

  // ── Child JWT (Story 2.5) ──────────────────────────────────────────

  /// Persists the child-specific JWT access token.
  Future<void> saveChildJwt(String token) =>
      _storage.write(key: AppConstants.childAccessTokenKey, value: token);

  /// Returns the stored child JWT, or `null` if none exists.
  Future<String?> getChildJwt() =>
      _storage.read(key: AppConstants.childAccessTokenKey);

  /// Removes the child JWT from secure storage.
  Future<void> clearChildJwt() =>
      _storage.delete(key: AppConstants.childAccessTokenKey);

  // ── Active Child ID (Story 2.5) ────────────────────────────────────

  /// Persists the active child profile ID.
  Future<void> saveChildId(String childId) =>
      _storage.write(key: AppConstants.activeChildIdKey, value: childId);

  /// Returns the stored active child ID, or `null` if none exists.
  Future<String?> getChildId() =>
      _storage.read(key: AppConstants.activeChildIdKey);

  /// Removes the active child ID from secure storage.
  Future<void> clearChildId() =>
      _storage.delete(key: AppConstants.activeChildIdKey);

  // ── Parent Access Token Snapshot (Story 2.5) ──────────────────────
  // Stores a snapshot of the parent's access token when switching to a child
  // session, so it can be reliably restored on app restart even if the main
  // accessTokenKey slot is modified during the child session.

  /// Persists the parent access token snapshot.
  Future<void> saveParentAccessToken(String token) =>
      _storage.write(key: AppConstants.parentAccessTokenKey, value: token);

  /// Returns the stored parent access token snapshot, or `null` if none.
  Future<String?> getParentAccessToken() =>
      _storage.read(key: AppConstants.parentAccessTokenKey);

  /// Removes the parent access token snapshot from secure storage.
  Future<void> clearParentAccessToken() =>
      _storage.delete(key: AppConstants.parentAccessTokenKey);

  // ── Parental Gate (Story 2.6) ──────────────────────────────────────

  /// Persists the hashed PIN for the parental gate.
  Future<void> saveParentalGatePinHash(String pinHash) =>
      _storage.write(key: AppConstants.parentalGatePinHashKey, value: pinHash);

  /// Returns the stored PIN hash, or `null` if no PIN has been set.
  Future<String?> getParentalGatePinHash() =>
      _storage.read(key: AppConstants.parentalGatePinHashKey);

  /// Persists the flag indicating the parental gate PIN has been set up.
  Future<void> saveParentalGatePinSet(bool value) =>
      _storage.write(
        key: AppConstants.parentalGatePinSetKey,
        value: value.toString(),
      );

  /// Returns whether the parental gate PIN has been set up, defaulting
  /// to `false`.
  Future<bool> getParentalGatePinSet() async {
    final value = await _storage.read(key: AppConstants.parentalGatePinSetKey);
    return value == 'true';
  }

  // ── Utility ────────────────────────────────────────────────────────

  /// Removes all stored values (access + refresh tokens, child JWT, etc.).
  Future<void> clearAll() => _storage.deleteAll();
}
