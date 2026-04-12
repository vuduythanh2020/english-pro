import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:english_pro/features/onboarding/bloc/consent_bloc.dart';
import 'package:english_pro/features/onboarding/bloc/consent_event.dart';
import 'package:english_pro/features/onboarding/bloc/consent_state.dart';
import 'package:english_pro/features/onboarding/view/consent_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockConsentBloc extends MockBloc<ConsentEvent, ConsentState>
    implements ConsentBloc {}

class MockAuthBloc extends MockBloc<AuthEvent, AuthState>
    implements AuthBloc {}

void main() {
  late MockConsentBloc mockConsentBloc;
  late MockAuthBloc mockAuthBloc;

  setUpAll(() {
    registerFallbackValue(const ConsentSubmitted());
    registerFallbackValue(const AuthStarted());
  });

  setUp(() {
    mockConsentBloc = MockConsentBloc();
    mockAuthBloc = MockAuthBloc();

    when(() => mockAuthBloc.state).thenReturn(
      const AuthAuthenticated(accessToken: 'test-token'),
    );
  });

  Widget buildSubject() {
    return MaterialApp(
      home: MultiBlocProvider(
        providers: [
          BlocProvider<ConsentBloc>.value(value: mockConsentBloc),
          BlocProvider<AuthBloc>.value(value: mockAuthBloc),
        ],
        child: const ConsentScreen(),
      ),
    );
  }

  group('ConsentScreen', () {
    group('Age Declaration Step', () {
      testWidgets('shows age input field', (tester) async {
        when(() => mockConsentBloc.state)
            .thenReturn(const ConsentInitial());

        await tester.pumpWidget(buildSubject());

        expect(find.text('Khai báo tuổi con'), findsOneWidget);
        expect(find.byType(TextFormField), findsOneWidget);
      });

      testWidgets(
        '"Tiếp theo" button is disabled '
        'when no age entered',
        (tester) async {
          when(() => mockConsentBloc.state)
              .thenReturn(const ConsentInitial());

          await tester.pumpWidget(buildSubject());

          final button = tester.widget<FilledButton>(
            find.widgetWithText(FilledButton, 'Tiếp theo'),
          );
          expect(button.onPressed, isNull);
        },
      );

      testWidgets(
        '"Tiếp theo" button is enabled '
        'when valid age is entered',
        (tester) async {
          when(() => mockConsentBloc.state).thenReturn(
            const ConsentFilling(childAge: 12),
          );

          await tester.pumpWidget(buildSubject());

          final button = tester.widget<FilledButton>(
            find.widgetWithText(FilledButton, 'Tiếp theo'),
          );
          expect(button.onPressed, isNotNull);
        },
      );

      testWidgets(
        'shows warning when age is outside 10–15 range',
        (tester) async {
          when(() => mockConsentBloc.state).thenReturn(
            const ConsentFilling(childAge: 8, isAgeWarning: true),
          );

          await tester.pumpWidget(buildSubject());

          expect(
            find.textContaining('App được thiết kế cho trẻ 10–15 tuổi'),
            findsOneWidget,
          );
        },
      );

      testWidgets(
        'dispatches ConsentAgeChanged when age typed',
        (tester) async {
          when(() => mockConsentBloc.state)
              .thenReturn(const ConsentInitial());

          await tester.pumpWidget(buildSubject());

          await tester.enterText(
            find.byType(TextFormField),
            '12',
          );

          verify(
            () => mockConsentBloc.add(const ConsentAgeChanged(12)),
          ).called(1);
        },
      );
    });

    group('Consent Step', () {
      testWidgets(
        'shows consent content after tapping "Tiếp theo"',
        (tester) async {
          when(() => mockConsentBloc.state).thenReturn(
            const ConsentFilling(childAge: 12),
          );

          await tester.pumpWidget(buildSubject());

          // Tap next
          await tester.tap(
            find.widgetWithText(FilledButton, 'Tiếp theo'),
          );
          await tester.pumpAndSettle();

          expect(
            find.text('Đồng ý sử dụng'),
            findsOneWidget,
          );
          expect(
            find.text('Dữ liệu thu thập'),
            findsOneWidget,
          );
          expect(
            find.text('Dữ liệu KHÔNG thu thập'),
            findsOneWidget,
          );
        },
      );

      testWidgets(
        '"Đồng ý & Tiếp tục" button is disabled '
        'when checkbox not checked',
        (tester) async {
          when(() => mockConsentBloc.state).thenReturn(
            const ConsentFilling(childAge: 12),
          );

          await tester.pumpWidget(buildSubject());

          // Navigate to consent step
          await tester.tap(
            find.widgetWithText(FilledButton, 'Tiếp theo'),
          );
          await tester.pumpAndSettle();

          final button = tester.widget<FilledButton>(
            find.widgetWithText(
              FilledButton,
              'Đồng ý & Tiếp tục',
            ),
          );
          expect(button.onPressed, isNull);
        },
      );

      testWidgets(
        '"Đồng ý & Tiếp tục" button is enabled '
        'when form is valid',
        (tester) async {
          when(() => mockConsentBloc.state).thenReturn(
            const ConsentFilling(
              childAge: 12,
              isCheckboxChecked: true,
            ),
          );

          await tester.pumpWidget(buildSubject());

          // Navigate to consent step
          await tester.tap(
            find.widgetWithText(FilledButton, 'Tiếp theo'),
          );
          await tester.pumpAndSettle();

          final button = tester.widget<FilledButton>(
            find.widgetWithText(
              FilledButton,
              'Đồng ý & Tiếp tục',
            ),
          );
          expect(button.onPressed, isNotNull);
        },
      );

      // F-7: Privacy policy link is a real URL launcher (not AlertDialog placeholder)
      testWidgets(
        'shows "Xem Chính sách Bảo mật" link on consent step (AC2)',
        (tester) async {
          when(() => mockConsentBloc.state).thenReturn(
            const ConsentFilling(childAge: 12),
          );

          await tester.pumpWidget(buildSubject());

          // Navigate to consent step
          await tester.tap(
            find.widgetWithText(FilledButton, 'Tiếp theo'),
          );
          await tester.pumpAndSettle();

          // Privacy policy link must be present
          expect(
            find.text('Xem Chính sách Bảo mật'),
            findsOneWidget,
          );
        },
      );
    });

    group('Submission', () {
      testWidgets(
        'shows loading indicator during submission',
        (tester) async {
          final controller = StreamController<ConsentState>();
          addTearDown(controller.close);

          // Set up stream BEFORE building widget so BlocBuilder subscribes
          whenListen(
            mockConsentBloc,
            controller.stream,
            initialState: const ConsentFilling(
              childAge: 12,
              isCheckboxChecked: true,
            ),
          );

          await tester.pumpWidget(buildSubject());

          // Navigate to consent step
          await tester.tap(
            find.widgetWithText(FilledButton, 'Tiếp theo'),
          );
          await tester.pumpAndSettle();

          // Now emit ConsentSubmitting via the stream
          controller.add(const ConsentSubmitting());
          // Two pumps: first processes the stream microtask,
          // second processes the rebuild from setState
          await tester.pump();
          await tester.pump();

          expect(
            find.byType(CircularProgressIndicator),
            findsOneWidget,
          );
        },
      );

      testWidgets(
        'shows SnackBar on ConsentFailure',
        (tester) async {
          whenListen(
            mockConsentBloc,
            Stream.fromIterable([
              ConsentFailure(message: 'Test error'),
            ]),
            initialState: const ConsentFilling(
              childAge: 12,
              isCheckboxChecked: true,
            ),
          );

          await tester.pumpWidget(buildSubject());
          await tester.pump();

          expect(
            find.text('Test error'),
            findsOneWidget,
          );
        },
      );
    });
  });
}
