import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../constants/app_constants.dart';
import '../models/alarm_item.dart';
import '../models/class_schedule.dart';
import 'alarm_service.dart';
import 'timetable_service.dart';

class AiActionOutcome {
  final String reply;
  final List<String> applied;

  const AiActionOutcome({this.reply = '', this.applied = const []});

  bool get hasChanges => applied.isNotEmpty;

  String get message =>
      applied.isEmpty ? reply : (applied.join('\n'));
}

/// Turns natural-language scheduling requests into real timetable entries and
/// alarms. Backed by the tool-calling `ai-actions` edge function; the streaming
/// chat endpoint cannot create anything, only talk about it.
class AiActionsService {
  static const _alarmsKey = 'alarms';
  static const _endpoint = '${AppConstants.supabaseUrl}/functions/v1/ai-actions';

  String _lastReply = '';

  // ---------------------------------------------------------------- alarms

  static Future<List<AlarmItem>> loadAlarms() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_alarmsKey) ?? const [])
        .map((e) =>
            AlarmItem.fromMap(Map<String, dynamic>.from(jsonDecode(e) as Map)))
        .toList();
  }

  static Future<void> saveAlarms(List<AlarmItem> alarms) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
        _alarmsKey, alarms.map((a) => jsonEncode(a.toMap())).toList());
  }

  // ------------------------------------------------------------- request

  Future<List<Map<String, dynamic>>> _request(
    String prompt, {
    List<String>? categories,
  }) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'apikey': AppConstants.supabaseAnonKey,
    };
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      headers['Authorization'] = 'Bearer ${session.accessToken}';
    }

    final timetable = await TimetableService().loadLocal();
    final alarms = await loadAlarms();

    final resp = await http
        .post(
          Uri.parse(_endpoint),
          headers: headers,
          body: jsonEncode({
            'prompt': prompt,
            if (categories != null) 'categories': categories,
            'context': {
              'classes': timetable.map((c) => c.toMap()).toList(),
              'alarms': alarms.map((a) => a.toMap()).toList(),
            },
          }),
        )
        .timeout(const Duration(seconds: 60));

    if (resp.statusCode != 200) return const [];

    final data = jsonDecode(resp.body);
    if (data is! Map<String, dynamic>) return const [];
    _lastReply = data['reply']?.toString() ?? '';
    final actions = data['actions'];
    if (actions is! List) return const [];
    return actions
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }

  /// Parse a pasted timetable without persisting. Caller confirms + saves.
  Future<List<ClassSchedule>> parseTimetable(String text) async {
    final actions = await _request(text, categories: ['classes']);
    final out = <ClassSchedule>[];
    var i = 0;
    for (final a in actions) {
      final name = a['name']?.toString() ?? '';
      final args = Map<String, dynamic>.from((a['args'] as Map?) ?? const {});
      if (name == 'create_class') {
        out.add(_classFromArgs(args, i++));
      } else if (name == 'parse_timetable') {
        final list = args['classes'];
        if (list is List) {
          for (final raw in list) {
            out.add(_classFromArgs(
                Map<String, dynamic>.from(raw as Map), i++));
          }
        }
      }
    }
    return out;
  }

  /// Request actions and apply them to local state. Returns what changed.
  Future<AiActionOutcome> applyPrompt(
    String prompt, {
    List<String>? categories,
  }) async {
    _lastReply = '';
    final actions = await _request(prompt, categories: categories);
    if (actions.isEmpty) return AiActionOutcome(reply: _lastReply);
    return _apply(actions);
  }

  // ---------------------------------------------------------------- apply

  Future<AiActionOutcome> _apply(List<Map<String, dynamic>> actions) async {
    final applied = <String>[];
    final svc = TimetableService();

    var classes = await svc.loadLocal();
    var alarms = await loadAlarms();
    var classesChanged = false;
    var alarmsChanged = false;
    var seq = 0;

    for (final a in actions) {
      final name = a['name']?.toString() ?? '';
      final args = Map<String, dynamic>.from((a['args'] as Map?) ?? const {});

      switch (name) {
        case 'create_class':
          final cls = _classFromArgs(args, seq++);
          if (!isDuplicate(classes, cls)) {
            classes.add(cls);
            classesChanged = true;
            applied.add('Added ${_label(cls)} to ${cls.day} ${cls.startTime}');
          } else {
            applied.add('${_label(cls)} is already in your timetable');
          }
          break;

        case 'parse_timetable':
          final list = args['classes'];
          if (list is List) {
            var added = 0;
            for (final raw in list) {
              final cls = _classFromArgs(
                  Map<String, dynamic>.from(raw as Map), seq++);
              if (!isDuplicate(classes, cls)) {
                classes.add(cls);
                added++;
              }
            }
            if (added > 0) {
              classesChanged = true;
              applied.add('Imported $added ${added == 1 ? 'class' : 'classes'}');
            }
          }
          break;

        case 'delete_class':
          final before = classes.length;
          classes = classes.where((c) => !_matchesClass(c, args)).toList();
          final removed = before - classes.length;
          if (removed > 0) {
            classesChanged = true;
            applied.add('Removed $removed ${removed == 1 ? 'class' : 'classes'}');
          } else {
            applied.add('No matching class found');
          }
          break;

        case 'clear_timetable':
          if (classes.isNotEmpty) {
            applied.add('Cleared ${classes.length} classes');
            classes = [];
            classesChanged = true;
          }
          break;

        case 'create_alarm':
          final item = AlarmItem(
            id: DateTime.now().millisecondsSinceEpoch + alarms.length,
            label: args['label']?.toString() ?? 'Alarm',
            time: normalizeTime(args['time']?.toString()),
            days: normalizeDays(args['days']),
          );
          alarms.add(item);
          alarmsChanged = true;
          applied.add('Set alarm "${item.label}" at ${prettyTime(item.time)}'
              '${item.days.isEmpty ? '' : ' on ${item.dayString.split('· ').last}'}');
          break;

        case 'delete_alarm':
          final label = args['label']?.toString().toLowerCase().trim() ?? '';
          if (label.isEmpty) break;
          final removed = alarms
              .where((x) => x.label.toLowerCase().contains(label))
              .toList();
          if (removed.isNotEmpty) {
            alarms = alarms.where((x) => !removed.contains(x)).toList();
            for (final r in removed) {
              await AlarmService.cancelAlarm(r);
            }
            alarmsChanged = true;
            applied.add('Deleted ${removed.length} alarm(s)');
          } else {
            applied.add('No matching alarm found');
          }
          break;
      }
    }

    if (classesChanged) await svc.saveAll(classes);
    if (alarmsChanged) {
      await saveAlarms(alarms);
      await AlarmService.rearmSavedAlarms();
    }

    final reply = applied.join('\n');
    return AiActionOutcome(
      reply: _lastReply.isEmpty ? reply : _lastReply,
      applied: applied,
    );
  }

  // -------------------------------------------------------------- helpers

  ClassSchedule _classFromArgs(Map<String, dynamic> args, int index) =>
      ClassSchedule(
        id: '${DateTime.now().microsecondsSinceEpoch}_$index',
        courseName: args['course_name']?.toString() ??
            args['courseName']?.toString() ??
            'Class',
        courseCode: args['course_code']?.toString() ??
            args['courseCode']?.toString() ??
            '',
        instructor: args['instructor']?.toString() ?? '',
        room: args['room']?.toString() ?? '',
        building: args['building']?.toString() ?? '',
        day: normalizeDay(args['day']?.toString()),
        startTime: normalizeTime(args['start_time']?.toString() ??
            args['startTime']?.toString()),
        endTime: normalizeTime(args['end_time']?.toString() ??
            args['endTime']?.toString()),
        reminderMinutes: (args['reminder_minutes'] as num?)?.toInt() ?? 10,
      );

  static bool isDuplicate(List<ClassSchedule> existing, ClassSchedule c) {
    return existing.any((e) =>
        e.day == c.day &&
        e.startTime == c.startTime &&
        (e.courseCode.isNotEmpty
            ? e.courseCode.toLowerCase() == c.courseCode.toLowerCase()
            : e.courseName.toLowerCase() == c.courseName.toLowerCase()));
  }

  static bool _matchesClass(ClassSchedule c, Map<String, dynamic> args) {
    final code = args['course_code']?.toString().toLowerCase().trim() ?? '';
    final name = args['course_name']?.toString().toLowerCase().trim() ?? '';
    final day = args['day']?.toString().toLowerCase().trim() ?? '';
    final hasFilter = code.isNotEmpty || name.isNotEmpty || day.isNotEmpty;
    if (!hasFilter) return false;

    if (code.isNotEmpty) {
      if (!c.courseCode.toLowerCase().contains(code) &&
          !c.courseName.toLowerCase().contains(code)) {
        return false;
      }
    }
    if (name.isNotEmpty) {
      if (!c.courseName.toLowerCase().contains(name) &&
          !c.courseCode.toLowerCase().contains(name)) {
        return false;
      }
    }
    if (day.isNotEmpty && c.day.toLowerCase() != day) return false;
    return true;
  }

  String _label(ClassSchedule c) =>
      c.courseCode.isNotEmpty ? '${c.courseName} (${c.courseCode})' : c.courseName;

  static String normalizeDay(String? raw) {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];
    final s = (raw ?? '').trim().toLowerCase();
    if (s.isEmpty) return 'Monday';
    for (final d in days) {
      if (d.toLowerCase() == s || d.toLowerCase().startsWith(s)) return d;
    }
    return 'Monday';
  }

  /// Normalises "7:00", "07:00", "7:00 PM", "19:00" to 24h "HH:mm".
  static String normalizeTime(String? raw) {
    var s = (raw ?? '').trim().toUpperCase();
    if (s.isEmpty) return '08:00';

    var pm = false;
    var am = false;
    if (s.contains('PM')) {
      pm = true;
      s = s.replaceAll('PM', '').trim();
    }
    if (s.contains('AM')) {
      am = true;
      s = s.replaceAll('AM', '').trim();
    }

    final parts = s.split(':');
    var h = int.tryParse(parts[0].replaceAll(RegExp(r'[^0-9]'), '')) ?? 8;
    final m = parts.length > 1
        ? (int.tryParse(parts[1].replaceAll(RegExp(r'[^0-9]'), '')) ?? 0)
        : 0;

    if (pm && h < 12) h += 12;
    if (am && h == 12) h = 0;
    h = h.clamp(0, 23);
    final mm = m.clamp(0, 59);
    return '${h.toString().padLeft(2, '0')}:${mm.toString().padLeft(2, '0')}';
  }

  static List<int> normalizeDays(dynamic raw) {
    if (raw is! List) return const [];
    final out = <int>[];
    for (final v in raw) {
      final i = (v as num?)?.toInt();
      if (i != null && i >= 1 && i <= 7 && !out.contains(i)) out.add(i);
    }
    out.sort();
    return out;
  }

  static String prettyTime(String hhmm) {
    final parts = hhmm.split(':');
    var h = int.tryParse(parts[0]) ?? 0;
    final m = parts.length > 1 ? parts[1] : '00';
    final suffix = h >= 12 ? 'PM' : 'AM';
    if (h == 0) {
      h = 12;
    } else if (h > 12) {
      h -= 12;
    }
    return '$h:$m $suffix';
  }
}
