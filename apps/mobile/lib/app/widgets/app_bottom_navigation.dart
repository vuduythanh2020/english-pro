import 'package:english_pro/app/theme/breakpoints.dart';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

/// Material 3 bottom navigation bar with Phosphor Icons.
///
/// Displays 4 tabs: Home, Practice, Progress, Profile.
/// Active tab shows a filled icon + label; inactive shows outline only.
/// Labels are hidden on screens narrower than
/// [AppBreakpoints.standardPhone].
class AppBottomNavigation extends StatelessWidget {
  const AppBottomNavigation({
    required this.currentIndex,
    required this.onDestinationSelected,
    super.key,
  });

  /// Currently selected tab index (0-3).
  final int currentIndex;

  /// Callback when a tab is tapped.
  final ValueChanged<int> onDestinationSelected;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final showLabels = width >= AppBreakpoints.standardPhone;

    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: onDestinationSelected,
      labelBehavior: showLabels
          ? NavigationDestinationLabelBehavior.alwaysShow
          : NavigationDestinationLabelBehavior.alwaysHide,
      destinations: const [
        NavigationDestination(
          icon: PhosphorIcon(PhosphorIconsRegular.house),
          selectedIcon: PhosphorIcon(PhosphorIconsFill.house),
          label: 'Home',
        ),
        NavigationDestination(
          icon: PhosphorIcon(PhosphorIconsRegular.microphone),
          selectedIcon: PhosphorIcon(PhosphorIconsFill.microphone),
          label: 'Practice',
        ),
        NavigationDestination(
          icon: PhosphorIcon(PhosphorIconsRegular.chartBar),
          selectedIcon: PhosphorIcon(PhosphorIconsFill.chartBar),
          label: 'Progress',
        ),
        NavigationDestination(
          icon: PhosphorIcon(PhosphorIconsRegular.userCircle),
          selectedIcon: PhosphorIcon(PhosphorIconsFill.userCircle),
          label: 'Profile',
        ),
      ],
    );
  }
}
