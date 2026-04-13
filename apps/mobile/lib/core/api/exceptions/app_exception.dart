/// Domain exception types for the application.
///
/// These exceptions are translated from Dio HTTP errors
/// by the `ErrorInterceptor` and consumed by repositories/blocs.
sealed class AppException implements Exception {
  const AppException({required this.message, this.statusCode});

  /// Human-readable error message.
  final String message;

  /// HTTP status code (if applicable).
  final int? statusCode;

  @override
  String toString() =>
      '${describeIdentity(this)}'
      '(message: $message, statusCode: $statusCode)';

  /// Returns the runtime identity without relying on `runtimeType.toString`.
  String describeIdentity(AppException e) {
    return switch (e) {
      NetworkException() => 'NetworkException',
      ServerException() => 'ServerException',
      UnauthorizedException() => 'UnauthorizedException',
      ForbiddenException() => 'ForbiddenException',
      NotFoundException() => 'NotFoundException',
      ValidationException() => 'ValidationException',
      TimeoutException() => 'TimeoutException',
      UnknownException() => 'UnknownException',
      ProfileLimitReachedException() => 'ProfileLimitReachedException',
      ChildProfileNotFoundException() => 'ChildProfileNotFoundException',
    };
  }
}

/// No internet connection.
class NetworkException extends AppException {
  const NetworkException({super.message = 'No internet connection'});
}

/// Server error (5xx).
class ServerException extends AppException {
  const ServerException({
    super.message = 'Internal server error',
    super.statusCode,
  });
}

/// Unauthorized (401).
class UnauthorizedException extends AppException {
  const UnauthorizedException({
    super.message = 'Unauthorized',
    super.statusCode = 401,
  });
}

/// Forbidden (403).
class ForbiddenException extends AppException {
  const ForbiddenException({
    super.message = 'Forbidden',
    super.statusCode = 403,
  });
}

/// Not found (404).
class NotFoundException extends AppException {
  const NotFoundException({
    super.message = 'Resource not found',
    super.statusCode = 404,
  });
}

/// Validation error (422) with optional details.
class ValidationException extends AppException {
  const ValidationException({
    super.message = 'Validation failed',
    super.statusCode = 422,
    this.details,
  });

  /// Field-level validation errors from the server.
  final Map<String, dynamic>? details;

  @override
  String toString() =>
      'ValidationException(message: $message, '
      'statusCode: $statusCode, details: $details)';
}

/// Request timeout.
class TimeoutException extends AppException {
  const TimeoutException({super.message = 'Request timed out'});
}

/// Unknown / unclassified error.
class UnknownException extends AppException {
  const UnknownException({
    super.message = 'An unexpected error occurred',
  });
}

/// Profile limit reached (422 PROFILE_LIMIT_REACHED).
///
/// Thrown when a parent tries to create more than 3 child profiles (Story 2.4).
class ProfileLimitReachedException extends AppException {
  const ProfileLimitReachedException({
    super.message = 'Bạn chỉ có thể tạo tối đa 3 hồ sơ trẻ em',
    super.statusCode = 422,
  });
}

/// Child profile not found (404 CHILD_PROFILE_NOT_FOUND).
///
/// Thrown when switching to a child profile that doesn't exist or
/// doesn't belong to the parent (Story 2.5).
class ChildProfileNotFoundException extends AppException {
  const ChildProfileNotFoundException({
    super.message = 'Không tìm thấy hồ sơ trẻ em',
    super.statusCode = 404,
  });
}
