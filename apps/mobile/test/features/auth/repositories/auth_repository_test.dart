import 'package:dio/dio.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/features/auth/repositories/auth_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;
  late AuthRepository repository;

  setUp(() {
    mockDio = MockDio();
    repository = AuthRepository(dio: mockDio);
  });

  group('AuthRepository.register', () {
    test('returns data on successful registration', () async {
      when(
        () => mockDio.post<Map<String, dynamic>>(
          any(),
          data: any(named: 'data'),
        ),
      ).thenAnswer(
        (_) async => Response(
          data: {
            'data': {
              'accessToken': 'access-123',
              'refreshToken': 'refresh-456',
              'user': {
                'id': 'user-id',
                'email': 'test@example.com',
                'role': 'PARENT',
              },
            },
            'meta': {
              'timestamp': '2026-04-10T00:00:00Z',
              'requestId': 'req-1',
            },
          },
          statusCode: 201,
          requestOptions: RequestOptions(path: '/api/v1/auth/register'),
        ),
      );

      final result = await repository.register(
        email: 'test@example.com',
        password: 'Password1',
      );

      expect(result['accessToken'], 'access-123');
      expect(result['refreshToken'], 'refresh-456');
      expect(
        (result['user'] as Map<String, dynamic>)['email'],
        'test@example.com',
      );
    });

    test('throws ValidationException on 422', () async {
      when(
        () => mockDio.post<Map<String, dynamic>>(
          any(),
          data: any(named: 'data'),
        ),
      ).thenThrow(
        DioException(
          response: Response(
            data: {
              'statusCode': 422,
              'message': 'Email đã được đăng ký',
            },
            statusCode: 422,
            requestOptions: RequestOptions(
              path: '/api/v1/auth/register',
            ),
          ),
          requestOptions: RequestOptions(
            path: '/api/v1/auth/register',
          ),
        ),
      );

      expect(
        () => repository.register(
          email: 'existing@example.com',
          password: 'Password1',
        ),
        throwsA(isA<ValidationException>()),
      );
    });

    test('throws ServerException on 429', () async {
      when(
        () => mockDio.post<Map<String, dynamic>>(
          any(),
          data: any(named: 'data'),
        ),
      ).thenThrow(
        DioException(
          response: Response(
            data: {'message': 'Rate limit exceeded'},
            statusCode: 429,
            requestOptions: RequestOptions(
              path: '/api/v1/auth/register',
            ),
          ),
          requestOptions: RequestOptions(
            path: '/api/v1/auth/register',
          ),
        ),
      );

      expect(
        () => repository.register(
          email: 'test@example.com',
          password: 'Password1',
        ),
        throwsA(isA<ServerException>()),
      );
    });

    test('throws ServerException on 503', () async {
      when(
        () => mockDio.post<Map<String, dynamic>>(
          any(),
          data: any(named: 'data'),
        ),
      ).thenThrow(
        DioException(
          response: Response(
            data: {'message': 'Service unavailable'},
            statusCode: 503,
            requestOptions: RequestOptions(
              path: '/api/v1/auth/register',
            ),
          ),
          requestOptions: RequestOptions(
            path: '/api/v1/auth/register',
          ),
        ),
      );

      expect(
        () => repository.register(
          email: 'test@example.com',
          password: 'Password1',
        ),
        throwsA(isA<ServerException>()),
      );
    });

    test('sends displayName when provided', () async {
      when(
        () => mockDio.post<Map<String, dynamic>>(
          any(),
          data: any(named: 'data'),
        ),
      ).thenAnswer(
        (_) async => Response(
          data: {
            'data': {
              'accessToken': 'a',
              'refreshToken': 'r',
              'user': {
                'id': 'id',
                'email': 'e',
                'role': 'PARENT',
              },
            },
          },
          statusCode: 201,
          requestOptions: RequestOptions(
            path: '/api/v1/auth/register',
          ),
        ),
      );

      await repository.register(
        email: 'test@example.com',
        password: 'Password1',
        displayName: 'Parent Name',
      );

      final captured = verify(
        () => mockDio.post<Map<String, dynamic>>(
          any(),
          data: captureAny(named: 'data'),
        ),
      ).captured;

      final sentData = captured.first as Map<String, dynamic>;
      expect(sentData['displayName'], 'Parent Name');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TDD Red Phase – Story 2.2: AuthRepository.login()
  // SKIPPED until login() method is implemented on AuthRepository.
  // ─────────────────────────────────────────────────────────────────────────
  group(
    'AuthRepository.login',
    () {
      test('returns data on successful login (AC1)', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            any(),
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: {
              'data': {
                'accessToken': 'access-123',
                'refreshToken': 'refresh-456',
                'user': {
                  'id': 'user-id',
                  'email': 'parent@example.com',
                  'role': 'PARENT',
                },
              },
              'meta': {
                'timestamp': '2026-04-11T00:00:00Z',
                'requestId': 'req-1',
              },
            },
            statusCode: 200,
            requestOptions: RequestOptions(path: '/api/v1/auth/login'),
          ),
        );

        final result = await repository.login(
          email: 'parent@example.com',
          password: 'anypassword',
        );

        expect(result['accessToken'], 'access-123');
        expect(result['refreshToken'], 'refresh-456');
        expect(
          (result['user'] as Map<String, dynamic>)['email'],
          'parent@example.com',
        );
      });

      test(
        'calls POST /api/v1/auth/login with correct body',
        () async {
          when(
            () => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
            ),
          ).thenAnswer(
            (_) async => Response(
              data: {
                'data': {
                  'accessToken': 'a',
                  'refreshToken': 'r',
                  'user': {'id': 'id', 'email': 'e', 'role': 'PARENT'},
                },
              },
              statusCode: 200,
              requestOptions: RequestOptions(path: '/api/v1/auth/login'),
            ),
          );

          await repository.login(
            email: 'parent@example.com',
            password: 'mypassword',
          );

          final captured = verify(
            () => mockDio.post<Map<String, dynamic>>(
              captureAny(),
              data: captureAny(named: 'data'),
            ),
          ).captured;

          expect(captured[0], '/api/v1/auth/login');
          final sentData = captured[1] as Map<String, dynamic>;
          expect(sentData['email'], 'parent@example.com');
          expect(sentData['password'], 'mypassword');
        },
      );

      test(
        'throws UnauthorizedException on 401 with unified error message (AC4)',
        () async {
          when(
            () => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
            ),
          ).thenThrow(
            DioException(
              response: Response(
                data: {
                  'statusCode': 401,
                  'message': 'Email hoặc mật khẩu không đúng',
                },
                statusCode: 401,
                requestOptions: RequestOptions(path: '/api/v1/auth/login'),
              ),
              requestOptions: RequestOptions(path: '/api/v1/auth/login'),
            ),
          );

          expect(
            () => repository.login(
              email: 'wrong@example.com',
              password: 'WrongPass',
            ),
            throwsA(isA<UnauthorizedException>()),
          );
        },
      );

      test('throws ServerException on 429 (AC5 – rate limit)', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            any(),
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            response: Response(
              data: {'message': 'Rate limit exceeded'},
              statusCode: 429,
              requestOptions: RequestOptions(path: '/api/v1/auth/login'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/auth/login'),
          ),
        );

        expect(
          () => repository.login(
            email: 'parent@example.com',
            password: 'anypassword',
          ),
          throwsA(
            isA<ServerException>().having(
              (e) => e.statusCode,
              'statusCode',
              429,
            ),
          ),
        );
      });

      test('throws ServerException on 503', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            any(),
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            response: Response(
              data: {'message': 'Service unavailable'},
              statusCode: 503,
              requestOptions: RequestOptions(path: '/api/v1/auth/login'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/auth/login'),
          ),
        );

        expect(
          () => repository.login(
            email: 'parent@example.com',
            password: 'anypassword',
          ),
          throwsA(isA<ServerException>()),
        );
      });

      test('throws NetworkException on connection error', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            any(),
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            type: DioExceptionType.connectionError,
            requestOptions: RequestOptions(path: '/api/v1/auth/login'),
          ),
        );

        expect(
          () => repository.login(
            email: 'parent@example.com',
            password: 'anypassword',
          ),
          throwsA(isA<NetworkException>()),
        );
      });

      test('throws ServerException when response data is null', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            any(),
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: null,
            statusCode: 200,
            requestOptions: RequestOptions(path: '/api/v1/auth/login'),
          ),
        );

        expect(
          () => repository.login(
            email: 'parent@example.com',
            password: 'anypassword',
          ),
          throwsA(isA<ServerException>()),
        );
      });
    },
  );
}
