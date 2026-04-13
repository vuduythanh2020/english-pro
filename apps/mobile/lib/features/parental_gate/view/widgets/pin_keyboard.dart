import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Custom numeric keyboard for PIN entry (Story 2.6).
///
/// Layout: 3 columns × 4 rows (1-9, biometric/0/backspace).
/// Uses [InkWell] for each key with 48×48 dp touch targets.
class PinKeyboard extends StatelessWidget {
  const PinKeyboard({
    required this.onDigit,
    required this.onBackspace,
    this.onBiometric,
    this.showBiometric = false,
    this.enabled = true,
    super.key,
  });

  /// Called when a digit key (0-9) is tapped.
  final ValueChanged<int> onDigit;

  /// Called when the backspace key is tapped.
  final VoidCallback onBackspace;

  /// Called when the biometric key is tapped (bottom-left).
  final VoidCallback? onBiometric;

  /// Whether to show the biometric button (bottom-left).
  final bool showBiometric;

  /// Whether the keyboard is enabled (disabled during cooldown/submitting).
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildRow([1, 2, 3]),
        const SizedBox(height: 12),
        _buildRow([4, 5, 6]),
        const SizedBox(height: 12),
        _buildRow([7, 8, 9]),
        const SizedBox(height: 12),
        _buildBottomRow(),
      ],
    );
  }

  Widget _buildRow(List<int> digits) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: digits.map(_buildDigitKey).toList(),
    );
  }

  Widget _buildBottomRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        // Bottom-left: biometric or empty
        if (showBiometric)
          _buildActionKey(
            child: Icon(
              Icons.fingerprint,
              size: 28,
              color: enabled
                  ? const Color(0xFF2D3142)
                  : const Color(0xFFBDBDBD),
            ),
            onTap: enabled ? onBiometric : null,
          )
        else
          const SizedBox(width: 72, height: 56),
        // Bottom-center: 0
        _buildDigitKey(0),
        // Bottom-right: backspace
        _buildActionKey(
          child: Icon(
            Icons.backspace_outlined,
            size: 24,
            color: enabled
                ? const Color(0xFF2D3142)
                : const Color(0xFFBDBDBD),
          ),
          onTap: enabled ? onBackspace : null,
        ),
      ],
    );
  }

  Widget _buildDigitKey(int digit) {
    return SizedBox(
      width: 72,
      height: 56,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: enabled
              ? () {
                  unawaited(HapticFeedback.lightImpact());
                  onDigit(digit);
                }
              : null,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            decoration: BoxDecoration(
              color: enabled
                  ? Colors.white
                  : const Color(0xFFF5F5F5),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                if (enabled)
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
              ],
            ),
            alignment: Alignment.center,
            child: Text(
              '$digit',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: enabled
                    ? const Color(0xFF2D3142)
                    : const Color(0xFFBDBDBD),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionKey({
    required Widget child,
    VoidCallback? onTap,
  }) {
    return SizedBox(
      width: 72,
      height: 56,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap != null
              ? () {
                  unawaited(HapticFeedback.lightImpact());
                  onTap();
                }
              : null,
          borderRadius: BorderRadius.circular(12),
          child: Center(child: child),
        ),
      ),
    );
  }
}
