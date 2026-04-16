import 'package:dio/dio.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/features/onboarding/models/child_profile.dart';

/// Repository handling child profile API calls.
///
/// Uses the pre-configured [Dio] client (with auth interceptors)
/// to communicate with the NestJS backend.
class ChildrenRepository {
  const ChildrenRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  /// Creates a new child profile for the authenticated parent.
  ///
  /// Returns the created [ChildProfile] on success.
  /// Throws [AppException] subtypes on failure.
  Future<ChildProfile> createChildProfile({
    required String displayName,
    int avatarId = 1,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/children',
        data: {
          'displayName': displayName,
          'avatarId': avatarId,
        },
      );

      // Use 'is' pattern match instead of 'as' cast to avoid TypeError on
      // unexpected server response shapes (e.g. data is a List or int).
      final raw = response.data?['data'];
      if (raw is! Map<String, dynamic>) {
        throw const ServerException(message: 'Invalid response from server');
      }

      return ChildProfile.fromJson(raw);
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  /// Returns all child profiles for the authenticated parent.
  ///
  /// Returns empty list if no profiles exist.
  /// Throws [AppException] subtypes on failure.
  Future<List<ChildProfile>> getChildProfiles() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/children',
      );

      // Use 'is' pattern match to safely handle unexpected response shapes.
      final raw = response.data?['data'];
      if (raw is! List) {
        return [];
      }

      return raw
          .whereType<Map<String, dynamic>>()
          .map(ChildProfile.fromJson)
          .toList();
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  /// Maps [DioException] to domain [AppException] subtypes.
  ///
  /// Pattern copied from [ConsentRepository._mapDioError] (Story 2.3).
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
      422 => ProfileLimitReachedException(message: message),
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
