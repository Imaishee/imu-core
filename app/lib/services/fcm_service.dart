import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'alarm_service.dart';

/// Top-level background handler — must be a top-level function (not inside a
/// class) so the Dart VM can find it when Android wakes the isolate to deliver
/// a background FCM message.  This runs even when the app was killed/rebooted.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase must be initialized in the background isolate before we can
  // touch any Firebase API.  Swallowed if it fails — the message is already
  // delivered to the system tray by Android's FCM service.
  try {
    await Firebase.initializeApp();
  } catch (_) {}

  // Re-register the token so the server always has a valid target.
  try {
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) {
      await _bgStoreToken(token);
    }
  } catch (_) {}
}

/// Store FCM token from a background isolate.  We spin up a fresh Supabase
/// client because the foreground instance doesn't exist here.
Future<void> _bgStoreToken(String token) async {
  try {
    final supabase = SupabaseClient(
      'https://cxiicvirllfdvcjwwcbj.supabase.co',
      const String.fromEnvironment('SUPABASE_ANON_KEY',
          defaultValue:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWljdmlybGxmZHZjand3Y2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTI2MjMsImV4cCI6MjEwNTAyODYyM30.XaNaSnX4S8_xqiOg1KvfhUzEcufspv0INMpfowLEcOY'),
    );
    final user = supabase.auth.currentUser;
    if (user == null) return;
    await supabase.from('fcm_tokens').upsert(
      {
        'user_id': user.id,
        'token': token,
        'platform': 'android',
      },
      onConflict: 'user_id,token',
    );
  } catch (_) {}
}

/// Handles FCM token registration and foreground message display.
///
/// Push notifications work in all three app states:
///   • **Foreground** — Android shows nothing by default; we intercept
///     the message via [FirebaseMessaging.onMessage] and post a local
///     notification so the user sees and hears it.
///   • **Background** — Android displays the `notification` payload
///     automatically (system tray).
///   • **Killed / Rebooted** — The background handler above re-registers
///     the token.  Android's system FCM service shows the notification.
class FcmService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  /// One-time setup: request permission, register token, subscribe to
  /// broadcast topic, and wire up foreground / tap handlers.
  static Future<void> initialize() async {
    // Request notification permission (Android 13+, iOS).
    await _messaging.requestPermission(alert: true, badge: true, sound: true);

    // Get and persist the device token so the server can target us.
    final token = await _messaging.getToken();
    if (token != null) await _storeToken(token);
    _messaging.onTokenRefresh.listen(_storeToken);

    // Subscribe to the broadcast topic — used when admin sends to "All Users".
    await _messaging.subscribeToTopic('all_users');

    // Foreground: show as a real notification (system tray).
    FirebaseMessaging.onMessage.listen(_onForegroundMessage);

    // Notification tapped while app was in background.
    FirebaseMessaging.onMessageOpenedApp.listen(_onMessageOpened);

    // Notification tapped while app was killed.
    final initial = await _messaging.getInitialMessage();
    if (initial != null) _onMessageOpened(initial);
  }

  /// Upsert the FCM token into the `fcm_tokens` table so the notify edge
  /// function can look it up when sending a targeted push.
  static Future<void> _storeToken(String token) async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      await Supabase.instance.client.from('fcm_tokens').upsert(
        {
          'user_id': user.id,
          'token': token,
          'platform': 'android',
        },
        onConflict: 'user_id,token',
      );
    } catch (_) {
      // Token storage is best-effort; the app works without it.
    }
  }

  /// Android suppresses the default notification tray entry for foreground
  /// FCM messages, so we post our own local notification to make it visible.
  static void _onForegroundMessage(RemoteMessage msg) {
    final n = msg.notification;
    if (n == null) return;
    // Fold the notification_id into int32 range for Android.
    final id = msg.data['notification_id']?.hashCode ??
        (DateTime.now().microsecond & 0x7fffffff);
    AlarmService.showInboxNotification(
      id: id,
      title: n.title ?? '',
      body: n.body ?? '',
    );
  }

  /// Called when the user taps a notification that opens the app.
  /// Could navigate to a specific screen based on [msg.data] in future.
  static void _onMessageOpened(RemoteMessage msg) {
    // The app opens to the home screen.  Data-driven navigation can be
    // added here later (e.g. open a specific conversation).
  }
}
