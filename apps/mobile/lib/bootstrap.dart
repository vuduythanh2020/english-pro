import 'dart:async';
import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:english_pro/core/api/api_client.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/constants/environment.dart';
import 'package:english_pro/core/network/connectivity_cubit.dart';
import 'package:english_pro/core/network/connectivity_service.dart';
import 'package:english_pro/core/storage/hive_service.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/widgets.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:path_provider/path_provider.dart';

class AppBlocObserver extends BlocObserver {
  const AppBlocObserver();

  @override
  void onChange(BlocBase<dynamic> bloc, Change<dynamic> change) {
    super.onChange(bloc, change);
    log('onChange(${bloc.runtimeType}, $change)');
  }

  @override
  void onError(
    BlocBase<dynamic> bloc,
    Object error,
    StackTrace stackTrace,
  ) {
    log('onError(${bloc.runtimeType}, $error, $stackTrace)');
    super.onError(bloc, error, stackTrace);
  }
}

/// Container holding all root-level dependencies created during
/// bootstrap. Passed to the root widget so the widget layer never
/// instantiates services directly.
class AppDependencies {
  const AppDependencies({
    required this.secureStorage,
    required this.authBloc,
    required this.connectivityCubit,
    required this.dio,
  });

  final SecureStorageService secureStorage;
  final AuthBloc authBloc;
  final ConnectivityCubit connectivityCubit;
  final Dio dio;
}

Future<void> bootstrap(
  FutureOr<Widget> Function(AppDependencies deps) builder,
) async {
  WidgetsFlutterBinding.ensureInitialized();

  FlutterError.onError = (details) {
    log(details.exceptionAsString(), stackTrace: details.stack);
  };

  Bloc.observer = const AppBlocObserver();

  // ── Initialise HydratedBloc storage ────────────────────────────────
  if (kIsWeb) {
    HydratedBloc.storage = await HydratedStorage.build(
      storageDirectory: HydratedStorageDirectory.web,
    );
  } else {
    final storageDir = await getApplicationDocumentsDirectory();
    HydratedBloc.storage = await HydratedStorage.build(
      storageDirectory: HydratedStorageDirectory(storageDir.path),
    );
  }

  // ── Initialise Hive ────────────────────────────────────────────────
  final hiveService = HiveService();
  await hiveService.init();
  await hiveService.openDefaultBoxes();

  // ── Create root dependencies ───────────────────────────────────────
  final secureStorage = SecureStorageService();
  final authBloc = AuthBloc(storageService: secureStorage)
    ..add(const AuthStarted());
  final connectivityCubit = ConnectivityCubit(
    connectivityService: ConnectivityService(),
  );
  final dio = createDioClient(
    baseUrl: Environment.current.apiBaseUrl,
    storageService: secureStorage,
    authBloc: authBloc,
  );

  final deps = AppDependencies(
    secureStorage: secureStorage,
    authBloc: authBloc,
    connectivityCubit: connectivityCubit,
    dio: dio,
  );

  runApp(await builder(deps));
}
