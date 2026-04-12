import 'dart:async';

import 'package:english_pro/app/theme/color_tokens.dart';
import 'package:english_pro/app/theme/spacing_tokens.dart';
import 'package:english_pro/core/constants/app_constants.dart';
import 'package:english_pro/features/onboarding/bloc/consent_bloc.dart';
import 'package:english_pro/features/onboarding/bloc/consent_event.dart';
import 'package:english_pro/features/onboarding/bloc/consent_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';

/// Parental consent screen with two-step flow:
/// 1. Age declaration — parent enters child's age (1–18)
/// 2. Consent confirmation — parent reviews data practices and confirms
///
/// Navigation after success is handled by GoRouter's ConsentGuard
/// via [AuthBloc] state change — no manual `context.go()` needed.
class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key});

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  final _pageController = PageController();
  final _ageController = TextEditingController();
  int _currentStep = 0;

  @override
  void dispose() {
    _pageController.dispose();
    _ageController.dispose();
    super.dispose();
  }

  void _goToConsentStep() {
    unawaited(
      _pageController.animateToPage(
        1,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      ),
    );
    setState(() => _currentStep = 1);
  }

  void _goBackToAgeStep() {
    unawaited(
      _pageController.animateToPage(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      ),
    );
    setState(() => _currentStep = 0);
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<ConsentBloc, ConsentState>(
      listener: (context, state) {
        if (state is ConsentFailure) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                content: Text(state.message),
                behavior: SnackBarBehavior.floating,
              ),
            );
        }
        // ConsentSuccess → GoRouter auto-redirects via AuthBloc hasConsent
      },
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              // Progress dots
              Padding(
                padding: const EdgeInsets.symmetric(
                  vertical: AppSpacing.m,
                ),
                child: _StepDots(currentStep: _currentStep),
              ),

              // Page content
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _AgeDeclarationStep(
                      ageController: _ageController,
                      onNext: _goToConsentStep,
                    ),
                    _ConsentStep(
                      onBack: _goBackToAgeStep,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Step indicator dots.
class _StepDots extends StatelessWidget {
  const _StepDots({required this.currentStep});

  final int currentStep;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(2, (index) {
        final isActive = index <= currentStep;
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
          width: isActive ? 24 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: isActive
                ? AppColors.coralPrimary
                : AppColors.outline,
            borderRadius: BorderRadius.circular(4),
          ),
        );
      }),
    );
  }
}

/// Step 1: Age declaration.
class _AgeDeclarationStep extends StatelessWidget {
  const _AgeDeclarationStep({
    required this.ageController,
    required this.onNext,
  });

  final TextEditingController ageController;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.l,
        vertical: AppSpacing.m,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: AppSpacing.xl),

          // Icon
          const Icon(
            Icons.child_care_rounded,
            size: 64,
            color: AppColors.coralPrimary,
          ),
          const SizedBox(height: AppSpacing.l),

          // Title
          Text(
            'Khai báo tuổi con',
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.s),

          // Subtitle
          Text(
            'Vui lòng cho biết tuổi con bạn để chúng tôi '
            'cá nhân hóa trải nghiệm phù hợp.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xl),

          // Age input
          BlocBuilder<ConsentBloc, ConsentState>(
            buildWhen: (prev, curr) {
              final prevAge = prev is ConsentFilling ? prev.childAge : null;
              final currAge = curr is ConsentFilling ? curr.childAge : null;
              final prevWarning =
                  prev is ConsentFilling && prev.isAgeWarning;
              final currWarning =
                  curr is ConsentFilling && curr.isAgeWarning;
              return prevAge != currAge || prevWarning != currWarning;
            },
            builder: (context, state) {
              final isWarning =
                  state is ConsentFilling && state.isAgeWarning;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: ageController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(2),
                    ],
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall,
                    decoration: InputDecoration(
                      labelText: 'Tuổi con',
                      hintText: 'Ví dụ: 12',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onChanged: (value) {
                      final age = int.tryParse(value);
                      if (age != null) {
                        context
                            .read<ConsentBloc>()
                            .add(ConsentAgeChanged(age));
                      }
                    },
                  ),

                  // Warning for age outside 10–15 range
                  if (isWarning) ...[
                    const SizedBox(height: AppSpacing.s),
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.m),
                      decoration: BoxDecoration(
                        color: AppColors.amberTertiary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.info_outline_rounded,
                            color: AppColors.amberTertiary,
                            size: 20,
                          ),
                          const SizedBox(width: AppSpacing.s),
                          Expanded(
                            child: Text(
                              'App được thiết kế cho trẻ 10–15 tuổi, '
                              'nhưng bạn vẫn có thể tiếp tục',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurface,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xl),

          // Next button
          BlocBuilder<ConsentBloc, ConsentState>(
            builder: (context, state) {
              final isAgeValid =
                  state is ConsentFilling && state.isAgeValid;

              return FilledButton(
                onPressed: isAgeValid ? onNext : null,
                child: const Text('Tiếp theo'),
              );
            },
          ),
        ],
      ),
    );
  }
}

/// Step 2: Consent confirmation.
class _ConsentStep extends StatelessWidget {
  const _ConsentStep({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.l,
        vertical: AppSpacing.m,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Back button
          Align(
            alignment: Alignment.centerLeft,
            child: IconButton(
              onPressed: onBack,
              icon: const Icon(Icons.arrow_back_rounded),
              tooltip: 'Quay lại',
            ),
          ),
          const SizedBox(height: AppSpacing.s),

          // Title
          Text(
            'Đồng ý sử dụng',
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.l),

          // Data collected section
          const _DataSection(
            icon: Icons.check_circle_outline_rounded,
            iconColor: AppColors.skyBlueSecondary,
            title: 'Dữ liệu thu thập',
            items: [
              'Hồ sơ con (tên, avatar)',
              'Tiến độ học tập',
              'Điểm phát âm',
            ],
          ),
          const SizedBox(height: AppSpacing.m),

          // Data NOT collected section
          const _DataSection(
            icon: Icons.shield_outlined,
            iconColor: AppColors.softGreen,
            title: 'Dữ liệu KHÔNG thu thập',
            items: [
              'Bản ghi âm giọng nói',
              'Vị trí',
              'Danh bạ',
              'Sinh trắc học',
            ],
          ),
          const SizedBox(height: AppSpacing.m),

          // Retention policy
          Container(
            padding: const EdgeInsets.all(AppSpacing.m),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.schedule_rounded,
                  color: theme.colorScheme.onSurfaceVariant,
                  size: 20,
                ),
                const SizedBox(width: AppSpacing.s),
                Expanded(
                  child: Text(
                    'Tự động xóa sau 12 tháng không hoạt động',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s),

          // Privacy policy link
          TextButton.icon(
            onPressed: () => _openPrivacyPolicy(context),
            icon: const Icon(Icons.open_in_new_rounded, size: 16),
            label: const Text('Xem Chính sách Bảo mật'),
          ),
          const SizedBox(height: AppSpacing.l),

          // Consent checkbox
          BlocBuilder<ConsentBloc, ConsentState>(
            buildWhen: (prev, curr) {
              final prevChecked =
                  prev is ConsentFilling && prev.isCheckboxChecked;
              final currChecked =
                  curr is ConsentFilling && curr.isCheckboxChecked;
              return prevChecked != currChecked;
            },
            builder: (context, state) {
              final isChecked =
                  state is ConsentFilling && state.isCheckboxChecked;

              return CheckboxListTile(
                value: isChecked,
                onChanged: (value) {
                  context
                      .read<ConsentBloc>()
                      .add(ConsentCheckboxToggled(checked: value ?? false));
                },
                title: Text(
                  'Tôi đồng ý cho con sử dụng ứng dụng theo '
                  'các điều khoản trên',
                  style: theme.textTheme.bodyMedium,
                ),
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
                activeColor: AppColors.coralPrimary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              );
            },
          ),
          const SizedBox(height: AppSpacing.l),

          // Submit button
          BlocBuilder<ConsentBloc, ConsentState>(
            builder: (context, state) {
              final isSubmitting = state is ConsentSubmitting;
              final isFormValid =
                  state is ConsentFilling && state.isFormValid;

              return FilledButton(
                onPressed: isSubmitting || !isFormValid
                    ? null
                    : () => context
                        .read<ConsentBloc>()
                        .add(const ConsentSubmitted()),
                child: isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Đồng ý & Tiếp tục'),
              );
            },
          ),
          const SizedBox(height: AppSpacing.l),
        ],
      ),
    );
  }

  void _openPrivacyPolicy(BuildContext context) {
    final uri = Uri.parse(AppConstants.privacyPolicyUrl);
    unawaited(
      launchUrl(uri, mode: LaunchMode.externalApplication).then((launched) {
        if (!launched && context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Không thể mở trang chính sách bảo mật. '
                'Vui lòng thử lại.',
              ),
            ),
          );
        }
      }),
    );
  }
}

/// A section showing data practices with icon and bullet list.
class _DataSection extends StatelessWidget {
  const _DataSection({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.items,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final List<String> items;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: AppSpacing.s),
              Text(
                title,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(
                left: 28,
                bottom: AppSpacing.xs,
              ),
              child: Row(
                children: [
                  Container(
                    width: 4,
                    height: 4,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.onSurfaceVariant,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.s),
                  Expanded(
                    child: Text(
                      item,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
