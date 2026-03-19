import 'dart:math';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/storage.dart';
import '../theme/theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoCtrl;
  late AnimationController _textCtrl;
  late AnimationController _duneCtrl;
  late Animation<double>   _logoScale;
  late Animation<double>   _logoFade;
  late Animation<double>   _textFade;
  late Animation<Offset>   _textSlide;
  late Animation<double>   _duneFade;

  @override
  void initState() {
    super.initState();

    _logoCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _textCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _duneCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));

    _logoScale = CurvedAnimation(parent: _logoCtrl, curve: Curves.elasticOut)
        .drive(Tween<double>(begin: 0.3, end: 1.0));
    _logoFade  = CurvedAnimation(parent: _logoCtrl, curve: Curves.easeOut)
        .drive(Tween<double>(begin: 0.0, end: 1.0));
    _textFade  = CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut)
        .drive(Tween<double>(begin: 0.0, end: 1.0));
    _textSlide = CurvedAnimation(parent: _textCtrl, curve: Curves.easeOutCubic)
        .drive(Tween<Offset>(begin: const Offset(0, 0.4), end: Offset.zero));
    _duneFade  = CurvedAnimation(parent: _duneCtrl, curve: Curves.easeIn)
        .drive(Tween<double>(begin: 0.0, end: 1.0));

    _runSequence();
  }

  Future<void> _runSequence() async {
    await Future.delayed(const Duration(milliseconds: 200));
    _logoCtrl.forward();
    await Future.delayed(const Duration(milliseconds: 400));
    _textCtrl.forward();
    await Future.delayed(const Duration(milliseconds: 300));
    _duneCtrl.forward();
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    if (StorageService.isOnboarded()) {
      context.go('/');
    } else {
      context.go('/onboarding');
    }
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _textCtrl.dispose();
    _duneCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: heroColor(context),
    body: Stack(children: [
      // Background gradient
      Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [heroBg(context), heroColor(context)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
      ),

      // Stars
      ...List.generate(28, (i) {
        final rng = Random(i * 7 + 3);
        final x   = rng.nextDouble();
        final y   = rng.nextDouble() * 0.65;
        final r   = 0.8 + rng.nextDouble() * 1.4;
        return Positioned(
          left: x * MediaQuery.of(context).size.width,
          top:  y * MediaQuery.of(context).size.height,
          child: Container(
            width: r * 2, height: r * 2,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withAlpha((60 + rng.nextInt(120))),
            ),
          ),
        );
      }),

      // Dunes silhouette at bottom
      FadeTransition(
        opacity: _duneFade,
        child: Align(
          alignment: Alignment.bottomCenter,
          child: CustomPaint(
            size: Size(MediaQuery.of(context).size.width, 200),
            painter: _DunesPainter(),
          ),
        ),
      ),

      // Gold shimmer line
      Positioned(
        top: MediaQuery.of(context).padding.top + 0,
        left: 0, right: 0,
        child: Container(height: 2,
          decoration: const BoxDecoration(gradient: kGoldGradient)),
      ),

      // Logo + Text centred
      Center(child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Logo
          FadeTransition(
            opacity: _logoFade,
            child: ScaleTransition(
              scale: _logoScale,
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: kAccent.withAlpha(80), blurRadius: 40),
                    BoxShadow(color: kAccent.withAlpha(30), blurRadius: 80),
                  ],
                ),
                child: CircleAvatar(
                  radius: 56,
                  backgroundImage: const AssetImage('assets/images/logo.png'),
                  backgroundColor: Colors.transparent,
                ),
              ),
            ),
          ),

          const SizedBox(height: 28),

          // Title
          FadeTransition(
            opacity: _textFade,
            child: SlideTransition(
              position: _textSlide,
              child: const Column(children: [
                Text(
                  'Royal Quad Bikes',
                  style: TextStyle(
                    fontFamily: 'Playfair',
                    fontSize: 30,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
                SizedBox(height: 8),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  _Dot(), SizedBox(width: 8),
                  Text(
                    'MAMBRUI SAND DUNES · KENYA',
                    style: TextStyle(
                      color: kAccent2,
                      fontSize: 11,
                      letterSpacing: 3,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(width: 8), _Dot(),
                ]),
              ]),
            ),
          ),
        ],
      )),

      // Loading indicator
      Positioned(
        bottom: 56,
        left: 0, right: 0,
        child: FadeTransition(
          opacity: _textFade,
          child: const Center(child: SizedBox(
            width: 24, height: 24,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: kAccent,
            ),
          )),
        ),
      ),
    ]),
  );
}

class _Dot extends StatelessWidget {
  const _Dot();
  @override
  Widget build(BuildContext context) => Container(
    width: 4, height: 4,
    decoration: const BoxDecoration(color: kAccent, shape: BoxShape.circle),
  );
}

class _DunesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Far dune
    final farPaint = Paint()..color = const Color(0xFF2A1E14);
    final far = Path();
    far.moveTo(0, size.height);
    far.lineTo(0, size.height * 0.55);
    far.cubicTo(
      size.width * 0.15, size.height * 0.30,
      size.width * 0.35, size.height * 0.42,
      size.width * 0.55, size.height * 0.35,
    );
    far.cubicTo(
      size.width * 0.72, size.height * 0.28,
      size.width * 0.88, size.height * 0.40,
      size.width,        size.height * 0.36,
    );
    far.lineTo(size.width, size.height);
    far.close();
    canvas.drawPath(far, farPaint);

    // Mid dune
    final midPaint = Paint()..color = const Color(0xFF1E160E);
    final mid = Path();
    mid.moveTo(0, size.height);
    mid.lineTo(0, size.height * 0.70);
    mid.cubicTo(
      size.width * 0.20, size.height * 0.48,
      size.width * 0.42, size.height * 0.62,
      size.width * 0.60, size.height * 0.52,
    );
    mid.cubicTo(
      size.width * 0.75, size.height * 0.44,
      size.width * 0.90, size.height * 0.60,
      size.width,        size.height * 0.58,
    );
    mid.lineTo(size.width, size.height);
    mid.close();
    canvas.drawPath(mid, midPaint);

    // Near dune (darkest)
    final nearPaint = Paint()..color = const Color(0xFF140F09);
    final near = Path();
    near.moveTo(0, size.height);
    near.lineTo(0, size.height * 0.82);
    near.cubicTo(
      size.width * 0.22, size.height * 0.60,
      size.width * 0.44, size.height * 0.76,
      size.width * 0.58, size.height * 0.66,
    );
    near.cubicTo(
      size.width * 0.72, size.height * 0.56,
      size.width * 0.88, size.height * 0.72,
      size.width,        size.height * 0.70,
    );
    near.lineTo(size.width, size.height);
    near.close();
    canvas.drawPath(near, nearPaint);

    // Gold ridge highlight on near dune crest
    final ridgePaint = Paint()
      ..color = kAccent.withAlpha(40)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    final ridge = Path();
    ridge.moveTo(0, size.height * 0.82);
    ridge.cubicTo(
      size.width * 0.22, size.height * 0.60,
      size.width * 0.44, size.height * 0.76,
      size.width * 0.58, size.height * 0.66,
    );
    ridge.cubicTo(
      size.width * 0.72, size.height * 0.56,
      size.width * 0.88, size.height * 0.72,
      size.width,        size.height * 0.70,
    );
    canvas.drawPath(ridge, ridgePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
