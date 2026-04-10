import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/features/auth/bloc/registration_bloc.dart';
import 'package:english_pro/features/auth/bloc/registration_event.dart';
import 'package:english_pro/features/auth/bloc/registration_state.dart';
import 'package:english_pro/features/auth/models/registration_form.dart';
import 'package:english_pro/features/auth/repositories/auth_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository mockRepo;

  setUp(() {
    mockRepo = MockAuthRepository();
  });

  group('RegistrationBloc', () {
    test('initial state is RegistrationInitial', () {
      final bloc = RegistrationBloc(authRepository: mockRepo);
      expect(bloc.state, isA<RegistrationInitial>());
      expect(bloc.state.form.email, isEmpty);
      expect(bloc.state.form.password, isEmpty);
      bloc.close();
    });

    blocTest<RegistrationBloc, RegistrationState>(
      'emits RegistrationValidating when email changes',
      build: () => RegistrationBloc(authRepository: mockRepo),
      act: (bloc) => bloc.add(
        const RegistrationEmailChanged('test@example.com'),
      ),
      expect: () => [
        isA<RegistrationValidating>().having(
          (s) => s.form.email,
          'email',
          'test@example.com',
        ),
      ],
    );

    blocTest<RegistrationBloc, RegistrationState>(
      'emits RegistrationValidating when password changes',
      build: () => RegistrationBloc(authRepository: mockRepo),
      act: (bloc) => bloc.add(
        const RegistrationPasswordChanged('Password1'),
      ),
      expect: () => [
        isA<RegistrationValidating>().having(
          (s) => s.form.password,
          'password',
          'Password1',
        ),
      ],
    );

    blocTest<RegistrationBloc, RegistrationState>(
      'emits RegistrationFailure when form is invalid on submit',
      build: () => RegistrationBloc(authRepository: mockRepo),
      act: (bloc) => bloc.add(const RegistrationSubmitted()),
      expect: () => [isA<RegistrationFailure>()],
    );

    blocTest<RegistrationBloc, RegistrationState>(
      'emits [Submitting, Success] on successful registration',
      build: () {
        when(
          () => mockRepo.register(
            email: any(named: 'email'),
            password: any(named: 'password'),
            displayName: any(named: 'displayName'),
          ),
        ).thenAnswer(
          (_) async => {
            'accessToken': 'token-123',
            'refreshToken': 'refresh-456',
            'user': {
              'id': 'user-id',
              'email': 'parent@example.com',
              'role': 'PARENT',
            },
          },
        );
        return RegistrationBloc(authRepository: mockRepo);
      },
      seed: () => RegistrationValidating(
        form: const RegistrationForm(
          email: 'parent@example.com',
          password: 'Password1',
        ),
      ),
      act: (bloc) => bloc.add(const RegistrationSubmitted()),
      expect: () => [
        isA<RegistrationSubmitting>(),
        isA<RegistrationSuccess>()
            .having((s) => s.accessToken, 'token', 'token-123')
            .having(
              (s) => s.refreshToken,
              'refresh',
              'refresh-456',
            ),
      ],
    );

    blocTest<RegistrationBloc, RegistrationState>(
      'emits [Submitting, Failure] on AppException',
      build: () {
        when(
          () => mockRepo.register(
            email: any(named: 'email'),
            password: any(named: 'password'),
            displayName: any(named: 'displayName'),
          ),
        ).thenThrow(
          const ValidationException(message: 'Email đã được đăng ký'),
        );
        return RegistrationBloc(authRepository: mockRepo);
      },
      seed: () => RegistrationValidating(
        form: const RegistrationForm(
          email: 'existing@example.com',
          password: 'Password1',
        ),
      ),
      act: (bloc) => bloc.add(const RegistrationSubmitted()),
      expect: () => [
        isA<RegistrationSubmitting>(),
        isA<RegistrationFailure>().having(
          (s) => s.error,
          'error',
          'Email đã được đăng ký',
        ),
      ],
    );

    blocTest<RegistrationBloc, RegistrationState>(
      'emits [Submitting, Failure] on unknown exception',
      build: () {
        when(
          () => mockRepo.register(
            email: any(named: 'email'),
            password: any(named: 'password'),
            displayName: any(named: 'displayName'),
          ),
        ).thenThrow(Exception('Unknown'));
        return RegistrationBloc(authRepository: mockRepo);
      },
      seed: () => RegistrationValidating(
        form: const RegistrationForm(
          email: 'test@example.com',
          password: 'Password1',
        ),
      ),
      act: (bloc) => bloc.add(const RegistrationSubmitted()),
      expect: () => [
        isA<RegistrationSubmitting>(),
        isA<RegistrationFailure>().having(
          (s) => s.error,
          'error',
          'Đăng ký thất bại. Vui lòng thử lại.',
        ),
      ],
    );
  });
}
