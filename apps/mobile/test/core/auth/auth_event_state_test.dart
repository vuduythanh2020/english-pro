/// Tests for AuthEvent and AuthState equatable classes.
/// Validates props equality, sealed class hierarchy, and value semantics.
/// Priority: P2
/// Status: NEW
library;

import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // ── AuthEvent Tests ──────────────────────────────────────────────
  group('AuthEvent', () {
    group('AuthStarted', () {
      test('two instances are equal', () {
        expect(const AuthStarted(), equals(const AuthStarted()));
      });

      test('props is empty list', () {
        expect(const AuthStarted().props, isEmpty);
      });
    });

    group('AuthLoggedIn', () {
      test('equal when tokens match', () {
        const a = AuthLoggedIn(
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
        );
        const b = AuthLoggedIn(
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
        );
        expect(a, equals(b));
      });

      test('not equal when accessToken differs', () {
        const a = AuthLoggedIn(
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
        );
        const b = AuthLoggedIn(
          accessToken: 'access-2',
          refreshToken: 'refresh-1',
        );
        expect(a, isNot(equals(b)));
      });

      test('not equal when refreshToken differs', () {
        const a = AuthLoggedIn(
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
        );
        const b = AuthLoggedIn(
          accessToken: 'access-1',
          refreshToken: 'refresh-2',
        );
        expect(a, isNot(equals(b)));
      });

      test('props contains accessToken and refreshToken', () {
        const event = AuthLoggedIn(
          accessToken: 'a',
          refreshToken: 'r',
        );
        expect(event.props, ['a', 'r']);
      });
    });

    group('AuthLoggedOut', () {
      test('two instances are equal', () {
        expect(const AuthLoggedOut(), equals(const AuthLoggedOut()));
      });

      test('props is empty list', () {
        expect(const AuthLoggedOut().props, isEmpty);
      });
    });

    group('AuthTokenRefreshed', () {
      test('equal when tokens match', () {
        const a = AuthTokenRefreshed(
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        );
        const b = AuthTokenRefreshed(
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        );
        expect(a, equals(b));
      });

      test('equal when refreshToken is null for both', () {
        const a = AuthTokenRefreshed(accessToken: 'new-access');
        const b = AuthTokenRefreshed(accessToken: 'new-access');
        expect(a, equals(b));
      });

      test('not equal when refreshToken differs (null vs value)', () {
        const a = AuthTokenRefreshed(accessToken: 'new-access');
        const b = AuthTokenRefreshed(
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        );
        expect(a, isNot(equals(b)));
      });

      test('props contains accessToken and refreshToken', () {
        const event = AuthTokenRefreshed(
          accessToken: 'a',
          refreshToken: 'r',
        );
        expect(event.props, ['a', 'r']);
      });
    });
  });

  // ── AuthState Tests ──────────────────────────────────────────────
  group('AuthState', () {
    group('AuthInitial', () {
      test('two instances are equal', () {
        expect(const AuthInitial(), equals(const AuthInitial()));
      });

      test('props is empty', () {
        expect(const AuthInitial().props, isEmpty);
      });
    });

    group('AuthLoading', () {
      test('two instances are equal', () {
        expect(const AuthLoading(), equals(const AuthLoading()));
      });
    });

    group('AuthAuthenticated', () {
      test('equal when all fields match', () {
        const a = AuthAuthenticated(
          accessToken: 'token-a',
          refreshToken: 'refresh-a',
          userRole: 'PARENT',
          hasConsent: true,
        );
        const b = AuthAuthenticated(
          accessToken: 'token-a',
          refreshToken: 'refresh-a',
          userRole: 'PARENT',
          hasConsent: true,
        );
        expect(a, equals(b));
      });

      test('not equal when accessToken differs', () {
        const a = AuthAuthenticated(accessToken: 'token-a');
        const b = AuthAuthenticated(accessToken: 'token-b');
        expect(a, isNot(equals(b)));
      });

      test('not equal when hasConsent differs', () {
        const a = AuthAuthenticated(
          accessToken: 'token-a',
          hasConsent: true,
        );
        const b = AuthAuthenticated(
          accessToken: 'token-a',
        );
        expect(a, isNot(equals(b)));
      });

      test('hasConsent defaults to false', () {
        const state = AuthAuthenticated(accessToken: 'token');
        expect(state.hasConsent, isFalse);
      });

      test('refreshToken defaults to null', () {
        const state = AuthAuthenticated(accessToken: 'token');
        expect(state.refreshToken, isNull);
      });

      test('userRole defaults to null', () {
        const state = AuthAuthenticated(accessToken: 'token');
        expect(state.userRole, isNull);
      });

      test('props includes all fields', () {
        const state = AuthAuthenticated(
          accessToken: 'a',
          refreshToken: 'r',
          userRole: 'CHILD',
          hasConsent: true,
          hasChildProfile: false,
        );
        expect(state.props, ['a', 'r', 'CHILD', true, false]);
      });
    });

    group('AuthUnauthenticated', () {
      test('two instances are equal', () {
        expect(
          const AuthUnauthenticated(),
          equals(const AuthUnauthenticated()),
        );
      });
    });

    group('state type checks', () {
      test('AuthInitial is an AuthState', () {
        expect(const AuthInitial(), isA<AuthState>());
      });

      test('AuthLoading is an AuthState', () {
        expect(const AuthLoading(), isA<AuthState>());
      });

      test('AuthAuthenticated is an AuthState', () {
        const state = AuthAuthenticated(accessToken: 'token');
        expect(state, isA<AuthState>());
      });

      test('AuthUnauthenticated is an AuthState', () {
        expect(const AuthUnauthenticated(), isA<AuthState>());
      });
    });
  });
}
