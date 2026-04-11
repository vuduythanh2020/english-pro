// TDD Red Phase – Story 2.2: Parent Login & Session Management
//
// These tests are intentionally SKIPPED until LoginScreen, LoginBloc,
// LoginEvent, LoginState, and LoginForm are implemented.
// Remove the `skip:` parameter from each group once the feature exists.
//
// Coverage:
//   FLUTTER-WIDGET-001  LoginScreen renders header text
//   FLUTTER-WIDGET-002  LoginScreen renders email/password fields
//   FLUTTER-WIDGET-003  Submit button disabled when form is invalid (LoginInitial)
//   FLUTTER-WIDGET-004  Submit button enabled when form is valid (LoginValidating)
//   FLUTTER-WIDGET-005  Shows loading indicator when LoginSubmitting
//   FLUTTER-WIDGET-006  Shows SnackBar on LoginFailure
//   FLUTTER-WIDGET-007  Dispatches AuthLoggedIn on LoginSuccess (AC1, AC2)
//   FLUTTER-WIDGET-008  Renders registration link
//   FLUTTER-WIDGET-009  Dispatches LoginEmailChanged on email input
//   FLUTTER-WIDGET-010  Dispatches LoginPasswordChanged on password input

import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:english_pro/features/auth/bloc/login_bloc.dart';
import 'package:english_pro/features/auth/bloc/login_event.dart';
import 'package:english_pro/features/auth/bloc/login_state.dart';
import 'package:english_pro/features/auth/models/login_form.dart';
import 'package:english_pro/features/auth/view/login_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockLoginBloc extends MockBloc<LoginEvent, LoginState>
    implements LoginBloc {}

class MockAuthBloc extends MockBloc<AuthEvent, AuthState>
    implements AuthBloc {}

void main() {
  late MockLoginBloc mockLoginBloc;
  late MockAuthBloc mockAuthBloc;

  setUpAll(() {
    registerFallbackValue(const LoginSubmitted());
    registerFallbackValue(const LoginInitial());
    registerFallbackValue(const AuthStarted());
    registerFallbackValue(const AuthInitial());
  });

  setUp(() {
    mockLoginBloc = MockLoginBloc();
    mockAuthBloc = MockAuthBloc();
    when(() => mockAuthBloc.state).thenReturn(const AuthUnauthenticated());
  });

  Widget buildSubject() {
    return MaterialApp(
      home: MultiBlocProvider(
        providers: [
          BlocProvider<LoginBloc>.value(value: mockLoginBloc),
          BlocProvider<AuthBloc>.value(value: mockAuthBloc),
        ],
        child: const LoginScreen(),
      ),
    );
  }

  group(
    'LoginScreen',
    () {
      // FLUTTER-WIDGET-001: header text
      testWidgets('renders header text', (tester) async {
        when(() => mockLoginBloc.state).thenReturn(const LoginInitial());
        await tester.pumpWidget(buildSubject());

        expect(find.text('Đăng nhập'), findsOneWidget);
      });

      // FLUTTER-WIDGET-002: email and password fields are present
      testWidgets('renders email and password input fields', (tester) async {
        when(() => mockLoginBloc.state).thenReturn(const LoginInitial());
        await tester.pumpWidget(buildSubject());

        expect(find.text('Email'), findsOneWidget);
        expect(find.text('Mật khẩu'), findsOneWidget);
      });

      // FLUTTER-WIDGET-003: submit button disabled for invalid form
      testWidgets(
        'submit button is disabled when form is invalid (LoginInitial)',
        (tester) async {
          when(() => mockLoginBloc.state).thenReturn(const LoginInitial());
          await tester.pumpWidget(buildSubject());

          final button = tester.widget<FilledButton>(
            find.byType(FilledButton),
          );
          expect(button.onPressed, isNull);
        },
      );

      // FLUTTER-WIDGET-004: submit button enabled when form is valid
      testWidgets(
        'submit button is enabled when form is valid (LoginValidating)',
        (tester) async {
          when(() => mockLoginBloc.state).thenReturn(
            LoginValidating(
              form: const LoginForm(
                email: 'parent@example.com',
                password: 'anypassword',
              ),
            ),
          );
          await tester.pumpWidget(buildSubject());

          final button = tester.widget<FilledButton>(
            find.byType(FilledButton),
          );
          expect(button.onPressed, isNotNull);
        },
      );

      // FLUTTER-WIDGET-005: loading indicator during submission
      testWidgets(
        'shows loading indicator when LoginSubmitting',
        (tester) async {
          when(() => mockLoginBloc.state).thenReturn(
            LoginSubmitting(
              form: const LoginForm(
                email: 'parent@example.com',
                password: 'anypassword',
              ),
            ),
          );
          await tester.pumpWidget(buildSubject());

          expect(find.byType(CircularProgressIndicator), findsOneWidget);
        },
      );

      // FLUTTER-WIDGET-006: SnackBar shown on LoginFailure
      testWidgets(
        'shows snackbar on LoginFailure with error message',
        (tester) async {
          when(() => mockLoginBloc.state).thenReturn(const LoginInitial());

          whenListen(
            mockLoginBloc,
            Stream<LoginState>.fromIterable([
              LoginFailure(
                form: const LoginForm(
                  email: 'wrong@example.com',
                  password: 'WrongPass',
                ),
                error: 'Email hoặc mật khẩu không đúng',
              ),
            ]),
            initialState: const LoginInitial(),
          );

          await tester.pumpWidget(buildSubject());
          await tester.pump();

          expect(
            find.text('Email hoặc mật khẩu không đúng'),
            findsOneWidget,
          );
        },
      );

      // FLUTTER-WIDGET-007: dispatches AuthLoggedIn on LoginSuccess (AC1, AC2)
      testWidgets(
        'dispatches AuthLoggedIn to AuthBloc on LoginSuccess (AC1, AC2)',
        (tester) async {
          when(() => mockLoginBloc.state).thenReturn(const LoginInitial());

          whenListen(
            mockLoginBloc,
            Stream<LoginState>.fromIterable([
              LoginSuccess(
                form: const LoginForm(
                  email: 'parent@example.com',
                  password: 'anypassword',
                ),
                accessToken: 'access-token-123',
                refreshToken: 'refresh-token-456',
              ),
            ]),
            initialState: const LoginInitial(),
          );

          await tester.pumpWidget(buildSubject());
          await tester.pump();

          verify(
            () => mockAuthBloc.add(
              const AuthLoggedIn(
                accessToken: 'access-token-123',
                refreshToken: 'refresh-token-456',
              ),
            ),
          ).called(1);
        },
      );

      // FLUTTER-WIDGET-008: registration link is present
      testWidgets('renders registration link', (tester) async {
        when(() => mockLoginBloc.state).thenReturn(const LoginInitial());
        await tester.pumpWidget(buildSubject());

        expect(find.text('Đăng ký'), findsOneWidget);
        expect(find.text('Chưa có tài khoản? '), findsOneWidget);
      });

      // FLUTTER-WIDGET-009: email field triggers LoginEmailChanged
      testWidgets(
        'dispatches LoginEmailChanged when user types in email field',
        (tester) async {
          when(() => mockLoginBloc.state).thenReturn(const LoginInitial());
          await tester.pumpWidget(buildSubject());

          await tester.enterText(
            find.widgetWithText(TextFormField, 'Email'),
            'test@example.com',
          );

          verify(
            () => mockLoginBloc.add(
              const LoginEmailChanged('test@example.com'),
            ),
          ).called(1);
        },
      );

      // FLUTTER-WIDGET-010: password field triggers LoginPasswordChanged
      testWidgets(
        'dispatches LoginPasswordChanged when user types in password field',
        (tester) async {
          when(() => mockLoginBloc.state).thenReturn(const LoginInitial());
          await tester.pumpWidget(buildSubject());

          await tester.enterText(
            find.widgetWithText(TextFormField, 'Mật khẩu'),
            'mypassword',
          );

          verify(
            () => mockLoginBloc.add(
              const LoginPasswordChanged('mypassword'),
            ),
          ).called(1);
        },
      );
    },
  );
}
