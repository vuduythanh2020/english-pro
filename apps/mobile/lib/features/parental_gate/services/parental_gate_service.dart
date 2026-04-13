import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';
import 'package:local_auth/local_auth.dart';

/// Service providing parental gate PIN and biometric operations (Story 2.6).
///
/// All PIN storage is device-local only — no server calls are made.
/// The PIN is hashed with SHA-256 and an app-specific salt before storage.
class ParentalGateService {
  ParentalGateService({
    required SecureStorageService storageService,
    LocalAuthentication? localAuth,
  }) : _storageService = storageService,
       _localAuth = localAuth ?? LocalAuthentication();

  final SecureStorageService _storageService;
  final LocalAuthentication _localAuth;

  /// App-specific salt to prevent rainbow-table attacks on 4-digit PINs.
  static const String _salt = 'english_pro_parental_gate_salt_v1';

  /// Returns `true` if the parental gate PIN has been set up.
  Future<bool> isPinSet() => _storageService.getParentalGatePinSet();

  /// Hashes [pin] with SHA-256 and the app salt, then stores the hash
  /// and sets the PIN-set flag to `true`.
  Future<void> setupPin(String pin) async {
    final hash = _hashPin(pin);
    await _storageService.saveParentalGatePinHash(hash);
    await _storageService.saveParentalGatePinSet(true);
  }

  /// Returns `true` if [pin] matches the stored PIN hash.
  Future<bool> verifyPin(String pin) async {
    final storedHash = await _storageService.getParentalGatePinHash();
    if (storedHash == null) return false;
    final inputHash = _hashPin(pin);
    return storedHash == inputHash;
  }

  /// Returns `true` if the device supports biometric authentication
  /// and has at least one biometric enrolled.
  Future<bool> canUseBiometric() async {
    try {
      if (!await _localAuth.isDeviceSupported()) return false;
      if (!await _localAuth.canCheckBiometrics) return false;
      final biometrics = await _localAuth.getAvailableBiometrics();
      return biometrics.isNotEmpty;
    } on Exception {
      return false;
    }
  }

  /// Attempts biometric authentication. Returns `true` on success.
  Future<bool> authenticateWithBiometric() async {
    try {
      return await _localAuth.authenticate(
        localizedReason:
            'Xác nhận danh tính phụ huynh để truy cập cài đặt',
        options: const AuthenticationOptions(
          // biometricOnly: false allows OS device PIN/password as fallback
          // when biometric fails — per spec Task 2.1 Dev Notes.
          biometricOnly: false,
          stickyAuth: true,
        ),
      );
    } on Exception {
      return false;
    }
  }

  /// Produces a SHA-256 hash of [pin] with an app-specific salt.
  String _hashPin(String pin) {
    final bytes = utf8.encode('$_salt:$pin');
    return sha256.convert(bytes).toString();
  }
}
