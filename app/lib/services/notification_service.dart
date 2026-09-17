import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/class_schedule.dart';

/// Reads admin/system notifications out of the `notifications` table.
///
/// Broadcast rows (`target = 'all'`) are shared by every user, so read state
/// is tracked per-device rather than written back to the shared row.
class NotificationService {
  static const _readIdsKey = 'imu_read_notification_ids';

  static const _columns =
      'id, title, message, type, created_at, action_url, target, target_user_id, user_id';

  Future<Set<String>> _readIds() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_readIdsKey) ?? const []).toSet();
  }

  Future<void> _writeReadIds(Set<String> ids) async {
    final prefs = await SharedPreferences.getInstance();
    // Cap growth; notification ids are uuid-ish and only used for lookups.
    final trimmed = ids.length > 500 ? ids.toList().sublist(ids.length - 500) : ids.toList();
    await prefs.setStringList(_readIdsKey, trimmed);
  }

  /// Notifications visible to the current user, newest first.
  Future<List<AppNotification>> fetchInbox({int limit = 100}) async {
    final client = Supabase.instance.client;
    final uid = client.auth.currentUser?.id;

    final rows = await client
        .from('notifications')
        .select(_columns)
        .order('created_at', ascending: false)
        .limit(limit);

    final readIds = await _readIds();
    final out = <AppNotification>[];

    for (final raw in rows) {
      final m = Map<String, dynamic>.from(raw as Map);

      // RLS permits broadcasts and anything addressed to us; guard anyway
      // because the legacy `notif_select_any` policy is permissive.
      final target = (m['target'] ?? 'all').toString();
      final toMe = m['target_user_id'] != null && m['target_user_id'] == uid;
      final mine = m['user_id'] != null && m['user_id'] == uid;
      if (target != 'all' && !toMe && !mine) continue;

      final id = m['id'].toString();
      out.add(AppNotification.fromMap({
        ...m,
        'is_read': readIds.contains(id),
      }));
    }

    return out;
  }

  Future<void> markRead(String id) async {
    final ids = await _readIds();
    ids.add(id);
    await _writeReadIds(ids);
  }

  Future<void> markAllRead(Iterable<String> ids) async {
    final existing = await _readIds();
    existing.addAll(ids);
    await _writeReadIds(existing);
  }

  Future<int> unreadCount() async {
    final inbox = await fetchInbox();
    return inbox.where((n) => !n.isRead).length;
  }
}
