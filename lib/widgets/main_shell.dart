import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/theme.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  static const _tabs = [
    (path: '/',         icon: Icons.directions_bike_rounded,  label: 'Book'),
    (path: '/profile',  icon: Icons.person_rounded,           label: 'Profile'),
    (path: '/prebook',  icon: Icons.calendar_month_rounded,   label: 'Pre-book'),
  ];

  @override
  Widget build(BuildContext context) {
    final loc = GoRouterState.of(context).uri.toString();
    final idx = _tabs.indexWhere((t) => t.path == loc).clamp(0, 2);

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
              children: List.generate(_tabs.length, (i) {
                final t = _tabs[i];
                final active = i == idx;
                return Expanded(child: GestureDetector(
                  onTap: () => context.go(t.path),
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 18, vertical: 6),
                          decoration: BoxDecoration(
                            color: active
                                ? kAccent.withAlpha(25)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Icon(t.icon,
                            color: active ? kAccent : Colors.white38,
                            size: 22),
                        ),
                        const SizedBox(height: 2),
                        Text(t.label, style: TextStyle(
                            color: active ? kAccent : Colors.white30,
                            fontSize: 10,
                            fontWeight: active
                                ? FontWeight.w700 : FontWeight.w400)),
                      ],
                    ),
                  ),
                ));
              }),
            ),
          ),
        ),
      ),
    );
  }
}
