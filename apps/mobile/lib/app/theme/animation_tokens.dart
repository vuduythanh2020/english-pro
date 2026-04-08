import 'package:flutter/animation.dart';

/// Animation duration and curve tokens.
///
/// Use these constants to keep motion consistent across the app.
abstract final class AppAnimations {
  /// 200ms — quick feedback (button press, toggle).
  static const Duration short = Duration(milliseconds: 200);

  /// 300ms — standard transitions (page, expand/collapse).
  static const Duration medium = Duration(milliseconds: 300);

  /// 500ms — elaborate animations (celebrations, onboarding).
  static const Duration long = Duration(milliseconds: 500);

  /// Default easing curve.
  static const Curve defaultCurve = Curves.easeInOut;
}
