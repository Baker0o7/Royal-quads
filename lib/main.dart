import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/app_provider.dart';
import 'router.dart';
import 'services/storage.dart';
import 'theme/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));

  await StorageService.init();

  runApp(
    ChangeNotifierProvider(
      create: (_) => AppProvider()..initTheme(),
      child: const RoyalQuadApp(),
    ),
  );
}

class RoyalQuadApp extends StatelessWidget {
  const RoyalQuadApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeMode = context.watch<AppProvider>().themeMode;
    return MaterialApp.router(
      title: 'Royal Quad Bikes',
      theme: kTheme,
      darkTheme: kDarkTheme,
      themeMode: themeMode,
      routerConfig: appRouter,
      debugShowCheckedModeBanner: false,
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(textScaler: TextScaler.noScaling),
        child: child!,
      ),
    );
  }
}
