import 'package:english_pro/features/onboarding/bloc/profile_selection_bloc.dart';
import 'package:english_pro/features/onboarding/bloc/profile_selection_event.dart';
import 'package:english_pro/features/onboarding/bloc/profile_selection_state.dart';
import 'package:english_pro/features/onboarding/models/child_profile.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

/// Avatar configuration for child profiles (Story 2.4).
const _avatarConfig = <int, ({String emoji, Color color})>{
  1: (emoji: '🦊', color: Color(0xFFFF8C42)),
  2: (emoji: '🐧', color: Color(0xFF4FC3F7)),
  3: (emoji: '🐸', color: Color(0xFF81C784)),
  4: (emoji: '🐯', color: Color(0xFFFFD54F)),
  5: (emoji: '🦋', color: Color(0xFFCE93D8)),
  6: (emoji: '🐼', color: Color(0xFFF48FB1)),
};

/// Screen that displays the parent's child profiles for selection.
///
/// After onboarding (consent + child profile creation), the parent
/// lands here to choose which child profile to activate. Tapping a
/// profile triggers the `switch-to-child` flow (Story 2.5).
class ProfileSelectionScreen extends StatelessWidget {
  const ProfileSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0),
      appBar: AppBar(
        title: const Text('Chọn hồ sơ'),
        centerTitle: true,
        backgroundColor: const Color(0xFFFFF8F0),
        elevation: 0,
      ),
      body: BlocConsumer<ProfileSelectionBloc, ProfileSelectionState>(
        listener: _stateListener,
        builder: (context, state) {
          return switch (state) {
            ProfileSelectionInitial() => const SizedBox.shrink(),
            ProfileSelectionLoading() => const _LoadingSkeleton(),
            ProfileSelectionLoaded(:final profiles) =>
              _ProfileGrid(profiles: profiles),
            ProfileSelectionSwitching(:final childId) =>
              _SwitchingOverlay(childId: childId),
            ProfileSelectionSuccess() => const SizedBox.shrink(),
            ProfileSelectionFailure(:final message) =>
              _ErrorView(message: message),
          };
        },
      ),
    );
  }

  void _stateListener(BuildContext context, ProfileSelectionState state) {
    if (state is ProfileSelectionFailure) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(state.message),
            backgroundColor: Colors.red.shade700,
          ),
        );
    }
  }
}

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(
        color: Color(0xFFFF6B6B),
      ),
    );
  }
}

class _ProfileGrid extends StatelessWidget {
  const _ProfileGrid({required this.profiles});

  final List<ChildProfile> profiles;

  @override
  Widget build(BuildContext context) {
    if (profiles.isEmpty) {
      return const _EmptyState();
    }

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Ai sẽ học hôm nay?',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3142),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 0.85,
              ),
              itemCount: profiles.length,
              itemBuilder: (context, index) {
                return _ProfileCard(profile: profiles[index]);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.profile});

  final ChildProfile profile;

  @override
  Widget build(BuildContext context) {
    final config = _avatarConfig[profile.avatarId] ??
        (emoji: '🦊', color: const Color(0xFFFF8C42));

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          context.read<ProfileSelectionBloc>().add(
                ProfileSelected(childId: profile.id),
              );
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          constraints: const BoxConstraints(minHeight: 80),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: config.color.withValues(alpha: 0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: config.color.withValues(alpha: 0.2),
                child: Text(
                  config.emoji,
                  style: const TextStyle(fontSize: 40),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                profile.displayName,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2D3142),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            '😊',
            style: TextStyle(fontSize: 64),
          ),
          const SizedBox(height: 16),
          const Text(
            'Chưa có hồ sơ nào',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2D3142),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Tạo hồ sơ cho bé để bắt đầu học',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF9E9E9E),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => context.go('/child-profile-setup'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF6B6B),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(
                horizontal: 32,
                vertical: 16,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: const Text('Tạo hồ sơ'),
          ),
        ],
      ),
    );
  }
}

class _SwitchingOverlay extends StatelessWidget {
  const _SwitchingOverlay({required this.childId});

  final String childId;

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            color: Color(0xFFFF6B6B),
          ),
          SizedBox(height: 16),
          Text(
            'Đang chuyển...',
            style: TextStyle(
              fontSize: 16,
              color: Color(0xFF2D3142),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 64,
            color: Color(0xFFFF6B6B),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(
              fontSize: 16,
              color: Color(0xFF2D3142),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              context
                  .read<ProfileSelectionBloc>()
                  .add(const ProfilesRefreshed());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF6B6B),
              foregroundColor: Colors.white,
            ),
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }
}
