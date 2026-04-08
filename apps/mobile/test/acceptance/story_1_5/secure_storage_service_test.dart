/// ATDD Tests - Story 1.5: SecureStorageService
/// Test IDs: 1.5-STORE-001 through 1.5-STORE-002
/// Priority: P0-P1 (Token Security)
/// Status: 🔴 RED (failing before implementation)
///
/// These tests validate SecureStorageService CRUD operations for JWT tokens
/// using flutter_secure_storage (iOS Keychain / Android Keystore).
/// All tests use `skip: 'RED - ...'` as TDD red phase markers.
library;

import 'package:flutter_test/flutter_test.dart';

// RED: These imports will fail — source files do not exist yet
// import 'package:english_pro/core/storage/secure_storage_service.dart';
// import 'package:flutter_secure_storage/flutter_secure_storage.dart';
// import 'package:mocktail/mocktail.dart';

void main() {
  group('Story 1.5: SecureStorageService @P0 @Unit', () {
    // 1.5-STORE-001: Save/Get access + refresh tokens
    test(
      '1.5-STORE-001: saveAccessToken, '
      'getAccessToken, saveRefreshToken, '
      'getRefreshToken work correctly',
      skip: 'RED - SecureStorageService chưa tồn tại. '
          'Cần tạo lib/core/storage/secure_storage_service.dart',
      () {
        // GIVEN: Mock FlutterSecureStorage
        // final mockFlutterSecureStorage = MockFlutterSecureStorage();
        // final service = SecureStorageService(
        //   storage: mockFlutterSecureStorage,
        // );
        //
        // WHEN: saveAccessToken called
        // when(() => mockFlutterSecureStorage.write(
        //   key: 'auth_access_token',
        //   value: 'test-access-token',
        // )).thenAnswer((_) async {});
        // await service.saveAccessToken('test-access-token');
        //
        // WHEN: getAccessToken called
        // when(() => mockFlutterSecureStorage.read(key: 'auth_access_token'))
        //     .thenAnswer((_) async => 'test-access-token');
        // final token = await service.getAccessToken();
        //
        // THEN: correct token returned
        // expect(token, 'test-access-token');
        //
        // Same for refresh token with key 'auth_refresh_token'
      },
    );

    // 1.5-STORE-002: clearAll removes all tokens
    test(
      '1.5-STORE-002: clearAll removes both access and refresh tokens',
      skip: 'RED - SecureStorageService chưa tồn tại',
      () {
        // GIVEN: Tokens exist in storage
        // final mockFlutterSecureStorage = MockFlutterSecureStorage();
        // final service = SecureStorageService(
        //   storage: mockFlutterSecureStorage,
        // );
        //
        // WHEN: clearAll called
        // when(() => mockFlutterSecureStorage.deleteAll())
        //     .thenAnswer((_) async {});
        // await service.clearAll();
        //
        // THEN: deleteAll invoked
        // verify(() => mockFlutterSecureStorage.deleteAll()).called(1);
      },
    );
  });
}
