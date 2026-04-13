import 'package:dio/dio.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';

/// Result of a successful `switch-to-child` API call.
class ChildSwitchResult {
  const ChildSwitchResult({
    required this.accessToken,
    required this.childId,
  });

  /// The child-specific JWT access token.
  final String accessToken;

  /// The child profile ID that was switched to.
  final String childId;
}

/// Result of a successful `switch-to-parent` API call.
class ParentSwitchResult {
  const ParentSwitchResult({required this.accessToken});

  /// The parent's re-issued JWT access token.
  final String accessToken;
}

/// Repository for child/parent session switching API calls.
///
/// Uses the pre-configured [Dio] client (with auth interceptors)
/// to communicate with the NestJS backend.
class ChildSwitchRepository {
  const ChildSwitchRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  /// Switches to a child session by requesting a child-specific JWT.
  ///
  /// Calls `POST /api/v1/auth/switch-to-child` with the given [childId].
  /// Returns [ChildSwitchResult] with the child JWT on success.
  /// Throws [AppException] subtypes on failure.
  Future<ChildSwitchResult> switchToChild(String childId) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/api/v1/auth/switch-to-child',
        data: {'childId': childId},
      );

      final data = response.data?['data'];
      if (data is! Map<String, dynamic>) {
        throw const ServerException(message: 'Invalid response from server');
      }

      final accessToken = data['accessToken'] as String?;
      final returnedChildId = data['childId'] as String? ?? childId;

      if (accessToken == null || accessToken.isEmpty) {
        throw const ServerException(
          message: 'Missing access token in response',
        );
      }

      return ChildSwitchResult(
        accessToken: accessToken,
        childId: returnedChildId,
      );
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  /// Switches back to the parent session by requesting a new parent JWT.
  ///
  /// Calls `POST /api/v1/auth/switch-to-parent` (no body required).
  /// Returns [ParentSwitchResult] with the parent JWT on success.
  /// Throws [AppException] subtypes on failure.
  Future<ParentSwitchResult> switchToParent() async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/api/v1/auth/switch-to-parent',
      );

      final data = response.data?['data'];
      if (data is! Map<String, dynamic>) {
        throw const ServerException(message: 'Invalid response from server');
      }

      final accessToken = data['accessToken'] as String?;

      if (accessToken == null || accessToken.isEmpty) {
        throw const ServerException(
          message: 'Missing access token in response',
        );
      }

      return ParentSwitchResult(accessToken: accessToken);
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  /// Maps [DioException] to domain [AppException] subtypes.
  ///
  /// Pattern copied from [ChildrenRepository._mapDioError] (Story 2.4).
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
      401 => UnauthorizedException(message: message),
      403 => ForbiddenException(message: message),
      404 => ChildProfileNotFoundException(message: message),
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
