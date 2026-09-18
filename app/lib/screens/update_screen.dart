import 'package:flutter/material.dart';
import '../services/update_service.dart';

class UpdateScreen extends StatefulWidget {
  final UpdateInfo updateInfo;
  const UpdateScreen({super.key, required this.updateInfo});

  @override
  State<UpdateScreen> createState() => _UpdateScreenState();
}

class _UpdateScreenState extends State<UpdateScreen> {
  final _updateService = UpdateService();
  bool _downloading = false;
  double _progress = 0;
  String _statusText = '';

  @override
  void initState() {
    super.initState();
    // Auto-start download on force update screens
    if (widget.updateInfo.forceUpdate) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _startDownload());
    }
  }

  Future<void> _startDownload() async {
    if (_downloading) return;
    setState(() {
      _downloading = true;
      _statusText = 'Preparing download...';
    });

    // Start background download — notification handles progress UI
    await _updateService.downloadAndInstall(widget.updateInfo);

    if (mounted) {
      setState(() {
        _downloading = false;
        _statusText = 'Download complete! Install the update from notifications.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !widget.updateInfo.forceUpdate,
      child: Scaffold(
        backgroundColor: const Color(0xFF09090B),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Spacer(),
                // Logo
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Center(
                    child: Padding(
                      padding: EdgeInsets.all(15),
                      child: FittedBox(
                        child: Text("I'MU", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  "Update Available",
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 8),
                Text(
                  "Version ${widget.updateInfo.latestVersion}",
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
                          'What\'s New',
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
                // Download progress indicator
                if (_downloading) ...[
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
                        Text(
                          _statusText.isNotEmpty
                              ? _statusText
                              : 'Downloading in background...',
                          style: TextStyle(color: Colors.white.withAlpha(153), fontSize: 13),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'You can continue using the app. Progress is shown in notifications.',
                          style: TextStyle(color: Colors.white.withAlpha(100), fontSize: 11),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ],
                const Spacer(),
                // Download button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _downloading ? null : _startDownload,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
                    ),
                    child: _downloading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                          )
                        : const Text('Upgrade Now', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
                if (!widget.updateInfo.forceUpdate) ...[
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text('Later', style: TextStyle(color: Colors.white.withAlpha(153))),
                  ),
                ],
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
