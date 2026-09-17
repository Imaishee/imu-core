import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_theme.dart';
import '../providers/app_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  IconData _iconFor(String type) {
    switch (type) {
      case 'exam':
        return Icons.assignment_outlined;
      case 'assignment':
        return Icons.menu_book_outlined;
      case 'achievement':
        return Icons.emoji_events_outlined;
      case 'streak':
        return Icons.local_fire_department_outlined;
      case 'admin':
        return Icons.campaign_outlined;
      case 'alarm':
        return Icons.alarm;
      default:
        return Icons.notifications_outlined;
    }
  }

  String _relative(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    final d = dt.toLocal();
    return '${d.day}/${d.month}/${d.year}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timetable = ref.watch(timetableProvider);
    final messages = ref.watch(notificationsProvider);
    final unread = messages.where((m) => !m.isRead).toList();

    final reminders = timetable.where((c) => c.notificationEnabled).toList();
    final isEmpty = messages.isEmpty && reminders.isEmpty;

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.bg,
        title: Text(
          'Notifications',
          style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w700),
        ),
        actions: [
          if (unread.isNotEmpty)
            TextButton(
              onPressed: () =>
                  ref.read(notificationsProvider.notifier).markAllRead(),
              child: Text(
                'Mark all read',
                style: TextStyle(color: AppTheme.primaryBright, fontSize: 12),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.primaryBright,
        onRefresh: () async {
          await ref.read(notificationsProvider.notifier).refresh();
          await ref.read(timetableProvider.notifier).refresh();
        },
        child: isEmpty
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                  Icon(Icons.notifications_none_outlined,
                      size: 64, color: AppTheme.textMuted.withAlpha(60)),
                  const SizedBox(height: 16),
                  Center(
                    child: Text('No notifications',
                        style: TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 16,
                            fontWeight: FontWeight.w500)),
                  ),
                  const SizedBox(height: 6),
                  Center(
                    child: Text('Set up your timetable to get class reminders',
                        style: TextStyle(
                            color: AppTheme.textMuted.withAlpha(120),
                            fontSize: 13)),
                  ),
                ],
              )
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (messages.isNotEmpty) ...[
                    Text(
                      'Messages',
                      style: TextStyle(
                          color: AppTheme.primaryBright,
                          fontSize: 13,
                          fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    ...messages.map((n) {
                      final isUnread = !n.isRead;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: GlassCard(
                          margin: EdgeInsets.zero,
                          onTap: () => ref
                              .read(notificationsProvider.notifier)
                              .markRead(n.id),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 38,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    color: AppColors.greenMint.withAlpha(40),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(_iconFor(n.type),
                                      color: AppColors.greenPrimary, size: 18),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              n.title,
                                              style: TextStyle(
                                                color: AppTheme.textMain,
                                                fontSize: 14,
                                                fontWeight: isUnread
                                                    ? FontWeight.w700
                                                    : FontWeight.w500,
                                              ),
                                            ),
                                          ),
                                          if (isUnread)
                                            Container(
                                              width: 8,
                                              height: 8,
                                              decoration: const BoxDecoration(
                                                color: AppColors.greenLight,
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 3),
                                      Text(n.body,
                                          style: TextStyle(
                                              color: AppTheme.textMuted,
                                              fontSize: 12.5,
                                              height: 1.35)),
                                      const SizedBox(height: 6),
                                      Text(_relative(n.createdAt),
                                          style: TextStyle(
                                              color:
                                                  AppTheme.textMuted.withAlpha(140),
                                              fontSize: 11)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 8),
                  ],
                  if (reminders.isNotEmpty) ...[
                    Text(
                      'Scheduled Class Reminders',
                      style: TextStyle(
                          color: AppTheme.primaryBright,
                          fontSize: 13,
                          fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    ...reminders.map((cls) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: GlassCard(
                            margin: EdgeInsets.zero,
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                children: [
                                  Container(
                                    width: 38,
                                    height: 38,
                                    decoration: BoxDecoration(
                                      color: AppColors.greenMint.withAlpha(40),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(
                                        Icons.notifications_active_outlined,
                                        color: AppColors.greenPrimary,
                                        size: 18),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                            '${cls.title} · ${cls.day} ${cls.startTime}',
                                            style: TextStyle(
                                                color: AppTheme.textMain,
                                                fontSize: 14,
                                                fontWeight: FontWeight.w500)),
                                        const SizedBox(height: 3),
                                        Text(
                                            'Reminder: ${cls.reminderMinutes} min before',
                                            style: TextStyle(
                                                color: AppTheme.textMuted,
                                                fontSize: 12)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )),
                  ],
                ],
              ),
      ),
    );
  }
}
