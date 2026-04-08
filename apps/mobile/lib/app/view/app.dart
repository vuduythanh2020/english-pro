import 'dart:async';

import 'package:dio/dio.dart';
import 'package:english_pro/app/router/router.dart';
import 'package:english_pro/bootstrap.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/network/connectivity_cubit.dart';
import 'package:english_pro/l10n/l10n.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

/// Root application widget.
///
/// All services and blocs are received via [AppDependencies] which is
/// created in [bootstrap], keeping this widget free of service
/// instantiation and making it easy to inject mocks for testing.
class App extends StatefulWidget {
  const App({required this.deps, super.key});

  /// Root-level dependencies created during bootstrap.
  final AppDependencies deps;

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = createRouter(widget.deps.authBloc);
  }

  @override
  void dispose() {
    widget.deps.dio.close();
    unawaited(widget.deps.authBloc.close());
    unawaited(widget.deps.connectivityCubit.close());
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<Dio>.value(value: widget.deps.dio),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider<AuthBloc>.value(
            value: widget.deps.authBloc,
          ),
          BlocProvider<ConnectivityCubit>.value(
            value: widget.deps.connectivityCubit,
          ),
        ],
        child: MaterialApp.router(
          theme: ThemeData(
            appBarTheme: AppBarTheme(
              backgroundColor:
                  Theme.of(context).colorScheme.inversePrimary,
            ),
            useMaterial3: true,
          ),
          localizationsDelegates:
              AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          routerConfig: _router,
        ),
      ),
    );
  }
}
