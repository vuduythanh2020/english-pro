import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:english_pro/features/auth/bloc/registration_bloc.dart';
import 'package:english_pro/features/auth/bloc/registration_event.dart';
import 'package:english_pro/features/auth/bloc/registration_state.dart';
import 'package:english_pro/features/auth/models/registration_form.dart';
import 'package:english_pro/features/auth/view/registration_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockRegistrationBloc
    extends MockBloc<RegistrationEvent, RegistrationState>
    implements RegistrationBloc {}

class MockAuthBloc extends MockBloc<AuthEvent, AuthState>
    implements AuthBloc {}

void main() {
  late MockRegistrationBloc mockRegBloc;
  late MockAuthBloc mockAuthBloc;

  setUpAll(() {
    registerFallbackValue(const RegistrationSubmitted());
    registerFallbackValue(const RegistrationInitial());
    registerFallbackValue(const AuthStarted());
    registerFallbackValue(const AuthInitial());
  });

  setUp(() {
    mockRegBloc = MockRegistrationBloc();
    mockAuthBloc = MockAuthBloc();
    when(() => mockAuthBloc.state).thenReturn(const AuthUnauthenticated());
  });

  Widget buildSubject() {
    return MaterialApp(
      home: MultiBlocProvider(
        providers: [
          BlocProvider<RegistrationBloc>.value(value: mockRegBloc),
          BlocProvider<AuthBloc>.value(value: mockAuthBloc),
        ],
        child: const RegistrationScreen(),
      ),
    );
  }

  group('RegistrationScreen', () {
    testWidgets('renders header text', (tester) async {
      when(() => mockRegBloc.state)
          .thenReturn(const RegistrationInitial());
      await tester.pumpWidget(buildSubject());

      expect(find.text('Tạo tài khoản'), findsOneWidget);
    });

    testWidgets('renders email and password fields', (tester) async {
      when(() => mockRegBloc.state)
          .thenReturn(const RegistrationInitial());
      await tester.pumpWidget(buildSubject());

      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Mật khẩu'), findsOneWidget);
    });

    testWidgets(
      'submit button is disabled when form is invalid',
      (tester) async {
        when(() => mockRegBloc.state)
            .thenReturn(const RegistrationInitial());
        await tester.pumpWidget(buildSubject());

        final button = tester.widget<FilledButton>(
          find.byType(FilledButton),
        );
        expect(button.onPressed, isNull);
      },
    );

    testWidgets(
      'submit button is enabled when form is valid',
      (tester) async {
        when(() => mockRegBloc.state).thenReturn(
          RegistrationValidating(
            form: const RegistrationForm(
              email: 'parent@example.com',
              password: 'Password1',
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

    testWidgets(
      'shows loading indicator when submitting',
      (tester) async {
        when(() => mockRegBloc.state).thenReturn(
          RegistrationSubmitting(
            form: const RegistrationForm(
              email: 'parent@example.com',
              password: 'Password1',
            ),
          ),
        );
        await tester.pumpWidget(buildSubject());

        expect(find.byType(CircularProgressIndicator), findsOneWidget);
      },
    );

    testWidgets(
      'shows snackbar on failure',
      (tester) async {
        when(() => mockRegBloc.state)
            .thenReturn(const RegistrationInitial());

        whenListen(
          mockRegBloc,
          Stream<RegistrationState>.fromIterable([
            RegistrationFailure(
              form: const RegistrationForm(
                email: 'test@example.com',
                password: 'Password1',
              ),
              error: 'Email đã được đăng ký',
            ),
          ]),
          initialState: const RegistrationInitial(),
        );

        await tester.pumpWidget(buildSubject());
        await tester.pump();

        expect(find.text('Email đã được đăng ký'), findsOneWidget);
      },
    );

    testWidgets('renders login link', (tester) async {
      when(() => mockRegBloc.state)
          .thenReturn(const RegistrationInitial());
      await tester.pumpWidget(buildSubject());

      expect(find.text('Đăng nhập'), findsOneWidget);
      expect(find.text('Đã có tài khoản? '), findsOneWidget);
    });

    testWidgets(
      'dispatches AuthLoggedIn on RegistrationSuccess',
      (tester) async {
        when(() => mockRegBloc.state)
            .thenReturn(const RegistrationInitial());

        whenListen(
          mockRegBloc,
          Stream<RegistrationState>.fromIterable([
            RegistrationSuccess(
              form: const RegistrationForm(
                email: 'parent@example.com',
                password: 'Password1',
              ),
              accessToken: 'token-123',
              refreshToken: 'refresh-456',
            ),
          ]),
          initialState: const RegistrationInitial(),
        );

        await tester.pumpWidget(buildSubject());
        await tester.pump();

        verify(
          () => mockAuthBloc.add(
            const AuthLoggedIn(
              accessToken: 'token-123',
              refreshToken: 'refresh-456',
            ),
          ),
        ).called(1);
      },
    );
  });
}
