import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
  bool _isDark = true;

  @override
  void initState() {
    super.initState();
    _loadTheme();
    if (widget.initialPrompt != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _inputController.text = widget.initialPrompt!;
        _sendMessage();
      });
    }
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) setState(() => _isDark = prefs.getBool('dark_mode') ?? true);
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

  Color get _bg => _isDark ? const Color(0xFF09090B) : const Color(0xFFF8F9FA);
  Color get _cardBg => _isDark ? const Color(0xFF18181B) : Colors.white;
  Color get _borderColor => _isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB);
  Color get _textPrimary => _isDark ? Colors.white : const Color(0xFF18181B);
  Color get _textSecondary => _isDark ? Colors.white54 : const Color(0xFF71717A);
  Color get _accent => _isDark ? const Color(0xFFA78BFA) : const Color(0xFF7C3AED);
  Color get _userBubble => _isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB);
  Color get _inputBg => _isDark ? const Color(0xFF18181B) : Colors.white;
  Color get _sendBg => _isDark ? Colors.white : Colors.black;
  Color get _sendIcon => _isDark ? Colors.black : Colors.white;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70, maxWidth: 1024);
    if (picked != null) setState(() => _pendingImage = File(picked.path));
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 70, maxWidth: 1024);
    if (picked != null) setState(() => _pendingImage = File(picked.path));
  }

  Future<void> _pickFile() async {
    final picker = ImagePicker();
    final picked = await picker.pickMedia();
    if (picked != null) {
      final ext = picked.path.split('.').last.toLowerCase();
      String? fileType;
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(ext)) {
        fileType = 'image';
      } else if (['mp4', 'mov', 'avi', 'mkv'].contains(ext)) {
        fileType = 'video';
      } else if (['pdf'].contains(ext)) {
        fileType = 'pdf';
      } else if (['doc', 'docx'].contains(ext)) {
        fileType = 'document';
      } else {
        fileType = 'file';
      }
      setState(() {
        _pendingImage = File(picked.path);
      });
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
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: Icon(Icons.arrow_back_ios, size: 20, color: _textPrimary),
        ),
        title: Row(
          children: [
            Text("IM'U", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: _textPrimary)),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: _accent.withAlpha(30),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(AppConstants.appVersion, style: TextStyle(fontSize: 9, color: _accent)),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {
              ref.read(conversationsProvider.notifier).createChat();
              Navigator.pop(context);
            },
            icon: Icon(Icons.add, size: 22, color: _textPrimary),
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
                          width: 56, height: 56,
                          decoration: BoxDecoration(
                            color: _sendBg,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Center(child: Text('IM', style: TextStyle(color: _sendIcon, fontWeight: FontWeight.bold, fontSize: 18))),
                        ),
                        const SizedBox(height: 16),
                        Text("IM'U AI", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: _textPrimary)),
                        const SizedBox(height: 4),
                        Text('How can I help you today?', style: TextStyle(color: _textSecondary)),
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
                                width: 28, height: 28,
                                decoration: BoxDecoration(color: _accent, borderRadius: BorderRadius.circular(8)),
                                child: Center(child: Text('IM', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 9))),
                              ),
                              const SizedBox(width: 8),
                            ],
                            Flexible(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isUser ? _userBubble : Colors.transparent,
                                  borderRadius: BorderRadius.only(
                                    topLeft: const Radius.circular(16),
                                    topRight: const Radius.circular(16),
                                    bottomLeft: Radius.circular(isUser ? 16 : 4),
                                    bottomRight: Radius.circular(isUser ? 4 : 16),
                                  ),
                                ),
                                child: isLast && msg.content.isEmpty
                                    ? _buildTypingIndicator()
                                    : Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          if (msg.fileUrl != null && msg.fileUrl!.isNotEmpty)
                                            _buildAttachment(msg.fileType, msg.fileUrl!),
                                          if (msg.fileUrl != null && msg.fileUrl!.isNotEmpty && msg.content.isNotEmpty)
                                            const SizedBox(height: 8),
                                          isUser
                                              ? Text(msg.content, style: TextStyle(color: _textPrimary, fontSize: 14))
                                              : MarkdownBody(
                                                  data: msg.content,
                                                  styleSheet: MarkdownStyleSheet(
                                                    p: TextStyle(color: _textPrimary, fontSize: 14),
                                                    code: TextStyle(
                                                      backgroundColor: _borderColor,
                                                      color: _accent,
                                                      fontSize: 13,
                                                    ),
                                                    codeblockDecoration: BoxDecoration(
                                                      color: _cardBg,
                                                      borderRadius: BorderRadius.circular(8),
                                                    ),
                                                    h1: TextStyle(color: _textPrimary, fontSize: 20, fontWeight: FontWeight.bold),
                                                    h2: TextStyle(color: _textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
                                                    h3: TextStyle(color: _textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
                                                    listBullet: TextStyle(color: _textSecondary),
                                                  ),
                                                ),
                                        ],
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
                        top: -4, right: -4,
                        child: GestureDetector(
                          onTap: () => setState(() => _pendingImage = null),
                          child: Container(
                            width: 20, height: 20,
                            decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                            child: const Icon(Icons.close, size: 12, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 8),
                  Text('Image attached', style: TextStyle(color: _textSecondary, fontSize: 12)),
                ],
              ),
            ),

          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(border: Border(top: BorderSide(color: _borderColor))),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _inputBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _borderColor),
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: _showAttachmentSheet,
                    icon: Icon(Icons.add, color: _textSecondary, size: 22),
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
                        hintStyle: TextStyle(color: _textSecondary),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                      ),
                      style: TextStyle(color: _textPrimary, fontSize: 14),
                    ),
                  ),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: _sendMessage,
                    child: Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(color: _sendBg, shape: BoxShape.circle),
                      child: _isStreaming
                          ? Padding(
                              padding: const EdgeInsets.all(8),
                              child: CircularProgressIndicator(strokeWidth: 2, color: _sendIcon),
                            )
                          : Icon(Icons.arrow_upward, color: _sendIcon, size: 20),
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

  Widget _buildAttachment(String? fileType, String fileUrl) {
    final isImageType = fileType == 'image' || fileUrl.endsWith('.jpg') || fileUrl.endsWith('.jpeg') || fileUrl.endsWith('.png');

    if (isImageType) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(fileUrl, width: 200, fit: BoxFit.cover, errorBuilder: (_, __, ___) =>
          Container(
            width: 200, height: 120,
            decoration: BoxDecoration(color: _borderColor, borderRadius: BorderRadius.circular(8)),
            child: Icon(Icons.broken_image, color: _textSecondary),
          ),
        ),
      );
    }

    IconData icon;
    Color iconColor;
    String label;

    switch (fileType) {
      case 'video':
        icon = Icons.videocam;
        iconColor = Colors.red;
        label = 'Video attachment';
        break;
      case 'pdf':
        icon = Icons.picture_as_pdf;
        iconColor = Colors.red;
        label = 'PDF document';
        break;
      case 'document':
        icon = Icons.description;
        iconColor = Colors.blue;
        label = 'Document';
        break;
      default:
        icon = Icons.attach_file;
        iconColor = _accent;
        label = 'File attachment';
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _borderColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(width: 8),
          Flexible(
            child: Text(label, style: TextStyle(color: _textPrimary, fontSize: 13)),
          ),
        ],
      ),
    );
  }

  void _showAttachmentSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: _cardBg,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36, height: 4,
              decoration: BoxDecoration(color: _textSecondary.withAlpha(51), borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: Icon(Icons.camera_alt, color: _textSecondary),
              title: Text('Take Photo', style: TextStyle(color: _textPrimary)),
              onTap: () { Navigator.pop(context); _takePhoto(); },
            ),
            ListTile(
              leading: Icon(Icons.photo_library, color: _textSecondary),
              title: Text('Choose from Gallery', style: TextStyle(color: _textPrimary)),
              onTap: () { Navigator.pop(context); _pickImage(); },
            ),
            ListTile(
              leading: Icon(Icons.attach_file, color: _textSecondary),
              title: Text('Attach File (PDF/Video/Doc)', style: TextStyle(color: _textPrimary)),
              onTap: () { Navigator.pop(context); _pickFile(); },
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
      children: [_dot(0), const SizedBox(width: 4), _dot(150), const SizedBox(width: 4), _dot(300)],
    );
  }

  Widget _dot(int delay) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 600),
      width: 8, height: 8,
      decoration: BoxDecoration(color: _textSecondary, shape: BoxShape.circle),
    );
  }
}
