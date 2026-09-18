import 'dart:async';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';

class VerificationScreen extends StatefulWidget {
  final String email;
  const VerificationScreen({super.key, required this.email});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  bool _resending = false;
  int _cooldown = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  // Poll auth state — if user confirms email, auto-navigate to home
  void _startPolling() {
    _timer = Timer.periodic(const Duration(seconds: 3), (_) async {
      try {
        // getUser() actually hits the server and refreshes the session,
        // unlike currentSession which only reads the cached local state.
        final response = await Supabase.instance.client.auth.getUser();
        final user = response.user;
        if (user != null && user.emailConfirmedAt != null && mounted) {
          _timer?.cancel();
          Navigator.pushReplacementNamed(context, '/home');
        }
      } catch (e) {
        print('[Verification] Polling error: $e');
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _resendEmail() async {
    setState(() { _resending = true; _cooldown = 60; });

    try {
      await Supabase.instance.client.auth.resend(
        type: OtpType.signup,
        email: widget.email,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Verification email sent!'),
            backgroundColor: AppColors.greenPrimary,
          ),
        );
      }
    } catch (e) {
      print('[Verification] Resend email error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to resend. Try again later.'),
            backgroundColor: Colors.red.shade600,
          ),
        );
      }
    }

    // Start cooldown
    while (_cooldown > 0 && mounted) {
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) setState(() => _cooldown--);
    }

    if (mounted) setState(() => _resending = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: AppTheme.textMain, size: 20),
          onPressed: () => Navigator.pushReplacementNamed(context, '/auth'),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Email icon with animation
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: AppColors.greenPrimary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Icon(Icons.mark_email_unread_rounded, size: 44, color: AppColors.greenPrimary),
                      Positioned(
                        top: 2,
                        right: 2,
                        child: Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            color: AppColors.greenLight,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.bg, width: 2),
                          ),
                          child: const Icon(Icons.close, size: 10, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                Text(
                  'Verify Your Email',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  "We've sent a verification link to",
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  widget.email,
                  style: TextStyle(color: AppColors.greenPrimary, fontWeight: FontWeight.w600, fontSize: 14),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),

                // Instructions card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.greenPrimary.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.greenPrimary.withOpacity(0.15)),
                  ),
                  child: Column(
                    children: [
                      _instructionStep(1, 'Open your email inbox'),
                      const SizedBox(height: 8),
                      _instructionStep(2, 'Find the email from I\'MU'),
                      const SizedBox(height: 8),
                      _instructionStep(3, 'Tap the verification link'),
                      const SizedBox(height: 8),
                      _instructionStep(4, 'You\'ll be redirected back here'),
                    ],
                  ),
                ),
                const SizedBox(height: 8),

                Text(
                  'This page will auto-detect once you verify.',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 12, fontStyle: FontStyle.italic),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),

                // Resend button
                SizedBox(
                  height: 52,
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: (_resending || _cooldown > 0) ? null : _resendEmail,
                    icon: Icon(
                      Icons.email_outlined,
                      color: (_resending || _cooldown > 0) ? AppTheme.textMuted : AppColors.greenPrimary,
                      size: 18,
                    ),
                    label: Text(
                      _cooldown > 0
                          ? 'Resend in ${_cooldown}s'
                          : _resending
                              ? 'Sending...'
                              : 'Resend Verification Email',
                      style: TextStyle(
                        color: (_resending || _cooldown > 0) ? AppTheme.textMuted : AppColors.greenPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                        color: (_resending || _cooldown > 0) ? AppTheme.border : AppColors.greenPrimary,
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Open email app
                TextButton.icon(
                  onPressed: () {
                    // Opens default email app
                  },
                  icon: Icon(Icons.open_in_new, color: AppTheme.textMuted, size: 16),
                  label: Text('Open Email App', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                ),
                const SizedBox(height: 12),

                // Back to login
                GestureDetector(
                  onTap: () => Navigator.pushReplacementNamed(context, '/auth'),
                  child: Text(
                    'Back to Sign In',
                    style: TextStyle(color: AppColors.greenPrimary, fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _instructionStep(int num, String text) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: AppColors.greenPrimary,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text('$num', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(width: 10),
        Text(text, style: TextStyle(color: AppTheme.textMain, fontSize: 13)),
      ],
    );
  }
}
