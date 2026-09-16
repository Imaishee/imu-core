class AppConstants {
  static const String appName = "IM'U";
  static const String appTagline = "AI Study Companion";

  // Supabase
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://cxiicvirllfdvcjwwcbj.supabase.co',
  );
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  // API Endpoints
  static const String chatEndpoint = '/functions/v1/chat';
  static const String knowledgeEndpoint = '/functions/v1/knowledge';
  static const String notifyEndpoint = '/functions/v1/notify';

  // Models
  static const String defaultModel = 'gpt-4o-mini';
  static const int maxTokens = 2048;

  // UI
  static const double maxContentWidth = 768;
  static const int animationDurationMs = 300;
}
