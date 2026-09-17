/// A user-created alarm.
///
/// [days] holds ISO weekdays (1 = Monday … 7 = Sunday). An empty list means
/// the alarm fires once at the next occurrence of [time].
class AlarmItem {
  final int id;
  final String label;
  final String time; // "HH:mm"
  final List<int> days;
  final bool enabled;

  const AlarmItem({
    required this.id,
    required this.label,
    required this.time,
    this.days = const [],
    this.enabled = true,
  });

  static const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  Map<String, dynamic> toMap() => {
        'id': id,
        'label': label,
        'time': time,
        'days': days,
        'enabled': enabled,
      };

  factory AlarmItem.fromMap(Map<String, dynamic> m) => AlarmItem(
        id: (m['id'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
        label: m['label'] as String? ?? 'Alarm',
        time: m['time'] as String? ?? '08:00',
        days: _parseDays(m),
        enabled: m['enabled'] as bool? ?? true,
      );

  static List<int> _parseDays(Map<String, dynamic> m) {
    final raw = m['days'];
    if (raw is List) {
      final out = <int>[];
      for (final v in raw) {
        final i = (v as num?)?.toInt();
        if (i != null && i >= 1 && i <= 7 && !out.contains(i)) out.add(i);
      }
      out.sort();
      return out;
    }
    // Migrate the legacy display-string format ("Mon, Wed") that was stored
    // but never actually used for scheduling.
    final s = (m['day'] as String? ?? '').trim();
    if (s.isEmpty || s.toLowerCase() == 'one-time') return const [];
    final out = <int>[];
    for (final part in s.split(',')) {
      final idx = dayNames.indexOf(part.trim());
      if (idx >= 0 && !out.contains(idx + 1)) out.add(idx + 1);
    }
    out.sort();
    return out;
  }

  String get dayString {
    if (days.isEmpty) return '$time · One-time';
    if (days.length == 7) return '$time · Every day';
    return '$time · ${days.map((d) => dayNames[d - 1]).join(', ')}';
  }

  AlarmItem copyWith({
    String? label,
    String? time,
    List<int>? days,
    bool? enabled,
  }) =>
      AlarmItem(
        id: id,
        label: label ?? this.label,
        time: time ?? this.time,
        days: days ?? this.days,
        enabled: enabled ?? this.enabled,
      );
}
