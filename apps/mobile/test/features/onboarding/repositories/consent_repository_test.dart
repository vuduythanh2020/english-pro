import 'package:dio/dio.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/features/onboarding/repositories/consent_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late ConsentRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = ConsentRepository(dio: mockDio);
  });

  group('ConsentRepository', () {
    group('grantConsent', () {
      test('returns consent data on success (201)', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/consent',
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: {
              'data': {
                'id': 'uuid-123',
                'status': 'GRANTED',
                'consentVersion': '1.0',
                'consentTimestamp': '2026-04-11T00:00:00.000Z',
              },
              'meta': {'timestamp': '2026-04-11T00:00:00.000Z'},
            },
            statusCode: 201,
            requestOptions: RequestOptions(path: '/api/v1/consent'),
          ),
        );

        final result = await repository.grantConsent(childAge: 12);

        expect(result['id'], 'uuid-123');
        expect(result['status'], 'GRANTED');
        expect(result['consentVersion'], '1.0');
      });

      test('throws UnauthorizedException on 401', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/consent',
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 401,
              data: {'message': 'Unauthorized'},
              requestOptions: RequestOptions(path: '/api/v1/consent'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/consent'),
          ),
        );

        expect(
          () => repository.grantConsent(childAge: 12),
          throwsA(isA<UnauthorizedException>()),
        );
      });

      test('throws ValidationException on 400', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/consent',
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 400,
              data: {
                'message': 'childAge must be between 1 and 18',
              },
              requestOptions: RequestOptions(path: '/api/v1/consent'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/consent'),
          ),
        );

        expect(
          () => repository.grantConsent(childAge: 0),
          throwsA(isA<ValidationException>()),
        );
      });

      test('throws NetworkException on connection error', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/consent',
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            type: DioExceptionType.connectionError,
            requestOptions: RequestOptions(path: '/api/v1/consent'),
          ),
        );

        expect(
          () => repository.grantConsent(childAge: 12),
          throwsA(isA<NetworkException>()),
        );
      });

      test('throws ServerException on null response data', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/consent',
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: <String, dynamic>{},
            statusCode: 201,
            requestOptions: RequestOptions(path: '/api/v1/consent'),
          ),
        );

        expect(
          () => repository.grantConsent(childAge: 12),
          throwsA(isA<ServerException>()),
        );
      });
    });

    group('getConsent', () {
      test('returns consent data on success (200)', () async {
        when(
          () => mockDio.get<Map<String, dynamic>>(
            '/api/v1/consent',
          ),
        ).thenAnswer(
          (_) async => Response(
            data: {
              'data': {
                'status': 'GRANTED',
                'consentVersion': '1.0',
                'consentTimestamp': '2026-04-11T00:00:00.000Z',
              },
              'meta': {},
            },
            statusCode: 200,
            requestOptions: RequestOptions(path: '/api/v1/consent'),
          ),
        );

        final result = await repository.getConsent();

        expect(result, isNotNull);
        expect(result!['status'], 'GRANTED');
      });

      test('returns null on 404', () async {
        when(
          () => mockDio.get<Map<String, dynamic>>(
            '/api/v1/consent',
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 404,
              data: {'message': 'Not found'},
              requestOptions: RequestOptions(path: '/api/v1/consent'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/consent'),
          ),
        );

        final result = await repository.getConsent();
        expect(result, isNull);
      });

      test('throws UnauthorizedException on 401', () async {
        when(
          () => mockDio.get<Map<String, dynamic>>(
            '/api/v1/consent',
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 401,
              data: {'message': 'Unauthorized'},
              requestOptions: RequestOptions(path: '/api/v1/consent'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/consent'),
          ),
        );

        expect(
          () => repository.getConsent(),
          throwsA(isA<UnauthorizedException>()),
        );
      });
    });
  });
}
