import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';
import 'imu_heart_service.dart';

/// Service for AI companion chat with personality and emotions.
///
/// Two-layer architecture:
///   Layer 1: IMU Heart HF Space generates a dataset-grounded seed
///   Layer 2: Groq API (via ai-companion edge function) polishes the seed
///     into a natural Banglish/Hinglish response.
class AICompanionService {
  static const _timeout = Duration(seconds: 60);

  /// Send message to AI companion and get response.
  /// Optionally accepts an [imuHeartSeed] from Layer 1 to guide the response.
  static Future<Map<String, dynamic>> sendMessage({
    required String message,
    List<Map<String, dynamic>>? conversationHistory,
    String? companionGender,
    String? imuHeartSeed,
  }) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'apikey': AppConstants.supabaseAnonKey,
    };

    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      headers['Authorization'] = 'Bearer ${session.accessToken}';
    }

    final response = await http.post(
      Uri.parse('${AppConstants.supabaseUrl}${AppConstants.aiCompanionEndpoint}',
      ),
      headers: headers,
      body: jsonEncode({
        'message': message,
        'conversationHistory': conversationHistory ?? [],
        'companionGender': companionGender ?? 'female',
        if (imuHeartSeed != null && imuHeartSeed.isNotEmpty)
          'imuHeartSeed': imuHeartSeed,
      }),
    ).timeout(_timeout);

    if (response.statusCode != 200) {
      throw Exception('Failed to get AI response: ${response.statusCode}');
    }

    return jsonDecode(response.body);
  }

  /// Stream AI companion response for real-time typing effect.
  static Stream<String> streamResponse({
    required String message,
    List<Map<String, dynamic>>? conversationHistory,
    String? companionGender,
    String? imuHeartSeed,
  }) async* {
    final result = await sendMessage(
      message: message,
      conversationHistory: conversationHistory,
      companionGender: companionGender,
      imuHeartSeed: imuHeartSeed,
    );

    if (result.containsKey('message')) {
      yield result['message'];
    }
  }

  /// Call IMU Heart Layer 1 directly (for pre-seeding before edge function).
  static Future<ImuHeartResult> getHeartSeed({
    required String message,
    String? companionGender,
    List<Map<String, dynamic>>? conversationHistory,
  }) {
    return ImuHeartService.generateSeed(
      message: message,
      companionGender: companionGender,
      conversationHistory: conversationHistory,
    );
  }

  /// Get user's companion gender from profile
  static Future<String> getCompanionGender() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return 'female';

      final data = await Supabase.instance.client
          .from('profiles')
          .select('companion_gender')
          .eq('id', user.id)
          .maybeSingle();

      if (data != null) {
        return data['companion_gender'] ?? 'female';
      }
    } catch (e) {
      // Default to female
    }
    return 'female';
  }

  /// Update user's last active timestamp
  static Future<void> updateLastActive() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;

      await Supabase.instance.client
          .from('profiles')
          .update({'last_active_at': DateTime.now().toIso8601String()})
          .eq('id', user.id);
    } catch (e) {
      // Silent fail for activity tracking
    }
  }

  /// Load conversation history from local storage or Supabase
  static Future<List<Map<String, dynamic>>> loadHistory(String conversationId) async {
    // For now, return empty - will implement history loading later
    return [];
  }
}
