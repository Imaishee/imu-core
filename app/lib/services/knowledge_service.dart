import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';

class KnowledgeService {
  final String _baseUrl = AppConstants.supabaseUrl;
  final String _anonKey = AppConstants.supabaseAnonKey;

  Future<String> _getToken() async {
    return _anonKey;
  }

  Future<List<Map<String, dynamic>>> extractKnowledge(String text) async {
    final token = await _getToken();
    final url = Uri.parse('$_baseUrl${AppConstants.knowledgeEndpoint}');

    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
        'apikey': _anonKey,
      },
      body: jsonEncode({'action': 'extract', 'text': text}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data['nodes'] ?? []);
    }
    return [];
  }

  Future<List<Map<String, dynamic>>> queryKnowledge() async {
    final token = await _getToken();
    final url = Uri.parse('$_baseUrl${AppConstants.knowledgeEndpoint}');

    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
        'apikey': _anonKey,
      },
      body: jsonEncode({'action': 'query'}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data['nodes'] ?? []);
    }
    return [];
  }

  Future<Map<String, dynamic>> getFullGraph() async {
    final token = await _getToken();
    final url = Uri.parse('$_baseUrl${AppConstants.knowledgeEndpoint}');

    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
        'apikey': _anonKey,
      },
      body: jsonEncode({'action': 'graph'}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return {'nodes': [], 'edges': []};
  }
}
