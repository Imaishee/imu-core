import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'constants/app_constants.dart';
import 'theme/app_theme.dart';
import 'providers/app_provider.dart';
import 'services/alarm_service.dart';
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

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

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
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
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

  try {
    await AlarmService.init();
  } catch (e) {
    print('Alarm init skipped: $e');
  }

  try {
    await TimetableService().mergeRemote();
  } catch (e) {
    print('Timetable sync skipped: $e');
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
    setState(() => _isDark = dark);

    // Check for updates in background
    _checkUpdate();

    // Rebuild alarms from local timetable
    UserProfile? profile;
    try {
      final profileData = await Supabase.instance.client
          .from('public.profiles')
          .select()
          .eq('id', Supabase.instance.client.auth.currentUser?.id ?? '')
          .maybeSingle();
      if (profileData != null) {
        profile = UserProfile.fromMap(profileData);
      }
    } catch (_) {}

    setState(() {
      _isDark = dark;
      _initDone = true;
    });
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

    final session = Supabase.instance.client.auth.currentSession;

    return MaterialApp(
      title: "IM'U — Study Companion",
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: _isDark ? ThemeMode.dark : ThemeMode.light,
      initialRoute: session != null ? '/home' : '/auth',
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
      },
    );
  }
}