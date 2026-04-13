import 'package:equatable/equatable.dart';

/// Events consumed by `ProfileSelectionBloc`.
sealed class ProfileSelectionEvent extends Equatable {
  const ProfileSelectionEvent();

  @override
  List<Object?> get props => [];
}

/// Fired when the profile selection screen is loaded.
/// Triggers fetching of child profiles from the API.
class ProfileSelectionStarted extends ProfileSelectionEvent {
  const ProfileSelectionStarted();
}

/// Fired when the parent taps a child profile to switch to.
class ProfileSelected extends ProfileSelectionEvent {
  const ProfileSelected({required this.childId});

  final String childId;

  @override
  List<Object?> get props => [childId];
}

/// Fired to refresh the profile list (e.g. pull-to-refresh).
class ProfilesRefreshed extends ProfileSelectionEvent {
  const ProfilesRefreshed();
}
