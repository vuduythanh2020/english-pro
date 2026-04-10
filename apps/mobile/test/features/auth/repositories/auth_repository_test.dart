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
}
