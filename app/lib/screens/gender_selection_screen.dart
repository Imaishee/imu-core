import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';

/// Screen shown after signup to select companion gender.
/// Also accessible from Settings.
class GenderSelectionScreen extends StatefulWidget {
  final bool isFromSettings;
  const GenderSelectionScreen({super.key, this.isFromSettings = false});

  @override
  State<GenderSelectionScreen> createState() => _GenderSelectionScreenState();
}

class _GenderSelectionScreenState extends State<GenderSelectionScreen> {
  String? _selectedGender;
  bool _saving = false;

  Future<void> _save() async {
    if (_selectedGender == null) return;
    setState(() => _saving = true);

    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        await Supabase.instance.client
            .from('profiles')
            .upsert({'id': user.id, 'companion_gender': _selectedGender});
      }
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('companion_gender', _selectedGender!);
    } catch (e) {
      // Save locally even if Supabase fails
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('companion_gender', _selectedGender!);
    }

    if (mounted) {
      if (widget.isFromSettings) {
        Navigator.pop(context);
      } else {
        Navigator.pushReplacementNamed(context, '/chat');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Container(
                  width: 74,
                  height: 74,
                  decoration: BoxDecoration(borderRadius: BorderRadius.circular(22)),
                  clipBehavior: Clip.antiAlias,
                  child: Image.asset('assets/icon.png', fit: BoxFit.cover),
                ),
                const SizedBox(height: 28),

                Text(
                  'Who do you want as your companion?',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textMain,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Your AI companion will adapt their personality based on this choice.',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 36),

                // Girl option
                _GenderOption(
                  emoji: '👩',
                  title: 'Girl Companion',
                  subtitle: 'Sweet, playful, a little jealous 😒',
                  isSelected: _selectedGender == 'female',
                  onTap: () => setState(() => _selectedGender = 'female'),
                ),
                const SizedBox(height: 16),

                // Boy option
                _GenderOption(
                  emoji: '👨',
                  title: 'Boy Companion',
                  subtitle: 'Protective, flirty, secretly soft 🥹',
                  isSelected: _selectedGender == 'male',
                  onTap: () => setState(() => _selectedGender = 'male'),
                ),
                const SizedBox(height: 32),

                // Continue button
                SizedBox(
                  height: 52,
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _selectedGender == null || _saving ? null : _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.greenPrimary,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: AppColors.greenMedium.withOpacity(0.4),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: _saving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Text(
                            widget.isFromSettings ? 'Save' : 'Continue',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                          ),
                  ),
                ),

                if (widget.isFromSettings) ...[
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _GenderOption extends StatelessWidget {
  final String emoji;
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  const _GenderOption({
    required this.emoji,
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.greenPrimary.withOpacity(0.12)
              : AppTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.greenPrimary : AppTheme.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 36)),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textMain,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: AppColors.greenPrimary, size: 24)
            else
              Icon(Icons.radio_button_unchecked, color: AppTheme.textMuted, size: 24),
          ],
        ),
      ),
    );
  }
}
