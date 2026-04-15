import 'package:english_pro/features/settings/bloc/privacy_data_bloc.dart';
import 'package:english_pro/features/settings/bloc/privacy_data_event.dart';
import 'package:english_pro/features/settings/bloc/privacy_data_state.dart';
import 'package:english_pro/features/settings/view/widgets/delete_account_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

/// Privacy & Data management screen (Story 2.7).
///
/// Sections:
/// - CHÍNH SÁCH: Privacy policy WebView, data collection info
/// - DỮ LIỆU CỦA CON: View data, export JSON
/// - TÀI KHOẢN (Danger Zone): Delete account
class PrivacyDataScreen extends StatelessWidget {
  const PrivacyDataScreen({super.key});

  /// Design tokens from Story 1.6 / 2.7.
  static const _dangerZoneBg = Color(0xFFFFEBEE);
  static const _dangerZoneBorder = Color(0xFFEF9A9A);
  static const _destructiveText = Color(0xFFE5534B);
  static const _sectionHeaderColor = Color(0xFF9E9E9E);

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<PrivacyDataBloc, PrivacyDataState>(
          listenWhen: (prev, curr) => curr is PrivacyDataExportSuccess,
          listener: (context, state) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Dữ liệu đã được xuất thành công'),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
        ),
        BlocListener<PrivacyDataBloc, PrivacyDataState>(
          listenWhen: (prev, curr) => curr is PrivacyDataDeleteSuccess,
          listener: (context, state) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Tài khoản đã được xóa thành công'),
                behavior: SnackBarBehavior.floating,
              ),
            );
            context.go('/profile-selection');
          },
        ),
        BlocListener<PrivacyDataBloc, PrivacyDataState>(
          listenWhen: (prev, curr) => curr is PrivacyDataFailure,
          listener: (context, state) {
            final failure = state as PrivacyDataFailure;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(failure.message),
                behavior: SnackBarBehavior.floating,
                backgroundColor: Theme.of(context).colorScheme.error,
              ),
            );
          },
        ),
      ],
      child: Scaffold(
        appBar: AppBar(title: const Text('Dữ liệu & Quyền riêng tư')),
        body: BlocBuilder<PrivacyDataBloc, PrivacyDataState>(
          builder: (context, state) {
            final isLoading =
                state is PrivacyDataLoading || state is PrivacyDataExporting;
            final isDeleting = state is PrivacyDataDeleteInProgress;

            return Stack(
              children: [
                ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // ── CHÍNH SÁCH section ─────────────────────────
                    _SectionHeader(
                      title: 'CHÍNH SÁCH',
                      color: _sectionHeaderColor,
                    ),
                    const SizedBox(height: 8),
                    ListTile(
                      leading: const PhosphorIcon(
                        PhosphorIconsRegular.shieldCheck,
                      ),
                      title: const Text('Chính sách quyền riêng tư'),
                      trailing: const PhosphorIcon(
                        PhosphorIconsRegular.caretRight,
                      ),
                      onTap: () => context.go('/settings/privacy-policy'),
                    ),
                    ListTile(
                      leading: const PhosphorIcon(
                        PhosphorIconsRegular.info,
                      ),
                      title: const Text('Dữ liệu chúng tôi thu thập'),
                      trailing: const PhosphorIcon(
                        PhosphorIconsRegular.caretRight,
                      ),
                      onTap: () => _showDataCollectionInfo(context),
                    ),

                    const SizedBox(height: 24),

                    // ── DỮ LIỆU CỦA CON section ──────────────────
                    _SectionHeader(
                      title: 'DỮ LIỆU CỦA CON',
                      color: _sectionHeaderColor,
                    ),
                    const SizedBox(height: 8),
                    ListTile(
                      leading: const PhosphorIcon(
                        PhosphorIconsRegular.chartBar,
                      ),
                      title: const Text('Xem dữ liệu của con'),
                      trailing: const PhosphorIcon(
                        PhosphorIconsRegular.caretRight,
                      ),
                      // F04 fix: pass childId via extra so the child-data route
                      // can instantiate PrivacyDataBloc with the correct childId.
                      onTap: () => context.go(
                        '/settings/child-data',
                        extra: context.read<PrivacyDataBloc>().childId,
                      ),
                    ),
                    ListTile(
                      leading: const PhosphorIcon(
                        PhosphorIconsRegular.arrowSquareOut,
                      ),
                      title: const Text('Xuất dữ liệu (JSON)'),
                      subtitle: const Text(
                        'Tải về tất cả dữ liệu qua share sheet',
                      ),
                      enabled: !isLoading,
                      onTap: () => context
                          .read<PrivacyDataBloc>()
                          .add(const PrivacyDataExportRequested()),
                    ),

                    const SizedBox(height: 24),

                    // ── TÀI KHOẢN (Danger Zone) ───────────────────
                    _SectionHeader(
                      title: 'TÀI KHOẢN',
                      color: _destructiveText,
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        color: _dangerZoneBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _dangerZoneBorder),
                      ),
                      child: ListTile(
                        leading: PhosphorIcon(
                          PhosphorIconsRegular.trash,
                          color: _destructiveText,
                        ),
                        title: Text(
                          'Xóa tài khoản',
                          style: TextStyle(color: _destructiveText),
                        ),
                        subtitle: const Text(
                          'Xóa vĩnh viễn tất cả dữ liệu. '
                          'Không thể hoàn tác.',
                        ),
                        enabled: !isDeleting,
                        onTap: () async {
                          final confirmed = await showDialog<bool>(
                            context: context,
                            barrierDismissible: false,
                            builder: (_) => const DeleteAccountDialog(),
                          );
                          if (confirmed == true && context.mounted) {
                            context
                                .read<PrivacyDataBloc>()
                                .add(const PrivacyDataDeleteConfirmed());
                          }
                        },
                      ),
                    ),

                    const SizedBox(height: 24),

                    // ── Voice data disclaimer ─────────────────────
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        '* Dữ liệu giọng nói không được lưu trữ '
                        'trên máy chủ (FR24).',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(fontStyle: FontStyle.italic),
                      ),
                    ),
                  ],
                ),

                // Loading overlay
                if (isLoading || isDeleting)
                  Positioned.fill(
                    child: ColoredBox(
                      color: Colors.black26,
                      child: Center(
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const CircularProgressIndicator(),
                                const SizedBox(height: 16),
                                Text(
                                  isDeleting
                                      ? 'Đang xóa tài khoản...'
                                      : 'Đang xử lý...',
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  /// Shows a bottom sheet with info about what data is collected.
  void _showDataCollectionInfo(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => Padding(
          padding: const EdgeInsets.all(24),
          child: ListView(
            controller: scrollController,
            children: [
              Text(
                'Dữ liệu chúng tôi thu thập',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              const _DataInfoTile(
                icon: PhosphorIconsRegular.user,
                title: 'Thông tin hồ sơ',
                description: 'Tên, tuổi, avatar của con.',
              ),
              const _DataInfoTile(
                icon: PhosphorIconsRegular.bookOpen,
                title: 'Tiến độ học tập',
                description:
                    'Phiên hội thoại, kịch bản đã hoàn thành, XP kiếm được.',
              ),
              const _DataInfoTile(
                icon: PhosphorIconsRegular.microphone,
                title: 'Điểm phát âm',
                description:
                    'Điểm đánh giá phát âm từ các phiên luyện tập. '
                    'Dữ liệu giọng nói KHÔNG được lưu.',
              ),
              const _DataInfoTile(
                icon: PhosphorIconsRegular.trophy,
                title: 'Huy hiệu',
                description: 'Huy hiệu đã đạt được trong quá trình học.',
              ),
              const SizedBox(height: 16),
              // F08 fix: explicitly mention IDFA/AAID to satisfy AC6
              Text(
                'Chúng tôi không thu thập hoặc lưu trữ dữ liệu '
                'giọng nói. Tất cả âm thanh được xử lý trong '
                'phiên và xóa ngay lập tức.',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(fontStyle: FontStyle.italic),
              ),
              const SizedBox(height: 8),
              Text(
                'Chúng tôi KHÔNG thu thập mã định danh quảng cáo '
                'IDFA (iOS) hoặc AAID (Android). (FR36)',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(fontStyle: FontStyle.italic),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Section header with uppercase label.
class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.color});

  final String title;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Text(
        title,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              fontSize: 12,
              letterSpacing: 1.2,
              color: color,
            ),
      ),
    );
  }
}

/// Info tile used in the data collection bottom sheet.
class _DataInfoTile extends StatelessWidget {
  const _DataInfoTile({
    required this.icon,
    required this.title,
    required this.description,
  });

  final PhosphorIconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PhosphorIcon(icon, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
