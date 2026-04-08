import 'dart:async';

import 'package:english_pro/app/router/placeholder_screens.dart';
import 'package:english_pro/app/widgets/app_bottom_navigation.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:english_pro/features/settings/view/settings_screen.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Creates and configures the application [GoRouter].
///
/// Route guards are implemented via the top-level `redirect` callback
/// instead of `NavigatorObserver`, following architecture guidelines.
GoRouter createRouter(AuthBloc authBloc) {
  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: kDebugMode,
    refreshListenable: GoRouterRefreshStream(authBloc.stream),
    redirect: (context, state) {
      final authState = authBloc.state;
      final isLoggedIn = authState is AuthAuthenticated;
      final location = state.matchedLocation;

      // ── Auth guard ─────────────────────────────────────────────────
      final isPublicRoute = location == '/login' || location == '/register';

      if (!isLoggedIn && !isPublicRoute) return '/login';
      if (isLoggedIn && isPublicRoute) return '/home';

      // ── Consent guard ──────────────────────────────────────────────
      if (isLoggedIn) {
        final hasConsent = authState.hasConsent;
        final isConsentRoute = location == '/consent';
        final requiresConsent =
            !isPublicRoute && !isConsentRoute && !hasConsent;

        if (requiresConsent) return '/consent';
        if (hasConsent && isConsentRoute) return '/home';
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
        builder: (_, _) => const LoginPlaceholderScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (_, _) => const RegisterPlaceholderScreen(),
      ),
      GoRoute(
        path: '/consent',
        builder: (_, _) => const ConsentPlaceholderScreen(),
      ),

      // ── Tab navigation via StatefulShellRoute ────────────────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return _ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (_, _) => const HomePlaceholderScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/practice',
                builder: (_, _) => const PracticePlaceholderScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/progress',
                builder: (_, _) => const ProgressPlaceholderScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (_, _) => const ProfilePlaceholderScreen(),
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
/// the currently active tab branch.
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
