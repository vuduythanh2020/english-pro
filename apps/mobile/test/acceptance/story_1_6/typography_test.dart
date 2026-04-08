/// ATDD Tests - Story 1.6: Typography System
/// Priority: P0
/// Status: 🟢 GREEN
library;

import 'package:english_pro/app/theme/text_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Story 1.6: Typography @P0 @Unit', () {
    late TextTheme textTheme;

    setUp(() {
      textTheme = AppTextTheme.textTheme;
    });

    test('1.6-TYPO-001: TextTheme defines all M3 styles', () {
      expect(textTheme.displayLarge, isNotNull);
      expect(textTheme.displayMedium, isNotNull);
      expect(textTheme.displaySmall, isNotNull);
      expect(textTheme.headlineLarge, isNotNull);
      expect(textTheme.headlineMedium, isNotNull);
      expect(textTheme.headlineSmall, isNotNull);
      expect(textTheme.titleLarge, isNotNull);
      expect(textTheme.titleMedium, isNotNull);
      expect(textTheme.titleSmall, isNotNull);
      expect(textTheme.bodyLarge, isNotNull);
      expect(textTheme.bodyMedium, isNotNull);
      expect(textTheme.bodySmall, isNotNull);
      expect(textTheme.labelLarge, isNotNull);
      expect(textTheme.labelMedium, isNotNull);
      expect(textTheme.labelSmall, isNotNull);
    });

    test(
      '1.6-TYPO-002: Display styles use Bold (700) weight',
      () {
        expect(
          textTheme.displayLarge?.fontWeight,
          FontWeight.w700,
        );
        expect(
          textTheme.displayMedium?.fontWeight,
          FontWeight.w700,
        );
        expect(
          textTheme.displaySmall?.fontWeight,
          FontWeight.w700,
        );
      },
    );

    test(
      '1.6-TYPO-003: Body styles use Regular (400) weight',
      () {
        expect(
          textTheme.bodyLarge?.fontWeight,
          FontWeight.w400,
        );
        expect(
          textTheme.bodyMedium?.fontWeight,
          FontWeight.w400,
        );
        expect(
          textTheme.bodySmall?.fontWeight,
          FontWeight.w400,
        );
      },
    );

    test(
      '1.6-TYPO-004: Title/Headline use SemiBold (600)',
      () {
        expect(
          textTheme.headlineMedium?.fontWeight,
          FontWeight.w600,
        );
        expect(
          textTheme.titleLarge?.fontWeight,
          FontWeight.w600,
        );
        expect(
          textTheme.titleMedium?.fontWeight,
          FontWeight.w600,
        );
      },
    );

    test('1.6-TYPO-005: Font sizes match spec', () {
      expect(textTheme.displayLarge?.fontSize, 57);
      expect(textTheme.headlineLarge?.fontSize, 32);
      expect(textTheme.titleLarge?.fontSize, 22);
      expect(textTheme.bodyLarge?.fontSize, 16);
      expect(textTheme.bodyMedium?.fontSize, 14);
      expect(textTheme.labelSmall?.fontSize, 11);
    });

    test('1.6-TYPO-006: Nunito font family configured', () {
      // AppTextTheme exposes fontFamily constant
      expect(AppTextTheme.fontFamily, 'Nunito');
    });
  });
}
