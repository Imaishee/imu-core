class Conversation {
  String remoteId;
  String title;
  String? systemPrompt;
  String model;
  bool isArchived;
  DateTime createdAt;
  DateTime updatedAt;

  Conversation({
    required this.remoteId,
    required this.title,
    this.systemPrompt,
    this.model = 'llama-3.3-70b-versatile',
    this.isArchived = false,
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();
}
