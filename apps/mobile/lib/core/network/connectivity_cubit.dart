import 'dart:async';

import 'package:english_pro/core/network/connectivity_service.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// States for [ConnectivityCubit].
sealed class ConnectivityState extends Equatable {
  const ConnectivityState();

  @override
  List<Object?> get props => [];
}

/// Device is connected to a network.
class ConnectivityOnline extends ConnectivityState {
  const ConnectivityOnline();
}

/// Device has no network connection.
class ConnectivityOffline extends ConnectivityState {
  const ConnectivityOffline();
}

/// Monitors network connectivity and emits [ConnectivityOnline] /
/// [ConnectivityOffline] states.
class ConnectivityCubit extends Cubit<ConnectivityState> {
  ConnectivityCubit({
    required ConnectivityService connectivityService,
  }) : _connectivityService = connectivityService,
       super(const ConnectivityOnline()) {
    unawaited(_init());
  }

  final ConnectivityService _connectivityService;
  StreamSubscription<bool>? _subscription;

  Future<void> _init() async {
    // Emit the current status immediately.
    final isOnline = await _connectivityService.checkConnectivity();
    _emitStatus(isOnline: isOnline);

    // Listen for changes.
    _subscription = _connectivityService.onConnectivityChanged.listen(
      (isOnline) => _emitStatus(isOnline: isOnline),
    );
  }

  void _emitStatus({required bool isOnline}) {
    if (isOnline) {
      emit(const ConnectivityOnline());
    } else {
      emit(const ConnectivityOffline());
    }
  }

  @override
  Future<void> close() async {
    await _subscription?.cancel();
    return super.close();
  }
}
