import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/class_schedule.dart';
import '../services/timetable_service.dart';
import '../services/permission_service.dart';
import '../services/notification_service.dart';

class UserProfile {
  final String id;
  final String name;
  final String university;
  final String programme;
  final int year;
  final int semester;
  final String major;
  final String minor;

  const UserProfile({
    required this.id,
    this.name = '',
    this.university = '',
    this.programme = '',
    this.year = 1,
    this.semester = 1,
    this.major = '',
    this.minor = '',
  });

  factory UserProfile.fromMap(Map<String, dynamic> m) => UserProfile(
        id: m['id'] ?? '',
        name: m['name'] ?? '',
        university: m['university'] ?? '',
        programme: m['programme'] ?? '',
        year: (m['year'] as num?)?.toInt() ?? 1,
        semester: (m['semester'] as num?)?.toInt() ?? 1,
        major: m['major'] ?? '',
        minor: m['minor'] ?? '',
      );
}

final profileProvider = FutureProvider<UserProfile?>((ref) async {
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return null;
  try {
    final res = await Supabase.instance.client
        .from('profiles')
        .select()
        .eq('id', user.id)
        .maybeSingle();
    return res == null ? null : UserProfile.fromMap(res);
  } catch (_) {
    return null;
  }
});

final timetableProvider =
    NotifierProvider<TimetableNotifier, List<ClassSchedule>>(
        TimetableNotifier.new);

class TimetableNotifier extends Notifier<List<ClassSchedule>> {
  final _service = TimetableService();

  @override
  List<ClassSchedule> build() {
    _load();
    return [];
  }

  Future<void> _load() async {
    state = await _service.loadLocal();
    _service.mergeRemote().then((_) {
      // If remote changed, reload
      _service.loadLocal().then((v) => state = v);
    });
  }

  Future<void> add(ClassSchedule c) async {
    state = [...state, c];
    await _service.add(c);
  }

  Future<void> update(ClassSchedule c) async {
    final idx = state.indexWhere((x) => x.id == c.id);
    if (idx >= 0) {
      state = [...state];
      state[idx] = c;
      await _service.update(c);
    }
  }

  Future<void> delete(String id) async {
    final rem = state.where((x) => x.id != id).toList();
    if (rem.length != state.length) {
      state = rem;
      final c = state.firstWhere((x) => x.id == id, orElse: () => throw Exception());
      await _service.remove(c);
    }
  }

  Future<void> refresh() async {
    state = await _service.loadLocal();
  }
}

final nextClassProvider = Provider<ClassSchedule?>((ref) {
  final classes = ref.watch(timetableProvider);
  if (classes.isEmpty) return null;
  final now = DateTime.now();
  final todayIdx = now.weekday - 1;
  final dayNames = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];
  final today = dayNames[todayIdx];
  final currentMinutes = now.hour * 60 + now.minute;

  ClassSchedule? best;
  int bestMins = 99999;
  for (final c in classes) {
    if (!c.notificationEnabled) continue;
    if (c.day != today) continue;
    final parts = c.startTime.split(':');
    if (parts.length != 2) continue;
    final cm = int.parse(parts[0]) * 60 + int.parse(parts[1]);
    if (cm > currentMinutes && cm < bestMins) {
      bestMins = cm;
      best = c;
    }
  }
  return best;
});

final notificationServiceProvider = Provider((ref) => NotificationService());

/// Admin/system notification inbox, backed by the `notifications` table.
final notificationsProvider =
    NotifierProvider<NotificationsNotifier, List<AppNotification>>(
        NotificationsNotifier.new);

class NotificationsNotifier extends Notifier<List<AppNotification>> {
  final _service = NotificationService();

  @override
  List<AppNotification> build() {
    _load();
    return [];
  }

  Future<void> _load() async {
    try {
      state = await _service.fetchInbox();
    } catch (_) {
      state = [];
    }
  }

  Future<void> refresh() => _load();

  Future<void> markRead(String id) async {
    await _service.markRead(id);
    state = [
      for (final n in state)
        if (n.id == id) n.copyWith(isRead: true) else n,
    ];
  }

  Future<void> markAllRead() async {
    await _service.markAllRead(state.map((n) => n.id));
    state = [for (final n in state) n.copyWith(isRead: true)];
  }
}

final unreadNotificationsProvider = Provider<int>((ref) {
  return ref.watch(notificationsProvider).where((n) => !n.isRead).length;
});

final permissionsProvider =
    NotifierProvider<PermissionsNotifier, bool>(PermissionsNotifier.new);

class PermissionsNotifier extends Notifier<bool> {
  @override
  bool build() => false;

  Future<bool> requestAll(BuildContext context) async {
    final result = await PermissionService.requestCorePermissions();
    final granted = result['notifications'] == true;
    state = granted;
    return granted;
  }
}