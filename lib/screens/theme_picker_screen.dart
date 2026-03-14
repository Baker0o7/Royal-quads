import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_themes.dart';
import '../theme/theme.dart';

class ThemePickerScreen extends StatelessWidget {
  const ThemePickerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final prov  = context.watch<AppProvider>();
    final isDark = prov.themeMode == ThemeMode.dark;

    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 130,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(
                gradient: prov.appTheme.gradient,
              ),
              child: SafeArea(child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    const Text('Appearance',
                        style: TextStyle(
                            fontFamily: 'Playfair',
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: Colors.white)),
                    const SizedBox(height: 4),
                    Text('${prov.appTheme.emoji}  ${prov.appTheme.label}  •  '
                        '${isDark ? "Dark" : "Light"} mode',
                        style: const TextStyle(
                            color: Colors.white54, fontSize: 13)),
                  ],
                ),
              )),
            ),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),

        SliverPadding(
          padding: const EdgeInsets.all(20),
          sliver: SliverList(delegate: SliverChildListDelegate([

            // ── Dark / Light toggle ──────────────────────────────────────
            _Section('Mode'),
            const SizedBox(height: 10),
            Row(children: [
              _ModeCard(
                icon: Icons.dark_mode_rounded,
                label: 'Dark',
                selected: isDark,
                onTap: () {
                  HapticFeedback.selectionClick();
                  if (!isDark) prov.toggleTheme();
                },
              ),
              const SizedBox(width: 12),
              _ModeCard(
                icon: Icons.light_mode_rounded,
                label: 'Light',
                selected: !isDark,
                onTap: () {
                  HapticFeedback.selectionClick();
                  if (isDark) prov.toggleTheme();
                },
              ),
            ]),

            const SizedBox(height: 28),

            // ── Theme cards ───────────────────────────────────────────────
            _Section('Theme Colour'),
            const SizedBox(height: 10),

            ...AppTheme.values.map((t) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _ThemeCard(
                theme: t,
                selected: prov.appTheme == t,
                isDark: isDark,
                onTap: () {
                  HapticFeedback.mediumImpact();
                  prov.setTheme(t);
                },
              ),
            )),

            const SizedBox(height: 8),
            Center(
              child: Text(
                'Theme changes apply instantly',
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface
                        .withAlpha(80),
                    fontSize: 12),
              ),
            ),
            const SizedBox(height: 32),
          ])),
        ),
      ]),
    );
  }
}

class _Section extends StatelessWidget {
  final String label;
  const _Section(this.label);
  @override
  Widget build(BuildContext context) => Text(
    label.toUpperCase(),
    style: TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w800,
      letterSpacing: 1.5,
      color: Theme.of(context).colorScheme.onSurface.withAlpha(120),
    ),
  );
}

class _ModeCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _ModeCard({required this.icon, required this.label,
      required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final accent = Theme.of(context).colorScheme.primary;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            color: selected
                ? accent.withAlpha(20)
                : Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? accent : Colors.transparent,
              width: 2,
            ),
            boxShadow: selected ? [
              BoxShadow(color: accent.withAlpha(40),
                  blurRadius: 16, offset: const Offset(0, 4)),
            ] : kShadowSm,
          ),
          child: Column(children: [
            Icon(icon, color: selected ? accent : kMuted, size: 28),
            const SizedBox(height: 8),
            Text(label, style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: selected ? accent : kMuted)),
            if (selected) ...[
              const SizedBox(height: 4),
              Container(
                width: 6, height: 6,
                decoration: BoxDecoration(
                    color: accent, shape: BoxShape.circle),
              ),
            ],
          ]),
        ),
      ),
    );
  }
}

class _ThemeCard extends StatelessWidget {
  final AppTheme theme;
  final bool selected, isDark;
  final VoidCallback onTap;
  const _ThemeCard({required this.theme, required this.selected,
      required this.isDark, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final bg = isDark ? kDarkCard : kCard;
    final border = isDark ? kDarkBorder : kBorder;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? theme.primary.withAlpha(15) : bg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? theme.primary : border,
            width: selected ? 2 : 1.5,
          ),
          boxShadow: selected ? [
            BoxShadow(color: theme.primary.withAlpha(40),
                blurRadius: 20, offset: const Offset(0, 4)),
          ] : kShadowSm,
        ),
        child: Row(children: [
          // Colour swatch
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(
              gradient: theme.gradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: theme.primary.withAlpha(60), width: 1.5),
            ),
            child: Center(
              child: Text(theme.emoji,
                  style: const TextStyle(fontSize: 24)),
            ),
          ),
          const SizedBox(width: 16),

          // Label + accent strip
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(theme.label, style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                  color: Theme.of(context).colorScheme.onSurface)),
              const SizedBox(height: 6),
              Row(children: [
                _Swatch(theme.primary2),
                const SizedBox(width: 4),
                _Swatch(theme.primary),
                const SizedBox(width: 4),
                _Swatch(theme.heroBg),
              ]),
            ],
          )),

          // Selected indicator
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 26, height: 26,
            decoration: BoxDecoration(
              color: selected ? theme.primary : Colors.transparent,
              shape: BoxShape.circle,
              border: Border.all(
                color: selected ? theme.primary : border,
                width: 2,
              ),
            ),
            child: selected
                ? const Icon(Icons.check_rounded,
                    color: Colors.white, size: 14)
                : null,
          ),
        ]),
      ),
    );
  }
}

class _Swatch extends StatelessWidget {
  final Color color;
  const _Swatch(this.color);
  @override
  Widget build(BuildContext context) => Container(
    width: 18, height: 18,
    decoration: BoxDecoration(
      color: color,
      shape: BoxShape.circle,
      border: Border.all(color: Colors.white.withAlpha(30), width: 1),
    ),
  );
}
