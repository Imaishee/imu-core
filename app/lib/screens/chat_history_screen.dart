import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/conversation.dart';
import '../providers/chat_provider.dart';
import '../theme/app_theme.dart';
import 'chat_screen.dart';

class ChatHistoryScreen extends ConsumerStatefulWidget {
  const ChatHistoryScreen({super.key});

  @override
  ConsumerState<ChatHistoryScreen> createState() => _ChatHistoryScreenState();
}

class _ChatHistoryScreenState extends ConsumerState<ChatHistoryScreen> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final convos = ref.watch(conversationsProvider);
    final filtered = _search.isEmpty
        ? convos
        : convos.where((c) => c.title.toLowerCase().contains(_search.toLowerCase())).toList();

    final now = DateTime.now();
    final today = filtered.where((c) => _isSameDay(c.updatedAt, now)).toList();
    final yesterday = filtered.where((c) =>
        !_isSameDay(c.updatedAt, now) && _isYesterday(c.updatedAt, now)).toList();
    final thisWeek = filtered.where((c) =>
        !_isSameDay(c.updatedAt, now) && !_isYesterday(c.updatedAt, now) &&
        c.updatedAt.isAfter(now.subtract(const Duration(days: 7)))).toList();
    final older = filtered.where((c) =>
        c.updatedAt.isBefore(now.subtract(const Duration(days: 7)))).toList();

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.bg,
        title: Text('Chat History', style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w700)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(58),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: InputDecoration(
                hintText: 'Search conversations…',
                prefixIcon: Icon(Icons.search, color: AppTheme.textMuted, size: 18),
                hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                filled: true,
                fillColor: AppTheme.surface,
                contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.greenLight, width: 1.4)),
              ),
              style: TextStyle(color: AppTheme.textMain, fontSize: 14),
            ),
          ),
        ),
      ),
      body: filtered.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.chat_bubble_outline, size: 52, color: AppTheme.textMuted.withAlpha(80)),
                  const SizedBox(height: 14),
                  Text('No conversations', style: TextStyle(color: AppTheme.textMuted, fontSize: 16, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 6),
                  Text('Start a chat to see it here', style: TextStyle(color: AppTheme.textMuted.withAlpha(120), fontSize: 13)),
                ],
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (today.isNotEmpty) ..._group('Today', today),
                if (yesterday.isNotEmpty) ..._group('Yesterday', yesterday),
                if (thisWeek.isNotEmpty) ..._group('This week', thisWeek),
                if (older.isNotEmpty) ..._group('Older', older),
              ],
            ),
    );
  }

  List<Widget> _group(String label, List<Conversation> list) {
    return [
      Padding(
        padding: const EdgeInsets.only(bottom: 8, left: 4),
        child: Text(
          label.toUpperCase(),
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.greenMedium, letterSpacing: 0.8),
        ),
      ),
      ...list.map((c) => _buildTile(c)),
    ];
  }

  Widget _buildTile(Conversation convo) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        margin: EdgeInsets.zero,
        onTap: () {
          ref.read(activeConversationProvider.notifier).set(convo.remoteId);
          Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(conversationId: convo.remoteId)));
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.greenMint.withAlpha(40),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.chat_bubble_outline, color: AppColors.greenPrimary, size: 16),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      convo.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: AppTheme.textMain, fontSize: 14, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _formatTime(convo.updatedAt),
                      style: TextStyle(color: AppTheme.textMuted.withAlpha(110), fontSize: 11),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                onSelected: (value) {
                  if (value == 'rename') _showRenameDialog(convo);
                  if (value == 'delete') ref.read(conversationsProvider.notifier).delete(convo.remoteId);
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(value: 'rename', child: Text('Rename')),
                  const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: Colors.red))),
                ],
                icon: Icon(Icons.more_vert, size: 18, color: AppTheme.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showRenameDialog(Conversation convo) {
    final ctrl = TextEditingController(text: convo.title);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: Text('Rename', style: TextStyle(color: AppTheme.textMain)),
        content: TextField(
          controller: ctrl,
          style: TextStyle(color: AppTheme.textMain),
          decoration: InputDecoration(
            filled: true,
            fillColor: AppTheme.bg,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
          ElevatedButton(
            onPressed: () {
              ref.read(conversationsProvider.notifier).updateTitle(convo.remoteId, ctrl.text.trim());
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.greenPrimary, foregroundColor: Colors.white),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime d) {
    final now = DateTime.now();
    if (_isSameDay(d, now)) return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    if (_isYesterday(d, now)) return 'Yesterday';
    return '${d.day}/${d.month}/${d.year}';
  }

  bool _isSameDay(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;
  bool _isYesterday(DateTime d, DateTime now) =>
      _isSameDay(d, now.subtract(const Duration(days: 1)));
}