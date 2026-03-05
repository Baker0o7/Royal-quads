import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/theme.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final idx = location == '/' ? 0 : location.startsWith('/profile') ? 1 : location.startsWith('/prebook') ? 2 : 0;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: kHeroTo,
          border: Border(top: BorderSide(color: kBorder)),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 64,
            child: Row(children: [
              _NavItem(icon: Icons.home_rounded, label: 'Book', active: idx == 0,
                  onTap: () => context.go('/')),
              _NavItem(icon: Icons.person_rounded, label: 'Profile', active: idx == 1,
                  onTap: () => context.go('/profile')),
              _NavItem(icon: Icons.bookmark_rounded, label: 'Pre-book', active: idx == 2,
                  onTap: () => context.go('/prebook')),
            ]),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _NavItem({required this.icon, required this.label,
    required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) => Expanded(
    child: GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: active ? kAccent : Colors.white38, size: 24),
        const SizedBox(height: 3),
        Text(label, style: TextStyle(
          color: active ? kAccent : Colors.white38,
          fontSize: 11, fontWeight: active ? FontWeight.w700 : FontWeight.w400,
        )),
      ]),
    ),
  );
}
