import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';
import 'forgot_password_screen.dart';
import 'otp_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isLogin = true;
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();

  Future<void> _submit() async {
    if (_emailCtrl.text.trim().isEmpty || _passCtrl.text.isEmpty) {
      setState(() => _error = 'Please fill in email and password');
      return;
    }
    if (!_isLogin && _nameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Please enter your name');
      return;
    }

    setState(() { _loading = true; _error = null; });
    try {
      final client = Supabase.instance.client;
      if (_isLogin) {
        final resp = await client.auth.signInWithPassword(
          email: _emailCtrl.text.trim(),
          password: _passCtrl.text,
        );
        if (resp.user != null && mounted) {
          Navigator.pushReplacementNamed(context, '/home');
        }
      } else {
        final resp = await client.auth.signUp(
          email: _emailCtrl.text.trim(),
          password: _passCtrl.text,
          emailRedirectTo: 'https://imu-admin-panel.vercel.app/verify',
          data: {
            'full_name': _nameCtrl.text.trim(),
          },
        );
        if (resp.user != null && mounted) {
          // Send a verification OTP and show the OTP entry screen.
          Navigator.push(context, MaterialPageRoute(
            builder: (_) => OtpScreen(
              email: _emailCtrl.text.trim(),
              flow: OtpFlow.signup,
            ),
          ));
        }
      }
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Something went wrong. Please try again.');
    }
    if (mounted) setState(() => _loading = false);
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
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 20),
                Container(
                  width: 74,
                  height: 74,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(22),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Image.asset('assets/icon.png', fit: BoxFit.cover),
                ),
                const SizedBox(height: 20),
                Text(
                  _isLogin ? 'Welcome back' : 'Create account',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                Text(
                  _isLogin ? 'Sign in to continue' : "Let's set up your profile",
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 15),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                if (!_isLogin) ...[
                  const SizedBox(height: 14),
                  _field(_nameCtrl, 'Full Name', Icons.person_outline),
                ],

                const SizedBox(height: 14),
                _field(_emailCtrl, 'Email', Icons.email_outlined, keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 14),
                _field(_passCtrl, 'Password', Icons.lock_outline, obscure: _obscure),

                if (_isLogin)
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => _showForgotPassword(),
                      child: Text('Forgot Password?', style: TextStyle(color: AppColors.greenLight, fontSize: 13)),
                    ),
                  ),

                if (_error != null)
                  Container(
                    margin: const EdgeInsets.only(top: 14),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Text(_error!, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
                  ),

                const SizedBox(height: 24),
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.greenPrimary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: _loading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(_isLogin ? 'Sign In' : 'Create Account', style: const TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),

                const SizedBox(height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(_isLogin ? "Don't have an account? " : 'Already have an account? ', style: TextStyle(color: AppTheme.textMuted)),
                    GestureDetector(
                      onTap: () => setState(() { _isLogin = !_isLogin; _error = null; }),
                      child: Text(_isLogin ? 'Sign Up' : 'Sign In', style: TextStyle(color: AppColors.greenPrimary, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String hint, IconData icon, {int maxLines = 1, bool obscure = false, TextInputType keyboardType = TextInputType.text}) {
    return TextField(
      controller: ctrl,
      obscureText: obscure,
      maxLines: obscure ? 1 : maxLines,
      keyboardType: keyboardType,
      style: TextStyle(color: AppTheme.textMain, fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: AppTheme.textMuted),
        prefixIcon: Icon(icon, color: AppColors.greenMedium, size: 20),
        suffixIcon: obscure == _obscure && ctrl == _passCtrl
            ? IconButton(icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppTheme.textMuted), onPressed: () => setState(() => _obscure = !_obscure))
            : null,
        filled: true,
        fillColor: AppTheme.surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppTheme.border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppColors.greenLight, width: 1.4)),
      ),
    );
  }

  void _showForgotPassword() {
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => const ForgotPasswordScreen(),
    ));
  }
}