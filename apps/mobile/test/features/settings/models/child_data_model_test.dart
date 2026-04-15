/// Unit Tests — Story 2.7: ChildDataModel serialization
/// TDD RED Phase — tests generated before implementation
library;

import 'package:english_pro/features/settings/models/child_data_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ChildDataModel', () {
    final validJson = {
      'profile': {
        'id': 'child-uuid-123',
        'name': 'Minh',
        'avatar': 2,
        'age': 7,
        'createdAt': '2026-01-15T10:00:00.000Z',
      },
      'learningProgress': {
        'totalSessions': 12,
        'sessions': [],
      },
      'pronunciationScores': [],
      'badges': [],
      'exportedAt': '2026-04-13T16:00:00.000Z',
    };

    group('fromJson', () {
      test('FLUTTER-2.7-MODEL-001: parses all top-level fields correctly', () {
        final model = ChildDataModel.fromJson(validJson);

        expect(model.profile.id, 'child-uuid-123');
        expect(model.profile.name, 'Minh');
        expect(model.profile.age, 7);
        expect(model.learningProgress.totalSessions, 12);
        expect(model.pronunciationScores, isEmpty);
        expect(model.badges, isEmpty);
        expect(model.exportedAt, '2026-04-13T16:00:00.000Z');
      });

      test('FLUTTER-2.7-MODEL-002: parses profile avatar correctly', () {
        final model = ChildDataModel.fromJson(validJson);
        expect(model.profile.avatar, 2);
      });

      test('FLUTTER-2.7-MODEL-003: parses profile createdAt as string', () {
        final model = ChildDataModel.fromJson(validJson);
        expect(model.profile.createdAt, '2026-01-15T10:00:00.000Z');
      });

      test('FLUTTER-2.7-MODEL-004: parses pronunciationScores list correctly', () {
        final jsonWithScores = Map<String, dynamic>.from(validJson);
        jsonWithScores['pronunciationScores'] = [
          {'sessionId': 'sess-1', 'score': 85.5, 'word': 'hello', 'createdAt': '2026-02-01T10:00:00Z'},
          {'sessionId': 'sess-2', 'score': 72.0, 'word': 'world', 'createdAt': '2026-02-02T10:00:00Z'},
        ];

        final model = ChildDataModel.fromJson(jsonWithScores);
        expect(model.pronunciationScores.length, 2);
        expect(model.pronunciationScores[0].score, 85.5);
        expect(model.pronunciationScores[0].word, 'hello');
      });

      test('FLUTTER-2.7-MODEL-005: parses badges list correctly', () {
        final jsonWithBadges = Map<String, dynamic>.from(validJson);
        jsonWithBadges['badges'] = [
          {'id': 'badge-1', 'name': 'First Conversation', 'earnedAt': '2026-01-20T00:00:00Z'},
        ];

        final model = ChildDataModel.fromJson(jsonWithBadges);
        expect(model.badges.length, 1);
        expect(model.badges[0].name, 'First Conversation');
      });

      test('FLUTTER-2.7-MODEL-006: learningProgress contains sessions list', () {
        final jsonWithSessions = Map<String, dynamic>.from(validJson);
        (jsonWithSessions['learningProgress'] as Map<String, dynamic>)['sessions'] = [
          {'id': 'sess-1', 'createdAt': '2026-02-01T10:00:00Z'},
        ];
        (jsonWithSessions['learningProgress'] as Map<String, dynamic>)['totalSessions'] = 1;

        final model = ChildDataModel.fromJson(jsonWithSessions);
        expect(model.learningProgress.totalSessions, 1);
        expect(model.learningProgress.sessions.length, 1);
      });

      test('FLUTTER-2.7-MODEL-007: model does NOT have voiceRecordings field (FR24)', () {
        final model = ChildDataModel.fromJson(validJson);
        // Voice data must never be stored (FR24)
        // Verify no voice-related property exists on model
        final modelStr = model.toString();
        expect(modelStr.toLowerCase(), isNot(contains('voice')));
        expect(modelStr.toLowerCase(), isNot(contains('recording')));
        expect(modelStr.toLowerCase(), isNot(contains('audio')));
      });
    });

    group('Equatable', () {
      test('FLUTTER-2.7-MODEL-008: two models with same data are equal', () {
        final model1 = ChildDataModel.fromJson(validJson);
        final model2 = ChildDataModel.fromJson(validJson);
        expect(model1, equals(model2));
      });

      test('FLUTTER-2.7-MODEL-009: two models with different exportedAt are not equal', () {
        final json2 = Map<String, dynamic>.from(validJson);
        json2['exportedAt'] = '2026-04-14T10:00:00.000Z';
        final model1 = ChildDataModel.fromJson(validJson);
        final model2 = ChildDataModel.fromJson(json2);
        expect(model1, isNot(equals(model2)));
      });
    });
  });
}
