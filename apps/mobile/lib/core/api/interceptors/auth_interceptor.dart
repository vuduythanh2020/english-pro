import 'package:dio/dio.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';

/// Injects the JWT access token into every outgoing request and
/// handles automatic token refresh on 401 responses.
class AuthInterceptor extends QueuedInterceptor {
  AuthInterceptor({
    required SecureStorageService storageService,
    required Dio dio,
    required AuthBloc authBloc,
  }) : _storageService = storageService,
       _dio = dio,
       _authBloc = authBloc;

  final SecureStorageService _storageService;
  final Dio _dio;
  final AuthBloc _authBloc;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storageService.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      // Guard: only attempt refresh once per request to prevent
      // infinite refresh → 401 → refresh loops.
      final alreadyAttempted =
          err.requestOptions.extra['_refreshAttempted'] as bool? ?? false;

      if (!alreadyAttempted) {
        err.requestOptions.extra['_refreshAttempted'] = true;

        final refreshed = await _tryRefreshToken();
        if (refreshed) {
          // Retry the original request with the new token.
          final token = await _storageService.getAccessToken();
          final options = err.requestOptions
            ..headers['Authorization'] = 'Bearer $token';
          try {
            final response = await _dio.fetch<dynamic>(options);
            return handler.resolve(response);
          } on DioException catch (e) {
            return handler.next(e);
          }
        } else {
          // Refresh failed → force logout.
          _authBloc.add(const AuthLoggedOut());
        }
      } else {
        // Already attempted refresh for this request → force logout.
        _authBloc.add(const AuthLoggedOut());
      }
    }
    handler.next(err);
  }

  /// Attempts to exchange the stored refresh token for a new
  /// access token. Returns `true` on success.
  Future<bool> _tryRefreshToken() async {
    final refreshToken = await _storageService.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;

    try {
      // Use a separate Dio instance to avoid interceptor recursion.
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: _dio.options.baseUrl,
          headers: {'Content-Type': 'application/json'},
        ),
      );

      final response = await refreshDio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      final data = response.data?['data'] as Map<String, dynamic>?;
      final newAccess = data?['accessToken'] as String?;
      final newRefresh = data?['refreshToken'] as String?;

      if (newAccess != null) {
        await _storageService.saveAccessToken(newAccess);
        if (newRefresh != null) {
          await _storageService.saveRefreshToken(newRefresh);
        }
        _authBloc.add(
          AuthTokenRefreshed(
            accessToken: newAccess,
            refreshToken: newRefresh,
          ),
        );
        return true;
      }
    }
    // The refresh call itself failed — treat as auth failure.
    // ignore: avoid_catches_without_on_clauses
    catch (_) {}
    return false;
  }
}
