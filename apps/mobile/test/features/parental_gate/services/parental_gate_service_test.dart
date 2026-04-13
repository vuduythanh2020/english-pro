/// Unit Tests - Story 2.6: ParentalGateService
library;

import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:english_pro/core/constants/app_constants.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';
import 'package:english_pro/features/parental_gate/services/parental_gate_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:local_auth/local_auth.dart';
import 'package:mocktail/mocktail.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

class MockLocalAuthentication extends Mock implements LocalAuthentication {}

/// Helper to compute expected hash (mirrors service implementation).
String _expectedHash(String pin) {
  const salt = 'english_pro_parental_gate_salt_v1';
  final bytes = utf8.encode('$salt:$pin');
  return sha256.convert(bytes).toString();
}

void main() {
  late MockFlutterSecureStorage mockStorage;
  late SecureStorageService storageService;
  late MockLocalAuthentication mockLocalAuth;
  late ParentalGateService service;

  setUpAll(() {
    registerFallbackValue(const AuthenticationOptions());
  });

  setUp(() {
    mockStorage = MockFlutterSecureStorage();
    storageService = SecureStorageService(storage: mockStorage);
    mockLocalAuth = MockLocalAuthentication();
    service = ParentalGateService(
      storageService: storageService,
      localAuth: mockLocalAuth,
    );
  });

  group('ParentalGateService', () {
    group('isPinSet', () {
      test('returns false when no PIN is set', () async {
        when(
          () => mockStorage.read(key: any(named: 'key')),
        ).thenAnswer((_) async => null);

        final result = await service.isPinSet();

        expect(result, isFalse);
        verify(
          () => mockStorage.read(key: AppConstants.parentalGatePinSetKey),
        ).called(1);
      });

      test('returns true when PIN is set', () async {
        when(
          () => mockStorage.read(key: AppConstants.parentalGatePinSetKey),
        ).thenAnswer((_) async => 'true');

        final result = await service.isPinSet();

        expect(result, isTrue);
      });
    });

    group('setupPin', () {
      test('stores hash (not plain text) and sets flag to true', () async {
        when(
          () => mockStorage.write(
            key: any(named: 'key'),
            value: any(named: 'value'),
          ),
        ).thenAnswer((_) async {});

        await service.setupPin('1234');

        // Verify hash is stored, NOT plain '1234'
        verify(
          () => mockStorage.write(
            key: AppConstants.parentalGatePinHashKey,
            value: _expectedHash('1234'),
          ),
        ).called(1);

        // Verify flag is set
        verify(
          () => mockStorage.write(
            key: AppConstants.parentalGatePinSetKey,
            value: 'true',
          ),
        ).called(1);

        // Verify '1234' is never stored as plain text
        verifyNever(
          () => mockStorage.write(
            key: AppConstants.parentalGatePinHashKey,
            value: '1234',
          ),
        );
      });
    });

    group('verifyPin', () {
      test('returns true for correct PIN', () async {
        when(
          () => mockStorage.read(key: AppConstants.parentalGatePinHashKey),
        ).thenAnswer((_) async => _expectedHash('1234'));

        final result = await service.verifyPin('1234');

        expect(result, isTrue);
      });

      test('returns false for wrong PIN', () async {
        when(
          () => mockStorage.read(key: AppConstants.parentalGatePinHashKey),
        ).thenAnswer((_) async => _expectedHash('1234'));

        final result = await service.verifyPin('0000');

        expect(result, isFalse);
      });

      test('returns false when no hash stored', () async {
        when(
          () => mockStorage.read(key: AppConstants.parentalGatePinHashKey),
        ).thenAnswer((_) async => null);

        final result = await service.verifyPin('1234');

        expect(result, isFalse);
      });
    });

    group('canUseBiometric', () {
      test('returns true when device supports and has biometrics', () async {
        when(() => mockLocalAuth.isDeviceSupported())
            .thenAnswer((_) async => true);
        when(() => mockLocalAuth.canCheckBiometrics)
            .thenAnswer((_) async => true);
        when(() => mockLocalAuth.getAvailableBiometrics())
            .thenAnswer((_) async => [BiometricType.fingerprint]);

        final result = await service.canUseBiometric();

        expect(result, isTrue);
      });

      test('returns false when device not supported', () async {
        when(() => mockLocalAuth.isDeviceSupported())
            .thenAnswer((_) async => false);

        final result = await service.canUseBiometric();

        expect(result, isFalse);
      });

      test('returns false when canCheckBiometrics is false', () async {
        when(() => mockLocalAuth.isDeviceSupported())
            .thenAnswer((_) async => true);
        when(() => mockLocalAuth.canCheckBiometrics)
            .thenAnswer((_) async => false);

        final result = await service.canUseBiometric();

        expect(result, isFalse);
      });

      test('returns false when no biometrics enrolled', () async {
        when(() => mockLocalAuth.isDeviceSupported())
            .thenAnswer((_) async => true);
        when(() => mockLocalAuth.canCheckBiometrics)
            .thenAnswer((_) async => true);
        when(() => mockLocalAuth.getAvailableBiometrics())
            .thenAnswer((_) async => <BiometricType>[]);

        final result = await service.canUseBiometric();

        expect(result, isFalse);
      });

      test('returns false when exception thrown', () async {
        when(() => mockLocalAuth.isDeviceSupported())
            .thenThrow(Exception('platform error'));

        final result = await service.canUseBiometric();

        expect(result, isFalse);
      });
    });

    group('authenticateWithBiometric', () {
      test('returns true on successful auth', () async {
        when(
          () => mockLocalAuth.authenticate(
            localizedReason: any(named: 'localizedReason'),
            options: any(named: 'options'),
          ),
        ).thenAnswer((_) async => true);

        final result = await service.authenticateWithBiometric();

        expect(result, isTrue);
      });

      test('returns false on failed auth', () async {
        when(
          () => mockLocalAuth.authenticate(
            localizedReason: any(named: 'localizedReason'),
            options: any(named: 'options'),
          ),
        ).thenAnswer((_) async => false);

        final result = await service.authenticateWithBiometric();

        expect(result, isFalse);
      });

      test('returns false on exception', () async {
        when(
          () => mockLocalAuth.authenticate(
            localizedReason: any(named: 'localizedReason'),
            options: any(named: 'options'),
          ),
        ).thenThrow(Exception('platform error'));

        final result = await service.authenticateWithBiometric();

        expect(result, isFalse);
      });
    });
  });
}
