/// Widget Tests - Story 2.6: ParentalGateScreen
library;

import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/features/parental_gate/bloc/parental_gate_bloc.dart';
import 'package:english_pro/features/parental_gate/bloc/parental_gate_event.dart';
import 'package:english_pro/features/parental_gate/bloc/parental_gate_state.dart';
import 'package:english_pro/features/parental_gate/view/parental_gate_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockParentalGateBloc
    extends MockBloc<ParentalGateEvent, ParentalGateState>
    implements ParentalGateBloc {}

void main() {
  late MockParentalGateBloc mockBloc;

  setUpAll(() {
    registerFallbackValue(const ParentalGateStarted());
    registerFallbackValue(const ParentalGateInitial());
  });

  setUp(() {
    mockBloc = MockParentalGateBloc();
  });

  Widget buildSubject() {
    return MaterialApp(
      home: BlocProvider<ParentalGateBloc>.value(
        value: mockBloc,
        child: ParentalGateScreen(onSuccess: () {}),
      ),
    );
  }

  group('ParentalGateScreen', () {
    testWidgets('shows loading indicator for initial/loading state',
        (tester) async {
      when(() => mockBloc.state).thenReturn(const ParentalGateLoading());

      await tester.pumpWidget(buildSubject());

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows 4 dot indicators in verify mode', (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(mode: 'verify'),
      );

      await tester.pumpWidget(buildSubject());

      // 4 dot containers (AnimatedContainer)
      expect(find.byType(AnimatedContainer), findsNWidgets(4));
    });

    testWidgets('shows correct title for verify mode', (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(mode: 'verify'),
      );

      await tester.pumpWidget(buildSubject());

      expect(find.text('Nhập mã PIN phụ huynh'), findsOneWidget);
    });

    testWidgets('shows correct title for setup_first mode', (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(mode: 'setup_first'),
      );

      await tester.pumpWidget(buildSubject());

      expect(find.text('Tạo mã PIN mới (4 chữ số)'), findsOneWidget);
      expect(find.text('Bước 1/2'), findsOneWidget);
    });

    testWidgets('shows correct title for setup_confirm mode', (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(mode: 'setup_confirm'),
      );

      await tester.pumpWidget(buildSubject());

      expect(find.text('Xác nhận mã PIN'), findsOneWidget);
      expect(find.text('Bước 2/2'), findsOneWidget);
    });

    testWidgets('shows error message when failedAttempts > 0',
        (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(
          mode: 'verify',
          failedAttempts: 1,
          errorMessage: 'Mã PIN không đúng',
        ),
      );

      await tester.pumpWidget(buildSubject());

      expect(find.text('Mã PIN không đúng'), findsOneWidget);
    });

    testWidgets('shows cooldown message when isCooldown is true',
        (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(
          mode: 'verify',
          isCooldown: true,
          cooldownSecondsLeft: 25,
          failedAttempts: 3,
          errorMessage: 'Vui lòng thử lại sau 25 giây',
        ),
      );

      await tester.pumpWidget(buildSubject());

      expect(find.text('Vui lòng thử lại sau 25 giây'), findsOneWidget);
    });

    testWidgets(
        'shows biometric button when canUseBiometric and verify mode',
        (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(
          mode: 'verify',
          canUseBiometric: true,
        ),
      );

      await tester.pumpWidget(buildSubject());

      expect(find.byIcon(Icons.fingerprint), findsOneWidget);
    });

    testWidgets('hides biometric button when canUseBiometric is false',
        (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(mode: 'verify'),
      );

      await tester.pumpWidget(buildSubject());

      expect(find.byIcon(Icons.fingerprint), findsNothing);
    });

    testWidgets('hides biometric button in setup mode', (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(
          mode: 'setup_first',
          canUseBiometric: true,
        ),
      );

      await tester.pumpWidget(buildSubject());

      expect(find.byIcon(Icons.fingerprint), findsNothing);
    });

    testWidgets('tapping digit adds event to bloc', (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(mode: 'verify'),
      );

      await tester.pumpWidget(buildSubject());

      // Tap digit '1'
      await tester.tap(find.text('1'));
      await tester.pump();

      verify(
        () => mockBloc.add(const ParentalGatePinDigitAdded(1)),
      ).called(1);
    });

    testWidgets('tapping backspace removes digit', (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(mode: 'verify', digitCount: 2),
      );

      await tester.pumpWidget(buildSubject());

      // Tap backspace
      await tester.tap(find.byIcon(Icons.backspace_outlined));
      await tester.pump();

      verify(
        () => mockBloc.add(const ParentalGatePinDigitRemoved()),
      ).called(1);
    });

    testWidgets('PopScope prevents back navigation', (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(mode: 'verify'),
      );

      await tester.pumpWidget(buildSubject());

      // Verify PopScope with canPop: false exists
      final popScope = tester.widget<PopScope>(find.byType(PopScope));
      expect(popScope.canPop, isFalse);
    });

    testWidgets('no back button in AppBar', (tester) async {
      when(() => mockBloc.state).thenReturn(
        const ParentalGateVerifying(mode: 'verify'),
      );

      await tester.pumpWidget(buildSubject());

      // AppBar should not have a leading back button
      expect(find.byIcon(Icons.arrow_back), findsNothing);
    });
  });
}
