import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../models/class_schedule.dart';
import '../providers/app_provider.dart';
import '../services/timetable_service.dart';
import '../services/vision_timetable_service.dart';
import '../theme/app_theme.dart';

class TimetableScreen extends ConsumerStatefulWidget {
  const TimetableScreen({super.key});
  @override
  ConsumerState<TimetableScreen> createState() => _TimetableScreenState();
}

class _TimetableScreenState extends ConsumerState<TimetableScreen> {
  static const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  String _selectedDay = 'Monday';

  @override
  void initState() {
    super.initState();
    _selectedDay = days[DateTime.now().weekday - 1];
  }

  Future<void> _addClass() async {
    showDialog(
      context: context,
      builder: (_) => _ClassForm(
        onSave: (cls) async {
          await ref.read(timetableProvider.notifier).add(cls);
        },
      ),
    );
  }

  Future<void> _parseWithAI(String text) async {
    try {
      final classes = await VisionTimetableService.parseFromText(text);
      if (classes.isNotEmpty) {
        showDialog(
          context: context,
          builder: (_) => _PreviewParsedDialog(classes: classes, onConfirm: (finalClasses) async {
            for (final c in finalClasses) {
              await ref.read(timetableProvider.notifier).add(c);
            }
          }),
        );
      } else {
        _showError('Could not parse timetable. Try pasting it in a clearer format.');
      }
    } catch (e) {
      _showError('AI parse failed: $e');
    }
  }

  Future<void> _parseWithVision(String imagePath) async {
    try {
      _showError('Analyzing image...');
      final classes = await VisionTimetableService.parseFromImage(imagePath);
      if (classes.isNotEmpty) {
        showDialog(
          context: context,
          builder: (_) => _PreviewParsedDialog(classes: classes, onConfirm: (finalClasses) async {
            for (final c in finalClasses) {
              await ref.read(timetableProvider.notifier).add(c);
            }
          }),
        );
      } else {
        _showError('Could not extract classes from image. Try a clearer photo.');
      }
    } catch (e) {
      _showError('Vision parse failed: $e');
    }
  }

  void _importFromFile() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 8, bottom: 16), decoration: BoxDecoration(color: AppTheme.textMuted.withAlpha(60), borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('Import Timetable', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.textMain)),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('Choose how to import your schedule', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
            ),
            const SizedBox(height: 16),
            _importOption(
              icon: Icons.camera_alt_outlined,
              label: 'Take Photo',
              subtitle: ' photograph of your timetable',
              onTap: () async {
                Navigator.pop(ctx);
                final picked = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 85, maxWidth: 2048);
                if (picked != null) _parseWithVision(picked.path);
              },
            ),
            _importOption(
              icon: Icons.photo_library_outlined,
              label: 'Upload Image',
              subtitle: 'Pick from gallery',
              onTap: () async {
                Navigator.pop(ctx);
                final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85, maxWidth: 2048);
                if (picked != null) _parseWithVision(picked.path);
              },
            ),
            _importOption(
              icon: Icons.content_paste_outlined,
              label: 'Paste Text',
              subtitle: 'Paste timetable text',
              onTap: () {
                Navigator.pop(ctx);
                showDialog(context: context, builder: (_) => _ImportTextDialog(onParse: _parseWithAI));
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _importOption({required IconData icon, required String label, required String subtitle, required VoidCallback onTap}) {
    return ListTile(
      leading: Container(
        width: 44, height: 44,
        decoration: BoxDecoration(color: AppColors.greenPrimary.withAlpha(25), borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, color: AppColors.greenPrimary),
      ),
      title: Text(label, style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
      onTap: onTap,
    );
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final all = ref.watch(timetableProvider);
    final todayClasses = all.where((c) => c.day == _selectedDay).toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        leading: IconButton(icon: Icon(Icons.article_outlined, color: AppTheme.textMain), onPressed: _importFromFile),
        title: Text('My Timetable', style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w700)),
        actions: [
          IconButton(icon: Icon(Icons.add, color: AppTheme.textMain), onPressed: _addClass),
          IconButton(icon: Icon(Icons.refresh, color: AppTheme.textMuted), onPressed: () {
            ref.read(timetableProvider.notifier).refresh();
          }),
        ],
      ),
      body: Column(
        children: [
          // Day selector
          SizedBox(
            height: 56,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              itemCount: days.length,
              itemBuilder: (ctx, i) {
                final d = days[i];
                final active = d == _selectedDay;
                final today = DateTime.now().weekday - 1 == i;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedDay = d),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: active ? AppColors.greenPrimary : AppTheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: active ? AppColors.greenPrimary : AppTheme.border),
                    ),
                    child: Center(child: Text('$d${today ? " •" : ""}', style: TextStyle(color: active ? Colors.white : AppTheme.textMain, fontSize: 13, fontWeight: FontWeight.w500))),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),

          if (todayClasses.isEmpty)
            Expanded(
              child: Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.free_breakfast_outlined, size: 48, color: AppColors.greenPale.withAlpha(80)),
                  const SizedBox(height: 12),
                  Text('No classes on $_selectedDay', style: TextStyle(color: AppTheme.textMuted, fontSize: 15)),
                  const SizedBox(height: 4),
                  Text('Tap + to add one', style: TextStyle(color: AppTheme.textMuted.withAlpha(150), fontSize: 12)),
                ]),
              ),
            )
          else
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                itemCount: todayClasses.length,
                itemBuilder: (ctx, i) => _ClassCard(cls: todayClasses[i], onDelete: () async {
                  await ref.read(timetableProvider.notifier).delete(todayClasses[i].id);
                }),
              ),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addClass,
        backgroundColor: AppColors.greenPrimary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}

class _ClassCard extends StatelessWidget {
  final ClassSchedule cls;
  final VoidCallback onDelete;
  const _ClassCard({required this.cls, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(cls.title, style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textMain, fontSize: 15)),
            if (cls.instructor.isNotEmpty) Text(cls.instructor, style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(color: Color(int.parse(cls.color.replaceFirst('#', '0xFF'))), borderRadius: BorderRadius.circular(8)),
            child: Text('${cls.startTime} - ${cls.endTime}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
          ),
        ]),
        const SizedBox(height: 8),
        Row(children: [
          if (cls.room.isNotEmpty) ...[Icon(Icons.location_on_outlined, size: 13, color: AppTheme.textMuted), const SizedBox(width: 4), Text(cls.room, style: TextStyle(color: AppTheme.textMuted, fontSize: 12)), const SizedBox(width: 12)],
          if (cls.building.isNotEmpty) ...[Icon(Icons.domain, size: 13, color: AppTheme.textMuted), const SizedBox(width: 4), Text(cls.building, style: TextStyle(color: AppTheme.textMuted, fontSize: 12))],
          const Spacer(),
          Icon(Icons.notifications_active_outlined, size: 14, color: cls.notificationEnabled ? AppColors.greenLight : AppTheme.textMuted),
          const SizedBox(width: 6),
          Text('${cls.reminderMinutes} min before', style: TextStyle(color: cls.notificationEnabled ? AppColors.greenLight : AppTheme.textMuted, fontSize: 12)),
        ]),
        if (cls.notes.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text(cls.notes, style: TextStyle(color: AppTheme.textMuted.withAlpha(160), fontSize: 12, fontStyle: FontStyle.italic))),
      ]),
    );
  }
}

class _ClassForm extends StatefulWidget {
  final Function(ClassSchedule) onSave;
  final ClassSchedule? initial;
  const _ClassForm({required this.onSave, this.initial});

  @override
  State<_ClassForm> createState() => _ClassFormState();
}

class _ClassFormState extends State<_ClassForm> {
  final _nameCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  final _instructorCtrl = TextEditingController();
  final _roomCtrl = TextEditingController();
  final _buildingCtrl = TextEditingController();
  String _day = 'Monday';
  String _start = '09:00';
  String _end = '10:00';
  int _reminderMin = 10;
  bool _notifOn = true;

  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    if (i != null) {
      _nameCtrl.text = i.courseName;
      _codeCtrl.text = i.courseCode;
      _instructorCtrl.text = i.instructor;
      _roomCtrl.text = i.room;
      _buildingCtrl.text = i.building;
      _day = i.day;
      _start = i.startTime;
      _end = i.endTime;
      _reminderMin = i.reminderMinutes;
      _notifOn = i.notificationEnabled;
    }
  }

  final _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppTheme.surface,
      insetPadding: const EdgeInsets.all(16),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Add Class', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.textMain)),
              IconButton(onPressed: () => Navigator.pop(context), icon: Icon(Icons.close, color: AppTheme.textMuted)),
            ]),
            const SizedBox(height: 14),
            _field('Course name', _nameCtrl, 'e.g. Data Structures'),
            const SizedBox(height: 10),
            Row(children: [Expanded(child: _field('Code', _codeCtrl, 'CS201')), const SizedBox(width: 10), Expanded(child: _field('Semester', null, 'e.g. Fall 2024'))]),
            const SizedBox(height: 10),
            Row(children: [Expanded(child: _field('Instructor', _instructorCtrl, 'Dr. Smith')), const SizedBox(width: 10), Expanded(child: _field('Room', _roomCtrl, 'B-301'))]),
            const SizedBox(height: 10),
            Row(children: [Expanded(child: _field('Building', _buildingCtrl, 'Engineering Block')), const SizedBox(width: 15)]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: DropdownButtonFormField<String>(
                value: _day,
                decoration: const InputDecoration(labelText: 'Day'),
                items: _days.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                onChanged: (v) => setState(() => _day = v!),
              )),
              const SizedBox(width: 10),
              Expanded(child: _timeField('Start', _start, (v) => setState(() => _start = v))),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _timeField('End', _end, (v) => setState(() => _end = v))),
              const SizedBox(width: 10),
              Expanded(child: DropdownButtonFormField<int>(
                value: _reminderMin,
                decoration: const InputDecoration(labelText: 'Reminder'),
                items: const [DropdownMenuItem(value: 5, child: Text('5 min before')), DropdownMenuItem(value: 10, child: Text('10 min before')), DropdownMenuItem(value: 15, child: Text('15 min before')), DropdownMenuItem(value: 30, child: Text('30 min before')),]
                    .toList(),
                onChanged: (v) => setState(() => _reminderMin = v!),
              )),
            ]),
            SwitchListTile(
              value: _notifOn,
              onChanged: (v) => setState(() => _notifOn = v),
              title: Text('Notify me before class starts', style: TextStyle(color: AppTheme.textMain)),
              dense: true,
              contentPadding: EdgeInsets.zero,
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () {
                  if (_nameCtrl.text.trim().isEmpty) return;
                  widget.onSave(ClassSchedule(
                    id: widget.initial?.id ?? DateTime.now().microsecondsSinceEpoch.toString(),
                    courseName: _nameCtrl.text.trim(),
                    courseCode: _codeCtrl.text.trim(),
                    instructor: _instructorCtrl.text.trim(),
                    room: _roomCtrl.text.trim(),
                    building: _buildingCtrl.text.trim(),
                    day: _day,
                    startTime: _start,
                    endTime: _end,
                    reminderMinutes: _reminderMin,
                    notificationEnabled: _notifOn,
                  ));
                  Navigator.pop(context);
                },
                style: FilledButton.styleFrom(backgroundColor: AppColors.greenPrimary),
                child: const Text('Save Class', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController? ctrl, String hint) {
    return TextField(
      controller: ctrl,
      style: TextStyle(color: AppTheme.textMain, fontSize: 13),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: AppTheme.textMuted),
        filled: true,
        fillColor: AppTheme.creamBg ?? Theme.of(context).colorScheme.surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.border)),
      ),
    );
  }

  Widget _timeField(String label, String val, Function(String) onChanged) {
    return InkWell(
      onTap: () async {
        final parts = val.split(':');
        final picked = await showTimePicker(context: context, initialTime: TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1])));
        if (picked != null) {
          onChanged('${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}');
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(color: AppTheme.creamBg ?? Theme.of(context).colorScheme.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
        child: Text(val, style: TextStyle(color: AppTheme.textMain, fontSize: 14, fontWeight: FontWeight.w500)),
      ),
    );
  }
}

class _ImportTextDialog extends StatefulWidget {
  final Function(String) onParse;
  const _ImportTextDialog({required this.onParse});

  @override
  State<_ImportTextDialog> createState() => _ImportTextDialogState();
}

class _ImportTextDialogState extends State<_ImportTextDialog> {
  final _ctrl = TextEditingController();
  bool _parsing = false;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.surface,
      title: Text('Import Timetable', style: TextStyle(color: AppTheme.textMain)),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        Text('Paste your timetable text below and I\'MU will parse it into classes automatically.', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
        const SizedBox(height: 12),
        TextField(
          controller: _ctrl,
          maxLines: 8,
          decoration: InputDecoration(
            hintText: 'Paste timetable here…\nExample:\nMonday 9-10:30 CSE301 Data Structures Dr. Smith Room 301',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
          style: TextStyle(color: AppTheme.textMain, fontSize: 13),
        ),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
        ElevatedButton(
          onPressed: _parsing
              ? null
              : () async {
                  if (_ctrl.text.trim().isEmpty) return;
                  setState(() => _parsing = true);
                  await widget.onParse(_ctrl.text.trim());
                  if (mounted) Navigator.pop(context);
                },
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.greenPrimary, foregroundColor: Colors.white),
          child: _parsing ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Parse'),
        ),
      ],
    );
  }
}

class _PreviewParsedDialog extends StatelessWidget {
  final List<ClassSchedule> classes;
  final Function(List<ClassSchedule>) onConfirm;
  const _PreviewParsedDialog({required this.classes, required this.onConfirm});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.surface,
      title: Text('Review parsed classes (${classes.length})', style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w600)),
      content: SizedBox(
        width: double.maxFinite,
        child: ListView.builder(
          shrinkWrap: true,
          itemCount: classes.length,
          itemBuilder: (ctx, i) {
            final c = classes[i];
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppTheme.creamBg, borderRadius: BorderRadius.circular(10)),
                child: Text('${c.courseCode.isNotEmpty ? "${c.courseCode} | " : ""}${c.courseName}\n${c.day} ${c.startTime}-${c.endTime} · Room ${c.room}',
                    style: TextStyle(color: AppTheme.textMain, fontSize: 13)),
              ),
            );
          },
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
        ElevatedButton(
          onPressed: () {
            onConfirm(classes);
            Navigator.pop(context);
          },
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.greenPrimary, foregroundColor: Colors.white),
          child: const Text('Save all with alarms'),
        ),
      ],
    );
  }
}