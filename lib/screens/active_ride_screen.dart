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
  Timer?   _timer;
  int      _elapsed  = 0;
  bool     _overtime = false;
  int      _otMins   = 0;
  bool     _ending   = false;
  Booking? _booking;

  late AnimationController _pulseCtrl;
  late AnimationController _rotateCtrl;
  late AnimationController _entryCtrl;
  late Animation<double>   _pulseAnim;
  late Animation<double>   _entryAnim;

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

    _entryCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _entryAnim = CurvedAnimation(parent: _entryCtrl, curve: Curves.easeOut);
    _entryCtrl.forward();

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
    _entryCtrl.dispose();
    super.dispose();
  }

  String _fmt(int secs) {
    final s = secs.abs();
    final m = (s ~/ 60).toString().padLeft(2, '0');
    final sec = (s % 60).toString().padLeft(2, '0');
    return '$m:$sec';
  }

  // ── Extend ride ─────────────────────────────────────────────────────────
  void _showExtend() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ExtendSheet(
        booking: _booking!,
        onExtend: (addedMins, addedPrice) async {
          // Update booking duration in storage
          final updated = _booking!.copyWith(
            // We patch the price directly; duration stays for ring calc
          );
          // Add the extension as an overtime-style charge stored to booking
          // Simplest approach: create a note in the booking via mpesaRef
          // Actually we extend by updating the booking's stored duration
          await StorageService.extendBooking(
              widget.bookingId, addedMins, addedPrice);
          setState(() {
            _booking = StorageService.getBookingById(widget.bookingId);
          });
          if (mounted) {
            showToast(context, 'Ride extended by $addedMins min 🏍️');
          }
        },
      ),
    );
  }

  // ── End ride confirmation ────────────────────────────────────────────────
  void _showEndRide() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _EndRideSheet(
        booking: _booking!,
        otMins: _otMins,
        onConfirm: (mpesaRef) => _endRide(mpesaRef),
      ),
    );
  }

  Future<void> _endRide(String? mpesaRef) async {
    setState(() => _ending = true);
    try {
      // Save mpesa ref if provided
      if (mpesaRef != null && mpesaRef.isNotEmpty) {
        await StorageService.updateBookingMpesa(widget.bookingId, mpesaRef);
      }
      await context.read<AppProvider>().completeBooking(
          widget.bookingId, _otMins);
      if (!mounted) return;
      context.go('/ride_complete/${widget.bookingId}');
    } catch (e) {
      if (!mounted) return;
      showToast(context, e.toString().replaceFirst('Exception: ', ''), error: true);
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
    final progress     = _overtime ? 1.0 : (_elapsed / durationSecs).clamp(0.0, 1.0);
    final remaining    = durationSecs - _elapsed;
    final otCharge     = _otMins * kOvertimeRate;
    final totalNow     = _booking!.price + otCharge;

    return Scaffold(
      body: Stack(fit: StackFit.expand, children: [
        // Background gradient
        AnimatedContainer(
          duration: const Duration(milliseconds: 800),
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: const Alignment(0, -0.5),
              radius: 1.2,
              colors: _overtime
                  ? [const Color(0xFF2D0A0A), kHeroTo]
                  : [kHeroFrom, kHeroTo],
            ),
          ),
        ),

        // Rotating ambient ring
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
                    (_overtime ? kRed : kAccent).withAlpha(8),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
        ),

        SafeArea(child: FadeTransition(
          opacity: _entryAnim,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(children: [
              const SizedBox(height: 8),

              // ── Header ─────────────────────────────────────────────────
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
                const SizedBox(width: 12),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_booking!.quadName, style: const TextStyle(
                        fontFamily: 'Playfair', fontSize: 18,
                        fontWeight: FontWeight.w700, color: Colors.white)),
                    Text(_booking!.customerName, style: const TextStyle(
                        color: Colors.white38, fontSize: 12)),
                  ],
                )),
                // Receipt ID pill
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(10),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withAlpha(12)),
                  ),
                  child: Text(_booking!.receiptId, style: const TextStyle(
                      color: Colors.white30, fontSize: 10,
                      fontFamily: 'monospace')),
                ),
              ]),

              const Spacer(),

              // ── Ring timer ─────────────────────────────────────────────
              AnimatedBuilder(
                animation: _overtime ? _pulseAnim : _entryCtrl,
                builder: (ctx, _) => Transform.scale(
                  scale: _overtime ? _pulseAnim.value : 1.0,
                  child: SizedBox(width: 240, height: 240,
                    child: Stack(alignment: Alignment.center, children: [
                      // Glow
                      Container(
                        width: 240, height: 240,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [BoxShadow(
                            color: (_overtime ? kRed : kAccent).withAlpha(
                                _overtime ? 50 : 25),
                            blurRadius: 40, spreadRadius: 8)],
                        ),
                      ),
                      // Track
                      SizedBox(width: 240, height: 240,
                        child: CircularProgressIndicator(
                          value: 1.0, strokeWidth: 14,
                          color: Colors.white.withAlpha(8))),
                      // Progress
                      SizedBox(width: 240, height: 240,
                        child: CircularProgressIndicator(
                          value: progress, strokeWidth: 14,
                          backgroundColor: Colors.transparent,
                          valueColor: AlwaysStoppedAnimation<Color>(
                              _overtime ? kRed : kAccent),
                          strokeCap: StrokeCap.round)),
                      // Centre
                      Column(mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                        Text(
                          _overtime ? 'OVERTIME' : 'REMAINING',
                          style: TextStyle(
                              color: _overtime
                                  ? kRed : Colors.white24,
                              fontSize: 10, letterSpacing: 2.5,
                              fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _overtime
                              ? '+${_fmt(_elapsed - durationSecs)}'
                              : _fmt(remaining < 0 ? 0 : remaining),
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 50,
                            fontWeight: FontWeight.w900,
                            color: _overtime ? kRed : Colors.white,
                            shadows: [Shadow(
                                color: (_overtime ? kRed : kAccent).withAlpha(80),
                                blurRadius: 20)],
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_booking!.duration} min session',
                          style: const TextStyle(
                              color: Colors.white24, fontSize: 11)),
                        // Phone number
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(8),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(_booking!.customerPhone,
                              style: const TextStyle(
                                  color: Colors.white30,
                                  fontSize: 11,
                                  fontFamily: 'monospace')),
                        ),
                      ]),
                    ]),
                  ),
                ),
              ),

              const SizedBox(height: 28),

              // ── Stats row ──────────────────────────────────────────────
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(7),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withAlpha(10)),
                ),
                child: IntrinsicHeight(child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _StatCol('Duration', '${_booking!.duration} min',
                        Icons.timer_outlined),
                    _VertDivider(),
                    _StatCol('Base', '${_booking!.price.kes} KES',
                        Icons.payments_outlined),
                    if (_overtime) ...[
                      _VertDivider(),
                      _StatCol('OT (${_otMins}m)', '+${otCharge.kes}',
                          Icons.warning_amber_rounded, danger: true),
                    ],
                    _VertDivider(),
                    _StatCol('Total', '${totalNow.kes} KES',
                        Icons.receipt_outlined,
                        highlight: true),
                  ],
                )),
              ),

              // ── Overtime warning ───────────────────────────────────────
              if (_overtime) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 9),
                  decoration: BoxDecoration(
                    color: kRed.withAlpha(20),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: kRed.withAlpha(60)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.warning_amber_rounded,
                          color: kRed, size: 15),
                      const SizedBox(width: 6),
                      Text(
                        '${kOvertimeRate.kes} KES/min  ·  '
                        '${_otMins} min overtime',
                        style: const TextStyle(
                            color: kRed, fontWeight: FontWeight.w700,
                            fontSize: 12)),
                    ],
                  ),
                ),
              ],

              const Spacer(),

              // ── Action buttons ─────────────────────────────────────────
              Row(children: [
                // Extend ride
                Expanded(child: GestureDetector(
                  onTap: _showExtend,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(8),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withAlpha(15)),
                    ),
                    child: Column(children: [
                      const Icon(Icons.add_circle_outline_rounded,
                          color: Colors.white70, size: 22),
                      const SizedBox(height: 4),
                      const Text('Extend', style: TextStyle(
                          color: Colors.white54, fontSize: 12,
                          fontWeight: FontWeight.w600)),
                    ]),
                  ),
                )),
                const SizedBox(width: 12),
                // End ride — main CTA
                Expanded(flex: 3, child: GestureDetector(
                  onTap: (_ending) ? null : _showEndRide,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    decoration: BoxDecoration(
                      color: _overtime ? kRed : kGreen,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(
                        color: (_overtime ? kRed : kGreen).withAlpha(80),
                        blurRadius: 20, offset: const Offset(0, 6))],
                    ),
                    child: _ending
                        ? const Center(child: SizedBox(width: 22, height: 22,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2.5)))
                        : Row(mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.flag_rounded,
                                  color: Colors.white, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                _overtime
                                    ? 'End  ·  ${totalNow.kes} KES'
                                    : 'End Ride',
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 16)),
                            ]),
                  ),
                )),
              ]),
              const SizedBox(height: 24),
            ]),
          ),
        )),
      ]),
    );
  }
}

// ── End-Ride Confirmation Sheet ───────────────────────────────────────────────
class _EndRideSheet extends StatefulWidget {
  final Booking booking;
  final int otMins;
  final Future<void> Function(String? mpesaRef) onConfirm;
  const _EndRideSheet({required this.booking, required this.otMins,
      required this.onConfirm});
  @override State<_EndRideSheet> createState() => _EndRideSheetState();
}

class _EndRideSheetState extends State<_EndRideSheet> {
  final _mpesaCtrl = TextEditingController();
  bool _loading = false;

  int get _otCharge => widget.otMins * kOvertimeRate;
  int get _total    => widget.booking.price + _otCharge;

  @override
  void dispose() { _mpesaCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.all(12),
    decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor, borderRadius: BorderRadius.circular(24)),
    padding: EdgeInsets.only(
      bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      top: 20, left: 20, right: 20,
    ),
    child: Column(mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Handle
      Center(child: Container(width: 40, height: 4,
          decoration: BoxDecoration(
              color: kBorder, borderRadius: BorderRadius.circular(2)))),
      const SizedBox(height: 16),

      // Title
      Row(children: [
        Container(width: 40, height: 40,
          decoration: BoxDecoration(
              color: kGreen.withAlpha(15),
              borderRadius: BorderRadius.circular(12)),
          child: const Icon(Icons.flag_rounded, color: kGreen, size: 20)),
        const SizedBox(width: 12),
        const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('End Ride', style: TextStyle(
              fontFamily: 'Playfair', fontSize: 20,
              fontWeight: FontWeight.w700)),
          Text('Confirm payment and close booking',
              style: TextStyle(color: kMuted, fontSize: 12)),
        ]),
      ]),

      const SizedBox(height: 20),

      // Summary card
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: kCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: kBorder),
        ),
        child: Column(children: [
          _SummaryRow(widget.booking.quadName, widget.booking.customerName,
              Icons.directions_bike_rounded, kAccent),
          const Divider(color: kBorder, height: 20),
          _SummaryRow('Duration', '${widget.booking.duration} min',
              Icons.timer_rounded, kMuted),
          const SizedBox(height: 6),
          _SummaryRow('Base price', '${widget.booking.price.kes} KES',
              Icons.payments_rounded, kMuted),
          if (widget.otMins > 0) ...[
            const SizedBox(height: 6),
            _SummaryRow('Overtime (${widget.otMins} min)',
                '+${_otCharge.kes} KES',
                Icons.warning_amber_rounded, kRed),
          ],
          const Divider(color: kBorder, height: 20),
          Row(children: [
            const Icon(Icons.receipt_long_rounded, size: 18, color: kAccent),
            const SizedBox(width: 10),
            const Text('TOTAL', style: TextStyle(
                fontWeight: FontWeight.w800, fontSize: 15, letterSpacing: 0.5)),
            const Spacer(),
            Text('${_total.kes} KES', style: const TextStyle(
                fontFamily: 'Playfair', fontSize: 22,
                fontWeight: FontWeight.w900, color: kAccent)),
          ]),
        ]),
      ),

      const SizedBox(height: 16),

      // M-Pesa ref (already paid? enter here)
      // Pre-fill if one exists
      TextField(
        controller: _mpesaCtrl
          ..text = widget.booking.mpesaRef ?? '',
        textCapitalization: TextCapitalization.characters,
        decoration: InputDecoration(
          labelText: 'M-Pesa Reference',
          hintText: 'e.g. SFK3X2Y4P0',
          prefixIcon: Container(
            margin: const EdgeInsets.all(10),
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: kGreen.withAlpha(15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.smartphone_rounded,
                color: kGreen, size: 16)),
          helperText: 'Optional — enter if customer paid via M-Pesa',
        ),
      ),

      const SizedBox(height: 16),

      // Till number reminder
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: kGreen.withAlpha(8),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: kGreen.withAlpha(30)),
        ),
        child: Row(children: [
          const Icon(Icons.account_balance_rounded,
              color: kGreen, size: 14),
          const SizedBox(width: 8),
          const Text('Till: ', style: TextStyle(
              color: kMuted, fontSize: 12)),
          Text(kTillNumber, style: const TextStyle(
              color: kGreen, fontWeight: FontWeight.w800,
              fontSize: 13, fontFamily: 'monospace')),
          const Spacer(),
          Text('${_total.kes} KES', style: const TextStyle(
              color: kGreen, fontWeight: FontWeight.w700,
              fontSize: 13)),
        ]),
      ),

      const SizedBox(height: 20),

      // Confirm button
      SizedBox(width: double.infinity, height: 54,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: kGreen, foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16)),
            elevation: 0,
          ),
          onPressed: _loading ? null : () async {
            setState(() => _loading = true);
            Navigator.pop(context);
            await widget.onConfirm(
                _mpesaCtrl.text.trim().isEmpty
                    ? null : _mpesaCtrl.text.trim());
          },
          child: _loading
              ? const SizedBox(width: 22, height: 22,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2.5))
              : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.check_circle_rounded, size: 20),
                  const SizedBox(width: 10),
                  Text('Confirm  ·  ${_total.kes} KES',
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w800)),
                ]),
        ),
      ),
    ]),
  );
}

class _SummaryRow extends StatelessWidget {
  final String label, value; final IconData icon; final Color color;
  const _SummaryRow(this.label, this.value, this.icon, this.color);
  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, size: 14, color: color),
    const SizedBox(width: 8),
    Text(label, style: const TextStyle(color: kMuted, fontSize: 13)),
    const Spacer(),
    Text(value, style: const TextStyle(
        fontWeight: FontWeight.w700, fontSize: 13)),
  ]);
}

// ── Extend Ride Sheet ─────────────────────────────────────────────────────────
class _ExtendSheet extends StatefulWidget {
  final Booking booking;
  final Future<void> Function(int addedMins, int addedPrice) onExtend;
  const _ExtendSheet({required this.booking, required this.onExtend});
  @override State<_ExtendSheet> createState() => _ExtendSheetState();
}

class _ExtendSheetState extends State<_ExtendSheet> {
  int? _addMins, _addPrice;
  bool _loading = false;

  static const _options = [
    {'mins': 5,  'price': 1000, 'label': '+ 5 min'},
    {'mins': 10, 'price': 1800, 'label': '+ 10 min'},
    {'mins': 15, 'price': 2200, 'label': '+ 15 min'},
    {'mins': 30, 'price': 3500, 'label': '+ 30 min'},
  ];

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.all(12),
    decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor, borderRadius: BorderRadius.circular(24)),
    padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
    child: Column(mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start, children: [
      Center(child: Container(width: 40, height: 4,
          decoration: BoxDecoration(
              color: kBorder, borderRadius: BorderRadius.circular(2)))),
      const SizedBox(height: 16),

      Row(children: [
        Container(width: 40, height: 40,
          decoration: BoxDecoration(
              color: kAccent.withAlpha(15),
              borderRadius: BorderRadius.circular(12)),
          child: const Icon(Icons.add_circle_rounded,
              color: kAccent, size: 20)),
        const SizedBox(width: 12),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Extend Ride', style: TextStyle(
              fontFamily: 'Playfair', fontSize: 20,
              fontWeight: FontWeight.w700)),
          Text('Currently ${widget.booking.duration} min',
              style: const TextStyle(color: kMuted, fontSize: 12)),
        ]),
      ]),

      const SizedBox(height: 20),

      GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        crossAxisSpacing: 10, mainAxisSpacing: 10,
        childAspectRatio: 2.2,
        children: _options.map((o) {
          final sel = _addMins == o['mins'];
          return GestureDetector(
            onTap: () => setState(() {
              _addMins  = o['mins']  as int;
              _addPrice = o['price'] as int;
            }),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              decoration: BoxDecoration(
                color: sel ? kAccent.withAlpha(20) : kCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: sel ? kAccent : kBorder,
                    width: sel ? 2 : 1),
                boxShadow: sel ? kShadowSm : null,
              ),
              child: Column(
                  mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(o['label'] as String, style: TextStyle(
                    fontWeight: FontWeight.w800, fontSize: 14,
                    color: sel ? kAccent : kText)),
                const SizedBox(height: 2),
                Text('${(o['price'] as int).kes} KES', style: TextStyle(
                    fontSize: 11,
                    color: sel ? kAccent.withAlpha(180) : kMuted)),
              ]),
            ),
          );
        }).toList(),
      ),

      const SizedBox(height: 20),

      SizedBox(width: double.infinity, height: 52,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: kAccent,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16)),
            elevation: 0,
          ),
          onPressed: (_addMins == null || _loading) ? null : () async {
            setState(() => _loading = true);
            Navigator.pop(context);
            await widget.onExtend(_addMins!, _addPrice!);
          },
          child: Text(
            _addMins == null
                ? 'Select duration'
                : 'Add $_addMins min  ·  ${_addPrice!.kes} KES',
            style: const TextStyle(
                fontSize: 15, fontWeight: FontWeight.w800)),
        ),
      ),
    ]),
  );
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────
class _StatCol extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final bool danger, highlight;
  const _StatCol(this.label, this.value, this.icon,
      {this.danger = false, this.highlight = false});

  @override
  Widget build(BuildContext context) => Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Icon(icon,
          color: danger ? kRed : highlight ? kAccent : Colors.white38,
          size: 15),
      const SizedBox(height: 4),
      Text(value, style: TextStyle(
          fontSize: 13, fontWeight: FontWeight.w800,
          color: danger ? kRed : highlight ? kAccent : Colors.white)),
      const SizedBox(height: 2),
      Text(label, style: const TextStyle(
          color: Colors.white30, fontSize: 9)),
    ],
  );
}

class _VertDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
      width: 1, height: 36, color: Colors.white.withAlpha(12));
}
