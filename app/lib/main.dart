import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'constants/app_constants.dart';
import 'screens/home_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/alarms_screen.dart';
import 'screens/pomodoro_screen.dart';

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('Firebase init failed: $e');
  }

  try {
    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      publishableKey: AppConstants.supabaseAnonKey,
    );
  } catch (e) {
    debugPrint('Supabase init failed: $e');
  }

  runApp(const ProviderScope(child: ImuApp()));
}

class ImuApp extends StatefulWidget {
  const ImuApp({super.key});

  @override
  State<ImuApp> createState() => _ImuAppState();
}

class _ImuAppState extends State<ImuApp> {
  bool _isDark = true;
  bool _initialized = false;
  int _unreadNotifications = 0;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    final dark = prefs.getBool('dark_mode') ?? true;
    _setupFCM();
    _setupNotificationListener();
    _checkUpdate();
    if (mounted) setState(() { _isDark = dark; _initialized = true; });
  }

  void _setupFCM() async {
    try {
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission(alert: true, badge: true, sound: true);
      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        final token = await messaging.getToken();
        if (token != null) _saveFcmToken(token);
        messaging.onTokenRefresh.listen((t) => _saveFcmToken(t));
      }
      await messaging.subscribeToTopic(AppConstants.fcmTopic);

      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (mounted) {
          setState(() => _unreadNotifications++);
          if (message.notification != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('${message.notification!.title ?? "New notification"}\n${message.notification!.body ?? ""}'),
                backgroundColor: _isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            );
          }
        }
      });
    } catch (e) {
      debugPrint('FCM setup skipped: $e');
    }
  }

  void _saveFcmToken(String token) async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        await Supabase.instance.client.from('profiles').upsert({
          'id': user.id,
          'device_info': {'fcm_token': token, 'platform': 'android'},
        });
      }
    } catch (e) {
      debugPrint('FCM token save failed: $e');
    }
  }

  void _setupNotificationListener() {
    try {
      Supabase.instance.client
          .from('notifications')
          .stream(primaryKey: ['id'])
          .order('created_at', ascending: false)
          .limit(1)
          .listen((events) {
        if (events.isNotEmpty && mounted) {
          setState(() => _unreadNotifications++);
          final notif = events.first;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${notif['title'] ?? "Notification"}\n${notif['body'] ?? ""}'),
              backgroundColor: _isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
      });
    } catch (e) {
      debugPrint('Notification listener skipped: $e');
    }
  }

  void _checkUpdate() async {
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
    } catch (e) {
      debugPrint('Update check skipped: $e');
    }
  }

  String? _latestVersion;
  String? _updateUrl;
  String? _updateNotes;
  bool _forceUpdate = false;

  void toggleTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final newVal = !_isDark;
    await prefs.setBool('dark_mode', newVal);
    setState(() => _isDark = newVal);
  }

  void clearNotifications() => setState(() => _unreadNotifications = 0);

  ThemeData get _darkTheme => ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: const Color(0xFF09090B),
    colorScheme: const ColorScheme.dark(primary: Colors.white, secondary: Color(0xFFA78BFA), surface: Color(0xFF18181B)),
    cardTheme: CardThemeData(color: const Color(0xFF18181B), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFF27272A)))),
    appBarTheme: const AppBarTheme(backgroundColor: Color(0xFF09090B), elevation: 0, centerTitle: false),
    useMaterial3: true,
  );

  ThemeData get _lightTheme => ThemeData(
    brightness: Brightness.light,
    scaffoldBackgroundColor: const Color(0xFFF8F9FA),
    colorScheme: const ColorScheme.light(primary: Colors.black, secondary: Color(0xFF7C3AED), surface: Colors.white),
    cardTheme: CardThemeData(color: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE5E7EB)))),
    appBarTheme: const AppBarTheme(backgroundColor: Color(0xFFF8F9FA), elevation: 0, centerTitle: false),
    useMaterial3: true,
  );

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: _darkTheme,
        home: const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFFA78BFA)))),
      );
    }

    final session = Supabase.instance.client.auth.currentSession;

    return MaterialApp(
      title: "IM'U 1.3",
      debugShowCheckedModeBanner: false,
      theme: _isDark ? _darkTheme : _lightTheme,
      home: session != null
          ? HomeScreen(
              onToggleTheme: toggleTheme,
              unreadNotifications: _unreadNotifications,
              onClearNotifications: clearNotifications,
              latestVersion: _latestVersion,
              updateUrl: _updateUrl,
              updateNotes: _updateNotes,
              forceUpdate: _forceUpdate,
            )
          : const AuthScreen(),
      routes: {
        '/home': (_) => HomeScreen(onToggleTheme: toggleTheme, unreadNotifications: _unreadNotifications, onClearNotifications: clearNotifications),
        '/auth': (_) => const AuthScreen(),
        '/chat': (_) => const ChatScreen(conversationId: ''),
        '/settings': (_) => SettingsScreen(onToggleTheme: toggleTheme),
        '/alarms': (_) => const AlarmsScreen(),
        '/pomodoro': (_) => const PomodoroScreen(),
      },
    );
  }
}
