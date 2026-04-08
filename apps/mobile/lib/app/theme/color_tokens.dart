import 'package:flutter/material.dart';

/// Design token color constants for the English Pro app.
///
/// All colors are defined here as a single source of truth.
/// Use these tokens via [AppColors] or through
/// `Theme.of(context).colorScheme` for M3 semantic colors.
abstract final class AppColors {
  // ── Primary ──────────────────────────────────────────────────────────
  /// Coral — primary CTA buttons, encouragement.
  static const Color coralPrimary = Color(0xFFFF6B6B);
  static const Color onPrimary = Color(0xFFFFFFFF);

  // ── Secondary ────────────────────────────────────────────────────────
  /// Sky Blue — progress bars, score improvement.
  static const Color skyBlueSecondary = Color(0xFF4ECDC4);
  static const Color onSecondary = Color(0xFFFFFFFF);

  // ── Tertiary ─────────────────────────────────────────────────────────
  /// Amber — celebrations, achievements, XP.
  static const Color amberTertiary = Color(0xFFFFD93D);
  static const Color onTertiary = Color(0xFF1A1A2E);

  // ── Surface ──────────────────────────────────────────────────────────
  /// Warm Cream — main background.
  static const Color surfaceCream = Color(0xFFFFF8F0);

  /// Light Gray — card backgrounds, secondary surfaces.
  static const Color surfaceVariant = Color(0xFFF5F0EB);
  static const Color onSurface = Color(0xFF1A1A2E);
  static const Color onSurfaceVariant = Color(0xFF6B6B6B);

  // ── Error ────────────────────────────────────────────────────────────
  /// Warm Orange — gentle correction (NOT red).
  static const Color warmOrangeError = Color(0xFFFF9F43);
  static const Color onError = Color(0xFFFFFFFF);

  // ── Outline ──────────────────────────────────────────────────────────
  /// Borders, dividers.
  static const Color outline = Color(0xFFE0D6CC);

  // ── Max Character ────────────────────────────────────────────────────
  /// Soft Purple — when Max is speaking.
  static const Color softPurple = Color(0xFFA78BFA);

  /// Soft Green — when Max is listening.
  static const Color softGreen = Color(0xFF6BCB77);

  // ── Dark Mode Colors ─────────────────────────────────────────────────
  /// Dark Navy — dark mode surface.
  static const Color darkNavy = Color(0xFF1A1A2E);
  static const Color darkSurfaceVariant = Color(0xFF2A2A3E);
  static const Color darkOnSurface = Color(0xFFFFFFFF);
  static const Color darkOnSurfaceVariant = Color(0xFFB0B0B0);
  static const Color darkCoralPrimary = Color(0xFFFF8A8A);
  static const Color darkSkyBlueSecondary = Color(0xFF6DD5CC);
  static const Color darkAmberTertiary = Color(0xFFFFE066);
  static const Color darkWarmOrangeError = Color(0xFFFFB366);
  static const Color darkOutline = Color(0xFF3A3A4E);

  // ── Light ColorScheme ────────────────────────────────────────────────
  static const ColorScheme lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: coralPrimary,
    onPrimary: onPrimary,
    secondary: skyBlueSecondary,
    onSecondary: onSecondary,
    tertiary: amberTertiary,
    onTertiary: onTertiary,
    surface: surfaceCream,
    onSurface: onSurface,
    onSurfaceVariant: onSurfaceVariant,
    error: warmOrangeError,
    onError: onError,
    outline: outline,
    surfaceContainerHighest: surfaceVariant,
  );

  // ── Dark ColorScheme ─────────────────────────────────────────────────
  static const ColorScheme darkColorScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: darkCoralPrimary,
    onPrimary: onPrimary,
    secondary: darkSkyBlueSecondary,
    onSecondary: onSecondary,
    tertiary: darkAmberTertiary,
    onTertiary: darkNavy,
    surface: darkNavy,
    onSurface: darkOnSurface,
    onSurfaceVariant: darkOnSurfaceVariant,
    error: darkWarmOrangeError,
    onError: onError,
    outline: darkOutline,
    surfaceContainerHighest: darkSurfaceVariant,
  );
}
