import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import '../models/alarm_item.dart';
import '../models/class_schedule.dart';

/// Native alarm service. Scheduled notifications fire even when the
/// app is fully killed (uses Android AlarmManager + boot receiver).
class AlarmService {
  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  // Android notification channels are IMMUTABLE once created: changing
  // `playSound` / importance in code has no effect on an existing channel on
  // an installed device. The alarm channels therefore carry a version suffix
  // so a corrected configuration actually reaches existing installs.
  static const _reminderChannelId = 'imu_class_reminders_v2';
  static const _reminderChannelName = 'Class & Study Reminders';
  static const _reminderChannelDesc =
      'Reminders for your classes and study sessions';

  static const _alarmChannelId = 'imu_alarms_v2';
  static const _alarmChannelName = 'Alarms';
  static const _alarmChannelDesc =
      'Your alarms — plays at full alarm volume, even in silent mode';

  static const _alarmsPrefsKey = 'alarms';

  static bool _initialized = false;

  /// True when Android refused exact alarms; scheduling falls back to
  /// inexact so alarms still fire (possibly a few minutes late).
  static bool _exactDenied = false;
  static bool get exactDenied => _exactDenied;

  /// Must be called once in main() before any scheduling.
  static Future<void> init() async {
    if (_initialized) return;
    try {
      tz.initializeTimeZones();
      // Without this, tz.local stays UTC and zonedSchedule computes wrong
      // times (or skips alarms entirely). Resolve the device zone by name.
      try {
        final deviceZone = await FlutterTimezone.getLocalTimezone();
        tz.setLocalLocation(tz.getLocation(deviceZone));
      } catch (e) {
        print('[AlarmService] Timezone detection fallback: $e');
        // Fall back to an offset guess if the plugin is unavailable.
        final offset = DateTime.now().timeZoneOffset;
        tz.setLocalLocation(tz.getLocation(
            'Etc/GMT${offset.isNegative ? '+' : '-'}${offset.inHours.abs()}'));
      }

      const android = AndroidInitializationSettings('@mipmap/ic_launcher');
      const ios = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      await _plugin.initialize(
        const InitializationSettings(android: android, iOS: ios),
        onDidReceiveNotificationResponse: (details) {
          final id = details.id;
          if (id == null) return;
          if (details.actionId == 'alarm_dismiss') {
            _plugin.cancel(id);
          } else if (details.actionId == 'alarm_snooze') {
            // Cancel current alarm, re-schedule for 5 minutes later
            _plugin.cancel(id);
            final snoozeTime = tz.TZDateTime.now(tz.local).add(const Duration(minutes: 5));
            _plugin.zonedSchedule(
              id,
              'Snoozed alarm',
              'Tap to dismiss',
              snoozeTime,
              _alarmDetails(),
              androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
            );
          }
        },
      );

      final androidImpl = _plugin.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();

      await androidImpl?.createNotificationChannel(
        const AndroidNotificationChannel(
          _reminderChannelId,
          _reminderChannelName,
          description: _reminderChannelDesc,
          importance: Importance.max,
          playSound: true,
          enableVibration: true,
          enableLights: true,
          audioAttributesUsage: AudioAttributesUsage.notification,
        ),
      );

      // Alarms must be audible even when the ringer is on silent/vibrate,
      // so they are routed to the alarm audio stream (not the notification
      // stream, which respects the ringer volume).
      await androidImpl?.createNotificationChannel(
        const AndroidNotificationChannel(
          _alarmChannelId,
          _alarmChannelName,
          description: _alarmChannelDesc,
          importance: Importance.max,
          playSound: true,
          enableVibration: true,
          enableLights: true,
          audioAttributesUsage: AudioAttributesUsage.alarm,
          bypassDnd: true,
        ),
      );

      // Re-request notification permission (Android 13+)
      await androidImpl?.requestNotificationsPermission();

      _initialized = true;
    } catch (e) {
      print('[AlarmService] Init error: $e');
      // ignore — app should still run
    }
  }

  static bool get isInitialized => _initialized;

  /// Ask for the "Alarms & reminders" special access. Returns true when the
  /// OS allows exact alarms (also true on Android < 12 / iOS).
  static Future<bool> requestExactAlarmPermission() async {
    if (!_initialized) await init();
    try {
      final androidImpl = _plugin.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      final granted = await androidImpl?.requestExactAlarmsPermission();
      _exactDenied = granted == false;
      return granted ?? true;
    } catch (e) {
      print('[AlarmService] Exact alarm permission error: $e');
      return false;
    }
  }

  /// True when the OS currently permits exact alarms.
  static Future<bool> canScheduleExact() async {
    try {
      final androidImpl = _plugin.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      final allowed = await androidImpl?.canScheduleExactNotifications();
      return allowed ?? true;
    } catch (e) {
      print('[AlarmService] canScheduleExact error: $e');
      return true;
    }
  }

  static int _dayToIndex(String day) {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];
    final i = days.indexOf(day);
    return i < 0 ? 0 : i + 1; // DateTime.monday = 1
  }

  /// Bounded, collision-free notification id for a user alarm.
  /// Raw ids are millisecond timestamps, which overflow Android's 32-bit
  /// notification id, so they must be folded into a small range.
  static int alarmNotificationId(int rawId, int dayIdx) =>
      ((rawId.abs() % 100000) * 7) + dayIdx.clamp(0, 6);

  /// Alarm-style notification: routed to the alarm audio stream and allowed
  /// past Do Not Disturb so it is audible in silent/vibrate mode.  The sound
  /// loops (FLAG_INSISTENT) until the user taps "Dismiss".
  static NotificationDetails _alarmDetails({bool fullScreen = true}) =>
      NotificationDetails(
        android: AndroidNotificationDetails(
          _alarmChannelId,
          _alarmChannelName,
          channelDescription: _alarmChannelDesc,
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          vibrationPattern: Int64List.fromList(const [0, 800, 500, 800, 500, 800]),
          fullScreenIntent: fullScreen,
          category: AndroidNotificationCategory.alarm,
          visibility: NotificationVisibility.public,
          audioAttributesUsage: AudioAttributesUsage.alarm,
          // Lock screen: show title + body + actions on lock screen
          styleInformation: DefaultStyleInformation(true, true),
          ongoing: true,
          autoCancel: false,
          // FLAG_INSISTENT (4) — sound loops until dismissed.
          // FLAG_NO_CLEAR (32) — survives "Clear All" notifications.
          additionalFlags: Int32List.fromList(const [4, 32]),
          actions: [
            const AndroidNotificationAction(
              'alarm_snooze',
              'Snooze 5 min',
              cancelNotification: false,
            ),
            const AndroidNotificationAction(
              'alarm_dismiss',
              'Dismiss',
              cancelNotification: true,
            ),
          ],
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentSound: true,
          presentBanner: true,
          presentList: true,
        ),
      );

  /// Ordinary reminder: respects the ringer, no full-screen takeover.
  static NotificationDetails _reminderDetails() => NotificationDetails(
        android: AndroidNotificationDetails(
          _reminderChannelId,
          _reminderChannelName,
          channelDescription: _reminderChannelDesc,
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          category: AndroidNotificationCategory.reminder,
          visibility: NotificationVisibility.public,
          audioAttributesUsage: AudioAttributesUsage.notification,
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentSound: true,
        ),
      );

  /// Channel used for admin/system messages from the `notifications` table.
  static const _adminChannelId = 'imu_admin_v2';
  static const _adminChannelName = 'Announcements';
  static const _adminChannelDesc = 'Messages sent to you by your institute';

  static Future<void> _ensureAdminChannel() async {
    try {
      final androidImpl = _plugin.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      await androidImpl?.createNotificationChannel(
        const AndroidNotificationChannel(
          _adminChannelId,
          _adminChannelName,
          description: _adminChannelDesc,
          importance: Importance.high,
          playSound: true,
          enableVibration: true,
          audioAttributesUsage: AudioAttributesUsage.notification,
        ),
      );
    } catch (e) {
      print('[AlarmService] Admin channel creation error: $e');
      // channel creation is best-effort
    }
  }

  /// Posts an admin/system inbox message as a real notification, so a message
  /// sent from the admin panel is seen and heard without a push service.
  static Future<void> showInboxNotification({
    required int id,
    required String title,
    required String body,
  }) async {
    if (!_initialized) await init();
    await _ensureAdminChannel();
    await _plugin.show(
      id,
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _adminChannelId,
          _adminChannelName,
          channelDescription: _adminChannelDesc,
          importance: Importance.high,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          styleInformation: BigTextStyleInformation(body),
          category: AndroidNotificationCategory.message,
          visibility: NotificationVisibility.public,
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentSound: true,
        ),
      ),
    );
  }

  /// Schedules, downgrading to an inexact alarm when the OS denies exact
  /// alarms instead of throwing and losing the reminder entirely.
  static Future<void> _scheduleSafe(
    int id,
    String title,
    String body,
    tz.TZDateTime when,
    DateTimeComponents? repeat, {
    NotificationDetails? detailsOverride,
  }) async {
    final details = detailsOverride ?? _alarmDetails();
    try {
      await _plugin.zonedSchedule(
        id,
        title,
        body,
        when,
        details,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        matchDateTimeComponents: repeat,
      );
      return;
    } on PlatformException catch (e) {
      if (e.code != 'exact_alarms_not_permitted') rethrow;
      _exactDenied = true;
    } catch (e) {
      print('[AlarmService] _scheduleSafe inexact fallback: $e');
      // fall through to inexact
    }

    await _plugin.zonedSchedule(
      id,
      title,
      body,
      when,
      details,
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      matchDateTimeComponents: repeat,
    );
  }

  /// Next occurrence of [hh]:[mm] on weekday [dayIndex] (1=Mon..7=Sun).
  static tz.TZDateTime _nextOccurrence(int hh, int mm, int dayIndex) {
    final now = tz.TZDateTime.now(tz.local);
    var when = tz.TZDateTime(tz.local, now.year, now.month, now.day, hh, mm);
    if (when.isBefore(now)) when = when.add(const Duration(days: 1));
    if (dayIndex >= 1 && dayIndex <= 7) {
      while (when.weekday != dayIndex) {
        when = when.add(const Duration(days: 1));
      }
    }
    return when;
  }

  /// Schedule a weekly-recurring reminder for a class.
  /// Works in background/closed app via exact alarms.
  static Future<void> scheduleClass(ClassSchedule cls) async {
    if (!_initialized) await init();
    final dayIndex = _dayToIndex(cls.day);
    final parts = cls.startTime.split(':');
    final hh = int.parse(parts[0]);
    final mm = int.parse(parts[1]);

    final when = _nextOccurrence(hh, mm, dayIndex);
    final remindAt = when.subtract(Duration(minutes: cls.reminderMinutes));
    final id = cls.id.hashCode & 0x7fffffff;

    final reminder = _buildDetails(cls, isReminder: true);
    await _scheduleSafe(
      id,
      reminder['title']!,
      reminder['body']!,
      remindAt,
      DateTimeComponents.dayOfWeekAndTime,
      detailsOverride: _reminderDetails(),
    );

    final starting = _buildDetails(cls, isReminder: false);
    await _scheduleSafe(
      id + 1,
      starting['title']!,
      starting['body']!,
      when,
      DateTimeComponents.dayOfWeekAndTime,
      detailsOverride: _reminderDetails(),
    );
  }

  /// Schedule a repeating alarm on each weekday in [days] (1=Mon..7=Sun).
  static Future<void> scheduleRepeatingAlarm({
    required int id,
    required String title,
    required String body,
    required String time,
    required List<int> days,
  }) async {
    if (!_initialized) await init();
    final parts = time.split(':');
    final hh = int.parse(parts[0]);
    final mm = int.parse(parts[1]);

    // Clear any stale ids first so removed days don't keep firing.
    for (var d = 0; d < 7; d++) {
      await _plugin.cancel(alarmNotificationId(id, d));
    }

    for (final d in days) {
      final when = _nextOccurrence(hh, mm, d);
      await _scheduleSafe(
        alarmNotificationId(id, d),
        title,
        body,
        when,
        DateTimeComponents.dayOfWeekAndTime,
      );
    }
  }

  /// Schedule a one-off user alarm (e.g. from Alarms screen).
  /// Returns false when the time is already in the past.
  static Future<bool> scheduleOneOff({
    required int id,
    required String title,
    required String body,
    required DateTime when,
  }) async {
    if (!_initialized) await init();
    final tzWhen = tz.TZDateTime.from(when, tz.local);
    if (!tzWhen.isAfter(tz.TZDateTime.now(tz.local))) return false;
    await _scheduleSafe(id, title, body, tzWhen, null);
    return true;
  }

  /// Schedule an [AlarmItem] taking its repeat days into account.
  static Future<void> scheduleAlarm(AlarmItem item) async {
    if (!_initialized) await init();
    if (item.days.isEmpty) {
      final parts = item.time.split(':');
      final now = DateTime.now();
      var when = DateTime(
        now.year,
        now.month,
        now.day,
        int.parse(parts[0]),
        int.parse(parts[1]),
      );
      if (!when.isAfter(now)) when = when.add(const Duration(days: 1));
      await scheduleOneOff(
        id: alarmNotificationId(item.id, 0),
        title: item.label,
        body: 'Alarm · ${item.time}',
        when: when,
      );
    } else {
      await scheduleRepeatingAlarm(
        id: item.id,
        title: item.label,
        body: item.days.length == 7
            ? 'Alarm · every day at ${item.time}'
            : 'Alarm · ${item.time}',
        time: item.time,
        days: item.days,
      );
    }
  }

  static Future<void> cancelAlarm(AlarmItem item) async {
    for (var d = 0; d < 7; d++) {
      await _plugin.cancel(alarmNotificationId(item.id, d));
    }
  }

  /// Re-arm every enabled alarm saved in prefs. Safe to call on every launch;
  /// called on startup and after boot because AlarmManager entries do not
  /// survive a process kill or reboot.
  static Future<void> rearmSavedAlarms() async {
    if (!_initialized) await init();
    try {
      final prefs = await SharedPreferences.getInstance();
      if (!(prefs.getBool('notif_enabled') ?? true)) return;
      final raw = prefs.getStringList(_alarmsPrefsKey) ?? const [];
      for (final entry in raw) {
        final map = Map<String, dynamic>.from(jsonDecode(entry) as Map);
        final item = AlarmItem.fromMap(map);
        if (!item.enabled) continue;
        await scheduleAlarm(item);
      }
    } catch (e) {
      print('[AlarmService] rearmSavedAlarms error: $e');
      // never block app startup on alarm re-arming
    }
  }

  /// Show an immediate local notification (in-app, e.g. study session).
  static Future<void> showNow({
    required int id,
    required String title,
    required String body,
  }) async {
    if (!_initialized) await init();
    await _plugin.show(id, title, body, _reminderDetails());
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
      try {
        if (c.notificationEnabled) {
          await scheduleClass(c);
        } else {
          await cancelClass(c);
        }
      } catch (e) {
        print('[AlarmService] rescheduleAll error for class ${c.courseCode}: $e');
        // one bad entry must not abort the rest of the timetable
      }
    }
  }

  static Map<String, String> _buildDetails(ClassSchedule cls,
      {required bool isReminder}) {
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
