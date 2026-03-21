import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../screens/theme_picker_screen.dart';
import '../theme/theme.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  static const _tabs = [
    (path: '/',        icon: Icons.directions_bike_rounded, label: 'Book'),
    (path: '/admin',   icon: Icons.admin_panel_settings_rounded, label: 'Admin'),
    (path: '/prebook', icon: Icons.calendar_month_rounded,  label: 'Pre-book'),
    (path: '/dunes',   icon: Icons.terrain_rounded,         label: 'Dunes'),
  ];

  @override
  Widget build(BuildContext context) {
    final loc       = GoRouterState.of(context).uri.toString();
    final idx       = _tabs.indexWhere((t) => t.path == loc).clamp(0, 3);
    final liveCount = context.watch<AppProvider>().active.length;
    final accent    = Theme.of(context).colorScheme.primary;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: heroColor(context),
          boxShadow: [
            BoxShadow(color: Colors.black.withAlpha(80),
                blurRadius: 24, offset: const Offset(0, -1)),
          ],
          border: Border(
            top: BorderSide(color: Colors.white.withAlpha(10), width: 0.5),
          ),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 62,
            child: Row(children: [
              ...List.generate(_tabs.length, (i) {
                final t         = _tabs[i];
                final isActive  = i == idx;
                final showBadge = i == 0 && liveCount > 0;

                return Expanded(child: GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    context.go(t.path);
                  },
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(clipBehavior: Clip.none, children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          curve: Curves.easeOutCubic,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 5),
                          decoration: BoxDecoration(
                            color: isActive
                                ? accent.withAlpha(28)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Icon(t.icon,
                              color: isActive ? accent : Colors.white38,
                              size: 21),
                        ),
                        if (showBadge)
                          Positioned(top: -3, right: -3,
                              child: _LiveBadge(liveCount)),
                      ]),
                      const SizedBox(height: 3),
                      AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 220),
                        style: TextStyle(
                          color: isActive
                              ? accent : Colors.white.withAlpha(60),
                          fontSize: 9.5,
                          fontWeight: isActive
                              ? FontWeight.w700 : FontWeight.w400,
                          fontFamily: 'DM Sans',
                        ),
                        child: Text(t.label),
                      ),
                    ],
                  ),
                ));
              }),

              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => const ThemePickerScreen()));
                },
                behavior: HitTestBehavior.opaque,
                child: SizedBox(
                  width: 52,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 32, height: 32,
                        decoration: BoxDecoration(
                          color: accent.withAlpha(18),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: accent.withAlpha(40), width: 1),
                        ),
                        child: Icon(Icons.palette_outlined,
                            color: accent.withAlpha(180), size: 15),
                      ),
                      const SizedBox(height: 3),
                      Text('Theme',
                          style: TextStyle(
                              color: accent.withAlpha(100),
                              fontSize: 9, fontFamily: 'DM Sans')),
                    ],
                  ),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

class _LiveBadge extends StatefulWidget {
  final int count;
  const _LiveBadge(this.count);
  @override State<_LiveBadge> createState() => _LiveBadgeState();
}

class _LiveBadgeState extends State<_LiveBadge>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.85, end: 1.15).animate(
        CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => ScaleTransition(
    scale: _anim,
    child: Container(
      width: 16, height: 16,
      decoration: BoxDecoration(
        color: kRed,
        shape: BoxShape.circle,
        border: Border.all(color: heroColor(context), width: 1.5),
        boxShadow: [BoxShadow(color: kRed.withAlpha(90), blurRadius: 6)],
      ),
      child: Center(child: Text(
        widget.count > 9 ? '9+' : '${widget.count}',
        style: const TextStyle(
            color: Colors.white, fontSize: 7.5,
            fontWeight: FontWeight.w900),
      )),
    ),
  );
}
