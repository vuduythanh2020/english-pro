/// Unit Tests - Story 1.5: SecureStorageService
library;

import 'package:english_pro/core/constants/app_constants.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late MockFlutterSecureStorage mockStorage;
  late SecureStorageService service;

  setUp(() {
    mockStorage = MockFlutterSecureStorage();
    service = SecureStorageService(storage: mockStorage);
  });

  group('SecureStorageService', () {
    test('saveAccessToken writes to correct key', () async {
      when(
        () => mockStorage.write(
          key: any(named: 'key'),
          value: any(named: 'value'),
        ),
      ).thenAnswer((_) async {});

      await service.saveAccessToken('my-token');

      verify(
        () => mockStorage.write(
          key: AppConstants.accessTokenKey,
          value: 'my-token',
        ),
      ).called(1);
    });

    test('getAccessToken reads from correct key', () async {
      when(
        () => mockStorage.read(key: any(named: 'key')),
      ).thenAnswer((_) async => 'stored-token');

      final result = await service.getAccessToken();

      expect(result, 'stored-token');
      verify(
        () => mockStorage.read(key: AppConstants.accessTokenKey),
      ).called(1);
    });

    test('saveRefreshToken writes to correct key', () async {
      when(
        () => mockStorage.write(
          key: any(named: 'key'),
          value: any(named: 'value'),
        ),
      ).thenAnswer((_) async {});

      await service.saveRefreshToken('refresh-tok');

      verify(
        () => mockStorage.write(
          key: AppConstants.refreshTokenKey,
          value: 'refresh-tok',
        ),
      ).called(1);
    });

    test('getRefreshToken reads from correct key', () async {
      when(
        () => mockStorage.read(key: any(named: 'key')),
      ).thenAnswer((_) async => 'refresh-stored');

      final result = await service.getRefreshToken();

      expect(result, 'refresh-stored');
      verify(
        () => mockStorage.read(key: AppConstants.refreshTokenKey),
      ).called(1);
    });

    test('clearAll deletes all values', () async {
      when(() => mockStorage.deleteAll()).thenAnswer((_) async {});

      await service.clearAll();

      verify(() => mockStorage.deleteAll()).called(1);
    });

    test('getAccessToken returns null when no token', () async {
      when(
        () => mockStorage.read(key: any(named: 'key')),
      ).thenAnswer((_) async => null);

      final result = await service.getAccessToken();

      expect(result, isNull);
    });
  });
}
