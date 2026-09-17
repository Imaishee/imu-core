import 'dart:convert';

class ClassSchedule {
  final String id;
  final String courseName;
  final String courseCode;
  final String instructor;
  final String room;
  final String building;
  final String day; // Monday..Sunday
  final String startTime; // "09:00"
  final String endTime; // "10:30"
  final int reminderMinutes; // minutes before class
  final bool notificationEnabled;
  final String color;
  final String notes;

  const ClassSchedule({
    required this.id,
    required this.courseName,
    this.courseCode = '',
    this.instructor = '',
    this.room = '',
    this.building = '',
    required this.day,
    required this.startTime,
    required this.endTime,
    this.reminderMinutes = 10,
    this.notificationEnabled = true,
    this.color = '#2D6A4F',
    this.notes = '',
  });

  String get title => courseCode.isNotEmpty ? '$courseName ($courseCode)' : courseName;

  Map<String, dynamic> toMap() => {
        'id': id,
        'course_name': courseName,
        'course_code': courseCode,
        'instructor': instructor,
        'room': room,
        'building': building,
        'day': day,
        'start_time': startTime,
        'end_time': endTime,
        'reminder_minutes': reminderMinutes,
        'notification_enabled': notificationEnabled,
        'color': color,
        'notes': notes,
      };

  factory ClassSchedule.fromMap(Map<String, dynamic> m) => ClassSchedule(
        id: m['id']?.toString() ?? '',
        courseName: m['course_name']?.toString() ?? m['courseName']?.toString() ?? '',
        courseCode: m['course_code']?.toString() ?? m['courseCode']?.toString() ?? '',
        instructor: m['instructor']?.toString() ?? '',
        room: m['room']?.toString() ?? '',
        building: m['building']?.toString() ?? '',
        day: m['day']?.toString() ?? 'Monday',
        startTime: m['start_time']?.toString() ?? m['startTime']?.toString() ?? '09:00',
        endTime: m['end_time']?.toString() ?? m['endTime']?.toString() ?? '10:00',
        reminderMinutes: (m['reminder_minutes'] as num?)?.toInt() ?? m['reminderMinutes'] as int? ?? 10,
        notificationEnabled: m['notification_enabled'] ?? m['notificationEnabled'] ?? true,
        color: m['color']?.toString() ?? '#2D6A4F',
        notes: m['notes']?.toString() ?? '',
      );

  String toJson() => jsonEncode(toMap());
  factory ClassSchedule.fromJson(String s) => ClassSchedule.fromMap(jsonDecode(s));

  ClassSchedule copyWith({
    String? courseName,
    String? courseCode,
    String? instructor,
    String? room,
    String? building,
    String? day,
    String? startTime,
    String? endTime,
    int? reminderMinutes,
    bool? notificationEnabled,
    String? color,
    String? notes,
  }) =>
      ClassSchedule(
        id: id,
        courseName: courseName ?? this.courseName,
        courseCode: courseCode ?? this.courseCode,
        instructor: instructor ?? this.instructor,
        room: room ?? this.room,
        building: building ?? this.building,
        day: day ?? this.day,
        startTime: startTime ?? this.startTime,
        endTime: endTime ?? this.endTime,
        reminderMinutes: reminderMinutes ?? this.reminderMinutes,
        notificationEnabled: notificationEnabled ?? this.notificationEnabled,
        color: color ?? this.color,
        notes: notes ?? this.notes,
      );
}

class AppNotification {
  final String id;
  final String title;
  final String body;
  final String type; // class_reminder, admin, system, alarm
  final DateTime createdAt;
  final bool isRead;
  final String? actionUrl;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    this.type = 'system',
    required this.createdAt,
    this.isRead = false,
    this.actionUrl,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'body': body,
        'type': type,
        'created_at': createdAt.toIso8601String(),
        'is_read': isRead,
        'action_url': actionUrl,
      };

  factory AppNotification.fromMap(Map<String, dynamic> m) => AppNotification(
        id: m['id']?.toString() ?? DateTime.now().microsecondsSinceEpoch.toString(),
        title: m['title']?.toString() ?? '',
        body: m['message']?.toString() ?? m['body']?.toString() ?? '',
        type: m['type']?.toString() ?? 'system',
        createdAt: DateTime.tryParse(m['created_at']?.toString() ?? '') ?? DateTime.now(),
        isRead: m['is_read'] ?? m['isRead'] ?? false,
        actionUrl: m['action_url']?.toString(),
      );

  AppNotification copyWith({
    String? title,
    String? body,
    String? type,
    DateTime? createdAt,
    bool? isRead,
    String? actionUrl,
  }) =>
      AppNotification(
        id: id,
        title: title ?? this.title,
        body: body ?? this.body,
        type: type ?? this.type,
        createdAt: createdAt ?? this.createdAt,
        isRead: isRead ?? this.isRead,
        actionUrl: actionUrl ?? this.actionUrl,
      );
}