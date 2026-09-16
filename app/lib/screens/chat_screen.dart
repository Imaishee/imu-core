import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../providers/chat_provider.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;
  const ChatScreen({super.key, required this.conversationId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  bool _isStreaming = false;

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _isStreaming) return;

    _inputController.clear();
    setState(() => _isStreaming = true);

    await ref.read(messagesProvider(widget.conversationId).notifier).sendMessage(text);

    setState(() => _isStreaming = false);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(messagesProvider(widget.conversationId));

    // Auto-scroll when new messages arrive
    ref.listen<List<dynamic>>(messagesProvider(widget.conversationId), (prev, next) {
      if (next.length > (prev?.length ?? 0)) {
        _scrollToBottom();
      }
    });

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_ios, size: 20),
        ),
        title: const Text("IM'U", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
        actions: [
          IconButton(
            onPressed: () {
              ref.read(conversationsProvider.notifier).createChat();
              Navigator.pop(context);
            },
            icon: const Icon(Icons.add, size: 22),
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages
          Expanded(
            child: messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Center(
                            child: Text('IM', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18)),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text("IM'U AI", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text(
                          'How can I help you today?',
                          style: TextStyle(color: Colors.white.withAlpha(128)),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final msg = messages[index];
                      final isUser = msg.role == 'user';
                      final isLast = index == messages.length - 1 && !isUser;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Row(
                          mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
                          children: [
                            Flexible(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isUser ? const Color(0xFF27272A) : Colors.transparent,
                                  borderRadius: BorderRadius.only(
                                    topLeft: const Radius.circular(16),
                                    topRight: const Radius.circular(16),
                                    bottomLeft: Radius.circular(isUser ? 16 : 4),
                                    bottomRight: Radius.circular(isUser ? 4 : 16),
                                  ),
                                ),
                                child: isLast && msg.content.isEmpty
                                    ? _buildTypingIndicator()
                                    : isUser
                                        ? Text(msg.content, style: const TextStyle(color: Colors.white, fontSize: 14))
                                        : MarkdownBody(
                                            data: msg.content,
                                            styleSheet: MarkdownStyleSheet(
                                              p: const TextStyle(color: Color(0xFFD4D4D8), fontSize: 14),
                                              code: const TextStyle(
                                                backgroundColor: Color(0xFF27272A),
                                                color: Color(0xFFA78BFA),
                                                fontSize: 13,
                                              ),
                                              codeblockDecoration: BoxDecoration(
                                                color: const Color(0xFF18181B),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              h1: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                                              h2: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                                              h3: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                              listBullet: TextStyle(color: Colors.white.withAlpha(153)),
                                            ),
                                          ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),

          // Input
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: Color(0xFF27272A))),
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF18181B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF27272A)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputController,
                      onSubmitted: (_) => _sendMessage(),
                      textInputAction: TextInputAction.send,
                      maxLines: 4,
                      minLines: 1,
                      decoration: InputDecoration(
                        hintText: "Message IM'U...",
                        hintStyle: TextStyle(color: Colors.white.withAlpha(128)),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _sendMessage,
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.arrow_upward, color: Colors.black, size: 20),
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

  Widget _buildTypingIndicator() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _dot(0),
        const SizedBox(width: 4),
        _dot(150),
        const SizedBox(width: 4),
        _dot(300),
      ],
    );
  }

  Widget _dot(int delay) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 600),
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(128),
        shape: BoxShape.circle,
      ),
    );
  }
}
