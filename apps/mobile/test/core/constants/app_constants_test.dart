import 'package:english_pro/core/constants/app_constants.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AppConstants', () {
    group('HTTP Timeouts', () {
      test('connectTimeout is 30 seconds', () {
        expect(
          AppConstants.connectTimeout,
          equals(const Duration(seconds: 30)),
        );
      });

      test('receiveTimeout is 30 seconds', () {
        expect(
          AppConstants.receiveTimeout,
          equals(const Duration(seconds: 30)),
        );
      });

      test('sendTimeout is 30 seconds', () {
        expect(
          AppConstants.sendTimeout,
          equals(const Duration(seconds: 30)),
        );
      });
    });

    group('Retry Configuration', () {
      test('maxRetryCount is 3', () {
        expect(AppConstants.maxRetryCount, equals(3));
      });

      test('initialRetryDelay is 1 second', () {
        expect(
          AppConstants.initialRetryDelay,
          equals(const Duration(seconds: 1)),
        );
      });
    });

    group('Secure Storage Keys', () {
      test('accessTokenKey is auth_access_token', () {
        expect(AppConstants.accessTokenKey, equals('auth_access_token'));
      });

      test('refreshTokenKey is auth_refresh_token', () {
        expect(AppConstants.refreshTokenKey, equals('auth_refresh_token'));
      });
    });

    group('Hive Box Names', () {
      test('settingsBox is settings', () {
        expect(AppConstants.settingsBox, equals('settings'));
      });

      test('profilesBox is profiles', () {
        expect(AppConstants.profilesBox, equals('profiles'));
      });

      test('progressBox is progress', () {
        expect(AppConstants.progressBox, equals('progress'));
      });
    });

    group('Snapshot — values must not change accidentally', () {
      test('all constants match expected snapshot', () {
        // This test ensures no accidental changes to constants
        // that downstream code relies on
        expect(AppConstants.connectTimeout.inSeconds, 30);
        expect(AppConstants.receiveTimeout.inSeconds, 30);
        expect(AppConstants.sendTimeout.inSeconds, 30);
        expect(AppConstants.maxRetryCount, 3);
        expect(AppConstants.initialRetryDelay.inMilliseconds, 1000);
        expect(AppConstants.accessTokenKey, 'auth_access_token');
        expect(AppConstants.refreshTokenKey, 'auth_refresh_token');
        expect(AppConstants.settingsBox, 'settings');
        expect(AppConstants.profilesBox, 'profiles');
        expect(AppConstants.progressBox, 'progress');
      });
    });
  });
}
