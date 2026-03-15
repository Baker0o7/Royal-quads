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
    final prov   = context.watch<AppProvider>();
    final scheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: CustomScrollView(slivers: [

        // ── Header ───────────────────────────────────────────────────────
        SliverAppBar(
          expandedHeight: 130,
          pinned: true,
          automaticallyImplyLeading: false,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),
          title: const Text('Appearance',
              style: TextStyle(fontFamily: 'Playfair',
                  fontSize: 17, color: Colors.white)),
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(
                gradient: prov.appTheme.isDynamic
                    ? prov.appTheme.gradientFrom(scheme.primary)
                    : prov.appTheme.gradient,
              ),
              child: SafeArea(
                child: Align(
                  alignment: Alignment.bottomLeft,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Appearance', style: const TextStyle(
                            fontFamily: 'Playfair', fontSize: 26,
                            fontWeight: FontWeight.w700, color: Colors.white)),
                        const SizedBox(height: 4),
                        Row(children: [
                          Text(prov.appTheme.emoji,
                              style: const TextStyle(fontSize: 13)),
                          const SizedBox(width: 6),
                          Text(prov.appTheme.label,
                              style: const TextStyle(
                                  color: Colors.white70, fontSize: 13,
                                  fontWeight: FontWeight.w500)),
                          const Text('  ·  ',
                              style: TextStyle(color: Colors.white30)),
                          Text(switch (prov.themeMode) {
                            ThemeMode.dark   => 'Dark',
                            ThemeMode.light  => 'Light',
                            ThemeMode.system => 'System',
                          }, style: const TextStyle(
                              color: Colors.white54, fontSize: 13)),
                        ]),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),

        SliverPadding(
          padding: const EdgeInsets.all(20),
          sliver: SliverList(delegate: SliverChildListDelegate([

            // ── Mode toggle ────────────────────────────────────────────────
            _SectionLabel('Mode'),
            const SizedBox(height: 10),
            _ModeRow(current: prov.themeMode,
                onSelect: (m) {
                  HapticFeedback.selectionClick();
                  prov.setThemeMode(m);
                }),

            const SizedBox(height: 28),

            // ── Material You (pinned at top) ───────────────────────────────
            _SectionLabel('Dynamic Colour'),
            const SizedBox(height: 10),
            _MaterialYouCard(
              selected: prov.appTheme == AppTheme.materialYou,
              scheme: scheme,
              onTap: () {
                HapticFeedback.mediumImpact();
                prov.setTheme(AppTheme.materialYou);
              },
            ),

            const SizedBox(height: 24),

            // ── Static themes ──────────────────────────────────────────────
            _SectionLabel('Colour Themes'),
            const SizedBox(height: 10),

            ...AppTheme.values
                .where((t) => t != AppTheme.materialYou)
                .map((t) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _ThemeCard(
                theme: t,
                selected: prov.appTheme == t,
                scheme: scheme,
                onTap: () {
                  HapticFeedback.mediumImpact();
                  prov.setTheme(t);
                },
              ),
            )),

            const SizedBox(height: 12),
            Center(child: Text(
              'Theme changes apply instantly everywhere',
              style: TextStyle(
                  color: scheme.onSurface.withAlpha(70), fontSize: 11),
            )),
            const SizedBox(height: 32),
          ])),
        ),
      ]),
    );
  }
}

// ── Section label ─────────────────────────────────────────────────────────────
class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(
    text.toUpperCase(),
    style: TextStyle(
        fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.8,
        color: Theme.of(context).colorScheme.onSurface.withAlpha(100)),
  );
}

// ── Three-way mode row ────────────────────────────────────────────────────────
class _ModeRow extends StatelessWidget {
  final ThemeMode current;
  final ValueChanged<ThemeMode> onSelect;
  const _ModeRow({required this.current, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      _ModeBtn(Icons.dark_mode_rounded,  'Dark',   ThemeMode.dark,   current, onSelect),
      const SizedBox(width: 10),
      _ModeBtn(Icons.light_mode_rounded, 'Light',  ThemeMode.light,  current, onSelect),
      const SizedBox(width: 10),
      _ModeBtn(Icons.phone_android_rounded, 'System', ThemeMode.system, current, onSelect),
    ]);
  }
}

class _ModeBtn extends StatelessWidget {
  final IconData icon; final String label;
  final ThemeMode mode, current;
  final ValueChanged<ThemeMode> onSelect;
  const _ModeBtn(this.icon, this.label, this.mode, this.current, this.onSelect);

  @override
  Widget build(BuildContext context) {
    final sel    = mode == current;
    final accent = Theme.of(context).colorScheme.primary;
    return Expanded(
      child: GestureDetector(
        onTap: () => onSelect(mode),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: sel ? accent.withAlpha(18) : Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
                color: sel ? accent : Theme.of(context).dividerColor,
                width: sel ? 2 : 1.5),
            boxShadow: sel ? [
              BoxShadow(color: accent.withAlpha(45),
                  blurRadius: 14, offset: const Offset(0, 3)),
            ] : kShadowSm,
          ),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, color: sel ? accent : kMuted, size: 22),
            const SizedBox(height: 6),
            Text(label, style: TextStyle(
                fontWeight: sel ? FontWeight.w700 : FontWeight.w400,
                fontSize: 12,
                color: sel ? accent : kMuted)),
            if (sel) ...[
              const SizedBox(height: 4),
              Container(width: 5, height: 5,
                  decoration: BoxDecoration(
                      color: accent, shape: BoxShape.circle)),
            ],
          ]),
        ),
      ),
    );
  }
}

// ── Material You card ─────────────────────────────────────────────────────────
class _MaterialYouCard extends StatelessWidget {
  final bool selected;
  final ColorScheme scheme;
  final VoidCallback onTap;
  const _MaterialYouCard({required this.selected, required this.scheme,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected
              ? scheme.primaryContainer.withAlpha(180)
              : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: selected ? scheme.primary : Theme.of(context).dividerColor,
              width: selected ? 2 : 1.5),
          boxShadow: selected ? [
            BoxShadow(color: scheme.primary.withAlpha(50),
                blurRadius: 20, offset: const Offset(0, 4)),
          ] : kShadowSm,
        ),
        child: Row(children: [
          // Animated colour orbs showing the dynamic palette
          Stack(children: [
            // Background orb cluster
            SizedBox(width: 60, height: 60, child: Stack(children: [
              Positioned(left: 0, top: 0,
                  child: _Orb(scheme.primary, 32)),
              Positioned(right: 0, top: 0,
                  child: _Orb(scheme.secondary, 26)),
              Positioned(left: 10, bottom: 0,
                  child: _Orb(scheme.tertiary, 22)),
            ])),
          ]),
          const SizedBox(width: 16),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const Text('✨', style: TextStyle(fontSize: 15)),
                const SizedBox(width: 6),
                Text('Material You',
                    style: TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 16,
                        color: Theme.of(context).colorScheme.onSurface)),
              ]),
              const SizedBox(height: 4),
              Text('Colours from your wallpaper',
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface
                          .withAlpha(120),
                      fontSize: 12)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: scheme.primaryContainer.withAlpha(120),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('Android 12+',
                    style: TextStyle(
                        color: scheme.onPrimaryContainer,
                        fontSize: 10, fontWeight: FontWeight.w600)),
              ),
            ],
          )),
          _CheckCircle(selected: selected, color: scheme.primary),
        ]),
      ),
    );
  }
}

class _Orb extends StatelessWidget {
  final Color color; final double size;
  const _Orb(this.color, this.size);
  @override
  Widget build(BuildContext context) => Container(
    width: size, height: size,
    decoration: BoxDecoration(
      color: color,
      shape: BoxShape.circle,
      boxShadow: [BoxShadow(
          color: color.withAlpha(80), blurRadius: size * 0.4)],
    ),
  );
}

// ── Static theme card ─────────────────────────────────────────────────────────
class _ThemeCard extends StatelessWidget {
  final AppTheme theme;
  final bool selected;
  final ColorScheme scheme;
  final VoidCallback onTap;
  const _ThemeCard({required this.theme, required this.selected,
      required this.scheme, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final seed = theme.seedColor;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected
              ? seed.withAlpha(12)
              : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: selected ? seed : Theme.of(context).dividerColor,
              width: selected ? 2 : 1.5),
          boxShadow: selected ? [
            BoxShadow(color: seed.withAlpha(45),
                blurRadius: 16, offset: const Offset(0, 3)),
          ] : kShadowXs,
        ),
        child: Row(children: [
          // Colour preview swatch
          Container(
            width: 52, height: 52,
            decoration: BoxDecoration(
              gradient: theme.gradient,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: seed.withAlpha(60), width: 1.5),
            ),
            child: Center(child: Text(theme.emoji,
                style: const TextStyle(fontSize: 22)))),
          const SizedBox(width: 14),
          // Info
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(theme.label, style: TextStyle(
                  fontWeight: FontWeight.w700, fontSize: 15,
                  color: Theme.of(context).colorScheme.onSurface)),
              const SizedBox(height: 3),
              Text(theme.description, style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurface
                      .withAlpha(100),
                  fontSize: 11),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 6),
              // Colour swatches
              Row(children: [
                _Swatch(seed),
                const SizedBox(width: 4),
                _Swatch(Color.lerp(seed, Colors.white, 0.4)!),
                const SizedBox(width: 4),
                _Swatch(Color.lerp(seed, Colors.black, 0.5)!),
                const SizedBox(width: 4),
                _Swatch(theme.heroBg),
              ]),
            ],
          )),
          const SizedBox(width: 8),
          _CheckCircle(selected: selected, color: seed),
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
    width: 14, height: 14,
    decoration: BoxDecoration(
      color: color,
      shape: BoxShape.circle,
      border: Border.all(
          color: Colors.white.withAlpha(30), width: 0.5),
    ),
  );
}

class _CheckCircle extends StatelessWidget {
  final bool selected; final Color color;
  const _CheckCircle({required this.selected, required this.color});
  @override
  Widget build(BuildContext context) => AnimatedContainer(
    duration: const Duration(milliseconds: 200),
    width: 24, height: 24,
    decoration: BoxDecoration(
      color: selected ? color : Colors.transparent,
      shape: BoxShape.circle,
      border: Border.all(
          color: selected ? color : Theme.of(context).dividerColor,
          width: 2),
      boxShadow: selected ? [
        BoxShadow(color: color.withAlpha(60), blurRadius: 6),
      ] : null,
    ),
    child: selected
        ? const Icon(Icons.check_rounded, color: Colors.white, size: 14)
        : null,
  );
}
