import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';
import '../models/alarm_item.dart';
import '../services/permission_service.dart';
import '../services/alarm_service.dart';
import 'dart:convert';

class AlarmsScreen extends StatefulWidget {
  const AlarmsScreen({super.key});

  @override
  State<AlarmsScreen> createState() => _AlarmsScreenState();
}

class _AlarmsScreenState extends State<AlarmsScreen> {
  List<AlarmItem> _alarms = [];
  bool _loading = true;
  bool _notifEnabled = true;
  int _snoozeMinutes = 5;
  String _soundChoice = 'default';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final notif = prefs.getBool('notif_enabled') ?? true;
    final snooze = prefs.getInt('notif_snooze_min') ?? 5;
    final sound = prefs.getString('notif_sound') ?? 'default';
    final list = prefs.getStringList('alarms') ?? [];
    setState(() {
      _notifEnabled = notif;
      _snoozeMinutes = snooze;
      _soundChoice = sound;
      _alarms = list.map((e) => AlarmItem.fromMap(Map<String, dynamic>.from(jsonDecode(e)))).toList();
      _loading = false;
    });

    // Notification + exact alarm permissions, then re-arm saved alarms.
    // AlarmManager entries do not survive a process kill, so this is what
    // keeps existing alarms alive between launches.
    await PermissionService.requestCorePermissions();
    final exact = await AlarmService.requestExactAlarmPermission();
    if (!exact) await AlarmService.canScheduleExact();
    await AlarmService.rearmSavedAlarms();
  }

  void _showExactAlarmHint() {
    if (!AlarmService.exactDenied || !mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
            'Exact alarms are blocked. Enable "Alarms & reminders" for I\'MU in Android settings so alarms fire on time.'),
        action: SnackBarAction(
          label: 'Retry',
          onPressed: () async {
            await AlarmService.requestExactAlarmPermission();
            await AlarmService.rearmSavedAlarms();
          },
        ),
        duration: const Duration(seconds: 6),
      ),
    );
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('alarms', _alarms.map((a) => jsonEncode(a.toMap())).toList());
    await prefs.setBool('notif_enabled', _notifEnabled);
    await prefs.setInt('notif_snooze_min', _snoozeMinutes);
    await prefs.setString('notif_sound', _soundChoice);
  }

  Future<void> _toggleAlarm(AlarmItem item, bool enabled) async {
    final idx = _alarms.indexWhere((a) => a.id == item.id);
    if (idx < 0) return;
    final updated = item.copyWith(enabled: enabled);
    _alarms[idx] = updated;
    setState(() {});
    await _save();

    if (enabled) {
      await _scheduleNotification(updated);
    } else {
      await AlarmService.cancelAlarm(updated);
    }
  }

  Future<void> _scheduleNotification(AlarmItem item) async {
    await AlarmService.scheduleAlarm(item);
    _showExactAlarmHint();
  }

  Future<void> _addAlarm() async {
    await showDialog<AlarmItem>(
      context: context,
      builder: (_) => _AlarmDialog(onSave: (alarm) {
        setState(() => _alarms.add(alarm));
        _save();
        _scheduleNotification(alarm);
      }),
    );
  }

  Future<void> _deleteAlarm(int id) async {
    final idx = _alarms.indexWhere((a) => a.id == id);
    if (idx < 0) return;
    final item = _alarms[idx];
    _alarms.removeAt(idx);
    setState(() {});
    await _save();
    await AlarmService.cancelAlarm(item);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.bg,
        title: Text('Alarms', style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w700)),
        actions: [
          IconButton(icon: Icon(Icons.refresh, color: AppTheme.textMuted), onPressed: _load),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: AppColors.greenPrimary))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Settings section
                GlassCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      SwitchListTile(
                        value: _notifEnabled,
                        title: Text('Notifications', style: TextStyle(color: AppTheme.textMain)),
                        subtitle: Text('Allow app notifications', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                        onChanged: (v) => setState(() => _notifEnabled = v),
                        dense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                      ),
                      Divider(color: AppTheme.border, height: 1),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(children: [
                          Icon(Icons.snooze, color: AppColors.greenMedium, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text('Snooze',
                                style: TextStyle(color: AppTheme.textMain, fontSize: 14),
                                overflow: TextOverflow.ellipsis),
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: DropdownButton<int>(
                              value: _snoozeMinutes,
                              isExpanded: true,
                              dropdownColor: AppTheme.surface,
                              underline: const SizedBox(),
                              items: const [
                                DropdownMenuItem(value: 1, child: Text('1 min')),
                                DropdownMenuItem(value: 5, child: Text('5 min')),
                                DropdownMenuItem(value: 10, child: Text('10 min')),
                                DropdownMenuItem(value: 15, child: Text('15 min')),
                                DropdownMenuItem(value: 30, child: Text('30 min')),
                              ],
                              onChanged: (v) => setState(() => _snoozeMinutes = v!),
                            ),
                          ),
                        ]),
                      ),
                      Divider(color: AppTheme.border, height: 1),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(children: [
                          Icon(Icons.volume_up, color: AppColors.greenMedium, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text('Alarm Sound',
                                style: TextStyle(color: AppTheme.textMain, fontSize: 14),
                                overflow: TextOverflow.ellipsis),
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: DropdownButton<String>(
                              value: _soundChoice,
                              isExpanded: true,
                              dropdownColor: AppTheme.surface,
                              underline: const SizedBox(),
                              items: const [
                                DropdownMenuItem(value: 'default', child: Text('Default')),
                                DropdownMenuItem(value: 'gentle', child: Text('Gentle')),
                                DropdownMenuItem(value: 'loud', child: Text('Loud')),
                                DropdownMenuItem(value: 'beep', child: Text('Beep')),
                              ],
                              onChanged: (v) => setState(() => _soundChoice = v!),
                            ),
                          ),
                        ]),
                      ),
                      Divider(color: AppTheme.border, height: 1),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(children: [
                          Icon(Icons.info_outline, color: AppTheme.textMuted, size: 16),
                          const SizedBox(width: 8),
                          Expanded(child: Text('Alarms work even when the app is closed. Timetable alarms re-arm on device reboot.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12))),
                        ]),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                Text('Active Alarms', style: TextStyle(color: AppColors.greenMedium, fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 10),

                if (_alarms.isEmpty)
                  GlassCard(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(children: [
                          Icon(Icons.alarm_off, size: 36, color: AppTheme.textMuted.withAlpha(80)),
                          const SizedBox(height: 10),
                          Text('No alarms set', style: TextStyle(color: AppTheme.textMuted, fontSize: 14)),
                          const SizedBox(height: 4),
                          Text('Tap + to create a reminder', style: TextStyle(color: AppTheme.textMuted.withAlpha(120), fontSize: 12)),
                        ]),
                      ),
                    ),
                  )
                else
                  ..._alarms.map((alarm) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: GlassCard(
                      margin: EdgeInsets.zero,
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(children: [
                          Container(
                            width: 40, height: 40,
                            decoration: BoxDecoration(color: AppColors.greenMint.withAlpha(40), borderRadius: BorderRadius.circular(10)),
                            child: Icon(Icons.alarm, color: AppColors.greenPrimary, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(alarm.label, style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w600, fontSize: 15)),
                              const SizedBox(height: 2),
                              Text(alarm.dayString, style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                            ]),
                          ),
                          Column(children: [
                            Switch(
                              value: alarm.enabled,
                              onChanged: (v) => _toggleAlarm(alarm, v),
                              activeThumbColor: AppColors.greenPrimary,
                            ),
                            IconButton(onPressed: () => _deleteAlarm(alarm.id), icon: Icon(Icons.delete_outline, size: 18, color: AppTheme.textMuted)),
                          ]),
                        ]),
                      ),
                    ),
                  )),

                const SizedBox(height: 80),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addAlarm,
        backgroundColor: AppColors.greenPrimary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}

class _AlarmDialog extends StatefulWidget {
  final Function(AlarmItem) onSave;
  const _AlarmDialog({required this.onSave});

  @override
  State<_AlarmDialog> createState() => _AlarmDialogState();
}

class _AlarmDialogState extends State<_AlarmDialog> {
  final _labelCtrl = TextEditingController();
  String _time = '08:00';
  final List<bool> _days = List.filled(7, false);

  final List<String> _dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.surface,
      // Without `scrollable` the dialog overflows whenever the on-screen
      // keyboard is up or the device is short — the content is taller than
      // the space the dialog is given.
      scrollable: true,
      title: Text('Set Alarm', style: TextStyle(color: AppTheme.textMain)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _labelCtrl,
            style: TextStyle(color: AppTheme.textMain, fontSize: 14),
            decoration: InputDecoration(
              labelText: 'Label',
              hintText: 'e.g. CSE301 Class',
              labelStyle: TextStyle(color: AppColors.greenMedium),
              filled: true,
              fillColor: AppTheme.bg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.greenLight, width: 1.5)),
            ),
          ),
          const SizedBox(height: 14),
          InkWell(
            onTap: () async {
              final p = await showTimePicker(context: context, initialTime: TimeOfDay.now());
              if (p != null) {
                setState(() => _time = '${p.hour.toString().padLeft(2, '0')}:${p.minute.toString().padLeft(2, '0')}');
              }
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppTheme.bg, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
              child: Text(_time, style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w600, fontSize: 20)),
            ),
          ),
          const SizedBox(height: 14),
          Text('Repeat on days:', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: List.generate(7, (i) {
              final active = _days[i];
              return GestureDetector(
                onTap: () => setState(() => _days[i] = !_days[i]),
                child: Container(
                  width: 34, height: 34,
                  decoration: BoxDecoration(
                    color: active ? AppColors.greenPrimary : AppTheme.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: active ? AppColors.greenPrimary : AppTheme.border),
                  ),
                  child: Center(child: Text(_dayNames[i][0], style: TextStyle(color: active ? Colors.white : AppTheme.textMain, fontWeight: FontWeight.w600, fontSize: 12))),
                ),
              );
            }),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
        ElevatedButton(
          onPressed: () {
            if (_labelCtrl.text.trim().isEmpty) return;
            widget.onSave(AlarmItem(
              id: DateTime.now().millisecondsSinceEpoch,
              label: _labelCtrl.text.trim(),
              time: _time,
              days: _selectedDays(),
              enabled: true,
            ));
            Navigator.pop(context);
          },
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.greenPrimary, foregroundColor: Colors.white),
          child: const Text('Save'),
        ),
      ],
    );
  }

  /// ISO weekdays (1=Mon..7=Sun) currently selected in the dialog.
  List<int> _selectedDays() {
    return [for (int i = 0; i < 7; i++) if (_days[i]) i + 1];
  }
}