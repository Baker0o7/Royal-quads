import 'package:dynamic_color/dynamic_color.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/app_provider.dart';
import 'router.dart';
import 'services/storage.dart';
import 'theme/app_themes.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Edge-to-edge display — navigation bar transparent
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarContrastEnforced: false,
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
    final prov    = context.watch<AppProvider>();
    final variant = prov.appTheme;

    // DynamicColorBuilder provides Android 12+ wallpaper-derived colour schemes.
    // On older Android / iOS it provides null — we fall back to our own seed.
    return DynamicColorBuilder(
      builder: (ColorScheme? lightDynamic, ColorScheme? darkDynamic) {
        // Only use dynamic colours when the user has chosen Material You
        final useDynamic = variant.isDynamic;

        final light = buildLightTheme(
          variant,
          dynamicScheme: useDynamic ? lightDynamic : null,
        );
        final dark = buildDarkTheme(
          variant,
          dynamicScheme: useDynamic ? darkDynamic : null,
        );

        // Keep the system navigation bar truly transparent on M3
        return MaterialApp.router(
          title: 'Royal Quad Bikes',
          theme: light,
          darkTheme: dark,
          themeMode: prov.themeMode,
          themeAnimationDuration: const Duration(milliseconds: 350),
          themeAnimationCurve: Curves.easeInOutCubic,
          routerConfig: appRouter,
          debugShowCheckedModeBanner: false,
          builder: (context, child) {
            // Update system UI to match current resolved brightness
            final isDark =
                Theme.of(context).brightness == Brightness.dark;
            SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness:
                  isDark ? Brightness.light : Brightness.dark,
              systemNavigationBarColor: Colors.transparent,
              systemNavigationBarIconBrightness:
                  isDark ? Brightness.light : Brightness.dark,
            ));

            return MediaQuery(
              data: MediaQuery.of(context)
                  .copyWith(textScaler: TextScaler.noScaling),
              child: child!,
            );
          },
        );
      },
    );
  }
}
