import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/features/auth/bloc/login_bloc.dart';
import 'package:english_pro/features/auth/bloc/login_event.dart';
import 'package:english_pro/features/auth/bloc/login_state.dart';
import 'package:english_pro/features/auth/widgets/email_input.dart';
import 'package:english_pro/features/auth/widgets/password_input.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

/// Login screen for parent accounts.
///
/// Provides email + password form with realtime validation.
/// No password strength indicator (this is Login, not Registration).
class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<LoginBloc, LoginState>(
      listener: (context, state) {
        if (state is LoginSuccess) {
          // Dispatch AuthLoggedIn to AuthBloc → triggers GoRouter redirect
          context.read<AuthBloc>().add(
            AuthLoggedIn(
              accessToken: state.accessToken,
              refreshToken: state.refreshToken,
            ),
          );
        }
        if (state is LoginFailure) {
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
                    'Đăng nhập',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Chào mừng bạn trở lại',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),

                  // Email field
                  BlocBuilder<LoginBloc, LoginState>(
                    buildWhen: (prev, curr) =>
                        prev.form.email != curr.form.email ||
                        prev.form.emailError != curr.form.emailError,
                    builder: (context, state) {
                      return EmailInput(
                        onChanged: (email) => context
                            .read<LoginBloc>()
                            .add(LoginEmailChanged(email)),
                        errorText: state.form.email.isNotEmpty
                            ? state.form.emailError
                            : null,
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Password field (no strength indicator for login)
                  BlocBuilder<LoginBloc, LoginState>(
                    buildWhen: (prev, curr) =>
                        prev.form.password != curr.form.password ||
                        prev.form.passwordError != curr.form.passwordError,
                    builder: (context, state) {
                      return PasswordInput(
                        onChanged: (password) => context
                            .read<LoginBloc>()
                            .add(LoginPasswordChanged(password)),
                        errorText: state.form.password.isNotEmpty
                            ? state.form.passwordError
                            : null,
                      );
                    },
                  ),
                  const SizedBox(height: 24),

                  // Submit button
                  BlocBuilder<LoginBloc, LoginState>(
                    builder: (context, state) {
                      final isSubmitting = state is LoginSubmitting;
                      final isValid = state.form.isValid;

                      return FilledButton(
                        onPressed: isSubmitting || !isValid
                            ? null
                            : () => context
                                .read<LoginBloc>()
                                .add(const LoginSubmitted()),
                        child: isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Đăng nhập ngay'),
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Registration link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Chưa có tài khoản? '),
                      TextButton(
                        onPressed: () => context.go('/register'),
                        child: const Text('Đăng ký'),
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
