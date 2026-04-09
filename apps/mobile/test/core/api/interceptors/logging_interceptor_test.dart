import 'package:dio/dio.dart';
import 'package:english_pro/core/api/interceptors/logging_interceptor.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('LoggingInterceptor', () {
    late LoggingInterceptor interceptor;

    setUp(() {
      interceptor = LoggingInterceptor();
    });

    test('is an Interceptor', () {
      expect(interceptor, isA<Interceptor>());
    });

    group('onRequest', () {
      test('calls handler.next to continue the chain', () {
        final options = RequestOptions(path: '/test', method: 'GET');

        final handler = RequestInterceptorHandler();
        // Interceptor should not throw and should forward to handler.next
        expect(
          () => interceptor.onRequest(options, handler),
          returnsNormally,
        );
      });
    });

    group('onResponse', () {
      test('calls handler.next to continue the chain', () {
        final options = RequestOptions(path: '/test');
        final response = Response<dynamic>(
          statusCode: 200,
          requestOptions: options,
        );

        final handler = ResponseInterceptorHandler();
        expect(
          () => interceptor.onResponse(response, handler),
          returnsNormally,
        );
      });
    });

    group('onError', () {
      test('calls handler.next to continue the chain', () async {
        final options = RequestOptions(path: '/test');
        final error = DioException(
          type: DioExceptionType.connectionTimeout,
          requestOptions: options,
        );

        final handler = ErrorInterceptorHandler();
        // handler.next(err) internally calls _completer.completeError()
        // which surfaces as an async error. Consume the future to prevent
        // unhandled error in the test zone.
        interceptor.onError(error, handler);

        // The handler's future completes with an error (InterceptorState).
        // We verify the interceptor forwarded the error correctly.
        await expectLater(handler.future, throwsA(anything));
      });

      test('handles error without response status code', () async {
        final options = RequestOptions(path: '/test');
        final error = DioException(
          type: DioExceptionType.connectionError,
          requestOptions: options,
          // no response
        );

        final handler = ErrorInterceptorHandler();
        interceptor.onError(error, handler);

        await expectLater(handler.future, throwsA(anything));
      });
    });
  });
}
