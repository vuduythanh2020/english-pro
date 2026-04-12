/// Form model for the child profile creation form.
///
/// Holds the current form values and provides validation helpers.
class ChildProfileForm {
  const ChildProfileForm({
    this.name = '',
    this.selectedAvatarId = 1,
  });

  /// The child's display name (max 20 characters).
  final String name;

  /// The selected avatar ID (1–6). Defaults to 1 (Orange Fox).
  final int selectedAvatarId;

  /// Returns true if the name is valid (1–20 characters).
  bool get isNameValid => name.isNotEmpty && name.length <= 20;

  /// Returns an error message if name is invalid, null otherwise.
  String? get nameError {
    if (name.length > 20) return 'Tên con tối đa 20 ký tự';
    return null;
  }

  /// Returns true if the entire form is valid.
  bool get isFormValid => isNameValid;

  /// Creates a copy with updated fields.
  ChildProfileForm copyWith({
    String? name,
    int? selectedAvatarId,
  }) {
    return ChildProfileForm(
      name: name ?? this.name,
      selectedAvatarId: selectedAvatarId ?? this.selectedAvatarId,
    );
  }
}
