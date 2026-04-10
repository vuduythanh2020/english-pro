import 'package:flutter/material.dart';

/// Visual password strength indicator with criteria checklist.
///
/// Shows color-coded bar and individual criteria status:
/// - Min 8 characters
/// - At least 1 uppercase letter
/// - At least 1 number
class PasswordStrengthIndicator extends StatelessWidget {
  const PasswordStrengthIndicator({
    required this.hasMinLength,
    required this.hasUppercase,
    required this.hasDigit,
    super.key,
  });

  final bool hasMinLength;
  final bool hasUppercase;
  final bool hasDigit;

  int get _score => [hasMinLength, hasUppercase, hasDigit].where((v) => v).length;

  Color get _barColor => switch (_score) {
    0 => Colors.grey.shade300,
    1 => Colors.red,
    2 => Colors.orange,
    3 => Colors.green,
    _ => Colors.grey.shade300,
  };

  String get _strengthLabel => switch (_score) {
    0 => '',
    1 => 'Yếu',
    2 => 'Trung bình',
    3 => 'Mạnh',
    _ => '',
  };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Strength bar
        Row(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: _score / 3,
                  backgroundColor: Colors.grey.shade200,
                  color: _barColor,
                  minHeight: 6,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              _strengthLabel,
              style: theme.textTheme.bodySmall?.copyWith(color: _barColor),
            ),
          ],
        ),
        const SizedBox(height: 8),
        // Criteria checklist
        _CriteriaItem(met: hasMinLength, label: 'Ít nhất 8 ký tự'),
        _CriteriaItem(met: hasUppercase, label: '1 chữ cái viết hoa (A-Z)'),
        _CriteriaItem(met: hasDigit, label: '1 chữ số (0-9)'),
      ],
    );
  }
}

class _CriteriaItem extends StatelessWidget {
  const _CriteriaItem({required this.met, required this.label});

  final bool met;
  final String label;

  @override
  Widget build(BuildContext context) {
    final color = met ? Colors.green : Colors.grey;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(
            met ? Icons.check_circle : Icons.circle_outlined,
            size: 16,
            color: color,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: color),
          ),
        ],
      ),
    );
  }
}
