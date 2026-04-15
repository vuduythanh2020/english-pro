import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/theme/theme_cubit.dart';
import 'package:english_pro/core/theme/theme_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

/// Parent settings hub screen (Story 2.7).
///
/// Sections:
/// - Appearance (theme toggle)
/// - Performance (placeholder)
/// - Dữ liệu & Quyền riêng tư (link to privacy_data_screen)
/// - Tài khoản (logout)
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Cài đặt')),
      body: BlocBuilder<ThemeCubit, ThemeState>(
        builder: (context, state) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // ── Appearance section ────────────────────────────────
              _SectionHeader(title: 'GIAO DIỆN'),
              const SizedBox(height: 8),
              _ThemeTile(
                title: 'Sáng',
                icon: PhosphorIconsRegular.sun,
                isSelected: state.themeMode == ThemeMode.light,
                onTap: () =>
                    context.read<ThemeCubit>().setThemeMode(ThemeMode.light),
              ),
              _ThemeTile(
                title: 'Tối',
                icon: PhosphorIconsRegular.moon,
                isSelected: state.themeMode == ThemeMode.dark,
                onTap: () =>
                    context.read<ThemeCubit>().setThemeMode(ThemeMode.dark),
              ),
              _ThemeTile(
                title: 'Hệ thống',
                icon: PhosphorIconsRegular.deviceMobile,
                isSelected: state.themeMode == ThemeMode.system,
                onTap: () =>
                    context.read<ThemeCubit>().setThemeMode(ThemeMode.system),
              ),

              const SizedBox(height: 24),

              // ── Performance section ──────────────────────────────
              _SectionHeader(title: 'HIỆU SUẤT'),
              const SizedBox(height: 8),
              const ListTile(
                leading: PhosphorIcon(PhosphorIconsRegular.gauge),
                title: Text('Mức hiệu suất'),
                subtitle: Text('Tự động phát hiện (placeholder)'),
                enabled: false,
              ),

              const SizedBox(height: 24),

              // ── Data & Privacy section ───────────────────────────
              _SectionHeader(title: 'DỮ LIỆU & QUYỀN RIÊNG TƯ'),
              const SizedBox(height: 8),
              ListTile(
                leading:
                    const PhosphorIcon(PhosphorIconsRegular.shieldCheck),
                title: const Text('Dữ liệu & Quyền riêng tư'),
                subtitle: const Text(
                  'Xem, xuất hoặc xóa dữ liệu của con',
                ),
                trailing:
                    const PhosphorIcon(PhosphorIconsRegular.caretRight),
                onTap: () => context.go('/settings/privacy-data'),
              ),

              const SizedBox(height: 24),

              // ── Account section ──────────────────────────────────
              _SectionHeader(title: 'TÀI KHOẢN'),
              const SizedBox(height: 8),
              ListTile(
                leading: PhosphorIcon(
                  PhosphorIconsRegular.signOut,
                  color: theme.colorScheme.error,
                ),
                title: Text(
                  'Đăng xuất',
                  style: TextStyle(color: theme.colorScheme.error),
                ),
                onTap: () {
                  showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Đăng xuất'),
                      content: const Text(
                        'Bạn có chắc chắn muốn đăng xuất?',
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('Hủy'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          child: Text(
                            'Đăng xuất',
                            style: TextStyle(
                              color: theme.colorScheme.error,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ).then((confirmed) {
                    if (confirmed == true && context.mounted) {
                      context.read<AuthBloc>().add(const AuthLoggedOut());
                    }
                  });
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Uppercase section header with muted color.
class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Text(
        title,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              fontSize: 12,
              letterSpacing: 1.2,
              color: const Color(0xFF9E9E9E),
            ),
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
