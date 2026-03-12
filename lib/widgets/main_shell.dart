import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/theme.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  static const _tabs = [
    (path: '/',         icon: Icons.directions_bike_rounded,  label: 'Book'),
    (path: '/profile',  icon: Icons.person_rounded,           label: 'Profile'),
    (path: '/prebook',  icon: Icons.calendar_month_rounded,   label: 'Pre-book'),
    (path: '/dunes',    icon: Icons.terrain_rounded,          label: 'Dunes'),
  ];

  @override
  Widget build(BuildContext context) {
    final loc      = GoRouterState.of(context).uri.toString();
    final idx      = _tabs.indexWhere((t) => t.path == loc).clamp(0, 2);
    final active   = context.watch<AppProvider>().active;
    final liveCount = active.length;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: kHeroTo,
          boxShadow: [
            BoxShadow(color: Colors.black.withAlpha(60),
                blurRadius: 20, offset: const Offset(0, -4)),
          ],
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 64,
            child: Row(
              children: [
              ...List.generate(_tabs.length, (i) {
                final t      = _tabs[i];
                final isActive = i == idx;
                final showBadge = i == 0 && liveCount > 0;

                return Expanded(child: GestureDetector(
                  onTap: () => context.go(t.path),
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 18, vertical: 6),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? kAccent.withAlpha(25)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(24),
                            ),
                            child: Icon(t.icon,
                              color: isActive ? kAccent : Colors.white38,
                              size: 22),
                          ),
                          // Live rides badge
                          if (showBadge)
                            Positioned(
                              top: -2, right: -2,
                              child: _LiveBadge(liveCount),
                            ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(t.label, style: TextStyle(
                          color: isActive ? kAccent : Colors.white30,
                          fontSize: 10,
                          fontWeight: isActive
                              ? FontWeight.w700 : FontWeight.w400)),
                    ],
                  ),
                ));
              }),

              // Theme toggle
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  context.read<AppProvider>().toggleTheme();
                },
                behavior: HitTestBehavior.opaque,
                child: SizedBox(
                  width: 52,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        context.watch<AppProvider>().themeMode == ThemeMode.dark
                            ? Icons.light_mode_rounded
                            : Icons.dark_mode_rounded,
                        color: Colors.white38,
                        size: 22,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        context.watch<AppProvider>().themeMode == ThemeMode.dark
                            ? 'Light' : 'Dark',
                        style: const TextStyle(
                            color: Colors.white24, fontSize: 9)),
                    ],
                  ),
                ),
              ),
            ],
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

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => ScaleTransition(
    scale: _anim,
    child: Container(
      width: 17, height: 17,
      decoration: BoxDecoration(
        color: kRed,
        shape: BoxShape.circle,
        border: Border.all(color: kHeroTo, width: 1.5),
        boxShadow: [BoxShadow(
            color: kRed.withAlpha(80), blurRadius: 6)],
      ),
      child: Center(
        child: Text(
          widget.count > 9 ? '9+' : '${widget.count}',
          style: const TextStyle(
              color: Colors.white, fontSize: 8,
              fontWeight: FontWeight.w900),
        ),
      ),
    ),
  );
}
