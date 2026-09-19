import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/update_service.dart';

class UpdateScreen extends StatefulWidget {
  final UpdateInfo updateInfo;
  const UpdateScreen({super.key, required this.updateInfo});

  @override
  State<UpdateScreen> createState() => _UpdateScreenState();
}

enum _Phase { idle, downloading, downloaded, installing, error }

class _UpdateScreenState extends State<UpdateScreen> {
  final _updateService = UpdateService();

  _Phase _phase = _Phase.idle;
  double _progress = 0;
  int _receivedBytes = 0;
  int _totalBytes = 0;
  String _speed = '';
  String _statusText = '';
  String _apkPath = '';
  String _errorText = '';

  @override
  void initState() {
    super.initState();
    _checkExistingDownload();
  }

  Future<void> _checkExistingDownload() async {
    final existing = await _updateService.getDownloadedApkPath(widget.updateInfo.latestVersion);
    if (existing != null && mounted) {
      setState(() {
        _apkPath = existing;
        _phase = _Phase.downloaded;
        _progress = 100;
        _statusText = 'Update ready to install';
      });
    }
  }

  Future<void> _startDownload() async {
    if (_phase == _Phase.downloading) return;

    setState(() {
      _phase = _Phase.downloading;
      _statusText = 'Preparing download...';
      _progress = 0;
      _errorText = '';
    });

    final path = await _updateService.downloadApk(
      widget.updateInfo,
      onProgress: (received, total, speedBytesPerSec) {
        if (mounted) {
          final speedMB = speedBytesPerSec / 1048576;
          setState(() {
            _receivedBytes = received;
            _totalBytes = total;
            _progress = total > 0 ? (received / total) * 100 : 0;
            _speed = '${speedMB.toStringAsFixed(1)} MB/s';
          });
        }
      },
    );

    if (!mounted) return;

    if (path != null) {
      HapticFeedback.mediumImpact();
      setState(() {
        _apkPath = path;
        _phase = _Phase.downloaded;
        _progress = 100;
        _statusText = 'Update ready to install';
      });
    } else if (_phase == _Phase.downloading) {
      setState(() {
        _phase = _Phase.error;
        _errorText = 'Download failed. Check your connection and try again.';
      });
    }
  }

  Future<void> _installApk() async {
    setState(() {
      _phase = _Phase.installing;
      _statusText = 'Checking install permission...';
    });

    // Check permission first — if not granted, settings will open
    final allowed = await UpdateService.canInstall();
    if (!mounted) return;

    if (!allowed) {
      // Settings screen opened automatically — wait for user to return
      setState(() {
        _phase = _Phase.downloaded;
        _statusText = 'Please enable "Install unknown apps" for I\'MU, then tap Install again.';
      });
      // Open settings for the user
      await UpdateService.openInstallSettings();
      return;
    }

    setState(() {
      _statusText = 'Opening installer...';
    });

    final success = await UpdateService.installApk(_apkPath);

    if (!mounted) return;

    if (success) {
      setState(() {
        _statusText = 'Installer opened. Follow the prompts to complete installation.';
      });
    } else {
      setState(() {
        _phase = _Phase.error;
        _errorText = 'Could not open installer. Please try downloading again.';
      });
    }
  }

  void _dismiss() {
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final mbDone = (_receivedBytes / 1048576).toStringAsFixed(1);
    final mbTotal = (_totalBytes / 1048576).toStringAsFixed(1);

    return PopScope(
      canPop: true,
      child: Scaffold(
        backgroundColor: const Color(0xFF09090B),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                // Top bar with close button
                Align(
                  alignment: Alignment.topRight,
                  child: IconButton(
                    onPressed: _dismiss,
                    icon: Icon(Icons.close, color: Colors.white.withAlpha(100), size: 24),
                    tooltip: 'Close',
                  ),
                ),
                const Spacer(),
                // Logo
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Image.asset('assets/icon.png', fit: BoxFit.cover),
                ),
                const SizedBox(height: 24),
                const Text(
                  "Update Available",
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 8),
                Text(
                  "v${widget.updateInfo.currentVersion} → v${widget.updateInfo.latestVersion}",
                  style: TextStyle(fontSize: 16, color: Colors.white.withAlpha(153)),
                ),
                const SizedBox(height: 24),
                // Release notes
                if (widget.updateInfo.releaseNotes.isNotEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18181B),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF27272A)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "What's New",
                          style: TextStyle(color: Colors.white.withAlpha(153), fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          widget.updateInfo.releaseNotes,
                          style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
                        ),
                      ],
                    ),
                  ),
                // Download progress
                if (_phase == _Phase.downloading) ...[
                  const SizedBox(height: 24),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18181B),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF27272A)),
                    ),
                    child: Column(
                      children: [
                        LinearProgressIndicator(
                          value: _progress > 0 ? _progress / 100 : null,
                          backgroundColor: const Color(0xFF27272A),
                          valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                          minHeight: 4,
                        ),
                        const SizedBox(height: 12),
                        if (_totalBytes > 0)
                          Text(
                            '$mbDone / $mbTotal MB — ${_progress.toStringAsFixed(0)}%  •  $_speed',
                            style: TextStyle(color: Colors.white.withAlpha(180), fontSize: 13),
                            textAlign: TextAlign.center,
                          )
                        else
                          Text(
                            _statusText.isNotEmpty ? _statusText : 'Downloading...',
                            style: TextStyle(color: Colors.white.withAlpha(153), fontSize: 13),
                            textAlign: TextAlign.center,
                          ),
                      ],
                    ),
                  ),
                ],
                // Error display
                if (_phase == _Phase.error) ...[
                  const SizedBox(height: 24),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18181B),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.withAlpha(50)),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red, size: 24),
                        const SizedBox(height: 8),
                        Text(
                          _errorText,
                          style: const TextStyle(color: Colors.red, fontSize: 13),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ],
                // Install ready message
                if (_phase == _Phase.downloaded) ...[
                  const SizedBox(height: 24),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18181B),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green.withAlpha(50)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_outline, color: Colors.green, size: 24),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Download complete',
                                style: TextStyle(color: Colors.green, fontSize: 13, fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Tap "Install Update" to proceed',
                                style: TextStyle(color: Colors.white.withAlpha(153), fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                if (_phase == _Phase.installing) ...[
                  const SizedBox(height: 24),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18181B),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF27272A)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white.withAlpha(153)),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          _statusText,
                          style: TextStyle(color: Colors.white.withAlpha(153), fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ],
                const Spacer(),
                // Action buttons
                if (_phase == _Phase.downloading)
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white.withAlpha(30),
                        foregroundColor: Colors.white.withAlpha(153),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
                      ),
                      child: const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      ),
                    ),
                  )
                else if (_phase == _Phase.downloaded || _phase == _Phase.installing)
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _phase == _Phase.installing ? null : _installApk,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
                      ),
                      child: _phase == _Phase.installing
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                            )
                          : const Text('Install Update', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  )
                else if (_phase == _Phase.error)
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _startDownload,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
                      ),
                      child: const Text('Retry Download', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  )
                else
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _startDownload,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
                      ),
                      child: const Text('Upgrade Now', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _dismiss,
                  child: Text('Later', style: TextStyle(color: Colors.white.withAlpha(153))),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
