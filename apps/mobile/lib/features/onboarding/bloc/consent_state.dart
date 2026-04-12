import 'package:equatable/equatable.dart';

/// States for [ConsentBloc].
sealed class ConsentState extends Equatable {
  const ConsentState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any interaction.
class ConsentInitial extends ConsentState {
  const ConsentInitial();
}

/// Form is being filled — tracks age, checkbox, and warnings.
class ConsentFilling extends ConsentState {
  const ConsentFilling({
    this.childAge,
    this.isCheckboxChecked = false,
    this.isAgeWarning = false,
  });

  /// Child age — `null` when not yet entered.
  final int? childAge;

  /// Whether the consent checkbox is checked.
  final bool isCheckboxChecked;

  /// Whether age is outside the 10–15 target range (but still valid 1–18).
  final bool isAgeWarning;

  /// Age is valid when in 1–18 range.
  bool get isAgeValid => childAge != null && childAge! >= 1 && childAge! <= 18;

  /// Form is valid when age is valid AND checkbox is checked.
  bool get isFormValid => isAgeValid && isCheckboxChecked;

  @override
  List<Object?> get props => [childAge, isCheckboxChecked, isAgeWarning];
}

/// Consent is being submitted to the server.
class ConsentSubmitting extends ConsentState {
  const ConsentSubmitting();
}

/// Consent was successfully recorded.
class ConsentSuccess extends ConsentState {
  const ConsentSuccess();
}

/// Consent submission failed.
///
/// [errorId] is a unique timestamp that forces BlocListener to re-fire
/// even when [message] is the same as the previous failure (pattern from
/// Story 2.1/2.2).
class ConsentFailure extends ConsentState {
  ConsentFailure({required this.message})
    : errorId = DateTime.now().microsecondsSinceEpoch;

  final String message;

  /// Unique ID to distinguish repeated failures with the same message.
  final int errorId;

  @override
  List<Object?> get props => [message, errorId];
}
