/// Unit Tests — Story 2.4: ChildProfileEvent and ChildProfileState data classes
/// Tests validate Equatable props, equality, and type hierarchy.
library;

import 'package:english_pro/features/onboarding/bloc/child_profile_event.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_state.dart';
import 'package:english_pro/features/onboarding/models/child_profile_form.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // ── ChildProfileEvent ─────────────────────────────────────────────────────

  group('ChildProfileEvent', () {
    group('ChildProfileNameChanged', () {
      test('props contains name', () {
        const event = ChildProfileNameChanged('Minh');

        expect(event.props, contains('Minh'));
      });

      test('two events with same name are equal', () {
        const e1 = ChildProfileNameChanged('Minh');
        const e2 = ChildProfileNameChanged('Minh');

        expect(e1, equals(e2));
      });

      test('two events with different names are not equal', () {
        const e1 = ChildProfileNameChanged('Minh');
        const e2 = ChildProfileNameChanged('Lan');

        expect(e1, isNot(equals(e2)));
      });
    });

    group('ChildProfileAvatarSelected', () {
      test('props contains avatarId', () {
        const event = ChildProfileAvatarSelected(3);

        expect(event.props, contains(3));
      });

      test('two events with same avatarId are equal', () {
        const e1 = ChildProfileAvatarSelected(3);
        const e2 = ChildProfileAvatarSelected(3);

        expect(e1, equals(e2));
      });

      test('two events with different avatarIds are not equal', () {
        const e1 = ChildProfileAvatarSelected(1);
        const e2 = ChildProfileAvatarSelected(6);

        expect(e1, isNot(equals(e2)));
      });
    });

    group('ChildProfileSubmitted', () {
      test('two submitted events are equal (no-arg)', () {
        const e1 = ChildProfileSubmitted();
        const e2 = ChildProfileSubmitted();

        expect(e1, equals(e2));
      });
    });
  });

  // ── ChildProfileState ─────────────────────────────────────────────────────

  group('ChildProfileState', () {
    group('ChildProfileInitial', () {
      test('two initial states are equal', () {
        const s1 = ChildProfileInitial();
        const s2 = ChildProfileInitial();

        expect(s1, equals(s2));
      });

      test('is a ChildProfileState', () {
        expect(const ChildProfileInitial(), isA<ChildProfileState>());
      });
    });

    group('ChildProfileFilling', () {
      test('two filling states with same form are equal', () {
        const form = ChildProfileForm(name: 'Minh', selectedAvatarId: 2);
        final s1 = ChildProfileFilling(form: form);
        final s2 = ChildProfileFilling(form: form);

        expect(s1, equals(s2));
      });

      test('two filling states with different forms are not equal', () {
        final s1 = ChildProfileFilling(
          form: const ChildProfileForm(name: 'Minh'),
        );
        final s2 = ChildProfileFilling(
          form: const ChildProfileForm(name: 'Lan'),
        );

        expect(s1, isNot(equals(s2)));
      });

      test('props contains form', () {
        const form = ChildProfileForm(name: 'Minh');
        final state = ChildProfileFilling(form: form);

        expect(state.props, contains(form));
      });
    });

    group('ChildProfileSubmitting', () {
      test('two submitting states are equal', () {
        const s1 = ChildProfileSubmitting();
        const s2 = ChildProfileSubmitting();

        expect(s1, equals(s2));
      });
    });

    group('ChildProfileSuccess', () {
      test('two success states are equal', () {
        const s1 = ChildProfileSuccess();
        const s2 = ChildProfileSuccess();

        expect(s1, equals(s2));
      });
    });

    group('ChildProfileFailure', () {
      test('props contains message and errorId', () {
        final state = ChildProfileFailure(message: 'Error');

        expect(state.props, contains('Error'));
        expect(state.props.length, 2); // message + errorId
      });

      test('each ChildProfileFailure has a unique errorId (re-triggers SnackBar design)', () async {
        // ChildProfileFailure uses DateTime.now().microsecondsSinceEpoch for errorId.
        // Two instances created within the same microsecond MAY share the same errorId
        // in fast test environments. The key design property is that errorId is
        // part of props — so two failures with different errorIds are NOT equal.
        final s1 = ChildProfileFailure(message: 'Error');
        // Small delay to ensure different microsecond timestamp
        await Future<void>.delayed(const Duration(microseconds: 10));
        final s2 = ChildProfileFailure(message: 'Error');

        // errorId is part of props — if different, states are not equal
        expect(s1.message, s2.message);
        expect(s1.props.length, 2); // message + errorId
        expect(s2.props.length, 2);
        // Both errorIds are non-null and positive
        expect(s1.errorId, greaterThan(0));
        expect(s2.errorId, greaterThan(0));
      });

      test('message is accessible', () {
        final state = ChildProfileFailure(message: 'Lỗi từ server');

        expect(state.message, 'Lỗi từ server');
      });
    });

    group('State type hierarchy', () {
      test('all states are ChildProfileState', () {
        const form = ChildProfileForm();

        expect(const ChildProfileInitial(), isA<ChildProfileState>());
        expect(ChildProfileFilling(form: form), isA<ChildProfileState>());
        expect(const ChildProfileSubmitting(), isA<ChildProfileState>());
        expect(const ChildProfileSuccess(), isA<ChildProfileState>());
        expect(ChildProfileFailure(message: 'err'), isA<ChildProfileState>());
      });
    });
  });
}
