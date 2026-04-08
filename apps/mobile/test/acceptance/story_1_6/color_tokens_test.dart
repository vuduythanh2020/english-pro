/// ATDD Tests - Story 1.6: Design Token System & App Theme
/// Test IDs: 1.6-COLORS-001 through 1.6-COLORS-005
/// Priority: P0 (Critical — Color Token System)
/// Status: 🟢 GREEN
library;

import 'package:english_pro/app/theme/color_tokens.dart';
import 'package:english_pro/app/theme/semantic_colors.dart';
import 'package:english_pro/app/theme/text_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Story 1.6: Color Tokens @P0 @Unit', () {
    test(
      '1.6-COLORS-001: AppColors defines all required '
      'primary color tokens',
      () {
        expect(AppColors.coralPrimary, const Color(0xFFFF6B6B));
        expect(AppColors.onPrimary, const Color(0xFFFFFFFF));
        expect(
          AppColors.skyBlueSecondary,
          const Color(0xFF4ECDC4),
        );
        expect(AppColors.onSecondary, const Color(0xFFFFFFFF));
        expect(AppColors.amberTertiary, const Color(0xFFFFD93D));
        expect(AppColors.onTertiary, const Color(0xFF1A1A2E));
        expect(AppColors.surfaceCream, const Color(0xFFFFF8F0));
        expect(
          AppColors.warmOrangeError,
          const Color(0xFFFF9F43),
        );
        expect(AppColors.softPurple, const Color(0xFFA78BFA));
        expect(AppColors.softGreen, const Color(0xFF6BCB77));
      },
    );

    test(
      '1.6-COLORS-002: AppColors defines surface variant '
      'and outline tokens',
      () {
        expect(
          AppColors.surfaceVariant,
          const Color(0xFFF5F0EB),
        );
        expect(AppColors.onSurface, const Color(0xFF1A1A2E));
        expect(
          AppColors.onSurfaceVariant,
          const Color(0xFF6B6B6B),
        );
        expect(AppColors.outline, const Color(0xFFE0D6CC));
        expect(AppColors.darkNavy, const Color(0xFF1A1A2E));
        expect(AppColors.onError, const Color(0xFFFFFFFF));
      },
    );

    test(
      '1.6-COLORS-003: SemanticColors maps emotion tokens '
      'to correct colors',
      () {
        expect(
          SemanticColors.encouragement,
          const Color(0xFFFF6B6B),
        );
        expect(
          SemanticColors.celebration,
          const Color(0xFFFFD93D),
        );
        expect(
          SemanticColors.progress,
          const Color(0xFF4ECDC4),
        );
        expect(
          SemanticColors.gentleCorrection,
          const Color(0xFFFF9F43),
        );
        expect(
          SemanticColors.safeSpace,
          const Color(0xFFFFF8F0),
        );
        expect(
          SemanticColors.maxSpeaking,
          const Color(0xFFA78BFA),
        );
        expect(
          SemanticColors.maxListening,
          const Color(0xFF6BCB77),
        );
        expect(
          SemanticColors.success,
          const Color(0xFF6BCB77),
        );
      },
    );

    test(
      '1.6-COLORS-004: All AppColors constants '
      'are non-null Color objects',
      () {
        expect(AppColors.coralPrimary, isA<Color>());
        expect(AppColors.skyBlueSecondary, isA<Color>());
        expect(AppColors.amberTertiary, isA<Color>());
        expect(AppColors.surfaceCream, isA<Color>());
        expect(AppColors.warmOrangeError, isA<Color>());
        expect(AppColors.softPurple, isA<Color>());
        expect(AppColors.softGreen, isA<Color>());
      },
    );
  });

  group('Story 1.6: Color Values Validation @P0 @Unit', () {
    test(
      '1.6-COLORS-005: Light ColorScheme maps tokens '
      'to M3 roles correctly',
      () {
        // Build ThemeData without google_fonts for testing
        final theme = ThemeData(
          useMaterial3: true,
          colorScheme: AppColors.lightColorScheme,
          textTheme: AppTextTheme.textTheme,
          scaffoldBackgroundColor: AppColors.surfaceCream,
        );
        final colorScheme = theme.colorScheme;

        expect(colorScheme.primary, const Color(0xFFFF6B6B));
        expect(colorScheme.surface, const Color(0xFFFFF8F0));
        expect(colorScheme.error, const Color(0xFFFF9F43));
        expect(
          theme.scaffoldBackgroundColor,
          const Color(0xFFFFF8F0),
        );
      },
    );
  });
}
