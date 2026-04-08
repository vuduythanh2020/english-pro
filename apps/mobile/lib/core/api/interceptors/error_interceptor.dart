import 'dart:math';

import 'package:dio/dio.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/core/constants/app_constants.dart';

/// Translates [DioException]s into domain [AppException]s and applies
/// automatic retry with exponential backoff for transient network
/// errors.
class ErrorInterceptor extends Interceptor {
  ErrorInterceptor({Dio? dio}) : _dio = dio;

  final Dio? _dio;

  /// Transient error types that are eligible for retry.
  static const Set<DioExceptionType> _retryableTypes = {
    DioExceptionType.connectionTimeout,
    DioExceptionType.connectionError,
    DioExceptionType.sendTimeout,
  };

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // ── Retry logic ──────────────────────────────────────────────────
    if (_shouldRetry(err)) {
      final retryCount = (err.requestOptions.extra['_retryCount'] as int?) ?? 0;

      if (retryCount < AppConstants.maxRetryCount) {
        final delay =
            AppConstants.initialRetryDelay * pow(2, retryCount).toInt();
        await Future<void>.delayed(delay);

        err.requestOptions.extra['_retryCount'] = retryCount + 1;

        try {
          final dio = _dio;
          if (dio != null) {
            final response = await dio.fetch<dynamic>(err.requestOptions);
            return handler.resolve(response);
          }
        } on DioException catch (e) {
          return handler.next(e);
        }
      }
    }

    // ── Map to domain exception ──────────────────────────────────────
    handler.next(
      err.copyWith(error: _mapToAppException(err)),
    );
  }

  bool _shouldRetry(DioException err) {
    // Never retry client errors (4xx).
    final statusCode = err.response?.statusCode;
    if (statusCode != null && statusCode >= 400 && statusCode < 500) {
      return false;
    }
    return _retryableTypes.contains(err.type);
  }

  AppException _mapToAppException(DioException err) {
    // Connection-level errors.
    if (err.type == DioExceptionType.connectionError ||
        err.type == DioExceptionType.connectionTimeout) {
      return const NetworkException();
    }

    final statusCode = err.response?.statusCode;
    final data = err.response?.data;
    final message = data is Map<String, dynamic>
        ? (data['message'] as String?) ?? err.message ?? ''
        : err.message ?? '';

    return switch (statusCode) {
      401 => UnauthorizedException(message: message),
      403 => ForbiddenException(message: message),
      404 => NotFoundException(message: message),
      422 => ValidationException(
        message: message,
        details: data is Map<String, dynamic>
            ? data['details'] as Map<String, dynamic>?
            : null,
      ),
      (final code?) when code >= 500 && code < 600 => ServerException(
        message: message,
        statusCode: statusCode,
      ),
      _ => UnknownException(message: message),
    };
  }
}
