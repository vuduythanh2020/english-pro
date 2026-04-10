import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/features/auth/bloc/registration_bloc.dart';
import 'package:english_pro/features/auth/bloc/registration_event.dart';
import 'package:english_pro/features/auth/bloc/registration_state.dart';
import 'package:english_pro/features/auth/widgets/email_input.dart';
import 'package:english_pro/features/auth/widgets/password_input.dart';
import 'package:english_pro/features/auth/widgets/password_strength_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

/// Registration screen for parent accounts.
///
/// Provides email + password form with realtime validation,
/// password strength indicator, and error handling.
class RegistrationScreen extends StatelessWidget {
  const RegistrationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<RegistrationBloc, RegistrationState>(
      listener: (context, state) {
        if (state is RegistrationSuccess) {
          // Dispatch AuthLoggedIn to AuthBloc → triggers GoRouter redirect
          context.read<AuthBloc>().add(
            AuthLoggedIn(
              accessToken: state.accessToken,
              refreshToken: state.refreshToken,
            ),
          );
        }
        if (state is RegistrationFailure) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                content: Text(state.error),
                behavior: SnackBarBehavior.floating,
              ),
            );
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  Text(
                    'Tạo tài khoản',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Đăng ký để quản lý hành trình học tiếng Anh của con',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),

                  // Email field
                  BlocBuilder<RegistrationBloc, RegistrationState>(
                    buildWhen: (prev, curr) =>
                        prev.form.email != curr.form.email ||
                        prev.form.emailError != curr.form.emailError,
                    builder: (context, state) {
                      return EmailInput(
                        onChanged: (email) => context
                            .read<RegistrationBloc>()
                            .add(RegistrationEmailChanged(email)),
                        errorText: state.form.email.isNotEmpty
                            ? state.form.emailError
                            : null,
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Password field
                  BlocBuilder<RegistrationBloc, RegistrationState>(
                    buildWhen: (prev, curr) =>
                        prev.form.password != curr.form.password,
                    builder: (context, state) {
                      return PasswordInput(
                        onChanged: (password) => context
                            .read<RegistrationBloc>()
                            .add(RegistrationPasswordChanged(password)),
                        errorText: null, // Errors shown via strength indicator
                      );
                    },
                  ),
                  const SizedBox(height: 8),

                  // Password strength indicator
                  BlocBuilder<RegistrationBloc, RegistrationState>(
                    buildWhen: (prev, curr) =>
                        prev.form.password != curr.form.password,
                    builder: (context, state) {
                      if (state.form.password.isEmpty) {
                        return const SizedBox.shrink();
                      }
                      return PasswordStrengthIndicator(
                        hasMinLength: state.form.hasMinLength,
                        hasUppercase: state.form.hasUppercase,
                        hasDigit: state.form.hasDigit,
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Display name (optional)
                  TextFormField(
                    onChanged: (name) => context
                        .read<RegistrationBloc>()
                        .add(RegistrationDisplayNameChanged(name)),
                    textInputAction: TextInputAction.done,
                    decoration: const InputDecoration(
                      labelText: 'Tên hiển thị (tùy chọn)',
                      prefixIcon: Icon(Icons.person_outlined),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Submit button
                  BlocBuilder<RegistrationBloc, RegistrationState>(
                    builder: (context, state) {
                      final isSubmitting = state is RegistrationSubmitting;
                      final isValid = state.form.isValid;

                      return FilledButton(
                        onPressed: isSubmitting || !isValid
                            ? null
                            : () => context
                                .read<RegistrationBloc>()
                                .add(const RegistrationSubmitted()),
                        child: isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Đăng ký'),
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Login link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Đã có tài khoản? '),
                      TextButton(
                        onPressed: () => context.go('/login'),
                        child: const Text('Đăng nhập'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
