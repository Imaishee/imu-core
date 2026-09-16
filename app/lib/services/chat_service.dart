import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';

class ChatService {
  final String _baseUrl = AppConstants.supabaseUrl;
  final String _anonKey = AppConstants.supabaseAnonKey;

  Future<String> _getToken() async {
    // In production, get from Supabase auth
    return _anonKey;
  }

  Stream<String> streamChat({
    required List<Map<String, String>> messages,
    String? conversationId,
    String model = AppConstants.defaultModel,
  }) async* {
    final token = await _getToken();
    final url = Uri.parse('$_baseUrl${AppConstants.chatEndpoint}');

    final request = http.Request('POST', url);
    request.headers.addAll({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
      'apikey': _anonKey,
    });
    request.body = jsonEncode({
      'messages': messages,
      'conversation_id': conversationId,
      'model': model,
    });

    final response = await http.Client().send(request);

    if (response.statusCode != 200) {
      throw Exception('Chat request failed: ${response.statusCode}');
    }

    String buffer = '';
    await for (final chunk in response.stream.transform(utf8.decoder)) {
      buffer += chunk;
      final lines = buffer.split('\n');
      buffer = lines.removeLast();

      for (final line in lines) {
        if (line.startsWith('data: ')) {
          final data = line.substring(6).trim();
          if (data == '[DONE]') return;

          try {
            final parsed = jsonDecode(data);
            final content = parsed['choices']?[0]?['delta']?['content'];
            if (content != null && content is String) {
              yield content;
            }
          } catch (_) {}
        }
      }
    }
  }

  Future<List<Map<String, dynamic>>> getConversations(String userId) async {
    final token = await _getToken();
    final url = Uri.parse('$_baseUrl/rest/v1/conversations?user_id=eq.$userId&order=updated_at.desc');

    final response = await http.get(url, headers: {
      'Authorization': 'Bearer $token',
      'apikey': _anonKey,
    });

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    }
    return [];
  }

  Future<List<Map<String, dynamic>>> getMessages(String conversationId) async {
    final token = await _getToken();
    final url = Uri.parse('$_baseUrl/rest/v1/messages?conversation_id=eq.$conversationId&order=created_at.asc');

    final response = await http.get(url, headers: {
      'Authorization': 'Bearer $token',
      'apikey': _anonKey,
    });

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    }
    return [];
  }
}
