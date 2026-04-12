import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:english_pro/features/onboarding/bloc/consent_bloc.dart';
import 'package:english_pro/features/onboarding/bloc/consent_event.dart';
import 'package:english_pro/features/onboarding/bloc/consent_state.dart';
import 'package:english_pro/features/onboarding/repositories/consent_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockConsentRepository extends Mock implements ConsentRepository {}

class MockAuthBloc extends Mock implements AuthBloc {}

void main() {
  late ConsentBloc consentBloc;
  late MockConsentRepository mockConsentRepository;
  late MockAuthBloc mockAuthBloc;

  setUpAll(() {
    registerFallbackValue(const AuthConsentGranted());
  });

  setUp(() {
    mockConsentRepository = MockConsentRepository();
    mockAuthBloc = MockAuthBloc();

    // Stub AuthBloc.state for when ConsentBloc reads it
    when(() => mockAuthBloc.state).thenReturn(
      const AuthAuthenticated(accessToken: 'test-token'),
    );
    when(() => mockAuthBloc.add(any())).thenReturn(null);

    consentBloc = ConsentBloc(
      consentRepository: mockConsentRepository,
      authBloc: mockAuthBloc,
    );
  });

  tearDown(() {
    consentBloc.close();
  });

  group('ConsentBloc', () {
    test('initial state is ConsentInitial', () {
      expect(consentBloc.state, isA<ConsentInitial>());
    });

    group('ConsentAgeChanged', () {
      blocTest<ConsentBloc, ConsentState>(
        'emits ConsentFilling with age and no warning '
        'when age is in 10–15 range',
        build: () => consentBloc,
        act: (bloc) => bloc.add(const ConsentAgeChanged(12)),
        expect: () => [
          const ConsentFilling(childAge: 12),
        ],
      );

      blocTest<ConsentBloc, ConsentState>(
        'emits ConsentFilling with isAgeWarning=true '
        'when age < 10',
        build: () => consentBloc,
        act: (bloc) => bloc.add(const ConsentAgeChanged(8)),
        expect: () => [
          const ConsentFilling(childAge: 8, isAgeWarning: true),
        ],
      );

      blocTest<ConsentBloc, ConsentState>(
        'emits ConsentFilling with isAgeWarning=true '
        'when age > 15',
        build: () => consentBloc,
        act: (bloc) => bloc.add(const ConsentAgeChanged(17)),
        expect: () => [
          const ConsentFilling(childAge: 17, isAgeWarning: true),
        ],
      );

      blocTest<ConsentBloc, ConsentState>(
        'emits ConsentFilling with isAgeWarning=true '
        'when age is 1 (edge case)',
        build: () => consentBloc,
        act: (bloc) => bloc.add(const ConsentAgeChanged(1)),
        expect: () => [
          const ConsentFilling(childAge: 1, isAgeWarning: true),
        ],
      );

      blocTest<ConsentBloc, ConsentState>(
        'emits ConsentFilling with isAgeWarning=true '
        'when age is 18 (edge case)',
        build: () => consentBloc,
        act: (bloc) => bloc.add(const ConsentAgeChanged(18)),
        expect: () => [
          const ConsentFilling(childAge: 18, isAgeWarning: true),
        ],
      );

      // F-4 regression: checkbox MUST be reset when age changes
      blocTest<ConsentBloc, ConsentState>(
        'resets isCheckboxChecked to false when age changes '
        '(F-4: user back-navigates to step 1)',
        build: () => consentBloc,
        act: (bloc) {
          bloc
            ..add(const ConsentAgeChanged(12))
            ..add(const ConsentCheckboxToggled(checked: true))
            ..add(const ConsentAgeChanged(14)); // user changes age
        },
        expect: () => [
          const ConsentFilling(childAge: 12),
          const ConsentFilling(childAge: 12, isCheckboxChecked: true),
          // checkbox reset to false when age changes
          const ConsentFilling(childAge: 14, isCheckboxChecked: false),
        ],
      );
    });

    group('ConsentCheckboxToggled', () {
      blocTest<ConsentBloc, ConsentState>(
        'emits ConsentFilling with isCheckboxChecked=true',
        build: () => consentBloc,
        act: (bloc) {
          bloc
            ..add(const ConsentAgeChanged(12))
            ..add(const ConsentCheckboxToggled(checked: true));
        },
        expect: () => [
          const ConsentFilling(childAge: 12),
          const ConsentFilling(childAge: 12, isCheckboxChecked: true),
        ],
      );

      blocTest<ConsentBloc, ConsentState>(
        'emits ConsentFilling with isCheckboxChecked=false '
        'when unchecked',
        build: () => consentBloc,
        act: (bloc) {
          bloc
            ..add(const ConsentAgeChanged(12))
            ..add(const ConsentCheckboxToggled(checked: true))
            ..add(const ConsentCheckboxToggled(checked: false));
        },
        expect: () => [
          const ConsentFilling(childAge: 12),
          const ConsentFilling(childAge: 12, isCheckboxChecked: true),
          const ConsentFilling(childAge: 12),
        ],
      );
    });

    group('ConsentSubmitted', () {
      blocTest<ConsentBloc, ConsentState>(
        'emits [ConsentSubmitting, ConsentSuccess] '
        'and dispatches AuthConsentGranted on success',
        build: () {
          when(
            () => mockConsentRepository.grantConsent(
              childAge: any(named: 'childAge'),
            ),
          ).thenAnswer(
            (_) async => {
              'id': 'uuid',
              'status': 'GRANTED',
              'consentVersion': '1.0',
            },
          );
          return consentBloc;
        },
        act: (bloc) {
          bloc
            ..add(const ConsentAgeChanged(12))
            ..add(const ConsentCheckboxToggled(checked: true))
            ..add(const ConsentSubmitted());
        },
        expect: () => [
          const ConsentFilling(childAge: 12),
          const ConsentFilling(childAge: 12, isCheckboxChecked: true),
          const ConsentSubmitting(),
          const ConsentSuccess(),
        ],
        verify: (_) {
          verify(
            () => mockConsentRepository.grantConsent(childAge: 12),
          ).called(1);
          verify(
            () => mockAuthBloc.add(const AuthConsentGranted()),
          ).called(1);
        },
      );

      blocTest<ConsentBloc, ConsentState>(
        'emits ConsentFailure when API throws AppException',
        build: () {
          when(
            () => mockConsentRepository.grantConsent(
              childAge: any(named: 'childAge'),
            ),
          ).thenThrow(
            const ServerException(message: 'Server error'),
          );
          return consentBloc;
        },
        act: (bloc) {
          bloc
            ..add(const ConsentAgeChanged(12))
            ..add(const ConsentCheckboxToggled(checked: true))
            ..add(const ConsentSubmitted());
        },
        expect: () => [
          const ConsentFilling(childAge: 12),
          const ConsentFilling(childAge: 12, isCheckboxChecked: true),
          const ConsentSubmitting(),
          isA<ConsentFailure>().having(
            (f) => f.message,
            'message',
            'Server error',
          ),
        ],
        verify: (_) {
          verifyNever(
            () => mockAuthBloc.add(const AuthConsentGranted()),
          );
        },
      );

      blocTest<ConsentBloc, ConsentState>(
        'emits ConsentFailure when form is not valid '
        '(no age, no checkbox)',
        build: () => consentBloc,
        act: (bloc) => bloc.add(const ConsentSubmitted()),
        expect: () => [
          isA<ConsentFailure>().having(
            (f) => f.message,
            'message',
            contains('Vui lòng'),
          ),
        ],
      );

      blocTest<ConsentBloc, ConsentState>(
        'emits ConsentFailure with generic message '
        'on unexpected exception',
        build: () {
          when(
            () => mockConsentRepository.grantConsent(
              childAge: any(named: 'childAge'),
            ),
          ).thenThrow(Exception('unexpected'));
          return consentBloc;
        },
        act: (bloc) {
          bloc
            ..add(const ConsentAgeChanged(12))
            ..add(const ConsentCheckboxToggled(checked: true))
            ..add(const ConsentSubmitted());
        },
        expect: () => [
          const ConsentFilling(childAge: 12),
          const ConsentFilling(childAge: 12, isCheckboxChecked: true),
          const ConsentSubmitting(),
          isA<ConsentFailure>().having(
            (f) => f.message,
            'message',
            contains('thất bại'),
          ),
        ],
      );
    });
  });
}
