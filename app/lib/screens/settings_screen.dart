import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _darkMode = true;
  bool _notifications = true;
  bool _soundEnabled = true;
  String _selectedModel = 'llama-3.3-70b-versatile';
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
      _selectedModel = prefs.getString('model') ?? 'llama-3.3-70b-versatile';
      _selectedLanguage = prefs.getString('language') ?? 'English';
    });
  }

  Future<void> _savePref(String key, dynamic value) async {
    final prefs = await SharedPreferences.getInstance();
    if (value is bool) await prefs.setBool(key, value);
    if (value is String) await prefs.setString(key, value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_ios, size: 20),
        ),
        title: const Text('Settings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF18181B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF27272A)),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFA78BFA),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Center(
                    child: Text('U', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('User', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                      Text('Free Plan', style: TextStyle(color: Colors.white54, fontSize: 13)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: Colors.white38),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // AI Settings
          _buildSection('AI Settings', [
            _buildTile(
              Icons.smart_toy_outlined,
              'AI Model',
              trailing: DropdownButton<String>(
                value: _selectedModel,
                dropdownColor: const Color(0xFF27272A),
                underline: const SizedBox(),
                items: const [
                  DropdownMenuItem(value: 'llama-3.3-70b-versatile', child: Text('Llama 3.3 70B', style: TextStyle(color: Colors.white, fontSize: 13))),
                  DropdownMenuItem(value: 'llama-3.1-8b-instant', child: Text('Llama 3.1 8B (Fast)', style: TextStyle(color: Colors.white, fontSize: 13))),
                  DropdownMenuItem(value: 'mixtral-8x7b-32768', child: Text('Mixtral 8x7B', style: TextStyle(color: Colors.white, fontSize: 13))),
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

          // Appearance
          _buildSection('Appearance', [
            _buildTile(
              Icons.dark_mode_outlined,
              'Dark Mode',
              trailing: Switch(
                value: _darkMode,
                onChanged: (v) {
                  setState(() => _darkMode = v);
                  _savePref('dark_mode', v);
                },
                activeThumbColor: const Color(0xFFA78BFA),
              ),
            ),
            _buildTile(
              Icons.language_outlined,
              'Language',
              trailing: DropdownButton<String>(
                value: _selectedLanguage,
                dropdownColor: const Color(0xFF27272A),
                underline: const SizedBox(),
                items: const [
                  DropdownMenuItem(value: 'English', child: Text('English', style: TextStyle(color: Colors.white, fontSize: 13))),
                  DropdownMenuItem(value: 'Hindi', child: Text('Hindi', style: TextStyle(color: Colors.white, fontSize: 13))),
                  DropdownMenuItem(value: 'Spanish', child: Text('Spanish', style: TextStyle(color: Colors.white, fontSize: 13))),
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

          // Preferences
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
                activeThumbColor: const Color(0xFFA78BFA),
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
                activeThumbColor: const Color(0xFFA78BFA),
              ),
            ),
          ]),

          const SizedBox(height: 16),

          // Data
          _buildSection('Data', [
            _buildTile(Icons.storage_outlined, 'Clear Chat History', onTap: _clearHistory),
          ]),

          const SizedBox(height: 16),

          // About
          _buildSection('About', [
            _buildTile(Icons.info_outline, 'Version', trailing: Text(AppConstants.appVersion, style: const TextStyle(color: Colors.white54, fontSize: 13))),
            _buildTile(Icons.description_outlined, 'Terms of Service'),
            _buildTile(Icons.privacy_tip_outlined, 'Privacy Policy'),
          ]),

          const SizedBox(height: 24),

          // Sign Out
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF27272A)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Sign Out', style: TextStyle(color: Colors.white70)),
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
        backgroundColor: const Color(0xFF18181B),
        title: const Text('Clear History', style: TextStyle(color: Colors.white)),
        content: const Text('This will delete all your chat history. This cannot be undone.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
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
        Text(title.toUpperCase(), style: TextStyle(color: Colors.white.withAlpha(128), fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF18181B),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF27272A)),
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
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: Color(0xFF27272A), width: 0.5)),
        ),
        child: Row(
          children: [
            Icon(icon, color: Colors.white54, size: 20),
            const SizedBox(width: 12),
            Expanded(child: Text(title, style: const TextStyle(color: Colors.white, fontSize: 15))),
            if (trailing case final t?) t,
          ],
        ),
      ),
    );
  }
}
