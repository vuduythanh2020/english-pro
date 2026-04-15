import 'package:flutter/material.dart';

/// Confirmation dialog for account deletion (Story 2.7 — Task 4.5).
///
/// Requires the parent to type "XÓA" to confirm the destructive action.
/// Returns `true` via `Navigator.pop` if confirmed, `false` if cancelled.
class DeleteAccountDialog extends StatefulWidget {
  const DeleteAccountDialog({super.key});

  /// The confirmation keyword the parent must type.
  static const confirmationKeyword = 'XÓA';

  @override
  State<DeleteAccountDialog> createState() => _DeleteAccountDialogState();
}

class _DeleteAccountDialogState extends State<DeleteAccountDialog> {
  final _controller = TextEditingController();
  bool _confirmEnabled = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      final isMatch =
          _controller.text.trim() == DeleteAccountDialog.confirmationKeyword;
      if (isMatch != _confirmEnabled) {
        setState(() => _confirmEnabled = isMatch);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    const destructiveColor = Color(0xFFE5534B);

    return AlertDialog(
      title: const Text('Xóa tài khoản'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu '
            'của con. Không thể hoàn tác.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Dữ liệu bị xóa bao gồm:',
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '• Thông tin hồ sơ\n'
            '• Tiến độ học tập\n'
            '• Điểm phát âm\n'
            '• Huy hiệu đã đạt',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            decoration: InputDecoration(
              labelText: 'Gõ "${DeleteAccountDialog.confirmationKeyword}" '
                  'để xác nhận',
              border: const OutlineInputBorder(),
            ),
            autofocus: true,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Hủy'),
        ),
        TextButton(
          onPressed: _confirmEnabled
              ? () => Navigator.pop(context, true)
              : null,
          child: Text(
            'Xóa vĩnh viễn',
            style: TextStyle(
              color: _confirmEnabled ? destructiveColor : null,
            ),
          ),
        ),
      ],
    );
  }
}
