import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';

/// Talks to the `otp` edge function to send & verify OTP codes, and to
/// reset passwords. Delivered via Resend with a branded email template.
class OtpService {
  static const _endpoint = '${AppConstants.supabaseUrl}/functions/v1/otp';

  static Map<String, String> _headers() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'apikey': AppConstants.supabaseAnonKey,
    };
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      headers['Authorization'] = 'Bearer ${session.accessToken}';
    }
    return headers;
  }

  static Future<http.Response> _post(Map<String, dynamic> body) async {
    return http
        .post(Uri.parse(_endpoint), headers: _headers(), body: jsonEncode(body))
        .timeout(const Duration(seconds: 30));
  }

  /// Send a verification/reset OTP to [email].
  static Future<void> send({
    required String email,
    String purpose = 'signup',
  }) async {
    final resp = await _post({'action': 'send', 'email': email, 'purpose': purpose});
    final data = resp.statusCode == 200 ? jsonDecode(resp.body) as Map : null;
    if (data == null || data['ok'] != true) {
      throw Exception(data?['error'] ?? 'Failed to send code');
    }
  }

  /// Verify [code] sent to [email].
  static Future<Map<String, dynamic>> verify({
    required String email,
    required String code,
    String purpose = 'signup',
  }) async {
    final resp = await _post({
      'action': 'verify',
      'email': email,
      'code': code,
      'purpose': purpose,
    });
    final raw = resp.statusCode == 200 ? jsonDecode(resp.body) : null;
    if (raw == null || raw is! Map || raw['ok'] != true) {
      throw Exception(raw is Map ? raw['error'] : 'Verification failed');
    }
    return Map<String, dynamic>.from(raw);
  }

  /// Verify a recovery code and set a new password.
  static Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    final resp = await _post({
      'action': 'reset_password',
      'email': email,
      'code': code,
      'purpose': 'recovery',
      'new_password': newPassword,
    });
    final data = resp.statusCode == 200 ? jsonDecode(resp.body) as Map : null;
    if (data == null || data['ok'] != true) {
      throw Exception(data?['error'] ?? 'Password reset failed');
    }
  }
}