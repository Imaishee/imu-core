import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_theme.dart';
import '../providers/app_provider.dart';
import '../models/class_schedule.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timetable = ref.watch(timetableProvider);

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.bg,
        title: Text('Notifications', style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w700)),
      ),
      body: timetable.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.notifications_none_outlined, size: 64, color: AppTheme.textMuted.withAlpha(60)),
                  const SizedBox(height: 16),
                  Text('No notifications', style: TextStyle(color: AppTheme.textMuted, fontSize: 16, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 6),
                  Text('Set up your timetable to get class reminders', style: TextStyle(color: AppTheme.textMuted.withAlpha(120), fontSize: 13)),
                ],
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Scheduled Class Reminders', style: TextStyle(color: AppColors.greenMedium, fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                ...timetable.where((c) => c.notificationEnabled).map((cls) => Padding(
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
                                child: Icon(Icons.notifications_active_outlined, color: AppColors.greenPrimary, size: 18),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('${cls.title} · ${cls.day} ${cls.startTime}', style: TextStyle(color: AppTheme.textMain, fontSize: 14, fontWeight: FontWeight.w500)),
                                    const SizedBox(height: 3),
                                    Text('Reminder: ${cls.reminderMinutes} min before', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )),
              ],
            ),
    );
  }
}