class AppConstants {
  static const String appName = "IM'U";
  static const String appVersion = "1.2.0";
  static const String appTagline = "AI Study Companion";

  // Supabase
  static const String supabaseUrl = 'https://cxiicvirllfdvcjwwcbj.supabase.co';
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  // Groq API (used via Edge Functions, never exposed directly)
  static const String defaultModel = 'llama-3.3-70b-versatile';

  // API Endpoints
  static const String chatEndpoint = '/functions/v1/chat';
  static const String knowledgeEndpoint = '/functions/v1/knowledge';
  static const String checkUpdateEndpoint = '/functions/v1/check-update';

  // UI
  static const double maxContentWidth = 768;
  static const int animationDurationMs = 300;
}
