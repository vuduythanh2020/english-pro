/// ATDD Tests - Story 1.6: AppBottomNavigation
/// Priority: P0
/// Status: 🟢 GREEN
library;

import 'package:english_pro/app/theme/color_tokens.dart';
import 'package:english_pro/app/theme/text_theme.dart';
import 'package:english_pro/app/widgets/app_bottom_navigation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

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
  Widget buildSubject({
    int currentIndex = 0,
    ValueChanged<int>? onDestinationSelected,
    double width = 400,
  }) {
    return MaterialApp(
      theme: _testTheme(),
      home: MediaQuery(
        data: MediaQueryData(size: Size(width, 800)),
        child: Scaffold(
          bottomNavigationBar: AppBottomNavigation(
            currentIndex: currentIndex,
            onDestinationSelected: onDestinationSelected ?? (_) {},
          ),
        ),
      ),
    );
  }

  group('Story 1.6: AppBottomNavigation @P0 @Widget', () {
    testWidgets(
      '1.6-NAV-001: renders exactly 4 tabs',
      (tester) async {
        await tester.pumpWidget(buildSubject());

        expect(
          find.byType(NavigationDestination),
          findsNWidgets(4),
        );
      },
    );

    testWidgets(
      '1.6-NAV-002: displays correct labels',
      (tester) async {
        await tester.pumpWidget(buildSubject());

        expect(find.text('Home'), findsOneWidget);
        expect(find.text('Practice'), findsOneWidget);
        expect(find.text('Progress'), findsOneWidget);
        expect(find.text('Profile'), findsOneWidget);
      },
    );

    testWidgets(
      '1.6-NAV-003: tapping tab calls '
      'onDestinationSelected',
      (tester) async {
        int? tappedIndex;
        await tester.pumpWidget(
          buildSubject(
            onDestinationSelected: (i) => tappedIndex = i,
          ),
        );

        await tester.tap(find.text('Practice'));
        expect(tappedIndex, 1);
      },
    );

    testWidgets(
      '1.6-NAV-006: uses M3 NavigationBar widget',
      (tester) async {
        await tester.pumpWidget(buildSubject());

        expect(find.byType(NavigationBar), findsOneWidget);
      },
    );

    testWidgets(
      '1.6-NAV-007: renders in dark mode without errors',
      (tester) async {
        await tester.pumpWidget(
          MaterialApp(
            theme: _testTheme(brightness: Brightness.dark),
            home: Scaffold(
              bottomNavigationBar: AppBottomNavigation(
                currentIndex: 0,
                onDestinationSelected: (_) {},
              ),
            ),
          ),
        );

        expect(
          find.byType(NavigationBar),
          findsOneWidget,
        );
      },
    );
  });
}
