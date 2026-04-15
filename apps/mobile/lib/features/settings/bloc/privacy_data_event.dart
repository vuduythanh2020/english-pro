import 'package:equatable/equatable.dart';

/// Events for [PrivacyDataBloc] (Story 2.7).
sealed class PrivacyDataEvent extends Equatable {
  const PrivacyDataEvent();

  @override
  List<Object?> get props => [];
}

/// Load child data from API.
class PrivacyDataStarted extends PrivacyDataEvent {
  const PrivacyDataStarted();
}

/// Export child data as JSON file.
class PrivacyDataExportRequested extends PrivacyDataEvent {
  const PrivacyDataExportRequested();
}

/// Initiate deletion flow (show confirmation dialog).
class PrivacyDataDeleteRequested extends PrivacyDataEvent {
  const PrivacyDataDeleteRequested();
}

/// Confirm deletion after user typed "XÓA".
class PrivacyDataDeleteConfirmed extends PrivacyDataEvent {
  const PrivacyDataDeleteConfirmed();
}
