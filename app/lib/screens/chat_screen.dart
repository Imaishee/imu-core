import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart' as markdown;
import 'package:image_picker/image_picker.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../providers/chat_provider.dart';
import '../services/voice_service.dart';
import '../theme/app_theme.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final String? initialPrompt;
  const ChatScreen({super.key, required this.conversationId, this.initialPrompt});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  final _voiceService = VoiceService();
  bool _isStreaming = false;
  File? _pendingImage;

  // Scroll debounce
  Timer? _scrollTimer;

  @override
  void initState() {
    super.initState();
    _voiceService.initialize();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.initialPrompt != null && widget.initialPrompt!.isNotEmpty) {
        _inputController.text = widget.initialPrompt!;
        _sendMessage();
      }
    });
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    _voiceService.dispose();
    _scrollTimer?.cancel();
    super.dispose();
  }

  void _scrollToBottom() {
    _scrollTimer?.cancel();
    _scrollTimer = Timer(const Duration(milliseconds: 300), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(_scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      }
    });
  }

  Future<void> _pickImage() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 70, maxWidth: 1024);
    if (picked != null) setState(() => _pendingImage = File(picked.path));
  }

  void _showRenameDialog(BuildContext context, WidgetRef ref, String convoId, String currentTitle) {
    final ctrl = TextEditingController(text: currentTitle);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: Text('Rename Chat', style: TextStyle(color: AppTheme.textMain)),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          style: TextStyle(color: AppTheme.textMain),
          decoration: InputDecoration(
            hintText: 'Chat name',
            hintStyle: TextStyle(color: AppTheme.textMuted),
            filled: true,
            fillColor: AppTheme.darkBg,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.greenLight)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
          TextButton(
            onPressed: () {
              final newTitle = ctrl.text.trim();
              if (newTitle.isNotEmpty) {
                ref.read(conversationsProvider.notifier).updateTitle(convoId, newTitle);
              }
              Navigator.pop(ctx);
            },
            child: Text('Save', style: TextStyle(color: AppColors.greenLight)),
          ),
        ],
      ),
    );
  }

  Future<void> _sendMessage() async {
    final text = _inputController.text.trim();
    if ((text.isEmpty && _pendingImage == null) || _isStreaming) return;
    _inputController.clear();
    setState(() { _isStreaming = true; _pendingImage = null; });
    await ref.read(messagesProvider(widget.conversationId).notifier).sendMessage(text);
    setState(() => _isStreaming = false);
    _scrollToBottom();
  }

  // Hold-to-talk voice input
  bool _isRecording = false;
  String _voiceText = '';

  void _startVoice() async {
    if (_isRecording) return;
    setState(() { _isRecording = true; _voiceText = ''; });
    await _voiceService.startListening(
      onResult: (text, isFinal) {
        setState(() => _voiceText = text);
        if (isFinal && text.isNotEmpty) {
          _inputController.text = text;
          _stopVoice();
        }
      },
    );
  }

  void _stopVoice() async {
    if (!_isRecording) return;
    final text = await _voiceService.stopListening();
    setState(() => _isRecording = false);
    if (text.isNotEmpty) {
      _inputController.text = text;
      // Auto-send after hold-to-talk
      _sendMessage();
    }
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(messagesProvider(widget.conversationId));
    final thinking = ref.watch(thinkingStatusProvider);
    final convos = ref.watch(conversationsProvider);
    final title = convos.where((c) => c.remoteId == widget.conversationId).map((c) => c.title).firstOrNull ?? "New Chat";

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: GestureDetector(
          onTap: () => _showRenameDialog(context, ref, widget.conversationId, title),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Flexible(
                child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textMain)),
              ),
              const SizedBox(width: 6),
              Icon(Icons.edit, size: 14, color: AppTheme.textMuted),
            ],
          ),
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(activeConversationProvider.notifier).set(null);
            },
            icon: Icon(Icons.add, color: AppTheme.textMain),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: messages.isEmpty && thinking == null
                ? _buildEmptyState()
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: messages.length + (thinking != null ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == messages.length && thinking != null) {
                        return _ThinkingIndicator(text: thinking);
                      }
                      final msg = messages[index];
                      final isUser = msg.role == 'user';
                      final isLastAssistant = index == messages.length - 1 && !isUser;
                      return _MessageWidget(
                        message: msg,
                        isUser: isUser,
                        isStreaming: isLastAssistant && _isStreaming,
                        isLast: isLastAssistant,
                      );
                    },
                  ),
          ),
          if (_isRecording)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppColors.greenPrimary.withAlpha(20),
              child: Row(
                children: [
                  const SizedBox(width: 8, height: 8, child: CircularProgressIndicator(strokeWidth: 1.5, color: Colors.redAccent)),
                  const SizedBox(width: 10),
                  Text(_voiceText.isEmpty ? 'Listening... hold to talk' : _voiceText,
                      style: TextStyle(color: AppTheme.textMain, fontSize: 13)),
                ],
              ),
            ),
          if (_pendingImage != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Stack(children: [
                    ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.file(_pendingImage!, width: 56, height: 56, fit: BoxFit.cover)),
                    Positioned(top: -6, right: -6, child: GestureDetector(onTap: () => setState(() => _pendingImage = null), child: Container(width: 22, height: 22, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle), child: const Icon(Icons.close, size: 14, color: Colors.white)))),
                  ]),
                ],
              ),
            ),
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [AppColors.greenPrimary, AppColors.greenLight], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Center(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: FittedBox(
                  child: Text("I'MU", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text("Hi, I'm I'MU", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: AppTheme.textMain)),
          const SizedBox(height: 6),
          Text('How can I help you today?', style: TextStyle(color: AppTheme.textMuted)),
        ],
      ),
    );
  }

  Widget _buildInputBar() {
    final hasText = _inputController.text.trim().isNotEmpty;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppTheme.bg, border: Border(top: BorderSide(color: AppTheme.border))),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: AppTheme.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppTheme.border)),
                child: Icon(Icons.add, color: AppTheme.textMuted),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _inputController,
                onChanged: (_) => setState(() {}),
                onSubmitted: (_) => _sendMessage(),
                textInputAction: TextInputAction.send,
                minLines: 1,
                maxLines: 4,
                style: TextStyle(color: AppTheme.textMain, fontSize: 14),
                decoration: InputDecoration(
                  hintText: "Ask anything…",
                  hintStyle: TextStyle(color: AppTheme.textMuted),
                  filled: true,
                  fillColor: AppTheme.surface,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(22), borderSide: BorderSide(color: AppTheme.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(22), borderSide: BorderSide(color: AppTheme.border)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(22), borderSide: const BorderSide(color: AppColors.greenLight, width: 1.6)),
                ),
              ),
            ),
            const SizedBox(width: 10),
            // Mic or Send button
            GestureDetector(
              onTap: _isStreaming ? null : (hasText ? _sendMessage : null),
              onLongPress: hasText ? null : _startVoice,
              onLongPressEnd: hasText ? null : (_) => _stopVoice(),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: _isRecording
                      ? Colors.redAccent
                      : hasText
                          ? AppColors.greenPrimary
                          : AppTheme.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: hasText ? null : Border.all(color: AppTheme.border),
                ),
                child: _isStreaming
                    ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : _isRecording
                        ? const Icon(Icons.mic, color: Colors.white, size: 20)
                        : hasText
                            ? const Icon(Icons.arrow_upward_rounded, color: Colors.white, size: 20)
                            : Icon(Icons.mic, color: AppTheme.textMuted, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Thinking indicator ───────────────────────────────────────────────
class _ThinkingIndicator extends StatelessWidget {
  final String text;
  const _ThinkingIndicator({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 38),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(width: 8, height: 8, child: CircularProgressIndicator(strokeWidth: 1.4, color: AppColors.greenLight)),
                const SizedBox(width: 8),
                Text(text, style: TextStyle(color: AppTheme.textMuted, fontSize: 13, fontStyle: FontStyle.italic)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Message widget: hybrid layout ────────────────────────────────────
class _MessageWidget extends StatelessWidget {
  final dynamic message;
  final bool isUser;
  final bool isStreaming;
  final bool isLast;

  const _MessageWidget({
    required this.message,
    required this.isUser,
    this.isStreaming = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    final content = message.content as String? ?? '';
    if (content.isEmpty && !isStreaming) return const SizedBox.shrink();

    if (isUser) return _UserMessage(content: content);
    return _AiMessage(content: content, isStreaming: isStreaming, isLast: isLast);
  }
}

// ─── User message: clean bubble, right-aligned ────────────────────────
class _UserMessage extends StatelessWidget {
  final String content;
  const _UserMessage({required this.content});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Spacer(flex: 2),
          Flexible(
            flex: 3,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.greenPrimary,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: const Radius.circular(16),
                  bottomRight: const Radius.circular(4),
                ),
              ),
              child: Text(content, style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.4)),
            ),
          ),
          const SizedBox(width: 10),
          Container(
            width: 28, height: 28,
            decoration: BoxDecoration(color: AppTheme.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
            child: Icon(Icons.person_outline, size: 16, color: AppTheme.textMuted),
          ),
        ],
      ),
    );
  }
}

// ─── AI message: flat, no bubble, ChatGPT-style ──────────────────────
class _AiMessage extends StatelessWidget {
  final String content;
  final bool isStreaming;
  final bool isLast;

  const _AiMessage({required this.content, this.isStreaming = false, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28, height: 28,
            decoration: BoxDecoration(color: AppColors.greenPrimary, borderRadius: BorderRadius.circular(10)),
            child: const Center(
              child: Padding(
                padding: EdgeInsets.all(5),
                child: FittedBox(
                  child: Text("I'MU", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _MarkdownContent(content: content),
                if (isStreaming)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: SizedBox(
                      width: 8, height: 14,
                      child: DecoratedBox(
                        decoration: BoxDecoration(color: AppColors.greenLight, borderRadius: BorderRadius.circular(2)),
                      ),
                    ),
                  ),
                if (!isStreaming && content.isNotEmpty && isLast)
                  _MessageActions(content: content),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Message actions: like / dislike / copy / share ───────────────────
class _MessageActions extends StatelessWidget {
  final String content;
  const _MessageActions({required this.content});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        children: [
          _actionIcon(Icons.thumb_up_outlined, () => _submitFeedback(context, 'like')),
          const SizedBox(width: 4),
          _actionIcon(Icons.thumb_down_outlined, () => _submitFeedback(context, 'dislike')),
          const SizedBox(width: 4),
          _actionIcon(Icons.content_copy_outlined, () {
            Clipboard.setData(ClipboardData(text: content));
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: const Text('Copied!'),
              backgroundColor: AppColors.greenPrimary,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ));
          }),
          const SizedBox(width: 4),
          _actionIcon(Icons.share_outlined, () => SharePlus.instance.share(ShareParams(text: content))),
        ],
      ),
    );
  }

  Widget _actionIcon(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Icon(icon, size: 16, color: AppTheme.textMuted),
      ),
    );
  }

  void _submitFeedback(BuildContext context, String feedback) async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      await Supabase.instance.client.from('message_feedback').insert({
        'user_id': user.id,
        'message_content': content,
        'feedback': feedback,
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(feedback == 'like' ? 'Thanks for the feedback!' : 'Thanks, we\'ll improve!'),
          backgroundColor: AppColors.greenPrimary,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ));
      }
    } catch (_) {}
  }
}

// ─── Markdown content with table scroll ───────────────────────────────
class _MarkdownContent extends StatelessWidget {
  final String content;
  const _MarkdownContent({required this.content});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: ConstrainedBox(
        constraints: BoxConstraints(minWidth: MediaQuery.of(context).size.width - 80),
        child: markdown.MarkdownBody(
          data: content,
          selectable: true,
          styleSheet: markdown.MarkdownStyleSheet(
            p: TextStyle(color: AppTheme.textMain, fontSize: 14, height: 1.6),
            code: TextStyle(backgroundColor: AppTheme.darkBg, color: AppColors.greenMint, fontSize: 13),
            codeblockDecoration: BoxDecoration(color: AppTheme.darkBg, borderRadius: BorderRadius.circular(10)),
            blockquote: TextStyle(color: AppTheme.textMuted, fontStyle: FontStyle.italic),
            blockquoteDecoration: BoxDecoration(border: Border(left: BorderSide(color: AppColors.greenLight, width: 3))),
            h1: TextStyle(color: AppTheme.textMain, fontSize: 20, fontWeight: FontWeight.bold),
            h2: TextStyle(color: AppTheme.textMain, fontSize: 18, fontWeight: FontWeight.bold),
            h3: TextStyle(color: AppTheme.textMain, fontSize: 16, fontWeight: FontWeight.bold),
            listBullet: TextStyle(color: AppColors.greenLight),
            tableHead: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w600, fontSize: 13),
            tableBody: TextStyle(color: AppTheme.textMain, fontSize: 13),
            tableBorder: TableBorder.all(color: AppTheme.border, width: 1),
            tableCellsPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          ),
        ),
      ),
    );
  }
}
