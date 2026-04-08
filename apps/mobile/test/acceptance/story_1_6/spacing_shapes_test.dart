/// ATDD Tests - Story 1.6: Spacing & Shape Tokens
/// Priority: P0
/// Status: 🟢 GREEN
library;

import 'package:english_pro/app/theme/animation_tokens.dart';
import 'package:english_pro/app/theme/breakpoints.dart';
import 'package:english_pro/app/theme/shape_tokens.dart';
import 'package:english_pro/app/theme/spacing_tokens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Story 1.6: Spacing Tokens @P0 @Unit', () {
    test('1.6-SPACE-001: Spacing follows 8dp grid', () {
      expect(AppSpacing.xs, 4);
      expect(AppSpacing.s, 8);
      expect(AppSpacing.m, 16);
      expect(AppSpacing.l, 24);
      expect(AppSpacing.xl, 32);
      expect(AppSpacing.xxl, 48);
    });

    test('1.6-SPACE-002: Touch targets defined', () {
      expect(AppSpacing.touchTargetMin, 48);
      expect(AppSpacing.touchTargetPrimary, 64);
    });
  });

  group('Story 1.6: Shape Tokens @P0 @Unit', () {
    test('1.6-SHAPE-001: Shape radii match spec', () {
      expect(AppShapes.small, 12);
      expect(AppShapes.medium, 16);
      expect(AppShapes.large, 20);
      expect(AppShapes.extraLarge, 28);
    });

    test(
      '1.6-SHAPE-002: BorderRadius helpers correct',
      () {
        expect(
          AppShapes.smallBorderRadius,
          BorderRadius.circular(12),
        );
        expect(
          AppShapes.mediumBorderRadius,
          BorderRadius.circular(16),
        );
        expect(
          AppShapes.largeBorderRadius,
          BorderRadius.circular(20),
        );
        expect(
          AppShapes.extraLargeBorderRadius,
          BorderRadius.circular(28),
        );
      },
    );
  });

  group('Story 1.6: Animation Tokens @P0 @Unit', () {
    test('1.6-ANIM-001: Animation durations defined', () {
      expect(
        AppAnimations.short,
        const Duration(milliseconds: 200),
      );
      expect(
        AppAnimations.medium,
        const Duration(milliseconds: 300),
      );
      expect(
        AppAnimations.long,
        const Duration(milliseconds: 500),
      );
    });

    test('1.6-ANIM-002: Default curve is easeInOut', () {
      expect(AppAnimations.defaultCurve, Curves.easeInOut);
    });
  });

  group('Story 1.6: Breakpoints @P0 @Unit', () {
    test('1.6-BREAK-001: Breakpoints match spec', () {
      expect(AppBreakpoints.compactPhone, 320);
      expect(AppBreakpoints.standardPhone, 360);
      expect(AppBreakpoints.largePhone, 400);
      expect(AppBreakpoints.smallTablet, 600);
      expect(AppBreakpoints.largeTablet, 840);
    });
  });
}
