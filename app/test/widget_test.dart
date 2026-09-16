import 'package:flutter_test/flutter_test.dart';
import 'package:imu_app/main.dart';

void main() {
  testWidgets('App loads', (WidgetTester tester) async {
    await tester.pumpWidget(const ImuApp());
    expect(find.text("IM'U"), findsOneWidget);
  });
}
