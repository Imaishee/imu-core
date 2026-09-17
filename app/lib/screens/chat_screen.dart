import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:image_picker/image_picker.dart';
import 'package:share_plus/share_plus.dart';
import '../providers/chat_provider.dart';
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
  bool _isStreaming = false;
  File? _pendingImage;

  @override
  void initState() {
    super.initState();
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
    super.dispose();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 120), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(_scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
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
                ? Center(
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
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: messages.length + (thinking != null ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == messages.length && thinking != null) {
                        return _ThinkingBubble(text: thinking);
                      }
                      final msg = messages[index];
                      final isUser = msg.role == 'user';
                      final isLastAssistant = index == messages.length - 1 && !isUser;
                      return _MessageBubble(
                        message: msg,
                        isUser: isUser,
                        isStreaming: isLastAssistant && _isStreaming,
                        isLast: isLastAssistant,
                      );
                    },
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
          Container(
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
                  GestureDetector(
                    onTap: _sendMessage,
                    child: Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(color: AppColors.greenPrimary, borderRadius: BorderRadius.circular(14)),
                      child: _isStreaming
                          ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.arrow_upward_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ThinkingBubble extends StatelessWidget {
  final String text;
  const _ThinkingBubble({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 40),
      child: Row(
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: Container(
              key: ValueKey(text),
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
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final dynamic message;
  final bool isUser;
  final bool isStreaming;
  final bool isLast;

  const _MessageBubble({
    required this.message,
    required this.isUser,
    this.isStreaming = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = isUser ? Colors.white : AppTheme.textMain;
    final bubbleColor = isUser ? AppColors.greenPrimary : AppTheme.surface;
    final content = message.content as String? ?? '';

    return Padding(
      padding: EdgeInsets.only(bottom: 12, left: isUser ? 48 : 0, right: isUser ? 0 : 48),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
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
          ],
          Flexible(
            child: GestureDetector(
              onLongPress: !isUser && content.isNotEmpty ? () => _showActions(context, content) : null,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: bubbleColor,
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(16),
                    topRight: const Radius.circular(16),
                    bottomLeft: Radius.circular(isUser ? 16 : 4),
                    bottomRight: Radius.circular(isUser ? 4 : 16),
                  ),
                  border: isUser ? null : Border.all(color: AppTheme.border),
                  boxShadow: isUser
                      ? [BoxShadow(color: AppColors.greenPrimary.withAlpha(35), blurRadius: 14, offset: const Offset(0, 4))]
                      : null,
                ),
                child: isUser
                    ? Text(content, style: TextStyle(color: textColor, fontSize: 14, height: 1.4))
                    : _RichContent(
                        content: content,
                        streaming: isStreaming && content.isEmpty,
                        onChunk: isLast ? () {} : null,
                      ),
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 10),
            Container(
              width: 28, height: 28,
              decoration: BoxDecoration(color: AppTheme.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
              child: Icon(Icons.person_outline, size: 16, color: AppTheme.textMuted),
            ),
          ],
        ],
      ),
    );
  }

  void _showActions(BuildContext context, String content) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 8, bottom: 8), decoration: BoxDecoration(color: AppTheme.textMuted.withAlpha(60), borderRadius: BorderRadius.circular(2))),
            ListTile(
              leading: Icon(Icons.content_copy_outlined, color: AppTheme.textMain),
              title: Text('Copy', style: TextStyle(color: AppTheme.textMain)),
              onTap: () {
                Clipboard.setData(ClipboardData(text: content));
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: const Text('Copied!'),
                  backgroundColor: AppColors.greenPrimary,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ));
              },
            ),
            ListTile(
              leading: Icon(Icons.share, color: AppTheme.textMain),
              title: Text('Share', style: TextStyle(color: AppTheme.textMain)),
              onTap: () {
                SharePlus.instance.share(ShareParams(text: content));
                Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _RichContent extends StatelessWidget {
  final String content;
  final bool streaming;
  final VoidCallback? onChunk;

  const _RichContent({required this.content, this.streaming = false, this.onChunk});

  @override
  Widget build(BuildContext context) {
    final parts = _splitCodeBlocks(content);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: parts.map((part) {
        if (part.isCodeBlock) {
          return _CodeBlock(language: part.language, code: part.content);
        }
        return MarkdownBody(
          data: part.content,
          selectable: true,
          styleSheet: MarkdownStyleSheet(
            p: TextStyle(color: AppTheme.textMain, fontSize: 14, height: 1.5),
            code: TextStyle(backgroundColor: AppTheme.darkBg, color: AppColors.greenMint, fontSize: 13),
            codeblockDecoration: BoxDecoration(color: AppTheme.darkBg, borderRadius: BorderRadius.circular(10)),
            blockquote: TextStyle(color: AppTheme.textMuted, fontStyle: FontStyle.italic),
            blockquoteDecoration: BoxDecoration(border: Border(left: BorderSide(color: AppColors.greenLight, width: 3))),
            h1: TextStyle(color: AppTheme.textMain, fontSize: 20, fontWeight: FontWeight.bold),
            h2: TextStyle(color: AppTheme.textMain, fontSize: 18, fontWeight: FontWeight.bold),
            h3: TextStyle(color: AppTheme.textMain, fontSize: 16, fontWeight: FontWeight.bold),
            listBullet: TextStyle(color: AppColors.greenLight),
            tableBody: TextStyle(color: AppTheme.textMain, fontSize: 13),
            tableHead: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w600, fontSize: 13),
          ),
        );
      }).toList(),
    );
  }
}

class _CodeBlock extends StatelessWidget {
  final String language;
  final String code;

  const _CodeBlock({required this.language, required this.code});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(color: AppTheme.darkBg, borderRadius: BorderRadius.circular(10)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _CodeHeader(language: language, code: code),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
            child: SelectableText(
              code.endsWith('\n') ? code.substring(0, code.length - 1) : code,
              style: const TextStyle(fontSize: 13, height: 1.5, fontFamily: 'Consolas'),
              maxLines: 2000,
            ),
          ),
        ],
      ),
    );
  }
}

class _CodeHeader extends StatelessWidget {
  final String language;
  final String code;

  const _CodeHeader({required this.language, required this.code});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: const Color(0xFF2A3A32), borderRadius: const BorderRadius.vertical(top: Radius.circular(10))),
      child: Row(children: [
        if (language.isNotEmpty) ...[
          Text(language.toUpperCase(), style: const TextStyle(color: AppColors.greenLight, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
          const SizedBox(width: 8),
        ],
        const Spacer(),
        GestureDetector(
          onTap: () {
            Clipboard.setData(ClipboardData(text: code));
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Code copied'), behavior: SnackBarBehavior.floating));
          },
          child: const Row(children: [Icon(Icons.copy, size: 12, color: AppColors.greenLight), SizedBox(width: 4), Text('Copy', style: TextStyle(color: AppColors.greenLight, fontSize: 12))]),
        ),
      ]),
    );
  }
}

List<_ContentPart> _splitCodeBlocks(String content) {
  final List<_ContentPart> result = [];
  final regex = RegExp(r'^```(\w*)\n([\s\S]*?)^```', multiLine: true);
  int lastEnd = 0;
  for (final match in regex.allMatches(content)) {
    if (match.start > lastEnd) {
      final textPart = content.substring(lastEnd, match.start).trim();
      if (textPart.isNotEmpty) {
        result.add(_ContentPart(textPart, false, ''));
      }
    }
    result.add(_ContentPart(match.group(2)!.trimRight(), true, match.group(1)!));
    lastEnd = match.end;
  }
  if (lastEnd < content.length) {
    final rest = content.substring(lastEnd).trim();
    if (rest.isNotEmpty) result.add(_ContentPart(rest, false, ''));
  }
  return result;
}

class _ContentPart {
  final String content;
  final bool isCodeBlock;
  final String language;
  _ContentPart(this.content, this.isCodeBlock, this.language);
}