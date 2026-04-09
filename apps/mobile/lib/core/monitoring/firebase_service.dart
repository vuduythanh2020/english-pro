import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/foundation.dart';

/// Firebase service for crash reporting and analytics.
///
/// Initializes Firebase Core, Crashlytics, and Analytics.
/// - Crashlytics collects crash reports in release mode.
/// - Analytics tracks user events (session, XP, pronunciation).
/// - In debug mode, Crashlytics collection is disabled.
///
/// Usage:
/// ```dart
/// await FirebaseService.initialize();
/// FirebaseService.analytics.logEvent(name: 'session_start');
/// ```
class FirebaseService {
  FirebaseService._();

  static FirebaseAnalytics? _analytics;

  /// Firebase Analytics instance.
  ///
  /// Throws [StateError] if accessed before [initialize] is called.
  static FirebaseAnalytics get analytics {
    final a = _analytics;
    if (a == null) {
      throw StateError(
        'FirebaseService.initialize() must be called before accessing analytics.',
      );
    }
    return a;
  }

  /// Whether Firebase has been initialized.
  static bool _initialized = false;

  /// Initialize Firebase and configure error handlers.
  ///
  /// Call this once during app bootstrap, before runApp().
  /// Requires `google-services.json` (Android) and
  /// `GoogleService-Info.plist` (iOS) to be configured.
  static Future<void> initialize() async {
    if (_initialized) return;

    await Firebase.initializeApp(
      // TODO: Uncomment when Firebase project is configured
      // options: DefaultFirebaseOptions.currentPlatform,
    );

    // ── Crashlytics ──────────────────────────────────────
    // Record Flutter framework errors
    FlutterError.onError = (errorDetails) {
      FirebaseCrashlytics.instance.recordFlutterFatalError(errorDetails);
    };

    // Record async errors not caught by Flutter framework
    // Guard: if Crashlytics itself throws, swallow the error to avoid masking the original
    PlatformDispatcher.instance.onError = (error, stack) {
      try {
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      } catch (_) {
        // Silently ignore Crashlytics failures — do not mask the original error
      }
      return true;
    };

    // Disable Crashlytics collection in debug mode
    if (kDebugMode) {
      await FirebaseCrashlytics.instance
          .setCrashlyticsCollectionEnabled(false);
    }

    // ── Analytics ─────────────────────────────────────────
    _analytics = FirebaseAnalytics.instance;

    _initialized = true;
  }

  /// Get the FirebaseAnalytics observer for GoRouter/Navigator.
  static FirebaseAnalyticsObserver get observer =>
      FirebaseAnalyticsObserver(analytics: analytics);

  /// Log a custom event to Firebase Analytics.
  static Future<void> logEvent({
    required String name,
    Map<String, Object>? parameters,
  }) async {
    await analytics.logEvent(name: name, parameters: parameters);
  }

  /// Set user ID for analytics and crashlytics.
  static Future<void> setUserId(String userId) async {
    await analytics.setUserId(id: userId);
    await FirebaseCrashlytics.instance.setUserIdentifier(userId);
  }

  /// Record a non-fatal error to Crashlytics.
  static Future<void> recordError(
    dynamic exception,
    StackTrace? stack, {
    String? reason,
  }) async {
    await FirebaseCrashlytics.instance.recordError(
      exception,
      stack,
      reason: reason ?? 'Non-fatal error',
    );
  }
}
