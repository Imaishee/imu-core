import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/class_schedule.dart';
import 'ai_actions_service.dart';
import 'alarm_service.dart';

class TimetableService {
  static const _key = 'class_schedules_v1';

  Future<List<ClassSchedule>> loadLocal() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return [];
    final list = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
    return list.map(ClassSchedule.fromMap).toList();
  }

  Future<void> saveLocal(List<ClassSchedule> classes) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(classes.map((c) => c.toMap()).toList()));
  }

  Future<void> saveAll(List<ClassSchedule> classes) async {
    await saveLocal(classes);
    await AlarmService.rescheduleAll(classes);
    await syncToSupabase(classes);
  }

  Future<void> add(ClassSchedule cls) async {
    final all = await loadLocal();
    all.add(cls);
    await saveAll(all);
  }

  Future<void> update(ClassSchedule cls) async {
    final all = await loadLocal();
    final idx = all.indexWhere((c) => c.id == cls.id);
    if (idx >= 0) all[idx] = cls;
    await saveAll(all);
  }

  Future<void> remove(ClassSchedule cls) async {
    final all = await loadLocal();
    all.removeWhere((c) => c.id == cls.id);
    await AlarmService.cancelClass(cls);
    await saveAll(all);
    await _removeFromSupabase(cls.id);
  }

  Future<List<ClassSchedule>> getClassesForDay(String day) async {
    final all = await loadLocal();
    return all.where((c) => c.day == day).toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));
  }

  Future<ClassSchedule?> nextClass() async {
    final all = await loadLocal();
    if (all.isEmpty) return null;
    final now = DateTime.now();
    ClassSchedule? best;
    for (final c in all) {
      if (!c.notificationEnabled) continue;
      if (best == null) { best = c; continue; }
    }
    return best;
  }

  // ---------- Supabase sync ----------

  Future<void> syncToSupabase(List<ClassSchedule> classes) async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      final client = Supabase.instance.client;
      for (final c in classes) {
        final map = c.toMap();
        map.remove('id');
        map['user_id'] = user.id;
        await client.from('class_schedules').upsert({
          ...map,
          'id': c.id,
          'updated_at': DateTime.now().toIso8601String(),
        });
      }
    } catch (e) {
      // offline — local is source of truth
    }
  }

  Future<void> _removeFromSupabase(String id) async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      await Supabase.instance.client
          .from('class_schedules')
          .delete()
          .eq('id', id);
    } catch (_) {}
  }

  Future<List<ClassSchedule>> loadFromSupabase() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return [];
      final res = await Supabase.instance.client
          .from('class_schedules')
          .select()
          .eq('user_id', user.id);
      return (res as List).map((e) => ClassSchedule.fromMap(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  /// Merge remote schedules into local (called after login / on launch).
  Future<void> mergeRemote() async {
    final remote = await loadFromSupabase();
    if (remote.isEmpty) return;
    final local = await loadLocal();
    final localIds = local.map((c) => c.id).toSet();
    final merged = [...local];
    for (final r in remote) {
      if (!localIds.contains(r.id)) merged.add(r);
    }
    await saveAll(merged);
  }

  /// Parse a pasted timetable text into ClassSchedule list using the
  /// tool-calling `ai-actions` endpoint. Does NOT persist — the caller
  /// previews the result and saves what the user confirms.
  static Future<List<ClassSchedule>> parseWithAI(String text) async {
    return AiActionsService().parseTimetable(text);
  }
}