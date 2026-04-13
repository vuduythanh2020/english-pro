import 'package:equatable/equatable.dart';

/// States emitted by `ParentalGateBloc` (Story 2.6).
sealed class ParentalGateState extends Equatable {
  const ParentalGateState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any check has completed.
class ParentalGateInitial extends ParentalGateState {
  const ParentalGateInitial();
}

/// Loading state while checking PIN setup status and biometric availability.
class ParentalGateLoading extends ParentalGateState {
  const ParentalGateLoading();
}

/// The parental gate is ready for user input (PIN digits / biometric).
///
/// [mode] determines which flow is active:
/// - `verify` — user must enter their existing PIN.
/// - `setup_first` — user is creating a new PIN (first entry).
/// - `setup_confirm` — user is confirming the new PIN (second entry).
class ParentalGateVerifying extends ParentalGateState {
  const ParentalGateVerifying({
    this.currentPin = '',
    this.digitCount = 0,
    this.failedAttempts = 0,
    this.isCooldown = false,
    this.cooldownSecondsLeft = 0,
    this.canUseBiometric = false,
    this.isSubmitting = false,
    this.mode = 'verify',
    this.firstPin,
    this.errorMessage,
  });

  /// The digits entered so far (stored but never displayed in plain text).
  final String currentPin;

  /// Number of digits entered (0–4).
  final int digitCount;

  /// Consecutive wrong PIN attempts in the current session.
  final int failedAttempts;

  /// Whether the cooldown timer is active after 3 wrong attempts.
  final bool isCooldown;

  /// Remaining seconds in the cooldown period (0–30).
  final int cooldownSecondsLeft;

  /// Whether the device supports biometric authentication.
  final bool canUseBiometric;

  /// Whether a PIN submission / biometric check is in flight.
  final bool isSubmitting;

  /// Current mode: `'verify'` | `'setup_first'` | `'setup_confirm'`.
  final String mode;

  /// Stores the hashed first PIN entry during setup flow so it can be
  /// compared with the hashed confirmation entry (F-5 fix — AC5: PIN never
  /// plain-text in state or logs).
  final String? firstPin;

  /// Optional error message displayed to the user (e.g. wrong PIN, mismatch).
  final String? errorMessage;

  /// Convenience copy-with.
  ParentalGateVerifying copyWith({
    String? currentPin,
    int? digitCount,
    int? failedAttempts,
    bool? isCooldown,
    int? cooldownSecondsLeft,
    bool? canUseBiometric,
    bool? isSubmitting,
    String? mode,
    String? firstPin,
    String? errorMessage,
    bool clearFirstPin = false,
    bool clearError = false,
  }) {
    return ParentalGateVerifying(
      currentPin: currentPin ?? this.currentPin,
      digitCount: digitCount ?? this.digitCount,
      failedAttempts: failedAttempts ?? this.failedAttempts,
      isCooldown: isCooldown ?? this.isCooldown,
      cooldownSecondsLeft: cooldownSecondsLeft ?? this.cooldownSecondsLeft,
      canUseBiometric: canUseBiometric ?? this.canUseBiometric,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      mode: mode ?? this.mode,
      firstPin: clearFirstPin ? null : (firstPin ?? this.firstPin),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => [
    currentPin,
    digitCount,
    failedAttempts,
    isCooldown,
    cooldownSecondsLeft,
    canUseBiometric,
    isSubmitting,
    mode,
    firstPin,
    errorMessage,
  ];
}

/// Authentication was successful (PIN correct or biometric passed).
class ParentalGateSuccess extends ParentalGateState {
  const ParentalGateSuccess();
}

/// An unrecoverable error occurred.
class ParentalGateFailure extends ParentalGateState {
  const ParentalGateFailure({
    required this.message,
    required this.errorId,
  });

  final String message;

  /// Unique ID so Equatable treats successive failures with the same
  /// message as distinct states (triggers BlocListener).
  final int errorId;

  @override
  List<Object?> get props => [message, errorId];
}
