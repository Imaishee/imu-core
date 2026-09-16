class ChatMessage {
  String conversationId;
  String role;
  String content;
  int tokensUsed;
  String? model;
  String? fileUrl;
  String? fileType;
  DateTime createdAt;

  ChatMessage({
    required this.conversationId,
    required this.role,
    required this.content,
    this.tokensUsed = 0,
    this.model,
    this.fileUrl,
    this.fileType,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'conversationId': conversationId,
    'role': role,
    'content': content,
    'tokensUsed': tokensUsed,
    'model': model,
    'fileUrl': fileUrl,
    'fileType': fileType,
    'createdAt': createdAt.toIso8601String(),
  };

  factory ChatMessage.fromJson(Map<String, dynamic> j) => ChatMessage(
    conversationId: j['conversationId'],
    role: j['role'],
    content: j['content'],
    tokensUsed: j['tokensUsed'] ?? 0,
    model: j['model'],
    fileUrl: j['fileUrl'],
    fileType: j['fileType'],
    createdAt: DateTime.parse(j['createdAt']),
  );
}
