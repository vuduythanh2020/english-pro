import 'package:flutter/material.dart';

/// Shape tokens using rounded corners for the design system.
///
/// All UI surfaces use these consistent border-radius values.
abstract final class AppShapes {
  /// 12dp — chips, tags, small buttons.
  static const double small = 12;

  /// 16dp — cards, dialogs.
  static const double medium = 16;

  /// 20dp — large cards, sheets.
  static const double large = 20;

  /// 28dp — full-screen sheets, modals.
  static const double extraLarge = 28;

  /// [BorderRadius] helpers for convenient use in widget trees.
  static final BorderRadius smallBorderRadius = BorderRadius.circular(small);
  static final BorderRadius mediumBorderRadius = BorderRadius.circular(medium);
  static final BorderRadius largeBorderRadius = BorderRadius.circular(large);
  static final BorderRadius extraLargeBorderRadius = BorderRadius.circular(
    extraLarge,
  );
}
