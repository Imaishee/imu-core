import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/conversation.dart';
import '../models/chat_message.dart';
import '../services/chat_service.dart';
import '../services/local_storage.dart';

final chatServiceProvider = Provider((ref) => ChatService());
final localStorageProvider = Provider((ref) => LocalStorage());

// Conversations
final conversationsProvider = NotifierProvider<ConversationsNotifier, List<Conversation>>(
  ConversationsNotifier.new,
);

// Active conversation ID (using Notifier instead of StateProvider)
final activeConversationProvider = NotifierProvider<ActiveConversationNotifier, String?>(
  ActiveConversationNotifier.new,
);

class ActiveConversationNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void set(String? id) => state = id;
}

// Messages per conversation (family via constructor)
final messagesProvider = NotifierProvider.family<MessagesNotifier, List<ChatMessage>, String>(
  MessagesNotifier.new,
);

class ConversationsNotifier extends Notifier<List<Conversation>> {
  @override
  List<Conversation> build() {
    _load();
    return [];
  }

  Future<void> _load() async {
    final local = await ref.read(localStorageProvider).loadConversations();
    state = local;
  }

  Conversation createChat() {
    final convo = Conversation(
      remoteId: DateTime.now().millisecondsSinceEpoch.toString(),
      title: 'New Chat',
    );
    state = [convo, ...state];
    _save();
    return convo;
  }

  void updateTitle(String remoteId, String title) {
    state = [
      for (final c in state)
        if (c.remoteId == remoteId)
          Conversation(
            remoteId: c.remoteId,
            title: title,
            model: c.model,
            createdAt: c.createdAt,
            updatedAt: DateTime.now(),
          )
        else
          c
    ];
    _save();
  }

  void deleteChat(String remoteId) {
    state = state.where((c) => c.remoteId != remoteId).toList();
    _save();
  }

  void _save() {
    ref.read(localStorageProvider).saveConversations(state);
  }
}

class MessagesNotifier extends Notifier<List<ChatMessage>> {
  MessagesNotifier(this._convoId);
  final String _convoId;

  @override
  List<ChatMessage> build() {
    _load();
    return [];
  }

  Future<void> _load() async {
    final local = await ref.read(localStorageProvider).loadMessages(_convoId);
    state = local;
  }

  Future<void> sendMessage(String content) async {
    final userMsg = ChatMessage(conversationId: _convoId, role: 'user', content: content);
    state = [...state, userMsg];

    final assistantMsg = ChatMessage(conversationId: _convoId, role: 'assistant', content: '');
    state = [...state, assistantMsg];

    final apiMessages = state
        .where((m) => m.role != 'system' && m.content.isNotEmpty)
        .map((m) => {'role': m.role, 'content': m.content})
        .toList();

    String fullContent = '';
    await for (final chunk in ref.read(chatServiceProvider).streamChat(
      messages: apiMessages.map((m) => {'role': m['role']!, 'content': m['content']!}).toList(),
      conversationId: _convoId,
    )) {
      fullContent += chunk;
      state = [
        ...state.sublist(0, state.length - 1),
        ChatMessage(conversationId: _convoId, role: 'assistant', content: fullContent),
      ];
    }

    ref.read(localStorageProvider).saveMessages(_convoId, state);
  }
}
