import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Handles deep links for Supabase auth flows:
/// - Password reset:  com.imu://reset-password#access_token=...
/// - Email verify:    com.imu://verify#access_token=...&type=email
/// - Auth callback:   com.imu://auth (PKCE flow)
class DeepLinkService {
  DeepLinkService._();
  static final DeepLinkService instance = DeepLinkService._();

  final _appLinks = AppLinks();
  final _controller = StreamController<Uri>.broadcast();
  Uri? _initialUri;
  bool _initialized = false;

  /// Stream of auth-related deep links.
  Stream<Uri> get onLink => _controller.stream;

  /// The URI that launched the app (null if opened normally).
  Uri? get initialUri => _initialUri;

  /// Start listening for deep links. Call once in main().
  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    try {
      // Check if app was opened via a deep link
      _initialUri = await _appLinks.getInitialLink();

      // Subscribe to subsequent deep links while app is running
      _appLinks.uriLinkStream.listen((uri) {
        _controller.add(uri);
        _handleLink(uri);
      }, onError: (e) {
        print('[DeepLink] URI stream error: $e');
      });
    } catch (e) {
      print('[DeepLink] Init failed: $e');
      // Deep linking unavailable — app still works, just no link handling
    }
  }

  /// Processes a deep link: if it's a Supabase auth link, tell Supabase to
  /// parse the session from it and expose a callback.
  void _handleLink(Uri uri) {
    // Supabase PKCE/session links carry tokens in the URL. Let the client
    // try to recover the session so auth state updates app-wide.
    try {
      if (uri.host == 'auth' || uri.path.contains('auth')) {
        Supabase.instance.client.auth.recoverSession(uri.toString());
      }
    } catch (e) {
      print('[DeepLink] Failed to handle link $uri: $e');
    }
  }
}