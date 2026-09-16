import 'package:isar/isar.dart';

part 'knowledge_edge.g.dart';

@collection
class KnowledgeEdge {
  Id id = Isar.autoIncrement;

  late String sourceId;
  late String targetId;
  late String relation;
  double weight;
  Map<String, dynamic>? metadata;
  late DateTime createdAt;

  KnowledgeEdge({
    required this.sourceId,
    required this.targetId,
    required this.relation,
    this.weight = 1.0,
    this.metadata,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();
}
