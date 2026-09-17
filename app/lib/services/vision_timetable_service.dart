import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';
import '../models/class_schedule.dart';
import 'ai_actions_service.dart';

/// Parses timetable from images using AI vision.
class VisionTimetableService {
  static const _endpoint = '${AppConstants.supabaseUrl}/functions/v1/vision-parse';

  /// Parse timetable from an image file path.
  static Future<List<ClassSchedule>> parseFromImage(String imagePath) async {
    final file = File(imagePath);
    if (!file.existsSync()) return [];

    final bytes = await file.readAsBytes();
    final base64Image = base64Encode(bytes);

    final headers = <String, String>{
      'Content-Type': 'application/json',
      'apikey': AppConstants.supabaseAnonKey,
    };
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      headers['Authorization'] = 'Bearer ${session.accessToken}';
    }

    final resp = await http
        .post(
          Uri.parse(_endpoint),
          headers: headers,
          body: jsonEncode({
            'image': 'data:image/jpeg;base64,$base64Image',
            'prompt': 'Extract all classes from this timetable image.',
          }),
        )
        .timeout(const Duration(seconds: 120));

    if (resp.statusCode != 200) return [];

    final data = jsonDecode(resp.body);
    if (data is! Map<String, dynamic>) return [];

    final classes = data['classes'];
    if (classes is! List) return [];

    return classes
        .map((e) => _classFromVision(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  /// Parse timetable from text using the existing ai-actions endpoint.
  static Future<List<ClassSchedule>> parseFromText(String text) async {
    return AiActionsService().parseTimetable(text);
  }

  static ClassSchedule _classFromVision(Map<String, dynamic> args) {
    return ClassSchedule(
      id: '${DateTime.now().microsecondsSinceEpoch}_${args['course_name'] ?? 'class'}',
      courseName: args['course_name']?.toString() ?? 'Class',
      courseCode: args['course_code']?.toString() ?? '',
      instructor: args['instructor']?.toString() ?? '',
      room: args['room']?.toString() ?? '',
      building: args['building']?.toString() ?? '',
      day: AiActionsService.normalizeDay(args['day']?.toString()),
      startTime: AiActionsService.normalizeTime(args['start_time']?.toString()),
      endTime: AiActionsService.normalizeTime(args['end_time']?.toString()),
      reminderMinutes: (args['reminder_minutes'] as num?)?.toInt() ?? 10,
    );
  }
}
