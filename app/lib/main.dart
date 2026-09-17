import 'dart:async';
import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'constants/app_constants.dart';
import 'theme/app_theme.dart';
import 'services/alarm_service.dart';
import 'services/fcm_service.dart';
import 'services/location_service.dart';
import 'services/permission_service.dart';
import 'services/timetable_service.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/alarms_screen.dart';
import 'screens/timetable_screen.dart';
import 'screens/pomodoro_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/chat_history_screen.dart';
import 'screens/reset_password_screen.dart';

// Re-export so the Dart VM can find it from the manifest entry-point.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  try {
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) {
      final supabase = SupabaseClient(
        AppConstants.supabaseUrl,
        AppConstants.supabaseAnonKey,
      );
      final user = supabase.auth.currentUser;
      if (user != null) {
        await supabase.from('fcm_tokens').upsert(
          {'user_id': user.id, 'token': token, 'platform': 'android'},
          onConflict: 'user_id,token',
        );
      }
    }
  } catch (_) {}
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Low-end device: limit image cache to 50MB (default is 100MB)
  PaintingBinding.instance.imageCache.maximumSizeBytes = 50 * 1024 * 1024;

  // Lock portrait — app is portrait-first
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Status bar
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));

  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (e) {
    print('Firebase init skipped: $e');
  }

  try {
    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      publishableKey: AppConstants.supabaseAnonKey,
    );
  } catch (e) {
    print('Supabase init skipped: $e');
  }

  // Render the app FIRST so a background init failure can never white-screen.
  runApp(const ProviderScope(child: ImuApp()));

  // Heavy init runs after first frame; each step is guarded so a plugin
  // throw (notifications, exact-alarm, cloud sync) can't crash startup.
  await Future<void>.delayed(Duration.zero);
  await _initializeBackgroundServices();
}

/// Best-effort background startup. Never throws to the caller.
Future<void> _initializeBackgroundServices() async {
  try {
    await PermissionService.requestCorePermissions();
  } catch (e) {
    print('Permission request skipped: $e');
  }

  // Ask for "Alarms & reminders" access before scheduling anything.
  try {
    await AlarmService.requestExactAlarmPermission();
  } catch (e) {
    print('Exact alarm request skipped: $e');
  }

  try {
    await AlarmService.init();
  } catch (e) {
    print('Alarm init skipped: $e');
  }

  try {
    final timetable = TimetableService();
    await timetable.mergeRemote();
    // AlarmManager entries are lost when the process dies, so every launch
    // must re-arm both the timetable reminders and the user's own alarms.
    await AlarmService.rescheduleAll(await timetable.loadLocal());
  } catch (e) {
    print('Timetable alarms skipped: $e');
  }

  try {
    await AlarmService.rearmSavedAlarms();
  } catch (e) {
    print('Saved alarms skipped: $e');
  }

  // Register the device token with Supabase so the notify edge function
  // can send real push notifications (system tray) when admin sends one.
  try {
    await FcmService.initialize();
  } catch (e) {
    print('FCM init skipped: $e');
  }

  // Capture user location for admin visibility (best-effort, once per session).
  try {
    await LocationService.captureAndSave();
  } catch (e) {
    print('Location capture skipped: $e');
  }
}

class ImuApp extends StatefulWidget {
  const ImuApp({super.key});
  @override
  State<ImuApp> createState() => _ImuAppState();
}

class _ImuAppState extends State<ImuApp> {
  bool _isDark = false;
  bool _initDone = false;

  // Update info
  String? _latestVersion;
  String? _updateUrl;
  String? _updateNotes;
  bool _forceUpdate = false;

  @override
  void initState() {
    super.initState();
    _initApp();
  }

  Future<void> _initApp() async {
    final prefs = await SharedPreferences.getInstance();
    final dark = prefs.getBool('dark_mode') ?? false;
    AppTheme.setDark(dark);

    // Unblock the first screen as soon as local prefs are read. Never gate
    // the UI on a network call — a slow/hanging Supabase request would leave
    // the user staring at a spinner (indistinguishable from a white screen).
    if (mounted) {
      setState(() {
        _isDark = dark;
        _initDone = true;
      });
    }

    // Fire-and-forget update check.
    _checkUpdate();
  }

  Future<void> _checkUpdate() async {
    try {
      final resp = await Supabase.instance.client.functions.invoke(
        'check-update',
        body: {'version': AppConstants.appVersion},
      );
      if (resp.data != null && resp.data['update_available'] == true) {
        _latestVersion = resp.data['latest_version'];
        _updateUrl = resp.data['download_url'];
        _updateNotes = resp.data['release_notes'];
        _forceUpdate = resp.data['force_update'] ?? false;
      }
    } catch (_) {}
  }

  /// Reads the current auth session without throwing if Supabase failed to
  /// initialize — a throw here would surface as a white screen.
  Session? _currentSession() {
    try {
      return Supabase.instance.client.auth.currentSession;
    } catch (_) {
      return null;
    }
  }

  void _toggleTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final next = !_isDark;
    AppTheme.setDark(next);
    await prefs.setBool('dark_mode', next);
    setState(() => _isDark = next);
  }

  @override
  Widget build(BuildContext context) {
    if (!_initDone) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: _isDark ? ThemeMode.dark : ThemeMode.light,
        home: Container(color: AppTheme.bg, child: const Center(child: CircularProgressIndicator(color: AppColors.greenLight))),
      );
    }

    final session = _currentSession();

    // Check if app was opened via deep link (password reset)
    String? resetToken;
    try {
      final uri = WidgetsBinding.instance.platformDispatcher.defaultRouteName;
      if (uri.contains('reset-password') || uri.contains('access_token')) {
        // Extract access_token from URI fragment or query
        final fragment = uri.contains('#') ? uri.split('#').last : '';
        final params = Uri.parse('?$fragment').queryParameters;
        resetToken = params['access_token'];
      }
    } catch (_) {}

    return MaterialApp(
      title: "I'MU — Study Companion",
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: _isDark ? ThemeMode.dark : ThemeMode.light,
      // `home` (not `initialRoute`) is required: Flutter's initial-route
      // generation walks the '/' prefix and throws a null-check error when
      // no '/' route exists, which white-screens the app on launch.
      home: resetToken != null
          ? ResetPasswordScreen(accessToken: resetToken)
          : session != null
              ? HomeScreen(
                  onToggleTheme: _toggleTheme,
                  latestVersion: _latestVersion,
                  updateUrl: _updateUrl,
                  updateNotes: _updateNotes,
                  forceUpdate: _forceUpdate,
                )
              : const AuthScreen(),
      routes: {
        '/home': (_) => HomeScreen(
              onToggleTheme: _toggleTheme,
              latestVersion: _latestVersion,
              updateUrl: _updateUrl,
              updateNotes: _updateNotes,
              forceUpdate: _forceUpdate,
            ),
        '/auth': (_) => const AuthScreen(),
        '/chat': (_) => const ChatScreen(conversationId: ''),
        '/settings': (_) => SettingsScreen(onToggleTheme: _toggleTheme),
        '/alarms': (_) => const AlarmsScreen(),
        '/pomodoro': (_) => const PomodoroScreen(),
        '/timetable': (_) => const TimetableScreen(),
        '/notifications': (_) => const NotificationsScreen(),
        '/chat-history': (_) => const ChatHistoryScreen(),
        '/reset-password': (_) => const ResetPasswordScreen(),
      },
    );
  }
}