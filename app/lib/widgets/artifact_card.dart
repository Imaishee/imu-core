import 'dart:io';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/artifact_service.dart';
import '../theme/app_theme.dart';

/// Renders a code / HTML / PDF / Markdown artifact block in the chat with a
/// preview header, optional syntax label, and a Download button.
class ArtifactCard extends StatelessWidget {
  final String title;
  final String language; // html, pdf, markdown, or code
  final String content;
  final bool previewable; // HTML can be opened in browser; PDF printed

  const ArtifactCard({
    super.key,
    required this.title,
    required this.language,
    required this.content,
    this.previewable = true,
  });

  Color get _accent {
    switch (language) {
      case 'html':
        return const Color(0xFFE34F26);
      case 'pdf':
        return const Color(0xFFD93025);
      case 'markdown':
        return const Color(0xFF40916C);
      default:
        return const Color(0xFF52B788);
    }
  }

  String get _icon {
    switch (language) {
      case 'html':
        return '< />';
      case 'pdf':
        return 'PDF';
      case 'markdown':
        return 'MD';
      default:
        return '{ }';
    }
  }

  Future<void> _download(BuildContext context) async {
    try {
      File? file;
      if (language == 'pdf') {
        file = await ArtifactService.generatePdf(title, content);
      } else {
        final ext = language == 'html'
            ? 'html'
            : language == 'markdown'
                ? 'md'
                : 'txt';
        file = await ArtifactService.writeTextFile('$title.$ext', content);
      }
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Downloading $title…'),
        backgroundColor: AppColors.greenPrimary,
        behavior: SnackBarBehavior.floating,
      ));
      await ArtifactService.share(file, subject: title);
    } catch (e) {
      print('[ArtifactCard] Download error: $e');
    }
  }

  Future<void> _preview() async {
    if (language == 'html') {
      // Open rendered HTML in the browser for a live preview
      final dir = await ArtifactService.writeTextFile('$title.html', content);
      await launchUrl(dir.uri, mode: LaunchMode.externalApplication);
    } else if (language == 'pdf') {
      final file = await ArtifactService.generatePdf(title, content);
      await ArtifactService.openPdf(file);
    } else if (language == 'markdown') {
      // Fall back to download for markdown preview
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.elevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header bar
          Container(
            color: _accent.withAlpha(20),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: _accent, borderRadius: BorderRadius.circular(4)),
                  child: Text(_icon, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(title,
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: AppTheme.textMain, fontSize: 12, fontWeight: FontWeight.w600)),
                ),
                if (previewable && language == 'html')
                  _btn(Icons.open_in_new, 'Open', _preview),
                _btn(Icons.download_outlined, 'Download', () => _download(context)),
              ],
            ),
          ),
          // Body: truncated code preview
          Container(
            constraints: const BoxConstraints(maxHeight: 140),
            width: double.infinity,
            color: AppTheme.elevated,
            padding: const EdgeInsets.all(10),
            child: SingleChildScrollView(
              child: Text(
                content.length > 2000 ? '${content.substring(0, 2000)}…' : content,
                style: TextStyle(
                  color: AppColors.greenMint,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  height: 1.4,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _btn(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(left: 6),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(color: AppColors.greenPrimary, borderRadius: BorderRadius.circular(8)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 12, color: Colors.white),
          const SizedBox(width: 3),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
        ]),
      ),
    );
  }
}