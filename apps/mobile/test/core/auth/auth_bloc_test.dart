/// Unit Tests - Story 1.5, Story 2.4 & Story 2.5: AuthBloc
/// Tests validate that AuthBloc correctly manages authentication state
/// using HydratedBloc pattern with SecureStorageService.
library;

import 'dart:convert';

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

    // Default stubs for child session storage (Story 2.5)
    when(() => mockStorage.getChildJwt()).thenAnswer((_) async => null);
    when(() => mockStorage.getChildId()).thenAnswer((_) async => null);
    when(
      () => mockStorage.saveChildJwt(any()),
    ).thenAnswer((_) async {});
    when(
      () => mockStorage.saveChildId(any()),
    ).thenAnswer((_) async {});
    when(() => mockStorage.clearChildJwt()).thenAnswer((_) async {});
    when(() => mockStorage.clearChildId()).thenAnswer((_) async {});
    // Parental Gate parent token snapshot (Story 2.6)
    when(
      () => mockStorage.saveParentAccessToken(any()),
    ).thenAnswer((_) async {});
    when(
      () => mockStorage.getParentAccessToken(),
    ).thenAnswer((_) async => null);
    when(
      () => mockStorage.clearParentAccessToken(),
    ).thenAnswer((_) async {});
  });

  group('AuthBloc', () {
    // 1.5-BLOC-001
    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthAuthenticated] when valid token exists',
      build: () {
        when(
          () => mockStorage.getAccessToken(),
        ).thenAnswer((_) async => 'valid-jwt-token');
        when(
          () => mockStorage.getHasConsent(),
        ).thenAnswer((_) async => false);
        when(
          () => mockStorage.getHasChildProfile(),
        ).thenAnswer((_) async => false);
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
  // ---------------------------------------------------------------------------
  group(
    'Story 2.3 — Consent persistence in AuthBloc',
    () {
      // FLUTTER-CONSENT-AUTH-001
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CONSENT-AUTH-001: AuthConsentGranted emits AuthAuthenticated(hasConsent: true) and saves to storage',
        build: () {
          when(
            () => mockStorage.saveHasConsent(any()),
          ).thenAnswer((_) async {});
          return AuthBloc(storageService: mockStorage);
        },
        seed: () => const AuthAuthenticated(accessToken: 'test-token'),
        act: (bloc) => bloc.add(const AuthConsentGranted()),
        expect: () => [
          const AuthAuthenticated(
            accessToken: 'test-token',
            hasConsent: true,
          ),
        ],
        verify: (_) {
          verify(() => mockStorage.saveHasConsent(true)).called(1);
        },
      );

      // FLUTTER-CONSENT-AUTH-002
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CONSENT-AUTH-002: AuthStarted with hasConsent=true in storage emits AuthAuthenticated(hasConsent: true)',
        build: () {
          when(
            () => mockStorage.getAccessToken(),
          ).thenAnswer((_) async => 'stored-token');
          when(
            () => mockStorage.getHasConsent(),
          ).thenAnswer((_) async => true);
          when(
            () => mockStorage.getHasChildProfile(),
          ).thenAnswer((_) async => false);
          return AuthBloc(storageService: mockStorage);
        },
        act: (bloc) => bloc.add(const AuthStarted()),
        expect: () => [
          isA<AuthLoading>(),
          const AuthAuthenticated(
            accessToken: 'stored-token',
            hasConsent: true,
          ),
        ],
      );

      // FLUTTER-CONSENT-AUTH-002b — hasConsent=false path
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CONSENT-AUTH-002b: AuthStarted with hasConsent=false in storage emits AuthAuthenticated(hasConsent: false)',
        build: () {
          when(
            () => mockStorage.getAccessToken(),
          ).thenAnswer((_) async => 'stored-token');
          when(
            () => mockStorage.getHasConsent(),
          ).thenAnswer((_) async => false);
          when(
            () => mockStorage.getHasChildProfile(),
          ).thenAnswer((_) async => false);
          return AuthBloc(storageService: mockStorage);
        },
        act: (bloc) => bloc.add(const AuthStarted()),
        expect: () => [
          isA<AuthLoading>(),
          const AuthAuthenticated(
            accessToken: 'stored-token',
          ),
        ],
      );

      // FLUTTER-CONSENT-AUTH-003
      // Verifies that AuthLoggedOut → clearAll() removes has_consent (AC7 logout path)
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
          verify(() => mockStorage.clearAll()).called(1);
        },
      );

      // FLUTTER-CONSENT-AUTH-004 — F-3 fix: fallback when state is not AuthAuthenticated
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CONSENT-AUTH-004: AuthConsentGranted recovers when state is not '
        'AuthAuthenticated by re-reading token from storage',
        build: () {
          when(
            () => mockStorage.saveHasConsent(any()),
          ).thenAnswer((_) async {});
          when(
            () => mockStorage.getAccessToken(),
          ).thenAnswer((_) async => 'recovered-token');
          return AuthBloc(storageService: mockStorage);
        },
        // seed to AuthLoading (simulates mid-token-refresh race)
        seed: () => const AuthLoading(),
        act: (bloc) => bloc.add(const AuthConsentGranted()),
        expect: () => [
          const AuthAuthenticated(
            accessToken: 'recovered-token',
            hasConsent: true,
          ),
        ],
        verify: (_) {
          verify(() => mockStorage.saveHasConsent(true)).called(1);
          verify(() => mockStorage.getAccessToken()).called(1);
        },
      );

      // FLUTTER-CONSENT-AUTH-005 — concurrent logout edge case
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CONSENT-AUTH-005: AuthConsentGranted emits nothing if token gone '
        '(concurrent logout)',
        build: () {
          when(
            () => mockStorage.saveHasConsent(any()),
          ).thenAnswer((_) async {});
          when(
            () => mockStorage.getAccessToken(),
          ).thenAnswer((_) async => null);
          return AuthBloc(storageService: mockStorage);
        },
        seed: () => const AuthLoading(),
        act: (bloc) => bloc.add(const AuthConsentGranted()),
        expect: () => [],
        verify: (_) {
          verify(() => mockStorage.saveHasConsent(true)).called(1);
        },
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Story 2.4 — Child Profile Creation & Avatar Selection
  // hasChildProfile persistence tests
  // ---------------------------------------------------------------------------
  group(
    'Story 2.4 — Child Profile persistence in AuthBloc',
    () {
      // FLUTTER-CHILD-PROFILE-AUTH-001
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-PROFILE-AUTH-001: AuthChildProfileCreated emits '
        'AuthAuthenticated(hasChildProfile: true) and saves to storage',
        build: () {
          when(
            () => mockStorage.saveHasChildProfile(any()),
          ).thenAnswer((_) async {});
          return AuthBloc(storageService: mockStorage);
        },
        seed: () => const AuthAuthenticated(
          accessToken: 'test-token',
          hasConsent: true,
        ),
        act: (bloc) => bloc.add(const AuthChildProfileCreated()),
        expect: () => [
          const AuthAuthenticated(
            accessToken: 'test-token',
            hasConsent: true,
            hasChildProfile: true,
          ),
        ],
        verify: (_) {
          verify(() => mockStorage.saveHasChildProfile(true)).called(1);
        },
      );

      // FLUTTER-CHILD-PROFILE-AUTH-002
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-PROFILE-AUTH-002: AuthStarted with hasChildProfile=true '
        'in storage emits AuthAuthenticated(hasChildProfile: true)',
        build: () {
          when(
            () => mockStorage.getAccessToken(),
          ).thenAnswer((_) async => 'stored-token');
          when(
            () => mockStorage.getHasConsent(),
          ).thenAnswer((_) async => true);
          when(
            () => mockStorage.getHasChildProfile(),
          ).thenAnswer((_) async => true);
          return AuthBloc(storageService: mockStorage);
        },
        act: (bloc) => bloc.add(const AuthStarted()),
        expect: () => [
          isA<AuthLoading>(),
          const AuthAuthenticated(
            accessToken: 'stored-token',
            hasConsent: true,
            hasChildProfile: true,
          ),
        ],
      );

      // FLUTTER-CHILD-PROFILE-AUTH-002b — hasChildProfile=false path
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-PROFILE-AUTH-002b: AuthStarted with hasChildProfile=false '
        'emits AuthAuthenticated(hasChildProfile: false)',
        build: () {
          when(
            () => mockStorage.getAccessToken(),
          ).thenAnswer((_) async => 'stored-token');
          when(
            () => mockStorage.getHasConsent(),
          ).thenAnswer((_) async => true);
          when(
            () => mockStorage.getHasChildProfile(),
          ).thenAnswer((_) async => false);
          return AuthBloc(storageService: mockStorage);
        },
        act: (bloc) => bloc.add(const AuthStarted()),
        expect: () => [
          isA<AuthLoading>(),
          const AuthAuthenticated(
            accessToken: 'stored-token',
            hasConsent: true,
          ),
        ],
      );

      // FLUTTER-CHILD-PROFILE-AUTH-003 — Token refresh preserves hasChildProfile
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-PROFILE-AUTH-003: AuthTokenRefreshed preserves '
        'hasChildProfile from current state',
        build: () {
          when(() => mockStorage.saveAccessToken(any()))
              .thenAnswer((_) async {});
          return AuthBloc(storageService: mockStorage);
        },
        seed: () => const AuthAuthenticated(
          accessToken: 'old-token',
          hasConsent: true,
          hasChildProfile: true,
        ),
        act: (bloc) => bloc.add(
          const AuthTokenRefreshed(accessToken: 'new-token'),
        ),
        expect: () => [
          const AuthAuthenticated(
            accessToken: 'new-token',
            hasConsent: true,
            hasChildProfile: true,
          ),
        ],
      );

      // FLUTTER-CHILD-PROFILE-AUTH-004 — hasChildProfile survives logout → login cycle
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-PROFILE-AUTH-004: AuthLoggedOut clears hasChildProfile '
        '(clearAll removes has_child_profile key)',
        build: () {
          when(() => mockStorage.clearAll()).thenAnswer((_) async {});
          return AuthBloc(storageService: mockStorage);
        },
        seed: () => const AuthAuthenticated(
          accessToken: 'test-token',
          hasConsent: true,
          hasChildProfile: true,
        ),
        act: (bloc) => bloc.add(const AuthLoggedOut()),
        expect: () => [
          const AuthUnauthenticated(),
        ],
        verify: (_) {
          verify(() => mockStorage.clearAll()).called(1);
        },
      );

      // FLUTTER-CHILD-PROFILE-AUTH-005 — Edge case recovery: reads hasConsent from storage
      // This tests the fix for MEDIUM-2: when AuthChildProfileCreated fires while the bloc
      // is NOT in AuthAuthenticated (e.g. mid token-refresh), the recovery path must read
      // hasConsent from storage so a user who already granted consent is not redirected back
      // to /consent screen.
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-PROFILE-AUTH-005: AuthChildProfileCreated edge-case recovery '
        'reads hasConsent from storage (preserves prior consent)',
        build: () {
          when(
            () => mockStorage.saveHasChildProfile(any()),
          ).thenAnswer((_) async {});
          when(
            () => mockStorage.getAccessToken(),
          ).thenAnswer((_) async => 'recovery-token');
          when(
            () => mockStorage.getHasConsent(),
          ).thenAnswer((_) async => true); // user already granted consent
          return AuthBloc(storageService: mockStorage);
        },
        // seed with non-AuthAuthenticated state to trigger the else-branch
        seed: () => const AuthLoading(),
        act: (bloc) => bloc.add(const AuthChildProfileCreated()),
        expect: () => [
          const AuthAuthenticated(
            accessToken: 'recovery-token',
            hasConsent: true,
            hasChildProfile: true,
          ),
        ],
        verify: (_) {
          verify(() => mockStorage.saveHasChildProfile(true)).called(1);
          verify(() => mockStorage.getHasConsent()).called(1);
        },
      );

      // FLUTTER-CHILD-PROFILE-AUTH-006 — Edge case: hasConsent=false in recovery
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-PROFILE-AUTH-006: AuthChildProfileCreated edge-case recovery '
        'preserves hasConsent=false when consent not yet granted',
        build: () {
          when(
            () => mockStorage.saveHasChildProfile(any()),
          ).thenAnswer((_) async {});
          when(
            () => mockStorage.getAccessToken(),
          ).thenAnswer((_) async => 'recovery-token');
          when(
            () => mockStorage.getHasConsent(),
          ).thenAnswer((_) async => false);
          return AuthBloc(storageService: mockStorage);
        },
        seed: () => const AuthLoading(),
        act: (bloc) => bloc.add(const AuthChildProfileCreated()),
        expect: () => [
          const AuthAuthenticated(
            accessToken: 'recovery-token',
            hasConsent: false,
            hasChildProfile: true,
          ),
        ],
      );
    },
  );

  // ---------------------------------------------------------------------------
  // Story 2.5 — Child Session Switching
  // AuthChildSessionStarted / AuthChildSessionEnded tests
  // ---------------------------------------------------------------------------
  group(
    'Story 2.5 — Child Session in AuthBloc',
    () {
      // Helper: create a JWT with exp N seconds in the future (base64url encoded)
      String makeChildJwt({
        required String childId,
        required String parentId,
        int expiresInSeconds = 3600,
      }) {
        final header = base64Url
            .encode('{"alg":"HS256","typ":"JWT"}'.codeUnits)
            .replaceAll('=', '');
        final expiry =
            (DateTime.now().millisecondsSinceEpoch ~/ 1000) + expiresInSeconds;
        final payload = base64Url
            .encode(
              '{"sub":"$childId","childId":"$childId","parentId":"$parentId",'
                      '"role":"child","exp":$expiry}'
                  .codeUnits,
            )
            .replaceAll('=', '');
        return '$header.$payload.fake-signature';
      }

      // FLUTTER-CHILD-SESSION-001
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-SESSION-001: AuthChildSessionStarted saves JWT/childId and emits AuthChildSessionActive',
        build: () {
          when(
            () => mockStorage.saveChildJwt(any()),
          ).thenAnswer((_) async {});
          when(
            () => mockStorage.saveChildId(any()),
          ).thenAnswer((_) async {});
          return AuthBloc(storageService: mockStorage);
        },
        seed: () => const AuthAuthenticated(accessToken: 'parent-token'),
        act: (bloc) {
          final jwt = makeChildJwt(
            childId: 'child-uuid-1',
            parentId: 'parent-uuid',
          );
          bloc.add(AuthChildSessionStarted(
            childId: 'child-uuid-1',
            childJwt: jwt,
          ));
        },
        expect: () => [isA<AuthChildSessionActive>()],
        verify: (_) {
          verify(() => mockStorage.saveChildJwt(any())).called(1);
          verify(() => mockStorage.saveChildId('child-uuid-1')).called(1);
        },
      );

      // FLUTTER-CHILD-SESSION-002
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-SESSION-002: AuthChildSessionActive contains correct childId and parentId from JWT claims',
        build: () {
          when(
            () => mockStorage.saveChildJwt(any()),
          ).thenAnswer((_) async {});
          when(
            () => mockStorage.saveChildId(any()),
          ).thenAnswer((_) async {});
          return AuthBloc(storageService: mockStorage);
        },
        seed: () => const AuthAuthenticated(accessToken: 'parent-token'),
        act: (bloc) {
          final jwt = makeChildJwt(
            childId: 'child-uuid-123',
            parentId: 'parent-uuid-456',
          );
          bloc.add(AuthChildSessionStarted(
            childId: 'child-uuid-123',
            childJwt: jwt,
          ));
        },
        expect: () => [
          isA<AuthChildSessionActive>()
              .having((s) => s.childId, 'childId', 'child-uuid-123')
              .having((s) => s.parentId, 'parentId', 'parent-uuid-456')
              .having(
                (s) => s.parentAccessToken,
                'parentAccessToken',
                'parent-token',
              ),
        ],
      );

      // FLUTTER-CHILD-SESSION-003
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-SESSION-003: AuthChildSessionEnded clears child data and restores parent session',
        build: () {
          when(() => mockStorage.clearChildJwt()).thenAnswer((_) async {});
          when(() => mockStorage.clearChildId()).thenAnswer((_) async {});
          when(
            () => mockStorage.getHasConsent(),
          ).thenAnswer((_) async => true);
          when(
            () => mockStorage.getHasChildProfile(),
          ).thenAnswer((_) async => true);
          return AuthBloc(storageService: mockStorage);
        },
        seed: () {
          final jwt = makeChildJwt(
            childId: 'child-uuid-1',
            parentId: 'parent-uuid',
          );
          return AuthChildSessionActive(
            childJwt: jwt,
            childId: 'child-uuid-1',
            parentId: 'parent-uuid',
            parentAccessToken: 'parent-token',
          );
        },
        act: (bloc) => bloc.add(const AuthChildSessionEnded()),
        expect: () => [isA<AuthAuthenticated>()],
        verify: (bloc) {
          verify(() => mockStorage.clearChildJwt()).called(1);
          verify(() => mockStorage.clearChildId()).called(1);
          final authenticated = bloc.state as AuthAuthenticated;
          expect(authenticated.accessToken, 'parent-token');
          expect(authenticated.hasConsent, true);
          expect(authenticated.hasChildProfile, true);
        },
      );

      // FLUTTER-CHILD-SESSION-004
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-SESSION-004: AuthChildSessionEnded falls back to storage when parentAccessToken missing',
        build: () {
          when(() => mockStorage.clearChildJwt()).thenAnswer((_) async {});
          when(() => mockStorage.clearChildId()).thenAnswer((_) async {});
          when(
            () => mockStorage.getAccessToken(),
          ).thenAnswer((_) async => 'stored-parent-token');
          when(
            () => mockStorage.getHasConsent(),
          ).thenAnswer((_) async => false);
          when(
            () => mockStorage.getHasChildProfile(),
          ).thenAnswer((_) async => true);
          return AuthBloc(storageService: mockStorage);
        },
        // Seed with state that has no parentAccessToken
        seed: () {
          final jwt = makeChildJwt(
            childId: 'child-uuid-1',
            parentId: 'parent-uuid',
          );
          return AuthChildSessionActive(
            childJwt: jwt,
            childId: 'child-uuid-1',
            parentId: 'parent-uuid',
            parentAccessToken: null, // no parent token in state
          );
        },
        act: (bloc) => bloc.add(const AuthChildSessionEnded()),
        expect: () => [
          isA<AuthAuthenticated>().having(
            (s) => s.accessToken,
            'accessToken',
            'stored-parent-token',
          ),
        ],
      );

      // FLUTTER-CHILD-SESSION-005
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-SESSION-005: AuthChildSessionEnded emits AuthUnauthenticated when no parent token available',
        build: () {
          when(() => mockStorage.clearChildJwt()).thenAnswer((_) async {});
          when(() => mockStorage.clearChildId()).thenAnswer((_) async {});
          when(
            () => mockStorage.getAccessToken(),
          ).thenAnswer((_) async => null); // no token in storage
          when(() => mockStorage.clearAll()).thenAnswer((_) async {});
          return AuthBloc(storageService: mockStorage);
        },
        seed: () {
          final jwt = makeChildJwt(
            childId: 'child-uuid-1',
            parentId: 'parent-uuid',
          );
          return AuthChildSessionActive(
            childJwt: jwt,
            childId: 'child-uuid-1',
            parentId: 'parent-uuid',
            parentAccessToken: null,
          );
        },
        act: (bloc) => bloc.add(const AuthChildSessionEnded()),
        expect: () => [const AuthUnauthenticated()],
        verify: (_) {
          verify(() => mockStorage.clearAll()).called(1);
        },
      );

      // FLUTTER-CHILD-SESSION-006
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-SESSION-006: AuthStarted restores AuthChildSessionActive when valid child JWT in storage',
        build: () {
          final jwt = makeChildJwt(
            childId: 'child-uuid-1',
            parentId: 'parent-uuid',
            expiresInSeconds: 3600,
          );
          when(
            () => mockStorage.getAccessToken(),
          ).thenAnswer((_) async => 'parent-token');
          when(
            () => mockStorage.getChildJwt(),
          ).thenAnswer((_) async => jwt);
          when(
            () => mockStorage.getChildId(),
          ).thenAnswer((_) async => 'child-uuid-1');
          return AuthBloc(storageService: mockStorage);
        },
        act: (bloc) => bloc.add(const AuthStarted()),
        expect: () => [
          isA<AuthLoading>(),
          isA<AuthChildSessionActive>()
              .having((s) => s.childId, 'childId', 'child-uuid-1'),
        ],
      );

      // FLUTTER-CHILD-SESSION-007
      blocTest<AuthBloc, AuthState>(
        'FLUTTER-CHILD-SESSION-007: AuthStarted falls through to AuthAuthenticated when child JWT is expired',
        build: () {
          // Create an already-expired JWT (expiry in the past)
          final header = base64Url
              .encode('{"alg":"HS256","typ":"JWT"}'.codeUnits)
              .replaceAll('=', '');
          final expiry =
              (DateTime.now().millisecondsSinceEpoch ~/ 1000) - 100; // past
          final payload = base64Url
              .encode(
                '{"sub":"child-uuid","childId":"child-uuid","parentId":"parent-uuid",'
                        '"role":"child","exp":$expiry}'
                    .codeUnits,
              )
              .replaceAll('=', '');
          final expiredJwt = '$header.$payload.fake-sig';

          when(
            () => mockStorage.getAccessToken(),
          ).thenAnswer((_) async => 'parent-token');
          when(
            () => mockStorage.getChildJwt(),
          ).thenAnswer((_) async => expiredJwt);
          when(
            () => mockStorage.getChildId(),
          ).thenAnswer((_) async => 'child-uuid');
          when(
            () => mockStorage.clearChildJwt(),
          ).thenAnswer((_) async {});
          when(
            () => mockStorage.clearChildId(),
          ).thenAnswer((_) async {});
          when(
            () => mockStorage.getHasConsent(),
          ).thenAnswer((_) async => true);
          when(
            () => mockStorage.getHasChildProfile(),
          ).thenAnswer((_) async => true);
          return AuthBloc(storageService: mockStorage);
        },
        act: (bloc) => bloc.add(const AuthStarted()),
        expect: () => [
          isA<AuthLoading>(),
          isA<AuthAuthenticated>(),
        ],
        verify: (_) {
          verify(() => mockStorage.clearChildJwt()).called(1);
          verify(() => mockStorage.clearChildId()).called(1);
        },
      );
    },
  );
}
