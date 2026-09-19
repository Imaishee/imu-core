import 'dart:convert';
import 'dart:io';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:open_file/open_file.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
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

/// Background update service: downloads APK with progress shown in the
/// notification tray, then prompts the user to install automatically.
class UpdateService {
  final String _baseUrl = AppConstants.supabaseUrl;
  final String _anonKey = AppConstants.supabaseAnonKey;
  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  static const _channelId = 'imu_update_download';
  static const _channelName = 'App Updates';
  static const _channelDesc = 'Shows download progress for app updates';
  static const _notificationId = 9999;

  bool _downloading = false;
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

  /// Download the APK in the background with notification progress.
  /// On completion, automatically opens the APK for installation.
  Future<void> downloadAndInstall(UpdateInfo info) async {
    if (_downloading || info.downloadUrl.isEmpty) return;
    _downloading = true;

    try {
      await _ensureChannel();

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

      // Get temporary directory for the APK
      final dir = await getTemporaryDirectory();
      final apkPath = '${dir.path}/imu_v${info.latestVersion}.apk';
      final file = File(apkPath);

      // Download with progress tracking using HttpClient (supports content-length)
      final uri = Uri.parse(info.downloadUrl);
      final request = await HttpClient().getUrl(uri);
      final response = await request.close();

      if (response.statusCode != 200) {
        print('[UpdateService] Download failed: HTTP ${response.statusCode}');
        _downloading = false;
        return;
      }

      final contentLength = response.contentLength ?? 0;
      int received = 0;
      final sink = file.openWrite();

      await for (final chunk in response) {
        sink.add(chunk);
        received += chunk.length;

        if (contentLength > 0) {
          final progress = ((received / contentLength) * 100).toInt();

          // Update notification every 2% to avoid flooding
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

      // Show "installing" notification
      await _notifications.show(
        _notificationId,
        'Download complete',
        'Tap to install v${info.latestVersion}',
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

      // Auto-open the APK for installation
      final result = await OpenFile.open(apkPath, type: 'application/vnd.android.package-archive');
      print('[UpdateService] Open file result: ${result.message}');
    } catch (e) {
      print('[UpdateService] Download/install error: $e');
      // Show error notification
      await _notifications.show(
        _notificationId,
        'Update failed',
        'Could not download the update. Tap to retry.',
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
    } finally {
      _downloading = false;
    }
  }
}
