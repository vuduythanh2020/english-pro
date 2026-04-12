import 'package:dio/dio.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';

/// Repository handling consent API calls.
///
/// Uses the pre-configured [Dio] client (with auth interceptors)
/// to communicate with the NestJS backend.
class ConsentRepository {
  const ConsentRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  /// Grants parental consent for the child to use the app.
  ///
  /// Returns the consent record data on success.
  /// Throws [AppException] subtypes on failure.
  Future<Map<String, dynamic>> grantConsent({
    required int childAge,
    String consentVersion = '1.0',
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/api/v1/consent',
        data: {
          'childAge': childAge,
          'consentVersion': consentVersion,
        },
      );

      final data = response.data?['data'] as Map<String, dynamic>?;
      if (data == null) {
        throw const ServerException(message: 'Invalid response from server');
      }

      return data;
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  /// Gets the current consent status for the authenticated parent.
  ///
  /// Returns the consent record data, or `null` if not found.
  /// Throws [AppException] subtypes on failure.
  Future<Map<String, dynamic>?> getConsent() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/api/v1/consent',
      );

      return response.data?['data'] as Map<String, dynamic>?;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return null;
      }
      throw _mapDioError(e);
    }
  }

  /// Maps [DioException] to domain [AppException] subtypes.
  ///
  /// Pattern copied from [AuthRepository._mapDioError] (Story 2.1/2.2).
  AppException _mapDioError(DioException e) {
    // Network-level errors (no response)
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return const NetworkException();
    }

    final statusCode = e.response?.statusCode;
    final responseData = e.response?.data;

    String message;
    if (responseData is Map<String, dynamic>) {
      message =
          responseData['message'] as String? ?? e.message ?? 'Unknown error';
    } else {
      message = e.message ?? 'Unknown error';
    }

    return switch (statusCode) {
      400 => ValidationException(message: message, statusCode: statusCode),
      401 => UnauthorizedException(message: message),
      422 => ValidationException(message: message, statusCode: statusCode),
      429 => const ServerException(
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        statusCode: 429,
      ),
      503 => const ServerException(
        message: 'Dịch vụ tạm thời không khả dụng',
        statusCode: 503,
      ),
      _ => ServerException(message: message, statusCode: statusCode),
    };
  }
}
