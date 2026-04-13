import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// Placeholder child home screen (Story 2.5).
///
/// Full content will be implemented in Epic 3+.
/// Currently shows a welcome message and a "Switch to Parent" button.
class ChildHomeScreen extends StatelessWidget {
  const ChildHomeScreen({super.key});

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
            onPressed: () {
              context.read<AuthBloc>().add(const AuthChildSessionEnded());
            },
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
}
