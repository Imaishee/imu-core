import 'package:isar/isar.dart';

part 'chat_message.g.dart';

@collection
class ChatMessage {
  Id id = Isar.autoIncrement;

  late String conversationId;
  late String role; // 'user', 'assistant', 'system'
  late String content;
  int tokensUsed;
  String? model;
  late DateTime createdAt;

  ChatMessage({
    required this.conversationId,
    required this.role,
    required this.content,
    this.tokensUsed = 0,
    this.model,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();
}
