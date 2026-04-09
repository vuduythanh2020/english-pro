import 'package:dio/dio.dart';
import 'package:english_pro/core/api/api_client.dart';
import 'package:english_pro/core/api/interceptors/auth_interceptor.dart';
import 'package:english_pro/core/api/interceptors/error_interceptor.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/constants/app_constants.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockSecureStorageService extends Mock implements SecureStorageService {}

class MockAuthBloc extends Mock implements AuthBloc {}

void main() {
  group('createDioClient', () {
    late MockSecureStorageService mockStorage;
    late MockAuthBloc mockAuthBloc;

    setUp(() {
      mockStorage = MockSecureStorageService();
      mockAuthBloc = MockAuthBloc();
    });

    test('creates Dio instance with correct baseUrl', () {
      final dio = createDioClient(
        baseUrl: 'https://api.example.com',
        storageService: mockStorage,
        authBloc: mockAuthBloc,
      );

      expect(dio, isA<Dio>());
      expect(dio.options.baseUrl, equals('https://api.example.com'));
    });

    test('configures correct timeout values', () {
      final dio = createDioClient(
        baseUrl: 'https://api.example.com',
        storageService: mockStorage,
        authBloc: mockAuthBloc,
      );

      expect(dio.options.connectTimeout, equals(AppConstants.connectTimeout));
      expect(dio.options.receiveTimeout, equals(AppConstants.receiveTimeout));
      expect(dio.options.sendTimeout, equals(AppConstants.sendTimeout));
    });

    test('sets Content-Type header to application/json', () {
      final dio = createDioClient(
        baseUrl: 'https://api.example.com',
        storageService: mockStorage,
        authBloc: mockAuthBloc,
      );

      expect(
        dio.options.headers['Content-Type'],
        equals('application/json'),
      );
    });

    test('registers AuthInterceptor in interceptor chain', () {
      final dio = createDioClient(
        baseUrl: 'https://api.example.com',
        storageService: mockStorage,
        authBloc: mockAuthBloc,
      );

      final authInterceptors =
          dio.interceptors.whereType<AuthInterceptor>().toList();
      expect(authInterceptors, hasLength(1));
    });

    test('registers ErrorInterceptor in interceptor chain', () {
      final dio = createDioClient(
        baseUrl: 'https://api.example.com',
        storageService: mockStorage,
        authBloc: mockAuthBloc,
      );

      final errorInterceptors =
          dio.interceptors.whereType<ErrorInterceptor>().toList();
      expect(errorInterceptors, hasLength(1));
    });

    test('interceptor order is Auth → Error → (optional Logging)', () {
      final dio = createDioClient(
        baseUrl: 'https://api.example.com',
        storageService: mockStorage,
        authBloc: mockAuthBloc,
      );

      // Find indices of our custom interceptors
      final authIndex =
          dio.interceptors.indexWhere((i) => i is AuthInterceptor);
      final errorIndex =
          dio.interceptors.indexWhere((i) => i is ErrorInterceptor);

      expect(authIndex, greaterThanOrEqualTo(0), reason: 'AuthInterceptor must be present');
      expect(errorIndex, greaterThanOrEqualTo(0), reason: 'ErrorInterceptor must be present');
      expect(authIndex, lessThan(errorIndex),
          reason: 'AuthInterceptor must come before ErrorInterceptor');
    });
  });
}
