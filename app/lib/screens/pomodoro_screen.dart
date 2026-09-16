import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PomodoroScreen extends StatefulWidget {
  const PomodoroScreen({super.key});

  @override
  State<PomodoroScreen> createState() => _PomodoroScreenState();
}

class _PomodoroScreenState extends State<PomodoroScreen> {
  bool _isDark = true;
  bool _isRunning = false;
  bool _isBreak = false;
  int _workMinutes = 25;
  int _breakMinutes = 5;
  int _longBreakMinutes = 15;
  int _sessionsCompleted = 0;
  int _remainingSeconds = 25 * 60;
  Timer? _timer;

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

  void _toggleTimer() {
    if (_isRunning) {
      _timer?.cancel();
      setState(() => _isRunning = false);
    } else {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (_remainingSeconds > 0) {
          setState(() => _remainingSeconds--);
        } else {
          _timer?.cancel();
          _onSessionComplete();
        }
      });
      setState(() => _isRunning = true);
    }
  }

  void _onSessionComplete() {
    if (!_isBreak) {
      _sessionsCompleted++;
      setState(() {
        _isBreak = true;
        _remainingSeconds = (_sessionsCompleted % 4 == 0 ? _longBreakMinutes : _breakMinutes) * 60;
        _isRunning = false;
      });
    } else {
      setState(() {
        _isBreak = false;
        _remainingSeconds = _workMinutes * 60;
        _isRunning = false;
      });
    }
  }

  void _reset() {
    _timer?.cancel();
    setState(() {
      _isRunning = false;
      _isBreak = false;
      _remainingSeconds = _workMinutes * 60;
    });
  }

  String get _timeDisplay {
    final m = _remainingSeconds ~/ 60;
    final s = _remainingSeconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () => Navigator.pop(context),
          color: _textSecondary,
        ),
        title: Text('Pomodoro Timer', style: TextStyle(color: _textPrimary, fontWeight: FontWeight.w600, fontSize: 18)),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Session indicator
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: _isBreak ? Colors.green.withAlpha(20) : _accent.withAlpha(20),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: _isBreak ? Colors.green.withAlpha(50) : _accent.withAlpha(50)),
                ),
                child: Text(
                  _isBreak ? 'Break Time' : 'Focus Time',
                  style: TextStyle(
                    color: _isBreak ? Colors.green : _accent,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(height: 40),
              // Timer circle
              Container(
                width: 240,
                height: 240,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _cardBg,
                  border: Border.all(color: _borderColor, width: 4),
                ),
                child: Center(
                  child: Text(
                    _timeDisplay,
                    style: TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      color: _textPrimary,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 40),
              // Controls
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildButton(Icons.refresh, _reset, _textSecondary),
                  const SizedBox(width: 24),
                  _buildButton(
                    _isRunning ? Icons.pause : Icons.play_arrow,
                    _toggleTimer,
                    _accent,
                    isMain: true,
                  ),
                ],
              ),
              const SizedBox(height: 40),
              // Sessions completed
              Text(
                'Sessions completed: $_sessionsCompleted',
                style: TextStyle(color: _textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 24),
              // Settings
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _cardBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _borderColor),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildSetting('Focus', _workMinutes, (v) => setState(() { _workMinutes = v; if (!_isBreak && !_isRunning) _remainingSeconds = v * 60; })),
                    _buildSetting('Break', _breakMinutes, (v) => setState(() => _breakMinutes = v)),
                    _buildSetting('Long', _longBreakMinutes, (v) => setState(() => _longBreakMinutes = v)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildButton(IconData icon, VoidCallback onTap, Color color, {bool isMain = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: isMain ? 64 : 48,
        height: isMain ? 64 : 48,
        decoration: BoxDecoration(
          color: isMain ? color : color.withAlpha(20),
          borderRadius: BorderRadius.circular(isMain ? 32 : 24),
          border: isMain ? null : Border.all(color: color.withAlpha(50)),
        ),
        child: Icon(icon, color: isMain ? Colors.white : color, size: isMain ? 28 : 22),
      ),
    );
  }

  Widget _buildSetting(String label, int value, Function(int) onChanged) {
    return Column(
      children: [
        Text(label, style: TextStyle(color: _textSecondary, fontSize: 12)),
        const SizedBox(height: 4),
        Row(
          children: [
            GestureDetector(
              onTap: () => onChanged((value - 5).clamp(5, 60)),
              child: Container(
                width: 28, height: 28,
                decoration: BoxDecoration(color: _accent.withAlpha(20), borderRadius: BorderRadius.circular(8)),
                child: Icon(Icons.remove, color: _accent, size: 16),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text('${value}m', style: TextStyle(color: _textPrimary, fontWeight: FontWeight.w600, fontSize: 16)),
            ),
            GestureDetector(
              onTap: () => onChanged((value + 5).clamp(5, 60)),
              child: Container(
                width: 28, height: 28,
                decoration: BoxDecoration(color: _accent.withAlpha(20), borderRadius: BorderRadius.circular(8)),
                child: Icon(Icons.add, color: _accent, size: 16),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
