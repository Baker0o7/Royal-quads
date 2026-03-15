import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Theme variant system — 6 full themes
// ─────────────────────────────────────────────────────────────────────────────

enum AppTheme {
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
    AppTheme.desertGold:     'Desert Gold',
    AppTheme.oceanBreeze:    'Ocean Breeze',
    AppTheme.forestNight:    'Forest Night',
    AppTheme.midnightPurple: 'Midnight Purple',
    AppTheme.crimsonSunset:  'Crimson Sunset',
    AppTheme.slatePro:       'Slate Pro',
  }[this]!;

  String get emoji => const {
    AppTheme.desertGold:     '🏜️',
    AppTheme.oceanBreeze:    '🌊',
    AppTheme.forestNight:    '🌲',
    AppTheme.midnightPurple: '🔮',
    AppTheme.crimsonSunset:  '🌅',
    AppTheme.slatePro:       '🪨',
  }[this]!;

  Color get primary => const {
    AppTheme.desertGold:     Color(0xFFC9972A),
    AppTheme.oceanBreeze:    Color(0xFF0EA5E9),
    AppTheme.forestNight:    Color(0xFF22C55E),
    AppTheme.midnightPurple: Color(0xFF8B5CF6),
    AppTheme.crimsonSunset:  Color(0xFFEF4444),
    AppTheme.slatePro:       Color(0xFF64748B),
  }[this]!;

  Color get primary2 => const {
    AppTheme.desertGold:     Color(0xFFE8B84B),
    AppTheme.oceanBreeze:    Color(0xFF38BDF8),
    AppTheme.forestNight:    Color(0xFF4ADE80),
    AppTheme.midnightPurple: Color(0xFFA78BFA),
    AppTheme.crimsonSunset:  Color(0xFFF97316),
    AppTheme.slatePro:       Color(0xFF94A3B8),
  }[this]!;

  Color get heroBg => const {
    AppTheme.desertGold:     Color(0xFF2D2318),
    AppTheme.oceanBreeze:    Color(0xFF0C1A2E),
    AppTheme.forestNight:    Color(0xFF0D1F14),
    AppTheme.midnightPurple: Color(0xFF1A0D2E),
    AppTheme.crimsonSunset:  Color(0xFF2D0E0E),
    AppTheme.slatePro:       Color(0xFF1A2030),
  }[this]!;

  Color get heroMid => const {
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

  LinearGradient get accentGradient => LinearGradient(
    colors: [primary2, primary, Color.lerp(primary, Colors.black, 0.2)!],
    begin: Alignment.topLeft, end: Alignment.bottomRight,
  );

  static AppTheme fromId(String id) =>
      AppTheme.values.firstWhere((t) => t.name == id,
          orElse: () => AppTheme.desertGold);
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemeData builder
// ─────────────────────────────────────────────────────────────────────────────

ThemeData buildLightTheme(AppTheme t) => ThemeData(
  useMaterial3: true,
  cardColor: Colors.white,
  scaffoldBackgroundColor: const Color(0xFFF7F2EA),
  colorScheme: ColorScheme.light(
    primary: t.primary, secondary: t.primary2,
    surface: const Color(0xFFFCF9F4),
    onSurface: const Color(0xFF1A1612),
    error: const Color(0xFFDC2626),
  ),
  fontFamily: 'DM Sans',
  appBarTheme: AppBarTheme(
    backgroundColor: t.heroMid, foregroundColor: Colors.white,
    elevation: 0, centerTitle: true, scrolledUnderElevation: 0,
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: t.primary, foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      elevation: 0,
    ),
  ),
  inputDecorationTheme: _inputTheme(t.primary, false),
  snackBarTheme: _snackTheme(false),
  chipTheme: const ChipThemeData(
    backgroundColor: Color(0xFFEEE6D2),
    labelStyle: TextStyle(color: Color(0xFF1A1612), fontSize: 12),
  ),
  dividerTheme: const DividerThemeData(
      color: Color(0xFFE2D8C6), thickness: 1, space: 24),
);

ThemeData buildDarkTheme(AppTheme t) => ThemeData(
  useMaterial3: true,
  cardColor: const Color(0xFF201C18),
  brightness: Brightness.dark,
  scaffoldBackgroundColor: const Color(0xFF0F0D0A),
  colorScheme: ColorScheme.dark(
    primary: t.primary, secondary: t.primary2,
    surface: const Color(0xFF0F0D0A),
    onSurface: const Color(0xFFF5EFE6),
    error: const Color(0xFFDC2626),
  ),
  fontFamily: 'DM Sans',
  appBarTheme: AppBarTheme(
    backgroundColor: t.heroMid, foregroundColor: Colors.white,
    elevation: 0, centerTitle: true, scrolledUnderElevation: 0,
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: t.primary, foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      elevation: 0,
    ),
  ),
  inputDecorationTheme: _inputTheme(t.primary, true),
  snackBarTheme: _snackTheme(true),
  dividerTheme: const DividerThemeData(
      color: Color(0xFF2E2820), thickness: 1, space: 24),
);

InputDecorationTheme _inputTheme(Color accent, bool dark) =>
    InputDecorationTheme(
      filled: true,
      fillColor: dark ? const Color(0xFF201C18) : Colors.white,
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
              color: dark ? const Color(0xFF2E2820)
                  : const Color(0xFFE2D8C6))),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
              color: dark ? const Color(0xFF2E2820)
                  : const Color(0xFFE2D8C6), width: 1.5)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: accent, width: 2)),
      errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
              color: Color(0xFFDC2626), width: 1.5)),
      contentPadding: const EdgeInsets.symmetric(
          horizontal: 18, vertical: 16),
      labelStyle: TextStyle(
          color: dark ? const Color(0xFF9A8E7E)
              : const Color(0xFF7A6E60), fontSize: 14),
      hintStyle: TextStyle(
          color: (dark ? const Color(0xFF9A8E7E)
              : const Color(0xFF7A6E60)).withAlpha(140)),
    );

SnackBarThemeData _snackTheme(bool dark) => SnackBarThemeData(
  backgroundColor: dark ? const Color(0xFFF5EFE6) : const Color(0xFF1A1612),
  contentTextStyle: TextStyle(
      color: dark ? const Color(0xFF1A1612) : Colors.white,
      fontFamily: 'DM Sans', fontSize: 14),
  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
  behavior: SnackBarBehavior.floating,
  insetPadding: const EdgeInsets.all(12),
);
