import 'package:english_pro/core/constants/app_constants.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Service wrapping Hive for structured offline data persistence.
///
/// **Not** intended for sensitive data — use
/// `SecureStorageService` instead.
class HiveService {
  /// Initialises Hive for Flutter (sub-directory inside
  /// `getApplicationDocumentsDirectory()`).
  ///
  /// Call once during app bootstrap **before** any box operations.
  Future<void> init() async {
    await Hive.initFlutter();
    // Register adapters here as models are added in future stories.
  }

  /// Opens the default boxes needed at app startup.
  Future<void> openDefaultBoxes() async {
    await Future.wait([
      openBox<dynamic>(AppConstants.settingsBox),
      openBox<dynamic>(AppConstants.profilesBox),
      openBox<dynamic>(AppConstants.progressBox),
    ]);
  }

  /// Opens (or returns an already-open) box with the given [name].
  Future<Box<T>> openBox<T>(String name) => Hive.openBox<T>(name);

  /// Reads a value from [boxName] at [key].
  /// Returns `null` when absent.
  T? getValue<T>(String boxName, String key) {
    final box = Hive.box<T>(boxName);
    return box.get(key);
  }

  /// Writes [value] into [boxName] at [key].
  Future<void> setValue<T>(
    String boxName,
    String key,
    T value,
  ) async {
    final box = Hive.box<T>(boxName);
    await box.put(key, value);
  }

  /// Deletes [key] from [boxName].
  Future<void> deleteValue<T>(String boxName, String key) async {
    final box = Hive.box<T>(boxName);
    await box.delete(key);
  }

  /// Deletes all entries in [boxName].
  Future<void> clearBox<T>(String boxName) async {
    final box = Hive.box<T>(boxName);
    await box.clear();
  }

  /// Closes all open boxes and releases resources.
  Future<void> dispose() => Hive.close();
}
