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
}
