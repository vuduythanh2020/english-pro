import 'package:dio/dio.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/features/onboarding/repositories/children_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late ChildrenRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = ChildrenRepository(dio: mockDio);
  });

  group('ChildrenRepository', () {
    // ── createChildProfile ──────────────────────────────────────────────────

    group('createChildProfile', () {
      test('returns ChildProfile on success (201)', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/children',
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: {
              'data': {
                'id': 'child-uuid',
                'parentId': 'parent-uuid',
                'displayName': 'Bé Minh',
                'avatarId': 2,
                'level': 'beginner',
                'xpTotal': 0,
                'createdAt': '2026-04-12T00:00:00.000Z',
              },
              'meta': {'timestamp': '2026-04-12T00:00:00.000Z'},
            },
            statusCode: 201,
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        final result = await repository.createChildProfile(
          displayName: 'Bé Minh',
          avatarId: 2,
        );

        expect(result.id, 'child-uuid');
        expect(result.displayName, 'Bé Minh');
        expect(result.avatarId, 2);
        expect(result.level, 'beginner');
        expect(result.xpTotal, 0);
      });

      test('uses avatarId=1 by default', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/children',
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: {
              'data': {
                'id': 'child-uuid-2',
                'parentId': 'parent-uuid',
                'displayName': 'Bé Nam',
                'avatarId': 1,
                'level': 'beginner',
                'xpTotal': 0,
                'createdAt': '2026-04-12T00:00:00.000Z',
              },
              'meta': {},
            },
            statusCode: 201,
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        final result = await repository.createChildProfile(
          displayName: 'Bé Nam',
          // no avatarId — defaults to 1
        );

        expect(result.avatarId, 1);
      });

      test('throws UnauthorizedException on 401', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/children',
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 401,
              data: {'message': 'Unauthorized'},
              requestOptions: RequestOptions(path: '/api/v1/children'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        expect(
          () => repository.createChildProfile(displayName: 'Minh'),
          throwsA(isA<UnauthorizedException>()),
        );
      });

      test('throws ProfileLimitReachedException on 422', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/children',
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 422,
              data: {'message': 'PROFILE_LIMIT_REACHED'},
              requestOptions: RequestOptions(path: '/api/v1/children'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        expect(
          () => repository.createChildProfile(displayName: 'Minh'),
          throwsA(isA<ProfileLimitReachedException>()),
        );
      });

      test('throws ValidationException on 400', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/children',
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 400,
              data: {'message': 'displayName must not be empty'},
              requestOptions: RequestOptions(path: '/api/v1/children'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        expect(
          () => repository.createChildProfile(displayName: ''),
          throwsA(isA<ValidationException>()),
        );
      });

      test('throws NetworkException on connection error', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/children',
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            type: DioExceptionType.connectionError,
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        expect(
          () => repository.createChildProfile(displayName: 'Minh'),
          throwsA(isA<NetworkException>()),
        );
      });

      test('throws ServerException with rate-limit message on 429', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/children',
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 429,
              data: {'message': 'Too many requests'},
              requestOptions: RequestOptions(path: '/api/v1/children'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        expect(
          () => repository.createChildProfile(displayName: 'Minh'),
          throwsA(
            isA<ServerException>().having(
              (e) => e.message,
              'message',
              contains('Quá nhiều yêu cầu'),
            ),
          ),
        );
      });

      test('throws ServerException when response data is null', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/children',
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: <String, dynamic>{},
            statusCode: 201,
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        expect(
          () => repository.createChildProfile(displayName: 'Minh'),
          throwsA(isA<ServerException>()),
        );
      });

      test('throws ServerException when response data["data"] is wrong type (e.g. int)', () async {
        // Regression test for MEDIUM-3: unsafe 'as' cast replaced with 'is' check.
        // A non-map value previously caused a TypeError escaping the DioException handler.
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/children',
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: <String, dynamic>{'data': 42}, // wrong type: int instead of Map
            statusCode: 201,
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        expect(
          () => repository.createChildProfile(displayName: 'Minh'),
          throwsA(isA<ServerException>()),
        );
      });
    });

    // ── getChildProfiles ────────────────────────────────────────────────────

    group('getChildProfiles', () {
      test('returns list of ChildProfile on success (200)', () async {
        when(
          () => mockDio.get<Map<String, dynamic>>(
            '/api/v1/children',
          ),
        ).thenAnswer(
          (_) async => Response(
            data: {
              'data': [
                {
                  'id': 'child-1',
                  'parentId': 'parent-uuid',
                  'displayName': 'Bé Minh',
                  'avatarId': 1,
                  'level': 'beginner',
                  'xpTotal': 0,
                  'createdAt': '2026-04-12T00:00:00.000Z',
                },
                {
                  'id': 'child-2',
                  'parentId': 'parent-uuid',
                  'displayName': 'Bé Lan',
                  'avatarId': 3,
                  'level': 'beginner',
                  'xpTotal': 100,
                  'createdAt': '2026-04-12T01:00:00.000Z',
                },
              ],
              'meta': {},
            },
            statusCode: 200,
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        final result = await repository.getChildProfiles();

        expect(result, hasLength(2));
        expect(result[0].displayName, 'Bé Minh');
        expect(result[1].displayName, 'Bé Lan');
        expect(result[1].xpTotal, 100);
      });

      test('returns empty list when no profiles exist', () async {
        when(
          () => mockDio.get<Map<String, dynamic>>(
            '/api/v1/children',
          ),
        ).thenAnswer(
          (_) async => Response(
            data: {
              'data': <dynamic>[],
              'meta': {},
            },
            statusCode: 200,
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        final result = await repository.getChildProfiles();
        expect(result, isEmpty);
      });

      test('returns empty list when data is null', () async {
        when(
          () => mockDio.get<Map<String, dynamic>>(
            '/api/v1/children',
          ),
        ).thenAnswer(
          (_) async => Response(
            data: <String, dynamic>{},
            statusCode: 200,
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        final result = await repository.getChildProfiles();
        expect(result, isEmpty);
      });

      test('throws UnauthorizedException on 401', () async {
        when(
          () => mockDio.get<Map<String, dynamic>>(
            '/api/v1/children',
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 401,
              data: {'message': 'Unauthorized'},
              requestOptions: RequestOptions(path: '/api/v1/children'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        expect(
          () => repository.getChildProfiles(),
          throwsA(isA<UnauthorizedException>()),
        );
      });

      test('throws ServerException on 503', () async {
        when(
          () => mockDio.get<Map<String, dynamic>>(
            '/api/v1/children',
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 503,
              data: {'message': 'Service unavailable'},
              requestOptions: RequestOptions(path: '/api/v1/children'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        expect(
          () => repository.getChildProfiles(),
          throwsA(isA<ServerException>()),
        );
      });

      test('throws ServerException with rate-limit message on 429', () async {
        when(
          () => mockDio.get<Map<String, dynamic>>(
            '/api/v1/children',
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 429,
              data: {'message': 'Too many requests'},
              requestOptions: RequestOptions(path: '/api/v1/children'),
            ),
            requestOptions: RequestOptions(path: '/api/v1/children'),
          ),
        );

        expect(
          () => repository.getChildProfiles(),
          throwsA(
            isA<ServerException>().having(
              (e) => e.message,
              'message',
              contains('Quá nhiều yêu cầu'),
            ),
          ),
        );
      });
    });
  });
}
