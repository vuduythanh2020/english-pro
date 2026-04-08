/// Spacing tokens based on an 8dp grid system.
///
/// Use these constants instead of hard-coded values to ensure
/// consistent spacing throughout the app.
abstract final class AppSpacing {
  /// 4dp — tight spacing (icon-text gap).
  static const double xs = 4;

  /// 8dp — small padding (chip, tag).
  static const double s = 8;

  /// 16dp — standard padding (card, section).
  static const double m = 16;

  /// 24dp — large padding (between sections).
  static const double l = 24;

  /// 32dp — extra large (screen margins).
  static const double xl = 32;

  /// 48dp — section dividers, large gaps.
  static const double xxl = 48;

  /// 48dp — minimum M3 touch target.
  static const double touchTargetMin = 48;

  /// 64dp — mic button primary action.
  static const double touchTargetPrimary = 64;
}
