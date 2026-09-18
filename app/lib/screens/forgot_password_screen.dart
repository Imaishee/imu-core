import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'otp_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _loading = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendResetLink() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Please enter a valid email');
      return;
    }

    setState(() { _loading = true; _error = null; });

    try {
      // Navigate to the OTP screen which sends the code and collects a new
      // password — no broken redirect needed.
      await Future.delayed(const Duration(milliseconds: 300));
      if (mounted) {
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => OtpScreen(email: email, flow: OtpFlow.recovery),
        ));
      }
    } catch (e) {
      print('[ForgotPassword] Send reset link error: $e');
      setState(() => _error = 'Something went wrong. Please try again.');
    }

    if (mounted) setState(() => _loading = false);
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
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: _sent ? _buildSuccess() : _buildForm(),
          ),
        ),
      ),
    );
  }

  Widget _buildForm() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Icon
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: AppColors.greenPrimary.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.lock_reset_rounded, size: 36, color: AppColors.greenPrimary),
        ),
        const SizedBox(height: 24),

        Text(
          'Forgot Password?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textMain),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          "No worries! Enter your email and we'll send you a reset link.",
          style: TextStyle(color: AppTheme.textMuted, fontSize: 14, height: 1.5),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),

        // Email field
        TextField(
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
          style: TextStyle(color: AppTheme.textMain, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'your@email.com',
            hintStyle: TextStyle(color: AppTheme.textMuted),
            prefixIcon: Icon(Icons.email_outlined, color: AppColors.greenMedium, size: 20),
            filled: true,
            fillColor: AppTheme.surface,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppColors.greenLight, width: 1.4)),
          ),
        ),

        if (_error != null)
          Container(
            margin: const EdgeInsets.only(top: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.red.shade200),
            ),
            child: Text(_error!, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
          ),

        const SizedBox(height: 24),

        // Send button
        SizedBox(
          height: 52,
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _loading ? null : _sendResetLink,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.greenPrimary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _loading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Send Reset Link', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          ),
        ),

        const SizedBox(height: 16),

        // Back to login
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Text(
            'Back to Sign In',
            style: TextStyle(color: AppColors.greenPrimary, fontWeight: FontWeight.w600, fontSize: 14),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildSuccess() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Success icon
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.greenLight.withOpacity(0.15),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.mark_email_read_rounded, size: 40, color: AppColors.greenPrimary),
        ),
        const SizedBox(height: 24),

        Text(
          'Check Your Email',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textMain),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'We sent a password reset link to',
          style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          _emailCtrl.text.trim(),
          style: TextStyle(color: AppColors.greenPrimary, fontWeight: FontWeight.w600, fontSize: 14),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Tap the link in the email to reset your password. If you don\'t see it, check your spam folder.',
          style: TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.5),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),

        // Open email app button
        SizedBox(
          height: 52,
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () {
              // Try to open email app
              // On Android this opens the default email app
              // On iOS this opens Mail app
            },
            icon: Icon(Icons.open_in_new, color: AppColors.greenPrimary, size: 18),
            label: Text('Open Email App', style: TextStyle(color: AppColors.greenPrimary, fontWeight: FontWeight.w600)),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: AppColors.greenPrimary),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Resend button
        TextButton(
          onPressed: () async {
            setState(() { _sent = false; _loading = false; });
            await _sendResetLink();
          },
          child: Text("Didn't receive it? Resend", style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
        ),

        const SizedBox(height: 8),

        // Back to login
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Text(
            'Back to Sign In',
            style: TextStyle(color: AppColors.greenPrimary, fontWeight: FontWeight.w600, fontSize: 14),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}
