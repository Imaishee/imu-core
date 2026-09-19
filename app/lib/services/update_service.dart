import 'dart:convert';
import 'dart:io';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:open_file/open_file.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class UpdateInfo {
  final bool updateAvailable;
  final String latestVersion;
  final String currentVersion;
  final String downloadUrl;
  final String releaseNotes;
  final bool forceUpdate;

  UpdateInfo({
    required this.updateAvailable,
    required this.latestVersion,
    required this.currentVersion,
    required this.downloadUrl,
    required this.releaseNotes,
    required this.forceUpdate,
  });

  factory UpdateInfo.fromJson(Map<String, dynamic> json) {
    return UpdateInfo(
      updateAvailable: json['update_available'] ?? false,
      latestVersion: json['latest_version'] ?? '',
      currentVersion: json['current_version'] ?? '',
      downloadUrl: json['download_url'] ?? '',
      releaseNotes: json['release_notes'] ?? '',
      forceUpdate: json['force_update'] ?? false,
    );
  }
}

/// Callback type for download progress updates.
typedef DownloadProgressCallback = void Function(
    int received, int total, double speedBytesPerSec);

/// Background update service: downloads APK with progress, then opens installer.
class UpdateService {
  final String _baseUrl = AppConstants.supabaseUrl;
  final String _anonKey = AppConstants.supabaseAnonKey;
  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  static const _channelId = 'imu_update_download';
  static const _channelName = 'App Updates';
  static const _channelDesc = 'Shows download progress for app updates';
  static const _notificationId = 9999;
  static const _prefsKeyDownloadedVersion = 'downloaded_apk_version';
  static const _prefsKeyDownloadedPath = 'downloaded_apk_path';

  static bool _downloading = false;
  bool get isDownloading => _downloading;

  Future<UpdateInfo?> checkForUpdate() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final currentVersion = packageInfo.version;

      final url = Uri.parse('$_baseUrl${AppConstants.checkUpdateEndpoint}');
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'apikey': _anonKey,
        },
        body: jsonEncode({'version': currentVersion}),
      );

      if (response.statusCode == 200) {
        return UpdateInfo.fromJson(jsonDecode(response.body));
      }
    } catch (e) {
      print('[UpdateService] Check for update error: $e');
    }
    return null;
  }

  /// Check if we already have a downloaded APK for the given version.
  Future<bool> isAlreadyDownloaded(String version) async {
    final prefs = await SharedPreferences.getInstance();
    final savedVersion = prefs.getString(_prefsKeyDownloadedVersion);
    final savedPath = prefs.getString(_prefsKeyDownloadedPath);
    if (savedVersion == version && savedPath != null) {
      final file = File(savedPath);
      if (await file.exists()) return true;
    }
    return false;
  }

  /// Get the path to a previously downloaded APK, or null.
  Future<String?> getDownloadedApkPath(String version) async {
    final prefs = await SharedPreferences.getInstance();
    final savedVersion = prefs.getString(_prefsKeyDownloadedVersion);
    final savedPath = prefs.getString(_prefsKeyDownloadedPath);
    if (savedVersion == version && savedPath != null) {
      final file = File(savedPath);
      if (await file.exists()) return savedPath;
    }
    return null;
  }

  /// Ensure the notification channel for download progress exists.
  Future<void> _ensureChannel() async {
    final androidImpl = _notifications.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await androidImpl?.createNotificationChannel(
      const AndroidNotificationChannel(
        _channelId,
        _channelName,
        description: _channelDesc,
        importance: Importance.low,
        playSound: false,
        enableVibration: false,
        showBadge: false,
      ),
    );
  }

  /// Download APK to a persistent location. Returns the file path.
  /// Skips download if already have this version.
  Future<String?> downloadApk(
    UpdateInfo info, {
    DownloadProgressCallback? onProgress,
  }) async {
    if (_downloading || info.downloadUrl.isEmpty) return null;
    _downloading = true;

    try {
      await _ensureChannel();

      // Check if already downloaded
      final existing = await getDownloadedApkPath(info.latestVersion);
      if (existing != null) {
        print('[UpdateService] APK already downloaded: $existing');
        _downloading = false;
        return existing;
      }

      // Show initial "starting" notification
      await _notifications.show(
        _notificationId,
        'Downloading update v${info.latestVersion}',
        'Preparing download...',
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channelId,
            _channelName,
            channelDescription: _channelDesc,
            importance: Importance.low,
            priority: Priority.low,
            ongoing: true,
            autoCancel: false,
            showWhen: false,
            onlyAlertOnce: true,
            progress: 0,
            maxProgress: 100,
            indeterminate: true,
          ),
        ),
      );

      // Use Documents directory (persistent, survives cache clearing)
      final dir = await getApplicationDocumentsDirectory();
      final apkPath = '${dir.path}/imu_v${info.latestVersion}.apk';
      final file = File(apkPath);

      // Delete old file if exists
      if (await file.exists()) await file.delete();

      // Download with progress tracking
      final uri = Uri.parse(info.downloadUrl);
      final request = await HttpClient().getUrl(uri);
      final response = await request.close();

      if (response.statusCode != 200) {
        print('[UpdateService] Download failed: HTTP ${response.statusCode}');
        _downloading = false;
        return null;
      }

      final contentLength = response.contentLength ?? 0;
      int received = 0;
      final sink = file.openWrite();
      final stopwatch = Stopwatch()..start();

      await for (final chunk in response) {
        sink.add(chunk);
        received += chunk.length;

        if (contentLength > 0) {
          final progress = ((received / contentLength) * 100).toInt();
          final elapsedSec = stopwatch.elapsedMilliseconds / 1000.0;
          final speed = elapsedSec > 0 ? received / elapsedSec : 0.0;

          onProgress?.call(received, contentLength, speed);

          // Update notification every 2%
          if (progress % 2 == 0 || progress == 100) {
            final mbDone = (received / 1048576).toStringAsFixed(1);
            final mbTotal = (contentLength / 1048576).toStringAsFixed(1);

            await _notifications.show(
              _notificationId,
              'Downloading update v${info.latestVersion}',
              '$mbDone / $mbTotal MB — $progress%',
              NotificationDetails(
                android: AndroidNotificationDetails(
                  _channelId,
                  _channelName,
                  channelDescription: _channelDesc,
                  importance: Importance.low,
                  priority: Priority.low,
                  ongoing: true,
                  autoCancel: false,
                  showWhen: false,
                  onlyAlertOnce: true,
                  progress: progress,
                  maxProgress: 100,
                ),
              ),
            );
          }
        }
      }

      await sink.close();
      stopwatch.stop();

      // Save downloaded version to prefs
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefsKeyDownloadedVersion, info.latestVersion);
      await prefs.setString(_prefsKeyDownloadedPath, apkPath);

      // Show "ready to install" notification
      await _notifications.show(
        _notificationId,
        'Download complete — v${info.latestVersion}',
        'Tap to install',
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channelId,
            _channelName,
            channelDescription: _channelDesc,
            importance: Importance.high,
            priority: Priority.high,
            ongoing: false,
            autoCancel: true,
            progress: 100,
            maxProgress: 100,
          ),
        ),
      );

      print('[UpdateService] Download complete: $apkPath');
      return apkPath;
    } catch (e) {
      print('[UpdateService] Download error: $e');
      await _notifications.show(
        _notificationId,
        'Download failed',
        'Could not download update. Please try again.',
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channelId,
            _channelName,
            channelDescription: _channelDesc,
            importance: Importance.high,
            priority: Priority.high,
          ),
        ),
      );
      return null;
    } finally {
      _downloading = false;
    }
  }

  static const _channel = MethodChannel('com.imu/install');

  /// Check if the user has granted "Install unknown apps" permission.
  static Future<bool> canInstall() async {
    if (!Platform.isAndroid) return true;
    try {
      final result = await _channel.invokeMethod<bool>('canRequestPackageInstalls');
      return result ?? false;
    } catch (_) {
      // Method channel not available — assume blocked
      return false;
    }
  }

  /// Open system settings so user can enable "Install unknown apps" for I'MU.
  static Future<void> openInstallSettings() async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod('openInstallSettings');
    } catch (_) {
      // Fallback: try opening app settings directly
      try {
        await _channel.invokeMethod('openAppSettings');
      } catch (_) {}
    }
  }

  /// Open the APK file to trigger Android's package installer.
  static Future<bool> installApk(String apkPath) async {
    try {
      final file = File(apkPath);
      if (!await file.exists()) return false;

      // On Android 8+ check if install permission is granted
      if (Platform.isAndroid) {
        final allowed = await canInstall();
        if (!allowed) {
          print('[UpdateService] Install permission not granted — opening settings');
          await openInstallSettings();
          return false;
        }
      }

      final result = await OpenFile.open(
        apkPath,
        type: 'application/vnd.android.package-archive',
      );
      print('[UpdateService] Install open result: ${result.message}');
      return true;
    } catch (e) {
      print('[UpdateService] Install error: $e');
      return false;
    }
  }

  /// Clear saved download info (e.g. after successful install).
  static Future<void> clearDownloadedApk() async {
    final prefs = await SharedPreferences.getInstance();
    final savedPath = prefs.getString(_prefsKeyDownloadedPath);
    if (savedPath != null) {
      final file = File(savedPath);
      if (await file.exists()) await file.delete();
    }
    await prefs.remove(_prefsKeyDownloadedVersion);
    await prefs.remove(_prefsKeyDownloadedPath);
  }
}
