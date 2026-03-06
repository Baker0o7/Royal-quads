import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../providers/app_provider.dart';
import '../services/storage.dart';
import '../theme/theme.dart';

class ActiveRideScreen extends StatefulWidget {
  final int bookingId;
  const ActiveRideScreen({super.key, required this.bookingId});
  @override State<ActiveRideScreen> createState() => _ActiveRideScreenState();
}

class _ActiveRideScreenState extends State<ActiveRideScreen>
    with TickerProviderStateMixin {
  Timer?    _timer;
  int       _elapsed  = 0;
  bool      _overtime = false;
  int       _otMins   = 0;
  bool      _ending   = false;
  Booking?  _booking;

  late AnimationController _pulseCtrl;
  late AnimationController _rotateCtrl;
  late Animation<double>   _pulseAnim;

  @override
  void initState() {
    super.initState();
    _booking = StorageService.getBookingById(widget.bookingId);
    if (_booking != null) {
      _elapsed = DateTime.now().difference(_booking!.startTime).inSeconds;
    }

    _pulseCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 1.0, end: 1.06).animate(
        CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));

    _rotateCtrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 30))
      ..repeat();

    _timer = Timer.periodic(const Duration(seconds: 1), _tick);
  }

  void _tick(Timer t) {
    if (!mounted) return;
    setState(() {
      _elapsed++;
      final durationSecs = (_booking?.duration ?? 0) * 60;
      _overtime = _elapsed > durationSecs;
      if (_overtime) _otMins = (_elapsed - durationSecs) ~/ 60;
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseCtrl.dispose();
    _rotateCtrl.dispose();
    super.dispose();
  }

  String _fmt(int secs) {
    final s = secs.abs();
    final m = (s ~/ 60).toString().padLeft(2, '0');
    final sec = (s % 60).toString().padLeft(2, '0');
    return '$m:$sec';
  }

  Future<void> _endRide() async {
    setState(() => _ending = true);
    try {
      await context.read<AppProvider>().completeBooking(
          widget.bookingId, _otMins);
      if (!mounted) return;
      context.go('/receipt/${widget.bookingId}');
    } catch (e) {
      if (!mounted) return;
      showToast(context, e.toString().replaceFirst('Exception: ',''), error: true);
      setState(() => _ending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_booking == null) return Scaffold(
      body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline_rounded, size: 48, color: kMuted),
          const SizedBox(height: 12),
          const Text('Booking not found', style: TextStyle(color: kMuted)),
          const SizedBox(height: 16),
          TextButton(onPressed: () => context.go('/'),
              child: const Text('← Go Home')),
        ],
      )),
    );

    final durationSecs = _booking!.duration * 60;
    final progress     = _overtime ? 1.0 : _elapsed / durationSecs;
    final remaining    = durationSecs - _elapsed;
    final otCharge     = _otMins * kOvertimeRate;
    final totalNow     = _booking!.price + otCharge;

    return Scaffold(
      body: Stack(fit: StackFit.expand, children: [
        // Background gradient
        Container(decoration: BoxDecoration(
          gradient: RadialGradient(
            center: const Alignment(0, -0.5),
            radius: 1.2,
            colors: _overtime
                ? [const Color(0xFF2D0A0A), kHeroTo]
                : [const Color(0xFF1A2E0A), kHeroTo],
          ),
        )),

        // Rotating subtle ring
        AnimatedBuilder(
          animation: _rotateCtrl,
          builder: (_, __) => Transform.rotate(
            angle: _rotateCtrl.value * 6.28,
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: SweepGradient(
                  colors: [
                    Colors.transparent,
                    (_overtime ? kRed : kAccent).withAlpha(10),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
        ),

        SafeArea(child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(children: [
            const SizedBox(height: 8),

            // ── Header ───────────────────────────────────────────────────────
            Row(children: [
              GestureDetector(
                onTap: () => context.pop(),
                child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(12),
                    borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.arrow_back_rounded,
                      color: Colors.white70, size: 20)),
              ),
              Expanded(child: Column(children: [
                Text(_booking!.quadName, style: const TextStyle(
                    fontFamily: 'Playfair', fontSize: 20,
                    fontWeight: FontWeight.w700, color: Colors.white)),
                Text(_booking!.customerName, style: const TextStyle(
                    color: Colors.white38, fontSize: 12)),
              ])),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(10),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(_booking!.receiptId, style: const TextStyle(
                    color: Colors.white30, fontSize: 10,
                    fontFamily: 'monospace'))),
            ]),

            const Spacer(),

            // ── Ring timer ───────────────────────────────────────────────────
            AnimatedBuilder(
              animation: _overtime ? _pulseAnim : _pulseCtrl,
              builder: (ctx, _) => Transform.scale(
                scale: _overtime ? _pulseAnim.value : 1.0,
                child: SizedBox(width: 240, height: 240,
                  child: Stack(alignment: Alignment.center, children: [
                    // Outer glow ring
                    Container(
                      width: 240, height: 240,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(
                          color: (_overtime ? kRed : kAccent).withAlpha(30),
                          blurRadius: 40, spreadRadius: 10)],
                      ),
                    ),
                    // Background ring
                    SizedBox(width: 240, height: 240,
                      child: CircularProgressIndicator(
                        value: 1.0,
                        strokeWidth: 14,
                        color: Colors.white.withAlpha(10),
                      )),
                    // Progress ring
                    SizedBox(width: 240, height: 240,
                      child: CircularProgressIndicator(
                        value: progress,
                        strokeWidth: 14,
                        backgroundColor: Colors.transparent,
                        valueColor: AlwaysStoppedAnimation<Color>(
                            _overtime ? kRed : kAccent),
                        strokeCap: StrokeCap.round,
                      )),
                    // Centre content
                    Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      if (_overtime)
                        const Text('OVERTIME', style: TextStyle(
                            color: kRed, fontSize: 10,
                            letterSpacing: 2, fontWeight: FontWeight.w700))
                      else
                        const Text('REMAINING', style: TextStyle(
                            color: Colors.white24, fontSize: 10,
                            letterSpacing: 2)),
                      const SizedBox(height: 4),
                      Text(
                        _overtime
                            ? '+${_fmt(_elapsed - durationSecs)}'
                            : _fmt(remaining < 0 ? 0 : remaining),
                        style: TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 52, fontWeight: FontWeight.w900,
                          color: _overtime ? kRed : Colors.white,
                          shadows: [Shadow(
                              color: (_overtime ? kRed : kAccent).withAlpha(80),
                              blurRadius: 20)],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _overtime
                            ? 'of ${_booking!.duration} min session'
                            : 'of ${_booking!.duration} min',
                        style: const TextStyle(
                            color: Colors.white24, fontSize: 11)),
                    ]),
                  ]),
                ),
              ),
            ),

            const SizedBox(height: 36),

            // ── Stats row ────────────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(8),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withAlpha(12)),
              ),
              child: IntrinsicHeight(child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _StatCol('Duration', '${_booking!.duration} min',
                      Icons.timer_outlined),
                  _VertDivider(),
                  _StatCol('Base Price', '${_booking!.price.kes} KES',
                      Icons.payments_outlined),
                  if (_overtime) ...[
                    _VertDivider(),
                    _StatCol('Overtime', '+${otCharge.kes} KES',
                        Icons.warning_amber_rounded, danger: true),
                  ],
                ],
              )),
            ),

            if (_overtime) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: kRed.withAlpha(20),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: kRed.withAlpha(60)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.warning_amber_rounded,
                        color: kRed, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      '${kOvertimeRate.kes} KES/min  ·  Total now: ${totalNow.kes} KES',
                      style: const TextStyle(
                          color: kRed, fontWeight: FontWeight.w700,
                          fontSize: 13)),
                  ],
                ),
              ),
            ],

            const Spacer(),

            // ── End ride ─────────────────────────────────────────────────────
            PrimaryButton(
              label: _overtime
                  ? 'End Ride  ·  ${totalNow.kes} KES'
                  : 'End Ride',
              icon: Icons.flag_rounded,
              color: _overtime ? kRed : kGreen,
              onTap: _ending ? null : _endRide,
              loading: _ending,
            ),
            const SizedBox(height: 24),
          ]),
        )),
      ]),
    );
  }
}

class _StatCol extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final bool danger;
  const _StatCol(this.label, this.value, this.icon, {this.danger = false});

  @override
  Widget build(BuildContext context) => Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Icon(icon, color: danger ? kRed : Colors.white38, size: 16),
      const SizedBox(height: 4),
      Text(value, style: TextStyle(
          fontSize: 15, fontWeight: FontWeight.w800,
          color: danger ? kRed : Colors.white)),
      const SizedBox(height: 2),
      Text(label, style: const TextStyle(
          color: Colors.white30, fontSize: 10)),
    ],
  );
}

class _VertDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    width: 1, height: 40,
    color: Colors.white.withAlpha(15));
}
