/// ATDD Tests - Story 1.6: Dark Mode
/// Priority: P0
/// Status: 🟢 GREEN
library;

import 'package:english_pro/app/theme/color_tokens.dart';
import 'package:english_pro/app/theme/text_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Builds a [ThemeData] for testing without triggering google_fonts.
ThemeData _buildDarkTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: AppColors.darkColorScheme,
    textTheme: AppTextTheme.textTheme,
    scaffoldBackgroundColor: AppColors.darkNavy,
  );
}

ThemeData _buildLightTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: AppColors.lightColorScheme,
    textTheme: AppTextTheme.textTheme,
    scaffoldBackgroundColor: AppColors.surfaceCream,
  );
}

void main() {
  group('Story 1.6: Dark Mode @P0 @Unit', () {
    late ThemeData darkTheme;

    setUp(() {
      darkTheme = _buildDarkTheme();
    });

    test(
      '1.6-DARK-001: Dark theme uses Dark Navy surface',
      () {
        expect(
          darkTheme.colorScheme.surface,
          const Color(0xFF1A1A2E),
        );
        expect(
          darkTheme.scaffoldBackgroundColor,
          const Color(0xFF1A1A2E),
        );
      },
    );

    test(
      '1.6-DARK-002: Dark theme uses desaturated '
      'warm accents',
      () {
        expect(
          darkTheme.colorScheme.primary,
          AppColors.darkCoralPrimary,
        );
        expect(
          darkTheme.colorScheme.secondary,
          AppColors.darkSkyBlueSecondary,
        );
        expect(
          darkTheme.colorScheme.tertiary,
          AppColors.darkAmberTertiary,
        );
        expect(
          darkTheme.colorScheme.error,
          AppColors.darkWarmOrangeError,
        );
      },
    );

    test(
      '1.6-DARK-003: Dark theme onSurface is white',
      () {
        expect(
          darkTheme.colorScheme.onSurface,
          const Color(0xFFFFFFFF),
        );
      },
    );

    test(
      '1.6-DARK-004: Dark color scheme has correct '
      'brightness',
      () {
        expect(
          darkTheme.colorScheme.brightness,
          Brightness.dark,
        );
      },
    );

    test(
      '1.6-DARK-005: Dark theme defines surface variant',
      () {
        expect(
          AppColors.darkSurfaceVariant,
          const Color(0xFF2A2A3E),
        );
        expect(
          AppColors.darkOutline,
          const Color(0xFF3A3A4E),
        );
      },
    );
  });

  group('Story 1.6: Light Theme @P0 @Unit', () {
    late ThemeData lightTheme;

    setUp(() {
      lightTheme = _buildLightTheme();
    });

    test(
      '1.6-LIGHT-001: Light theme uses M3',
      () {
        expect(lightTheme.useMaterial3, isTrue);
      },
    );

    test(
      '1.6-LIGHT-002: Light theme brightness is light',
      () {
        expect(
          lightTheme.colorScheme.brightness,
          Brightness.light,
        );
      },
    );
  });
}
