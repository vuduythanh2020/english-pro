/// Unit Tests — Story 2.5: ChildSwitchRepository
///
/// Tests validate that ChildSwitchRepository correctly maps
/// API responses and Dio errors to domain types.
///
/// Test IDs: FLUTTER-SWITCH-REPO-001 through FLUTTER-SWITCH-REPO-014
library;

import 'package:dio/dio.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/features/onboarding/repositories/child_switch_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late ChildSwitchRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = ChildSwitchRepository(dio: mockDio);
  });

  group('ChildSwitchRepository', () {
    // ── switchToChild ──────────────────────────────────────────────────

    group('switchToChild', () {
      // FLUTTER-SWITCH-REPO-001
      test('FLUTTER-SWITCH-REPO-001: returns ChildSwitchResult on success (200)', () async {
        const childId = 'child-uuid-123';
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-child',
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: {
              'data': {
                'accessToken': 'child-jwt-token',
                'childId': childId,
                'expiresIn': 3600,
              },
              'meta': {'timestamp': '2026-04-12T00:00:00.000Z'},
            },
            statusCode: 200,
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-child'),
          ),
        );

        final result = await repository.switchToChild(childId);

        expect(result.accessToken, 'child-jwt-token');
        expect(result.childId, childId);
      });

      // FLUTTER-SWITCH-REPO-002
      test('FLUTTER-SWITCH-REPO-002: uses childId from request when response omits childId field', () async {
        const childId = 'child-uuid-fallback';
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-child',
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: {
              'data': {
                'accessToken': 'child-jwt-token',
                // childId omitted — should fall back to passed childId
              },
              'meta': {},
            },
            statusCode: 200,
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-child'),
          ),
        );

        final result = await repository.switchToChild(childId);

        expect(result.childId, childId);
      });

      // FLUTTER-SWITCH-REPO-003
      test('FLUTTER-SWITCH-REPO-003: throws ChildProfileNotFoundException on 404', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-child',
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 404,
              data: {'message': 'CHILD_PROFILE_NOT_FOUND'},
              requestOptions:
                  RequestOptions(path: '/api/v1/auth/switch-to-child'),
            ),
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-child'),
          ),
        );

        expect(
          () => repository.switchToChild('nonexistent-child'),
          throwsA(isA<ChildProfileNotFoundException>()),
        );
      });

      // FLUTTER-SWITCH-REPO-004
      test('FLUTTER-SWITCH-REPO-004: throws UnauthorizedException on 401', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-child',
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 401,
              data: {'message': 'Unauthorized'},
              requestOptions:
                  RequestOptions(path: '/api/v1/auth/switch-to-child'),
            ),
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-child'),
          ),
        );

        expect(
          () => repository.switchToChild('some-child'),
          throwsA(isA<UnauthorizedException>()),
        );
      });

      // FLUTTER-SWITCH-REPO-005
      test('FLUTTER-SWITCH-REPO-005: throws UnauthorizedException on 403 (not parent role)', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-child',
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 403,
              data: {'message': 'Forbidden resource'},
              requestOptions:
                  RequestOptions(path: '/api/v1/auth/switch-to-child'),
            ),
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-child'),
          ),
        );

        expect(
          () => repository.switchToChild('some-child'),
          throwsA(isA<UnauthorizedException>()),
        );
      });

      // FLUTTER-SWITCH-REPO-006
      test('FLUTTER-SWITCH-REPO-006: throws NetworkException on connection error', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-child',
            data: any(named: 'data'),
          ),
        ).thenThrow(
          DioException(
            type: DioExceptionType.connectionError,
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-child'),
          ),
        );

        expect(
          () => repository.switchToChild('some-child'),
          throwsA(isA<NetworkException>()),
        );
      });

      // FLUTTER-SWITCH-REPO-007
      test('FLUTTER-SWITCH-REPO-007: throws ServerException when response data is not a map', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-child',
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: <String, dynamic>{},  // missing 'data' key
            statusCode: 200,
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-child'),
          ),
        );

        expect(
          () => repository.switchToChild('some-child'),
          throwsA(isA<ServerException>()),
        );
      });

      // FLUTTER-SWITCH-REPO-008
      test('FLUTTER-SWITCH-REPO-008: throws ServerException when accessToken is empty', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-child',
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: {
              'data': {
                'accessToken': '',  // empty token
                'childId': 'child-uuid',
              },
            },
            statusCode: 200,
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-child'),
          ),
        );

        expect(
          () => repository.switchToChild('child-uuid'),
          throwsA(isA<ServerException>()),
        );
      });
    });

    // ── switchToParent ──────────────────────────────────────────────────

    group('switchToParent', () {
      // FLUTTER-SWITCH-REPO-009
      test('FLUTTER-SWITCH-REPO-009: returns ParentSwitchResult on success (200)', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-parent',
          ),
        ).thenAnswer(
          (_) async => Response(
            data: {
              'data': {
                'accessToken': 'parent-jwt-token',
                'role': 'parent',
              },
              'meta': {},
            },
            statusCode: 200,
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-parent'),
          ),
        );

        final result = await repository.switchToParent();

        expect(result.accessToken, 'parent-jwt-token');
      });

      // FLUTTER-SWITCH-REPO-010
      test('FLUTTER-SWITCH-REPO-010: throws UnauthorizedException on 401 (not child role)', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-parent',
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 401,
              data: {'message': 'Unauthorized'},
              requestOptions:
                  RequestOptions(path: '/api/v1/auth/switch-to-parent'),
            ),
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-parent'),
          ),
        );

        expect(
          () => repository.switchToParent(),
          throwsA(isA<UnauthorizedException>()),
        );
      });

      // FLUTTER-SWITCH-REPO-011
      test('FLUTTER-SWITCH-REPO-011: throws UnauthorizedException on 403', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-parent',
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 403,
              data: {'message': 'Forbidden resource'},
              requestOptions:
                  RequestOptions(path: '/api/v1/auth/switch-to-parent'),
            ),
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-parent'),
          ),
        );

        expect(
          () => repository.switchToParent(),
          throwsA(isA<UnauthorizedException>()),
        );
      });

      // FLUTTER-SWITCH-REPO-012
      test('FLUTTER-SWITCH-REPO-012: throws NetworkException on connection timeout', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-parent',
          ),
        ).thenThrow(
          DioException(
            type: DioExceptionType.connectionTimeout,
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-parent'),
          ),
        );

        expect(
          () => repository.switchToParent(),
          throwsA(isA<NetworkException>()),
        );
      });

      // FLUTTER-SWITCH-REPO-013
      test('FLUTTER-SWITCH-REPO-013: throws ServerException when response data is not a map', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-parent',
          ),
        ).thenAnswer(
          (_) async => Response(
            data: <String, dynamic>{},  // missing 'data' key
            statusCode: 200,
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-parent'),
          ),
        );

        expect(
          () => repository.switchToParent(),
          throwsA(isA<ServerException>()),
        );
      });

      // FLUTTER-SWITCH-REPO-014
      test('FLUTTER-SWITCH-REPO-014: throws ServerException with rate-limit message on 429', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/switch-to-parent',
          ),
        ).thenThrow(
          DioException(
            response: Response(
              statusCode: 429,
              data: {'message': 'Too many requests'},
              requestOptions:
                  RequestOptions(path: '/api/v1/auth/switch-to-parent'),
            ),
            requestOptions:
                RequestOptions(path: '/api/v1/auth/switch-to-parent'),
          ),
        );

        expect(
          () => repository.switchToParent(),
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
