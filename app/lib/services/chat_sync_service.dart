import 'dart:math';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/conversation.dart';
import '../models/chat_message.dart';

/// Generates a UUID v4 without external dependencies.
String generateUuid() {
  final r = Random.secure();
  final bytes = List<int>.generate(16, (_) => r.nextInt(256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
}

/// Syncs conversations and messages from local storage to Supabase so the
/// admin panel can display them.  All methods swallow errors so the app
/// works normally even when offline or Supabase is unreachable.
class ChatSyncService {
  static final _client = Supabase.instance.client;

  /// Upsert (insert or update) a conversation row.
  static Future<void> syncConversation(Conversation convo) async {
    try {
      final user = _client.auth.currentUser;
      if (user == null || convo.supabaseId == null) return;
      await _client.from('conversations').upsert({
        'id': convo.supabaseId,
        'user_id': user.id,
        'title': convo.title,
        'model': convo.model,
        'is_archived': convo.isArchived,
        'created_at': convo.createdAt.toIso8601String(),
        'updated_at': convo.updatedAt.toIso8601String(),
      }, onConflict: 'id');
    } catch (_) {}
  }

  /// Insert a single message row.
  static Future<void> syncMessage(
      String? conversationId, ChatMessage msg) async {
    try {
      final user = _client.auth.currentUser;
      if (user == null || conversationId == null || conversationId.isEmpty) {
        return;
      }
      await _client.from('messages').insert({
        'conversation_id': conversationId,
        'role': msg.role,
        'content': msg.content,
        'tokens_used': msg.tokensUsed,
        'model': msg.model,
        'created_at': msg.createdAt.toIso8601String(),
      });
    } catch (_) {}
  }

  /// Update a conversation title.
  static Future<void> syncTitle(String? conversationId, String title) async {
    try {
      if (conversationId == null || conversationId.isEmpty) return;
      await _client.from('conversations').update({
        'title': title,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', conversationId);
    } catch (_) {}
  }
}
