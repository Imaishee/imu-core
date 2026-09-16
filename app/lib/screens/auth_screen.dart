import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isLogin = true;
  bool _loading = false;
  bool _isDark = true;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _forgotEmailController = TextEditingController();
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) setState(() => _isDark = prefs.getBool('dark_mode') ?? true);
  }

  Color get _bg => _isDark ? const Color(0xFF09090B) : const Color(0xFFF8F9FA);
  Color get _cardBg => _isDark ? const Color(0xFF18181B) : Colors.white;
  Color get _borderColor => _isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB);
  Color get _textPrimary => _isDark ? Colors.white : const Color(0xFF18181B);
  Color get _textSecondary => _isDark ? Colors.white54 : const Color(0xFF71717A);
  Color get _accent => _isDark ? const Color(0xFFA78BFA) : const Color(0xFF7C3AED);

  Future<void> _submit() async {
    setState(() { _loading = true; _error = null; });
    try {
      final supabase = Supabase.instance.client;
      if (_isLogin) {
        final resp = await supabase.auth.signInWithPassword(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
        if (resp.user != null && mounted) {
          Navigator.pushReplacementNamed(context, '/home');
        }
      } else {
        final resp = await supabase.auth.signUp(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          data: {'full_name': _nameController.text.trim()},
        );
        if (resp.user != null && mounted) {
          if (resp.user!.emailConfirmedAt != null) {
            Navigator.pushReplacementNamed(context, '/home');
          } else {
            setState(() => _error = 'Check your email to confirm your account');
          }
        }
      }
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Something went wrong. Try again.');
    }
    if (mounted) setState(() => _loading = false);
  }

  void _showForgotPassword() {
    _forgotEmailController.text = _emailController.text.trim();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: _cardBg,
        title: Text('Reset Password', style: TextStyle(color: _textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Enter your email to receive a reset link.', style: TextStyle(color: _textSecondary, fontSize: 13)),
            const SizedBox(height: 12),
            TextField(
              controller: _forgotEmailController,
              decoration: InputDecoration(
                hintText: 'Email',
                hintStyle: TextStyle(color: _textSecondary),
                border: OutlineInputBorder(borderSide: BorderSide(color: _borderColor)),
                enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: _borderColor)),
              ),
              style: TextStyle(color: _textPrimary),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: TextStyle(color: _textSecondary))),
          TextButton(
            onPressed: () async {
              try {
                await Supabase.instance.client.auth.resetPasswordForEmail(
                  _forgotEmailController.text.trim(),
                );
                if (mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Reset link sent to your email'), backgroundColor: _accent),
                  );
                }
              } catch (e) {
                if (mounted) Navigator.pop(ctx);
              }
            },
            child: Text('Send Reset Link', style: TextStyle(color: _accent)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 72, height: 72,
                  decoration: BoxDecoration(
                    color: _accent,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Center(
                    child: Text('IM', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22)),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  _isLogin ? "Welcome Back" : "Create Account",
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: _textPrimary),
                ),
                const SizedBox(height: 6),
                Text(
                  _isLogin ? "Sign in to continue" : "Sign up to get started",
                  style: TextStyle(color: _textSecondary, fontSize: 15),
                ),
                const SizedBox(height: 40),

                if (!_isLogin) ...[
                  _buildInput(_nameController, 'Full Name', Icons.person_outline),
                  const SizedBox(height: 16),
                ],
                _buildInput(_emailController, 'Email', Icons.email_outlined),
                const SizedBox(height: 16),
                _buildInput(_passwordController, 'Password', Icons.lock_outline, obscure: true),
                const SizedBox(height: 8),

                if (_isLogin)
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: _showForgotPassword,
                      child: Text('Forgot Password?', style: TextStyle(color: _accent, fontSize: 13)),
                    ),
                  ),

                if (_error != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.withAlpha(20),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.withAlpha(50)),
                    ),
                    child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                  ),

                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity, height: 52,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _accent,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      disabledBackgroundColor: _accent.withAlpha(128),
                    ),
                    child: _loading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(_isLogin ? 'Sign In' : 'Sign Up', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                  ),
                ),
                const SizedBox(height: 24),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(_isLogin ? "Don't have an account? " : "Already have an account? ", style: TextStyle(color: _textSecondary, fontSize: 14)),
                    GestureDetector(
                      onTap: () => setState(() { _isLogin = !_isLogin; _error = null; }),
                      child: Text(_isLogin ? 'Sign Up' : 'Sign In', style: TextStyle(color: _accent, fontWeight: FontWeight.w600, fontSize: 14)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInput(TextEditingController ctrl, String hint, IconData icon, {bool obscure = false}) {
    return TextField(
      controller: ctrl,
      obscureText: obscure,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: _textSecondary),
        prefixIcon: Icon(icon, color: _textSecondary, size: 20),
        border: OutlineInputBorder(borderSide: BorderSide(color: _borderColor), borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: _borderColor), borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: _accent), borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      style: TextStyle(color: _textPrimary, fontSize: 14),
    );
  }
}
