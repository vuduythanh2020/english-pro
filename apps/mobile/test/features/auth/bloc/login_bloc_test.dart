// TDD Red Phase – Story 2.2: Parent Login & Session Management
//
// These tests are intentionally SKIPPED until the LoginBloc, LoginEvent,
// LoginState, LoginForm, and AuthRepository.login() are implemented.
// Remove the `skip:` parameter from each group once the feature exists.
//
// Coverage:
//   FLUTTER-UNIT-001  LoginForm validation (no password strength for login)
//   FLUTTER-UNIT-002  LoginBloc initial state
//   FLUTTER-UNIT-003  LoginBloc email / password field changes
//   FLUTTER-UNIT-004  LoginBloc submit – validation failure
//   FLUTTER-UNIT-005  LoginBloc submit – success (AC1, AC2)
//   FLUTTER-UNIT-006  LoginBloc submit – 401 unified error (AC4)
//   FLUTTER-UNIT-007  LoginBloc submit – 429 rate limit (AC5)
//   FLUTTER-UNIT-008  LoginBloc submit – network error
//   FLUTTER-UNIT-009  LoginBloc submit – unknown exception fallback
//   FLUTTER-UNIT-010  LoginFailure.errorId uniqueness (SnackBar re-trigger)

import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/features/auth/bloc/login_bloc.dart';
import 'package:english_pro/features/auth/bloc/login_event.dart';
import 'package:english_pro/features/auth/bloc/login_state.dart';
import 'package:english_pro/features/auth/models/login_form.dart';
import 'package:english_pro/features/auth/repositories/auth_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository mockRepo;

  setUp(() {
    mockRepo = MockAuthRepository();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FLUTTER-UNIT-001: LoginForm validation
  // Login does NOT enforce password strength (AC3) – only non-empty + max 128.
  // ─────────────────────────────────────────────────────────────────────────
  group(
    'LoginForm',
    () {
      test('isValid is false when both fields are empty', () {
        const form = LoginForm(email: '', password: '');
        expect(form.isValid, isFalse);
      });

      test('isValid is true for a valid email and non-empty password', () {
        const form = LoginForm(
          email: 'parent@example.com',
          password: 'anypassword',
        );
        expect(form.isValid, isTrue);
      });

      test('isValid is false for a malformed email', () {
        const form = LoginForm(
          email: 'not-an-email',
          password: 'anypassword',
        );
        expect(form.isValid, isFalse);
      });

      test('isValid is false when password is empty', () {
        const form = LoginForm(
          email: 'parent@example.com',
          password: '',
        );
        expect(form.isValid, isFalse);
      });

      test(
        'password without uppercase/digit is still valid for login (AC3)',
        () {
          // Login does NOT enforce registration password rules.
          const form = LoginForm(
            email: 'parent@example.com',
            password: 'weakpassword',
          );
          expect(form.isValid, isTrue);
        },
      );

      test('password exactly 128 characters is valid', () {
        final form = LoginForm(
          email: 'parent@example.com',
          password: 'a' * 128,
        );
        expect(form.isValid, isTrue);
      });

      test('password exceeding 128 characters is invalid', () {
        final form = LoginForm(
          email: 'parent@example.com',
          password: 'a' * 129,
        );
        expect(form.isValid, isFalse);
      });

      test('copyWith returns updated form', () {
        const original = LoginForm(email: 'old@example.com', password: 'pass');
        final updated = original.copyWith(email: 'new@example.com');
        expect(updated.email, 'new@example.com');
        expect(updated.password, 'pass');
      });
    },
  );

  // ─────────────────────────────────────────────────────────────────────────
  // FLUTTER-UNIT-002 through FLUTTER-UNIT-010: LoginBloc state transitions
  // ─────────────────────────────────────────────────────────────────────────
  group(
    'LoginBloc',
    () {
      // FLUTTER-UNIT-002: initial state
      test('initial state is LoginInitial with empty form', () {
        final bloc = LoginBloc(authRepository: mockRepo);
        expect(bloc.state, isA<LoginInitial>());
        expect(bloc.state.form.email, isEmpty);
        expect(bloc.state.form.password, isEmpty);
        bloc.close();
      });

      // FLUTTER-UNIT-003: field changes emit LoginValidating
      blocTest<LoginBloc, LoginState>(
        'emits LoginValidating when email changes',
        build: () => LoginBloc(authRepository: mockRepo),
        act: (bloc) =>
            bloc.add(const LoginEmailChanged('parent@example.com')),
        expect: () => [
          isA<LoginValidating>().having(
            (s) => s.form.email,
            'email',
            'parent@example.com',
          ),
        ],
      );

      blocTest<LoginBloc, LoginState>(
        'emits LoginValidating when password changes',
        build: () => LoginBloc(authRepository: mockRepo),
        act: (bloc) => bloc.add(const LoginPasswordChanged('MyPassword')),
        expect: () => [
          isA<LoginValidating>().having(
            (s) => s.form.password,
            'password',
            'MyPassword',
          ),
        ],
      );

      // FLUTTER-UNIT-004: submit with invalid form
      blocTest<LoginBloc, LoginState>(
        'emits LoginFailure when form is invalid on submit',
        build: () => LoginBloc(authRepository: mockRepo),
        act: (bloc) => bloc.add(const LoginSubmitted()),
        expect: () => [isA<LoginFailure>()],
      );

      // FLUTTER-UNIT-005: successful login (AC1 – token issuance, AC2 – session)
      blocTest<LoginBloc, LoginState>(
        'emits [LoginSubmitting, LoginSuccess] on successful login (AC1, AC2)',
        build: () {
          when(
            () => mockRepo.login(
              email: any(named: 'email'),
              password: any(named: 'password'),
            ),
          ).thenAnswer(
            (_) async => {
              'accessToken': 'access-token-123',
              'refreshToken': 'refresh-token-456',
              'user': {
                'id': 'user-id',
                'email': 'parent@example.com',
                'role': 'PARENT',
              },
            },
          );
          return LoginBloc(authRepository: mockRepo);
        },
        seed: () => LoginValidating(
          form: const LoginForm(
            email: 'parent@example.com',
            password: 'MyPassword',
          ),
        ),
        act: (bloc) => bloc.add(const LoginSubmitted()),
        expect: () => [
          isA<LoginSubmitting>(),
          isA<LoginSuccess>()
              .having(
                (s) => s.accessToken,
                'accessToken',
                'access-token-123',
              )
              .having(
                (s) => s.refreshToken,
                'refreshToken',
                'refresh-token-456',
              ),
        ],
      );

      // FLUTTER-UNIT-006: 401 → unified Vietnamese error message (AC4)
      blocTest<LoginBloc, LoginState>(
        'emits unified error message on 401 – does not distinguish '
            'wrong email vs wrong password (AC4)',
        build: () {
          when(
            () => mockRepo.login(
              email: any(named: 'email'),
              password: any(named: 'password'),
            ),
          ).thenThrow(
            const UnauthorizedException(
              message: 'Email hoặc mật khẩu không đúng',
            ),
          );
          return LoginBloc(authRepository: mockRepo);
        },
        seed: () => LoginValidating(
          form: const LoginForm(
            email: 'wrong@example.com',
            password: 'WrongPass',
          ),
        ),
        act: (bloc) => bloc.add(const LoginSubmitted()),
        expect: () => [
          isA<LoginSubmitting>(),
          isA<LoginFailure>().having(
            (s) => s.error,
            'error',
            'Email hoặc mật khẩu không đúng',
          ),
        ],
      );

      // FLUTTER-UNIT-007: 429 rate limit (AC5 – 5 attempts/minute)
      blocTest<LoginBloc, LoginState>(
        'emits [LoginSubmitting, LoginFailure] on 429 rate limit (AC5)',
        build: () {
          when(
            () => mockRepo.login(
              email: any(named: 'email'),
              password: any(named: 'password'),
            ),
          ).thenThrow(
            const ServerException(
              message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
              statusCode: 429,
            ),
          );
          return LoginBloc(authRepository: mockRepo);
        },
        seed: () => LoginValidating(
          form: const LoginForm(
            email: 'parent@example.com',
            password: 'MyPassword',
          ),
        ),
        act: (bloc) => bloc.add(const LoginSubmitted()),
        expect: () => [
          isA<LoginSubmitting>(),
          isA<LoginFailure>().having(
            (s) => s.error,
            'error',
            'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
          ),
        ],
      );

      // FLUTTER-UNIT-008: network error
      blocTest<LoginBloc, LoginState>(
        'emits [LoginSubmitting, LoginFailure] on network error',
        build: () {
          when(
            () => mockRepo.login(
              email: any(named: 'email'),
              password: any(named: 'password'),
            ),
          ).thenThrow(const NetworkException());
          return LoginBloc(authRepository: mockRepo);
        },
        seed: () => LoginValidating(
          form: const LoginForm(
            email: 'parent@example.com',
            password: 'MyPassword',
          ),
        ),
        act: (bloc) => bloc.add(const LoginSubmitted()),
        expect: () => [
          isA<LoginSubmitting>(),
          isA<LoginFailure>().having(
            (s) => s.error,
            'error',
            isNotEmpty,
          ),
        ],
      );

      // FLUTTER-UNIT-009: unknown exception fallback
      blocTest<LoginBloc, LoginState>(
        'emits [LoginSubmitting, LoginFailure] with fallback '
            'message on unknown exception',
        build: () {
          when(
            () => mockRepo.login(
              email: any(named: 'email'),
              password: any(named: 'password'),
            ),
          ).thenThrow(Exception('Unknown'));
          return LoginBloc(authRepository: mockRepo);
        },
        seed: () => LoginValidating(
          form: const LoginForm(
            email: 'parent@example.com',
            password: 'MyPassword',
          ),
        ),
        act: (bloc) => bloc.add(const LoginSubmitted()),
        expect: () => [
          isA<LoginSubmitting>(),
          isA<LoginFailure>().having(
            (s) => s.error,
            'error',
            'Đăng nhập thất bại. Vui lòng thử lại.',
          ),
        ],
      );

      // FLUTTER-UNIT-010: errorId uniqueness ensures SnackBar re-fires
      test(
        'LoginFailure.errorId is unique across repeated failures '
            'with the same message',
        () {
          final failure1 = LoginFailure(
            form: const LoginForm(
              email: 'test@example.com',
              password: 'WrongPass',
            ),
            error: 'Email hoặc mật khẩu không đúng',
          );
          final failure2 = LoginFailure(
            form: const LoginForm(
              email: 'test@example.com',
              password: 'WrongPass',
            ),
            error: 'Email hoặc mật khẩu không đúng',
          );
          expect(failure1.errorId, isNot(equals(failure2.errorId)));
        },
      );
    },
  );
}
