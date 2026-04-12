/// Model representing the consent form data.
///
/// Used by [ConsentBloc] to track form state and validation.
class ConsentForm {
  const ConsentForm({
    this.childAge,
    this.isCheckboxChecked = false,
  });

  /// Child age — `null` when not yet entered.
  final int? childAge;

  /// Whether the consent checkbox is checked.
  final bool isCheckboxChecked;

  /// Age is valid when in 1–18 range.
  bool get isAgeValid => childAge != null && childAge! >= 1 && childAge! <= 18;

  /// Age is outside the 10–15 target range (but still valid 1–18).
  bool get isAgeWarning =>
      isAgeValid && (childAge! < 10 || childAge! > 15);

  /// Form is valid when age is valid AND checkbox is checked.
  bool get isFormValid => isAgeValid && isCheckboxChecked;

  /// Creates a copy with updated fields.
  ConsentForm copyWith({
    int? childAge,
    bool? isCheckboxChecked,
  }) {
    return ConsentForm(
      childAge: childAge ?? this.childAge,
      isCheckboxChecked: isCheckboxChecked ?? this.isCheckboxChecked,
    );
  }
}
