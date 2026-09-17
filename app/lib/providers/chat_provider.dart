import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/chat_message.dart';
import '../models/conversation.dart';
import '../services/ai_actions_service.dart';
import '../services/chat_service.dart';
import '../services/chat_sync_service.dart';
import '../services/local_storage.dart';
import 'app_provider.dart';

final chatServiceProvider = Provider((ref) => ChatService());
final localStorageProvider = Provider((ref) => LocalStorage());

// Conversations list
final conversationsProvider =
    NotifierProvider<ConversationsNotifier, List<Conversation>>(
        ConversationsNotifier.new);

// Active conversation id
final activeConversationProvider =
    NotifierProvider<ActiveConversationNotifier, String?>(
        ActiveConversationNotifier.new);

// Messages by conversation
final messagesProvider =
    NotifierProvider.family<MessagesNotifier, List<ChatMessage>, String>(
        MessagesNotifier.new);

// Thinking/search status shown while AI is working
final thinkingStatusProvider =
    NotifierProvider<ThinkingStatusNotifier, String?>(ThinkingStatusNotifier.new);

class ThinkingStatusNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void set(String? value) => state = value;
}

class ConversationsNotifier extends Notifier<List<Conversation>> {
  @override
  List<Conversation> build() {
    _load();
    return [];
  }

  Future<void> _load() async {
    state = await ref.read(localStorageProvider).loadConversations();
  }

  Conversation create() {
    final convo = Conversation(
      remoteId: DateTime.now().millisecondsSinceEpoch.toString(),
      supabaseId: generateUuid(),
      title: 'New Chat',
    );
    state = [convo, ...state];
    _save();
    ChatSyncService.syncConversation(convo);
    return convo;
  }

  void updateTitle(String id, String title) {
    for (final c in state) {
      if (c.remoteId == id) {
        c.title = title;
        c.updatedAt = DateTime.now();
      }
    }
    _save();
    final convo = state.firstWhere((c) => c.remoteId == id,
        orElse: () => Conversation(remoteId: '', title: ''));
    ChatSyncService.syncTitle(convo.supabaseId, title);
  }

  void delete(String id) {
    state = state.where((c) => c.remoteId != id).toList();
    _save();
  }

  void _save() =>
      ref.read(localStorageProvider).saveConversations(state);
}

class ActiveConversationNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void set(String? id) => state = id;
}

class MessagesNotifier extends Notifier<List<ChatMessage>> {
  MessagesNotifier(this._conversationId);
  final String _conversationId;

  @override
  List<ChatMessage> build() {
    _load();
    return [];
  }

  Future<void> _load() async {
    state = await ref.read(localStorageProvider).loadMessages(_conversationId);
  }

  String _autoTitle(String content) {
    final words = content.trim().split(RegExp(r'\s+'));
    if (words.length <= 6) return content.trim();
    return words.sublist(0, 6).join(' ') + '…';
  }

  /// Client-side gate deciding whether a message should be routed to the
  /// tool-calling `ai-actions` endpoint instead of the streaming chat.
  ///
  /// Deliberately generous: an over-match only costs one extra (fast) hop,
  /// because a reply with no actions falls straight through to normal chat.
  /// Under-matching is the real failure — it silently ignores "set my alarm".
  static bool looksLikeScheduling(String s) {
    final lower = s.toLowerCase();

    // Scheduling nouns.
    if (RegExp(
            r'\b(alarms?|remind(er|ers)?|timetables?|time\s+table|schedules?|classes|class|lectures?|periods?|routines?)\b')
        .hasMatch(lower)) {
      return true;
    }

    // A weekday mention is almost always a timetable or alarm edit.
    if (RegExp(
            r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b')
        .hasMatch(lower)) {
      return true;
    }

    // "add/set/delete ... at 7pm" style requests with no scheduling noun.
    const verbs = [
      'add',
      'create',
      'set',
      'delete',
      'remove',
      'clear',
      'cancel',
      'update',
      'import',
    ];
    final hasVerb = verbs.any(lower.contains);
    final hasTime = RegExp(
            r"\d|o'?clock|\bam\b|\bpm\b|morning|afternoon|evening")
        .hasMatch(lower);
    return hasVerb && hasTime;
  }

  Future<void> sendMessage(String content) async {
    if (content.trim().isEmpty) return;

    final convoNotifier = ref.read(conversationsProvider.notifier);

    // Add user message
    final userMsg = ChatMessage(
      conversationId: _conversationId,
      role: 'user',
      content: content,
    );
    state = [...state, userMsg];

    // Auto-title if this is first real message (no assistant content yet)
    final hasAssistant = state.any((m) => m.role == 'assistant');
    if (!hasAssistant) {
      convoNotifier.updateTitle(_conversationId, _autoTitle(content));
    }

    // Scheduling requests need real actions, which the streaming chat endpoint
    // cannot perform. Route them through the tool-calling service first.
    if (looksLikeScheduling(content)) {
      ref.read(thinkingStatusProvider.notifier).state = '⚙️ Applying…';
      try {
        final outcome = await AiActionsService().applyPrompt(content);
        ref.read(thinkingStatusProvider.notifier).state = null;
        if (outcome.hasChanges) {
          await ref.read(timetableProvider.notifier).refresh();
          state = [
            ...state,
            ChatMessage(
              conversationId: _conversationId,
              role: 'assistant',
              content: outcome.reply,
            ),
          ];
          ref.read(localStorageProvider).saveMessages(_conversationId, state);
          // Sync conversation and messages to Supabase for admin visibility.
          final convo = ref
              .read(conversationsProvider)
              .where((c) => c.remoteId == _conversationId)
              .firstOrNull;
          if (convo != null) {
            ChatSyncService.syncConversation(convo);
            for (final m in state) {
              ChatSyncService.syncMessage(convo.supabaseId, m);
            }
          }
          return;
        }
      } catch (_) {
        // fall through to normal chat
      } finally {
        ref.read(thinkingStatusProvider.notifier).state = null;
      }
    }

    ref.read(thinkingStatusProvider.notifier).state = 'Thinking…';

    try {
      final apiMessages = state
          .where((m) => (m.role == 'user' || m.role == 'assistant') && m.content.isNotEmpty)
          .map((m) => {'role': m.role, 'content': m.content})
          .toList();

      String fullContent = '';
      await for (final event in ref
          .read(chatServiceProvider)
          .streamChat(messages: apiMessages, conversationId: _conversationId)) {
        final type = event['type'];

        if (type == 'status') {
          // Show thinking/search etc. above the message
          final step = event['step'] ?? 'working';
          final detail = event['detail'] ?? '';
          ref.read(thinkingStatusProvider.notifier).state =
              '${step == 'searching' ? '🔍 Searching' : step == 'thinking' ? '🧠 Thinking' : step == 'scraping' ? '🌐 Reading page' : '⚙️ Working'}' +
              (detail.isNotEmpty ? ' — $detail' : '');
        } else if (type == 'chunk') {
          final text = event['text'] as String;
          if (text.isNotEmpty) {
            if (state.isNotEmpty && state.last.role == 'assistant') {
              final last = state.last;
              state = [
                ...state.sublist(0, state.length - 1),
                ChatMessage(
                  conversationId: _conversationId,
                  role: 'assistant',
                  content: last.content + text,
                ),
              ];
            } else {
              state = [
                ...state,
                ChatMessage(
                  conversationId: _conversationId,
                  role: 'assistant',
                  content: text,
                ),
              ];
            }
            fullContent += text;
          }
        }
      }
    } catch (e) {
      // Replace any partial assistant content
      if (state.isNotEmpty && state.last.role == 'assistant') {
        final last = state.last;
        state = [
          ...state.sublist(0, state.length - 1),
          ChatMessage(
            conversationId: _conversationId,
            role: 'assistant',
            content: last.content.isEmpty ? 'Something went wrong. Please try again.' : last.content,
          ),
        ];
      }
    } finally {
      ref.read(thinkingStatusProvider.notifier).state = null;
    }

    // Save after streaming finishes
    ref.read(localStorageProvider).saveMessages(_conversationId, state);

    // Sync to Supabase for admin visibility.
    final convo = ref
        .read(conversationsProvider)
        .where((c) => c.remoteId == _conversationId)
        .firstOrNull;
    if (convo != null) {
      ChatSyncService.syncConversation(convo);
      for (final m in state) {
        ChatSyncService.syncMessage(convo.supabaseId, m);
      }
    }
  }
}