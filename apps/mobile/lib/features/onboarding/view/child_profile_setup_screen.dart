import 'package:english_pro/app/theme/color_tokens.dart';
import 'package:english_pro/app/theme/spacing_tokens.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_bloc.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_event.dart';
import 'package:english_pro/features/onboarding/bloc/child_profile_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// Avatar data: (id, emoji, backgroundColor)
const _avatarData = [
  (1, '🦊', Color(0xFFFFE0CC)),
  (2, '🐧', Color(0xFFCCE5FF)),
  (3, '🐸', Color(0xFFCCFFDA)),
  (4, '🐯', Color(0xFFFFF4CC)),
  (5, '🦋', Color(0xFFF0CCFF)),
  (6, '🐼', Color(0xFFFFCCF0)),
];

/// Child profile setup screen for onboarding flow (Story 2.4).
///
/// Parent enters a display name and selects an avatar for their child.
/// Navigation after success is handled by GoRouter's ChildProfileGuard
/// via [AuthBloc] state change — no manual `context.go()` needed.
class ChildProfileSetupScreen extends StatefulWidget {
  const ChildProfileSetupScreen({super.key});

  @override
  State<ChildProfileSetupScreen> createState() =>
      _ChildProfileSetupScreenState();
}

class _ChildProfileSetupScreenState extends State<ChildProfileSetupScreen> {
  final _nameController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<ChildProfileBloc, ChildProfileState>(
      listener: (context, state) {
        if (state is ChildProfileFailure) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                key: ValueKey(state.errorId),
                content: Text(state.message),
                behavior: SnackBarBehavior.floating,
              ),
            );
        }
        // ChildProfileSuccess → GoRouter auto-redirects via AuthBloc
        // hasChildProfile = true → ChildProfileGuard sends to /home
      },
      child: Scaffold(
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.l,
              vertical: AppSpacing.m,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: AppSpacing.xl),

                // ── Header ──────────────────────────────────────────────
                const Icon(
                  Icons.child_care_rounded,
                  size: 64,
                  color: AppColors.coralPrimary,
                ),
                const SizedBox(height: AppSpacing.l),

                Text(
                  'Tạo hồ sơ cho con',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.s),

                Text(
                  'Nhập tên và chọn avatar để bắt đầu hành trình học tiếng Anh!',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color:
                            Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xl),

                // ── Name input ──────────────────────────────────────────
                BlocBuilder<ChildProfileBloc, ChildProfileState>(
                  buildWhen: (prev, curr) {
                    final prevError = prev is ChildProfileFilling
                        ? prev.form.nameError
                        : null;
                    final currError = curr is ChildProfileFilling
                        ? curr.form.nameError
                        : null;
                    return prevError != currError;
                  },
                  builder: (context, state) {
                    final nameError =
                        state is ChildProfileFilling ? state.form.nameError : null;

                    return TextFormField(
                      controller: _nameController,
                      maxLength: 20,
                      textCapitalization: TextCapitalization.words,
                      decoration: InputDecoration(
                        labelText: 'Tên con',
                        hintText: 'Ví dụ: Bé Minh',
                        errorText: nameError,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        prefixIcon: const Icon(Icons.person_outline_rounded),
                      ),
                      onChanged: (value) {
                        context
                            .read<ChildProfileBloc>()
                            .add(ChildProfileNameChanged(value));
                      },
                    );
                  },
                ),
                const SizedBox(height: AppSpacing.l),

                // ── Avatar selection ────────────────────────────────────
                Text(
                  'Chọn avatar cho con',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: AppSpacing.m),

                BlocBuilder<ChildProfileBloc, ChildProfileState>(
                  buildWhen: (prev, curr) {
                    final prevAvatar = prev is ChildProfileFilling
                        ? prev.form.selectedAvatarId
                        : 1;
                    final currAvatar = curr is ChildProfileFilling
                        ? curr.form.selectedAvatarId
                        : 1;
                    return prevAvatar != currAvatar;
                  },
                  builder: (context, state) {
                    final selectedAvatarId = state is ChildProfileFilling
                        ? state.form.selectedAvatarId
                        : 1;

                    return GridView.count(
                      crossAxisCount: 3,
                      crossAxisSpacing: AppSpacing.m,
                      mainAxisSpacing: AppSpacing.m,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      children: _avatarData.map((record) {
                        final (id, emoji, bgColor) = record;
                        final isSelected = id == selectedAvatarId;

                        return GestureDetector(
                          onTap: () {
                            context
                                .read<ChildProfileBloc>()
                                .add(ChildProfileAvatarSelected(id));
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: isSelected
                                  ? Border.all(
                                      color: AppColors.coralPrimary,
                                      width: 3,
                                    )
                                  : null,
                            ),
                            child: CircleAvatar(
                              radius: 40,
                              backgroundColor: bgColor,
                              child: Text(
                                emoji,
                                style: const TextStyle(fontSize: 32),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    );
                  },
                ),
                const SizedBox(height: AppSpacing.xl),

                // ── Submit button ───────────────────────────────────────
                BlocBuilder<ChildProfileBloc, ChildProfileState>(
                  builder: (context, state) {
                    final isSubmitting = state is ChildProfileSubmitting;
                    final isFormValid =
                        state is ChildProfileFilling && state.form.isFormValid;

                    return FilledButton(
                      onPressed: isSubmitting || !isFormValid
                          ? null
                          : () => context
                              .read<ChildProfileBloc>()
                              .add(const ChildProfileSubmitted()),
                      child: isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Tạo hồ sơ'),
                    );
                  },
                ),
                const SizedBox(height: AppSpacing.l),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
