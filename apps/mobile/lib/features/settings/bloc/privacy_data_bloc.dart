import 'dart:io';

import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/features/settings/bloc/privacy_data_event.dart';
import 'package:english_pro/features/settings/bloc/privacy_data_state.dart';
import 'package:english_pro/features/settings/repositories/privacy_data_repository.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// BLoC managing privacy & data management operations (Story 2.7).
///
/// Handles:
/// - Loading child data for viewing
/// - Exporting child data as JSON via system share sheet
/// - Deleting child account with cascade
class PrivacyDataBloc extends Bloc<PrivacyDataEvent, PrivacyDataState> {
  PrivacyDataBloc({
    required PrivacyDataRepository repository,
    required this.childId,
  })  : _repository = repository,
        super(const PrivacyDataInitial()) {
    on<PrivacyDataStarted>(_onStarted);
    on<PrivacyDataExportRequested>(_onExportRequested);
    on<PrivacyDataDeleteRequested>(_onDeleteRequested);
    on<PrivacyDataDeleteConfirmed>(_onDeleteConfirmed);
  }

  final PrivacyDataRepository _repository;
  final String childId;

  Future<void> _onStarted(
    PrivacyDataStarted event,
    Emitter<PrivacyDataState> emit,
  ) async {
    // Double-tap guard
    if (state is PrivacyDataLoading) return;

    emit(const PrivacyDataLoading());

    try {
      final data = await _repository.getChildData(childId);
      emit(PrivacyDataLoaded(data: data));
    } on AppException catch (e) {
      emit(PrivacyDataFailure(message: e.message));
    } on Exception catch (e) {
      emit(PrivacyDataFailure(message: 'Lỗi tải dữ liệu: $e'));
    }
  }

  Future<void> _onExportRequested(
    PrivacyDataExportRequested event,
    Emitter<PrivacyDataState> emit,
  ) async {
    // Double-tap guard
    if (state is PrivacyDataExporting) return;

    // F02 fix: capture childName from current state BEFORE emitting PrivacyDataExporting.
    // After emit, `state` changes to PrivacyDataExporting and the name would be lost.
    final childName = (state is PrivacyDataLoaded)
        ? (state as PrivacyDataLoaded).data.profile.name.replaceAll(' ', '_')
        : 'child';

    emit(const PrivacyDataExporting());

    try {
      final bytes = await _repository.exportChildData(childId);

      // Write to temp file and share via system share sheet
      final tempDir = await getTemporaryDirectory();
      final date = DateFormat('yyyy-MM-dd').format(DateTime.now());
      final file = File(
        '${tempDir.path}/english_pro_data_${childName}_$date.json',
      );
      await file.writeAsBytes(bytes);

      await Share.shareXFiles(
        [XFile(file.path, mimeType: 'application/json')],
        subject: 'Dữ liệu học tiếng Anh của $childName',
      );

      emit(const PrivacyDataExportSuccess());
    } on AppException catch (e) {
      emit(PrivacyDataFailure(message: e.message));
    } on Exception catch (e) {
      emit(PrivacyDataFailure(message: 'Lỗi xuất dữ liệu: $e'));
    }
  }

  Future<void> _onDeleteRequested(
    PrivacyDataDeleteRequested event,
    Emitter<PrivacyDataState> emit,
  ) async {
    // This event is handled at UI layer to show confirmation dialog.
    // BLoC just emits DeleteInProgress to indicate the dialog should show.
    emit(const PrivacyDataDeleteInProgress());
  }

  Future<void> _onDeleteConfirmed(
    PrivacyDataDeleteConfirmed event,
    Emitter<PrivacyDataState> emit,
  ) async {
    emit(const PrivacyDataDeleteInProgress());

    try {
      await _repository.deleteChildAccount(childId);
      emit(const PrivacyDataDeleteSuccess());
    } on AppException catch (e) {
      emit(PrivacyDataFailure(message: e.message));
    } on Exception catch (e) {
      emit(PrivacyDataFailure(message: 'Lỗi xóa tài khoản: $e'));
    }
  }
}
