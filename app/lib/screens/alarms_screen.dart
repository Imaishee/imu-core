import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AlarmsScreen extends StatefulWidget {
  const AlarmsScreen({super.key});

  @override
  State<AlarmsScreen> createState() => _AlarmsScreenState();
}

class _AlarmsScreenState extends State<AlarmsScreen> {
  List<Map<String, dynamic>> _alarms = [];
  bool _isDark = true;

  @override
  void initState() {
    super.initState();
    _loadTheme();
    _loadAlarms();
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) setState(() => _isDark = prefs.getBool('dark_mode') ?? true);
  }

  Future<void> _loadAlarms() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('imu_alarms');
    if (data != null && data.isNotEmpty) {
      final list = List<Map<String, dynamic>>.from(
        (jsonDecode(data) as List).map((e) => Map<String, dynamic>.from(e)),
      );
      if (mounted) setState(() => _alarms = list);
    }
  }

  Future<void> _saveAlarms() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('imu_alarms', jsonEncode(_alarms));
  }

  Color get _bg => _isDark ? const Color(0xFF09090B) : const Color(0xFFF8F9FA);
  Color get _cardBg => _isDark ? const Color(0xFF18181B) : Colors.white;
  Color get _borderColor => _isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB);
  Color get _textPrimary => _isDark ? Colors.white : const Color(0xFF18181B);
  Color get _textSecondary => _isDark ? Colors.white54 : const Color(0xFF71717A);
  Color get _accent => _isDark ? const Color(0xFFA78BFA) : const Color(0xFF7C3AED);

  Future<void> _addAlarm() async {
    final TimeOfDay? time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.dark(
              primary: _accent,
              surface: _cardBg,
            ),
          ),
          child: child!,
        );
      },
    );

    if (time != null) {
      final labelCtrl = TextEditingController();
      final result = await showDialog<Map<String, dynamic>>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: _cardBg,
          title: Text('Set Alarm', style: TextStyle(color: _textPrimary)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: _textPrimary),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: labelCtrl,
                decoration: InputDecoration(
                  hintText: 'Label (e.g. Study session)',
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
              onPressed: () => Navigator.pop(ctx, {'time': '${time.hour}:${time.minute}', 'label': labelCtrl.text, 'enabled': true}),
              child: Text('Set', style: TextStyle(color: _accent)),
            ),
          ],
        ),
      );

      if (result != null) {
        setState(() => _alarms.add(result));
        _saveAlarms();
      }
    }
  }

  void _toggleAlarm(int index) {
    setState(() => _alarms[index]['enabled'] = !_alarms[index]['enabled']);
    _saveAlarms();
  }

  void _deleteAlarm(int index) {
    setState(() => _alarms.removeAt(index));
    _saveAlarms();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: Icon(Icons.arrow_back_ios, size: 20, color: _textPrimary),
        ),
        title: Text('Alarms & Reminders', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: _textPrimary)),
        actions: [
          IconButton(
            onPressed: _addAlarm,
            icon: Icon(Icons.add, color: _accent, size: 22),
          ),
        ],
      ),
      body: _alarms.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.alarm_off_outlined, size: 64, color: _textSecondary),
                  const SizedBox(height: 16),
                  Text('No alarms set', style: TextStyle(color: _textSecondary, fontSize: 16)),
                  const SizedBox(height: 8),
                  Text('Tap + to add an alarm', style: TextStyle(color: _textSecondary, fontSize: 13)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _alarms.length,
              itemBuilder: (context, index) {
                final alarm = _alarms[index];
                final timeParts = (alarm['time'] as String).split(':');
                final hour = int.parse(timeParts[0]);
                final minute = int.parse(timeParts[1]);
                final label = alarm['label'] as String? ?? 'Alarm';
                final enabled = alarm['enabled'] as bool? ?? true;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _cardBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _borderColor),
                  ),
                  child: Row(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: enabled ? _textPrimary : _textSecondary,
                            ),
                          ),
                          Text(label, style: TextStyle(color: _textSecondary, fontSize: 13)),
                        ],
                      ),
                      const Spacer(),
                      Switch(
                        value: enabled,
                        onChanged: (_) => _toggleAlarm(index),
                        activeThumbColor: _accent,
                      ),
                      IconButton(
                        onPressed: () => _deleteAlarm(index),
                        icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                      ),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addAlarm,
        backgroundColor: _accent,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
