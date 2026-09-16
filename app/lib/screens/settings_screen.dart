import 'package:flutter/material.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

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
                      Text('user@example.com', style: TextStyle(color: Colors.white54, fontSize: 13)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: Colors.white38),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Preferences
          _buildSection('Preferences', [
            _buildTile(Icons.dark_mode_outlined, 'Dark Mode', trailing: Switch(value: true, onChanged: (_) {})),
            _buildTile(Icons.notifications_outlined, 'Notifications', trailing: Switch(value: true, onChanged: (_) {})),
            _buildTile(Icons.language_outlined, 'Language', trailing: const Text('English', style: TextStyle(color: Colors.white54, fontSize: 13))),
          ]),

          const SizedBox(height: 16),

          // AI Settings
          _buildSection('AI', [
            _buildTile(Icons.smart_toy_outlined, 'Model', trailing: const Text('GPT-4o Mini', style: TextStyle(color: Colors.white54, fontSize: 13))),
            _buildTile(Icons.psychology_outlined, 'Knowledge Graph', trailing: const Icon(Icons.chevron_right, color: Colors.white38)),
          ]),

          const SizedBox(height: 16),

          // About
          _buildSection('About', [
            _buildTile(Icons.info_outline, 'Version', trailing: const Text('1.0.0', style: TextStyle(color: Colors.white54, fontSize: 13))),
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

  Widget _buildTile(IconData icon, String title, {Widget? trailing}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFF27272A), width: 0.5)),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white54, size: 20),
          const SizedBox(width: 12),
          Expanded(child: Text(title, style: const TextStyle(color: Colors.white, fontSize: 15))),
          if (trailing != null) trailing,
        ],
      ),
    );
  }
}
