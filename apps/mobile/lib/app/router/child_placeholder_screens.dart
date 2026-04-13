import 'dart:async';

import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';
import 'package:english_pro/features/parental_gate/bloc/parental_gate_bloc.dart';
import 'package:english_pro/features/parental_gate/bloc/parental_gate_event.dart';
import 'package:english_pro/features/parental_gate/services/parental_gate_service.dart';
import 'package:english_pro/features/parental_gate/view/parental_gate_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// Placeholder screens for child mode (Story 2.5, updated Story 2.6).
///
/// Full content will be implemented in Epic 3+.
/// Each screen shows a simple placeholder with the tab name.

class ChildPracticePlaceholderScreen extends StatelessWidget {
  const ChildPracticePlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0),
      appBar: AppBar(
        title: const Text('Luyện tập'),
        backgroundColor: const Color(0xFFFFF8F0),
        elevation: 0,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('🎤', style: TextStyle(fontSize: 64)),
            SizedBox(height: 16),
            Text(
              'Practice',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2D3142),
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Coming in Epic 3',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF9E9E9E),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ChildProgressPlaceholderScreen extends StatelessWidget {
  const ChildProgressPlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0),
      appBar: AppBar(
        title: const Text('Tiến trình'),
        backgroundColor: const Color(0xFFFFF8F0),
        elevation: 0,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('📊', style: TextStyle(fontSize: 64)),
            SizedBox(height: 16),
            Text(
              'Progress',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2D3142),
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Coming in Epic 3',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF9E9E9E),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ChildProfilePlaceholderScreen extends StatefulWidget {
  const ChildProfilePlaceholderScreen({super.key});

  @override
  State<ChildProfilePlaceholderScreen> createState() =>
      _ChildProfilePlaceholderScreenState();
}

class _ChildProfilePlaceholderScreenState
    extends State<ChildProfilePlaceholderScreen> {
  /// Guard flag to prevent double-tap pushing two ParentalGate modals (F-3 fix).
  bool _isNavigatingToGate = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0),
      appBar: AppBar(
        title: const Text('Hồ sơ'),
        backgroundColor: const Color(0xFFFFF8F0),
        elevation: 0,
        actions: [
          TextButton.icon(
            onPressed: () => _showParentalGate(context),
            icon: const Icon(
              Icons.swap_horiz,
              size: 20,
              color: Color(0xFF9E9E9E),
            ),
            label: const Text(
              'Đổi người',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF9E9E9E),
              ),
            ),
          ),
        ],
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('👤', style: TextStyle(fontSize: 64)),
            SizedBox(height: 16),
            Text(
              'Child Profile',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2D3142),
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Coming in Epic 3',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF9E9E9E),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Opens the Parental Gate as a modal screen.
  ///
  /// On success, pops the gate screen and dispatches
  /// [AuthChildSessionEnded] to return to parent mode.
  void _showParentalGate(BuildContext context) {
    // F-3 fix: prevent double-tap from pushing two gate modals.
    if (_isNavigatingToGate) return;
    setState(() => _isNavigatingToGate = true);

    final authBloc = context.read<AuthBloc>();
    final storageService = context.read<SecureStorageService>();

    unawaited(
      Navigator.of(context)
          .push<void>(
        MaterialPageRoute(
          // F-4 fix: fullscreenDialog disables iOS edge-swipe gesture (AC6).
          fullscreenDialog: true,
          builder: (_) => BlocProvider(
            create: (_) => ParentalGateBloc(
              parentalGateService: ParentalGateService(
                storageService: storageService,
              ),
            )..add(const ParentalGateStarted()),
            child: ParentalGateScreen(
              onSuccess: () {
                // F-6 fix: guard against unmounted context.
                if (!context.mounted) return;
                Navigator.of(context).pop();
                authBloc.add(const AuthChildSessionEnded());
              },
            ),
          ),
        ),
      )
          .whenComplete(() {
        if (mounted) setState(() => _isNavigatingToGate = false);
      }),
    );
  }
}
