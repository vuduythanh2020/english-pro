/// Unit Tests - Story 1.5: ConnectivityCubit
library;

import 'dart:async';

import 'package:english_pro/core/network/connectivity_cubit.dart';
import 'package:english_pro/core/network/connectivity_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockConnectivityService extends Mock implements ConnectivityService {}

void main() {
  late MockConnectivityService mockService;

  setUp(() {
    mockService = MockConnectivityService();
  });

  group('ConnectivityCubit', () {
    test('emits ConnectivityOnline when connected', () async {
      when(() => mockService.checkConnectivity()).thenAnswer((_) async => true);
      when(
        () => mockService.onConnectivityChanged,
      ).thenAnswer((_) => const Stream<bool>.empty());

      final cubit = ConnectivityCubit(
        connectivityService: mockService,
      );
      addTearDown(cubit.close);

      // Wait for _init() to complete.
      await Future<void>.delayed(Duration.zero);

      expect(cubit.state, isA<ConnectivityOnline>());
    });

    test('emits ConnectivityOffline when disconnected', () async {
      when(
        () => mockService.checkConnectivity(),
      ).thenAnswer((_) async => false);
      when(
        () => mockService.onConnectivityChanged,
      ).thenAnswer((_) => const Stream<bool>.empty());

      final cubit = ConnectivityCubit(
        connectivityService: mockService,
      );
      addTearDown(cubit.close);

      await Future<void>.delayed(Duration.zero);

      expect(cubit.state, isA<ConnectivityOffline>());
    });

    test('reacts to connectivity changes via stream', () async {
      final controller = StreamController<bool>();
      addTearDown(controller.close);

      when(() => mockService.checkConnectivity()).thenAnswer((_) async => true);
      when(
        () => mockService.onConnectivityChanged,
      ).thenAnswer((_) => controller.stream);

      final cubit = ConnectivityCubit(
        connectivityService: mockService,
      );
      addTearDown(cubit.close);

      await Future<void>.delayed(Duration.zero);
      expect(cubit.state, isA<ConnectivityOnline>());

      controller.add(false);
      await Future<void>.delayed(Duration.zero);
      expect(cubit.state, isA<ConnectivityOffline>());

      controller.add(true);
      await Future<void>.delayed(Duration.zero);
      expect(cubit.state, isA<ConnectivityOnline>());
    });
  });
}
