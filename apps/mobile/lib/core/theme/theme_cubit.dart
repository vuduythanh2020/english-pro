import 'package:english_pro/core/theme/theme_state.dart';
import 'package:flutter/material.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';

/// Manages the app-wide [ThemeMode] and persists the selection
/// across restarts using [HydratedCubit].
///
/// Default theme is [ThemeMode.light] per UX spec.
class ThemeCubit extends HydratedCubit<ThemeState> {
  ThemeCubit() : super(const ThemeState(themeMode: ThemeMode.light));

  /// Changes the theme mode and persists automatically.
  void setThemeMode(ThemeMode mode) {
    emit(ThemeState(themeMode: mode));
  }

  // ── HydratedCubit persistence ────────────────────────────────────────

  @override
  ThemeState? fromJson(Map<String, dynamic> json) {
    try {
      final themeName = json['themeMode'] as String?;
      final themeMode = ThemeMode.values.firstWhere(
        (mode) => mode.name == themeName,
        orElse: () => ThemeMode.light,
      );
      return ThemeState(themeMode: themeMode);
    } on Object {
      return null; // fallback to initial state
    }
  }

  @override
  Map<String, dynamic>? toJson(ThemeState state) {
    return {'themeMode': state.themeMode.name};
  }
}
