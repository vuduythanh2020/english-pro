import 'package:equatable/equatable.dart';

/// Data model for child data export/view (Story 2.7).
///
/// Maps to `ChildDataResponseDto` from the backend API.
/// NOTE: No voice data — never stored (FR24).
class ChildDataModel extends Equatable {
  const ChildDataModel({
    required this.profile,
    required this.learningProgress,
    required this.pronunciationScores,
    required this.badges,
    required this.exportedAt,
  });

  final ChildProfileData profile;
  final LearningProgressData learningProgress;
  final List<PronunciationScoreData> pronunciationScores;
  final List<BadgeData> badges;
  final String exportedAt;

  factory ChildDataModel.fromJson(Map<String, dynamic> json) {
    return ChildDataModel(
      profile: ChildProfileData.fromJson(
        json['profile'] as Map<String, dynamic>,
      ),
      learningProgress: LearningProgressData.fromJson(
        json['learningProgress'] as Map<String, dynamic>,
      ),
      pronunciationScores:
          (json['pronunciationScores'] as List<dynamic>? ?? [])
              .whereType<Map<String, dynamic>>()
              .map(PronunciationScoreData.fromJson)
              .toList(),
      badges:
          (json['badges'] as List<dynamic>? ?? [])
              .whereType<Map<String, dynamic>>()
              .map(BadgeData.fromJson)
              .toList(),
      exportedAt: json['exportedAt'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [
    profile,
    learningProgress,
    pronunciationScores,
    badges,
    exportedAt,
  ];
}

class ChildProfileData extends Equatable {
  const ChildProfileData({
    required this.id,
    required this.name,
    required this.avatar,
    this.age,
    required this.createdAt,
  });

  final String id;
  final String name;
  final int avatar;
  final int? age;
  final String createdAt;

  factory ChildProfileData.fromJson(Map<String, dynamic> json) {
    return ChildProfileData(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      avatar: json['avatar'] as int? ?? 1,
      age: json['age'] as int?,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [id, name, avatar, age, createdAt];
}

class LearningProgressData extends Equatable {
  const LearningProgressData({
    required this.totalSessions,
    required this.sessions,
  });

  final int totalSessions;
  final List<ConversationSessionData> sessions;

  factory LearningProgressData.fromJson(Map<String, dynamic> json) {
    return LearningProgressData(
      totalSessions: json['totalSessions'] as int? ?? 0,
      sessions:
          (json['sessions'] as List<dynamic>? ?? [])
              .whereType<Map<String, dynamic>>()
              .map(ConversationSessionData.fromJson)
              .toList(),
    );
  }

  @override
  List<Object?> get props => [totalSessions, sessions];
}

class ConversationSessionData extends Equatable {
  const ConversationSessionData({
    required this.id,
    required this.scenarioId,
    required this.status,
    required this.durationSeconds,
    required this.wordsSpoken,
    required this.xpEarned,
    required this.createdAt,
  });

  final String id;
  final String scenarioId;
  final String status;
  final int durationSeconds;
  final int wordsSpoken;
  final int xpEarned;
  final String createdAt;

  factory ConversationSessionData.fromJson(Map<String, dynamic> json) {
    return ConversationSessionData(
      id: json['id'] as String? ?? '',
      scenarioId: json['scenarioId'] as String? ?? '',
      status: json['status'] as String? ?? '',
      durationSeconds: json['durationSeconds'] as int? ?? 0,
      wordsSpoken: json['wordsSpoken'] as int? ?? 0,
      xpEarned: json['xpEarned'] as int? ?? 0,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [
    id,
    scenarioId,
    status,
    durationSeconds,
    wordsSpoken,
    xpEarned,
    createdAt,
  ];
}

class PronunciationScoreData extends Equatable {
  const PronunciationScoreData({
    required this.sessionId,
    required this.word,
    this.phoneme,
    required this.score,
    this.errorType,
    required this.createdAt,
  });

  final String sessionId;
  final String word;
  final String? phoneme;
  final double score;
  final String? errorType;
  final String createdAt;

  factory PronunciationScoreData.fromJson(Map<String, dynamic> json) {
    return PronunciationScoreData(
      sessionId: json['sessionId'] as String? ?? '',
      word: json['word'] as String? ?? '',
      phoneme: json['phoneme'] as String?,
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      errorType: json['errorType'] as String?,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [sessionId, word, phoneme, score, errorType, createdAt];
}

class BadgeData extends Equatable {
  const BadgeData({
    required this.id,
    required this.badgeType,
    required this.name,
    this.description,
    required this.earnedAt,
  });

  final String id;
  final String badgeType;
  final String name;
  final String? description;
  final String earnedAt;

  factory BadgeData.fromJson(Map<String, dynamic> json) {
    return BadgeData(
      id: json['id'] as String? ?? '',
      badgeType: json['badgeType'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      earnedAt: json['earnedAt'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [id, badgeType, name, description, earnedAt];
}
