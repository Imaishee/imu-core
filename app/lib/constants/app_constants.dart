class AppConstants {
  static const String appName = "I'MU";
  static const String appVersion = "1.6.0";
  static const String appTagline = "AI Study Companion";

  // Supabase
  static const String supabaseUrl = 'https://cxiicvirllfdvcjwwcbj.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWljdmlybGxmZHZjand3Y2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTI2MjMsImV4cCI6MjEwNTAyODYyM30.XaNaSnX4S8_xqiOg1KvfhUzEcufspv0INMpfowLEcOY';

  // Groq Models (via Edge Functions, key never exposed to client)
  static const String defaultModel = 'openai/gpt-oss-120b';
  static const String fallbackModel = 'openai/gpt-oss-20b';
  static const String visionModel = 'qwen/qwen3.8-27b';

  // Available models for user selection
  static const List<Map<String, String>> availableModels = [
    {'id': 'openai/gpt-oss-120b', 'name': 'GPT-OSS 120B', 'description': 'Most capable — best for complex tasks'},
    {'id': 'openai/gpt-oss-20b', 'name': 'GPT-OSS 20B', 'description': 'Fast — great for quick chats'},
    {'id': 'qwen/qwen3.8-27b', 'name': 'Qwen 3.8 27B', 'description': 'Balanced — good all-round'},
  ];

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
