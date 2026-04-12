/// Unit Tests — Story 2.4: ChildProfileForm form model
/// Tests validate form validation logic and copyWith behavior.
library;

import 'package:english_pro/features/onboarding/models/child_profile_form.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ChildProfileForm', () {
    // ── Default values ────────────────────────────────────────────────────

    group('default constructor', () {
      test('initializes with empty name and avatarId=1', () {
        const form = ChildProfileForm();

        expect(form.name, isEmpty);
        expect(form.selectedAvatarId, 1);
      });

      test('initial form is not valid (empty name)', () {
        const form = ChildProfileForm();

        expect(form.isFormValid, isFalse);
      });

      test('initial form has null nameError (empty name — not yet dirty)', () {
        // When name is empty, no error shown (user hasn't typed anything yet)
        const form = ChildProfileForm();

        // Empty name → isNameValid=false but nameError is null (no > 20 chars)
        expect(form.nameError, isNull);
        expect(form.isNameValid, isFalse);
      });
    });

    // ── isNameValid ───────────────────────────────────────────────────────

    group('isNameValid', () {
      test('returns true for name with 1 character (min valid)', () {
        const form = ChildProfileForm(name: 'A');

        expect(form.isNameValid, isTrue);
      });

      test('returns true for name with 20 characters (max valid)', () {
        final form = ChildProfileForm(name: 'A' * 20);

        expect(form.isNameValid, isTrue);
      });

      test('returns false for empty name', () {
        const form = ChildProfileForm(name: '');

        expect(form.isNameValid, isFalse);
      });

      test('returns false for name with 21 characters (overflow)', () {
        final form = ChildProfileForm(name: 'A' * 21);

        expect(form.isNameValid, isFalse);
      });

      test('returns true for Vietnamese name (Unicode)', () {
        const form = ChildProfileForm(name: 'Nguyễn Minh');

        expect(form.isNameValid, isTrue);
      });
    });

    // ── nameError ─────────────────────────────────────────────────────────

    group('nameError', () {
      test('returns null for valid name', () {
        const form = ChildProfileForm(name: 'Bé Minh');

        expect(form.nameError, isNull);
      });

      test('returns null for empty name (not yet touched)', () {
        const form = ChildProfileForm(name: '');

        // Empty input has no error message (user hasn't typed)
        expect(form.nameError, isNull);
      });

      test('returns error message for name > 20 characters', () {
        final form = ChildProfileForm(name: 'A' * 21);

        expect(form.nameError, isNotNull);
        expect(form.nameError, contains('20'));
      });

      test('returns null for name with exactly 20 characters (boundary)', () {
        final form = ChildProfileForm(name: 'A' * 20);

        expect(form.nameError, isNull);
      });

      test('error message contains Vietnamese text', () {
        final form = ChildProfileForm(name: 'A' * 21);

        expect(form.nameError, contains('ký tự'));
      });
    });

    // ── isFormValid ───────────────────────────────────────────────────────

    group('isFormValid', () {
      test('returns true when name is valid (1–20 chars)', () {
        const form = ChildProfileForm(name: 'Bé Minh');

        expect(form.isFormValid, isTrue);
      });

      test('returns false when name is empty', () {
        const form = ChildProfileForm(name: '');

        expect(form.isFormValid, isFalse);
      });

      test('returns false when name exceeds 20 chars', () {
        final form = ChildProfileForm(name: 'A' * 21);

        expect(form.isFormValid, isFalse);
      });

      test('returns true regardless of selectedAvatarId value', () {
        // Form validity only depends on name
        const form1 = ChildProfileForm(name: 'Minh', selectedAvatarId: 1);
        const form2 = ChildProfileForm(name: 'Minh', selectedAvatarId: 6);

        expect(form1.isFormValid, isTrue);
        expect(form2.isFormValid, isTrue);
      });
    });

    // ── copyWith ──────────────────────────────────────────────────────────

    group('copyWith', () {
      test('updates name and preserves selectedAvatarId', () {
        const original = ChildProfileForm(name: 'Old Name', selectedAvatarId: 3);

        final updated = original.copyWith(name: 'New Name');

        expect(updated.name, 'New Name');
        expect(updated.selectedAvatarId, 3);
      });

      test('updates selectedAvatarId and preserves name', () {
        const original = ChildProfileForm(name: 'Minh', selectedAvatarId: 1);

        final updated = original.copyWith(selectedAvatarId: 4);

        expect(updated.name, 'Minh');
        expect(updated.selectedAvatarId, 4);
      });

      test('returns a new instance (immutability)', () {
        const original = ChildProfileForm(name: 'A');

        final updated = original.copyWith(name: 'B');

        expect(identical(original, updated), isFalse);
        expect(original.name, 'A'); // original unchanged
        expect(updated.name, 'B');
      });

      test('preserves all fields when no arguments provided', () {
        const original = ChildProfileForm(name: 'Minh', selectedAvatarId: 5);

        final updated = original.copyWith();

        expect(updated.name, 'Minh');
        expect(updated.selectedAvatarId, 5);
      });

      test('updates both fields simultaneously', () {
        const original = ChildProfileForm(name: 'Old', selectedAvatarId: 1);

        final updated = original.copyWith(name: 'New', selectedAvatarId: 6);

        expect(updated.name, 'New');
        expect(updated.selectedAvatarId, 6);
      });
    });
  });
}
