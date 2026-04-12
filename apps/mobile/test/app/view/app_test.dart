/// Widget test for App — requires HydratedBloc storage mock.
library;

import 'package:dio/dio.dart';
import 'package:english_pro/app/app.dart';
import 'package:english_pro/features/auth/view/login_screen.dart';
import 'package:english_pro/bootstrap.dart';
import 'package:english_pro/core/auth/auth_bloc.dart';
import 'package:english_pro/core/auth/auth_event.dart';
import 'package:english_pro/core/network/connectivity_cubit.dart';
import 'package:english_pro/core/network/connectivity_service.dart';
import 'package:english_pro/core/storage/secure_storage_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:mocktail/mocktail.dart';

class MockStorage extends Mock implements Storage {}

class MockFlutterSecureStorage extends Mock
    implements FlutterSecureStorage {}

class MockConnectivity extends Mock implements ConnectivityService {}

void main() {
  late MockStorage mockHydratedStorage;
  late AppDependencies deps;

  setUp(() {
    mockHydratedStorage = MockStorage();

    when(() => mockHydratedStorage.read(any())).thenReturn(null);
    when(
      () => mockHydratedStorage.write(any(), any<dynamic>()),
    ).thenAnswer((_) async {});
    when(
      () => mockHydratedStorage.delete(any()),
    ).thenAnswer((_) async {});
    when(
      () => mockHydratedStorage.clear(),
    ).thenAnswer((_) async {});

    HydratedBloc.storage = mockHydratedStorage;

    final mockSecureFlutter = MockFlutterSecureStorage();
    when(
      () => mockSecureFlutter.read(key: any(named: 'key')),
    ).thenAnswer((_) async => null);
    when(
      () => mockSecureFlutter.write(
        key: any(named: 'key'),
        value: any(named: 'value'),
      ),
    ).thenAnswer((_) async {});
    when(mockSecureFlutter.deleteAll).thenAnswer((_) async {});

    final secureStorage = SecureStorageService(
      storage: mockSecureFlutter,
    );
    final authBloc = AuthBloc(storageService: secureStorage)
      ..add(const AuthStarted());

    final mockConnectivity = MockConnectivity();
    when(mockConnectivity.checkConnectivity)
        .thenAnswer((_) async => true);
    when(
      () => mockConnectivity.onConnectivityChanged,
    ).thenAnswer((_) => const Stream.empty());

    final connectivityCubit = ConnectivityCubit(
      connectivityService: mockConnectivity,
    );

    deps = AppDependencies(
      secureStorage: secureStorage,
      authBloc: authBloc,
      connectivityCubit: connectivityCubit,
      dio: Dio(),
    );
  });

  group('App', () {
    testWidgets(
      'renders LoginPlaceholderScreen for unauthenticated',
      (tester) async {
        await tester.pumpWidget(App(deps: deps));
        // Allow async state initialization.
        await tester.pumpAndSettle();
        expect(
          find.byType(LoginScreen),
          findsOneWidget,
        );
      },
    );
  });
}
