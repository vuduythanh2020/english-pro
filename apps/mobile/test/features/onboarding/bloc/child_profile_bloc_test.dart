import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_bloc.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_event.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_state.dart';
import 'package:english_pro/features/onboarding/models/child_profile.dart';
import 'package:english_pro/features/onboarding/repositories/children_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockChildrenRepository extends Mock implements ChildrenRepository {}

class MockAuthBloc extends Mock implements AuthBloc {}

void main() {
  late ChildProfileBloc bloc;
  late MockChildrenRepository mockRepo;
  late MockAuthBloc mockAuthBloc;

  final fakeProfile = ChildProfile(
    id: 'child-uuid',
    parentId: 'parent-uuid',
    displayName: 'Bé Minh',
    avatarId: 2,
    level: 'beginner',
    xpTotal: 0,
    createdAt: DateTime(2026, 4, 12),
  );

  setUpAll(() {
    registerFallbackValue(const AuthChildProfileCreated());
  });

  setUp(() {
    mockRepo = MockChildrenRepository();
    mockAuthBloc = MockAuthBloc();

    when(() => mockAuthBloc.state).thenReturn(
      const AuthAuthenticated(accessToken: 'test-token'),
    );
    when(() => mockAuthBloc.add(any())).thenReturn(null);

    bloc = ChildProfileBloc(
      childrenRepository: mockRepo,
      authBloc: mockAuthBloc,
    );
  });

  tearDown(() {
    bloc.close();
  });

  group('ChildProfileBloc', () {
    test('initial state is ChildProfileInitial', () {
      expect(bloc.state, isA<ChildProfileInitial>());
    });

    // ── ChildProfileNameChanged ─────────────────────────────────────────────

    group('ChildProfileNameChanged', () {
      blocTest<ChildProfileBloc, ChildProfileState>(
        'emits ChildProfileFilling with updated name',
        build: () => bloc,
        act: (b) => b.add(const ChildProfileNameChanged('Bé Minh')),
        expect: () => [
          isA<ChildProfileFilling>().having(
            (s) => s.form.name,
            'form.name',
            'Bé Minh',
          ),
        ],
      );

      blocTest<ChildProfileBloc, ChildProfileState>(
        'emits ChildProfileFilling with nameError when name > 20 chars',
        build: () => bloc,
        act: (b) =>
            b.add(const ChildProfileNameChanged('TênQuáDàiVượtQuá20KýTự')),
        expect: () => [
          isA<ChildProfileFilling>().having(
            (s) => s.form.nameError,
            'form.nameError',
            isNotNull,
          ),
        ],
      );

      blocTest<ChildProfileBloc, ChildProfileState>(
        'emits ChildProfileFilling with isFormValid=true for valid name',
        build: () => bloc,
        act: (b) => b.add(const ChildProfileNameChanged('Minh')),
        expect: () => [
          isA<ChildProfileFilling>().having(
            (s) => s.form.isFormValid,
            'form.isFormValid',
            isTrue,
          ),
        ],
      );

      blocTest<ChildProfileBloc, ChildProfileState>(
        'emits ChildProfileFilling with isFormValid=false for empty name',
        build: () => bloc,
        act: (b) => b.add(const ChildProfileNameChanged('')),
        expect: () => [
          isA<ChildProfileFilling>().having(
            (s) => s.form.isFormValid,
            'form.isFormValid',
            isFalse,
          ),
        ],
      );
    });

    // ── ChildProfileAvatarSelected ──────────────────────────────────────────

    group('ChildProfileAvatarSelected', () {
      blocTest<ChildProfileBloc, ChildProfileState>(
        'emits ChildProfileFilling with selected avatarId',
        build: () => bloc,
        act: (b) {
          b
            ..add(const ChildProfileNameChanged('Minh'))
            ..add(const ChildProfileAvatarSelected(3));
        },
        expect: () => [
          isA<ChildProfileFilling>().having(
            (s) => s.form.selectedAvatarId,
            'selectedAvatarId',
            1, // default
          ),
          isA<ChildProfileFilling>().having(
            (s) => s.form.selectedAvatarId,
            'selectedAvatarId',
            3, // updated
          ),
        ],
      );
    });

    // ── ChildProfileSubmitted ───────────────────────────────────────────────

    group('ChildProfileSubmitted', () {
      blocTest<ChildProfileBloc, ChildProfileState>(
        'emits [ChildProfileSubmitting, ChildProfileSuccess] '
        'and dispatches AuthChildProfileCreated on success',
        build: () {
          when(
            () => mockRepo.createChildProfile(
              displayName: any(named: 'displayName'),
              avatarId: any(named: 'avatarId'),
            ),
          ).thenAnswer((_) async => fakeProfile);
          return bloc;
        },
        act: (b) {
          b
            ..add(const ChildProfileNameChanged('Bé Minh'))
            ..add(const ChildProfileAvatarSelected(2))
            ..add(const ChildProfileSubmitted());
        },
        expect: () => [
          isA<ChildProfileFilling>(),
          isA<ChildProfileFilling>(),
          const ChildProfileSubmitting(),
          const ChildProfileSuccess(),
        ],
        verify: (_) {
          verify(
            () => mockRepo.createChildProfile(
              displayName: 'Bé Minh',
              avatarId: 2,
            ),
          ).called(1);
          verify(
            () => mockAuthBloc.add(const AuthChildProfileCreated()),
          ).called(1);
        },
      );

      blocTest<ChildProfileBloc, ChildProfileState>(
        'double-tap guard: ignores second submit when already ChildProfileSubmitting',
        build: () {
          // Never resolves — simulates in-flight request
          when(
            () => mockRepo.createChildProfile(
              displayName: any(named: 'displayName'),
              avatarId: any(named: 'avatarId'),
            ),
          ).thenAnswer((_) async {
            await Future<void>.delayed(const Duration(seconds: 5));
            return fakeProfile;
          });
          return bloc;
        },
        act: (b) {
          b
            ..add(const ChildProfileNameChanged('Minh'))
            ..add(const ChildProfileSubmitted())
            ..add(const ChildProfileSubmitted()); // second tap — must be ignored
        },
        expect: () => [
          isA<ChildProfileFilling>(),
          const ChildProfileSubmitting(),
          // no second ChildProfileSubmitting emitted
        ],
        verify: (_) {
          verify(
            () => mockRepo.createChildProfile(
              displayName: any(named: 'displayName'),
              avatarId: any(named: 'avatarId'),
            ),
          ).called(1); // called only once
        },
      );

      blocTest<ChildProfileBloc, ChildProfileState>(
        'emits ChildProfileFailure when API throws ProfileLimitReachedException',
        build: () {
          when(
            () => mockRepo.createChildProfile(
              displayName: any(named: 'displayName'),
              avatarId: any(named: 'avatarId'),
            ),
          ).thenThrow(
            const ProfileLimitReachedException(
              message: 'Mỗi tài khoản tối đa 3 hồ sơ con',
            ),
          );
          return bloc;
        },
        act: (b) {
          b
            ..add(const ChildProfileNameChanged('Minh'))
            ..add(const ChildProfileSubmitted());
        },
        expect: () => [
          isA<ChildProfileFilling>(),
          const ChildProfileSubmitting(),
          isA<ChildProfileFailure>().having(
            (f) => f.message,
            'message',
            contains('3 hồ sơ'),
          ),
        ],
        verify: (_) {
          verifyNever(
            () => mockAuthBloc.add(const AuthChildProfileCreated()),
          );
        },
      );

      blocTest<ChildProfileBloc, ChildProfileState>(
        'emits ChildProfileFailure when API throws AppException',
        build: () {
          when(
            () => mockRepo.createChildProfile(
              displayName: any(named: 'displayName'),
              avatarId: any(named: 'avatarId'),
            ),
          ).thenThrow(
            const ServerException(message: 'Server error'),
          );
          return bloc;
        },
        act: (b) {
          b
            ..add(const ChildProfileNameChanged('Minh'))
            ..add(const ChildProfileSubmitted());
        },
        expect: () => [
          isA<ChildProfileFilling>(),
          const ChildProfileSubmitting(),
          isA<ChildProfileFailure>().having(
            (f) => f.message,
            'message',
            'Server error',
          ),
        ],
      );

      blocTest<ChildProfileBloc, ChildProfileState>(
        'emits ChildProfileFailure with generic message '
        'on unexpected exception',
        build: () {
          when(
            () => mockRepo.createChildProfile(
              displayName: any(named: 'displayName'),
              avatarId: any(named: 'avatarId'),
            ),
          ).thenThrow(Exception('unexpected'));
          return bloc;
        },
        act: (b) {
          b
            ..add(const ChildProfileNameChanged('Minh'))
            ..add(const ChildProfileSubmitted());
        },
        expect: () => [
          isA<ChildProfileFilling>(),
          const ChildProfileSubmitting(),
          isA<ChildProfileFailure>().having(
            (f) => f.message,
            'message',
            contains('thất bại'),
          ),
        ],
      );

      blocTest<ChildProfileBloc, ChildProfileState>(
        'emits ChildProfileFailure when form is not valid (empty name)',
        build: () => bloc,
        act: (b) => b.add(const ChildProfileSubmitted()),
        expect: () => [
          isA<ChildProfileFailure>().having(
            (f) => f.message,
            'message',
            contains('Vui lòng'),
          ),
        ],
      );
    });
  });
}
