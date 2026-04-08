import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

/// Immutable state for the theme cubit.
class ThemeState extends Equatable {
  /// Creates a [ThemeState] with the given [themeMode].
  const ThemeState({required this.themeMode});

  /// The current theme mode selection.
  final ThemeMode themeMode;

  @override
  List<Object> get props => [themeMode];
}
