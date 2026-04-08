import 'dart:async';

import 'package:english_pro/app/router/placeholder_screens.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_state.dart';
import 'package:flutter/foundation.dart';
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
      // Redirects authenticated users who have not completed the
      // parental consent flow away from protected screens.
      // Real consent verification will be wired in Story 2.3.
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
      GoRoute(
        path: '/home',
        builder: (_, _) => const HomePlaceholderScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (_, _) => const ProfilePlaceholderScreen(),
      ),
    ],
  );
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
