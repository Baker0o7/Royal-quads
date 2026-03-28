import 'app_themes.dart';
export 'app_themes.dart' show RQColors, RQThemeX, RQBuildContextX;
import 'package:flutter/material.dart';

// ── Palette ───────────────────────────────────────────────────────────────────
const kAccent   = Color(0xFFC9972A);
const kAccent2  = Color(0xFFE8B84B);
const kAccent3  = Color(0xFFA07010);
const kHeroFrom = Color(0xFF2D2318);
const kHeroMid  = Color(0xFF1A1008);
const kHeroTo   = Color(0xFF0D0B09);
const kBg       = Color(0xFFF7F2EA);
const context.rq.bg2      = Color(0xFFEEE6D2);
const kSurface  = Color(0xFFFCF9F4);
const kText     = Color(0xFF1A1612);
const kMuted    = Color(0xFF7A6E60);
const kCard     = Color(0xFFFFFFFF);
const kBorder   = Color(0xFFE2D8C6);
const kGreen    = Color(0xFF16A34A);
const kRed      = Color(0xFFDC2626);
const kIndigo   = Color(0xFF6366F1);
const kOrange   = Color(0xFFEA580C);

// ── Dark palette ──────────────────────────────────────────────────────────────
const kDarkBg     = Color(0xFF0F0D0A);
const kDarcontext.rq.bg2    = Color(0xFF1A1612);
const kDarkCard   = Color(0xFF201C18);
const kDarkBorder = Color(0xFF2E2820);
const kDarkText   = Color(0xFFF5EFE6);
const kDarkMuted  = Color(0xFF9A8E7E);

// ── Shadows ───────────────────────────────────────────────────────────────────
List<BoxShadow> kShadowXs = [
  BoxShadow(color: const Color(0xFF1A1612).withAlpha(8),  blurRadius: 2, offset: const Offset(0, 1)),
];
List<BoxShadow> kShadowSm = [
  BoxShadow(color: const Color(0xFF1A1612).withAlpha(10), blurRadius: 6, offset: const Offset(0, 2)),
];
List<BoxShadow> kShadowMd = [
  BoxShadow(color: const Color(0xFF1A1612).withAlpha(12), blurRadius: 16, offset: const Offset(0, 4)),
  BoxShadow(color: const Color(0xFF1A1612).withAlpha(5),  blurRadius: 4,  offset: const Offset(0, 1)),
];
List<BoxShadow> kShadowLg = [
  BoxShadow(color: const Color(0xFF1A1612).withAlpha(16), blurRadius: 32, offset: const Offset(0, 8)),
  BoxShadow(color: const Color(0xFF1A1612).withAlpha(6),  blurRadius: 8,  offset: const Offset(0, 2)),
];
List<BoxShadow> kShadowGold = [
  BoxShadow(color: kAccent.withAlpha(50), blurRadius: 20, offset: const Offset(0, 4)),
  BoxShadow(color: kAccent.withAlpha(20), blurRadius: 6,  offset: const Offset(0, 1)),
];

// ── Gradients ─────────────────────────────────────────────────────────────────
const kHeroGradient = LinearGradient(
  colors: [kHeroFrom, kHeroTo],
  begin: Alignment.topLeft, end: Alignment.bottomRight,
);
const kGoldGradient = LinearGradient(
  colors: [Color(0xFFEEC84A), Color(0xFFC9972A), Color(0xFFA07010)],
  begin: Alignment.topLeft, end: Alignment.bottomRight,
);
const kGoldGradientH = LinearGradient(
  colors: [Color(0xFFA07010), Color(0xFFC9972A), Color(0xFFEEC84A)],
  begin: Alignment.centerLeft, end: Alignment.centerRight,
);
const kGreenGradient = LinearGradient(
  colors: [Color(0xFF16A34A), Color(0xFF059669)],
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
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        gradient: isDark ? kHeroGradient : LinearGradient(
          colors: [context.rq.card, context.rq.bg2],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: isDark ? null : Border.all(color: context.rq.border),
        boxShadow: shadows ?? (isDark ? kShadowLg : kShadowSm),
      ),
      child: child,
    );
  }
}

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final Color? color;
  final VoidCallback? onTap;
  final Border? border;
  final List<BoxShadow>? shadows;
  const AppCard({super.key, required this.child,
      this.padding = const EdgeInsets.all(16),
      this.radius = 20, this.color, this.onTap,
      this.border, this.shadows});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding,
        decoration: BoxDecoration(
          color: color ?? context.rq.card,
          borderRadius: BorderRadius.circular(radius),
          border: border ?? Border.all(color: context.rq.border),
          boxShadow: shadows ?? kShadowSm,
        ),
        child: child,
      ),
    );
  }
}

/// Pressable card with scale animation
class TapCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final double radius;
  final Color? color;
  final Border? border;
  const TapCard({super.key, required this.child,
      this.onTap, this.padding = const EdgeInsets.all(16),
      this.radius = 20, this.color, this.border});
  @override State<TapCard> createState() => _TapCardState();
}

class _TapCardState extends State<TapCard> {
  bool _p = false;
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _p = true),
      onTapUp: (_) { setState(() => _p = false); widget.onTap?.call(); },
      onTapCancel: () => setState(() => _p = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        transform: Matrix4.identity()..scale(_p ? 0.975 : 1.0),
        transformAlignment: Alignment.center,
        padding: widget.padding,
        decoration: BoxDecoration(
          color: widget.color ?? Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(widget.radius),
          border: widget.border ?? Border.all(
              color: Theme.of(context).dividerColor),
          boxShadow: _p ? kShadowXs : kShadowSm,
        ),
        child: widget.child,
      ),
    );
  }
}

class GoldBadge extends StatelessWidget {
  final String text;
  final IconData? icon;
  const GoldBadge(this.text, {super.key, this.icon});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(
      gradient: kGoldGradient,
      borderRadius: BorderRadius.circular(20),
      boxShadow: kShadowGold,
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      if (icon != null) ...[
        Icon(icon, size: 11, color: Colors.white),
        const SizedBox(width: 4),
      ],
      Text(text, style: const TextStyle(
          color: Colors.white, fontSize: 11,
          fontWeight: FontWeight.w700, letterSpacing: 0.3)),
    ]),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = color ?? (isDark ? const Color(0xFFF5EFE6) : kText);
    return SizedBox(
      width: double.infinity,
      child: GestureDetector(
        onTap: (loading || onTap == null) ? null : onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 17),
          decoration: BoxDecoration(
            color: outlined ? Colors.transparent
                : bg.withAlpha(loading ? 120 : 255),
            borderRadius: BorderRadius.circular(16),
            border: outlined ? Border.all(color: bg, width: 2)
                : Border.all(color: bg.withAlpha(40)),
            boxShadow: outlined ? null : [
              BoxShadow(color: bg.withAlpha(35), blurRadius: 14,
                  offset: const Offset(0, 4)),
            ],
          ),
          child: loading
              ? Center(child: SizedBox(width: 22, height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2.5,
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
  Widget build(BuildContext context) {
    final textColor = Theme.of(context).colorScheme.onSurface;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
        if (icon != null) ...[
          Container(
            width: 30, height: 30,
            decoration: BoxDecoration(
              gradient: kGoldGradient,
              borderRadius: BorderRadius.circular(9),
              boxShadow: [BoxShadow(
                  color: kAccent.withAlpha(40), blurRadius: 8)],
            ),
            child: Icon(icon, size: 15, color: Colors.white)),
          const SizedBox(width: 10),
        ],
        Expanded(child: Text(text, style: TextStyle(
            fontSize: 13, fontWeight: FontWeight.w800,
            letterSpacing: 0.4, color: textColor))),
        if (trailing != null) trailing!,
      ]),
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge(this.status, {super.key});
  @override
  Widget build(BuildContext context) {
    final (bg, fg, label, dot) = switch (status) {
      'available'   => (kGreen.withAlpha(20),  kGreen,  'Available',   true),
      'rented'      => (kAccent.withAlpha(20), kAccent, 'Rented',      true),
      'maintenance' => (kRed.withAlpha(20),    kRed,    'Maintenance', true),
      'active'      => (kAccent.withAlpha(20), kAccent, 'Active',      true),
      'completed'   => (kGreen.withAlpha(20),  kGreen,  'Completed',   false),
      'pending'     => (kIndigo.withAlpha(20), kIndigo, 'Pending',     true),
      'confirmed'   => (kGreen.withAlpha(20),  kGreen,  'Confirmed',   false),
      'cancelled'   => (kRed.withAlpha(20),    kRed,    'Cancelled',   false),
      _             => (context.rq.bg2, kMuted, status, false),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(20),
          border: Border.all(color: fg.withAlpha(40))),
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

class AccentDivider extends StatelessWidget {
  const AccentDivider({super.key});
  @override
  Widget build(BuildContext context) => Container(
    height: 1,
    decoration: const BoxDecoration(
      gradient: LinearGradient(
          colors: [Colors.transparent, kAccent, Colors.transparent]),
    ),
  );
}

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
        vsync: this, duration: const Duration(milliseconds: 1400))..repeat();
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }
  @override void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base  = Theme.of(context).dividerColor.withAlpha(isDark ? 80 : 100);
    final shine = Theme.of(context).cardColor;
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        width: widget.width, height: widget.height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(widget.radius),
          gradient: LinearGradient(
            colors: [base, shine, base],
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
}

void showToast(BuildContext context, String msg, {bool error = false}) {
  ScaffoldMessenger.of(context)
    ..clearSnackBars()
    ..showSnackBar(SnackBar(
      content: Row(children: [
        Icon(error ? Icons.error_outline_rounded
            : Icons.check_circle_outline_rounded,
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
  String get timeOnly =>
      '${hour.toString().padLeft(2,'0')}:${minute.toString().padLeft(2,'0')}';
}

// ── Theme-aware helpers ───────────────────────────────────────────────────────
extension ThemeContextX on BuildContext {
  Color get accent    => Theme.of(this).colorScheme.primary;
  Color get accent2   => Theme.of(this).colorScheme.secondary;
  bool  get isDark    => Theme.of(this).brightness == Brightness.dark;
  Color get cardColor => isDark ? kDarkCard : kCard;
  Color get surfColor => isDark ? kDarcontext.rq.bg2  : kSurface;
  Color get textColor => isDark ? kDarkText : kText;
  Color get mutedColor=> isDark ? kDarkMuted: kMuted;
  Color get bordColor => isDark ? kDarkBorder: kBorder;
}

// ── Theme-aware hero helpers ─────────────────────────────────────────────────
// Use these instead of kHeroGradient / kHeroTo / kHeroFrom in screens.

LinearGradient heroGradient(BuildContext context) {
  final isDark  = Theme.of(context).brightness == Brightness.dark;
  final primary = Theme.of(context).colorScheme.primary;
  if (isDark) return kHeroGradient;                        // existing dark gradient
  // Light: rich primary → deeper primary
  return LinearGradient(
    colors: [
      Color.lerp(primary, Colors.black, 0.45)!,
      Color.lerp(primary, Colors.black, 0.60)!,
    ],
    begin: Alignment.topLeft, end: Alignment.bottomRight,
  );
}

Color heroColor(BuildContext context) =>
    Theme.of(context).appBarTheme.backgroundColor
        ?? Color.lerp(Theme.of(context).colorScheme.primary, Colors.black, 0.55)!;

Color heroBg(BuildContext context) {
  final isDark = Theme.of(context).brightness == Brightness.dark;
  final primary = Theme.of(context).colorScheme.primary;
  return isDark
      ? kHeroFrom
      : Color.lerp(primary, Colors.black, 0.45)!;
}

// ── Quad Icon (replaces bike icon throughout app) ─────────────────────────────
class QuadIcon extends StatelessWidget {
  final Color color;
  final double size;
  const QuadIcon({super.key, required this.color, this.size = 24});
  @override
  Widget build(BuildContext context) => Image.asset(
    'assets/images/quad_icon.png',
    width: size, height: size,
    color: color,
    colorBlendMode: BlendMode.srcIn,
  );
}
