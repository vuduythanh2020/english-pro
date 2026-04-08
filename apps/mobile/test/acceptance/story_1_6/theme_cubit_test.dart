/// ATDD Tests - Story 1.6: ThemeCubit
/// Test IDs: 1.6-CUBIT-001 through 1.6-CUBIT-007, 1.6-STATE-001/002
/// Priority: P0 (Critical — Theme State Management)
/// Status: 🟢 GREEN
library;

import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/core/theme/theme_cubit.dart';
import 'package:english_pro/core/theme/theme_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:mocktail/mocktail.dart';

class _MockStorage extends Mock implements Storage {}

void main() {
  late Storage storage;

  setUp(() {
    storage = _MockStorage();
    when(() => storage.write(any(), any<dynamic>())).thenAnswer((_) async {});
    when(() => storage.read(any())).thenReturn(null);
    when(() => storage.delete(any())).thenAnswer((_) async {});
    when(() => storage.clear()).thenAnswer((_) async {});
    HydratedBloc.storage = storage;
  });

  group('Story 1.6: ThemeCubit @P0 @Unit', () {
    test(
      '1.6-CUBIT-001: ThemeCubit default state '
      'is ThemeMode.light',
      () {
        final cubit = ThemeCubit();
        expect(cubit.state.themeMode, ThemeMode.light);
        addTearDown(cubit.close);
      },
    );

    test(
      '1.6-CUBIT-002: ThemeCubit emits ThemeMode.dark '
      'when setThemeMode(dark)',
      () {
        final cubit = ThemeCubit()..setThemeMode(ThemeMode.dark);
        expect(cubit.state.themeMode, ThemeMode.dark);
        addTearDown(cubit.close);
      },
    );

    test(
      '1.6-CUBIT-003: ThemeCubit emits ThemeMode.system '
      'when setThemeMode(system)',
      () {
        final cubit = ThemeCubit()..setThemeMode(ThemeMode.system);
        expect(cubit.state.themeMode, ThemeMode.system);
        addTearDown(cubit.close);
      },
    );

    test(
      '1.6-CUBIT-004: ThemeCubit.toJson() persists '
      'themeMode as string',
      () {
        final cubit = ThemeCubit()..setThemeMode(ThemeMode.dark);
        final json = cubit.toJson(cubit.state);
        expect(json, {'themeMode': 'dark'});
        addTearDown(cubit.close);
      },
    );

    test(
      '1.6-CUBIT-005: ThemeCubit.fromJson() restores '
      'ThemeMode from JSON',
      () {
        final cubit = ThemeCubit();
        final state = cubit.fromJson(
          const {'themeMode': 'dark'},
        );
        expect(state?.themeMode, ThemeMode.dark);
        addTearDown(cubit.close);
      },
    );

    test(
      '1.6-CUBIT-006: ThemeCubit.fromJson() returns '
      'light for unknown themeMode',
      () {
        final cubit = ThemeCubit();
        final state = cubit.fromJson(
          const {'themeMode': 'unknown_mode'},
        );
        // orElse fallback returns ThemeMode.light
        expect(state?.themeMode, ThemeMode.light);
        addTearDown(cubit.close);
      },
    );
  });

  group('Story 1.6: ThemeState @P0 @Unit', () {
    test(
      '1.6-STATE-001: ThemeState implements Equatable '
      'for comparison',
      () {
        const state1 = ThemeState(themeMode: ThemeMode.light);
        const state2 = ThemeState(themeMode: ThemeMode.light);
        const state3 = ThemeState(themeMode: ThemeMode.dark);

        expect(state1, equals(state2));
        expect(state1, isNot(equals(state3)));
      },
    );

    test(
      '1.6-STATE-002: ThemeState.props includes themeMode',
      () {
        const state = ThemeState(themeMode: ThemeMode.dark);
        expect(state.props, [ThemeMode.dark]);
      },
    );
  });

  group('Story 1.6: ThemeCubit BlocTest @P0 @Unit', () {
    blocTest<ThemeCubit, ThemeState>(
      '1.6-CUBIT-007: emits [dark, light, system] '
      'on multiple setThemeMode calls',
      build: ThemeCubit.new,
      act: (cubit) {
        cubit
          ..setThemeMode(ThemeMode.dark)
          ..setThemeMode(ThemeMode.light)
          ..setThemeMode(ThemeMode.system);
      },
      expect: () => [
        const ThemeState(themeMode: ThemeMode.dark),
        const ThemeState(themeMode: ThemeMode.light),
        const ThemeState(themeMode: ThemeMode.system),
      ],
    );
  });
}
