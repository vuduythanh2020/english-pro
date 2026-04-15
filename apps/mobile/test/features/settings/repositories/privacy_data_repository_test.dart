/// Unit Tests — Story 2.7: PrivacyDataRepository
/// TDD RED Phase — tests generated before implementation
library;

import 'package:dio/dio.dart';
import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/features/settings/models/child_data_model.dart';
import 'package:english_pro/features/settings/repositories/privacy_data_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late PrivacyDataRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = PrivacyDataRepository(dio: mockDio);
  });

  final mockChildDataJson = {
    'data': {
      'profile': {
        'id': 'child-uuid-123',
        'name': 'Minh',
        'avatar': 2,
        'age': 7,
        'createdAt': '2026-01-15T10:00:00.000Z',
      },
      'learningProgress': {'totalSessions': 12, 'sessions': []},
      'pronunciationScores': [],
      'badges': [],
      'exportedAt': '2026-04-13T16:00:00.000Z',
    }
  };

  group('PrivacyDataRepository', () {
    group('getChildData', () {
      test('FLUTTER-2.7-REPO-001: returns ChildDataModel on 200 success', () async {
        const childId = 'child-uuid-123';
        when(() => mockDio.get<Map<String, dynamic>>(
          '/api/v1/users/children/$childId/data',
        )).thenAnswer((_) async => Response(
          data: mockChildDataJson,
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/v1/users/children/$childId/data'),
        ));

        final result = await repository.getChildData(childId);

        expect(result, isA<ChildDataModel>());
        expect(result.profile.id, 'child-uuid-123');
        expect(result.profile.name, 'Minh');
        expect(result.profile.age, 7);
      });

      test('FLUTTER-2.7-REPO-002: throws NetworkException on connection error', () async {
        const childId = 'child-uuid-123';
        when(() => mockDio.get<Map<String, dynamic>>(
          '/api/v1/users/children/$childId/data',
        )).thenThrow(DioException(
          type: DioExceptionType.connectionError,
          requestOptions: RequestOptions(path: '/api/v1/users/children/$childId/data'),
        ));

        await expectLater(
          repository.getChildData(childId),
          throwsA(isA<NetworkException>()),
        );
      });

      test('FLUTTER-2.7-REPO-003: throws UnauthorizedException on 401', () async {
        const childId = 'child-uuid-123';
        when(() => mockDio.get<Map<String, dynamic>>(
          '/api/v1/users/children/$childId/data',
        )).thenThrow(DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 401,
            requestOptions: RequestOptions(path: '/api/v1/users/children/$childId/data'),
          ),
          requestOptions: RequestOptions(path: '/api/v1/users/children/$childId/data'),
        ));

        await expectLater(
          repository.getChildData(childId),
          throwsA(isA<UnauthorizedException>()),
        );
      });

      test('FLUTTER-2.7-REPO-004: throws NotFoundException on 404 (child not found or wrong owner)', () async {
        const childId = 'child-uuid-wrong';
        when(() => mockDio.get<Map<String, dynamic>>(
          '/api/v1/users/children/$childId/data',
        )).thenThrow(DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 404,
            requestOptions: RequestOptions(path: '/api/v1/users/children/$childId/data'),
          ),
          requestOptions: RequestOptions(path: '/api/v1/users/children/$childId/data'),
        ));

        await expectLater(
          repository.getChildData(childId),
          throwsA(isA<NotFoundException>()),
        );
      });
    });

    group('deleteChildAccount', () {
      test('FLUTTER-2.7-REPO-005: completes without error on 200 success', () async {
        const childId = 'child-uuid-123';
        when(() => mockDio.delete<Map<String, dynamic>>(
          '/api/v1/users/children/$childId',
        )).thenAnswer((_) async => Response(
          data: {'data': {'message': 'Child account deleted successfully'}},
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/v1/users/children/$childId'),
        ));

        await expectLater(repository.deleteChildAccount(childId), completes);
      });

      test('FLUTTER-2.7-REPO-006: throws NotFoundException on 404', () async {
        const childId = 'child-uuid-wrong';
        when(() => mockDio.delete<Map<String, dynamic>>(
          '/api/v1/users/children/$childId',
        )).thenThrow(DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 404,
            requestOptions: RequestOptions(path: '/api/v1/users/children/$childId'),
          ),
          requestOptions: RequestOptions(path: '/api/v1/users/children/$childId'),
        ));

        await expectLater(
          repository.deleteChildAccount(childId),
          throwsA(isA<NotFoundException>()),
        );
      });

      test('FLUTTER-2.7-REPO-007: throws ForbiddenException on 403 (child role)', () async {
        const childId = 'child-uuid-123';
        when(() => mockDio.delete<Map<String, dynamic>>(
          '/api/v1/users/children/$childId',
        )).thenThrow(DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 403,
            requestOptions: RequestOptions(path: '/api/v1/users/children/$childId'),
          ),
          requestOptions: RequestOptions(path: '/api/v1/users/children/$childId'),
        ));

        await expectLater(
          repository.deleteChildAccount(childId),
          throwsA(isA<ForbiddenException>()),
        );
      });
    });

    group('exportChildData', () {
      test('FLUTTER-2.7-REPO-008: returns Uint8List bytes on success', () async {
        const childId = 'child-uuid-123';
        final jsonBytes = '{"profile":{"id":"child-uuid-123"}}'.codeUnits;
        when(() => mockDio.get<List<int>>(
          '/api/v1/users/children/$childId/export',
          options: any(named: 'options'),
        )).thenAnswer((_) async => Response<List<int>>(
          data: jsonBytes,
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/v1/users/children/$childId/export'),
        ));

        final result = await repository.exportChildData(childId);
        expect(result, isNotEmpty);
      });

      test('FLUTTER-2.7-REPO-009: throws NotFoundException on 404', () async {
        const childId = 'child-uuid-wrong';
        when(() => mockDio.get<List<int>>(
          '/api/v1/users/children/$childId/export',
          options: any(named: 'options'),
        )).thenThrow(DioException(
          type: DioExceptionType.badResponse,
          response: Response(
            statusCode: 404,
            requestOptions: RequestOptions(path: '/api/v1/users/children/$childId/export'),
          ),
          requestOptions: RequestOptions(path: '/api/v1/users/children/$childId/export'),
        ));

        await expectLater(
          repository.exportChildData(childId),
          throwsA(isA<NotFoundException>()),
        );
      });
    });
  });
}
