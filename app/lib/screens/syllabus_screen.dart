import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/chat_provider.dart';
import '../theme/app_theme.dart';
import 'chat_screen.dart';

class SyllabusScreen extends ConsumerWidget {
  const SyllabusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.bg,
        title: Text('Regional Bharati Syllabus', style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Board of Secondary Education, Odisha', style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(height: 4),
                Text('Regional Bharati (RB) Curriculum — Classes I to X', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(height: 16),

          _sectionHeader('Primary (Classes I–V)'),
          ..._primary.map((s) => _syllabusTile(context, ref, s)),

          const SizedBox(height: 16),
          _sectionHeader('Upper Primary (Classes VI–VIII)'),
          ..._upperPrimary.map((s) => _syllabusTile(context, ref, s)),

          const SizedBox(height: 16),
          _sectionHeader('Secondary (Classes IX–X)'),
          ..._secondary.map((s) => _syllabusTile(context, ref, s)),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _sectionHeader(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.greenMedium, letterSpacing: 0.5)),
    );
  }

  Widget _syllabusTile(BuildContext context, WidgetRef ref, _SyllabusSubject s) {
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 8),
      onTap: () {
        final convo = ref.read(conversationsProvider.notifier).create();
        ref.read(activeConversationProvider.notifier).set(convo.remoteId);
        ref.read(conversationsProvider.notifier).updateTitle(convo.remoteId, 'Help with ${s.name}');
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => ChatScreen(
            conversationId: convo.remoteId,
            initialPrompt: 'I need help studying ${s.name} (${s.code}). Can you explain the key topics and help me prepare?',
          ),
        ));
      },
      child: Row(children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: s.color.withAlpha(30), borderRadius: BorderRadius.circular(10)),
          child: Icon(s.icon, color: s.color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s.name, style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textMain, fontSize: 14)),
            Text(s.code, style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
          ]),
        ),
        Icon(Icons.chevron_right, color: AppTheme.textMuted, size: 18),
      ]),
    );
  }
}

class _SyllabusSubject {
  final String name;
  final String code;
  final IconData icon;
  final Color color;
  const _SyllabusSubject(this.name, this.code, this.icon, this.color);
}

const _green = Color(0xFF2D6A4F);
const _teal = Color(0xFF40916C);
const _mint = Color(0xFF52B788);

final _primary = [
  _SyllabusSubject('Language I — Odia', 'RB-101', Icons.translate, _green),
  _SyllabusSubject('Language II — English', 'RB-102', Icons.abc, _teal),
  _SyllabusSubject('Mathematics', 'RB-103', Icons.calculate, _mint),
  _SyllabusSubject('Environmental Studies', 'RB-104', Icons.eco, _green),
];

final _upperPrimary = [
  _SyllabusSubject('Odia', 'RB-201', Icons.translate, _green),
  _SyllabusSubject('English', 'RB-202', Icons.abc, _teal),
  _SyllabusSubject('Mathematics', 'RB-203', Icons.calculate, _mint),
  _SyllabusSubject('Science', 'RB-204', Icons.science, _teal),
  _SyllabusSubject('Social Science', 'RB-205', Icons.public, _green),
  _SyllabusSubject('Hindi / Sanskrit', 'RB-206', Icons.language, _mint),
];

final _secondary = [
  _SyllabusSubject('Odia (First Language)', 'RB-301', Icons.translate, _green),
  _SyllabusSubject('English (Second Language)', 'RB-302', Icons.abc, _teal),
  _SyllabusSubject('Hindi / Sanskrit / Other', 'RB-303', Icons.language, _mint),
  _SyllabusSubject('Mathematics', 'RB-304', Icons.calculate, _green),
  _SyllabusSubject('Science', 'RB-305', Icons.science, _teal),
  _SyllabusSubject('Social Science', 'RB-306', Icons.public, _mint),
];
