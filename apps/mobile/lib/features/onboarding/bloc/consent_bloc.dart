import 'package:english_pro/core/api/exceptions/app_exception.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/features/onboarding/bloc/consent_event.dart';
import 'package:english_pro/features/onboarding/bloc/consent_state.dart';
import 'package:english_pro/features/onboarding/repositories/consent_repository.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

/// Manages the parental consent form state and submission.
///
/// Uses a two-step flow:
/// 1. Age declaration — parent enters child's age (1–18)
/// 2. Consent confirmation — parent checks consent checkbox and submits
///
/// On success, dispatches [AuthConsentGranted] to [AuthBloc] which
/// triggers GoRouter to redirect from `/consent` → `/home`.
class ConsentBloc extends Bloc<ConsentEvent, ConsentState> {
  ConsentBloc({
    required ConsentRepository consentRepository,
    required AuthBloc authBloc,
  }) : _consentRepository = consentRepository,
       _authBloc = authBloc,
       super(const ConsentInitial()) {
    on<ConsentAgeChanged>(_onAgeChanged);
    on<ConsentCheckboxToggled>(_onCheckboxToggled);
    on<ConsentSubmitted>(_onSubmitted);
  }

  final ConsentRepository _consentRepository;
  final AuthBloc _authBloc;

  /// Tracks the current form values across state transitions.
  int? _currentAge;
  bool _currentCheckbox = false;

  void _onAgeChanged(
    ConsentAgeChanged event,
    Emitter<ConsentState> emit,
  ) {
    _currentAge = event.age;
    // Reset checkbox whenever age changes — user must re-confirm consent
    // if they navigate back to step 1 and modify the declared age.
    _currentCheckbox = false;
    final isAgeValid = event.age >= 1 && event.age <= 18;
    final isAgeWarning = isAgeValid && (event.age < 10 || event.age > 15);

    emit(
      ConsentFilling(
        childAge: event.age,
        isCheckboxChecked: false,
        isAgeWarning: isAgeWarning,
      ),
    );
  }

  void _onCheckboxToggled(
    ConsentCheckboxToggled event,
    Emitter<ConsentState> emit,
  ) {
    _currentCheckbox = event.checked;

    final isAgeValid =
        _currentAge != null && _currentAge! >= 1 && _currentAge! <= 18;
    final isAgeWarning =
        isAgeValid && (_currentAge! < 10 || _currentAge! > 15);

    emit(
      ConsentFilling(
        childAge: _currentAge,
        isCheckboxChecked: event.checked,
        isAgeWarning: isAgeWarning,
      ),
    );
  }

  Future<void> _onSubmitted(
    ConsentSubmitted event,
    Emitter<ConsentState> emit,
  ) async {
    // Validate before submitting
    if (_currentAge == null ||
        _currentAge! < 1 ||
        _currentAge! > 18 ||
        !_currentCheckbox) {
      emit(
        ConsentFailure(
          message: 'Vui lòng nhập tuổi hợp lệ và đồng ý điều khoản',
        ),
      );
      return;
    }

    emit(const ConsentSubmitting());

    try {
      await _consentRepository.grantConsent(childAge: _currentAge!);

      // Dispatch AuthConsentGranted → AuthBloc updates hasConsent → GoRouter
      // redirects to /home (via ConsentGuard in router.dart).
      _authBloc.add(const AuthConsentGranted());

      emit(const ConsentSuccess());
    } on AppException catch (e) {
      emit(ConsentFailure(message: e.message));
    } on Exception catch (_) {
      emit(
        ConsentFailure(
          message: 'Gửi đồng ý thất bại. Vui lòng thử lại.',
        ),
      );
    }
  }
}
