import 'package:english_pro/app/app.dart';
import 'package:english_pro/bootstrap.dart';

Future<void> main() async {
  await bootstrap((deps) => App(deps: deps));
}
