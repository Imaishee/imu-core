class AppConstants {
  static const String appName = "IM'U";
  static const String appVersion = "1.2.0";
  static const String appTagline = "AI Study Companion";

  // Supabase
  static const String supabaseUrl = 'https://cxiicvirllfdvcjwwcbj.supabase.co';
  static const String supabaseAnonKey = 'sb_publishable_ejpB_tpHU9pgI3OrslbtDQ_qxbKrDN9';

  // Groq Models (via Edge Functions, key never exposed to client)
  static const String defaultModel = 'openai/gpt-oss-20b';
  static const String reasoningModel = 'openai/gpt-oss-120b';
  static const String visionModel = 'qwen/qwen3.8-27b';

  // API Endpoints
  static const String chatEndpoint = '/functions/v1/chat';
  static const String knowledgeEndpoint = '/functions/v1/knowledge';
  static const String checkUpdateEndpoint = '/functions/v1/check-update';

  // Firebase
  static const String fcmTopic = 'all_users';

  // UI
  static const double maxContentWidth = 768;
  static const int animationDurationMs = 300;
}
