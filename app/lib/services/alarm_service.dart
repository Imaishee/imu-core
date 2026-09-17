import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import '../models/class_schedule.dart';

/// Native alarm service. Scheduled notifications fire even when the
/// app is fully killed (uses Android AlarmManager + boot receiver).
class AlarmService {
  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  static const _channelId = 'imu_class_reminders';
  static const _channelName = 'Class & Study Reminders';
  static const _channelDesc = 'Reminders for your classes, study sessions and alarms';

  static bool _initialized = false;

  /// Must be called once in main() before any scheduling.
  static Future<void> init() async {
    if (_initialized) return;
    tz.initializeTimeZones();
    try {
      const android = AndroidInitializationSettings('@mipmap/ic_launcher');
      const ios = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      await _plugin.initialize(
        const InitializationSettings(android: android, iOS: ios),
        onDidReceiveNotificationResponse: (details) {},
      );

      await _plugin
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(const AndroidNotificationChannel(
            _channelId,
            _channelName,
            description: _channelDesc,
            importance: Importance.max,
            playSound: true,
            enableVibration: true,
            enableLights: true,
          ));

      // Re-request notification permission (Android 13+)
      await _plugin
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();

      _initialized = true;
    } catch (e) {
      // ignore — app should still run
    }
  }

  static bool get isInitialized => _initialized;

  static int _dayToIndex(String day) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final i = days.indexOf(day);
    return i < 0 ? 0 : i + 1; // DateTime.monday = 1
  }

  /// Schedule a weekly-recurring reminder for a class.
  /// Works in background/closed app via exact alarms.
  static Future<void> scheduleClass(ClassSchedule cls) async {
    if (!_initialized) await init();
    final dayIndex = _dayToIndex(cls.day);
    final parts = cls.startTime.split(':');
    final hh = int.parse(parts[0]);
    final mm = int.parse(parts[1]);

    final now = tz.TZDateTime.now(tz.local);
    var when = tz.TZDateTime(tz.local, now.year, now.month, now.day, hh, mm);
    // If the class time today already passed, roll to next week
    while (when.isBefore(now)) {
      when = when.add(const Duration(days: 7));
    }
    // Align to correct weekday
    while (when.weekday != dayIndex) {
      when = when.add(const Duration(days: 1));
    }
    if (when.isBefore(now)) {
      when = when.add(const Duration(days: 7));
    }

    // Reminder: fire `reminderMinutes` before class start
    final remindAt = when.subtract(Duration(minutes: cls.reminderMinutes));
    final id = cls.id.hashCode & 0x7fffffff;

    final details = _buildDetails(cls, isReminder: true);
    await _plugin.zonedSchedule(
      id,
      details['title'],
      details['body'],
      remindAt,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: _channelDesc,
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          fullScreenIntent: true,
          category: AndroidNotificationCategory.alarm,
          visibility: NotificationVisibility.public,
        ),
        iOS: DarwinNotificationDetails(presentAlert: true, presentSound: true),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.dayOfWeekAndTime,
    );

    // Also schedule "class starting now" notification (optional, always on)
    final startNowAt = when;
    final nowDetails = _buildDetails(cls, isReminder: false);
    await _plugin.zonedSchedule(
      id + 1,
      nowDetails['title'],
      nowDetails['body'],
      startNowAt,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: _channelDesc,
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          category: AndroidNotificationCategory.alarm,
          visibility: NotificationVisibility.public,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.dayOfWeekAndTime,
    );
  }

  /// Schedule a one-off user alarm (e.g. from Alarms screen).
  static Future<void> scheduleOneOff({
    required int id,
    required String title,
    required String body,
    required DateTime when,
  }) async {
    if (!_initialized) await init();
    final tzWhen = tz.TZDateTime.from(when, tz.local);
    if (tzWhen.isBefore(tz.TZDateTime.now(tz.local))) return;
    await _plugin.zonedSchedule(
      id,
      title,
      body,
      tzWhen,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: _channelDesc,
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          fullScreenIntent: true,
          category: AndroidNotificationCategory.alarm,
          visibility: NotificationVisibility.public,
        ),
        iOS: DarwinNotificationDetails(presentAlert: true, presentSound: true),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
    );
  }

  /// Show an immediate local notification (in-app, e.g. study session).
  static Future<void> showNow({
    required int id,
    required String title,
    required String body,
  }) async {
    if (!_initialized) await init();
    await _plugin.show(
      id,
      title,
      body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: _channelDesc,
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
        ),
        iOS: DarwinNotificationDetails(presentAlert: true, presentSound: true),
      ),
    );
  }

  static Future<void> cancelClass(ClassSchedule cls) async {
    final id = cls.id.hashCode & 0x7fffffff;
    await _plugin.cancel(id);
    await _plugin.cancel(id + 1);
  }

  static Future<void> cancel(int id) async {
    await _plugin.cancel(id);
  }

  static Future<void> cancelAll() async {
    await _plugin.cancelAll();
  }

  /// Re-schedule everything (used on boot / after edits).
  static Future<void> rescheduleAll(List<ClassSchedule> classes) async {
    if (!_initialized) await init();
    for (final c in classes) {
      if (c.notificationEnabled) {
        await scheduleClass(c);
      } else {
        await cancelClass(c);
      }
    }
  }

  static Map<String, String> _buildDetails(ClassSchedule cls, {required bool isReminder}) {
    final title = isReminder
        ? '${cls.title} in ${cls.reminderMinutes} min'
        : '${cls.title} is starting now';

    final lines = <String>[];
    if (isReminder) lines.add('Starts at ${cls.startTime} · ${cls.day}');
    if (cls.instructor.isNotEmpty) lines.add('Instructor: ${cls.instructor}');
    if (cls.room.isNotEmpty) lines.add('Room: ${cls.room}');
    if (cls.building.isNotEmpty) lines.add('Building: ${cls.building}');
    if (lines.isNotEmpty) {
      return {'title': title, 'body': lines.join(' · ')};
    }
    return {'title': title, 'body': 'Get ready for class'};
  }
}