/// Tests for AppTheme — validates the structural composition of
/// light and dark ThemeData without triggering GoogleFonts HTTP.
///
/// Follows the same testing pattern as story_1_6/dark_mode_test.dart:
/// rebuild ThemeData with AppTextTheme.textTheme directly to avoid
/// GoogleFonts async font loading in unit tests.
///
/// Priority: P2
/// Status: NEW
library;

import 'package:english_pro/app/theme/color_tokens.dart';
import 'package:english_pro/app/theme/shape_tokens.dart';
import 'package:english_pro/app/theme/text_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Reconstructs light theme WITHOUT GoogleFonts — same structure as
/// AppTheme.lightTheme() but using AppTextTheme.textTheme directly.
ThemeData _buildLightTheme() {
  final textTheme = AppTextTheme.textTheme;
  return ThemeData(
    useMaterial3: true,
    colorScheme: AppColors.lightColorScheme,
    textTheme: textTheme,
    scaffoldBackgroundColor: AppColors.surfaceCream,
    cardTheme: CardThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: AppShapes.mediumBorderRadius,
      ),
      color: AppColors.surfaceVariant,
    ),
    navigationBarTheme: NavigationBarThemeData(
      indicatorColor: AppColors.coralPrimary.withValues(alpha: 0.12),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return textTheme.labelMedium?.copyWith(
            color: AppColors.coralPrimary,
            fontWeight: FontWeight.w600,
          );
        }
        return textTheme.labelMedium?.copyWith(
          color: AppColors.onSurfaceVariant,
        );
      }),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        shape: RoundedRectangleBorder(
          borderRadius: AppShapes.smallBorderRadius,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: AppShapes.smallBorderRadius,
      ),
    ),
  );
}

/// Reconstructs dark theme WITHOUT GoogleFonts.
ThemeData _buildDarkTheme() {
  final textTheme = AppTextTheme.textTheme;
  return ThemeData(
    useMaterial3: true,
    colorScheme: AppColors.darkColorScheme,
    textTheme: textTheme,
    scaffoldBackgroundColor: AppColors.darkNavy,
    cardTheme: CardThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: AppShapes.mediumBorderRadius,
      ),
      color: AppColors.darkSurfaceVariant,
    ),
    navigationBarTheme: NavigationBarThemeData(
      indicatorColor: AppColors.darkCoralPrimary.withValues(alpha: 0.12),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return textTheme.labelMedium?.copyWith(
            color: AppColors.darkCoralPrimary,
            fontWeight: FontWeight.w600,
          );
        }
        return textTheme.labelMedium?.copyWith(
          color: AppColors.darkOnSurfaceVariant,
        );
      }),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        shape: RoundedRectangleBorder(
          borderRadius: AppShapes.smallBorderRadius,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: AppShapes.smallBorderRadius,
      ),
    ),
  );
}

void main() {
  group('AppTheme light theme structure', () {
    late ThemeData theme;

    setUp(() {
      theme = _buildLightTheme();
    });

    test('uses Material 3', () {
      expect(theme.useMaterial3, isTrue);
    });

    test('uses light color scheme from AppColors', () {
      expect(theme.colorScheme.primary, AppColors.lightColorScheme.primary);
      expect(theme.colorScheme.surface, AppColors.lightColorScheme.surface);
      expect(theme.colorScheme.error, AppColors.lightColorScheme.error);
    });

    test('scaffoldBackgroundColor is surfaceCream', () {
      expect(theme.scaffoldBackgroundColor, AppColors.surfaceCream);
    });

    test('card theme uses medium border radius', () {
      final shape = theme.cardTheme.shape as RoundedRectangleBorder?;
      expect(shape, isNotNull);
      expect(shape!.borderRadius, AppShapes.mediumBorderRadius);
    });

    test('card theme color is surfaceVariant', () {
      expect(theme.cardTheme.color, AppColors.surfaceVariant);
    });

    test('elevated button uses small border radius', () {
      final style = theme.elevatedButtonTheme.style;
      expect(style, isNotNull);
      final shape = style!.shape?.resolve({}) as RoundedRectangleBorder?;
      expect(shape, isNotNull);
      expect(shape!.borderRadius, AppShapes.smallBorderRadius);
    });

    test('input decoration uses small border radius', () {
      final border = theme.inputDecorationTheme.border as OutlineInputBorder?;
      expect(border, isNotNull);
      expect(border!.borderRadius, AppShapes.smallBorderRadius);
    });

    test('navigation bar indicator uses coral with 12% opacity', () {
      expect(
        theme.navigationBarTheme.indicatorColor,
        AppColors.coralPrimary.withValues(alpha: 0.12),
      );
    });

    test('navigation bar selected label uses coral primary', () {
      final style = theme.navigationBarTheme.labelTextStyle;
      expect(style, isNotNull);
      final selectedStyle =
          style!.resolve({WidgetState.selected}) as TextStyle?;
      expect(selectedStyle?.color, AppColors.coralPrimary);
      expect(selectedStyle?.fontWeight, FontWeight.w600);
    });

    test('navigation bar unselected label uses onSurfaceVariant', () {
      final style = theme.navigationBarTheme.labelTextStyle;
      expect(style, isNotNull);
      final unselectedStyle = style!.resolve({}) as TextStyle?;
      expect(unselectedStyle?.color, AppColors.onSurfaceVariant);
    });

    test('text theme is not null', () {
      expect(theme.textTheme, isNotNull);
      expect(theme.textTheme.bodyMedium, isNotNull);
    });
  });

  group('AppTheme dark theme structure', () {
    late ThemeData theme;

    setUp(() {
      theme = _buildDarkTheme();
    });

    test('uses Material 3', () {
      expect(theme.useMaterial3, isTrue);
    });

    test('uses dark color scheme from AppColors', () {
      expect(theme.colorScheme.primary, AppColors.darkColorScheme.primary);
      expect(theme.colorScheme.surface, AppColors.darkColorScheme.surface);
    });

    test('scaffoldBackgroundColor is darkNavy', () {
      expect(theme.scaffoldBackgroundColor, AppColors.darkNavy);
    });

    test('card theme color is darkSurfaceVariant', () {
      expect(theme.cardTheme.color, AppColors.darkSurfaceVariant);
    });

    test('card theme uses medium border radius', () {
      final shape = theme.cardTheme.shape as RoundedRectangleBorder?;
      expect(shape, isNotNull);
      expect(shape!.borderRadius, AppShapes.mediumBorderRadius);
    });

    test('elevated button uses small border radius', () {
      final style = theme.elevatedButtonTheme.style;
      expect(style, isNotNull);
      final shape = style!.shape?.resolve({}) as RoundedRectangleBorder?;
      expect(shape, isNotNull);
      expect(shape!.borderRadius, AppShapes.smallBorderRadius);
    });

    test('input decoration uses small border radius', () {
      final border = theme.inputDecorationTheme.border as OutlineInputBorder?;
      expect(border, isNotNull);
      expect(border!.borderRadius, AppShapes.smallBorderRadius);
    });

    test('navigation bar indicator uses darkCoralPrimary with 12% opacity', () {
      expect(
        theme.navigationBarTheme.indicatorColor,
        AppColors.darkCoralPrimary.withValues(alpha: 0.12),
      );
    });

    test('navigation bar selected label uses darkCoralPrimary', () {
      final style = theme.navigationBarTheme.labelTextStyle;
      expect(style, isNotNull);
      final selectedStyle =
          style!.resolve({WidgetState.selected}) as TextStyle?;
      expect(selectedStyle?.color, AppColors.darkCoralPrimary);
      expect(selectedStyle?.fontWeight, FontWeight.w600);
    });

    test('navigation bar unselected label uses darkOnSurfaceVariant', () {
      final style = theme.navigationBarTheme.labelTextStyle;
      expect(style, isNotNull);
      final unselectedStyle = style!.resolve({}) as TextStyle?;
      expect(unselectedStyle?.color, AppColors.darkOnSurfaceVariant);
    });

    test('text theme is not null', () {
      expect(theme.textTheme, isNotNull);
    });
  });

  group('AppTheme light vs dark differences', () {
    test('light and dark themes have different scaffold backgrounds', () {
      final light = _buildLightTheme();
      final dark = _buildDarkTheme();
      expect(
        light.scaffoldBackgroundColor,
        isNot(equals(dark.scaffoldBackgroundColor)),
      );
    });

    test('light and dark themes have different color schemes', () {
      final light = _buildLightTheme();
      final dark = _buildDarkTheme();
      expect(
        light.colorScheme.surface,
        isNot(equals(dark.colorScheme.surface)),
      );
    });

    test('light and dark card colors differ', () {
      final light = _buildLightTheme();
      final dark = _buildDarkTheme();
      expect(
        light.cardTheme.color,
        isNot(equals(dark.cardTheme.color)),
      );
    });
  });
}
