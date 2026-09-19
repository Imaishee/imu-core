import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';

/// Result from the IMU Heart HF Space API.
class ImuHeartResult {
  final String response;
  final String intent;
  final String mood;
  final String timeOfDay;

  const ImuHeartResult({
    required this.response,
    this.intent = 'normal',
    this.mood = 'normal',
    this.timeOfDay = 'normal',
  });

  factory ImuHeartResult.fromJson(Map<String, dynamic> json) {
    return ImuHeartResult(
      response: json['response']?.toString() ?? '',
      intent: json['intent']?.toString() ?? 'normal',
      mood: json['mood']?.toString() ?? 'normal',
      timeOfDay: json['time_of_day']?.toString() ?? 'normal',
    );
  }

  bool get isEmpty => response.isEmpty;
}

/// Calls the IMU Heart HuggingFace Space (Layer 1) for dataset-grounded
/// seed responses. Falls back to empty if the space is cold or unreachable.
class ImuHeartService {
  static const _timeout = Duration(seconds: 12);
  static const _fallbackTimeout = Duration(seconds: 8);

  /// Generate a seed response from the IMU Heart model via HF Gradio API.
  ///
  /// The HF Space Gradio API expects:
  ///   POST { "data": ["message", null] }
  /// And returns:
  ///   { "data": ["response_text", { "intent": ..., "mood": ..., "time": ... }] }
  static Future<ImuHeartResult> generateSeed({
    required String message,
    String? companionGender,
    List<Map<String, dynamic>>? conversationHistory,
  }) async {
    // ─── Try HF Space first ──────────────────────────────────────────
    try {
      final response = await http
          .post(
            Uri.parse(AppConstants.imuHeartSpaceUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'data': [message, null],
            }),
          )
          .timeout(_timeout);

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        // Gradio SSE response: the body may be a stream or a direct JSON
        // Parse the event stream format: "data: {...}"
        final rawBody = response.body;
        final dataMatch = RegExp(r'data: (.+)').firstMatch(rawBody);
        if (dataMatch != null) {
          final eventData = jsonDecode(dataMatch.group(1)!);
          final dataList = eventData['data'] as List?;
          if (dataList != null && dataList.isNotEmpty) {
            final responseText = dataList[0]?.toString() ?? '';
            final metadata = dataList.length > 1 && dataList[1] is Map
                ? Map<String, dynamic>.from(dataList[1])
                : <String, dynamic>{};
            if (responseText.isNotEmpty) {
              return ImuHeartResult.fromJson({
                'response': responseText,
                'intent': metadata['intent'],
                'mood': metadata['mood'],
                'time_of_day': metadata['time'],
              });
            }
          }
        }

        // Fallback: try parsing as plain JSON
        if (body is Map && body.containsKey('data')) {
          final dataList = body['data'] as List?;
          if (dataList != null && dataList.isNotEmpty) {
            final responseText = dataList[0]?.toString() ?? '';
            final metadata = dataList.length > 1 && dataList[1] is Map
                ? Map<String, dynamic>.from(dataList[1])
                : <String, dynamic>{};
            if (responseText.isNotEmpty) {
              return ImuHeartResult.fromJson({
                'response': responseText,
                'intent': metadata['intent'],
                'mood': metadata['mood'],
                'time_of_day': metadata['time'],
              });
            }
          }
        }
      }
    } catch (e) {
      print('[ImuHeart] HF Space error: $e');
    }

    // ─── Fallback: Render Engine ──────────────────────────────────────
    try {
      final resp = await http
          .post(
            Uri.parse('${AppConstants.renderEngineUrl}/generate'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'message': message,
              'gender': companionGender ?? 'female',
              'conversation_history': (conversationHistory ?? [])
                  .map((m) => {
                        'role': m['role'] ?? 'user',
                        'content': m['content'] ?? '',
                      })
                  .toList(),
            }),
          )
          .timeout(_fallbackTimeout);

      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        final response = data['response']?.toString() ?? '';
        if (response.isNotEmpty) {
          return ImuHeartResult.fromJson({
            'response': response,
            'intent': data['intent'] ?? 'normal',
            'mood': data['mood'] ?? 'normal',
            'time_of_day': data['time_of_day'] ?? 'normal',
          });
        }
      }
    } catch (e) {
      print('[ImuHeart] Render fallback error: $e');
    }

    // ─── Both failed — return empty, caller uses Groq directly ────────
    return const ImuHeartResult(response: '');
  }
}
