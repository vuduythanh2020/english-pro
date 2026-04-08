/// Application environment configuration.
///
/// Detects the current environment from the
/// `--dart-define=ENV=<value>` compile-time constant and exposes
/// environment-specific values.
enum Environment {
  /// Local development (default).
  development,

  /// Staging / QA.
  staging,

  /// Production.
  production
  ;

  /// Resolves the current environment from the `ENV` compile-time
  /// constant.
  ///
  /// Defaults to [Environment.development] when the constant is
  /// unset.
  static Environment get current {
    const envString = String.fromEnvironment(
      'ENV',
      defaultValue: 'development',
    );
    return Environment.values.firstWhere(
      (e) => e.name == envString,
      orElse: () => Environment.development,
    );
  }

  /// Whether this is a development build.
  bool get isDevelopment => this == Environment.development;

  /// Whether this is a staging build.
  bool get isStaging => this == Environment.staging;

  /// Whether this is a production build.
  bool get isProduction => this == Environment.production;

  /// Base URL for the API in this environment.
  String get apiBaseUrl {
    switch (this) {
      case Environment.development:
        return const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'http://localhost:3000/api/v1',
        );
      case Environment.staging:
        return const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'https://staging-api.englishpro.app/api/v1',
        );
      case Environment.production:
        return const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'https://api.englishpro.app/api/v1',
        );
    }
  }
}
