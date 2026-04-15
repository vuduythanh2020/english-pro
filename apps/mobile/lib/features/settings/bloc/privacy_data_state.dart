import 'package:english_pro/features/settings/models/child_data_model.dart';
import 'package:equatable/equatable.dart';

/// States for [PrivacyDataBloc] (Story 2.7).
sealed class PrivacyDataState extends Equatable {
  const PrivacyDataState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any interaction.
class PrivacyDataInitial extends PrivacyDataState {
  const PrivacyDataInitial();
}

/// Loading child data from API.
class PrivacyDataLoading extends PrivacyDataState {
  const PrivacyDataLoading();
}

/// Child data loaded successfully.
class PrivacyDataLoaded extends PrivacyDataState {
  const PrivacyDataLoaded({required this.data});

  final ChildDataModel data;

  @override
  List<Object?> get props => [data];
}

/// Exporting child data (share sheet about to open).
class PrivacyDataExporting extends PrivacyDataState {
  const PrivacyDataExporting();
}

/// Data export completed successfully.
class PrivacyDataExportSuccess extends PrivacyDataState {
  const PrivacyDataExportSuccess();
}

/// Deletion is in progress (waiting for backend response).
class PrivacyDataDeleteInProgress extends PrivacyDataState {
  const PrivacyDataDeleteInProgress();
}

/// Deletion completed successfully.
class PrivacyDataDeleteSuccess extends PrivacyDataState {
  const PrivacyDataDeleteSuccess();
}

/// An error occurred.
///
/// [errorId] is a unique timestamp that forces BlocListener to re-fire
/// even when [message] is the same (pattern from Story 2.1/2.2).
class PrivacyDataFailure extends PrivacyDataState {
  PrivacyDataFailure({required this.message})
    : errorId = DateTime.now().microsecondsSinceEpoch;

  final String message;
  final int errorId;

  @override
  List<Object?> get props => [message, errorId];
}
