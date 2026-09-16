import 'package:isar/isar.dart';

part 'conversation.g.dart';

@collection
class Conversation {
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  late String remoteId;

  late String title;
  String? systemPrompt;
  String model;
  bool isArchived;
  late DateTime createdAt;
  late DateTime updatedAt;

  Conversation({
    required this.remoteId,
    required this.title,
    this.systemPrompt,
    this.model = 'gpt-4o-mini',
    this.isArchived = false,
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();
}
