import 'package:equatable/equatable.dart';

/// Events consumed by [ChildProfileBloc].
sealed class ChildProfileEvent extends Equatable {
  const ChildProfileEvent();

  @override
  List<Object?> get props => [];
}

/// Fired when the user changes the child's name input.
class ChildProfileNameChanged extends ChildProfileEvent {
  const ChildProfileNameChanged(this.name);

  final String name;

  @override
  List<Object?> get props => [name];
}

/// Fired when the user selects an avatar.
class ChildProfileAvatarSelected extends ChildProfileEvent {
  const ChildProfileAvatarSelected(this.avatarId);

  final int avatarId;

  @override
  List<Object?> get props => [avatarId];
}

/// Fired when the user taps "Tạo hồ sơ" (submit button).
class ChildProfileSubmitted extends ChildProfileEvent {
  const ChildProfileSubmitted();
}
