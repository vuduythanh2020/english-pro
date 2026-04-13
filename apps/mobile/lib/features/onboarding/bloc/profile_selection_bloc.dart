import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/features/onboarding/bloc/profile_selection_event.dart';
import 'package:english_pro/features/onboarding/bloc/profile_selection_state.dart';
import 'package:english_pro/features/onboarding/repositories/child_switch_repository.dart';
import 'package:english_pro/features/onboarding/repositories/children_repository.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// Manages the profile selection screen state.
///
/// Fetches child profiles and handles switching to a child session
/// via the `switch-to-child` API endpoint.
class ProfileSelectionBloc
    extends Bloc<ProfileSelectionEvent, ProfileSelectionState> {
  ProfileSelectionBloc({
    required ChildrenRepository childrenRepository,
    required ChildSwitchRepository childSwitchRepository,
    required AuthBloc authBloc,
  })  : _childrenRepository = childrenRepository,
        _childSwitchRepository = childSwitchRepository,
        _authBloc = authBloc,
        super(const ProfileSelectionInitial()) {
    on<ProfileSelectionStarted>(_onStarted);
    on<ProfileSelected>(_onProfileSelected);
    on<ProfilesRefreshed>(_onRefreshed);
  }

  final ChildrenRepository _childrenRepository;
  final ChildSwitchRepository _childSwitchRepository;
  final AuthBloc _authBloc;

  Future<void> _onStarted(
    ProfileSelectionStarted event,
    Emitter<ProfileSelectionState> emit,
  ) async {
    emit(const ProfileSelectionLoading());
    try {
      final profiles = await _childrenRepository.getChildProfiles();
      emit(ProfileSelectionLoaded(profiles: profiles));
    } on AppException catch (e) {
      emit(ProfileSelectionFailure(message: e.message));
    } catch (e) {
      emit(ProfileSelectionFailure(message: e.toString()));
    }
  }

  Future<void> _onProfileSelected(
    ProfileSelected event,
    Emitter<ProfileSelectionState> emit,
  ) async {
    if (state is ProfileSelectionSwitching) return;
    emit(ProfileSelectionSwitching(childId: event.childId));
    try {
      final result =
          await _childSwitchRepository.switchToChild(event.childId);

      // Dispatch to AuthBloc to start child session
      _authBloc.add(
        AuthChildSessionStarted(
          childId: result.childId,
          childJwt: result.accessToken,
        ),
      );

      emit(ProfileSelectionSuccess(childId: result.childId));
    } on AppException catch (e) {
      emit(ProfileSelectionFailure(message: e.message));
    } catch (e) {
      emit(ProfileSelectionFailure(message: e.toString()));
    }
  }

  Future<void> _onRefreshed(
    ProfilesRefreshed event,
    Emitter<ProfileSelectionState> emit,
  ) async {
    emit(const ProfileSelectionLoading());
    try {
      final profiles = await _childrenRepository.getChildProfiles();
      emit(ProfileSelectionLoaded(profiles: profiles));
    } on AppException catch (e) {
      emit(ProfileSelectionFailure(message: e.message));
    } catch (e) {
      emit(ProfileSelectionFailure(message: e.toString()));
    }
  }
}
