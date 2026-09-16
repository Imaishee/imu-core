import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/conversation.dart';
import '../models/chat_message.dart';
import '../services/chat_service.dart';
import '../services/local_storage.dart';

final chatServiceProvider = Provider((ref) => ChatService());
final localStorageProvider = Provider((ref) => LocalStorage());

// Conversations state
final conversationsProvider = StateNotifierProvider<ConversationsNotifier, List<Conversation>>((ref) {
  return ConversationsNotifier(ref);
});

class ConversationsNotifier extends StateNotifier<List<Conversation>> {
  final Ref _ref;

  ConversationsNotifier(this._ref) : super([]) {
    _load();
  }

  Future<void> _load() async {
    final local = await _ref.read(localStorageProvider).loadConversations();
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
    state = state.map((c) => c.remoteId == remoteId ? (c..title = title)..updatedAt = DateTime.now() : c).toList();
    _save();
  }

  void deleteChat(String remoteId) {
    state = state.where((c) => c.remoteId != remoteId).toList();
    _save();
  }

  void _save() {
    _ref.read(localStorageProvider).saveConversations(state);
  }
}

// Messages state for active conversation
final activeConversationProvider = StateProvider<String?>((ref) => null);

final messagesProvider = StateNotifierProvider.family<MessagesNotifier, List<ChatMessage>, String>((ref, convoId) {
  return MessagesNotifier(ref, convoId);
});

class MessagesNotifier extends StateNotifier<List<ChatMessage>> {
  final Ref _ref;
  final String _convoId;

  MessagesNotifier(this._ref, this._convoId) : super([]) {
    _load();
  }

  Future<void> _load() async {
    final local = await _ref.read(localStorageProvider).loadMessages(_convoId);
    state = local;
  }

  Future<void> sendMessage(String content) async {
    final userMsg = ChatMessage(
      conversationId: _convoId,
      role: 'user',
      content: content,
    );
    state = [...state, userMsg];
    _save();

    // Start streaming
    final assistantMsg = ChatMessage(
      conversationId: _convoId,
      role: 'assistant',
      content: '',
    );
    state = [...state, assistantMsg];

    final apiMessages = state
        .where((m) => m.role != 'system' && m.content.isNotEmpty)
        .map((m) => {'role': m.role, 'content': m.content})
        .toList();

    String fullContent = '';
    await for (final chunk in _ref.read(chatServiceProvider).streamChat(
      messages: apiMessages.map((m) => {'role': m['role']!, 'content': m['content']!}).toList(),
      conversationId: _convoId,
    )) {
      fullContent += chunk;
      state = [
        ...state.sublist(0, state.length - 1),
        ChatMessage(
          conversationId: _convoId,
          role: 'assistant',
          content: fullContent,
        ),
      ];
    }

    _save();
  }

  void _save() {
    _ref.read(localStorageProvider).saveMessages(_convoId, state);
  }
}

// Streaming state
final isStreamingProvider = StateProvider<bool>((ref) => false);
