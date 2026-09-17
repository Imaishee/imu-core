import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/chat_provider.dart';
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../theme/app_theme.dart';
import '../theme/app_widgets.dart';
import 'chat_screen.dart';
import 'settings_screen.dart';
import 'alarms_screen.dart';
import 'timetable_screen.dart';
import 'notifications_screen.dart';
import 'chat_history_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  final VoidCallback? onToggleTheme;
  final int unreadNotifications;
  final VoidCallback? onClearNotifications;
  final String? latestVersion;
  final String? updateUrl;
  final String? updateNotes;
  final bool? forceUpdate;

  const HomeScreen({
    super.key,
    this.onToggleTheme,
    this.unreadNotifications = 0,
    this.onClearNotifications,
    this.latestVersion,
    this.updateUrl,
    this.updateNotes,
    this.forceUpdate,
  });

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _search = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(permissionsProvider.notifier).requestAll(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    final convos = ref.watch(conversationsProvider);
    final filtered = _search.isEmpty
        ? convos
        : convos.where((c) => c.title.toLowerCase().contains(_search.toLowerCase())).toList();
    final profile = ref.watch(profileProvider);
    final userName = profile.when(
      data: (p) => p?.name ?? 'Friend',
      error: (_, __) => 'Friend',
      loading: () => 'Friend',
    );

    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: CutePatternBackground(
        child: CustomScrollView(
          slivers: [
            // App bar
            SliverAppBar(
              floating: true,
              backgroundColor: AppTheme.bg,
              elevation: 0,
              pinned: false,
              titleSpacing: 20,
              title: Row(children: [
                Container(
                  width: 34, height: 34,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [AppColors.greenPrimary, AppColors.greenLight], begin: Alignment.topLeft, end: Alignment.bottomRight),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Center(
                    child: Padding(
                      padding: EdgeInsets.all(6),
                      child: FittedBox(
                        child: Text("I'MU", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text("I'MU", style: TextStyle(fontWeight: FontWeight.w700, fontSize: 20, color: AppTheme.textMain)),
              ]),
              actions: [
                _iconBtn(Icons.notifications_outlined, widget.unreadNotifications > 0 ? Colors.redAccent : AppTheme.textMain, () {
                  Navigator.push(context, SlideUpRoute(page: const NotificationsScreen()));
                }),
                _iconBtn(Icons.schedule_outlined, AppTheme.textMain, () {
                  Navigator.push(context, SlideUpRoute(page: const TimetableScreen()));
                }),
                _iconBtn(Icons.settings_outlined, AppTheme.textMain, () {
                  Navigator.push(context, SlideUpRoute(page: SettingsScreen(onToggleTheme: widget.onToggleTheme)));
                }),
              ],
            ),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  // Update banner
                  if (widget.latestVersion != null && widget.latestVersion != AppConstants.appVersion) ...[
                    _UpdateBanner(
                      latestVersion: widget.latestVersion!,
                      updateUrl: widget.updateUrl,
                      notes: widget.updateNotes,
                      forceUpdate: widget.forceUpdate ?? false,
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Greeting card
                  GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Hey $userName ✨',
                            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.textMain)),
                        const SizedBox(height: 4),
                        Text('What would you like to learn today?',
                            style: TextStyle(fontSize: 14, color: AppTheme.textMuted)),
                        const SizedBox(height: 14),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            _quickAction(Icons.chat_bubble_outline, 'New Chat', AppColors.greenPrimary, () {
                              final convo = ref.read(conversationsProvider.notifier).create();
                              ref.read(activeConversationProvider.notifier).set(convo.remoteId);
                              Navigator.push(context, SlideUpRoute(page: ChatScreen(conversationId: convo.remoteId)));
                            }),
                            _quickAction(Icons.school_outlined, 'Timetable', const Color(0xFF2D6A4F), () {
                              Navigator.push(context, SlideUpRoute(page: const TimetableScreen()));
                            }),
                            _quickAction(Icons.alarm_add_outlined, 'Alarms', const Color(0xFF52B788), () {
                              Navigator.push(context, SlideUpRoute(page: const AlarmsScreen()));
                            }),
                            _quickAction(Icons.camera_alt_outlined, 'Scan Schedule', const Color(0xFF40916C), () {
                              Navigator.push(context, SlideUpRoute(page: const TimetableScreen()));
                            }),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Next class
                  Consumer(builder: (ctx, ref, child) {
                    final next = ref.watch(nextClassProvider);
                    if (next == null) return const SizedBox.shrink();
                    return GlassCard(
                      onTap: () => Navigator.push(context, SlideUpRoute(page: const TimetableScreen())),
                      child: Row(children: [
                        Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(color: AppColors.greenMint.withAlpha(40), borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.schedule, color: AppColors.greenPrimary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(next.courseName, style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textMain, fontSize: 14)),
                            const SizedBox(height: 2),
                            Text('${next.day} ${next.startTime} · ${next.room}', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                          ],
                        )),
                        Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textMuted),
                      ]),
                    );
                  }),

                  const SizedBox(height: 16),

                  // Conversations
                  if (convos.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Recent chats', style: TextStyle(color: AppTheme.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
                        if (convos.isNotEmpty)
                          GestureDetector(
                            onTap: () {
                              Navigator.push(context, SlideUpRoute(page: const ChatHistoryScreen()));
                            },
                            child: Row(children: [
                              Icon(Icons.history, size: 14, color: AppColors.greenLight),
                              const SizedBox(width: 4),
                              Text('View all', style: TextStyle(color: AppColors.greenLight, fontSize: 13, fontWeight: FontWeight.w500)),
                            ]),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ...filtered.take(3).map((c) => _convoTile(c, context)),
                    if (filtered.isEmpty && _search.isNotEmpty) Text('No matches', style: TextStyle(color: AppTheme.textMuted)),
                  ] else ...[
                    const SizedBox(height: 20),
                    Center(
                      child: GlassCard(
                        child: Column(children: [
                          Icon(Icons.auto_awesome, color: AppColors.greenPrimary, size: 32),
                          const SizedBox(height: 12),
                          Text('No chats yet', style: TextStyle(color: AppTheme.textMuted, fontSize: 14)),
                          const SizedBox(height: 6),
                          Text('Start a conversation with I\'MU!', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                        ]),
                      ),
                    ),
                  ],
                ]),
              ),
            ),
          ],
        ),
      ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          final convo = ref.read(conversationsProvider.notifier).create();
          ref.read(activeConversationProvider.notifier).set(convo.remoteId);
          Navigator.push(context, SlideUpRoute(page: ChatScreen(conversationId: convo.remoteId)));
        },
        backgroundColor: AppColors.greenPrimary,
        icon: const Icon(Icons.chat, color: Colors.white),
        label: const Text('New Chat', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _iconBtn(IconData icon, Color color, VoidCallback onTap) {
    return IconButton(onPressed: onTap, icon: Icon(icon, color: color, size: 22));
  }

  Widget _quickAction(IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(color: color.withAlpha(25), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withAlpha(60))),
        child: Row(children: [Icon(icon, size: 16, color: color), const SizedBox(width: 6), Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600))]),
      ),
    );
  }

  Widget _convoTile(dynamic convo, BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        margin: EdgeInsets.zero,
        onTap: () {
          ref.read(activeConversationProvider.notifier).set(convo.remoteId);
          Navigator.push(context, SlideUpRoute(page: ChatScreen(conversationId: convo.remoteId)));
        },
        child: Row(children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: AppColors.greenMint.withAlpha(30), borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.chat_bubble_outline, color: AppColors.greenPrimary, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(convo.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.textMain, fontSize: 13, fontWeight: FontWeight.w500))),
          IconButton(onPressed: () => ref.read(conversationsProvider.notifier).delete(convo.remoteId), icon: Icon(Icons.close, color: AppTheme.textMuted, size: 15)),
        ]),
      ),
    );
  }

}

class _UpdateBanner extends StatelessWidget {
  final String latestVersion;
  final String? updateUrl;
  final String? notes;
  final bool forceUpdate;

  const _UpdateBanner({
    required this.latestVersion,
    this.updateUrl,
    this.notes,
    this.forceUpdate = false,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      tint: AppColors.greenPrimary.withAlpha(35),
      onTap: () {
        final url = updateUrl;
        if (url != null && url.isNotEmpty) {
          launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
        }
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(Icons.system_update_alt, color: AppColors.greenLight, size: 20),
            const SizedBox(width: 8),
            Expanded(child: Text('v$latestVersion available', style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w600))),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(color: AppColors.greenPrimary, borderRadius: BorderRadius.circular(10)),
              child: const Text('Update', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ]),
          if (notes != null && notes!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(notes!, maxLines: 3, overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
          ],
        ],
      ),
    );
  }
}