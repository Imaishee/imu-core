class ChatMessage {
  String conversationId;
  String role;
  String content;
  int tokensUsed;
  String? model;
  DateTime createdAt;

  ChatMessage({
    required this.conversationId,
    required this.role,
    required this.content,
    this.tokensUsed = 0,
    this.model,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();
}
