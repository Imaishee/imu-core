import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PermissionService {
  static const _notifKey = 'perm_notif_granted';
  static const _alarmKey = 'perm_alarm_granted';
  static const _locationKey = 'perm_location_granted';

  /// Request notifications + exact alarms (Android 13+/12+).
  static Future<Map<String, bool>> requestCorePermissions() async {
    final notif = await Permission.notification.request();
    final alarmGranted = await _requestExactAlarm();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notifKey, notif.isGranted);
    await prefs.setBool(_alarmKey, alarmGranted);
    return {
      'notifications': notif.isGranted,
      'exactAlarms': alarmGranted,
    };
  }

  static Future<bool> _requestExactAlarm() async {
    try {
      final status = await Permission.scheduleExactAlarm.status;
      if (status.isGranted) return true;
      final r = await Permission.scheduleExactAlarm.request();
      return r.isGranted;
    } catch (_) {
      return true; // older Android — not required
    }
  }

  static Future<bool> requestLocation() async {
    final status = await Permission.locationWhenInUse.request();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_locationKey, status.isGranted);
    return status.isGranted;
  }

  static Future<bool> get hasNotificationPermission async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_notifKey) ?? false;
  }

  static Future<bool> get hasLocationPermission async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_locationKey) ?? false;
  }

  static Future<Map<String, bool>> getStatus() async {
    final notif = await Permission.notification.status;
    final alarms = await Permission.scheduleExactAlarm.status;
    final loc = await Permission.locationWhenInUse.status;
    return {
      'notifications': notif.isGranted,
      'exactAlarms': alarms.isGranted || alarms.isLimited,
      'location': loc.isGranted,
    };
  }
}