import 'package:english_pro/app/theme/color_tokens.dart';
import 'package:flutter/material.dart';

/// Semantic emotion color tokens that map emotional states
/// to concrete design-system colors.
///
/// These tokens are used throughout the app to ensure consistent
/// emotional feedback in the UI. Import via the barrel file
/// `package:english_pro/app/theme/theme.dart`.
abstract final class SemanticColors {
  /// Max encourages the child — Coral.
  static const Color encouragement = AppColors.coralPrimary;

  /// Celebration on earning XP or completing a scenario — Amber.
  static const Color celebration = AppColors.amberTertiary;

  /// Progress bars, score improvement — Sky Blue.
  static const Color progress = AppColors.skyBlueSecondary;

  /// Gentle correction for pronunciation — Warm Orange.
  static const Color gentleCorrection = AppColors.warmOrangeError;

  /// Safe-space background — Cream.
  static const Color safeSpace = AppColors.surfaceCream;

  /// Max is speaking — Soft Purple.
  static const Color maxSpeaking = AppColors.softPurple;

  /// Max is listening — Soft Green.
  static const Color maxListening = AppColors.softGreen;

  /// Success feedback — Soft Green.
  ///
  /// Alias of [maxListening]; used for general success states
  /// (e.g. correct answer, achievement unlocked).
  static const Color success = AppColors.softGreen;
}
