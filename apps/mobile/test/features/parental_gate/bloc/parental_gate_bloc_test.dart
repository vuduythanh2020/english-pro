/// BLoC Tests - Story 2.6: ParentalGateBloc
library;

import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/features/parental_gate/bloc/parental_gate_bloc.dart';
import 'package:english_pro/features/parental_gate/bloc/parental_gate_event.dart';
import 'package:english_pro/features/parental_gate/bloc/parental_gate_state.dart';
import 'package:english_pro/features/parental_gate/services/parental_gate_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockParentalGateService extends Mock implements ParentalGateService {}

void main() {
  late MockParentalGateService mockService;

  setUp(() {
    mockService = MockParentalGateService();
  });

  group('ParentalGateBloc', () {
    group('ParentalGateStarted', () {
      blocTest<ParentalGateBloc, ParentalGateState>(
        'emits verify mode when PIN is set',
        build: () {
          when(() => mockService.isPinSet())
              .thenAnswer((_) async => true);
          when(() => mockService.canUseBiometric())
              .thenAnswer((_) async => false);
          return ParentalGateBloc(parentalGateService: mockService);
        },
        act: (bloc) => bloc.add(const ParentalGateStarted()),
        expect: () => [
          const ParentalGateLoading(),
          const ParentalGateVerifying(mode: 'verify'),
        ],
      );

      blocTest<ParentalGateBloc, ParentalGateState>(
        'emits setup_first mode when PIN is not set',
        build: () {
          when(() => mockService.isPinSet())
              .thenAnswer((_) async => false);
          when(() => mockService.canUseBiometric())
              .thenAnswer((_) async => false);
          return ParentalGateBloc(parentalGateService: mockService);
        },
        act: (bloc) => bloc.add(const ParentalGateStarted()),
        expect: () => [
          const ParentalGateLoading(),
          const ParentalGateVerifying(mode: 'setup_first'),
        ],
      );

      blocTest<ParentalGateBloc, ParentalGateState>(
        'detects biometric availability',
        build: () {
          when(() => mockService.isPinSet())
              .thenAnswer((_) async => true);
          when(() => mockService.canUseBiometric())
              .thenAnswer((_) async => true);
          return ParentalGateBloc(parentalGateService: mockService);
        },
        act: (bloc) => bloc.add(const ParentalGateStarted()),
        expect: () => [
          const ParentalGateLoading(),
          const ParentalGateVerifying(
            mode: 'verify',
            canUseBiometric: true,
          ),
        ],
      );
    });

    group('ParentalGatePinDigitAdded', () {
      blocTest<ParentalGateBloc, ParentalGateState>(
        'adds digits 1-2-3 and shows digitCount == 3',
        build: () {
          when(() => mockService.isPinSet())
              .thenAnswer((_) async => true);
          when(() => mockService.canUseBiometric())
              .thenAnswer((_) async => false);
          return ParentalGateBloc(parentalGateService: mockService);
        },
        act: (bloc) async {
          bloc.add(const ParentalGateStarted());
          await Future<void>.delayed(Duration.zero);
          bloc
            ..add(const ParentalGatePinDigitAdded(1))
            ..add(const ParentalGatePinDigitAdded(2))
            ..add(const ParentalGatePinDigitAdded(3));
        },
        skip: 2, // Skip Loading + initial Verifying
        expect: () => [
          isA<ParentalGateVerifying>()
              .having((s) => s.digitCount, 'digitCount', 1)
              .having((s) => s.currentPin, 'currentPin', '1'),
          isA<ParentalGateVerifying>()
              .having((s) => s.digitCount, 'digitCount', 2)
              .having((s) => s.currentPin, 'currentPin', '12'),
          isA<ParentalGateVerifying>()
              .having((s) => s.digitCount, 'digitCount', 3)
              .having((s) => s.currentPin, 'currentPin', '123'),
        ],
      );

      blocTest<ParentalGateBloc, ParentalGateState>(
        'auto-submits on 4th digit with correct PIN → ParentalGateSuccess',
        build: () {
          when(() => mockService.isPinSet())
              .thenAnswer((_) async => true);
          when(() => mockService.canUseBiometric())
              .thenAnswer((_) async => false);
          when(() => mockService.verifyPin('1234'))
              .thenAnswer((_) async => true);
          return ParentalGateBloc(parentalGateService: mockService);
        },
        act: (bloc) async {
          bloc.add(const ParentalGateStarted());
          await Future<void>.delayed(Duration.zero);
          bloc
            ..add(const ParentalGatePinDigitAdded(1))
            ..add(const ParentalGatePinDigitAdded(2))
            ..add(const ParentalGatePinDigitAdded(3))
            ..add(const ParentalGatePinDigitAdded(4));
        },
        skip: 5, // Skip Loading + Verifying + 3 digit states
        expect: () => [
          // 4th digit + isSubmitting
          isA<ParentalGateVerifying>()
              .having((s) => s.digitCount, 'digitCount', 4)
              .having((s) => s.isSubmitting, 'isSubmitting', true),
          const ParentalGateSuccess(),
        ],
      );

      blocTest<ParentalGateBloc, ParentalGateState>(
        'auto-submits on 4th digit with wrong PIN → failedAttempts: 1',
        build: () {
          when(() => mockService.isPinSet())
              .thenAnswer((_) async => true);
          when(() => mockService.canUseBiometric())
              .thenAnswer((_) async => false);
          when(() => mockService.verifyPin('1234'))
              .thenAnswer((_) async => false);
          return ParentalGateBloc(parentalGateService: mockService);
        },
        act: (bloc) async {
          bloc.add(const ParentalGateStarted());
          await Future<void>.delayed(Duration.zero);
          bloc
            ..add(const ParentalGatePinDigitAdded(1))
            ..add(const ParentalGatePinDigitAdded(2))
            ..add(const ParentalGatePinDigitAdded(3))
            ..add(const ParentalGatePinDigitAdded(4));
        },
        skip: 5, // Skip Loading + Verifying + 3 digit states
        expect: () => [
          // 4th digit + isSubmitting
          isA<ParentalGateVerifying>()
              .having((s) => s.digitCount, 'digitCount', 4)
              .having((s) => s.isSubmitting, 'isSubmitting', true),
          // Wrong PIN → reset
          isA<ParentalGateVerifying>()
              .having((s) => s.failedAttempts, 'failedAttempts', 1)
              .having((s) => s.digitCount, 'digitCount', 0)
              .having((s) => s.errorMessage, 'errorMessage', 'Mã PIN không đúng'),
        ],
      );
    });

    group('ParentalGatePinDigitRemoved', () {
      blocTest<ParentalGateBloc, ParentalGateState>(
        'removes last digit',
        build: () {
          when(() => mockService.isPinSet())
              .thenAnswer((_) async => true);
          when(() => mockService.canUseBiometric())
              .thenAnswer((_) async => false);
          return ParentalGateBloc(parentalGateService: mockService);
        },
        act: (bloc) async {
          bloc.add(const ParentalGateStarted());
          await Future<void>.delayed(Duration.zero);
          bloc
            ..add(const ParentalGatePinDigitAdded(1))
            ..add(const ParentalGatePinDigitAdded(2))
            ..add(const ParentalGatePinDigitRemoved());
        },
        skip: 4, // Skip Loading + Verifying + 2 digit states
        expect: () => [
          isA<ParentalGateVerifying>()
              .having((s) => s.digitCount, 'digitCount', 1)
              .having((s) => s.currentPin, 'currentPin', '1'),
        ],
      );
    });

    group('ParentalGateBiometricRequested', () {
      blocTest<ParentalGateBloc, ParentalGateState>(
        'emits success on biometric auth success',
        build: () {
          when(() => mockService.isPinSet())
              .thenAnswer((_) async => true);
          when(() => mockService.canUseBiometric())
              .thenAnswer((_) async => true);
          when(() => mockService.authenticateWithBiometric())
              .thenAnswer((_) async => true);
          return ParentalGateBloc(parentalGateService: mockService);
        },
        act: (bloc) async {
          bloc.add(const ParentalGateStarted());
          await Future<void>.delayed(Duration.zero);
          bloc.add(const ParentalGateBiometricRequested());
        },
        skip: 2, // Skip Loading + Verifying
        expect: () => [
          isA<ParentalGateVerifying>()
              .having((s) => s.isSubmitting, 'isSubmitting', true),
          const ParentalGateSuccess(),
        ],
      );

      blocTest<ParentalGateBloc, ParentalGateState>(
        'falls back to PIN on biometric failure',
        build: () {
          when(() => mockService.isPinSet())
              .thenAnswer((_) async => true);
          when(() => mockService.canUseBiometric())
              .thenAnswer((_) async => true);
          when(() => mockService.authenticateWithBiometric())
              .thenAnswer((_) async => false);
          return ParentalGateBloc(parentalGateService: mockService);
        },
        act: (bloc) async {
          bloc.add(const ParentalGateStarted());
          await Future<void>.delayed(Duration.zero);
          bloc.add(const ParentalGateBiometricRequested());
        },
        skip: 2, // Skip Loading + Verifying
        expect: () => [
          isA<ParentalGateVerifying>()
              .having((s) => s.isSubmitting, 'isSubmitting', true),
          isA<ParentalGateVerifying>()
              .having((s) => s.isSubmitting, 'isSubmitting', false)
              .having((s) => s.canUseBiometric, 'canUseBiometric', true),
        ],
      );
    });

    group('Setup flow', () {
      blocTest<ParentalGateBloc, ParentalGateState>(
        'setup: enter PIN → confirm same PIN → success',
        build: () {
          when(() => mockService.isPinSet())
              .thenAnswer((_) async => false);
          when(() => mockService.canUseBiometric())
              .thenAnswer((_) async => false);
          when(() => mockService.setupPin('1234'))
              .thenAnswer((_) async {});
          return ParentalGateBloc(parentalGateService: mockService);
        },
        act: (bloc) async {
          bloc.add(const ParentalGateStarted());
          await Future<void>.delayed(Duration.zero);
          // First entry: 1234
          bloc
            ..add(const ParentalGatePinDigitAdded(1))
            ..add(const ParentalGatePinDigitAdded(2))
            ..add(const ParentalGatePinDigitAdded(3))
            ..add(const ParentalGatePinDigitAdded(4));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          // Confirm: 1234
          bloc
            ..add(const ParentalGatePinDigitAdded(1))
            ..add(const ParentalGatePinDigitAdded(2))
            ..add(const ParentalGatePinDigitAdded(3))
            ..add(const ParentalGatePinDigitAdded(4));
        },
        skip: 2, // Skip Loading + initial setup_first Verifying
        verify: (bloc) {
          expect(bloc.state, const ParentalGateSuccess());
          verify(() => mockService.setupPin('1234')).called(1);
        },
      );

      blocTest<ParentalGateBloc, ParentalGateState>(
        'setup: enter PIN 1234 → confirm 5678 → mismatch error → restart',
        build: () {
          when(() => mockService.isPinSet())
              .thenAnswer((_) async => false);
          when(() => mockService.canUseBiometric())
              .thenAnswer((_) async => false);
          return ParentalGateBloc(parentalGateService: mockService);
        },
        act: (bloc) async {
          bloc.add(const ParentalGateStarted());
          await Future<void>.delayed(Duration.zero);
          // First entry: 1234
          bloc
            ..add(const ParentalGatePinDigitAdded(1))
            ..add(const ParentalGatePinDigitAdded(2))
            ..add(const ParentalGatePinDigitAdded(3))
            ..add(const ParentalGatePinDigitAdded(4));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          // Confirm: 5678 (wrong)
          bloc
            ..add(const ParentalGatePinDigitAdded(5))
            ..add(const ParentalGatePinDigitAdded(6))
            ..add(const ParentalGatePinDigitAdded(7))
            ..add(const ParentalGatePinDigitAdded(8));
        },
        skip: 2, // Skip Loading + initial setup_first Verifying
        verify: (bloc) {
          final state = bloc.state;
          expect(state, isA<ParentalGateVerifying>());
          final verifying = state as ParentalGateVerifying;
          expect(verifying.mode, 'setup_first');
          expect(verifying.errorMessage, contains('không khớp'));
          verifyNever(() => mockService.setupPin(any()));
        },
      );
    });

    group('Cooldown', () {
      blocTest<ParentalGateBloc, ParentalGateState>(
        '3 wrong attempts → cooldown state',
        build: () {
          when(() => mockService.isPinSet())
              .thenAnswer((_) async => true);
          when(() => mockService.canUseBiometric())
              .thenAnswer((_) async => false);
          when(() => mockService.verifyPin(any()))
              .thenAnswer((_) async => false);
          return ParentalGateBloc(parentalGateService: mockService);
        },
        act: (bloc) async {
          bloc.add(const ParentalGateStarted());
          await Future<void>.delayed(Duration.zero);
          // Attempt 1
          for (var i = 0; i < 4; i++) {
            bloc.add(ParentalGatePinDigitAdded(i));
          }
          await Future<void>.delayed(const Duration(milliseconds: 50));
          // Attempt 2
          for (var i = 0; i < 4; i++) {
            bloc.add(ParentalGatePinDigitAdded(i));
          }
          await Future<void>.delayed(const Duration(milliseconds: 50));
          // Attempt 3
          for (var i = 0; i < 4; i++) {
            bloc.add(ParentalGatePinDigitAdded(i));
          }
        },
        skip: 2, // Skip Loading + Verifying
        verify: (bloc) {
          final state = bloc.state;
          expect(state, isA<ParentalGateVerifying>());
          final verifying = state as ParentalGateVerifying;
          expect(verifying.isCooldown, isTrue);
          expect(verifying.failedAttempts, 3);
        },
      );
    });
  });
}
