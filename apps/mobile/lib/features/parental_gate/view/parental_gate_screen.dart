import 'package:english_pro/features/parental_gate/bloc/parental_gate_bloc.dart';
import 'package:english_pro/features/parental_gate/bloc/parental_gate_event.dart';
import 'package:english_pro/features/parental_gate/bloc/parental_gate_state.dart';
import 'package:english_pro/features/parental_gate/view/widgets/pin_keyboard.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// Full-screen parental gate requiring PIN or biometric to proceed
/// (Story 2.6).
///
/// Wrapped in [PopScope] with `canPop: false` so that a child cannot
/// dismiss the screen via the system back button or swipe gesture.
class ParentalGateScreen extends StatelessWidget {
  const ParentalGateScreen({required this.onSuccess, super.key});

  /// Called when authentication succeeds (PIN correct or biometric passed).
  final VoidCallback onSuccess;

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: MultiBlocListener(
        listeners: [
          BlocListener<ParentalGateBloc, ParentalGateState>(
            listenWhen: (prev, curr) => curr is ParentalGateSuccess,
            listener: (context, state) => onSuccess(),
          ),
          BlocListener<ParentalGateBloc, ParentalGateState>(
            listenWhen: (prev, curr) => curr is ParentalGateFailure,
            listener: (context, state) {
              if (state is ParentalGateFailure) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: const Color(0xFFE5534B),
                  ),
                );
              }
            },
          ),
        ],
        child: Scaffold(
          backgroundColor: const Color(0xFFFFF8F0),
          appBar: AppBar(
            automaticallyImplyLeading: false,
            title: const Text(
              'Xác nhận phụ huynh',
              style: TextStyle(
                fontFamily: 'Nunito',
                fontWeight: FontWeight.bold,
                fontSize: 20,
                color: Color(0xFF2D3142),
              ),
            ),
            centerTitle: true,
            backgroundColor: const Color(0xFFFFF8F0),
            elevation: 0,
          ),
          body: SafeArea(
            child: BlocBuilder<ParentalGateBloc, ParentalGateState>(
              builder: (context, state) {
                if (state is ParentalGateLoading ||
                    state is ParentalGateInitial) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state is ParentalGateVerifying) {
                  return _VerifyingBody(state: state);
                }

                // ParentalGateSuccess / Failure handled by listeners
                return const SizedBox.shrink();
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _VerifyingBody extends StatelessWidget {
  const _VerifyingBody({required this.state});

  final ParentalGateVerifying state;

  String get _title {
    switch (state.mode) {
      case 'verify':
        return 'Nhập mã PIN phụ huynh';
      case 'setup_first':
        return 'Tạo mã PIN mới (4 chữ số)';
      case 'setup_confirm':
        return 'Xác nhận mã PIN';
      default:
        return '';
    }
  }

  String? get _subtitle {
    switch (state.mode) {
      case 'setup_first':
        return 'Bước 1/2';
      case 'setup_confirm':
        return 'Bước 2/2';
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ParentalGateBloc>();

    return Column(
      children: [
        const SizedBox(height: 32),
        // Lock icon
        const Icon(
          Icons.lock_outline,
          size: 48,
          color: Color(0xFF2D3142),
        ),
        const SizedBox(height: 16),
        // Title
        Text(
          _title,
          style: const TextStyle(
            fontFamily: 'Nunito',
            fontWeight: FontWeight.bold,
            fontSize: 20,
            color: Color(0xFF2D3142),
          ),
        ),
        if (_subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            _subtitle!,
            style: const TextStyle(
              fontFamily: 'Nunito',
              fontSize: 14,
              color: Color(0xFF9E9E9E),
            ),
          ),
        ],
        const SizedBox(height: 32),
        // PIN dot indicators
        _PinDots(filledCount: state.digitCount),
        const SizedBox(height: 16),
        // Error / cooldown message
        SizedBox(
          height: 24,
          child: _buildMessage(),
        ),
        const Spacer(),
        // Numeric keyboard
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 48),
          child: PinKeyboard(
            onDigit: (digit) =>
                bloc.add(ParentalGatePinDigitAdded(digit)),
            onBackspace: () =>
                bloc.add(const ParentalGatePinDigitRemoved()),
            onBiometric: () =>
                bloc.add(const ParentalGateBiometricRequested()),
            showBiometric:
                state.canUseBiometric && state.mode == 'verify',
            enabled: !state.isCooldown && !state.isSubmitting,
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildMessage() {
    if (state.isCooldown) {
      return Text(
        'Vui lòng thử lại sau ${state.cooldownSecondsLeft} giây',
        style: const TextStyle(
          fontFamily: 'Nunito',
          fontSize: 14,
          color: Color(0xFFE5534B),
        ),
      );
    }

    if (state.errorMessage != null) {
      return Text(
        state.errorMessage!,
        style: const TextStyle(
          fontFamily: 'Nunito',
          fontSize: 14,
          color: Color(0xFFE5534B),
        ),
      );
    }

    return const SizedBox.shrink();
  }
}

/// Four dot indicators showing how many PIN digits have been entered.
class _PinDots extends StatelessWidget {
  const _PinDots({required this.filledCount});

  final int filledCount;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(4, (index) {
        final filled = index < filledCount;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: filled
                  ? const Color(0xFF2D3142) // Midnight Navy
                  : const Color(0xFFE0E0E0), // Empty dot
            ),
          ),
        );
      }),
    );
  }
}
