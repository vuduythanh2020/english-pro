import 'dart:async';
import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:english_pro/core/constants/app_constants.dart';
import 'package:english_pro/features/parental_gate/bloc/parental_gate_event.dart';
import 'package:english_pro/features/parental_gate/bloc/parental_gate_state.dart';
import 'package:english_pro/features/parental_gate/services/parental_gate_service.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// BLoC managing the parental gate PIN verification and setup flow
/// (Story 2.6).
class ParentalGateBloc extends Bloc<ParentalGateEvent, ParentalGateState> {
  ParentalGateBloc({required ParentalGateService parentalGateService})
    : _service = parentalGateService,
      super(const ParentalGateInitial()) {
    on<ParentalGateStarted>(_onStarted);
    on<ParentalGatePinDigitAdded>(_onDigitAdded);
    on<ParentalGatePinDigitRemoved>(_onDigitRemoved);
    on<ParentalGatePinSubmitted>(_onPinSubmitted);
    on<ParentalGateBiometricRequested>(_onBiometricRequested);
    on<ParentalGateSetupPinConfirmed>(_onSetupPinConfirmed);
    on<ParentalGateCooldownTick>(_onCooldownTick);
  }

  final ParentalGateService _service;
  Timer? _cooldownTimer;

  // ── Event Handlers ─────────────────────────────────────────────────

  Future<void> _onStarted(
    ParentalGateStarted event,
    Emitter<ParentalGateState> emit,
  ) async {
    emit(const ParentalGateLoading());

    try {
      final pinSet = await _service.isPinSet();
      final biometric = await _service.canUseBiometric();

      emit(
        ParentalGateVerifying(
          mode: pinSet ? 'verify' : 'setup_first',
          canUseBiometric: biometric,
        ),
      );
    } on Exception catch (e) {
      emit(
        ParentalGateFailure(
          message: 'Không thể khởi động parental gate: $e',
          errorId: DateTime.now().microsecondsSinceEpoch,
        ),
      );
    }
  }

  Future<void> _onDigitAdded(
    ParentalGatePinDigitAdded event,
    Emitter<ParentalGateState> emit,
  ) async {
    final current = state;
    if (current is! ParentalGateVerifying) return;
    if (current.isSubmitting || current.isCooldown) return;
    if (current.digitCount >= 4) return;

    final newPin = '${current.currentPin}${event.digit}';
    final newCount = current.digitCount + 1;

    if (newCount == 4) {
      // Auto-submit when 4 digits entered
      emit(current.copyWith(
        currentPin: newPin,
        digitCount: newCount,
        isSubmitting: true,
        clearError: true,
      ));
      await _handlePinComplete(newPin, current, emit);
    } else {
      emit(current.copyWith(
        currentPin: newPin,
        digitCount: newCount,
        clearError: true,
      ));
    }
  }

  void _onDigitRemoved(
    ParentalGatePinDigitRemoved event,
    Emitter<ParentalGateState> emit,
  ) {
    final current = state;
    if (current is! ParentalGateVerifying) return;
    if (current.isSubmitting || current.isCooldown) return;
    if (current.digitCount == 0) return;

    final newPin = current.currentPin.substring(
      0,
      current.currentPin.length - 1,
    );
    emit(current.copyWith(
      currentPin: newPin,
      digitCount: current.digitCount - 1,
    ));
  }

  Future<void> _onPinSubmitted(
    ParentalGatePinSubmitted event,
    Emitter<ParentalGateState> emit,
  ) async {
    final current = state;
    if (current is! ParentalGateVerifying) return;
    if (current.isSubmitting) return;
    if (current.digitCount != 4) return;

    emit(current.copyWith(isSubmitting: true));
    await _handlePinComplete(current.currentPin, current, emit);
  }

  Future<void> _onBiometricRequested(
    ParentalGateBiometricRequested event,
    Emitter<ParentalGateState> emit,
  ) async {
    final current = state;
    if (current is! ParentalGateVerifying) return;
    if (current.isSubmitting) return;
    if (!current.canUseBiometric) return;

    emit(current.copyWith(isSubmitting: true));
    final success = await _service.authenticateWithBiometric();

    if (success) {
      emit(const ParentalGateSuccess());
    } else {
      // Biometric failed/cancelled — fallback to PIN
      emit(current.copyWith(isSubmitting: false));
    }
  }

  Future<void> _onSetupPinConfirmed(
    ParentalGateSetupPinConfirmed event,
    Emitter<ParentalGateState> emit,
  ) async {
    // This event is handled via auto-submit in _handlePinComplete
    // when mode is setup_confirm. Kept for API completeness.
  }

  void _onCooldownTick(
    ParentalGateCooldownTick event,
    Emitter<ParentalGateState> emit,
  ) {
    final current = state;
    if (current is! ParentalGateVerifying) return;
    if (!current.isCooldown) return;

    if (event.secondsLeft <= 0) {
      // Cooldown complete — reset attempts and allow input again
      emit(ParentalGateVerifying(
        mode: current.mode,
        canUseBiometric: current.canUseBiometric,
      ));
    } else {
      emit(current.copyWith(
        cooldownSecondsLeft: event.secondsLeft,
      ));
    }
  }

  // ── Internal Logic ─────────────────────────────────────────────────

  Future<void> _handlePinComplete(
    String pin,
    ParentalGateVerifying current,
    Emitter<ParentalGateState> emit,
  ) async {
    switch (current.mode) {
      case 'verify':
        await _handleVerify(pin, current, emit);
      case 'setup_first':
        _handleSetupFirst(pin, current, emit);
      case 'setup_confirm':
        await _handleSetupConfirm(pin, current, emit);
      default:
        // Unknown mode — reset isSubmitting to unblock UI (F-1 fix).
        emit(current.copyWith(isSubmitting: false));
    }
  }

  Future<void> _handleVerify(
    String pin,
    ParentalGateVerifying current,
    Emitter<ParentalGateState> emit,
  ) async {
    try {
      final correct = await _service.verifyPin(pin);

      if (correct) {
        emit(const ParentalGateSuccess());
      } else {
        final newAttempts = current.failedAttempts + 1;

        if (newAttempts >= AppConstants.parentalGateMaxAttempts) {
          // Start cooldown
          emit(current.copyWith(
            currentPin: '',
            digitCount: 0,
            failedAttempts: newAttempts,
            isCooldown: true,
            cooldownSecondsLeft: AppConstants.parentalGateCooldownSeconds,
            isSubmitting: false,
            errorMessage: 'Vui lòng thử lại sau '
                '${AppConstants.parentalGateCooldownSeconds} giây',
          ));
          _startCooldownTimer();
        } else {
          emit(current.copyWith(
            currentPin: '',
            digitCount: 0,
            failedAttempts: newAttempts,
            isSubmitting: false,
            errorMessage: 'Mã PIN không đúng',
          ));
        }
      }
    } on Exception catch (e) {
      emit(current.copyWith(
        currentPin: '',
        digitCount: 0,
        isSubmitting: false,
        errorMessage: 'Lỗi xác thực PIN: $e',
      ));
    }
  }

  void _handleSetupFirst(
    String pin,
    ParentalGateVerifying current,
    Emitter<ParentalGateState> emit,
  ) {
    // Hash the first PIN entry before storing in state (F-5 fix — AC5).
    // BlocObserver will never expose the plain-text PIN via state.props.
    final hashedPin = _hashPinForState(pin);
    emit(ParentalGateVerifying(
      mode: 'setup_confirm',
      firstPin: hashedPin,
      canUseBiometric: current.canUseBiometric,
    ));
  }

  Future<void> _handleSetupConfirm(
    String pin,
    ParentalGateVerifying current,
    Emitter<ParentalGateState> emit,
  ) async {
    try {
      // Compare hashed versions (firstPin is already hashed — F-5 fix).
      final hashedPin = _hashPinForState(pin);
      if (hashedPin == current.firstPin) {
        await _service.setupPin(pin);
        emit(const ParentalGateSuccess());
      } else {
        // PINs don't match — restart setup
        emit(ParentalGateVerifying(
          mode: 'setup_first',
          canUseBiometric: current.canUseBiometric,
          errorMessage: 'Mã PIN không khớp, vui lòng thử lại',
        ));
      }
    } on Exception catch (e) {
      emit(ParentalGateVerifying(
        mode: 'setup_first',
        canUseBiometric: current.canUseBiometric,
        errorMessage: 'Lỗi tạo PIN: $e',
      ));
    }
  }

  /// Hashes [pin] for in-memory state storage (AC5 — PIN never plain-text in state).
  ///
  /// Uses the same salt as [ParentalGateService._hashPin] so that
  /// [_handleSetupConfirm] can call [_service.setupPin] with the
  /// original plain-text pin while only storing the hash in BLoC state.
  static String _hashPinForState(String pin) {
    const salt = 'english_pro_parental_gate_salt_v1';
    final bytes = utf8.encode('$salt:$pin');
    return sha256.convert(bytes).toString();
  }

  // ── Cooldown Timer ─────────────────────────────────────────────────

  void _startCooldownTimer() {
    _cooldownTimer?.cancel();

    var remaining = AppConstants.parentalGateCooldownSeconds;

    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      remaining--;

      if (remaining <= 0) {
        timer.cancel();
        _cooldownTimer = null;
        if (!isClosed) {
          // F-7 fix: dispatch 0 (not negative) to avoid "-1 giây" UI glitch.
          add(const ParentalGateCooldownTick(0));
        }
      } else {
        if (!isClosed) {
          add(ParentalGateCooldownTick(remaining));
        }
      }
    });
  }

  @override
  Future<void> close() {
    _cooldownTimer?.cancel();
    return super.close();
  }
}
