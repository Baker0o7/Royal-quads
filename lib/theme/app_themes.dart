import 'package:flutter/services.dart';
import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────────────────
// App Theme Variants
// ─────────────────────────────────────────────────────────────────────────────

enum AppTheme {
  materialYou,    // Follows Android 12+ wallpaper colour
  desertGold,
  oceanBreeze,
  forestNight,
  midnightPurple,
  crimsonSunset,
  slatePro,
}

extension AppThemeX on AppTheme {
  String get id => name;

  String get label => const {
    AppTheme.materialYou:    'Material You',
    AppTheme.desertGold:     'Desert Gold',
    AppTheme.oceanBreeze:    'Ocean Breeze',
    AppTheme.forestNight:    'Forest Night',
    AppTheme.midnightPurple: 'Midnight Purple',
    AppTheme.crimsonSunset:  'Crimson Sunset',
    AppTheme.slatePro:       'Slate Pro',
  }[this]!;

  String get emoji => const {
    AppTheme.materialYou:    '✨',
    AppTheme.desertGold:     '🏜️',
    AppTheme.oceanBreeze:    '🌊',
    AppTheme.forestNight:    '🌲',
    AppTheme.midnightPurple: '🔮',
    AppTheme.crimsonSunset:  '🌅',
    AppTheme.slatePro:       '🪨',
  }[this]!;

  String get description => const {
    AppTheme.materialYou:    'Adapts to your wallpaper (Android 12+)',
    AppTheme.desertGold:     'Warm sand and gold — the classic Royal look',
    AppTheme.oceanBreeze:    'Cool coastal blue tones',
    AppTheme.forestNight:    'Natural forest greens',
    AppTheme.midnightPurple: 'Deep violet and cosmic purples',
    AppTheme.crimsonSunset:  'Bold reds and sunset oranges',
    AppTheme.slatePro:       'Neutral professional greys',
  }[this]!;

  bool get isDynamic => this == AppTheme.materialYou;

  // Seed colour used for ColorScheme.fromSeed()
  Color get seedColor => const {
    AppTheme.materialYou:    Color(0xFFC9972A), // fallback if no dynamic
    AppTheme.desertGold:     Color(0xFFC9972A),
    AppTheme.oceanBreeze:    Color(0xFF0EA5E9),
    AppTheme.forestNight:    Color(0xFF22C55E),
    AppTheme.midnightPurple: Color(0xFF8B5CF6),
    AppTheme.crimsonSunset:  Color(0xFFEF4444),
    AppTheme.slatePro:       Color(0xFF64748B),
  }[this]!;

  // Hero gradient backgrounds for app bars / headers
  Color get heroBg => const {
    AppTheme.materialYou:    Color(0xFF1A1612),
    AppTheme.desertGold:     Color(0xFF2D2318),
    AppTheme.oceanBreeze:    Color(0xFF0C1A2E),
    AppTheme.forestNight:    Color(0xFF0D1F14),
    AppTheme.midnightPurple: Color(0xFF1A0D2E),
    AppTheme.crimsonSunset:  Color(0xFF2D0E0E),
    AppTheme.slatePro:       Color(0xFF1A2030),
  }[this]!;

  Color get heroMid => const {
    AppTheme.materialYou:    Color(0xFF0D0B09),
    AppTheme.desertGold:     Color(0xFF1A1008),
    AppTheme.oceanBreeze:    Color(0xFF061020),
    AppTheme.forestNight:    Color(0xFF071309),
    AppTheme.midnightPurple: Color(0xFF10061A),
    AppTheme.crimsonSunset:  Color(0xFF1A0808),
    AppTheme.slatePro:       Color(0xFF101520),
  }[this]!;

  LinearGradient get gradient => LinearGradient(
    colors: [heroBg, heroMid],
    begin: Alignment.topLeft, end: Alignment.bottomRight,
  );

  // Build gradient using a resolved primary colour (for Material You)
  LinearGradient gradientFrom(Color primary) {
    final dark = Color.lerp(primary, Colors.black, 0.85)!;
    final darker = Color.lerp(primary, Colors.black, 0.95)!;
    return LinearGradient(
      colors: [dark, darker],
      begin: Alignment.topLeft, end: Alignment.bottomRight,
    );
  }

  static AppTheme fromId(String id) =>
      AppTheme.values.firstWhere((t) => t.name == id,
          orElse: () => AppTheme.desertGold);
}

// ─────────────────────────────────────────────────────────────────────────────
// ColorScheme builders — uses fromSeed for proper M3 tonal palette
// ─────────────────────────────────────────────────────────────────────────────

ColorScheme _lightScheme(Color seed) => ColorScheme.fromSeed(
  seedColor: seed,
  brightness: Brightness.light,
  // Tighten surface to warm cream regardless of seed
  surface: const Color(0xFFFCF9F4),
);

ColorScheme _darkScheme(Color seed) => ColorScheme.fromSeed(
  seedColor: seed,
  brightness: Brightness.dark,
  surface: const Color(0xFF0F0D0A),
);

// ─────────────────────────────────────────────────────────────────────────────
// Full ThemeData builders
// ─────────────────────────────────────────────────────────────────────────────

ThemeData buildLightTheme(AppTheme t, {ColorScheme? dynamicScheme}) {
  final scheme = dynamicScheme ?? _lightScheme(t.seedColor);
  return _buildTheme(scheme, t, false);
}

ThemeData buildDarkTheme(AppTheme t, {ColorScheme? dynamicScheme}) {
  final scheme = dynamicScheme ?? _darkScheme(t.seedColor);
  return _buildTheme(scheme, t, true);
}

ThemeData _buildTheme(ColorScheme scheme, AppTheme t, bool dark) {
  // Derive surface colours from the scheme for consistency
  final scaffoldBg = dark
      ? Color.lerp(scheme.surface, Colors.black, 0.3)!
      : Color.lerp(scheme.surface, Colors.white, 0.4)!;
  final cardBg = dark
      ? Color.lerp(scheme.surfaceContainerHighest, Colors.black, 0.1)!
      : Colors.white;
  final dividerColor = dark
      ? scheme.outlineVariant.withAlpha(80)
      : scheme.outlineVariant.withAlpha(120);
  final heroColor = dark
      ? Color.lerp(scheme.primary, Colors.black, 0.85)!
      : Color.lerp(scheme.primary, Colors.black, 0.8)!;

  return ThemeData(
    useMaterial3: true,
    brightness: dark ? Brightness.dark : Brightness.light,
    colorScheme: scheme,
    fontFamily: 'DM Sans',
    cardColor: cardBg,
    scaffoldBackgroundColor: scaffoldBg,

    // ── AppBar ──────────────────────────────────────────────────────────────
    appBarTheme: AppBarTheme(
      backgroundColor: heroColor,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      scrolledUnderElevation: 0,
      systemOverlayStyle: dark
          ? const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: Brightness.light,
              systemNavigationBarColor: Colors.transparent,
              systemNavigationBarIconBrightness: Brightness.light)
          : const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: Brightness.light,
              systemNavigationBarColor: Colors.transparent,
              systemNavigationBarIconBrightness: Brightness.dark),
    ),

    // ── Buttons ─────────────────────────────────────────────────────────────
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        elevation: 0,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),

    // ── Input fields ─────────────────────────────────────────────────────────
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: cardBg,
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: dividerColor)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: dividerColor, width: 1.5)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: scheme.primary, width: 2)),
      errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: scheme.error, width: 1.5)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      labelStyle: TextStyle(color: scheme.onSurfaceVariant, fontSize: 14),
      hintStyle: TextStyle(color: scheme.onSurfaceVariant.withAlpha(140)),
      prefixIconColor: scheme.onSurfaceVariant,
    ),

    // ── SnackBar ─────────────────────────────────────────────────────────────
    snackBarTheme: SnackBarThemeData(
      backgroundColor: dark ? scheme.inverseSurface : scheme.inverseSurface,
      contentTextStyle: TextStyle(
          color: scheme.onInverseSurface,
          fontFamily: 'DM Sans', fontSize: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      behavior: SnackBarBehavior.floating,
      insetPadding: const EdgeInsets.all(12),
    ),

    // ── Chips ────────────────────────────────────────────────────────────────
    chipTheme: ChipThemeData(
      backgroundColor: dark
          ? scheme.surfaceContainerHighest
          : scheme.surfaceContainerLow,
      labelStyle: TextStyle(
          color: scheme.onSurface, fontSize: 12),
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20)),
      side: BorderSide(color: dividerColor),
    ),

    // ── Divider ──────────────────────────────────────────────────────────────
    dividerTheme: DividerThemeData(
        color: dividerColor, thickness: 1, space: 24),

    // ── Switch / Checkbox / Radio ─────────────────────────────────────────
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) =>
          states.contains(WidgetState.selected) ? scheme.onPrimary : null),
      trackColor: WidgetStateProperty.resolveWith((states) =>
          states.contains(WidgetState.selected) ? scheme.primary : null),
    ),

    // ── Progress indicators ───────────────────────────────────────────────
    progressIndicatorTheme: ProgressIndicatorThemeData(
      color: scheme.primary,
      linearTrackColor: scheme.primaryContainer,
      circularTrackColor: scheme.primaryContainer,
    ),

    // ── Bottom nav / NavigationBar ────────────────────────────────────────
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: heroColor,
      indicatorColor: scheme.primary.withAlpha(30),
      labelTextStyle: WidgetStateProperty.resolveWith((states) =>
          TextStyle(
            fontSize: 10,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700 : FontWeight.w400,
            fontFamily: 'DM Sans',
          )),
    ),

    // ── ListTile ─────────────────────────────────────────────────────────
    listTileTheme: const ListTileThemeData(
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    ),

    // ── Card ─────────────────────────────────────────────────────────────
    cardTheme: CardThemeData(
      color: cardBg,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: dividerColor, width: 1),
      ),
    ),

    // ── Dialog ───────────────────────────────────────────────────────────
    dialogTheme: DialogThemeData(
      backgroundColor: cardBg,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24)),
    ),

    // ── Bottom sheet ─────────────────────────────────────────────────────
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: scaffoldBg,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      showDragHandle: false,
    ),

    // ── Date picker ───────────────────────────────────────────────────────
    datePickerTheme: DatePickerThemeData(
      backgroundColor: cardBg,
      headerBackgroundColor: scheme.primaryContainer,
      headerForegroundColor: scheme.onPrimaryContainer,
      todayBorder: BorderSide(color: scheme.primary, width: 1.5),
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20)),
    ),

    // ── Tab bar ───────────────────────────────────────────────────────────
    tabBarTheme: TabBarThemeData(
      indicatorColor: scheme.primary,
      labelColor: scheme.primary,
      unselectedLabelColor: Colors.white38,
      indicatorSize: TabBarIndicatorSize.label,
      dividerColor: Colors.transparent,
    ),
  );
}
