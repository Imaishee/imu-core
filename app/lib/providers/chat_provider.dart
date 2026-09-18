import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/chat_message.dart';
import '../models/conversation.dart';
import '../services/ai_actions_service.dart';
import '../services/chat_service.dart';
import '../services/chat_sync_service.dart';
import '../services/local_storage.dart';
import '../services/timetable_service.dart';
import '../services/vision_service.dart';
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

  Future<void> sendMessage(String content, {String? image}) async {
    if (content.trim().isEmpty && (image == null || image.isEmpty)) return;

    // If an image is attached, try to extract timetable classes from it first.
    if (image != null && image.isNotEmpty) {
      try {
        final vision = VisionService();
        final classes = await vision.parseTimetableImage(image,
            prompt: 'Extract the full timetable from this image.');
        if (classes.isNotEmpty) {
          final svc = TimetableService();
          final existing = await svc.loadLocal();
          var added = 0;
          for (final c in classes) {
            if (!AiActionsService.isDuplicate(existing, c)) {
              existing.add(c);
              added++;
            }
          }
          await svc.saveAll(existing);
          if (added > 0) {
            state = [
              ...state,
              ChatMessage(
                conversationId: _conversationId,
                role: 'user',
                content: content.isEmpty
                    ? '📷 Imported $added class(es) from image'
                    : content,
              ),
            ];
            state = [
              ...state,
              ChatMessage(
                conversationId: _conversationId,
                role: 'assistant',
                content: '📷 Imported $added class(es) from your timetable image${
                    content.isEmpty ? '' : ' ($content)'
                  }. You can edit them in the Timetable tab.',
              ),
            ];
            await ref.read(localStorageProvider).saveMessages(_conversationId, state);
            await ref.read(timetableProvider.notifier).refresh();
            // Still let the AI respond with a friendly confirmation.
          }
        }
      } catch (e) {
        print('[ChatProvider] Vision parse error: $e');
      }
    }

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

    ref.read(thinkingStatusProvider.notifier).state = 'Thinking…';

    try {
      final apiMessages = state
          .where((m) => (m.role == 'user' || m.role == 'assistant') && m.content.isNotEmpty)
          .map((m) => {'role': m.role, 'content': m.content})
          .toList();

      // Build timetable + alarm context so the AI can answer schedule questions.
      final Map<String, dynamic> chatContext = {};
      try {
        final classes = await TimetableService().loadLocal();
        if (classes.isNotEmpty) {
          chatContext['classes'] = classes.map((c) => {
            'course_name': c.courseName,
            'course_code': c.courseCode,
            'day': c.day,
            'start_time': c.startTime,
            'end_time': c.endTime,
            'room': c.room,
            'instructor': c.instructor,
          }).toList();
        }
      } catch (e) {
        print('[ChatProvider] Load timetable context error: $e');
      }
      try {
        final alarms = await AiActionsService.loadAlarms();
        if (alarms.isNotEmpty) {
          chatContext['alarms'] = alarms.map((a) => {
            'label': a.label,
            'time': a.time,
            'days': a.days,
          }).toList();
        }
      } catch (e) {
        print('[ChatProvider] Load alarms context error: $e');
      }

      // Chunk buffer: accumulate text, flush to state every 50ms to reduce rebuilds.
      final StringBuffer _chunkBuffer = StringBuffer();
      DateTime _lastFlush = DateTime.now();

      Future<void> _flushBuffer() async {
        if (_chunkBuffer.isEmpty) return;
        final text = _chunkBuffer.toString();
        _chunkBuffer.clear();
        _lastFlush = DateTime.now();

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
      }

      // Read selected model from settings
      final prefs = await SharedPreferences.getInstance();
      final selectedModel = prefs.getString('selected_model') ?? 'openai/gpt-oss-120b';

      // ALL messages go through streaming chat — no client-side routing heuristic.
      // The AI in the chat endpoint has timetable/alarm context and handles scheduling.
      await for (final event in ref
          .read(chatServiceProvider)
          .streamChat(
            messages: apiMessages,
            conversationId: _conversationId,
            context: chatContext.isNotEmpty ? chatContext : null,
            model: selectedModel,
          )) {
        final type = event['type'];

        if (type == 'status') {
          await _flushBuffer();
          final step = event['step'] ?? 'working';
          final detail = event['detail'] ?? '';
          ref.read(thinkingStatusProvider.notifier).state =
              '${step == 'searching' ? '🔍 Searching' : step == 'thinking' ? '🧠 Thinking' : step == 'scraping' ? '🌐 Reading page' : '⚙️ Working'}' +
              (detail.isNotEmpty ? ' — $detail' : '');
        } else if (type == 'chunk') {
          final text = event['text'] as String;
          if (text.isNotEmpty) {
            _chunkBuffer.write(text);
            // Flush if enough time has passed since last flush
            if (DateTime.now().difference(_lastFlush).inMilliseconds >= 50) {
              await _flushBuffer();
            }
          }
        }
      }
      // Final flush for any remaining buffered text
      await _flushBuffer();

      // Background action check: after chat responds, silently check if the AI
      // mentioned scheduling (the chat endpoint sends timetable context, so the
      // AI may say "I'll add that class"). If actions exist, apply them.
      _applyActionsInBackground(content);
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

  /// Silently check if the user's message was a scheduling request and apply
  /// actions in the background. This runs after the chat response so the user
  /// sees the AI reply first, then any timetable/alarm changes happen.
  void _applyActionsInBackground(String userMessage) async {
    try {
      final outcome = await AiActionsService().applyPrompt(userMessage);
      if (outcome.hasChanges) {
        await ref.read(timetableProvider.notifier).refresh();
        // Append action results as a system note
        state = [
          ...state,
          ChatMessage(
            conversationId: _conversationId,
            role: 'assistant',
            content: outcome.message,
          ),
        ];
        ref.read(localStorageProvider).saveMessages(_conversationId, state);
      }
    } catch (e) {
      print('[ChatProvider] Background actions error: $e');
      // Silently ignore — the chat response is already shown
    }
  }
}