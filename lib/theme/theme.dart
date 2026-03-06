import 'package:flutter/material.dart';

// ── Palette ───────────────────────────────────────────────────────────────────
const kAccent   = Color(0xFFC9972A);
const kAccent2  = Color(0xFFE8B84B);
const kHeroFrom = Color(0xFF2D2318);
const kHeroMid  = Color(0xFF1A1008);
const kHeroTo   = Color(0xFF0D0B09);
const kBg       = Color(0xFFF5F0E8);
const kBg2      = Color(0xFFEDE5D0);
const kSurface  = Color(0xFFFBF8F2);
const kText     = Color(0xFF1A1612);
const kMuted    = Color(0xFF7A6E60);
const kCard     = Color(0xFFFFFFFF);
const kBorder   = Color(0xFFDDD4BE);
const kGreen    = Color(0xFF16A34A);
const kRed      = Color(0xFFDC2626);
const kIndigo   = Color(0xFF6366F1);
const kOrange   = Color(0xFFEA580C);

// ── Shadow helpers ─────────────────────────────────────────────────────────────
List<BoxShadow> kShadowSm = [
  BoxShadow(color: const Color(0xFF1A1612).withAlpha(10), blurRadius: 4, offset: const Offset(0, 1)),
];
List<BoxShadow> kShadowMd = [
  BoxShadow(color: const Color(0xFF1A1612).withAlpha(12), blurRadius: 12, offset: const Offset(0, 3)),
  BoxShadow(color: const Color(0xFF1A1612).withAlpha(6),  blurRadius: 4,  offset: const Offset(0, 1)),
];
List<BoxShadow> kShadowLg = [
  BoxShadow(color: const Color(0xFF1A1612).withAlpha(16), blurRadius: 24, offset: const Offset(0, 8)),
  BoxShadow(color: const Color(0xFF1A1612).withAlpha(8),  blurRadius: 8,  offset: const Offset(0, 2)),
];

// ── Theme ──────────────────────────────────────────────────────────────────────
final kTheme = ThemeData(
  useMaterial3: true,
  scaffoldBackgroundColor: kBg,
  colorScheme: ColorScheme.light(
    primary: kAccent, secondary: kAccent2,
    surface: kSurface, onSurface: kText,
    error: kRed,
  ),
  fontFamily: 'DM Sans',
  appBarTheme: const AppBarTheme(
    backgroundColor: kHeroTo, foregroundColor: Colors.white, elevation: 0,
    centerTitle: true, scrolledUnderElevation: 0,
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: kAccent, foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      elevation: 0,
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true, fillColor: kCard,
    border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kBorder)),
    enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kBorder, width: 1.5)),
    focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kAccent, width: 2)),
    errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kRed, width: 1.5)),
    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
    labelStyle: const TextStyle(color: kMuted, fontSize: 14),
    hintStyle: TextStyle(color: kMuted.withAlpha(150)),
    prefixIconColor: kMuted,
  ),
  snackBarTheme: SnackBarThemeData(
    backgroundColor: kText,
    contentTextStyle: const TextStyle(color: Colors.white, fontFamily: 'DM Sans', fontSize: 14),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    behavior: SnackBarBehavior.floating,
    insetPadding: const EdgeInsets.all(12),
  ),
  chipTheme: ChipThemeData(
    backgroundColor: kBg2,
    labelStyle: const TextStyle(color: kText, fontSize: 12),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
  ),
  dividerTheme: const DividerThemeData(color: kBorder, thickness: 1, space: 24),
  listTileTheme: const ListTileThemeData(
    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
  ),
);

// ── Hero gradient decoration ───────────────────────────────────────────────────
const kHeroGradient = LinearGradient(
  colors: [kHeroFrom, kHeroTo],
  begin: Alignment.topLeft, end: Alignment.bottomRight,
);

const kGoldGradient = LinearGradient(
  colors: [Color(0xFFE8B84B), Color(0xFFC9972A), Color(0xFFA07010)],
  begin: Alignment.topLeft, end: Alignment.bottomRight,
);

// ── Shared Widgets ─────────────────────────────────────────────────────────────

class HeroCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double radius;
  final List<BoxShadow>? shadows;

  const HeroCard({super.key, required this.child,
      this.padding, this.radius = 24, this.shadows});

  @override
  Widget build(BuildContext context) => Container(
    padding: padding,
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(radius),
      gradient: kHeroGradient,
      boxShadow: shadows ?? kShadowLg,
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
  final Border? border;

  const AppCard({super.key, required this.child,
      this.padding = const EdgeInsets.all(16),
      this.radius = 20, this.color, this.onTap, this.border});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? kCard,
        borderRadius: BorderRadius.circular(radius),
        border: border ?? Border.all(color: kBorder),
        boxShadow: kShadowSm,
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
  final bool outlined;

  const PrimaryButton({super.key, required this.label,
      this.icon, this.onTap, this.loading = false,
      this.color, this.outlined = false});

  @override
  Widget build(BuildContext context) {
    final bg = color ?? kText;
    return SizedBox(
      width: double.infinity,
      child: GestureDetector(
        onTap: (loading || onTap == null) ? null : onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 17),
          decoration: BoxDecoration(
            color: outlined ? Colors.transparent : bg.withAlpha(loading ? 120 : 255),
            borderRadius: BorderRadius.circular(16),
            border: outlined
                ? Border.all(color: bg, width: 2)
                : Border.all(color: bg.withAlpha(60)),
            boxShadow: outlined ? null : [
              BoxShadow(color: bg.withAlpha(40), blurRadius: 12, offset: const Offset(0, 4)),
            ],
          ),
          child: loading
              ? Center(child: SizedBox(width: 22, height: 22,
                  child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: outlined ? bg : Colors.white)))
              : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  if (icon != null) ...[
                    Icon(icon, size: 19,
                        color: outlined ? bg : Colors.white),
                    const SizedBox(width: 8),
                  ],
                  Text(label, style: TextStyle(
                      color: outlined ? bg : Colors.white,
                      fontWeight: FontWeight.w700, fontSize: 15)),
                ]),
        ),
      ),
    );
  }
}

class SectionHeading extends StatelessWidget {
  final String text;
  final IconData? icon;
  final Widget? trailing;
  const SectionHeading(this.text, {super.key, this.icon, this.trailing});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
      if (icon != null) ...[
        Container(
          width: 28, height: 28,
          decoration: BoxDecoration(
              color: kAccent.withAlpha(18),
              borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, size: 15, color: kAccent)),
        const SizedBox(width: 8),
      ],
      Expanded(child: Text(text, style: const TextStyle(
          fontSize: 13, fontWeight: FontWeight.w800,
          letterSpacing: 0.3, color: kText))),
      if (trailing != null) trailing!,
    ]),
  );
}

class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge(this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final (bg, fg, label, dot) = switch (status) {
      'available'   => (kGreen.withAlpha(18),  kGreen,  'Available',   true),
      'rented'      => (kAccent.withAlpha(18), kAccent, 'Rented',      true),
      'maintenance' => (kRed.withAlpha(18),    kRed,    'Maintenance', true),
      'active'      => (kAccent.withAlpha(18), kAccent, 'Active',      true),
      'completed'   => (kGreen.withAlpha(18),  kGreen,  'Completed',   false),
      'pending'     => (kIndigo.withAlpha(18), kIndigo, 'Pending',     true),
      'confirmed'   => (kGreen.withAlpha(18),  kGreen,  'Confirmed',   false),
      'cancelled'   => (kRed.withAlpha(18),    kRed,    'Cancelled',   false),
      _             => (kBg2, kMuted, status, false),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(20),
          border: Border.all(color: fg.withAlpha(30))),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (dot) ...[
          Container(width: 6, height: 6,
              decoration: BoxDecoration(color: fg, shape: BoxShape.circle)),
          const SizedBox(width: 5),
        ],
        Text(label, style: TextStyle(
            color: fg, fontSize: 11, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

/// Gradient accent divider
class AccentDivider extends StatelessWidget {
  const AccentDivider({super.key});
  @override
  Widget build(BuildContext context) => Container(
    height: 2,
    decoration: const BoxDecoration(
      gradient: LinearGradient(colors: [Colors.transparent, kAccent, Colors.transparent]),
    ),
  );
}

/// Shimmer-style loading placeholder
class ShimmerBox extends StatefulWidget {
  final double width, height, radius;
  const ShimmerBox({super.key,
      this.width = double.infinity, this.height = 60, this.radius = 12});

  @override State<ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<ShimmerBox>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1400))
      ..repeat();
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _anim,
    builder: (_, __) => Container(
      width: widget.width, height: widget.height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(widget.radius),
        gradient: LinearGradient(
          colors: [kBg2, kBg, kBg2],
          stops: [
            (_anim.value - 0.3).clamp(0.0, 1.0),
            _anim.value.clamp(0.0, 1.0),
            (_anim.value + 0.3).clamp(0.0, 1.0),
          ],
        ),
      ),
    ),
  );
}

void showToast(BuildContext context, String msg, {bool error = false}) {
  ScaffoldMessenger.of(context)
    ..clearSnackBars()
    ..showSnackBar(SnackBar(
      content: Row(children: [
        Icon(error ? Icons.error_outline_rounded : Icons.check_circle_outline_rounded,
            color: Colors.white, size: 18),
        const SizedBox(width: 8),
        Expanded(child: Text(msg)),
      ]),
      backgroundColor: error ? kRed : const Color(0xFF1A1612),
      duration: const Duration(seconds: 3),
    ));
}

extension IntFmt on int {
  String get kes => toString().replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
}

extension DateFmt on DateTime {
  String get display =>
      '${day.toString().padLeft(2,'0')}/${month.toString().padLeft(2,'0')}/$year '
      '${hour.toString().padLeft(2,'0')}:${minute.toString().padLeft(2,'0')}';
  String get dateOnly =>
      '${day.toString().padLeft(2,'0')}/${month.toString().padLeft(2,'0')}/$year';
}
