/// Domain model representing a child profile.
///
/// Returned by the API after creation or listing.
class ChildProfile {
  const ChildProfile({
    required this.id,
    required this.parentId,
    required this.displayName,
    required this.avatarId,
    required this.level,
    required this.xpTotal,
    required this.createdAt,
  });

  /// Unique identifier for the child profile.
  final String id;

  /// Parent user ID who owns this profile.
  final String parentId;

  /// Display name for the child (max 20 characters).
  final String displayName;

  /// Avatar ID (1–6).
  /// 1: Orange Fox, 2: Blue Penguin, 3: Green Frog,
  /// 4: Yellow Tiger, 5: Purple Butterfly, 6: Pink Panda
  final int avatarId;

  /// Learning level (e.g., 'beginner').
  final String level;

  /// Total XP accumulated.
  final int xpTotal;

  /// Profile creation timestamp.
  final DateTime createdAt;

  /// Creates a [ChildProfile] from a JSON map (API response).
  factory ChildProfile.fromJson(Map<String, dynamic> json) {
    return ChildProfile(
      id: json['id'] as String,
      parentId: json['parentId'] as String,
      displayName: json['displayName'] as String,
      avatarId: json['avatarId'] as int,
      level: json['level'] as String,
      xpTotal: json['xpTotal'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
