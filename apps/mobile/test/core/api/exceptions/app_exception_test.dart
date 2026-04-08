/// Unit Tests - Story 1.5: AppException hierarchy
library;

import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AppException hierarchy', () {
    test('NetworkException has correct defaults', () {
      const e = NetworkException();
      expect(e.message, 'No internet connection');
      expect(e.statusCode, isNull);
      expect(e, isA<AppException>());
    });

    test('ServerException stores statusCode', () {
      const e = ServerException(statusCode: 503);
      expect(e.message, 'Internal server error');
      expect(e.statusCode, 503);
      expect(e, isA<AppException>());
    });

    test('UnauthorizedException defaults to 401', () {
      const e = UnauthorizedException();
      expect(e.statusCode, 401);
      expect(e, isA<AppException>());
    });

    test('ForbiddenException defaults to 403', () {
      const e = ForbiddenException();
      expect(e.statusCode, 403);
      expect(e, isA<AppException>());
    });

    test('NotFoundException defaults to 404', () {
      const e = NotFoundException();
      expect(e.statusCode, 404);
      expect(e, isA<AppException>());
    });

    test('ValidationException carries details', () {
      const e = ValidationException(
        details: {'email': 'required'},
      );
      expect(e.statusCode, 422);
      expect(e.details, {'email': 'required'});
      expect(e, isA<AppException>());
    });

    test('TimeoutException has correct default', () {
      const e = TimeoutException();
      expect(e.message, 'Request timed out');
      expect(e, isA<AppException>());
    });

    test('UnknownException has correct default', () {
      const e = UnknownException();
      expect(e.message, 'An unexpected error occurred');
      expect(e, isA<AppException>());
    });
  });
}
