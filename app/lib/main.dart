import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'screens/home_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/settings_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: ImuApp()));
}

class ImuApp extends StatelessWidget {
  const ImuApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "IM'U 1.2",
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF09090B),
        colorScheme: const ColorScheme.dark(
          primary: Colors.white,
          secondary: Color(0xFFA78BFA),
          surface: Color(0xFF18181B),
        ),
        cardTheme: CardThemeData(
          color: const Color(0xFF18181B),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFF27272A)),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF09090B),
          elevation: 0,
          centerTitle: false,
        ),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
      routes: {
        '/chat': (context) => const ChatScreen(conversationId: ''),
        '/settings': (context) => const SettingsScreen(),
      },
    );
  }
}
