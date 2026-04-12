import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_bloc.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_event.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_state.dart';
import 'package:english_pro/features/onboarding/models/child_profile_form.dart';
import 'package:english_pro/features/onboarding/view/child_profile_setup_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockChildProfileBloc
    extends MockBloc<ChildProfileEvent, ChildProfileState>
    implements ChildProfileBloc {}

class MockAuthBloc extends MockBloc<AuthEvent, AuthState>
    implements AuthBloc {}

void main() {
  late MockChildProfileBloc mockBloc;
  late MockAuthBloc mockAuthBloc;

  setUpAll(() {
    registerFallbackValue(const ChildProfileSubmitted());
    registerFallbackValue(const AuthStarted());
    registerFallbackValue(const ChildProfileNameChanged(''));
    registerFallbackValue(const ChildProfileAvatarSelected(1));
  });

  setUp(() {
    mockBloc = MockChildProfileBloc();
    mockAuthBloc = MockAuthBloc();

    when(() => mockAuthBloc.state).thenReturn(
      const AuthAuthenticated(accessToken: 'test-token'),
    );
  });

  Widget buildSubject() {
    return MaterialApp(
      home: MultiBlocProvider(
        providers: [
          BlocProvider<ChildProfileBloc>.value(value: mockBloc),
          BlocProvider<AuthBloc>.value(value: mockAuthBloc),
        ],
        child: const ChildProfileSetupScreen(),
      ),
    );
  }

  group('ChildProfileSetupScreen', () {
    testWidgets('renders title and name input', (tester) async {
      when(() => mockBloc.state).thenReturn(const ChildProfileInitial());

      await tester.pumpWidget(buildSubject());

      expect(find.text('Tạo hồ sơ cho con'), findsOneWidget);
      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('renders 6 avatar options', (tester) async {
      when(() => mockBloc.state).thenReturn(const ChildProfileInitial());

      await tester.pumpWidget(buildSubject());

      // 6 CircleAvatars for the avatar grid
      expect(find.byType(CircleAvatar), findsNWidgets(6));
    });

    testWidgets('renders section title "Chọn avatar cho con"', (tester) async {
      when(() => mockBloc.state).thenReturn(const ChildProfileInitial());

      await tester.pumpWidget(buildSubject());

      expect(find.text('Chọn avatar cho con'), findsOneWidget);
    });

    testWidgets(
      '"Tạo hồ sơ" button is disabled when form is not valid',
      (tester) async {
        when(() => mockBloc.state).thenReturn(const ChildProfileInitial());

        await tester.pumpWidget(buildSubject());

        final button = tester.widget<FilledButton>(
          find.widgetWithText(FilledButton, 'Tạo hồ sơ'),
        );
        expect(button.onPressed, isNull);
      },
    );

    testWidgets(
      '"Tạo hồ sơ" button is enabled when form is valid',
      (tester) async {
        when(() => mockBloc.state).thenReturn(
          ChildProfileFilling(
            form: const ChildProfileForm(name: 'Bé Minh'),
          ),
        );

        await tester.pumpWidget(buildSubject());

        final button = tester.widget<FilledButton>(
          find.widgetWithText(FilledButton, 'Tạo hồ sơ'),
        );
        expect(button.onPressed, isNotNull);
      },
    );

    testWidgets(
      'dispatches ChildProfileNameChanged when name is typed',
      (tester) async {
        when(() => mockBloc.state).thenReturn(const ChildProfileInitial());

        await tester.pumpWidget(buildSubject());

        await tester.enterText(find.byType(TextFormField), 'Bé Minh');

        verify(
          () => mockBloc.add(const ChildProfileNameChanged('Bé Minh')),
        ).called(1);
      },
    );

    testWidgets(
      'dispatches ChildProfileAvatarSelected when avatar tapped',
      (tester) async {
        when(() => mockBloc.state).thenReturn(const ChildProfileInitial());

        await tester.pumpWidget(buildSubject());

        // Tap first CircleAvatar (avatarId=1, emoji 🦊)
        await tester.tap(find.byType(CircleAvatar).first);

        verify(
          () => mockBloc.add(const ChildProfileAvatarSelected(1)),
        ).called(1);
      },
    );

    testWidgets(
      'dispatches ChildProfileSubmitted when button tapped',
      (tester) async {
        when(() => mockBloc.state).thenReturn(
          ChildProfileFilling(
            form: const ChildProfileForm(name: 'Bé Minh'),
          ),
        );

        await tester.pumpWidget(buildSubject());

        // Button may be below the fold in SingleChildScrollView
        await tester.ensureVisible(
          find.widgetWithText(FilledButton, 'Tạo hồ sơ'),
        );
        await tester.pumpAndSettle();
        await tester.tap(
          find.widgetWithText(FilledButton, 'Tạo hồ sơ'),
          warnIfMissed: false,
        );

        verify(
          () => mockBloc.add(const ChildProfileSubmitted()),
        ).called(1);
      },
    );

    testWidgets(
      'shows CircularProgressIndicator during submission',
      (tester) async {
        final controller = StreamController<ChildProfileState>();
        addTearDown(controller.close);

        whenListen(
          mockBloc,
          controller.stream,
          initialState: ChildProfileFilling(
            form: const ChildProfileForm(name: 'Bé Minh'),
          ),
        );

        await tester.pumpWidget(buildSubject());

        controller.add(const ChildProfileSubmitting());
        await tester.pump();
        await tester.pump();

        expect(find.byType(CircularProgressIndicator), findsOneWidget);
      },
    );

    testWidgets(
      'shows SnackBar on ChildProfileFailure',
      (tester) async {
        whenListen(
          mockBloc,
          Stream.fromIterable([
            ChildProfileFailure(message: 'Tạo hồ sơ thất bại'),
          ]),
          initialState: ChildProfileFilling(
            form: const ChildProfileForm(name: 'Bé Minh'),
          ),
        );

        await tester.pumpWidget(buildSubject());
        await tester.pump();

        expect(
          find.text('Tạo hồ sơ thất bại'),
          findsOneWidget,
        );
      },
    );

    testWidgets(
      'does NOT call context.go() on ChildProfileSuccess '
      '(GoRouter handles redirect)',
      (tester) async {
        // Test that ChildProfileSuccess does NOT show any navigation UI
        // The GoRouter guard handles redirection — no manual navigation here.
        whenListen(
          mockBloc,
          Stream.fromIterable([
            const ChildProfileSuccess(),
          ]),
          initialState: ChildProfileFilling(
            form: const ChildProfileForm(name: 'Bé Minh'),
          ),
        );

        await tester.pumpWidget(buildSubject());
        await tester.pump();

        // Screen is still showing — no navigation occurred in screen itself
        expect(find.text('Tạo hồ sơ cho con'), findsOneWidget);
        // No SnackBar shown for success
        expect(find.byType(SnackBar), findsNothing);
      },
    );
  });
}
