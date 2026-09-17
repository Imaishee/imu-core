import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';

class ChatStatus {
  final String step;
  final String? detail;
  const ChatStatus(this.step, {this.detail});

  String get label {
    switch (step) {
      case 'thinking':
        return 'Thinking…';
      case 'searching':
        return 'Searching the web…';
      case 'search_done':
        return detail ?? 'Found sources';
      case 'scraping':
        return 'Reading webpage…';
      default:
        return step;
    }
  }
}

class ChatService {
  static const _timeout = Duration(seconds: 120);

  /// Streams events: {'type':'status','step','detail'} and {'type':'chunk','text'}.
  Stream<Map<String, dynamic>> streamChat({
    required List<Map<String, String>> messages,
    String? conversationId,
    Map<String, dynamic>? context,
    String? model,
  }) async* {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'apikey': AppConstants.supabaseAnonKey,
    };

    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      headers['Authorization'] = 'Bearer ${session.accessToken}';
    }

    final request = http.Request(
      'POST',
      Uri.parse('https://cxiicvirllfdvcjwwcbj.supabase.co/functions/v1/chat'),
    );
    request.headers.addAll(headers);
    request.body = jsonEncode({
      'messages': messages,
      if (conversationId != null) 'conversation_id': conversationId,
      if (context != null) 'context': context,
      'model': model ?? AppConstants.defaultModel,
    });

    final response = await http.Client().send(request).timeout(_timeout);
    final utf8Stream = response.stream.transform(const Utf8Decoder());
    final lineStream = utf8Stream.transform(const LineSplitter());

    await for (final line in lineStream) {
      if (!line.startsWith('data: ')) continue;
      final payload = line.substring(6).trim();
      if (payload.isEmpty || payload == '[DONE]') break;
      try {
        final data = jsonDecode(payload);
        if (data is Map<String, dynamic> && data['type'] == 'status') {
          yield {'type': 'status', 'step': data['step'], 'detail': data['detail']};
        } else {
          final content = data['choices']?[0]?['delta']?['content'];
          if (content != null && content.isNotEmpty) {
            yield {'type': 'chunk', 'text': content};
          }
        }
      } catch (_) {}
    }
  }
}