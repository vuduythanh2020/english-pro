import 'package:english_pro/features/onboarding/models/child_profile.dart';
import 'package:equatable/equatable.dart';

/// States emitted by `ProfileSelectionBloc`.
sealed class ProfileSelectionState extends Equatable {
  const ProfileSelectionState();

  @override
  List<Object?> get props => [];
}

/// Initial state before profiles are loaded.
class ProfileSelectionInitial extends ProfileSelectionState {
  const ProfileSelectionInitial();
}

/// Profiles are being fetched from the API.
class ProfileSelectionLoading extends ProfileSelectionState {
  const ProfileSelectionLoading();
}

/// Profiles have been successfully loaded.
class ProfileSelectionLoaded extends ProfileSelectionState {
  const ProfileSelectionLoaded({required this.profiles});

  final List<ChildProfile> profiles;

  @override
  List<Object?> get props => [profiles];
}

/// A child profile switch is in progress.
class ProfileSelectionSwitching extends ProfileSelectionState {
  const ProfileSelectionSwitching({required this.childId});

  final String childId;

  @override
  List<Object?> get props => [childId];
}

/// Child profile switch succeeded — child JWT obtained.
class ProfileSelectionSuccess extends ProfileSelectionState {
  const ProfileSelectionSuccess({required this.childId});

  final String childId;

  @override
  List<Object?> get props => [childId];
}

/// An error occurred during profile loading or switching.
class ProfileSelectionFailure extends ProfileSelectionState {
  ProfileSelectionFailure({
    required this.message,
    int? errorId,
  }) : errorId = errorId ?? DateTime.now().microsecondsSinceEpoch;

  final String message;
  final int errorId;

  @override
  List<Object?> get props => [message, errorId];
}
