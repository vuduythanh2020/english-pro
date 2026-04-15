import 'package:english_pro/features/settings/bloc/privacy_data_bloc.dart';
import 'package:english_pro/features/settings/bloc/privacy_data_event.dart';
import 'package:english_pro/features/settings/bloc/privacy_data_state.dart';
import 'package:english_pro/features/settings/models/child_data_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

/// Screen displaying detailed child data (Story 2.7 — Task 4.3).
///
/// Shows profile info, learning progress, pronunciation scores,
/// and badges in card-based layout. Includes a note about voice
/// data not being stored (FR24).
class ChildDataViewScreen extends StatelessWidget {
  const ChildDataViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PrivacyDataBloc, PrivacyDataState>(
      builder: (context, state) {
        final String title;
        if (state is PrivacyDataLoaded) {
          title = 'Dữ liệu của ${state.data.profile.name}';
        } else {
          title = 'Dữ liệu của con';
        }

        return Scaffold(
          appBar: AppBar(title: Text(title)),
          body: _buildBody(context, state),
          floatingActionButton: state is PrivacyDataLoaded
              ? FloatingActionButton.extended(
                  onPressed: () => context
                      .read<PrivacyDataBloc>()
                      .add(const PrivacyDataExportRequested()),
                  icon: const PhosphorIcon(PhosphorIconsRegular.arrowSquareOut),
                  label: const Text('Xuất dữ liệu'),
                )
              : null,
        );
      },
    );
  }

  Widget _buildBody(BuildContext context, PrivacyDataState state) {
    if (state is PrivacyDataLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state is PrivacyDataFailure) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const PhosphorIcon(
              PhosphorIconsRegular.warning,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              state.message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context
                  .read<PrivacyDataBloc>()
                  .add(const PrivacyDataStarted()),
              child: const Text('Thử lại'),
            ),
          ],
        ),
      );
    }

    if (state is PrivacyDataLoaded) {
      return _DataContent(data: state.data);
    }

    // Initial or other states — trigger load
    return const Center(child: CircularProgressIndicator());
  }
}

class _DataContent extends StatelessWidget {
  const _DataContent({required this.data});

  final ChildDataModel data;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final profile = data.profile;
    final progress = data.learningProgress;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // ── Profile card ───────────────────────────────────────────
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const PhosphorIcon(
                      PhosphorIconsRegular.user,
                      size: 24,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Thông tin hồ sơ',
                      style: theme.textTheme.titleMedium,
                    ),
                  ],
                ),
                const Divider(height: 24),
                _InfoRow(label: 'Tên', value: profile.name),
                _InfoRow(label: 'Avatar', value: '#${profile.avatar}'),
                if (profile.age != null)
                  _InfoRow(label: 'Tuổi', value: '${profile.age}'),
                _InfoRow(label: 'Ngày tham gia', value: profile.createdAt),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),

        // ── Learning progress card ─────────────────────────────────
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const PhosphorIcon(
                      PhosphorIconsRegular.bookOpen,
                      size: 24,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Tiến độ học tập',
                      style: theme.textTheme.titleMedium,
                    ),
                  ],
                ),
                const Divider(height: 24),
                _InfoRow(
                  label: 'Tổng phiên',
                  value: '${progress.totalSessions}',
                ),
                if (progress.sessions.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Phiên gần đây',
                    style: theme.textTheme.labelMedium,
                  ),
                  const SizedBox(height: 4),
                  ...progress.sessions.take(5).map(
                        (s) => _SessionTile(session: s),
                      ),
                ],
                if (progress.sessions.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Text(
                      'Chưa có phiên học nào.',
                      style: TextStyle(fontStyle: FontStyle.italic),
                    ),
                  ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),

        // ── Pronunciation scores card ──────────────────────────────
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const PhosphorIcon(
                      PhosphorIconsRegular.microphone,
                      size: 24,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Điểm phát âm',
                      style: theme.textTheme.titleMedium,
                    ),
                  ],
                ),
                const Divider(height: 24),
                if (data.pronunciationScores.isEmpty)
                  const Text(
                    'Chưa có dữ liệu phát âm.',
                    style: TextStyle(fontStyle: FontStyle.italic),
                  )
                else
                  ...data.pronunciationScores.take(10).map(
                        (ps) => _PronunciationTile(score: ps),
                      ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),

        // ── Badges card ────────────────────────────────────────────
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const PhosphorIcon(
                      PhosphorIconsRegular.trophy,
                      size: 24,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Huy hiệu',
                      style: theme.textTheme.titleMedium,
                    ),
                  ],
                ),
                const Divider(height: 24),
                if (data.badges.isEmpty)
                  const Text(
                    'Chưa có huy hiệu nào.',
                    style: TextStyle(fontStyle: FontStyle.italic),
                  )
                else
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: data.badges
                        .map((b) => _BadgeChip(badge: b))
                        .toList(),
                  ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // ── Voice data disclaimer ──────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            '* Dữ liệu giọng nói không được lưu trữ '
            'trên máy chủ (FR24).',
            style: theme.textTheme.bodySmall?.copyWith(
              fontStyle: FontStyle.italic,
            ),
          ),
        ),

        // Extra space for FAB
        const SizedBox(height: 80),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          Flexible(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}

class _SessionTile extends StatelessWidget {
  const _SessionTile({required this.session});

  final ConversationSessionData session;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Expanded(
            child: Text(
              session.scenarioId,
              style: Theme.of(context).textTheme.bodySmall,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '${session.xpEarned} XP',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(width: 8),
          Text(
            _formatDuration(session.durationSeconds),
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes}m ${secs}s';
  }
}

class _PronunciationTile extends StatelessWidget {
  const _PronunciationTile({required this.score});

  final PronunciationScoreData score;

  @override
  Widget build(BuildContext context) {
    final scorePercent = (score.score * 100).round();
    final color = scorePercent >= 80
        ? Colors.green
        : scorePercent >= 50
            ? Colors.orange
            : Colors.red;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  score.word,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (score.phoneme != null)
                  Text(
                    '/${score.phoneme}/',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[500],
                        ),
                  ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 8,
              vertical: 4,
            ),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '$scorePercent%',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BadgeChip extends StatelessWidget {
  const _BadgeChip({required this.badge});

  final BadgeData badge;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: const PhosphorIcon(PhosphorIconsRegular.medal, size: 18),
      label: Text(badge.name),
    );
  }
}
