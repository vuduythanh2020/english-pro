import 'dart:developer' as dev;

import 'package:dio/dio.dart';

/// Logs outgoing HTTP requests and incoming responses / errors.
///
/// This interceptor should **only** be added in development builds.
class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    dev.log(
      '→ ${options.method} ${options.uri}',
      name: 'HTTP',
    );
    handler.next(options);
  }

  @override
  void onResponse(
    Response<dynamic> response,
    ResponseInterceptorHandler handler,
  ) {
    dev.log(
      '← ${response.statusCode} ${response.requestOptions.uri}',
      name: 'HTTP',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    dev.log(
      '✖ ${err.type.name} ${err.requestOptions.uri} '
      '(${err.response?.statusCode ?? 'N/A'})',
      name: 'HTTP',
      error: err.error,
    );
    handler.next(err);
  }
}
