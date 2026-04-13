import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

/// Child-mode bottom navigation bar (Story 2.5).
///
/// Displays 4 tabs: Home, Practice, Progress, Profile.
/// Uses Coral primary (#FF6B6B) for active state.
/// Touch target: 48x80dp per item (UX spec — generous for kids' fingers).
class ChildBottomNavigationBar extends StatelessWidget {
  const ChildBottomNavigationBar({
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
    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: onDestinationSelected,
      backgroundColor: Colors.white,
      indicatorColor: const Color(0xFFFF6B6B).withValues(alpha: 0.15),
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      destinations: const [
        NavigationDestination(
          icon: PhosphorIcon(PhosphorIconsRegular.house),
          selectedIcon: PhosphorIcon(
            PhosphorIconsFill.house,
            color: Color(0xFFFF6B6B),
          ),
          label: 'Home',
        ),
        NavigationDestination(
          icon: PhosphorIcon(PhosphorIconsRegular.microphone),
          selectedIcon: PhosphorIcon(
            PhosphorIconsFill.microphone,
            color: Color(0xFFFF6B6B),
          ),
          label: 'Practice',
        ),
        NavigationDestination(
          icon: PhosphorIcon(PhosphorIconsRegular.chartBar),
          selectedIcon: PhosphorIcon(
            PhosphorIconsFill.chartBar,
            color: Color(0xFFFF6B6B),
          ),
          label: 'Progress',
        ),
        NavigationDestination(
          icon: PhosphorIcon(PhosphorIconsRegular.userCircle),
          selectedIcon: PhosphorIcon(
            PhosphorIconsFill.userCircle,
            color: Color(0xFFFF6B6B),
          ),
          label: 'Profile',
        ),
      ],
    );
  }
}
