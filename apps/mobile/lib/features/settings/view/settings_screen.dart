import 'package:english_pro/core/theme/theme_cubit.dart';
import 'package:english_pro/core/theme/theme_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

/// Placeholder settings screen with theme toggle.
///
/// Allows the user to switch between Light, Dark, and System
/// theme modes. Performance tier selector is a placeholder
/// for Story 10.7.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: BlocBuilder<ThemeCubit, ThemeState>(
        builder: (context, state) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Appearance',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              _ThemeTile(
                title: 'Light',
                icon: PhosphorIconsRegular.sun,
                isSelected: state.themeMode == ThemeMode.light,
                onTap: () =>
                    context.read<ThemeCubit>().setThemeMode(ThemeMode.light),
              ),
              _ThemeTile(
                title: 'Dark',
                icon: PhosphorIconsRegular.moon,
                isSelected: state.themeMode == ThemeMode.dark,
                onTap: () =>
                    context.read<ThemeCubit>().setThemeMode(ThemeMode.dark),
              ),
              _ThemeTile(
                title: 'System',
                icon: PhosphorIconsRegular.deviceMobile,
                isSelected: state.themeMode == ThemeMode.system,
                onTap: () =>
                    context.read<ThemeCubit>().setThemeMode(ThemeMode.system),
              ),
              const SizedBox(height: 24),
              Text(
                'Performance',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              const ListTile(
                leading: PhosphorIcon(PhosphorIconsRegular.gauge),
                title: Text('Performance Tier'),
                subtitle: Text('Auto-detect (placeholder)'),
                enabled: false,
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ThemeTile extends StatelessWidget {
  const _ThemeTile({
    required this.title,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final String title;
  final PhosphorIconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: PhosphorIcon(icon),
      title: Text(title),
      trailing: isSelected
          ? PhosphorIcon(
              PhosphorIconsFill.checkCircle,
              color: Theme.of(context).colorScheme.primary,
            )
          : null,
      selected: isSelected,
      onTap: onTap,
    );
  }
}
