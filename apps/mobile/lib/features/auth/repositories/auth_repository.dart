import 'package:dio/dio.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';

/// Repository handling authentication API calls.
///
/// Uses the pre-configured [Dio] client (with auth interceptors)
/// to communicate with the NestJS backend.
class AuthRepository {
  const AuthRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  /// Registers a new parent account.
  ///
  /// Returns a map with `accessToken`, `refreshToken`, and `user` info.
  /// Throws [AppException] subtypes on failure.
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    String? displayName,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          if (displayName != null && displayName.isNotEmpty)
            'displayName': displayName,
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

  /// Logs in with email and password.
  ///
  /// Returns a map with `accessToken`, `refreshToken`, and `user` info.
  /// Throws [AppException] subtypes on failure.
  ///
  /// Error mapping:
  ///   - 401 → [UnauthorizedException] (invalid credentials — unified message, AC4)
  ///   - 429 → [ServerException] (rate limit, AC5)
  ///   - 503 → [ServerException] (service unavailable)
  ///   - connection error → [NetworkException]
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
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
      message = responseData['message'] as String? ?? e.message ?? 'Unknown error';
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
