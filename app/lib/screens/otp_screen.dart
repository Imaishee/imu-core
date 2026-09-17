import 'dart:async';
import 'package:flutter/material.dart';
import '../services/otp_service.dart';
import '../theme/app_theme.dart';

enum OtpFlow { signup, recovery }

/// Handles OTP entry for both account verification (signup) and password
/// reset (recovery). For recovery, also collects the new password.
class OtpScreen extends StatefulWidget {
  final String email;
  final OtpFlow flow;
  const OtpScreen({super.key, required this.email, required this.flow});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _codeCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _loading = false;
  bool _sending = false;
  bool _done = false;
  String? _error;
  int _cooldown = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _sendOtp();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _codeCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    setState(() { _sending = true; _error = null; });
    try {
      await OtpService.send(
        email: widget.email,
        purpose: widget.flow == OtpFlow.recovery ? 'recovery' : 'signup',
      );
      if (mounted) setState(() => _sending = false);
      _startCooldown();
    } catch (e) {
      if (mounted) setState(() { _sending = false; _error = '$e'; });
    }
  }

  void _startCooldown() {
    _timer?.cancel();
    setState(() => _cooldown = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (_cooldown <= 1) {
        _timer?.cancel();
        setState(() => _cooldown = 0);
      } else {
        setState(() => _cooldown--);
      }
    });
  }

  Future<void> _submit() async {
    final code = _codeCtrl.text.trim();
    if (code.length != 6) {
      setState(() => _error = 'Enter the 6-digit code');
      return;
    }

    setState(() { _loading = true; _error = null; });

    try {
      if (widget.flow == OtpFlow.recovery) {
        final pass = _passCtrl.text;
        final confirm = _confirmCtrl.text;
        if (pass.isEmpty || pass.length < 6) {
          setState(() { _loading = false; _error = 'Enter a password of at least 6 characters'; });
          return;
        }
        if (pass != confirm) {
          setState(() { _loading = false; _error = 'Passwords do not match'; });
          return;
        }
        await OtpService.resetPassword(
          email: widget.email, code: code, newPassword: pass,
        );
      } else {
        await OtpService.verify(email: widget.email, code: code, purpose: 'signup');
      }
      if (mounted) setState(() => _done = true);
    } on Exception catch (e) {
      if (mounted) setState(() => _error = '$e');
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
            child: _done ? _buildDone() : _buildForm(),
          ),
        ),
      ),
    );
  }

  Widget _buildForm() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 80, height: 80,
          decoration: BoxDecoration(
            color: AppColors.greenPrimary.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: _sending
              ? const Padding(padding: EdgeInsets.all(22), child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.greenPrimary))
              : Icon(widget.flow == OtpFlow.recovery ? Icons.lock_reset_rounded : Icons.mark_email_read_rounded, size: 40, color: AppColors.greenPrimary),
        ),
        const SizedBox(height: 24),
        Text(
          widget.flow == OtpFlow.recovery ? 'Reset Password' : 'Verify Your Email',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textMain),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'We sent a 6-digit code to\n${widget.email}',
          style: TextStyle(color: AppTheme.textMuted, fontSize: 14, height: 1.5),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.greenPrimary.withOpacity(0.06),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.greenPrimary.withOpacity(0.15)),
          ),
          child: Text(
            'Please check your spam/junk folder as well.',
            style: TextStyle(color: AppColors.greenMedium, fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 24),

        // OTP input
        TextField(
          controller: _codeCtrl,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: TextStyle(color: AppTheme.textMain, fontSize: 26, fontWeight: FontWeight.bold, letterSpacing: 12),
          decoration: InputDecoration(
            counterText: '',
            hintText: '------',
            hintStyle: TextStyle(color: AppTheme.textMuted, letterSpacing: 12),
            filled: true,
            fillColor: AppTheme.surface,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppColors.greenLight, width: 1.5)),
          ),
        ),

        if (widget.flow == OtpFlow.recovery) ...[
          const SizedBox(height: 14),
          TextField(
            controller: _passCtrl,
            obscureText: true,
            style: TextStyle(color: AppTheme.textMain, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'New password',
              hintStyle: TextStyle(color: AppTheme.textMuted),
              prefixIcon: Icon(Icons.lock_outline, color: AppColors.greenMedium, size: 20),
              filled: true, fillColor: AppTheme.surface,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.border)),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _confirmCtrl,
            obscureText: true,
            style: TextStyle(color: AppTheme.textMain, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Confirm new password',
              hintStyle: TextStyle(color: AppTheme.textMuted),
              prefixIcon: Icon(Icons.lock_outline, color: AppColors.greenMedium, size: 20),
              filled: true, fillColor: AppTheme.surface,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.border)),
            ),
          ),
        ],

        if (_error != null)
          Container(
            margin: const EdgeInsets.only(top: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.red.shade200)),
            child: Text(_error!, style: TextStyle(color: Colors.red.shade700, fontSize: 13), textAlign: TextAlign.center),
          ),

        const SizedBox(height: 24),

        SizedBox(
          height: 52, width: double.infinity,
          child: ElevatedButton(
            onPressed: _loading ? null : _submit,
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.greenPrimary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
            child: _loading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(widget.flow == OtpFlow.recovery ? 'Reset Password' : 'Verify & Continue', style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 14),

        TextButton(
          onPressed: (_cooldown > 0 || _sending) ? null : _sendOtp,
          child: Text(
            _sending ? 'Sending…' : _cooldown > 0 ? 'Resend in ${_cooldown}s' : 'Resend code',
            style: TextStyle(color: _cooldown > 0 ? AppTheme.textMuted : AppColors.greenLight),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildDone() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 80, height: 80,
          decoration: BoxDecoration(color: AppColors.greenLight.withOpacity(0.15), shape: BoxShape.circle),
          child: Icon(widget.flow == OtpFlow.recovery ? Icons.check_circle_rounded : Icons.verified_rounded, size: 44, color: AppColors.greenPrimary),
        ),
        const SizedBox(height: 24),
        Text(
          widget.flow == OtpFlow.recovery ? 'Password Reset!' : 'Email Verified!',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textMain),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          widget.flow == OtpFlow.recovery
              ? 'Your password has been updated. You can now sign in.'
              : 'Your account is verified. You can now sign in.',
          style: TextStyle(color: AppTheme.textMuted, fontSize: 14, height: 1.5),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        SizedBox(
          height: 52, width: double.infinity,
          child: ElevatedButton(
            onPressed: () => Navigator.pushReplacementNamed(context, '/auth'),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.greenPrimary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
            child: const Text('Go to Sign In', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}