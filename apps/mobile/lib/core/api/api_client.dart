import 'package:dio/dio.dart';
import 'package:english_pro/core/api/interceptors/auth_interceptor.dart';
import 'package:english_pro/core/api/interceptors/error_interceptor.dart';
import 'package:english_pro/core/api/interceptors/logging_interceptor.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/constants/app_constants.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';
import 'package:flutter/foundation.dart';

/// Factory that creates a fully configured [Dio] instance.
///
/// Interceptor order:
/// 1. [AuthInterceptor] — injects JWT, handles 401 refresh.
/// 2. [ErrorInterceptor] — retry + domain exception mapping.
/// 3. [LoggingInterceptor] — dev-only request/response logging.
Dio createDioClient({
  required String baseUrl,
  required SecureStorageService storageService,
  required AuthBloc authBloc,
}) {
  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: AppConstants.connectTimeout,
      receiveTimeout: AppConstants.receiveTimeout,
      sendTimeout: AppConstants.sendTimeout,
      headers: <String, dynamic>{'Content-Type': 'application/json'},
    ),
  );

  dio.interceptors.addAll([
    AuthInterceptor(
      storageService: storageService,
      dio: dio,
      authBloc: authBloc,
    ),
    ErrorInterceptor(dio: dio),
    if (kDebugMode) LoggingInterceptor(),
  ]);

  return dio;
}
