import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';
import '../models/class_schedule.dart';

/// Uses the `vision-parse` edge function to extract timetable classes from an
/// image (photo of a schedule / syllabus), then converts them into
/// [ClassSchedule] objects ready to save.
class VisionService {
  static const _endpoint = '${AppConstants.supabaseUrl}/functions/v1/vision-parse';

  Future<List<ClassSchedule>> parseTimetableImage(
    String imagePath, {
    String? prompt,
  }) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'apikey': AppConstants.supabaseAnonKey,
    };
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      headers['Authorization'] = 'Bearer ${session.accessToken}';
    }

    final bytes = await File(imagePath).readAsBytes();
    final base64 = base64Encode(bytes);

    final resp = await http
        .post(
          Uri.parse(_endpoint),
          headers: headers,
          body: jsonEncode({
            'image': base64,
            if (prompt != null) 'prompt': prompt,
          }),
        )
        .timeout(const Duration(seconds: 60));

    if (resp.statusCode != 200) return const [];

    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    final raw = data['classes'];
    if (raw is! List) return const [];

    final out = <ClassSchedule>[];
    var i = 0;
    for (final item in raw) {
      final m = Map<String, dynamic>.from(item as Map);
      out.add(ClassSchedule(
        id: '${DateTime.now().microsecondsSinceEpoch}_$i',
        courseName: m['course_name']?.toString() ?? 'Class',
        courseCode: m['course_code']?.toString() ?? '',
        instructor: m['instructor']?.toString() ?? '',
        room: m['room']?.toString() ?? '',
        building: m['building']?.toString() ?? '',
        day: _normDay(m['day']?.toString()),
        startTime: _normTime(m['start_time']?.toString()),
        endTime: _normTime(m['end_time']?.toString()),
        reminderMinutes: (m['reminder_minutes'] as num?)?.toInt() ?? 10,
      ));
      i++;
    }
    return out;
  }

  String _normDay(String? raw) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final s = (raw ?? '').trim().toLowerCase();
    for (final d in days) {
      if (d.toLowerCase() == s || d.toLowerCase().startsWith(s)) return d;
    }
    return 'Monday';
  }

  String _normTime(String? raw) {
    final r = (raw ?? '').trim();
    if (r.isEmpty) return '08:00';
    final parts = r.split(':');
    final h = (int.tryParse(parts[0]) ?? 8).clamp(0, 23);
    final m = parts.length > 1 ? (int.tryParse(parts[1]) ?? 0).clamp(0, 59) : 0;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
  }
}