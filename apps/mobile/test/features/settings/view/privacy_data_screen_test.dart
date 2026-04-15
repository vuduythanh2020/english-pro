/// Widget Tests — Story 2.7: PrivacyDataScreen
/// TDD RED Phase — tests generated before implementation
library;

import 'package:bloc_test/bloc_test.dart';
import 'package:english_pro/features/settings/bloc/privacy_data_bloc.dart';
import 'package:english_pro/features/settings/bloc/privacy_data_event.dart';
import 'package:english_pro/features/settings/bloc/privacy_data_state.dart';
import 'package:english_pro/features/settings/models/child_data_model.dart';
import 'package:english_pro/features/settings/view/privacy_data_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockPrivacyDataBloc extends MockBloc<PrivacyDataEvent, PrivacyDataState>
    implements PrivacyDataBloc {}

ChildDataModel _buildMockModel() => ChildDataModel.fromJson({
  'profile': {'id': 'child-123', 'name': 'Minh', 'avatar': 2, 'age': 7, 'createdAt': '2026-01-15T10:00:00Z'},
  'learningProgress': {'totalSessions': 5, 'sessions': []},
  'pronunciationScores': [],
  'badges': [],
  'exportedAt': '2026-04-14T10:00:00Z',
});

Widget _buildTestWidget(MockPrivacyDataBloc bloc) {
  return MaterialApp(
    home: BlocProvider<PrivacyDataBloc>.value(
      value: bloc,
      child: const PrivacyDataScreen(),
    ),
  );
}

void main() {
  late MockPrivacyDataBloc mockBloc;

  setUp(() {
    mockBloc = MockPrivacyDataBloc();
  });

  group('PrivacyDataScreen', () {
    testWidgets('FLUTTER-2.7-SCR-001: shows loading indicator when loading', (tester) async {
      when(() => mockBloc.state).thenReturn(const PrivacyDataLoading());

      await tester.pumpWidget(_buildTestWidget(mockBloc));

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('FLUTTER-2.7-SCR-002: shows 3 sections when loaded (Policy, Child Data, Danger Zone)', (tester) async {
      when(() => mockBloc.state).thenReturn(PrivacyDataLoaded(data: _buildMockModel()));

      await tester.pumpWidget(_buildTestWidget(mockBloc));
      await tester.pump();

      // Should have Privacy Policy section
      expect(find.textContaining('Chính sách'), findsWidgets);
      // Should have Child Data section
      expect(find.textContaining('Dữ liệu'), findsWidgets);
      // Should have Danger Zone / Delete section
      expect(find.textContaining('Xóa'), findsAtLeastNWidgets(1));
    });

    testWidgets('FLUTTER-2.7-SCR-003: shows delete confirmation dialog on tap Xóa tài khoản', (tester) async {
      when(() => mockBloc.state).thenReturn(PrivacyDataLoaded(data: _buildMockModel()));

      await tester.pumpWidget(_buildTestWidget(mockBloc));
      await tester.pump();

      // Find and tap "Xóa tài khoản"
      final deleteButton = find.textContaining('Xóa tài khoản');
      expect(deleteButton, findsOneWidget);
      await tester.tap(deleteButton);
      await tester.pumpAndSettle();

      // Dialog should appear
      expect(find.byType(AlertDialog), findsOneWidget);
    });

    testWidgets('FLUTTER-2.7-SCR-004: delete dialog has disabled confirm button before typing XOA', (tester) async {
      when(() => mockBloc.state).thenReturn(PrivacyDataLoaded(data: _buildMockModel()));

      await tester.pumpWidget(_buildTestWidget(mockBloc));
      await tester.pump();

      // Open delete dialog
      await tester.tap(find.textContaining('Xóa tài khoản'));
      await tester.pumpAndSettle();

      // The confirm button should be disabled initially
      final confirmButton = find.text('Xóa vĩnh viễn');
      expect(confirmButton, findsOneWidget);

      // Get the TextButton and check it's disabled
      final button = tester.widget<TextButton>(
        find.ancestor(of: confirmButton, matching: find.byType(TextButton)),
      );
      expect(button.onPressed, isNull);
    });

    testWidgets('FLUTTER-2.7-SCR-005: delete dialog enables confirm button after typing XOA', (tester) async {
      when(() => mockBloc.state).thenReturn(PrivacyDataLoaded(data: _buildMockModel()));

      await tester.pumpWidget(_buildTestWidget(mockBloc));
      await tester.pump();

      // Open delete dialog
      await tester.tap(find.textContaining('Xóa tài khoản'));
      await tester.pumpAndSettle();

      // Type "XÓA" in the confirmation field
      await tester.enterText(find.byType(TextField), 'XÓA');
      await tester.pump();

      // Confirm button should now be enabled
      final confirmButton = find.textContaining('Xóa vĩnh viễn');
      final button = tester.widget<TextButton>(
        find.ancestor(of: confirmButton, matching: find.byType(TextButton)),
      );
      expect(button.onPressed, isNotNull);
    });

    testWidgets('FLUTTER-2.7-SCR-006: shows SnackBar on PrivacyDataExportSuccess', (tester) async {
      whenListen(
        mockBloc,
        Stream.fromIterable([
          PrivacyDataLoaded(data: _buildMockModel()),
          const PrivacyDataExportSuccess(),
        ]),
        initialState: PrivacyDataLoaded(data: _buildMockModel()),
      );

      await tester.pumpWidget(_buildTestWidget(mockBloc));
      await tester.pump();
      await tester.pump();

      expect(find.byType(SnackBar), findsOneWidget);
    });

    testWidgets('FLUTTER-2.7-SCR-007: shows error SnackBar on PrivacyDataFailure', (tester) async {
      whenListen(
        mockBloc,
        Stream.fromIterable([
          PrivacyDataLoaded(data: _buildMockModel()),
          PrivacyDataFailure(
            message: 'Đã có lỗi xảy ra',
          ),
        ]),
        initialState: PrivacyDataLoaded(data: _buildMockModel()),
      );

      await tester.pumpWidget(_buildTestWidget(mockBloc));
      await tester.pump();
      await tester.pump();

      expect(find.byType(SnackBar), findsOneWidget);
    });
  });
}
