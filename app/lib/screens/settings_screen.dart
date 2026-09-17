import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/app_constants.dart';
import '../services/permission_service.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  final VoidCallback? onToggleTheme;
  const SettingsScreen({super.key, this.onToggleTheme});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isDark = false;
  bool _saving = false;
  bool _checkingUpdate = false;
  bool _notifEnabled = true;
  int _beforeMin = 10;

  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _universityCtrl = TextEditingController();
  final _programmeCtrl = TextEditingController();
  final _majorCtrl = TextEditingController();
  final _minorCtrl = TextEditingController();
  int _year = 1;
  int _semester = 1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final profile = await _loadProfile();
    if (profile != null) {
      _nameCtrl.text = profile['name'] ?? '';
      _emailCtrl.text = profile['email'] ?? Supabase.instance.client.auth.currentUser?.email ?? '';
      _universityCtrl.text = profile['university'] ?? '';
      _programmeCtrl.text = profile['programme'] ?? '';
      _majorCtrl.text = profile['major'] ?? '';
      _minorCtrl.text = profile['minor'] ?? '';
      _year = (profile['year'] as num?)?.toInt() ?? 1;
      _semester = (profile['semester'] as num?)?.toInt() ?? 1;
      _isDark = prefs.getBool('dark_mode') ?? false;
      _notifEnabled = prefs.getBool('notif_enabled') ?? true;
      _beforeMin = prefs.getInt('notif_before_min') ?? 10;
      setState(() {});
    }
  }

  Future<Map<String, dynamic>?> _loadProfile() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return null;
      return await Supabase.instance.client.from('profiles').select().eq('id', user.id).maybeSingle();
    } catch (_) {
      return null;
    }
  }

  Future<void> _saveProfile() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    setState(() => _saving = true);
    try {
      await Supabase.instance.client.from('profiles').update({
        'name': _nameCtrl.text.trim(),
        'university': _universityCtrl.text.trim(),
        'programme': _programmeCtrl.text.trim(),
        'year': _year,
        'semester': _semester,
        'major': _majorCtrl.text.trim(),
        'minor': _minorCtrl.text.trim(),
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', user.id);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Profile saved'), backgroundColor: AppColors.greenPrimary));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not save: $e'), backgroundColor: Colors.red));
    }
    if (mounted) setState(() => _saving = false);
  }

  Future<void> _checkUpdate() async {
    setState(() => _checkingUpdate = true);
    try {
      final resp = await Supabase.instance.client.functions.invoke(
        'check-update',
        body: {'version': AppConstants.appVersion},
      );
      final data = resp.data;
      final latest = data['latest_version'] as String?;
      final hasUpdate = latest != null && latest != AppConstants.appVersion;
      if (mounted) {
        if (hasUpdate) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('Update available: v$latest'),
            backgroundColor: AppColors.greenPrimary,
            behavior: SnackBarBehavior.floating,
          ));
          final url = data['download_url'] as String?;
          if (url != null && url.isNotEmpty) {
            await launchUrl(Uri.parse(url));
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('You are up to date!')));
        }
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not check updates')));
    }
    if (mounted) setState(() => _checkingUpdate = false);
  }

  Future<void> _signOut() async {
    await Supabase.instance.client.auth.signOut();
    if (mounted) Navigator.pushReplacementNamed(context, '/auth');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.bg,
        title: Text('Settings', style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w700)),
        actions: [
          IconButton(onPressed: _signOut, icon: Icon(Icons.logout, color: AppTheme.textMuted)),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          children: [
            // ── Profile card
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: AppColors.greenMint,
                      child: Text(_nameCtrl.text.isNotEmpty ? _nameCtrl.text[0].toUpperCase() : 'U',
                          style: const TextStyle(color: AppColors.greenPrimary, fontWeight: FontWeight.w700, fontSize: 20)),
                    ),
                    const SizedBox(width: 12),
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(_nameCtrl.text.isNotEmpty ? _nameCtrl.text : 'Set your name',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textMain)),
                      Text(Supabase.instance.client.auth.currentUser?.email ?? '', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    ]),
                  ]),
                  const SizedBox(height: 16),
                  _profileField('Full Name', _nameCtrl, Icons.person),
                  const SizedBox(height: 10),
                  _profileField('Email', _emailCtrl, Icons.email, readOnly: true),
                  const SizedBox(height: 10),
                  _profileField('University', _universityCtrl, Icons.school),
                  const SizedBox(height: 10),
                  Row(children: [
                    Expanded(child: _profileField('Programme', _programmeCtrl, Icons.class_)),
                    const SizedBox(width: 10),
                    Expanded(child: _dropdown('Year', _year, [1, 2, 3, 4], (v) => setState(() => _year = v!))),
                  ]),
                  const SizedBox(height: 10),
                  Row(children: [
                    Expanded(child: _profileField('Major', _majorCtrl, Icons.menu_book)),
                    const SizedBox(width: 10),
                    Expanded(child: _profileField('Minor', _minorCtrl, Icons.more_horiz)),
                  ]),
                  const SizedBox(height: 10),
                  Row(children: [
                    Expanded(child: _dropdown('Semester', _semester, [1, 2, 3, 4, 5, 6], (v) => setState(() => _semester = v!))),
                    const Expanded(child: SizedBox()),
                  ]),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _saveProfile,
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.greenPrimary, foregroundColor: Colors.white),
                      child: _saving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save Profile'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ── Appearance
            _section('Appearance'),
            GlassCard(
              margin: const EdgeInsets.only(top: 14),
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  SwitchListTile(
                    value: _isDark,
                    onChanged: (v) {
                      widget.onToggleTheme?.call();
                      setState(() => _isDark = v);
                    },
                    title: Text('Dark Mode', style: TextStyle(color: AppTheme.textMain)),
                    subtitle: Text('Toggle between light & dark', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  ),
                  Divider(color: AppTheme.border),
                  SwitchListTile(
                    value: _notifEnabled,
                    onChanged: (v) => setState(() => _notifEnabled = v),
                    title: Text('Notifications', style: TextStyle(color: AppTheme.textMain)),
                    subtitle: Text('Class reminders & updates', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  ),
                ],
              ),
            ),

            // ── Timetable settings
            _section('Schedule'),
            GlassCard(
              onTap: () => Navigator.pushNamed(context, '/timetable'),
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
              child: Row(children: [
                Icon(Icons.edit_calendar, color: AppColors.greenMedium),
                const SizedBox(width: 14),
                Expanded(child: Text('Edit Timetable', style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w500))),
                Icon(Icons.chevron_right, color: AppTheme.textMuted),
              ]),
            ),

            // ── Reminder options
            _section('Notifications'),
            GlassCard(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(children: [
                      Icon(Icons.notifications_active_outlined, color: AppColors.greenMedium,size:20),
                      const SizedBox(width: 12),
                      Text('Notify before class', style: TextStyle(color: AppTheme.textMain)),
                      const Spacer(),
                      DropdownButton<int>(
                        value: _beforeMin,
                        dropdownColor: AppTheme.surface,
                        underline: const SizedBox(),
                        items: const [5, 10, 15, 20, 30].map((v) => DropdownMenuItem(value: v, child: Text('$v min'))).toList(),
                        onChanged: (v) => setState(() => _beforeMin = v!),
                      ),
                    ]),
                  ),
                  Divider(color: AppTheme.border, height: 1),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(children: [
                      Icon(Icons.info_outline, color: AppTheme.textMuted, size: 16),
                      const SizedBox(width: 8),
                      Expanded(child: Text('Set how early you get reminded before each class in your timetable.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12))),
                    ]),
                  ),
                ],
              ),
            ),

            // ── Permissions
            _section('Permissions &#x26; About'),
            GlassCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  ListTile(
                    leading: Icon(Icons.lock_open, color: AppColors.greenMedium),
                    title: Text('App Permissions', style: TextStyle(color: AppTheme.textMain)),
                    subtitle: Text('Notifications, location, alarms', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  ),
                  Divider(color: AppTheme.border, height: 1),
                  ListTile(
                    leading: Icon(Icons.system_update_alt, color: AppColors.greenMedium),
                    title: Text('Check for Updates', style: TextStyle(color: AppTheme.textMain)),
                    subtitle: Text('Current: v${AppConstants.appVersion}', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    trailing: Row(children: [
                      _checkingUpdate
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.chevron_right),
                      const SizedBox(width: 4),
                    ]),
                    onTap: _checkingUpdate ? null : _checkUpdate,
                  ),
                ],
              ),
            ),

            // ── Legal
            const SizedBox(height: 14),
            GlassCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  ListTile(
                    leading: Icon(Icons.privacy_tip_outlined, color: AppColors.greenMedium),
                    title: Text('Privacy Policy', style: TextStyle(color: AppTheme.textMain)),
                    trailing: const Icon(Icons.open_in_new, size: 16),
                    onTap: () => _openUrl('https://imu-admin.vercel.app/privacy'),
                  ),
                  Divider(color: AppTheme.border, height: 1),
                  ListTile(
                    leading: Icon(Icons.description_outlined, color: AppColors.greenMedium),
                    title: Text('Terms of Service', style: TextStyle(color: AppTheme.textMain)),
                    trailing: const Icon(Icons.open_in_new, size: 16),
                    onTap: () => _openUrl('https://imu-admin.vercel.app/terms'),
                  ),
                ],
              ),
            ),

            // ── About
            GlassCard(
              margin: EdgeInsets.zero,
              padding: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Container(
                      width: 60, height: 60,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [AppColors.greenPrimary, AppColors.greenLight], begin: Alignment.topLeft, end: Alignment.bottomRight),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Center(child: Text('IM', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18))),
                    ),
                    const SizedBox(height: 14),
                    Text('IM\'U', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.textMain)),
                    Text('Your AI study companion', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: AppColors.greenMint.withAlpha(40), borderRadius: BorderRadius.circular(14)),
                      child: Text(
                        'IM\'U helps you study smarter with a caring AI partner who knows your schedule, your courses, and always has your back.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppTheme.textMuted, fontSize: 12, fontStyle: FontStyle.italic),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('Made with ❤️ by', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text('SHUBHAM MALLICK', style: TextStyle(color: AppColors.greenPrimary, fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 0.8)),
                    const SizedBox(height: 4),
                    Text('IM\'U v${AppConstants.appVersion}', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _profileField(String label, TextEditingController ctrl, IconData icon, {bool readOnly = false}) {
    return TextField(
      controller: ctrl,
      readOnly: readOnly,
      style: TextStyle(color: AppTheme.textMain, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        hintText: 'Enter $label',
        prefixIcon: Icon(icon, color: AppColors.greenMedium, size: 18),
        labelStyle: TextStyle(color: AppColors.greenMedium),
        hintStyle: TextStyle(color: AppTheme.textMuted),
        filled: true,
        fillColor: AppTheme.surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.greenLight, width: 1.4)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),
    );
  }

  Widget _dropdown(String label, int value, List<int> options, Function(int?) onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: value,
          isExpanded: true,
          dropdownColor: AppTheme.surface,
          style: TextStyle(color: AppTheme.textMain, fontSize: 13),
          icon: Icon(Icons.keyboard_arrow_down, color: AppTheme.textMuted, size: 18),
          items: options.map((o) => DropdownMenuItem(value: o, child: Text('$label $o'))).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _section(String label) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 8, left: 4),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.greenMedium, letterSpacing: 0.6)),
    );
  }

  void _openUrl(String url) async {
    try {
      await launchUrl(Uri.parse(url));
    } catch (_) {}
  }
}