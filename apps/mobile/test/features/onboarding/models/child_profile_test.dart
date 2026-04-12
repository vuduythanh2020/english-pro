/// Unit Tests — Story 2.4: ChildProfile domain model
/// Tests validate JSON deserialization and field mapping.
library;

import 'package:english_pro/features/onboarding/models/child_profile.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ChildProfile', () {
    // ── fromJson ──────────────────────────────────────────────────────────

    group('fromJson', () {
      test('parses all fields correctly from a valid JSON map', () {
        final json = {
          'id': 'child-uuid-123',
          'parentId': 'parent-uuid-456',
          'displayName': 'Bé Minh',
          'avatarId': 3,
          'level': 'beginner',
          'xpTotal': 0,
          'createdAt': '2026-04-12T00:00:00.000Z',
        };

        final profile = ChildProfile.fromJson(json);

        expect(profile.id, 'child-uuid-123');
        expect(profile.parentId, 'parent-uuid-456');
        expect(profile.displayName, 'Bé Minh');
        expect(profile.avatarId, 3);
        expect(profile.level, 'beginner');
        expect(profile.xpTotal, 0);
        expect(profile.createdAt, DateTime.parse('2026-04-12T00:00:00.000Z'));
      });

      test('parses xpTotal > 0 correctly', () {
        final json = {
          'id': 'child-uuid-789',
          'parentId': 'parent-uuid-456',
          'displayName': 'Bé Lan',
          'avatarId': 5,
          'level': 'beginner',
          'xpTotal': 250,
          'createdAt': '2026-04-12T12:00:00.000Z',
        };

        final profile = ChildProfile.fromJson(json);

        expect(profile.xpTotal, 250);
        expect(profile.avatarId, 5);
        expect(profile.displayName, 'Bé Lan');
      });

      test('parses avatarId = 1 (minimum boundary)', () {
        final json = {
          'id': 'id-1',
          'parentId': 'parent-1',
          'displayName': 'Bé A',
          'avatarId': 1,
          'level': 'beginner',
          'xpTotal': 0,
          'createdAt': '2026-01-01T00:00:00.000Z',
        };

        final profile = ChildProfile.fromJson(json);

        expect(profile.avatarId, 1);
      });

      test('parses avatarId = 6 (maximum boundary)', () {
        final json = {
          'id': 'id-6',
          'parentId': 'parent-1',
          'displayName': 'Bé F',
          'avatarId': 6,
          'level': 'beginner',
          'xpTotal': 0,
          'createdAt': '2026-01-01T00:00:00.000Z',
        };

        final profile = ChildProfile.fromJson(json);

        expect(profile.avatarId, 6);
      });

      test('parses Vietnamese displayName correctly (Unicode)', () {
        final json = {
          'id': 'id-vn',
          'parentId': 'parent-1',
          'displayName': 'Nguyễn Văn Minh',
          'avatarId': 2,
          'level': 'beginner',
          'xpTotal': 100,
          'createdAt': '2026-04-12T00:00:00.000Z',
        };

        final profile = ChildProfile.fromJson(json);

        expect(profile.displayName, 'Nguyễn Văn Minh');
      });

      test('parses createdAt into a valid DateTime', () {
        final json = {
          'id': 'id-dt',
          'parentId': 'parent-1',
          'displayName': 'Bé B',
          'avatarId': 2,
          'level': 'beginner',
          'xpTotal': 0,
          'createdAt': '2026-04-12T15:30:00.000Z',
        };

        final profile = ChildProfile.fromJson(json);

        expect(profile.createdAt.year, 2026);
        expect(profile.createdAt.month, 4);
        expect(profile.createdAt.day, 12);
      });

      test('stores all required fields (completeness check)', () {
        final json = {
          'id': 'complete-id',
          'parentId': 'complete-parent',
          'displayName': 'Complete',
          'avatarId': 4,
          'level': 'beginner',
          'xpTotal': 42,
          'createdAt': '2026-04-12T00:00:00.000Z',
        };

        final profile = ChildProfile.fromJson(json);

        expect(profile.id, isNotNull);
        expect(profile.parentId, isNotNull);
        expect(profile.displayName, isNotNull);
        expect(profile.avatarId, isNotNull);
        expect(profile.level, isNotNull);
        expect(profile.xpTotal, isNotNull);
        expect(profile.createdAt, isNotNull);
      });
    });
  });
}
