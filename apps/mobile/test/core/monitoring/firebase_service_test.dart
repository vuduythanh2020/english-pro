import 'package:english_pro/core/monitoring/firebase_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('FirebaseService', () {
    group('analytics getter', () {
      test('throws StateError when accessed before initialize()', () {
        // FirebaseService._initialized is false by default
        // Accessing analytics before initialize() should throw
        expect(
          () => FirebaseService.analytics,
          throwsA(isA<StateError>()),
        );
      });

      test('StateError has descriptive message', () {
        try {
          FirebaseService.analytics;
          fail('Expected StateError');
        } on StateError catch (e) {
          expect(
            e.message,
            contains('initialize()'),
          );
        }
      });
    });

    group('observer getter', () {
      test('throws StateError when accessed before initialize()', () {
        // observer depends on analytics, so it should also throw
        expect(
          () => FirebaseService.observer,
          throwsA(isA<StateError>()),
        );
      });
    });

    group('logEvent', () {
      test('throws StateError when called before initialize()', () async {
        expect(
          () => FirebaseService.logEvent(name: 'test_event'),
          throwsA(isA<StateError>()),
        );
      });
    });

    group('setUserId', () {
      test('throws StateError when called before initialize()', () async {
        expect(
          () => FirebaseService.setUserId('user-123'),
          throwsA(isA<StateError>()),
        );
      });
    });

    // Note: initialize() requires Firebase native platform bindings
    // which are not available in unit tests. Integration/widget tests
    // with Firebase emulator would be needed for full initialize() coverage.
    // This test ensures the guard pattern works correctly.
  });
}
