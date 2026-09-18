import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../theme/app_theme.dart';

/// Preview screen for generated HTML content (like Claude's preview)
class PreviewScreen extends StatefulWidget {
  final String htmlContent;
  final String title;
  const PreviewScreen({super.key, required this.htmlContent, required this.title});

  @override
  State<PreviewScreen> createState() => _PreviewScreenState();
}

class _PreviewScreenState extends State<PreviewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _showCode = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) => setState(() => _isLoading = true),
        onPageFinished: (_) => setState(() => _isLoading = false),
      ))
      ..loadHtmlString(widget.htmlContent);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        title: Text(widget.title, style: TextStyle(color: AppTheme.textMain, fontSize: 16)),
        actions: [
          // Toggle code/preview
          IconButton(
            onPressed: () => setState(() => _showCode = !_showCode),
            icon: Icon(_showCode ? Icons.visibility_outlined : Icons.code,
                color: AppTheme.textMain),
            tooltip: _showCode ? 'Preview' : 'View Code',
          ),
          // Copy HTML
          IconButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: const Text('HTML copied!'),
                    backgroundColor: AppColors.greenPrimary),
              );
            },
            icon: Icon(Icons.copy, color: AppTheme.textMain),
            tooltip: 'Copy HTML',
          ),
        ],
      ),
      body: _showCode
          ? _buildCodeView()
          : Stack(
              children: [
                WebViewWidget(controller: _controller),
                if (_isLoading)
                  const Center(
                    child: CircularProgressIndicator(color: AppColors.greenLight),
                  ),
              ],
            ),
    );
  }

  Widget _buildCodeView() {
    return Container(
      color: AppTheme.elevated,
      padding: const EdgeInsets.all(16),
      child: SingleChildScrollView(
        child: SelectableText(
          widget.htmlContent,
          style: TextStyle(
            fontFamily: 'monospace',
            fontSize: 13,
            color: AppTheme.textMain,
            height: 1.5,
          ),
        ),
      ),
    );
  }
}
