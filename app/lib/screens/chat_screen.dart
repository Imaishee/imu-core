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
import '../theme/app_widgets.dart';

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
  bool _showGoToBottom = false;

  // Click-to-talk state
  bool _isRecording = false;
  String _voiceText = '';

  // Scroll debounce
  Timer? _scrollTimer;

  @override
  void initState() {
    super.initState();
    _voiceService.initialize();
    _scrollController.addListener(_onScroll);
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

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final atBottom = _scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 80;
    if (atBottom != !_showGoToBottom) {
      setState(() => _showGoToBottom = !atBottom);
    }
  }

  void _scrollToBottom({bool animate = true}) {
    _scrollTimer?.cancel();
    _scrollTimer = Timer(const Duration(milliseconds: 100), () {
      if (!_scrollController.hasClients) return;
      final target = _scrollController.position.maxScrollExtent;
      if (animate) {
        _scrollController.animateTo(target,
            duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      } else {
        _scrollController.jumpTo(target);
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
            fillColor: AppTheme.elevated,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.greenLight)),
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
            child: const Text('Save', style: TextStyle(color: AppColors.greenLight)),
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

  // Click-to-talk: tap once to start, tap again to stop
  void _toggleVoice() async {
    if (_isRecording) {
      // Stop recording
      final text = await _voiceService.stopListening();
      setState(() => _isRecording = false);
      if (text.isNotEmpty) {
        _inputController.text = text;
        // Don't auto-send — let user review and send manually
      }
    } else {
      // Start recording
      setState(() { _isRecording = true; _voiceText = ''; });
      await _voiceService.startListening(
        onResult: (text, isFinal) {
          setState(() => _voiceText = text);
          if (isFinal && text.isNotEmpty) {
            _inputController.text = text;
            setState(() => _isRecording = false);
          }
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(messagesProvider(widget.conversationId));
    final thinking = ref.watch(thinkingStatusProvider);
    final convos = ref.watch(conversationsProvider);
    final title = convos.where((c) => c.remoteId == widget.conversationId).map((c) => c.title).firstOrNull ?? "New Chat";
    final screenWidth = MediaQuery.of(context).size.width;
    final isCompact = screenWidth < 360;

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
                    style: TextStyle(fontSize: isCompact ? 14 : 16, fontWeight: FontWeight.w600, color: AppTheme.textMain)),
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
      body: CutePatternBackground(
        child: Column(
          children: [
            Expanded(
              child: messages.isEmpty && thinking == null
                  ? _buildEmptyState()
                  : Stack(
                      children: [
                        ListView.builder(
                          controller: _scrollController,
                          padding: EdgeInsets.symmetric(horizontal: isCompact ? 10 : 16, vertical: 12),
                          addAutomaticKeepAlives: false,
                          addRepaintBoundaries: true,
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
                        screenWidth: screenWidth,
                        onEdit: isUser ? () {
                          _inputController.text = msg.content;
                          _inputController.selection = TextSelection.fromPosition(
                              TextPosition(offset: msg.content.length));
                        } : null,
                        onResend: isUser ? (text) {
                          _inputController.text = text;
                          _sendMessage();
                        } : null,
                      );
                        },
                      ),
                      // Go-to-bottom FAB
                      if (_showGoToBottom)
                        Positioned(
                          right: 16,
                          bottom: 12,
                          child: GestureDetector(
                            onTap: () => _scrollToBottom(),
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: AppColors.greenPrimary,
                                shape: BoxShape.circle,
                                boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 6, offset: const Offset(0, 2))],
                              ),
                              child: const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 24),
                            ),
                          ),
                        ),
                    ],
                  ),
          ),
          // Recording indicator
          if (_isRecording)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppColors.greenPrimary.withAlpha(20),
              child: Row(
                children: [
                  const SizedBox(width: 8, height: 8, child: CircularProgressIndicator(strokeWidth: 1.5, color: Colors.redAccent)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(_voiceText.isEmpty ? 'Listening… tap mic to stop' : _voiceText,
                        style: TextStyle(color: AppTheme.textMain, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ),
          // Pending image preview
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
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: AppTheme.bg, border: Border(top: BorderSide(color: AppTheme.border))),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Image picker
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                width: 40, height: 40,
                decoration: BoxDecoration(color: AppTheme.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
                child: Icon(Icons.add, color: AppTheme.textMuted, size: 20),
              ),
            ),
            const SizedBox(width: 8),
            // Text field
            Expanded(
              child: TextField(
                controller: _inputController,
                onChanged: (_) => setState(() {}),
                onSubmitted: (_) => _sendMessage(),
                textInputAction: TextInputAction.send,
                minLines: 1,
                maxLines: 5,
                style: TextStyle(color: AppTheme.textMain, fontSize: 15),
                decoration: InputDecoration(
                  hintText: "Ask anything…",
                  hintStyle: TextStyle(color: AppTheme.textMuted),
                  filled: true,
                  fillColor: AppTheme.surface,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: AppTheme.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: AppTheme.border)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: AppColors.greenLight, width: 1.5)),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Mic button (always visible, toggles recording)
            GestureDetector(
              onTap: _isStreaming ? null : _toggleVoice,
              child: Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: _isRecording ? Colors.redAccent : AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: _isRecording ? null : Border.all(color: AppTheme.border),
                ),
                child: Icon(_isRecording ? Icons.stop : Icons.mic, color: _isRecording ? Colors.white : AppTheme.textMuted, size: 20),
              ),
            ),
            const SizedBox(width: 8),
            // Send button
            GestureDetector(
              onTap: _isStreaming ? null : (hasText ? _sendMessage : null),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: hasText ? AppColors.greenPrimary : AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: hasText ? null : Border.all(color: AppTheme.border),
                ),
                child: _isStreaming
                    ? const Padding(padding: EdgeInsets.all(10), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Icon(Icons.arrow_upward_rounded, color: hasText ? Colors.white : AppTheme.textMuted, size: 20),
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

// ─── Message widget ──────────────────────────────────────────────────
class _MessageWidget extends StatelessWidget {
  final dynamic message;
  final bool isUser;
  final bool isStreaming;
  final bool isLast;
  final double screenWidth;
  final VoidCallback? onEdit;
  final void Function(String)? onResend;

  const _MessageWidget({
    required this.message,
    required this.isUser,
    this.isStreaming = false,
    this.isLast = false,
    this.screenWidth = 400,
    this.onEdit,
    this.onResend,
  });

  @override
  Widget build(BuildContext context) {
    final content = message.content as String? ?? '';
    if (content.isEmpty && !isStreaming) return const SizedBox.shrink();

    if (isUser) return RepaintBoundary(child: _UserMessage(content: content, screenWidth: screenWidth, onEdit: onEdit, onResend: onResend));
    return RepaintBoundary(child: _AiMessage(content: content, isStreaming: isStreaming, isLast: isLast, screenWidth: screenWidth));
  }
}

// ─── User message: right-aligned with long-press menu ────────────────
class _UserMessage extends StatelessWidget {
  final String content;
  final double screenWidth;
  final VoidCallback? onEdit;
  final void Function(String)? onResend;
  const _UserMessage({required this.content, this.screenWidth = 400, this.onEdit, this.onResend});

  @override
  Widget build(BuildContext context) {
    final isCompact = screenWidth < 360;
    return GestureDetector(
      onLongPress: () => _showUserMenu(context),
      child: Padding(
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
                child: Text(content,
                    style: TextStyle(color: Colors.white, fontSize: isCompact ? 13 : 14, height: 1.4)),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 28, height: 28,
              decoration: BoxDecoration(color: AppTheme.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
              child: Icon(Icons.person_outline, size: 16, color: AppTheme.textMuted),
            ),
          ],
        ),
      ),
    );
  }

  void _showUserMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.copy, color: AppTheme.textMain),
              title: Text('Copy', style: TextStyle(color: AppTheme.textMain)),
              onTap: () {
                Navigator.pop(ctx);
                Clipboard.setData(ClipboardData(text: content));
                ScaffoldMessenger.of(context).showSnackBar(_snackBar('Copied!'));
              },
            ),
            if (onEdit != null)
              ListTile(
                leading: Icon(Icons.edit, color: AppTheme.textMain),
                title: Text('Edit & Resend', style: TextStyle(color: AppTheme.textMain)),
                onTap: () {
                  Navigator.pop(ctx);
                  onEdit!();
                },
              ),
            if (onResend != null)
              ListTile(
                leading: Icon(Icons.refresh, color: AppTheme.textMain),
                title: Text('Resend', style: TextStyle(color: AppTheme.textMain)),
                onTap: () {
                  Navigator.pop(ctx);
                  onResend!(content);
                },
              ),
            ListTile(
              leading: Icon(Icons.share, color: AppTheme.textMain),
              title: Text('Share', style: TextStyle(color: AppTheme.textMain)),
              onTap: () {
                Navigator.pop(ctx);
                SharePlus.instance.share(ShareParams(text: content));
              },
            ),
          ],
        ),
      ),
    );
  }

  SnackBar _snackBar(String text) => SnackBar(
    content: Text(text),
    backgroundColor: AppColors.greenPrimary,
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  );
}

// ─── AI message: flat, ChatGPT-style ─────────────────────────────────
class _AiMessage extends StatelessWidget {
  final String content;
  final bool isStreaming;
  final bool isLast;
  final double screenWidth;

  const _AiMessage({required this.content, this.isStreaming = false, this.isLast = false, this.screenWidth = 400});

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
                _MarkdownContent(content: content, screenWidth: screenWidth),
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

// ─── Message actions: like / dislike / copy / share (below last AI msg)
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
            ScaffoldMessenger.of(context).showSnackBar(_snackBar('Copied!'));
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

  SnackBar _snackBar(String text) => SnackBar(
    content: Text(text),
    backgroundColor: AppColors.greenPrimary,
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  );

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
        ScaffoldMessenger.of(context).showSnackBar(_snackBar(
          feedback == 'like' ? 'Thanks for the feedback!' : 'Thanks, we\'ll improve!',
        ));
      }
    } catch (_) {}
  }
}

// ─── Markdown content: horizontal scroll ONLY for tables and code blocks ─
class _MarkdownContent extends StatelessWidget {
  final String content;
  final double screenWidth;
  const _MarkdownContent({required this.content, this.screenWidth = 400});

  @override
  Widget build(BuildContext context) {
    final isCompact = screenWidth < 360;
    final fontSize = isCompact ? 13.0 : 14.0;
    final codeFontSize = isCompact ? 12.0 : 13.0;

    return markdown.MarkdownBody(
      data: content,
      selectable: true,
      styleSheet: markdown.MarkdownStyleSheet(
        p: TextStyle(color: AppTheme.textMain, fontSize: fontSize, height: 1.6),
        code: TextStyle(backgroundColor: AppTheme.elevated, color: AppColors.greenMint, fontSize: codeFontSize),
        codeblockDecoration: BoxDecoration(color: AppTheme.elevated, borderRadius: BorderRadius.circular(10)),
        blockquote: TextStyle(color: AppTheme.textMuted, fontStyle: FontStyle.italic),
        blockquoteDecoration: BoxDecoration(border: Border(left: BorderSide(color: AppColors.greenLight, width: 3))),
        h1: TextStyle(color: AppTheme.textMain, fontSize: fontSize + 6, fontWeight: FontWeight.bold),
        h2: TextStyle(color: AppTheme.textMain, fontSize: fontSize + 4, fontWeight: FontWeight.bold),
        h3: TextStyle(color: AppTheme.textMain, fontSize: fontSize + 2, fontWeight: FontWeight.bold),
        listBullet: TextStyle(color: AppColors.greenLight),
        tableHead: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w600, fontSize: codeFontSize),
        tableBody: TextStyle(color: AppTheme.textMain, fontSize: codeFontSize),
        tableBorder: TableBorder.all(color: AppTheme.border, width: 1),
        tableCellsPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      ),
    );
  }
}
