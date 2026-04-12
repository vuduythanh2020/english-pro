import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_event.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_state.dart';
import 'package:english_pro/features/onboarding/models/child_profile_form.dart';
import 'package:english_pro/features/onboarding/repositories/children_repository.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// Manages the child profile creation form state and submission.
///
/// On success:
/// 1. Dispatches [AuthChildProfileCreated] to [AuthBloc]
/// 2. [AuthBloc] emits `AuthAuthenticated(hasChildProfile: true)`
/// 3. [GoRouterRefreshStream] triggers re-evaluation → redirects to `/home`
///
/// Note: Double-tap guard (F-11) — if [ChildProfileSubmitting], ignore submit.
class ChildProfileBloc extends Bloc<ChildProfileEvent, ChildProfileState> {
  ChildProfileBloc({
    required ChildrenRepository childrenRepository,
    required AuthBloc authBloc,
  }) : _childrenRepository = childrenRepository,
       _authBloc = authBloc,
       super(const ChildProfileInitial()) {
    on<ChildProfileNameChanged>(_onNameChanged);
    on<ChildProfileAvatarSelected>(_onAvatarSelected);
    on<ChildProfileSubmitted>(_onSubmitted);
  }

  final ChildrenRepository _childrenRepository;
  final AuthBloc _authBloc;

  void _onNameChanged(
    ChildProfileNameChanged event,
    Emitter<ChildProfileState> emit,
  ) {
    final currentForm = _currentForm;
    final updatedForm = currentForm.copyWith(name: event.name);
    emit(ChildProfileFilling(form: updatedForm));
  }

  void _onAvatarSelected(
    ChildProfileAvatarSelected event,
    Emitter<ChildProfileState> emit,
  ) {
    final currentForm = _currentForm;
    final updatedForm = currentForm.copyWith(selectedAvatarId: event.avatarId);
    emit(ChildProfileFilling(form: updatedForm));
  }

  Future<void> _onSubmitted(
    ChildProfileSubmitted event,
    Emitter<ChildProfileState> emit,
  ) async {
    // Double-tap guard (F-11 from deferred-work.md)
    if (state is ChildProfileSubmitting) return;

    final form = _currentForm;

    if (!form.isFormValid) {
      emit(ChildProfileFailure(message: 'Vui lòng nhập tên hợp lệ cho con'));
      return;
    }

    emit(const ChildProfileSubmitting());

    try {
      await _childrenRepository.createChildProfile(
        displayName: form.name,
        avatarId: form.selectedAvatarId,
      );

      // Dispatch to AuthBloc → triggers GoRouter redirect to /home
      _authBloc.add(const AuthChildProfileCreated());

      emit(const ChildProfileSuccess());
    } on ProfileLimitReachedException catch (e) {
      emit(ChildProfileFailure(message: e.message));
    } on AppException catch (e) {
      emit(ChildProfileFailure(message: e.message));
    } on Exception catch (_) {
      emit(
        ChildProfileFailure(
          message: 'Tạo hồ sơ thất bại. Vui lòng thử lại.',
        ),
      );
    }
  }

  /// Returns the current [ChildProfileForm] from the current state,
  /// defaulting to an initial form if not in [ChildProfileFilling] state.
  ChildProfileForm get _currentForm {
    final currentState = state;
    if (currentState is ChildProfileFilling) {
      return currentState.form;
    }
    return const ChildProfileForm();
  }
}
