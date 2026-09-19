import 'dart:async';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';

/// Real-time one-on-one chat between two friends.
/// Uses Supabase Realtime on the `friend_messages` table.
class FriendChatScreen extends StatefulWidget {
  final String friendId;
  final String friendName;

  const FriendChatScreen({
    super.key,
    required this.friendId,
    required this.friendName,
  });

  @override
  State<FriendChatScreen> createState() => _FriendChatScreenState();
}

class _FriendChatScreenState extends State<FriendChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final _supabase = Supabase.instance.client;

  List<Map<String, dynamic>> _messages = [];
  bool _loading = true;
  bool _sending = false;
  RealtimeChannel? _channel;
  String get _myId => _supabase.auth.currentUser?.id ?? '';

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _subscribeToRealtime();
  }

  @override
  void dispose() {
    _channel?.unsubscribe();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // ─── Data ──────────────────────────────────────────────────────────

  Future<void> _loadMessages() async {
    try {
      final data = await _supabase
          .from('friend_messages')
          .select()
          .or('and(sender_id.eq.$_myId,receiver_id.eq.${widget.friendId}),'
              'and(sender_id.eq.${widget.friendId},receiver_id.eq.$_myId)')
          .order('created_at', ascending: true)
          .limit(500);

      if (mounted) {
        setState(() {
          _messages = List<Map<String, dynamic>>.from(data);
          _loading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _subscribeToRealtime() {
    _channel = _supabase
        .channel('friend-chat-$_myId-${widget.friendId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'friend_messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'sender_id',
            value: widget.friendId,
          ),
          callback: (payload) {
            final msg = payload.newRecord;
            // Only show if this message is for me
            if (msg['receiver_id'] == _myId) {
              setState(() => _messages.add(msg));
              _scrollToBottom();
              _markAsRead();
            }
          },
        )
        .subscribe();
  }

  Future<void> _markAsRead() async {
    final now = DateTime.now().toIso8601String();
    await _supabase
        .from('friend_messages')
        .update({'read_at': now})
        .eq('sender_id', widget.friendId)
        .eq('receiver_id', _myId)
        .isFilter('read_at', null);
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;

    setState(() => _sending = true);
    _controller.clear();

    try {
      await _supabase.from('friend_messages').insert({
        'sender_id': _myId,
        'receiver_id': widget.friendId,
        'content': text,
      });
      // Realtime will deliver the message back to us
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // ─── UI ──────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.greenPrimary.withAlpha(30),
              child: Text(
                widget.friendName.isNotEmpty
                    ? widget.friendName[0].toUpperCase()
                    : '?',
                style: TextStyle(
                  color: AppColors.greenPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Text(widget.friendName),
          ],
        ),
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0.5,
      ),
      body: Column(
        children: [
          // ── Messages ──
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? Center(
                        child: Text(
                          'Say hello! 👋',
                          style: TextStyle(
                            color: theme.textTheme.bodyMedium?.color
                                ?.withAlpha(150),
                          ),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isMe = msg['sender_id'] == _myId;
                          return _MessageBubble(
                            text: msg['content'] ?? '',
                            isMe: isMe,
                            time: msg['created_at'],
                            read: msg['read_at'] != null,
                          );
                        },
                      ),
          ),

          // ── Input ──
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            decoration: BoxDecoration(
              color: theme.scaffoldBackgroundColor,
              border: Border(
                top: BorderSide(
                  color: theme.dividerColor.withAlpha(30),
                ),
              ),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: theme.brightness == Brightness.dark
                            ? const Color(0xFF1A1A2E)
                            : Colors.grey.shade100,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: AppColors.greenPrimary,
                    child: IconButton(
                      icon: _sending
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.send, color: Colors.white, size: 18),
                      onPressed: _sending ? null : _sendMessage,
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

// ─── Message Bubble ──────────────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  final String text;
  final bool isMe;
  final String? time;
  final bool read;

  const _MessageBubble({
    required this.text,
    required this.isMe,
    this.time,
    this.read = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    String timeStr = '';
    if (time != null) {
      try {
        final dt = DateTime.parse(time!).toLocal();
        timeStr =
            '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      } catch (_) {}
    }

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 3),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isMe
              ? AppColors.greenPrimary
              : isDark
                  ? const Color(0xFF1A1A2E)
                  : Colors.grey.shade200,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              text,
              style: TextStyle(
                color: isMe
                    ? Colors.white
                    : isDark
                        ? Colors.white
                        : Colors.black87,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  timeStr,
                  style: TextStyle(
                    color: isMe ? Colors.white70 : Colors.grey,
                    fontSize: 10,
                  ),
                ),
                if (isMe && read) ...[
                  const SizedBox(width: 4),
                  const Icon(Icons.done_all, size: 12, color: Colors.white70),
                ] else if (isMe) ...[
                  const SizedBox(width: 4),
                  const Icon(Icons.done, size: 12, color: Colors.white70),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
