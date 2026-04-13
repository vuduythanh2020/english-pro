/// Unit Tests — Story 2.5: ProfileSelectionBloc
///
/// Tests validate that ProfileSelectionBloc correctly fetches child profiles,
/// handles profile switching, and dispatches to AuthBloc.
///
/// Test IDs: FLUTTER-PROFILE-BLOC-001 through FLUTTER-PROFILE-BLOC-010
library;

import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';
import 'package:english_pro/features/onboarding/bloc/profile_selection_bloc.dart';
import 'package:english_pro/features/onboarding/bloc/profile_selection_event.dart';
import 'package:english_pro/features/onboarding/bloc/profile_selection_state.dart';
import 'package:english_pro/features/onboarding/models/child_profile.dart';
import 'package:english_pro/features/onboarding/repositories/child_switch_repository.dart';
import 'package:english_pro/features/onboarding/repositories/children_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:mocktail/mocktail.dart';

class MockChildrenRepository extends Mock implements ChildrenRepository {}

class MockChildSwitchRepository extends Mock implements ChildSwitchRepository {}

class MockAuthBloc extends MockBloc<AuthEvent, AuthState> implements AuthBloc {}

class MockSecureStorageService extends Mock implements SecureStorageService {}

class MockHydratedStorage extends Mock implements Storage {}

void main() {
  late MockChildrenRepository mockChildrenRepo;
  late MockChildSwitchRepository mockSwitchRepo;
  late MockAuthBloc mockAuthBloc;
  late MockHydratedStorage mockHydratedStorage;

  final testProfile1 = ChildProfile(
    id: 'child-uuid-1',
    parentId: 'parent-uuid',
    displayName: 'Bé Minh',
    avatarId: 1,
    level: 'beginner',
    xpTotal: 0,
    createdAt: DateTime.parse('2026-04-12T00:00:00.000Z'),
  );

  final testProfile2 = ChildProfile(
    id: 'child-uuid-2',
    parentId: 'parent-uuid',
    displayName: 'Bé Lan',
    avatarId: 3,
    level: 'beginner',
    xpTotal: 100,
    createdAt: DateTime.parse('2026-04-12T01:00:00.000Z'),
  );

  setUpAll(() {
    // Register fallback values for AuthEvent types (required by mocktail for any())
    registerFallbackValue(
      const AuthChildSessionStarted(childId: 'fallback-child', childJwt: 'fallback-jwt'),
    );
    registerFallbackValue(const AuthLoggedOut());
  });

  setUp(() {
    mockChildrenRepo = MockChildrenRepository();
    mockSwitchRepo = MockChildSwitchRepository();
    mockAuthBloc = MockAuthBloc();
    mockHydratedStorage = MockHydratedStorage();

    when(() => mockHydratedStorage.read(any())).thenReturn(null);
    when(
      () => mockHydratedStorage.write(any(), any<dynamic>()),
    ).thenAnswer((_) async {});
    when(
      () => mockHydratedStorage.delete(any()),
    ).thenAnswer((_) async {});
    when(() => mockHydratedStorage.clear()).thenAnswer((_) async {});

    HydratedBloc.storage = mockHydratedStorage;

    // Default AuthBloc state
    when(() => mockAuthBloc.state).thenReturn(
      const AuthAuthenticated(accessToken: 'parent-token'),
    );
  });

  ProfileSelectionBloc buildBloc() => ProfileSelectionBloc(
        childrenRepository: mockChildrenRepo,
        childSwitchRepository: mockSwitchRepo,
        authBloc: mockAuthBloc,
      );

  group('ProfileSelectionBloc', () {
    // ── ProfileSelectionStarted ───────────────────────────────────────

    group('ProfileSelectionStarted', () {
      // FLUTTER-PROFILE-BLOC-001
      blocTest<ProfileSelectionBloc, ProfileSelectionState>(
        'FLUTTER-PROFILE-BLOC-001: emits [Loading, Loaded] when profiles fetched successfully',
        build: () {
          when(() => mockChildrenRepo.getChildProfiles()).thenAnswer(
            (_) async => [testProfile1, testProfile2],
          );
          return buildBloc();
        },
        act: (bloc) => bloc.add(const ProfileSelectionStarted()),
        expect: () => [
          isA<ProfileSelectionLoading>(),
          isA<ProfileSelectionLoaded>(),
        ],
        verify: (bloc) {
          final loaded = bloc.state as ProfileSelectionLoaded;
          expect(loaded.profiles, hasLength(2));
          expect(loaded.profiles[0].displayName, 'Bé Minh');
          expect(loaded.profiles[1].displayName, 'Bé Lan');
        },
      );

      // FLUTTER-PROFILE-BLOC-002
      blocTest<ProfileSelectionBloc, ProfileSelectionState>(
        'FLUTTER-PROFILE-BLOC-002: emits [Loading, Loaded(empty)] when no profiles exist',
        build: () {
          when(() => mockChildrenRepo.getChildProfiles()).thenAnswer(
            (_) async => [],
          );
          return buildBloc();
        },
        act: (bloc) => bloc.add(const ProfileSelectionStarted()),
        expect: () => [
          isA<ProfileSelectionLoading>(),
          isA<ProfileSelectionLoaded>(),
        ],
        verify: (bloc) {
          final loaded = bloc.state as ProfileSelectionLoaded;
          expect(loaded.profiles, isEmpty);
        },
      );

      // FLUTTER-PROFILE-BLOC-003
      blocTest<ProfileSelectionBloc, ProfileSelectionState>(
        'FLUTTER-PROFILE-BLOC-003: emits [Loading, Failure] when repository throws AppException',
        build: () {
          when(() => mockChildrenRepo.getChildProfiles()).thenThrow(
            const UnauthorizedException(message: 'Session expired'),
          );
          return buildBloc();
        },
        act: (bloc) => bloc.add(const ProfileSelectionStarted()),
        expect: () => [
          isA<ProfileSelectionLoading>(),
          isA<ProfileSelectionFailure>(),
        ],
        verify: (bloc) {
          final failure = bloc.state as ProfileSelectionFailure;
          expect(failure.message, 'Session expired');
        },
      );

      // FLUTTER-PROFILE-BLOC-004
      blocTest<ProfileSelectionBloc, ProfileSelectionState>(
        'FLUTTER-PROFILE-BLOC-004: emits [Loading, Failure] when repository throws generic error',
        build: () {
          when(() => mockChildrenRepo.getChildProfiles()).thenThrow(
            Exception('Unknown error'),
          );
          return buildBloc();
        },
        act: (bloc) => bloc.add(const ProfileSelectionStarted()),
        expect: () => [
          isA<ProfileSelectionLoading>(),
          isA<ProfileSelectionFailure>(),
        ],
      );
    });

    // ── ProfileSelected ───────────────────────────────────────────────

    group('ProfileSelected', () {
      // FLUTTER-PROFILE-BLOC-005
      blocTest<ProfileSelectionBloc, ProfileSelectionState>(
        'FLUTTER-PROFILE-BLOC-005: emits [Switching, Success] on successful switch and dispatches AuthChildSessionStarted',
        build: () {
          when(
            () => mockSwitchRepo.switchToChild(any()),
          ).thenAnswer(
            (_) async => const ChildSwitchResult(
              accessToken: 'child-jwt-token',
              childId: 'child-uuid-1',
            ),
          );
          return buildBloc();
        },
        act: (bloc) => bloc.add(const ProfileSelected(childId: 'child-uuid-1')),
        expect: () => [
          isA<ProfileSelectionSwitching>(),
          isA<ProfileSelectionSuccess>(),
        ],
        verify: (_) {
          verify(
            () => mockAuthBloc.add(
              const AuthChildSessionStarted(
                childId: 'child-uuid-1',
                childJwt: 'child-jwt-token',
              ),
            ),
          ).called(1);
        },
      );

      // FLUTTER-PROFILE-BLOC-006
      blocTest<ProfileSelectionBloc, ProfileSelectionState>(
        'FLUTTER-PROFILE-BLOC-006: Switching state contains correct childId',
        build: () {
          when(
            () => mockSwitchRepo.switchToChild(any()),
          ).thenAnswer(
            (_) async => const ChildSwitchResult(
              accessToken: 'child-jwt',
              childId: 'child-uuid-2',
            ),
          );
          return buildBloc();
        },
        act: (bloc) => bloc.add(const ProfileSelected(childId: 'child-uuid-2')),
        expect: () => [
          isA<ProfileSelectionSwitching>().having(
            (s) => s.childId,
            'childId',
            'child-uuid-2',
          ),
          isA<ProfileSelectionSuccess>().having(
            (s) => s.childId,
            'childId',
            'child-uuid-2',
          ),
        ],
      );

      // FLUTTER-PROFILE-BLOC-007
      blocTest<ProfileSelectionBloc, ProfileSelectionState>(
        'FLUTTER-PROFILE-BLOC-007: emits [Switching, Failure] when ChildProfileNotFoundException thrown',
        build: () {
          when(
            () => mockSwitchRepo.switchToChild(any()),
          ).thenThrow(
            const ChildProfileNotFoundException(message: 'Không tìm thấy hồ sơ trẻ em'),
          );
          return buildBloc();
        },
        act: (bloc) => bloc.add(const ProfileSelected(childId: 'bad-uuid')),
        expect: () => [
          isA<ProfileSelectionSwitching>(),
          isA<ProfileSelectionFailure>(),
        ],
        verify: (bloc) {
          final failure = bloc.state as ProfileSelectionFailure;
          expect(failure.message, contains('hồ sơ'));
        },
      );

      // FLUTTER-PROFILE-BLOC-008
      blocTest<ProfileSelectionBloc, ProfileSelectionState>(
        'FLUTTER-PROFILE-BLOC-008: emits [Switching, Failure] when UnauthorizedException thrown',
        build: () {
          when(
            () => mockSwitchRepo.switchToChild(any()),
          ).thenThrow(
            const UnauthorizedException(message: 'Token expired'),
          );
          return buildBloc();
        },
        act: (bloc) => bloc.add(const ProfileSelected(childId: 'child-uuid')),
        expect: () => [
          isA<ProfileSelectionSwitching>(),
          isA<ProfileSelectionFailure>(),
        ],
        verify: (_) {
          // AuthBloc should NOT receive AuthChildSessionStarted on failure
          verifyNever(
            () => mockAuthBloc.add(
              any(that: isA<AuthChildSessionStarted>()),
            ),
          );
        },
      );
    });

    // ── ProfilesRefreshed ─────────────────────────────────────────────

    group('ProfilesRefreshed', () {
      // FLUTTER-PROFILE-BLOC-009
      blocTest<ProfileSelectionBloc, ProfileSelectionState>(
        'FLUTTER-PROFILE-BLOC-009: emits [Loading, Loaded] on refresh success',
        build: () {
          when(() => mockChildrenRepo.getChildProfiles()).thenAnswer(
            (_) async => [testProfile1],
          );
          return buildBloc();
        },
        act: (bloc) => bloc.add(const ProfilesRefreshed()),
        expect: () => [
          isA<ProfileSelectionLoading>(),
          isA<ProfileSelectionLoaded>(),
        ],
        verify: (bloc) {
          final loaded = bloc.state as ProfileSelectionLoaded;
          expect(loaded.profiles, hasLength(1));
        },
      );

      // FLUTTER-PROFILE-BLOC-010
      blocTest<ProfileSelectionBloc, ProfileSelectionState>(
        'FLUTTER-PROFILE-BLOC-010: emits [Loading, Failure] on refresh failure',
        build: () {
          when(() => mockChildrenRepo.getChildProfiles()).thenThrow(
            const NetworkException(),
          );
          return buildBloc();
        },
        act: (bloc) => bloc.add(const ProfilesRefreshed()),
        expect: () => [
          isA<ProfileSelectionLoading>(),
          isA<ProfileSelectionFailure>(),
        ],
      );
    });
  });
}
