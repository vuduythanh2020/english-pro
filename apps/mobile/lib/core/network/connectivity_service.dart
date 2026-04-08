import 'package:connectivity_plus/connectivity_plus.dart';

/// Thin wrapper around [Connectivity] to simplify testing.
class ConnectivityService {
  ConnectivityService({Connectivity? connectivity})
    : _connectivity = connectivity ?? Connectivity();

  final Connectivity _connectivity;

  /// Checks the current connectivity and returns `true` when any
  /// non-[ConnectivityResult.none] result is present.
  Future<bool> checkConnectivity() async {
    final results = await _connectivity.checkConnectivity();
    return !results.contains(ConnectivityResult.none);
  }

  /// A broadcast stream that emits `true` / `false` whenever the
  /// device connectivity changes.
  Stream<bool> get onConnectivityChanged =>
      _connectivity.onConnectivityChanged.map(
        (results) => !results.contains(ConnectivityResult.none),
      );
}
