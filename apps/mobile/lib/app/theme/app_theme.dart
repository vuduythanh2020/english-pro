import 'package:english_pro/app/theme/color_tokens.dart';
import 'package:english_pro/app/theme/shape_tokens.dart';
import 'package:english_pro/app/theme/text_theme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Builds the application [ThemeData] for light and dark modes.
///
/// Combines color tokens, typography, and shape tokens into
/// Material 3 compliant themes.
abstract final class AppTheme {
  /// Light theme — Cream surface with warm accents.
  static ThemeData lightTheme() {
    final textTheme = GoogleFonts.nunitoTextTheme(AppTextTheme.textTheme);
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

  /// Dark theme — Dark Navy surface with desaturated warm accents.
  static ThemeData darkTheme() {
    final textTheme = GoogleFonts.nunitoTextTheme(AppTextTheme.textTheme);
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
}
