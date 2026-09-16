import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../providers/chat_provider.dart';
import '../constants/app_constants.dart';
import 'chat_screen.dart';
import 'settings_screen.dart';
import 'alarms_screen.dart';
import 'pomodoro_screen.dart';

class HomeScreen extends ConsumerWidget {
  final VoidCallback? onToggleTheme;
  final int unreadNotifications;
  final VoidCallback? onClearNotifications;
  final String? latestVersion;
  final String? updateUrl;
  final String? updateNotes;
  final bool forceUpdate;

  const HomeScreen({
    super.key,
    this.onToggleTheme,
    this.unreadNotifications = 0,
    this.onClearNotifications,
    this.latestVersion,
    this.updateUrl,
    this.updateNotes,
    this.forceUpdate = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversations = ref.watch(conversationsProvider);
    return _HomeBody(
      conversations: conversations,
      ref: ref,
      onToggleTheme: onToggleTheme,
      unreadNotifications: unreadNotifications,
      onClearNotifications: onClearNotifications,
      latestVersion: latestVersion,
      updateUrl: updateUrl,
      updateNotes: updateNotes,
      forceUpdate: forceUpdate,
    );
  }
}

class _HomeBody extends StatefulWidget {
  final List conversations;
  final WidgetRef ref;
  final VoidCallback? onToggleTheme;
  final int unreadNotifications;
  final VoidCallback? onClearNotifications;
  final String? latestVersion;
  final String? updateUrl;
  final String? updateNotes;
  final bool forceUpdate;

  const _HomeBody({
    required this.conversations,
    required this.ref,
    this.onToggleTheme,
    this.unreadNotifications = 0,
    this.onClearNotifications,
    this.latestVersion,
    this.updateUrl,
    this.updateNotes,
    this.forceUpdate = false,
  });

  @override
  State<_HomeBody> createState() => _HomeBodyState();
}

class _HomeBodyState extends State<_HomeBody> {
  bool _isDark = true;
  String _searchQuery = '';
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadTheme();
    WidgetsBinding.instance.addPostFrameCallback((_) => _showUpdateBanner());
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) setState(() => _isDark = prefs.getBool('dark_mode') ?? true);
  }

  void _showUpdateBanner() {
    if (widget.latestVersion != null && widget.latestVersion != AppConstants.appVersion && mounted) {
      showDialog(
        context: context,
        barrierDismissible: !widget.forceUpdate,
        builder: (ctx) => AlertDialog(
          backgroundColor: _cardBg,
          title: Text('Update Available', style: TextStyle(color: _textPrimary)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Version ${widget.latestVersion} is available', style: TextStyle(color: _textSecondary)),
              if (widget.updateNotes != null && widget.updateNotes!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(widget.updateNotes!, style: TextStyle(color: _textSecondary, fontSize: 13)),
              ],
            ],
          ),
          actions: [
            if (!widget.forceUpdate)
              TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Later', style: TextStyle(color: _textSecondary))),
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                // Would open update URL
              },
              child: Text('Update', style: TextStyle(color: _accent)),
            ),
          ],
        ),
      );
    }
  }

  Color get _bg => _isDark ? const Color(0xFF09090B) : const Color(0xFFF8F9FA);
  Color get _cardBg => _isDark ? const Color(0xFF18181B) : Colors.white;
  Color get _borderColor => _isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB);
  Color get _textPrimary => _isDark ? Colors.white : const Color(0xFF18181B);
  Color get _textSecondary => _isDark ? Colors.white54 : const Color(0xFF71717A);
  Color get _accent => _isDark ? const Color(0xFFA78BFA) : const Color(0xFF7C3AED);
  Color get _logoBg => _isDark ? Colors.white : Colors.black;
  Color get _logoText => _isDark ? Colors.black : Colors.white;

  List get _filteredConversations {
    if (_searchQuery.isEmpty) return widget.conversations;
    return widget.conversations.where((c) => c.title.toLowerCase().contains(_searchQuery.toLowerCase())).toList();
  }

  @override
  Widget build(BuildContext context) {
    final ref = widget.ref;

    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 32, height: 32,
                        decoration: BoxDecoration(color: _logoBg, borderRadius: BorderRadius.circular(8)),
                        child: Center(child: Text('IM', style: TextStyle(color: _logoText, fontWeight: FontWeight.bold, fontSize: 12))),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("IM'U", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: _textPrimary)),
                          Text(AppConstants.appVersion, style: TextStyle(color: _textSecondary, fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      if (widget.unreadNotifications > 0)
                        GestureDetector(
                          onTap: () => widget.onClearNotifications?.call(),
                          child: Stack(
                            children: [
                              IconButton(
                                onPressed: () => widget.onClearNotifications?.call(),
                                icon: Icon(Icons.notifications_outlined, color: _accent, size: 22),
                              ),
                              Positioned(
                                right: 4, top: 4,
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                                  child: Text('${widget.unreadNotifications}', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        IconButton(
                          onPressed: () => widget.onClearNotifications?.call(),
                          icon: Icon(Icons.notifications_outlined, color: _textSecondary, size: 22),
                        ),
                      IconButton(
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PomodoroScreen())).then((_) => _loadTheme()),
                        icon: Icon(Icons.timer_outlined, color: _textSecondary, size: 22),
                      ),
                      IconButton(
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AlarmsScreen())).then((_) => _loadTheme()),
                        icon: Icon(Icons.alarm_outlined, color: _textSecondary, size: 22),
                      ),
                      IconButton(
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => SettingsScreen(onToggleTheme: widget.onToggleTheme))).then((_) => _loadTheme()),
                        icon: Icon(Icons.settings_outlined, color: _textSecondary, size: 22),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Search bar
            if (widget.conversations.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: _cardBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _borderColor),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.search, color: _textSecondary, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          onChanged: (v) => setState(() => _searchQuery = v),
                          decoration: InputDecoration(
                            hintText: 'Search conversations...',
                            hintStyle: TextStyle(color: _textSecondary, fontSize: 13),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                          style: TextStyle(color: _textPrimary, fontSize: 13),
                        ),
                      ),
                      if (_searchQuery.isNotEmpty)
                        GestureDetector(
                          onTap: () { _searchController.clear(); setState(() => _searchQuery = ''); },
                          child: Icon(Icons.close, color: _textSecondary, size: 16),
                        ),
                    ],
                  ),
                ),
              ),

            if (widget.conversations.isNotEmpty) const SizedBox(height: 12),

            // Recent conversations
            if (_filteredConversations.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Recent', style: TextStyle(color: _textSecondary, fontSize: 13, fontWeight: FontWeight.w500)),
                    Text('${_filteredConversations.length} chats', style: TextStyle(color: _textSecondary, fontSize: 11)),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 100,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _filteredConversations.length.clamp(0, 10),
                  itemBuilder: (context, index) {
                    final convo = _filteredConversations[index];
                    return GestureDetector(
                      onTap: () {
                        ref.read(activeConversationProvider.notifier).set(convo.remoteId);
                        Navigator.push(context, MaterialPageRoute(
                          builder: (_) => ChatScreen(conversationId: convo.remoteId),
                        ));
                      },
                      onLongPress: () => _showDeleteDialog(ref, convo),
                      child: Container(
                        width: 140,
                        margin: const EdgeInsets.only(right: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _cardBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: _borderColor),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Icon(Icons.chat_bubble_outline, color: _textSecondary, size: 18),
                                GestureDetector(
                                  onTap: () => _showDeleteDialog(ref, convo),
                                  child: Icon(Icons.more_vert, color: _textSecondary, size: 14),
                                ),
                              ],
                            ),
                            const Spacer(),
                            Text(
                              convo.title,
                              style: TextStyle(color: _textPrimary, fontSize: 12, fontWeight: FontWeight.w500),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Empty state / center content
            Expanded(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 80, height: 80,
                        decoration: BoxDecoration(
                          color: _logoBg,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [BoxShadow(color: (_isDark ? Colors.white : Colors.black).withAlpha(25), blurRadius: 40)],
                        ),
                        child: Center(child: Text('IM', style: TextStyle(color: _logoText, fontWeight: FontWeight.bold, fontSize: 24))),
                      ),
                      const SizedBox(height: 32),
                      Text(
                        'What can I help with?',
                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: _textPrimary),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Ask me anything — studies, research, writing, code.',
                        style: TextStyle(fontSize: 16, color: _textSecondary),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        alignment: WrapAlignment.center,
                        children: [
                          _quickPrompt(context, ref, 'Write an essay', 'Help me write an essay about climate change'),
                          _quickPrompt(context, ref, 'Solve a problem', 'Explain the water cycle in simple terms'),
                          _quickPrompt(context, ref, 'Brainstorm ideas', 'Give me project ideas for my class'),
                          _quickPrompt(context, ref, 'Study a topic', 'Teach me about plate tectonics'),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Start chat button
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    final convo = ref.read(conversationsProvider.notifier).createChat();
                    ref.read(activeConversationProvider.notifier).set(convo.remoteId);
                    Navigator.push(context, MaterialPageRoute(
                      builder: (_) => ChatScreen(conversationId: convo.remoteId),
                    ));
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _logoBg,
                    foregroundColor: _logoText,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.chat_bubble_outline, size: 20),
                      SizedBox(width: 8),
                      Text('Start Chatting', style: TextStyle(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog(WidgetRef ref, dynamic convo) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: _cardBg,
        title: Text('Delete Chat', style: TextStyle(color: _textPrimary)),
        content: Text('Delete "${convo.title}"?', style: TextStyle(color: _textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: TextStyle(color: _textSecondary))),
          TextButton(
            onPressed: () {
              ref.read(conversationsProvider.notifier).deleteChat(convo.remoteId);
              Navigator.pop(ctx);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Widget _quickPrompt(BuildContext context, WidgetRef ref, String label, String prompt) {
    return GestureDetector(
      onTap: () {
        final convo = ref.read(conversationsProvider.notifier).createChat();
        ref.read(activeConversationProvider.notifier).set(convo.remoteId);
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => ChatScreen(conversationId: convo.remoteId, initialPrompt: prompt),
        ));
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: _cardBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: _borderColor),
        ),
        child: Text(label, style: TextStyle(color: _textPrimary, fontSize: 13)),
      ),
    );
  }
}
