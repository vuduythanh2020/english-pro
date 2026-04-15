import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// WebView screen displaying the privacy policy (Story 2.7 — Task 4.4).
///
/// Loads `https://english-pro.app/privacy-policy-kids` in an embedded WebView.
/// Shows a loading indicator while the page loads.
class PrivacyPolicyScreen extends StatefulWidget {
  const PrivacyPolicyScreen({super.key});

  /// The URL of the privacy policy for children.
  static const privacyPolicyUrl =
      'https://english-pro.app/privacy-policy-kids';

  @override
  State<PrivacyPolicyScreen> createState() => _PrivacyPolicyScreenState();
}

class _PrivacyPolicyScreenState extends State<PrivacyPolicyScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
          onWebResourceError: (error) {
            if (mounted) {
              setState(() => _isLoading = false);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Không thể tải trang: ${error.description}',
                  ),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          },
        ),
      )
      ..loadRequest(Uri.parse(PrivacyPolicyScreen.privacyPolicyUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chính sách quyền riêng tư')),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
