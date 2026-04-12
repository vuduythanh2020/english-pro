import 'package:equatable/equatable.dart';

/// Events for [ConsentBloc].
sealed class ConsentEvent extends Equatable {
  const ConsentEvent();

  @override
  List<Object?> get props => [];
}

/// Child age input changed.
class ConsentAgeChanged extends ConsentEvent {
  const ConsentAgeChanged(this.age);
  final int age;

  @override
  List<Object?> get props => [age];
}

/// Consent checkbox toggled.
class ConsentCheckboxToggled extends ConsentEvent {
  const ConsentCheckboxToggled({required this.checked});
  final bool checked;

  @override
  List<Object?> get props => [checked];
}

/// Consent form submitted.
class ConsentSubmitted extends ConsentEvent {
  const ConsentSubmitted();
}
