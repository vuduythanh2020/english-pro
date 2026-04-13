/// Integration Test - Story 2.6: ChildHomeScreen → ParentalGate flow
library;

import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';
import 'package:english_pro/features/home/view/child_home_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthBloc extends MockBloc<AuthEvent, AuthState>
    implements AuthBloc {}

class MockSecureStorageService extends Mock implements SecureStorageService {}

void main() {
  late MockAuthBloc mockAuthBloc;
  late MockSecureStorageService mockStorageService;

  setUpAll(() {
    registerFallbackValue(const AuthStarted());
    registerFallbackValue(const AuthInitial());
  });

  setUp(() {
    mockAuthBloc = MockAuthBloc();
    mockStorageService = MockSecureStorageService();

    when(() => mockAuthBloc.state).thenReturn(
      const AuthChildSessionActive(
        childJwt: 'test-jwt',
        childId: 'child-1',
        parentId: 'parent-1',
      ),
    );
  });

  Widget buildSubject() {
    return MaterialApp(
      home: MultiRepositoryProvider(
        providers: [
          RepositoryProvider<SecureStorageService>.value(
            value: mockStorageService,
          ),
        ],
        child: BlocProvider<AuthBloc>.value(
          value: mockAuthBloc,
          child: const ChildHomeScreen(),
        ),
      ),
    );
  }

  group('ChildHomeScreen → ParentalGate integration', () {
    testWidgets(
      'tapping "Đổi người" opens ParentalGateScreen',
      (tester) async {
        // Mock storage for ParentalGateService
        when(
          () => mockStorageService.getParentalGatePinSet(),
        ).thenAnswer((_) async => true);
        when(
          () => mockStorageService.getParentalGatePinHash(),
        ).thenAnswer((_) async => null);

        await tester.pumpWidget(buildSubject());

        // Verify "Đổi người" button exists
        expect(find.text('Đổi người'), findsOneWidget);

        // Tap "Đổi người" button
        await tester.tap(find.text('Đổi người'));
        // Use pump() instead of pumpAndSettle() because
        // CircularProgressIndicator (shown during Loading state)
        // has an infinite animation that prevents pumpAndSettle
        // from ever completing.
        await tester.pump(); // trigger tap
        await tester.pump(); // start route transition
        await tester.pump(const Duration(seconds: 1)); // complete transition + async

        // ParentalGateScreen should be pushed (verify AppBar title)
        expect(find.text('Xác nhận phụ huynh'), findsOneWidget);
      },
    );

    testWidgets(
      'ParentalGateScreen shows setup mode when no PIN set',
      (tester) async {
        // Mock: no PIN set yet
        when(
          () => mockStorageService.getParentalGatePinSet(),
        ).thenAnswer((_) async => false);

        await tester.pumpWidget(buildSubject());

        // Tap "Đổi người"
        await tester.tap(find.text('Đổi người'));
        // Use pump() instead of pumpAndSettle() because
        // CircularProgressIndicator has an infinite animation.
        await tester.pump(); // trigger tap
        await tester.pump(); // start route transition
        await tester.pump(const Duration(milliseconds: 300)); // route animation

        // Run the async BLoC processing in a real async zone
        // so platform channel calls (LocalAuthentication) can
        // complete without needing manual pump loops.
        await tester.runAsync(() async {
          // Give async operations time to complete
          await Future<void>.delayed(const Duration(milliseconds: 200));
        });
        // Rebuild the widget tree with the new BLoC state
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 100));

        // Should show setup mode title
        expect(
          find.text('Tạo mã PIN mới (4 chữ số)'),
          findsOneWidget,
        );
        expect(find.text('Bước 1/2'), findsOneWidget);
      },
    );
  });
}
