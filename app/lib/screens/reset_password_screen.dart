import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String? accessToken;
  const ResetPasswordScreen({super.key, this.accessToken});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _loading = false;
  bool _success = false;
  String? _error;
  bool _obscure1 = true;
  bool _obscure2 = true;

  @override
  void initState() {
    super.initState();
    _recoverSession();
  }

  Future<void> _recoverSession() async {
    // If we have an access token from deep link, recover the session
    if (widget.accessToken != null && widget.accessToken!.isNotEmpty) {
      try {
        await Supabase.instance.client.auth.recoverSession(widget.accessToken!);
      } catch (_) {
        // Token might already be recovered or expired
      }
    }
  }

  @override
  void dispose() {
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _resetPassword() async {
    final pass = _passCtrl.text;
    final confirm = _confirmCtrl.text;

    if (pass.isEmpty) {
      setState(() => _error = 'Please enter a new password');
      return;
    }
    if (pass.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters');
      return;
    }
    if (pass != confirm) {
      setState(() => _error = 'Passwords do not match');
      return;
    }

    setState(() { _loading = true; _error = null; });

    try {
      await Supabase.instance.client.auth.updateUser(
        UserAttributes(password: pass),
      );
      if (mounted) setState(() => _success = true);
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
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
          onPressed: () => Navigator.pushReplacementNamed(context, '/auth'),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: _success ? _buildSuccess() : _buildForm(),
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
          child: Icon(Icons.lock_outline_rounded, size: 36, color: AppColors.greenPrimary),
        ),
        const SizedBox(height: 24),

        Text(
          'Set New Password',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textMain),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Choose a strong password for your account.',
          style: TextStyle(color: AppTheme.textMuted, fontSize: 14, height: 1.5),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),

        // New password field
        TextField(
          controller: _passCtrl,
          obscureText: _obscure1,
          style: TextStyle(color: AppTheme.textMain, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'New password',
            hintStyle: TextStyle(color: AppTheme.textMuted),
            prefixIcon: Icon(Icons.lock_outline, color: AppColors.greenMedium, size: 20),
            suffixIcon: IconButton(
              icon: Icon(_obscure1 ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppTheme.textMuted, size: 20),
              onPressed: () => setState(() => _obscure1 = !_obscure1),
            ),
            filled: true,
            fillColor: AppTheme.surface,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppColors.greenLight, width: 1.4)),
          ),
        ),
        const SizedBox(height: 14),

        // Confirm password field
        TextField(
          controller: _confirmCtrl,
          obscureText: _obscure2,
          style: TextStyle(color: AppTheme.textMain, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'Confirm password',
            hintStyle: TextStyle(color: AppTheme.textMuted),
            prefixIcon: Icon(Icons.lock_outline, color: AppColors.greenMedium, size: 20),
            suffixIcon: IconButton(
              icon: Icon(_obscure2 ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppTheme.textMuted, size: 20),
              onPressed: () => setState(() => _obscure2 = !_obscure2),
            ),
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

        // Reset button
        SizedBox(
          height: 52,
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _loading ? null : _resetPassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.greenPrimary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _loading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Reset Password', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          ),
        ),
        const SizedBox(height: 16),

        GestureDetector(
          onTap: () => Navigator.pushReplacementNamed(context, '/auth'),
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
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.greenLight.withOpacity(0.15),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.check_circle_rounded, size: 44, color: AppColors.greenPrimary),
        ),
        const SizedBox(height: 24),

        Text(
          'Password Reset!',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textMain),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Your password has been updated successfully. You can now sign in with your new password.',
          style: TextStyle(color: AppTheme.textMuted, fontSize: 14, height: 1.5),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),

        SizedBox(
          height: 52,
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => Navigator.pushReplacementNamed(context, '/auth'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.greenPrimary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text('Sign In', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}
