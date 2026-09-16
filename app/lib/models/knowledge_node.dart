import 'package:isar/isar.dart';

part 'knowledge_node.g.dart';

@collection
class KnowledgeNode {
  Id id = Isar.autoIncrement;

  @Index()
  late String remoteId;

  @Index()
  late String userId;

  late String label;
  late String nodeType; // topic, concept, fact, question, answer, preference, habit, skill, entity
  String? content;
  double confidence;
  Map<String, dynamic>? metadata;
  late DateTime createdAt;
  late DateTime updatedAt;

  KnowledgeNode({
    required this.remoteId,
    required this.userId,
    required this.label,
    required this.nodeType,
    this.content,
    this.confidence = 1.0,
    this.metadata,
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();
}
