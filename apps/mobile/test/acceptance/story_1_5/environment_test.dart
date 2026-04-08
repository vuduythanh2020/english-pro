/// ATDD Tests - Story 1.5: Environment & App Constants
/// Test IDs: 1.5-ENV-001 through 1.5-ENV-002
/// Priority: P1-P2 (Build Configuration)
/// Status: 🔴 RED (failing before implementation)
///
/// These tests validate build flavors, environment detection, and
/// API URL configuration per flavor.
/// All tests use `skip: 'RED - ...'` as TDD red phase markers.
library;

import 'package:flutter_test/flutter_test.dart';

// RED: These imports will fail — source files do not exist yet
// import 'package:english_pro/core/constants/app_constants.dart';
// import 'package:english_pro/core/constants/environment.dart';

void main() {
  group('Story 1.5: Environment Configuration @P1 @Unit', () {
    // 1.5-ENV-001: API URL per flavor
    test(
      '1.5-ENV-001: apiBaseUrl defaults to localhost:3000/api/v1 for development',
      skip: 'RED - AppConstants chưa tồn tại. '
          'Cần tạo lib/core/constants/app_constants.dart',
      () {
        // GIVEN: No --dart-define override
        //
        // WHEN: apiBaseUrl accessed
        // final url = AppConstants.apiBaseUrl;
        //
        // THEN: defaults to development URL
        // expect(url, 'http://localhost:3000/api/v1');
      },
    );

    // 1.5-ENV-002: Environment enum detection
    test(
      '1.5-ENV-002: Environment enum defines development, staging, production',
      skip: 'RED - Environment enum chưa tồn tại. '
          'Cần tạo lib/core/constants/environment.dart',
      () {
        // GIVEN: Environment enum
        //
        // WHEN: values accessed
        // final values = Environment.values;
        //
        // THEN: all 3 environments defined
        // expect(values, contains(Environment.development));
        // expect(values, contains(Environment.staging));
        // expect(values, contains(Environment.production));
        // expect(values.length, 3);
      },
    );
  });
}
