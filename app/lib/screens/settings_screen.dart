import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';

class SettingsScreen extends StatefulWidget {
  final VoidCallback? onToggleTheme;
  const SettingsScreen({super.key, this.onToggleTheme});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _darkMode = true;
  bool _notifications = true;
  bool _soundEnabled = true;
  String _selectedModel = 'openai/gpt-oss-20b';
  String _selectedLanguage = 'English';

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _darkMode = prefs.getBool('dark_mode') ?? true;
      _notifications = prefs.getBool('notifications') ?? true;
      _soundEnabled = prefs.getBool('sound_enabled') ?? true;
      _selectedModel = prefs.getString('model') ?? 'openai/gpt-oss-20b';
      _selectedLanguage = prefs.getString('language') ?? 'English';
    });
  }

  Future<void> _savePref(String key, dynamic value) async {
    final prefs = await SharedPreferences.getInstance();
    if (value is bool) await prefs.setBool(key, value);
    if (value is String) await prefs.setString(key, value);
  }

  bool get _isDark => _darkMode;

  Color get _bg => _isDark ? const Color(0xFF09090B) : const Color(0xFFF8F9FA);
  Color get _cardBg => _isDark ? const Color(0xFF18181B) : Colors.white;
  Color get _borderColor => _isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB);
  Color get _textPrimary => _isDark ? Colors.white : const Color(0xFF18181B);
  Color get _textSecondary => _isDark ? Colors.white54 : const Color(0xFF71717A);
  Color get _accent => _isDark ? const Color(0xFFA78BFA) : const Color(0xFF7C3AED);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: Icon(Icons.arrow_back_ios, size: 20, color: _textPrimary),
        ),
        title: Text('Settings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: _textPrimary)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _cardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _borderColor),
            ),
            child: Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(color: _accent, borderRadius: BorderRadius.circular(24)),
                  child: Center(child: Text('U', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20))),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('User', style: TextStyle(color: _textPrimary, fontWeight: FontWeight.w600)),
                      Text('Free Plan', style: TextStyle(color: _textSecondary, fontSize: 13)),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: _textSecondary),
              ],
            ),
          ),

          const SizedBox(height: 24),

          _buildSection('AI Settings', [
            _buildTile(
              Icons.smart_toy_outlined,
              'AI Model',
              trailing: DropdownButton<String>(
                value: _selectedModel,
                dropdownColor: _isDark ? const Color(0xFF27272A) : Colors.white,
                underline: const SizedBox(),
                items: const [
                  DropdownMenuItem(value: 'openai/gpt-oss-20b', child: Text('GPT-OSS 20B (Fast)', style: TextStyle(fontSize: 13))),
                  DropdownMenuItem(value: 'openai/gpt-oss-120b', child: Text('GPT-OSS 120B (Smart)', style: TextStyle(fontSize: 13))),
                  DropdownMenuItem(value: 'qwen/qwen3.8-27b', child: Text('Qwen 3.8 27B (Vision)', style: TextStyle(fontSize: 13))),
                ],
                onChanged: (v) {
                  if (v != null) {
                    setState(() => _selectedModel = v);
                    _savePref('model', v);
                  }
                },
              ),
            ),
          ]),

          const SizedBox(height: 16),

          _buildSection('Appearance', [
            _buildTile(
              Icons.dark_mode_outlined,
              'Dark Mode',
              trailing: Switch(
                value: _darkMode,
                onChanged: (v) {
                  setState(() => _darkMode = v);
                  _savePref('dark_mode', v);
                  widget.onToggleTheme?.call();
                },
                activeThumbColor: _accent,
              ),
            ),
            _buildTile(
              Icons.language_outlined,
              'Language',
              trailing: DropdownButton<String>(
                value: _selectedLanguage,
                dropdownColor: _isDark ? const Color(0xFF27272A) : Colors.white,
                underline: const SizedBox(),
                items: const [
                  DropdownMenuItem(value: 'English', child: Text('English', style: TextStyle(fontSize: 13))),
                  DropdownMenuItem(value: 'Hindi', child: Text('Hindi', style: TextStyle(fontSize: 13))),
                  DropdownMenuItem(value: 'Spanish', child: Text('Spanish', style: TextStyle(fontSize: 13))),
                ],
                onChanged: (v) {
                  if (v != null) {
                    setState(() => _selectedLanguage = v);
                    _savePref('language', v);
                  }
                },
              ),
            ),
          ]),

          const SizedBox(height: 16),

          _buildSection('Preferences', [
            _buildTile(
              Icons.notifications_outlined,
              'Push Notifications',
              trailing: Switch(
                value: _notifications,
                onChanged: (v) {
                  setState(() => _notifications = v);
                  _savePref('notifications', v);
                },
                activeThumbColor: _accent,
              ),
            ),
            _buildTile(
              Icons.volume_up_outlined,
              'Sound Effects',
              trailing: Switch(
                value: _soundEnabled,
                onChanged: (v) {
                  setState(() => _soundEnabled = v);
                  _savePref('sound_enabled', v);
                },
                activeThumbColor: _accent,
              ),
            ),
          ]),

          const SizedBox(height: 16),

          _buildSection('Data', [
            _buildTile(Icons.storage_outlined, 'Clear Chat History', onTap: _clearHistory),
          ]),

          const SizedBox(height: 16),

          _buildSection('About', [
            _buildTile(Icons.info_outline, 'Version', trailing: Text(AppConstants.appVersion, style: TextStyle(color: _textSecondary, fontSize: 13))),
            _buildTile(Icons.description_outlined, 'Terms of Service'),
            _buildTile(Icons.privacy_tip_outlined, 'Privacy Policy'),
          ]),

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton(
              onPressed: () async {
                await Supabase.instance.client.auth.signOut();
                if (context.mounted) {
                  Navigator.pushNamedAndRemoveUntil(context, '/auth', (_) => false);
                }
              },
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: _borderColor),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text('Sign Out', style: TextStyle(color: _textSecondary)),
            ),
          ),
        ],
      ),
    );
  }

  void _clearHistory() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: _cardBg,
        title: Text('Clear History', style: TextStyle(color: _textPrimary)),
        content: Text('This will delete all your chat history. This cannot be undone.', style: TextStyle(color: _textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: TextStyle(color: _textSecondary))),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Clear', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title.toUpperCase(), style: TextStyle(color: _textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: _cardBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _borderColor),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildTile(IconData icon, String title, {Widget? trailing, VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: _borderColor, width: 0.5)),
        ),
        child: Row(
          children: [
            Icon(icon, color: _textSecondary, size: 20),
            const SizedBox(width: 12),
            Expanded(child: Text(title, style: TextStyle(color: _textPrimary, fontSize: 15))),
            if (trailing case final t?) t,
          ],
        ),
      ),
    );
  }
}
