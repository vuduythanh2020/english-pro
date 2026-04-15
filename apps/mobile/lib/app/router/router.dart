import 'dart:async';

import 'package:dio/dio.dart';
import 'package:english_pro/app/router/child_placeholder_screens.dart';
import 'package:english_pro/app/router/placeholder_screens.dart';
import 'package:english_pro/app/widgets/app_bottom_navigation.dart';
import 'package:english_pro/app/widgets/child_bottom_navigation_bar.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:english_pro/features/auth/bloc/login_bloc.dart';
import 'package:english_pro/features/auth/bloc/registration_bloc.dart';
import 'package:english_pro/features/auth/repositories/auth_repository.dart';
import 'package:english_pro/features/auth/view/login_screen.dart';
import 'package:english_pro/features/auth/view/registration_screen.dart';
import 'package:english_pro/features/home/view/child_home_screen.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_bloc.dart';
import 'package:english_pro/features/onboarding/bloc/consent_bloc.dart';
import 'package:english_pro/features/onboarding/bloc/profile_selection_bloc.dart';
import 'package:english_pro/features/onboarding/bloc/profile_selection_event.dart';
import 'package:english_pro/features/onboarding/repositories/child_switch_repository.dart';
import 'package:english_pro/features/onboarding/repositories/children_repository.dart';
import 'package:english_pro/features/onboarding/repositories/consent_repository.dart';
import 'package:english_pro/features/onboarding/view/child_profile_setup_screen.dart';
import 'package:english_pro/features/onboarding/view/consent_screen.dart';
import 'package:english_pro/features/onboarding/view/profile_selection_screen.dart';
import 'package:english_pro/features/settings/bloc/privacy_data_bloc.dart';
import 'package:english_pro/features/settings/bloc/privacy_data_event.dart';
import 'package:english_pro/features/settings/repositories/privacy_data_repository.dart';
import 'package:english_pro/features/settings/view/child_data_view_screen.dart';
import 'package:english_pro/features/settings/view/privacy_data_screen.dart';
import 'package:english_pro/features/settings/view/privacy_policy_screen.dart';
import 'package:english_pro/features/settings/view/settings_screen.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

/// Parent-only routes that a child session cannot access.
const _parentOnlyRoutes = {
  '/settings',
  '/settings/privacy-data',
  '/settings/child-data',
  '/settings/privacy-policy',
  '/consent',
  '/child-profile-setup',
  '/profile-selection',
  '/profile/settings',
};

/// Creates and configures the application [GoRouter].
///
/// Route guards are implemented via the top-level `redirect` callback
/// instead of `NavigatorObserver`, following architecture guidelines.
GoRouter createRouter(AuthBloc authBloc, {required AuthRepository authRepository}) {
  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: kDebugMode,
    refreshListenable: GoRouterRefreshStream(authBloc.stream),
    redirect: (context, state) {
      final authState = authBloc.state;
      final isLoggedIn = authState is AuthAuthenticated;
      final isChildSession = authState is AuthChildSessionActive;
      final location = state.matchedLocation;

      // ── Auth guard ─────────────────────────────────────────────────
      final isPublicRoute = location == '/login' || location == '/register';

      if (!isLoggedIn && !isChildSession && !isPublicRoute) return '/login';
      if ((isLoggedIn || isChildSession) && isPublicRoute) return '/home';

      // ── Child session guard ─────────────────────────────────────────
      // If child session is active, redirect away from parent-only routes
      if (isChildSession) {
        if (_parentOnlyRoutes.contains(location)) return '/home';
        // Child session is active — no further redirects needed
        return null;
      }

      // ── Consent guard ──────────────────────────────────────────────
      if (isLoggedIn) {
        final hasConsent = authState.hasConsent;
        final isConsentRoute = location == '/consent';
        final requiresConsent =
            !isPublicRoute && !isConsentRoute && !hasConsent;

        if (requiresConsent) return '/consent';
        if (hasConsent && isConsentRoute) return '/home';
      }

      // ── Child profile guard ────────────────────────────────────────
      if (isLoggedIn) {
        final hasConsent = authState.hasConsent;
        final hasChildProfile = authState.hasChildProfile;
        final isChildProfileRoute = location == '/child-profile-setup';

        if (hasConsent && !hasChildProfile && !isChildProfileRoute) {
          return '/child-profile-setup';
        }
        if (hasChildProfile && isChildProfileRoute) return '/profile-selection';
      }

      // ── Profile selection guard ────────────────────────────────────
      if (isLoggedIn) {
        final hasConsent = authState.hasConsent;
        final hasChildProfile = authState.hasChildProfile;
        final isProfileSelectionRoute = location == '/profile-selection';

        // Parent with completed onboarding but NOT in child session
        // must be on profile-selection. Exclude onboarding routes and
        // parent-only routes that are legitimately accessible before switching.
        if (hasConsent &&
            hasChildProfile &&
            !isProfileSelectionRoute &&
            !_parentOnlyRoutes.contains(location) &&
            location != '/') {
          return '/profile-selection';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        redirect: (_, _) => '/home',
      ),
      GoRoute(
        path: '/login',
        builder: (context, _) => BlocProvider(
          create: (_) => LoginBloc(authRepository: authRepository),
          child: const LoginScreen(),
        ),
      ),
      GoRoute(
        path: '/register',
        builder: (context, _) => BlocProvider(
          create: (_) => RegistrationBloc(authRepository: authRepository),
          child: const RegistrationScreen(),
        ),
      ),
      GoRoute(
        path: '/consent',
        builder: (context, _) => BlocProvider(
          create: (_) => ConsentBloc(
            consentRepository: ConsentRepository(
              dio: context.read<Dio>(),
            ),
            authBloc: context.read<AuthBloc>(),
          ),
          child: const ConsentScreen(),
        ),
      ),
      GoRoute(
        path: '/child-profile-setup',
        builder: (context, _) => BlocProvider(
          create: (_) => ChildProfileBloc(
            childrenRepository: ChildrenRepository(
              dio: context.read<Dio>(),
            ),
            authBloc: context.read<AuthBloc>(),
          ),
          child: const ChildProfileSetupScreen(),
        ),
      ),
      GoRoute(
        path: '/profile-selection',
        builder: (context, _) => BlocProvider(
          create: (_) => ProfileSelectionBloc(
            childrenRepository: ChildrenRepository(
              dio: context.read<Dio>(),
            ),
            childSwitchRepository: ChildSwitchRepository(
              dio: context.read<Dio>(),
            ),
            authBloc: context.read<AuthBloc>(),
          )..add(const ProfileSelectionStarted()),
          child: const ProfileSelectionScreen(),
        ),
      ),

      // ── Settings routes (Story 2.7) ─────────────────────────────
      GoRoute(
        path: '/settings',
        name: 'settings',
        builder: (_, _) => const SettingsScreen(),
        routes: [
          GoRoute(
            path: 'privacy-data',
            name: 'privacy-data',
            builder: (context, state) {
              final childId = state.extra as String? ?? '';
              return BlocProvider(
                create: (_) => PrivacyDataBloc(
                  repository: PrivacyDataRepository(
                    dio: context.read<Dio>(),
                  ),
                  childId: childId,
                )..add(const PrivacyDataStarted()),
                child: const PrivacyDataScreen(),
              );
            },
          ),
          GoRoute(
            path: 'child-data',
            name: 'child-data',
            builder: (context, state) {
              final childId = state.extra as String? ?? '';
              return BlocProvider(
                create: (_) => PrivacyDataBloc(
                  repository: PrivacyDataRepository(
                    dio: context.read<Dio>(),
                  ),
                  childId: childId,
                )..add(const PrivacyDataStarted()),
                child: const ChildDataViewScreen(),
              );
            },
          ),
          GoRoute(
            path: 'privacy-policy',
            name: 'privacy-policy',
            builder: (_, _) => const PrivacyPolicyScreen(),
          ),
        ],
      ),

      // ── Tab navigation via StatefulShellRoute ────────────────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          final authState = context.watch<AuthBloc>().state;
          final isChildSession = authState is AuthChildSessionActive;

          if (isChildSession) {
            return _ChildScaffoldWithNavBar(navigationShell: navigationShell);
          }
          return _ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (context, _) {
                  final authState = context.watch<AuthBloc>().state;
                  if (authState is AuthChildSessionActive) {
                    return const ChildHomeScreen();
                  }
                  return const HomePlaceholderScreen();
                },
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/practice',
                builder: (context, _) {
                  final authState = context.watch<AuthBloc>().state;
                  if (authState is AuthChildSessionActive) {
                    return const ChildPracticePlaceholderScreen();
                  }
                  return const PracticePlaceholderScreen();
                },
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/progress',
                builder: (context, _) {
                  final authState = context.watch<AuthBloc>().state;
                  if (authState is AuthChildSessionActive) {
                    return const ChildProgressPlaceholderScreen();
                  }
                  return const ProgressPlaceholderScreen();
                },
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, _) {
                  final authState = context.watch<AuthBloc>().state;
                  if (authState is AuthChildSessionActive) {
                    return const ChildProfilePlaceholderScreen();
                  }
                  return const ProfilePlaceholderScreen();
                },
                routes: [
                  GoRoute(
                    path: 'settings',
                    builder: (_, _) => const SettingsScreen(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
}

/// Shell widget that provides the bottom navigation bar around
/// the currently active tab branch (parent mode).
class _ScaffoldWithNavBar extends StatelessWidget {
  const _ScaffoldWithNavBar({required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: AppBottomNavigation(
        currentIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) {
          navigationShell.goBranch(
            index,
            initialLocation: index == navigationShell.currentIndex,
          );
        },
      ),
    );
  }
}

/// Shell widget that provides the child-mode bottom navigation bar
/// around the currently active tab branch (child mode).
class _ChildScaffoldWithNavBar extends StatelessWidget {
  const _ChildScaffoldWithNavBar({required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: ChildBottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) {
          navigationShell.goBranch(
            index,
            initialLocation: index == navigationShell.currentIndex,
          );
        },
      ),
    );
  }
}

/// Converts a [Stream] into a [ChangeNotifier] that [GoRouter] can
/// listen to for re-evaluating its redirect guards.
class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    unawaited(_subscription.cancel());
    super.dispose();
  }
}
