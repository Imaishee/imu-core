import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';

/// Service for AI companion chat with personality and emotions
class AICompanionService {
  static const _timeout = Duration(seconds: 60);

  /// Send message to AI companion and get response
  static Future<Map<String, dynamic>> sendMessage({
    required String message,
    List<Map<String, dynamic>>? conversationHistory,
    String? companionGender,
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
      Uri.parse('${AppConstants.supabaseUrl}/functions/v1/ai-companion'),
      headers: headers,
      body: jsonEncode({
        'message': message,
        'conversationHistory': conversationHistory ?? [],
        'companionGender': companionGender ?? 'female',
      }),
    ).timeout(_timeout);

    if (response.statusCode != 200) {
      throw Exception('Failed to get AI response: ${response.statusCode}');
    }

    return jsonDecode(response.body);
  }

  /// Stream AI companion response for real-time typing effect
  static Stream<String> streamResponse({
    required String message,
    List<Map<String, dynamic>>? conversationHistory,
    String? companionGender,
  }) async* {
    // For now, use non-streaming since the edge function returns full response
    // Can be upgraded to streaming later
    final result = await sendMessage(
      message: message,
      conversationHistory: conversationHistory,
      companionGender: companionGender,
    );

    if (result.containsKey('message')) {
      yield result['message'];
    }
  }

  /// Get user's companion gender from profile
  static Future<String> getCompanionGender() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return 'female';

      final { data, error } = await Supabase.instance.client
          .from('profiles')
          .select('companion_gender')
          .eq('id', user.id)
          .single();

      if (error == null && data != null) {
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
