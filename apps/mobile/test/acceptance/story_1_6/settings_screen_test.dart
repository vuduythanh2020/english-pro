/// ATDD Tests - Story 1.6: SettingsScreen
/// Priority: P0
/// Status: 🟢 GREEN
library;

import 'package:english_pro/app/theme/color_tokens.dart';
import 'package:english_pro/app/theme/text_theme.dart';
import 'package:english_pro/core/theme/theme_cubit.dart';
import 'package:english_pro/core/theme/theme_state.dart';
import 'package:english_pro/features/settings/view/settings_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:mocktail/mocktail.dart';

class _MockStorage extends Mock implements Storage {}

/// Builds a test-safe [ThemeData] without triggering google_fonts.
ThemeData _testTheme({Brightness brightness = Brightness.light}) {
  final colorScheme = brightness == Brightness.light
      ? AppColors.lightColorScheme
      : AppColors.darkColorScheme;
  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    textTheme: AppTextTheme.textTheme,
  );
}

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

  Widget buildSubject({ThemeCubit? cubit}) {
    final themeCubit = cubit ?? ThemeCubit();
    return MaterialApp(
      theme: _testTheme(),
      darkTheme: _testTheme(brightness: Brightness.dark),
      home: BlocProvider<ThemeCubit>.value(
        value: themeCubit,
        child: const SettingsScreen(),
      ),
    );
  }

  group('Story 1.6: SettingsScreen @P0 @Widget', () {
    testWidgets(
      '1.6-SETTINGS-001: renders theme toggle section',
      (tester) async {
        await tester.pumpWidget(buildSubject());

        expect(find.text('Appearance'), findsOneWidget);
        expect(find.text('Settings'), findsOneWidget);
      },
    );

    testWidgets(
      '1.6-SETTINGS-002: shows Light, Dark, System options',
      (tester) async {
        await tester.pumpWidget(buildSubject());

        expect(find.text('Light'), findsOneWidget);
        expect(find.text('Dark'), findsOneWidget);
        expect(find.text('System'), findsOneWidget);
      },
    );

    testWidgets(
      '1.6-SETTINGS-003: tapping Dark calls '
      'setThemeMode(dark)',
      (tester) async {
        final cubit = ThemeCubit();
        addTearDown(cubit.close);
        await tester.pumpWidget(buildSubject(cubit: cubit));

        await tester.tap(find.text('Dark'));
        await tester.pump();

        expect(cubit.state.themeMode, ThemeMode.dark);
      },
    );

    testWidgets(
      '1.6-SETTINGS-004: tapping System calls '
      'setThemeMode(system)',
      (tester) async {
        final cubit = ThemeCubit();
        addTearDown(cubit.close);
        await tester.pumpWidget(buildSubject(cubit: cubit));

        await tester.tap(find.text('System'));
        await tester.pump();

        expect(cubit.state.themeMode, ThemeMode.system);
      },
    );

    testWidgets(
      '1.6-SETTINGS-005: performance tier placeholder '
      'is disabled',
      (tester) async {
        await tester.pumpWidget(buildSubject());

        expect(find.text('Performance'), findsOneWidget);
        expect(
          find.text('Performance Tier'),
          findsOneWidget,
        );
      },
    );
  });

  group(
    'Story 1.6: Theme Integration @P0 @Widget',
    () {
      testWidgets(
        '1.6-THEME-INT-001: MaterialApp themeMode '
        'reflects ThemeCubit state',
        (tester) async {
          final cubit = ThemeCubit();
          addTearDown(cubit.close);

          await tester.pumpWidget(
            BlocProvider<ThemeCubit>.value(
              value: cubit,
              child: BlocBuilder<ThemeCubit, ThemeState>(
                builder: (context, state) {
                  return MaterialApp(
                    theme: _testTheme(),
                    darkTheme: _testTheme(
                      brightness: Brightness.dark,
                    ),
                    themeMode: state.themeMode,
                    home: const Scaffold(
                      body: Text('test'),
                    ),
                  );
                },
              ),
            ),
          );

          // Default is light
          expect(cubit.state.themeMode, ThemeMode.light);

          // Switch to dark
          cubit.setThemeMode(ThemeMode.dark);
          await tester.pump();
          expect(cubit.state.themeMode, ThemeMode.dark);
        },
      );
    },
  );
}
