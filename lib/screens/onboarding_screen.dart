import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/storage.dart';
import '../theme/theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with SingleTickerProviderStateMixin {
  final _ctrl = PageController();
  int _page   = 0;

  static const _pages = [
    _Page(
      icon:    Icons.calendar_month_rounded,
      color:   kAccent,
      title:   'Book Your Quad',
      body:    'Choose a quad, pick your ride duration, and enter customer details — all in under 60 seconds.',
      emoji:   '🏍️',
    ),
    _Page(
      icon:    Icons.terrain_rounded,
      color:   kGreen,
      title:   'Hit the Dunes',
      body:    'Take on the Mambrui Sand Dunes with a live ride timer, overtime tracking, and one-tap extension.',
      emoji:   '🏜️',
    ),
    _Page(
      icon:    Icons.phone_android_rounded,
      color:   kIndigo,
      title:   'Pay via M-Pesa',
      body:    'Instant M-Pesa till number, confirmation code entry, PDF receipt, and WhatsApp delivery.',
      emoji:   '💸',
    ),
  ];

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  void _next() {
    if (_page < _pages.length - 1) {
      _ctrl.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
      );
    } else {
      _finish();
    }
  }

  Future<void> _finish() async {
    await StorageService.setOnboarded();
    if (mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: heroColor(context),
    body: Stack(children: [
      // Background
      Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [heroBg(context), heroColor(context)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
      ),

      // Gold top bar
      Positioned(top: 0, left: 0, right: 0,
        child: Container(height: 2,
          decoration: const BoxDecoration(gradient: kGoldGradient))),

      // Page content
      PageView.builder(
        controller: _ctrl,
        onPageChanged: (i) => setState(() => _page = i),
        itemCount: _pages.length,
        itemBuilder: (_, i) => _PageView(page: _pages[i]),
      ),

      // Bottom bar
      Positioned(
        bottom: 0, left: 0, right: 0,
        child: SafeArea(
          top: false,
          child: Container(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              // Dots
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_pages.length, (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _page == i ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _page == i ? kAccent : kAccent.withAlpha(40),
                    borderRadius: BorderRadius.circular(4),
                  ),
                )),
              ),
              const SizedBox(height: 24),

              // Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _next,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kAccent,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: Text(
                    _page == _pages.length - 1 ? 'Get Started 🏍️' : 'Next',
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                ),
              ),

              if (_page < _pages.length - 1)
                TextButton(
                  onPressed: _finish,
                  child: const Text('Skip',
                      style: TextStyle(color: Colors.white38, fontSize: 13)),
                ),
            ]),
          ),
        ),
      ),
    ]),
  );
}

class _PageView extends StatefulWidget {
  final _Page page;
  const _PageView({super.key, required this.page});
  @override State<_PageView> createState() => _PageViewState();
}

class _PageViewState extends State<_PageView>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fade;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl  = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500))
      ..forward();
    _fade  = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut)
        .drive(Tween(begin: 0.0, end: 1.0));
    _slide = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic)
        .drive(Tween(begin: const Offset(0, 0.25), end: Offset.zero));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: _fade,
    child: SlideTransition(
      position: _slide,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(32, 0, 32, 180),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon circle
            Container(
              width: 130, height: 130,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.page.color.withAlpha(20),
                border: Border.all(
                    color: widget.page.color.withAlpha(60), width: 2),
                boxShadow: [
                  BoxShadow(
                    color: widget.page.color.withAlpha(50),
                    blurRadius: 40,
                  ),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(widget.page.emoji,
                      style: const TextStyle(fontSize: 42)),
                  const SizedBox(height: 4),
                  Icon(widget.page.icon,
                      color: widget.page.color, size: 22),
                ],
              ),
            ),

            const SizedBox(height: 40),

            Text(
              widget.page.title,
              style: const TextStyle(
                fontFamily: 'Playfair',
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 16),

            Text(
              widget.page.body,
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 15,
                height: 1.6,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    ),
  );
}

class _Page {
  final IconData icon;
  final Color color;
  final String title, body, emoji;
  const _Page({
    required this.icon, required this.color,
    required this.title, required this.body, required this.emoji,
  });
}
