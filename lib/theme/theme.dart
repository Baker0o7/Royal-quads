import 'package:flutter/material.dart';

const kAccent   = Color(0xFFC9972A);
const kAccent2  = Color(0xFFE8B84B);
const kHeroFrom = Color(0xFF2D2318);
const kHeroTo   = Color(0xFF0D0B09);
const kBg       = Color(0xFFF5F0E8);
const kBg2      = Color(0xFFE8DFC9);
const kText     = Color(0xFF1A1612);
const kMuted    = Color(0xFF7A6E60);
const kCard     = Color(0xBFFFFFFF);
const kBorder   = Color(0x40C9B99A);
const kGreen    = Color(0xFF16A34A);
const kRed      = Color(0xFFDC2626);
const kIndigo   = Color(0xFF6366F1);

final kTheme = ThemeData(
  useMaterial3: true,
  scaffoldBackgroundColor: kBg,
  colorScheme: ColorScheme.light(
    primary: kAccent, secondary: kAccent2,
    surface: kBg, onSurface: kText,
  ),
  fontFamily: 'DM Sans',
  appBarTheme: const AppBarTheme(
    backgroundColor: kHeroTo, foregroundColor: Colors.white, elevation: 0,
    centerTitle: true,
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: kText, foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true, fillColor: kBg,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kBorder)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kBorder, width: 1.5)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kAccent, width: 2)),
    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
    hintStyle: const TextStyle(color: kMuted),
  ),
  snackBarTheme: const SnackBarThemeData(
    backgroundColor: kText,
    contentTextStyle: TextStyle(color: Colors.white, fontFamily: 'DM Sans'),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
    behavior: SnackBarBehavior.floating,
  ),
  chipTheme: ChipThemeData(
    backgroundColor: kBg2, labelStyle: const TextStyle(color: kText, fontSize: 12),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: kHeroTo, selectedItemColor: kAccent,
    unselectedItemColor: Colors.white38,
    type: BottomNavigationBarType.fixed,
    elevation: 0,
  ),
);

// ── Common widgets ────────────────────────────────────────────────────────────

class HeroCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double radius;
  const HeroCard({super.key, required this.child, this.padding, this.radius = 24});

  @override
  Widget build(BuildContext context) => Container(
    padding: padding,
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(radius),
      gradient: const LinearGradient(
        colors: [kHeroFrom, kHeroTo],
        begin: Alignment.topLeft, end: Alignment.bottomRight,
      ),
    ),
    child: child,
  );
}

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final Color? color;
  final VoidCallback? onTap;

  const AppCard({super.key, required this.child,
    this.padding = const EdgeInsets.all(16),
    this.radius = 20, this.color, this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? kCard, borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: kBorder),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(10), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: child,
    ),
  );
}

class PrimaryButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onTap;
  final bool loading;
  final Color? color;

  const PrimaryButton({super.key, required this.label,
    this.icon, this.onTap, this.loading = false, this.color});

  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity,
    child: GestureDetector(
      onTap: loading ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: (color ?? kText).withAlpha(loading ? 100 : 255),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: kAccent.withAlpha(60)),
        ),
        child: loading
            ? const Center(child: SizedBox(width: 20, height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)))
            : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                if (icon != null) ...[Icon(icon, size: 18, color: Colors.white), const SizedBox(width: 8)],
                Text(label, style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
              ]),
      ),
    ),
  );
}

class SectionHeading extends StatelessWidget {
  final String text;
  final IconData? icon;
  final Widget? trailing;
  const SectionHeading(this.text, {super.key, this.icon, this.trailing});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(children: [
      if (icon != null) ...[Icon(icon, size: 16, color: kAccent), const SizedBox(width: 6)],
      Expanded(child: Text(text, style: const TextStyle(
          fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 0.4, color: kText))),
      if (trailing != null) trailing!,
    ]),
  );
}

class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge(this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final (bg, fg, label) = switch (status) {
      'available' => (kGreen.withAlpha(20), kGreen, 'Available'),
      'rented'    => (kAccent.withAlpha(20), kAccent, 'Rented'),
      'maintenance' => (kRed.withAlpha(20), kRed, 'Maintenance'),
      'active'    => (kAccent.withAlpha(20), kAccent, 'Active'),
      'completed' => (kGreen.withAlpha(20), kGreen, 'Done'),
      'pending'   => (kIndigo.withAlpha(20), kIndigo, 'Pending'),
      'confirmed' => (kGreen.withAlpha(20), kGreen, 'Confirmed'),
      _ => (kBg2, kMuted, status),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}

void showToast(BuildContext context, String msg, {bool error = false}) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    content: Text(msg),
    backgroundColor: error ? kRed : kText,
    duration: const Duration(seconds: 3),
  ));
}

extension IntFmt on int {
  String get kes => toString().replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
}
