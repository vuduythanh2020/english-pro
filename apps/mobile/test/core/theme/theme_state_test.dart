/// Tests for ThemeState equatable class.
/// Validates equality, props, and value semantics.
/// Priority: P2
/// Status: NEW
library;

import 'package:english_pro/core/theme/theme_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ThemeState', () {
    test('two instances with same themeMode are equal', () {
      const a = ThemeState(themeMode: ThemeMode.light);
      const b = ThemeState(themeMode: ThemeMode.light);
      expect(a, equals(b));
    });

    test('instances with different themeMode are not equal', () {
      const light = ThemeState(themeMode: ThemeMode.light);
      const dark = ThemeState(themeMode: ThemeMode.dark);
      expect(light, isNot(equals(dark)));
    });

    test('props contains themeMode', () {
      const state = ThemeState(themeMode: ThemeMode.system);
      expect(state.props, [ThemeMode.system]);
    });

    test('supports all ThemeMode values', () {
      for (final mode in ThemeMode.values) {
        final state = ThemeState(themeMode: mode);
        expect(state.themeMode, mode);
      }
    });

    test('hashCode is equal for identical states', () {
      const a = ThemeState(themeMode: ThemeMode.dark);
      const b = ThemeState(themeMode: ThemeMode.dark);
      expect(a.hashCode, b.hashCode);
    });

    test('toString includes themeMode', () {
      const state = ThemeState(themeMode: ThemeMode.light);
      // Equatable's toString includes class name and props
      expect(state.toString(), contains('ThemeMode.light'));
    });
  });
}
