import 'package:equatable/equatable.dart';

/// Events consumed by `ParentalGateBloc` (Story 2.6).
sealed class ParentalGateEvent extends Equatable {
  const ParentalGateEvent();

  @override
  List<Object?> get props => [];
}

/// Fired when the parental gate screen initialises.
/// Checks whether a PIN has been set and whether biometric is available.
class ParentalGateStarted extends ParentalGateEvent {
  const ParentalGateStarted();
}

/// Fired when the user taps a digit key (0-9).
class ParentalGatePinDigitAdded extends ParentalGateEvent {
  const ParentalGatePinDigitAdded(this.digit);

  final int digit;

  @override
  List<Object?> get props => [digit];
}

/// Fired when the user taps the backspace key.
class ParentalGatePinDigitRemoved extends ParentalGateEvent {
  const ParentalGatePinDigitRemoved();
}

/// Fired to submit the current PIN (auto-submitted when 4 digits entered).
class ParentalGatePinSubmitted extends ParentalGateEvent {
  const ParentalGatePinSubmitted();
}

/// Fired when the user taps the biometric authentication button.
class ParentalGateBiometricRequested extends ParentalGateEvent {
  const ParentalGateBiometricRequested();
}

/// Fired during setup mode when the user confirms the PIN (second entry).
class ParentalGateSetupPinConfirmed extends ParentalGateEvent {
  const ParentalGateSetupPinConfirmed();
}

/// Internal event dispatched by the cooldown timer each second.
class ParentalGateCooldownTick extends ParentalGateEvent {
  const ParentalGateCooldownTick(this.secondsLeft);

  final int secondsLeft;

  @override
  List<Object?> get props => [secondsLeft];
}
