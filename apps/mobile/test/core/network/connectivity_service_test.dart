import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:english_pro/core/network/connectivity_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockConnectivity extends Mock implements Connectivity {}

void main() {
  late MockConnectivity mockConnectivity;
  late ConnectivityService service;

  setUp(() {
    mockConnectivity = MockConnectivity();
    service = ConnectivityService(connectivity: mockConnectivity);
  });

  group('ConnectivityService', () {
    group('checkConnectivity', () {
      test('returns true when wifi is available', () async {
        when(() => mockConnectivity.checkConnectivity())
            .thenAnswer((_) async => [ConnectivityResult.wifi]);

        final result = await service.checkConnectivity();

        expect(result, isTrue);
        verify(() => mockConnectivity.checkConnectivity()).called(1);
      });

      test('returns true when mobile is available', () async {
        when(() => mockConnectivity.checkConnectivity())
            .thenAnswer((_) async => [ConnectivityResult.mobile]);

        final result = await service.checkConnectivity();

        expect(result, isTrue);
      });

      test('returns true when multiple connections are available', () async {
        when(() => mockConnectivity.checkConnectivity()).thenAnswer(
          (_) async => [ConnectivityResult.wifi, ConnectivityResult.mobile],
        );

        final result = await service.checkConnectivity();

        expect(result, isTrue);
      });

      test('returns false when only none is present', () async {
        when(() => mockConnectivity.checkConnectivity())
            .thenAnswer((_) async => [ConnectivityResult.none]);

        final result = await service.checkConnectivity();

        expect(result, isFalse);
      });

      test('returns true when ethernet is available', () async {
        when(() => mockConnectivity.checkConnectivity())
            .thenAnswer((_) async => [ConnectivityResult.ethernet]);

        final result = await service.checkConnectivity();

        expect(result, isTrue);
      });
    });

    group('onConnectivityChanged', () {
      test('emits true when connection is restored', () async {
        when(() => mockConnectivity.onConnectivityChanged).thenAnswer(
          (_) => Stream.value([ConnectivityResult.wifi]),
        );

        final result = await service.onConnectivityChanged.first;

        expect(result, isTrue);
      });

      test('emits false when connection is lost', () async {
        when(() => mockConnectivity.onConnectivityChanged).thenAnswer(
          (_) => Stream.value([ConnectivityResult.none]),
        );

        final result = await service.onConnectivityChanged.first;

        expect(result, isFalse);
      });

      test('emits sequence of connectivity changes', () async {
        when(() => mockConnectivity.onConnectivityChanged).thenAnswer(
          (_) => Stream.fromIterable([
            [ConnectivityResult.wifi],
            [ConnectivityResult.none],
            [ConnectivityResult.mobile],
          ]),
        );

        final results = await service.onConnectivityChanged.toList();

        expect(results, equals([true, false, true]));
      });
    });
  });
}
