import 'dart:async';

import 'package:dio/dio.dart';
import 'package:english_pro/app/router/router.dart';
import 'package:english_pro/app/theme/theme.dart';
import 'package:english_pro/bootstrap.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/network/connectivity_cubit.dart';
import 'package:english_pro/core/theme/theme_cubit.dart';
import 'package:english_pro/core/theme/theme_state.dart';
import 'package:english_pro/features/auth/repositories/auth_repository.dart';
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
  late final ThemeCubit _themeCubit;
  late final AuthRepository _authRepository;

  @override
  void initState() {
    super.initState();
    _authRepository = AuthRepository(dio: widget.deps.dio);
    _router = createRouter(
      widget.deps.authBloc,
      authRepository: _authRepository,
    );
    _themeCubit = ThemeCubit();
  }

  @override
  void dispose() {
    widget.deps.dio.close();
    unawaited(widget.deps.authBloc.close());
    unawaited(widget.deps.connectivityCubit.close());
    unawaited(_themeCubit.close());
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
          BlocProvider<ThemeCubit>.value(
            value: _themeCubit,
          ),
        ],
        child: BlocBuilder<ThemeCubit, ThemeState>(
          builder: (context, themeState) {
            return MaterialApp.router(
              theme: AppTheme.lightTheme(),
              darkTheme: AppTheme.darkTheme(),
              themeMode: themeState.themeMode,
              localizationsDelegates: AppLocalizations.localizationsDelegates,
              supportedLocales: AppLocalizations.supportedLocales,
              routerConfig: _router,
            );
          },
        ),
      ),
    );
  }
}
