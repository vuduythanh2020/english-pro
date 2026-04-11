/// Unit Tests - Story 1.5: AuthBloc
/// Tests validate that AuthBloc correctly manages authentication state
/// using HydratedBloc pattern with SecureStorageService.
library;

import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:mocktail/mocktail.dart';

class MockSecureStorageService extends Mock implements SecureStorageService {}

class MockStorage extends Mock implements Storage {}

void main() {
  late MockSecureStorageService mockStorage;
  late MockStorage mockHydratedStorage;

  setUp(() {
    mockStorage = MockSecureStorageService();
    mockHydratedStorage = MockStorage();

    when(() => mockHydratedStorage.read(any())).thenReturn(null);
    when(
      () => mockHydratedStorage.write(any(), any<dynamic>()),
    ).thenAnswer((_) async {});
    when(
      () => mockHydratedStorage.delete(any()),
    ).thenAnswer((_) async {});
    when(() => mockHydratedStorage.clear()).thenAnswer((_) async {});

    HydratedBloc.storage = mockHydratedStorage;
  });

  group('AuthBloc', () {
    // 1.5-BLOC-001
    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthAuthenticated] when valid token exists',
      build: () {
        when(
          () => mockStorage.getAccessToken(),
        ).thenAnswer((_) async => 'valid-jwt-token');
        return AuthBloc(storageService: mockStorage);
      },
      act: (bloc) => bloc.add(const AuthStarted()),
      expect: () => [
        isA<AuthLoading>(),
        isA<AuthAuthenticated>(),
      ],
    );

    // 1.5-BLOC-002
    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthUnauthenticated] when no token',
      build: () {
        when(() => mockStorage.getAccessToken()).thenAnswer((_) async => null);
        return AuthBloc(storageService: mockStorage);
      },
      act: (bloc) => bloc.add(const AuthStarted()),
      expect: () => [
        isA<AuthLoading>(),
        const AuthUnauthenticated(),
      ],
    );

    // 1.5-BLOC-003
    blocTest<AuthBloc, AuthState>(
      'AuthLoggedIn saves tokens and emits AuthAuthenticated',
      build: () {
        when(() => mockStorage.saveAccessToken(any())).thenAnswer((_) async {});
        when(
          () => mockStorage.saveRefreshToken(any()),
        ).thenAnswer((_) async {});
        return AuthBloc(storageService: mockStorage);
      },
      act: (bloc) => bloc.add(
        const AuthLoggedIn(
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        ),
      ),
      expect: () => [
        isA<AuthAuthenticated>(),
      ],
      verify: (_) {
        verify(() => mockStorage.saveAccessToken('new-access')).called(1);
        verify(() => mockStorage.saveRefreshToken('new-refresh')).called(1);
      },
    );

    // 1.5-BLOC-004
    blocTest<AuthBloc, AuthState>(
      'AuthLoggedOut clears tokens and emits AuthUnauthenticated',
      build: () {
        when(() => mockStorage.clearAll()).thenAnswer((_) async {});
        return AuthBloc(storageService: mockStorage);
      },
      act: (bloc) => bloc.add(const AuthLoggedOut()),
      expect: () => [
        const AuthUnauthenticated(),
      ],
      verify: (_) {
        verify(() => mockStorage.clearAll()).called(1);
      },
    );

    // 1.5-BLOC-005
    test('toJson returns null — no token serialization', () {
      final bloc = AuthBloc(storageService: mockStorage);
      addTearDown(bloc.close);
      final json = bloc.toJson(
        const AuthAuthenticated(accessToken: 'token'),
      );
      expect(json, isNull);
    });

    // 1.5-BLOC-006
    test('fromJson returns null — forces re-check', () {
      final bloc = AuthBloc(storageService: mockStorage);
      addTearDown(bloc.close);
      final state = bloc.fromJson(
        {'status': 'authenticated'},
      );
      expect(state, isNull);
    });
  });

  // ---------------------------------------------------------------------------
  // Story 2.3 — Parental Consent & Age Declaration Flow
  // Consent persistence tests (AC7: consent survives app restart & clears on logout)
  // TDD Red Phase — remove skip when implementing Story 2.3
  // ---------------------------------------------------------------------------
  group(
    'Story 2.3 — Consent persistence in AuthBloc',
    skip: 'TDD Red Phase — implement AuthConsentGranted event and SecureStorageService.getHasConsent/saveHasConsent',
    () {
      // FLUTTER-CONSENT-AUTH-001
      // Requires: AuthConsentGranted event in auth_event.dart
      // Requires: SecureStorageService.saveHasConsent(bool) method
      // Requires: AuthBloc._onConsentGranted handler that saves & emits hasConsent=true
      test(
        'FLUTTER-CONSENT-AUTH-001: AuthConsentGranted emits AuthAuthenticated(hasConsent: true) and saves to storage',
        () => fail(
          'Not implemented: '
          '1) Add AuthConsentGranted event to auth_event.dart, '
          '2) Add saveHasConsent(bool) to SecureStorageService, '
          '3) Handle AuthConsentGranted in AuthBloc to emit AuthAuthenticated(hasConsent: true) '
          'and call storageService.saveHasConsent(true)',
        ),
      );

      // FLUTTER-CONSENT-AUTH-002
      // Requires: SecureStorageService.getHasConsent() method
      // Requires: AuthBloc._onAuthStarted reads hasConsent from storage and wires into AuthAuthenticated
      test(
        'FLUTTER-CONSENT-AUTH-002: AuthStarted with hasConsent=true in storage emits AuthAuthenticated(hasConsent: true)',
        () => fail(
          'Not implemented: '
          '1) Add getHasConsent() to SecureStorageService (reads key "has_consent"), '
          '2) In AuthBloc._onAuthStarted, read hasConsent and pass to '
          'AuthAuthenticated(accessToken: token, hasConsent: hasConsent)',
        ),
      );

      // FLUTTER-CONSENT-AUTH-003
      // Verifies that AuthLoggedOut → clearAll() removes has_consent (AC7 logout path)
      // NOTE: clearAll() already calls deleteAll() which removes ALL keys.
      // This test documents that Story 2.3 AC7 logout requirement is met by existing behavior.
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CONSENT-AUTH-003: AuthLoggedOut calls clearAll which removes has_consent key',
        build: () {
          when(() => mockStorage.clearAll()).thenAnswer((_) async {});
          return AuthBloc(storageService: mockStorage);
        },
        act: (bloc) => bloc.add(const AuthLoggedOut()),
        expect: () => [
          const AuthUnauthenticated(),
        ],
        verify: (_) {
          // clearAll() calls _storage.deleteAll() which removes all keys
          // including 'has_consent' — no special handling needed for logout
          verify(() => mockStorage.clearAll()).called(1);
        },
      );
    },
  );
}
