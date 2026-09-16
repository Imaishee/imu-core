import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/chat_provider.dart';
import '../constants/app_constants.dart';

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
    if (widget.initialPrompt != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _inputController.text = widget.initialPrompt!;
        _sendMessage();
      });
    }
  }

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

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70, maxWidth: 1024);
    if (picked != null) {
      setState(() => _pendingImage = File(picked.path));
    }
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 70, maxWidth: 1024);
    if (picked != null) {
      setState(() => _pendingImage = File(picked.path));
    }
  }

  Future<void> _sendMessage() async {
    final text = _inputController.text.trim();
    if ((text.isEmpty && _pendingImage == null) || _isStreaming) return;

    _inputController.clear();
    setState(() {
      _isStreaming = true;
      _pendingImage = null;
    });

    final msgText = text.isNotEmpty ? text : 'Analyze this image';
    await ref.read(messagesProvider(widget.conversationId).notifier).sendMessage(msgText);

    setState(() => _isStreaming = false);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(messagesProvider(widget.conversationId));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_ios, size: 20),
        ),
        title: Row(
          children: [
            const Text("IM'U", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFA78BFA).withAlpha(30),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(AppConstants.appVersion, style: const TextStyle(fontSize: 9, color: Color(0xFFA78BFA))),
            ),
          ],
        ),
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
                        Text('How can I help you today?', style: TextStyle(color: Colors.white.withAlpha(128))),
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
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (!isUser) ...[
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFA78BFA),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Center(
                                  child: Text('IM', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 9)),
                                ),
                              ),
                              const SizedBox(width: 8),
                            ],
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

          if (_pendingImage != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(_pendingImage!, width: 60, height: 60, fit: BoxFit.cover),
                      ),
                      Positioned(
                        top: -4,
                        right: -4,
                        child: GestureDetector(
                          onTap: () => setState(() => _pendingImage = null),
                          child: Container(
                            width: 20,
                            height: 20,
                            decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                            child: const Icon(Icons.close, size: 12, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 8),
                  Text('Image attached', style: TextStyle(color: Colors.white.withAlpha(153), fontSize: 12)),
                ],
              ),
            ),

          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: Color(0xFF27272A))),
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF18181B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF27272A)),
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: _showAttachmentSheet,
                    icon: Icon(Icons.add, color: Colors.white.withAlpha(153), size: 22),
                    constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                  ),
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
                        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                      ),
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  ),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: _sendMessage,
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: _isStreaming
                          ? const Padding(
                              padding: EdgeInsets.all(8),
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                            )
                          : const Icon(Icons.arrow_upward, color: Colors.black, size: 20),
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

  void _showAttachmentSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF18181B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(51),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Colors.white70),
              title: const Text('Take Photo', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                _takePhoto();
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Colors.white70),
              title: const Text('Choose from Gallery', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                _pickImage();
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
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
