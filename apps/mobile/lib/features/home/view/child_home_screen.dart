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

/// Placeholder child home screen (Story 2.5, updated Story 2.6).
///
/// Full content will be implemented in Epic 3+.
/// Currently shows a welcome message and a "Switch to Parent" button
/// protected by the Parental Gate (PIN / biometric).
class ChildHomeScreen extends StatefulWidget {
  const ChildHomeScreen({super.key});

  @override
  State<ChildHomeScreen> createState() => _ChildHomeScreenState();
}

class _ChildHomeScreenState extends State<ChildHomeScreen> {
  /// Guard flag to prevent double-tap pushing two ParentalGate modals (F-3 fix).
  bool _isNavigatingToGate = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0),
      appBar: AppBar(
        title: const Text('Trang chủ'),
        centerTitle: true,
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
            Text('🏠', style: TextStyle(fontSize: 64)),
            SizedBox(height: 16),
            Text(
              'Child Home',
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

    // Capture bloc references before pushing (context scope safety).
    final authBloc = context.read<AuthBloc>();
    final storageService = context.read<SecureStorageService>();

    unawaited(
      Navigator.of(context)
          .push<void>(
        MaterialPageRoute(
          // F-4 fix: fullscreenDialog disables iOS edge-swipe gesture,
          // preventing bypass of ParentalGateScreen (AC6).
          fullscreenDialog: true,
          builder: (_) => BlocProvider(
            create: (_) => ParentalGateBloc(
              parentalGateService: ParentalGateService(
                storageService: storageService,
              ),
            )..add(const ParentalGateStarted()),
            child: ParentalGateScreen(
              onSuccess: () {
                // F-6 fix: guard against unmounted context before navigating.
                if (!context.mounted) return;
                Navigator.of(context).pop();
                authBloc.add(const AuthChildSessionEnded());
              },
            ),
          ),
        ),
      )
          .whenComplete(() {
        // Reset guard when modal is dismissed (success or other).
        if (mounted) setState(() => _isNavigatingToGate = false);
      }),
    );
  }
}
