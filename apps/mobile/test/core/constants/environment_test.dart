/// Unit Tests - Story 1.5: Environment
library;

import 'package:english_pro/core/constants/environment.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Environment', () {
    test('current defaults to development', () {
      // Without --dart-define=ENV=..., defaults to development.
      expect(Environment.current, Environment.development);
    });

    test('isDevelopment returns true for development', () {
      expect(Environment.development.isDevelopment, isTrue);
      expect(Environment.staging.isDevelopment, isFalse);
      expect(Environment.production.isDevelopment, isFalse);
    });

    test('isStaging returns true for staging', () {
      expect(Environment.staging.isStaging, isTrue);
      expect(Environment.development.isStaging, isFalse);
    });

    test('isProduction returns true for production', () {
      expect(Environment.production.isProduction, isTrue);
      expect(Environment.development.isProduction, isFalse);
    });

    test('apiBaseUrl returns correct default for development', () {
      expect(
        Environment.development.apiBaseUrl,
        'http://localhost:3000/api/v1',
      );
    });

    test('all enum values exist', () {
      expect(Environment.values.length, 3);
      expect(
        Environment.values,
        containsAll([
          Environment.development,
          Environment.staging,
          Environment.production,
        ]),
      );
    });
  });
}
