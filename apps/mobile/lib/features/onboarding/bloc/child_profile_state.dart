import 'package:equatable/equatable.dart';
import 'package:english_pro/features/onboarding/models/child_profile_form.dart';

/// States emitted by [ChildProfileBloc].
sealed class ChildProfileState extends Equatable {
  const ChildProfileState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any user interaction.
class ChildProfileInitial extends ChildProfileState {
  const ChildProfileInitial();
}

/// The user is filling the form.
class ChildProfileFilling extends ChildProfileState {
  const ChildProfileFilling({required this.form});

  final ChildProfileForm form;

  @override
  List<Object?> get props => [form];
}

/// The form is being submitted (API call in progress).
class ChildProfileSubmitting extends ChildProfileState {
  const ChildProfileSubmitting();
}

/// The child profile was successfully created.
class ChildProfileSuccess extends ChildProfileState {
  const ChildProfileSuccess();
}

/// The child profile creation failed.
class ChildProfileFailure extends ChildProfileState {
  ChildProfileFailure({required this.message})
      : errorId = DateTime.now().microsecondsSinceEpoch;

  /// Human-readable error message.
  final String message;

  /// Unique ID to re-trigger SnackBar even if message is the same.
  /// Pattern from Story 2.1/2.3.
  final int errorId;

  @override
  List<Object?> get props => [message, errorId];
}
