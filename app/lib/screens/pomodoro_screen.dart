import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PomodoroScreen extends StatefulWidget {
  const PomodoroScreen({super.key});

  @override
  State<PomodoroScreen> createState() => _PomodoroScreenState();
}

class _PomodoroScreenState extends State<PomodoroScreen> with WidgetsBindingObserver {
  bool _isDark = true;
  bool _isRunning = false;
  bool _isBreak = false;
  int _workMinutes = 25;
  int _breakMinutes = 5;
  int _longBreakMinutes = 15;
  int _sessionsCompleted = 0;
  int _remainingSeconds = 25 * 60;
  Timer? _timer;
  DateTime? _pauseTime; // Track when timer was paused by app backgrounding

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadTheme();
    _loadTimerState();
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) setState(() => _isDark = prefs.getBool('dark_mode') ?? true);
  }

  Future<void> _loadTimerState() async {
    final prefs = await SharedPreferences.getInstance();
    _workMinutes = prefs.getInt('pomodoro_work') ?? 25;
    _breakMinutes = prefs.getInt('pomodoro_break') ?? 5;
    _longBreakMinutes = prefs.getInt('pomodoro_long_break') ?? 15;
    _sessionsCompleted = prefs.getInt('pomodoro_sessions') ?? 0;
    _isBreak = prefs.getBool('pomodoro_is_break') ?? false;
    _remainingSeconds = prefs.getInt('pomodoro_remaining') ?? _workMinutes * 60;
    // If the timer was running when the app was killed, check elapsed time
    final wasRunning = prefs.getBool('pomodoro_running') ?? false;
    final savedTimestamp = prefs.getString('pomodoro_timestamp');
    if (wasRunning && savedTimestamp != null) {
      final elapsed = DateTime.now().difference(DateTime.parse(savedTimestamp)).inSeconds;
      _remainingSeconds = (_remainingSeconds - elapsed).clamp(0, _remainingSeconds);
      if (_remainingSeconds == 0) {
        _onSessionComplete();
      } else {
        _isRunning = true;
        _startTimer();
      }
    }
    if (mounted) setState(() {});
  }

  Future<void> _saveTimerState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('pomodoro_work', _workMinutes);
    await prefs.setInt('pomodoro_break', _breakMinutes);
    await prefs.setInt('pomodoro_long_break', _longBreakMinutes);
    await prefs.setInt('pomodoro_sessions', _sessionsCompleted);
    await prefs.setBool('pomodoro_is_break', _isBreak);
    await prefs.setInt('pomodoro_remaining', _remainingSeconds);
    await prefs.setBool('pomodoro_running', _isRunning);
    if (_isRunning) {
      await prefs.setString('pomodoro_timestamp', DateTime.now().toIso8601String());
    } else {
      await prefs.remove('pomodoro_timestamp');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      // App going to background — cancel timer but save state
      _pauseTime = DateTime.now();
      _timer?.cancel();
      _saveTimerState();
    } else if (state == AppLifecycleState.resumed) {
      // App coming back — recalculate remaining time based on elapsed pause
      if (_isRunning && _pauseTime != null) {
        final elapsed = DateTime.now().difference(_pauseTime!).inSeconds;
        _remainingSeconds = (_remainingSeconds - elapsed).clamp(0, _remainingSeconds);
        _pauseTime = null;
        if (_remainingSeconds == 0) {
          _onSessionComplete();
        } else {
          _startTimer();
        }
      }
      _saveTimerState();
    }
  }

  Color get _bg => _isDark ? const Color(0xFF09090B) : const Color(0xFFF8F9FA);
  Color get _cardBg => _isDark ? const Color(0xFF18181B) : Colors.white;
  Color get _borderColor => _isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB);
  Color get _textPrimary => _isDark ? Colors.white : const Color(0xFF18181B);
  Color get _textSecondary => _isDark ? Colors.white54 : const Color(0xFF71717A);
  Color get _accent => _isDark ? const Color(0xFFA78BFA) : const Color(0xFF7C3AED);

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_remainingSeconds > 0) {
        setState(() => _remainingSeconds--);
      } else {
        _timer?.cancel();
        _onSessionComplete();
      }
    });
  }

  void _toggleTimer() {
    if (_isRunning) {
      _timer?.cancel();
      setState(() => _isRunning = false);
    } else {
      _startTimer();
      setState(() => _isRunning = true);
    }
    _saveTimerState();
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
    _saveTimerState();
  }

  void _reset() {
    _timer?.cancel();
    setState(() {
      _isRunning = false;
      _isBreak = false;
      _remainingSeconds = _workMinutes * 60;
    });
    _saveTimerState();
  }

  String get _timeDisplay {
    final m = _remainingSeconds ~/ 60;
    final s = _remainingSeconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    _saveTimerState();
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
