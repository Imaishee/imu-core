import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/conversation.dart';
import '../models/chat_message.dart';

class LocalStorage {
  static const _conversationsKey = 'imu_conversations';
  static const _messagesPrefix = 'imu_messages_';
  static const int defaultPageSize = 30;

  Future<void> saveConversations(List<Conversation> conversations) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = conversations.map((c) => {
      'remoteId': c.remoteId,
      'supabaseId': c.supabaseId,
      'title': c.title,
      'model': c.model,
      'isArchived': c.isArchived,
      'createdAt': c.createdAt.toIso8601String(),
      'updatedAt': c.updatedAt.toIso8601String(),
    }).toList();
    await prefs.setString(_conversationsKey, jsonEncode(jsonList));
  }

  Future<List<Conversation>> loadConversations() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_conversationsKey);
    if (data == null) return [];

    final jsonList = List<Map<String, dynamic>>.from(jsonDecode(data));
    return jsonList.map((j) => Conversation(
      remoteId: j['remoteId'],
      supabaseId: j['supabaseId'],
      title: j['title'],
      model: j['model'] ?? 'openai/gpt-oss-20b',
      isArchived: j['isArchived'] ?? false,
      createdAt: DateTime.parse(j['createdAt']),
      updatedAt: DateTime.parse(j['updatedAt']),
    )).toList();
  }

  Future<void> saveMessages(String conversationId, List<ChatMessage> messages) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '$_messagesPrefix$conversationId';
    final jsonList = messages.map((m) => m.toJson()).toList();
    await prefs.setString(key, jsonEncode(jsonList));
  }

  /// Load all messages (kept for backward compatibility).
  Future<List<ChatMessage>> loadMessages(String conversationId) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '$_messagesPrefix$conversationId';
    final data = prefs.getString(key);
    if (data == null) return [];

    final jsonList = List<Map<String, dynamic>>.from(jsonDecode(data));
    return jsonList.map((j) => ChatMessage.fromJson(j)).toList();
  }

  /// Load the most recent [pageSize] messages for a conversation.
  /// Returns (messages, hasMore) where hasMore indicates older messages exist.
  Future<(List<ChatMessage>, bool)> loadMessagesPage(
    String conversationId, {
    int pageSize = defaultPageSize,
  }) async {
    final all = await loadMessages(conversationId);
    if (all.length <= pageSize) {
      return (all, false);
    }
    final start = all.length - pageSize;
    return (all.sublist(start), true);
  }

  /// Load an older page of messages. [offset] is how many messages to skip
  /// from the end (e.g. after loading the first page of 30, offset=30 loads
  /// the next 30 older messages).
  Future<List<ChatMessage>> loadMessagesPageOffset(
    String conversationId, {
    required int offset,
    int pageSize = defaultPageSize,
  }) async {
    final all = await loadMessages(conversationId);
    final end = all.length - offset;
    if (end <= 0) return [];
    final start = end - pageSize;
    return all.sublist(start < 0 ? 0 : start, end);
  }
}
