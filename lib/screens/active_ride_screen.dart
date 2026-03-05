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

class _ActiveRideScreenState extends State<ActiveRideScreen> with TickerProviderStateMixin {
  Timer?   _timer;
  int      _elapsed    = 0;
  bool     _overtime   = false;
  int      _otMins     = 0;
  bool     _ending     = false;
  Booking? _booking;

  late AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _booking = StorageService.getBookingById(widget.bookingId);
    if (_booking != null) {
      _elapsed = DateTime.now().difference(_booking!.startTime).inSeconds;
    }
    _pulseCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800))
      ..repeat(reverse: true);
    _timer = Timer.periodic(const Duration(seconds: 1), _tick);
  }

  void _tick(Timer t) {
    if (!mounted) return;
    setState(() {
      _elapsed++;
      final durationSecs = (_booking?.duration ?? 0) * 60;
      if (_elapsed > durationSecs) {
        _overtime = true;
        _otMins = (_elapsed - durationSecs) ~/ 60;
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseCtrl.dispose();
    super.dispose();
  }

  String _fmtTime(int secs) {
    final m = (secs ~/ 60).toString().padLeft(2, '0');
    final s = (secs % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Future<void> _endRide() async {
    setState(() => _ending = true);
    try {
      await context.read<AppProvider>().completeBooking(widget.bookingId, _otMins);
      if (!mounted) return;
      context.go('/receipt/${widget.bookingId}');
    } catch (e) {
      if (!mounted) return;
      showToast(context, 'Error: $e', error: true);
      setState(() => _ending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_booking == null) return Scaffold(body: Center(
        child: Text('Booking not found', style: const TextStyle(color: kMuted))));

    final durationSecs = _booking!.duration * 60;
    final progress = _overtime ? 1.0 : _elapsed / durationSecs;
    final remaining = durationSecs - _elapsed;
    final otCharge  = _otMins * kOvertimeRate;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [kHeroFrom, Color(0xFF1A2E1A)],
            begin: Alignment.topLeft, end: Alignment.bottomRight),
        ),
        child: SafeArea(child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(children: [
            // ── Header ────────────────────────────────────────────────────
            Row(children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: Colors.white60),
                onPressed: () => context.pop(),
              ),
              Expanded(child: Text(_booking!.quadName,
                textAlign: TextAlign.center,
                style: const TextStyle(fontFamily: 'Playfair',
                    fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white))),
              const SizedBox(width: 48),
            ]),

            const SizedBox(height: 12),
            Text(_booking!.customerName,
                style: const TextStyle(color: Colors.white54, fontSize: 14)),

            const Spacer(),

            // ── Ring timer ─────────────────────────────────────────────────
            AnimatedBuilder(
              animation: _pulseCtrl,
              builder: (ctx, _) {
                final pulse = _overtime
                    ? 1.0 + _pulseCtrl.value * 0.05
                    : 1.0;
                return Transform.scale(
                  scale: pulse,
                  child: SizedBox(
                    width: 220, height: 220,
                    child: Stack(alignment: Alignment.center, children: [
                      SizedBox(width: 220, height: 220,
                        child: CircularProgressIndicator(
                          value: progress,
                          strokeWidth: 12,
                          backgroundColor: Colors.white12,
                          color: _overtime ? kRed : kAccent,
                        )),
                      Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text(
                          _overtime
                              ? '+${_fmtTime(_elapsed - durationSecs)}'
                              : _fmtTime(remaining < 0 ? 0 : remaining),
                          style: TextStyle(
                            fontFamily: 'Playfair',
                            fontSize: 48, fontWeight: FontWeight.w700,
                            color: _overtime ? kRed : Colors.white),
                        ),
                        Text(
                          _overtime ? 'OVERTIME' : 'remaining',
                          style: TextStyle(
                            color: _overtime ? kRed.withAlpha(200) : Colors.white38,
                            fontSize: 12, letterSpacing: 1.5),
                        ),
                      ]),
                    ]),
                  ),
                );
              },
            ),

            const SizedBox(height: 32),

            // ── Stats row ──────────────────────────────────────────────────
            Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
              _Stat(label: 'Duration', value: '${_booking!.duration} min'),
              _Stat(label: 'Base Price', value: '${_booking!.price.kes} KES'),
              if (_overtime)
                _Stat(label: 'Overtime', value: '+${otCharge.kes} KES', danger: true),
            ]),

            if (_overtime) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: kRed.withAlpha(20),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: kRed.withAlpha(60)),
                ),
                child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.warning_amber_rounded, color: kRed, size: 18),
                  const SizedBox(width: 8),
                  Text('${kOvertimeRate} KES/min overtime charge',
                      style: const TextStyle(color: kRed, fontWeight: FontWeight.w600)),
                ]),
              ),
            ],

            const Spacer(),

            // ── End ride ───────────────────────────────────────────────────
            PrimaryButton(
              label: _overtime
                  ? 'End Ride — Total: ${(_booking!.price + otCharge).kes} KES'
                  : 'End Ride',
              icon: Icons.flag_rounded,
              color: _overtime ? kRed : kGreen,
              onTap: _ending ? null : _endRide,
              loading: _ending,
            ),

            const SizedBox(height: 20),
          ]),
        )),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label, value;
  final bool danger;
  const _Stat({required this.label, required this.value, this.danger = false});

  @override
  Widget build(BuildContext context) => Column(children: [
    Text(value, style: TextStyle(
        fontSize: 16, fontWeight: FontWeight.w700,
        color: danger ? kRed : Colors.white)),
    const SizedBox(height: 2),
    Text(label, style: const TextStyle(color: Colors.white38, fontSize: 11)),
  ]);
}
