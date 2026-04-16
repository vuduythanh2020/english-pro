import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/features/settings/models/child_data_model.dart';

/// Repository handling privacy & data management API calls (Story 2.7).
///
/// Uses the pre-configured [Dio] client (with auth interceptors)
/// to communicate with the NestJS backend.
class PrivacyDataRepository {
  const PrivacyDataRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  /// Retrieves all stored data for a child profile.
  ///
  /// Returns [ChildDataModel] on success.
  /// Throws [AppException] subtypes on failure.
  Future<ChildDataModel> getChildData(String childId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/users/children/$childId/data',
      );

      final raw = response.data?['data'];
      if (raw is! Map<String, dynamic>) {
        throw const ServerException(message: 'Invalid response from server');
      }

      return ChildDataModel.fromJson(raw);
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  /// Exports all child data as a downloadable JSON file (bytes).
  ///
  /// Returns the raw bytes of the JSON file.
  /// Throws [AppException] subtypes on failure.
  Future<Uint8List> exportChildData(String childId) async {
    try {
      final response = await _dio.get<List<int>>(
        '/users/children/$childId/export',
        options: Options(responseType: ResponseType.bytes),
      );

      return Uint8List.fromList(response.data ?? []);
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  /// Permanently deletes a child account and all associated data.
  ///
  /// Throws [AppException] subtypes on failure.
  Future<void> deleteChildAccount(String childId) async {
    try {
      await _dio.delete<Map<String, dynamic>>(
        '/users/children/$childId',
      );
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
      400 => ValidationException(message: message, statusCode: statusCode),
      401 => UnauthorizedException(message: message),
      403 => const ForbiddenException(
        message: 'Không có quyền truy cập',
      ),
      404 => const NotFoundException(
        message: 'Không tìm thấy dữ liệu',
      ),
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
