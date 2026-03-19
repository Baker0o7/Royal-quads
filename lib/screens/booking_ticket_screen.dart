import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/models.dart';
import '../services/storage.dart';
import '../theme/theme.dart';

/// Full-screen "Your Ride is Ready" ticket shown after waiver signing.
class BookingTicketScreen extends StatefulWidget {
  final int bookingId;
  const BookingTicketScreen({super.key, required this.bookingId});
  @override State<BookingTicketScreen> createState() => _BookingTicketScreenState();
}

class _BookingTicketScreenState extends State<BookingTicketScreen>
    with TickerProviderStateMixin {
  late AnimationController _enterCtrl;
  late AnimationController _pulseCtrl;
  late Animation<double>   _fadeFull;
  late Animation<Offset>   _cardSlide;
  late Animation<double>   _pulseAnim;

  @override
  void initState() {
    super.initState();
    HapticFeedback.heavyImpact();
    _enterCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _pulseCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1000))
      ..repeat(reverse: true);

    _fadeFull  = CurvedAnimation(parent: _enterCtrl, curve: Curves.easeOut)
        .drive(Tween(begin: 0.0, end: 1.0));
    _cardSlide = CurvedAnimation(parent: _enterCtrl, curve: Curves.easeOutCubic)
        .drive(Tween(begin: const Offset(0, 0.25), end: Offset.zero));
    _pulseAnim = CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut)
        .drive(Tween(begin: 0.85, end: 1.0));

    Future.delayed(const Duration(milliseconds: 100), _enterCtrl.forward);
  }

  @override
  void dispose() {
    _enterCtrl.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final booking = StorageService.getBookingById(widget.bookingId);
    if (booking == null) {
      return Scaffold(
        body: Center(child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Booking not found'),
            ElevatedButton(onPressed: () => context.go('/'),
                child: const Text('Home')),
          ],
        )),
      );
    }

    return Scaffold(
      backgroundColor: heroColor(context),
      body: Stack(children: [
        // Background
        Container(decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [heroBg(context), heroColor(context)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        )),

        // Gold line
        Positioned(top: 0, left: 0, right: 0,
          child: Container(height: 2,
              decoration: const BoxDecoration(gradient: kGoldGradient))),

        SafeArea(
          child: FadeTransition(
            opacity: _fadeFull,
            child: Column(children: [

              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: Column(children: [
                  ScaleTransition(
                    scale: _pulseAnim,
                    child: Container(
                      width: 64, height: 64,
                      decoration: BoxDecoration(
                        color: kGreen,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(
                            color: kGreen.withAlpha(100), blurRadius: 30)],
                      ),
                      child: const Icon(Icons.check_rounded,
                          color: Colors.white, size: 34),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text('Your Ride is Ready!',
                      style: TextStyle(fontFamily: 'Playfair', fontSize: 26,
                          fontWeight: FontWeight.w700, color: Colors.white)),
                  const SizedBox(height: 4),
                  Text('Show this to the staff',
                      style: TextStyle(color: Colors.white.withAlpha(120),
                          fontSize: 13)),
                ]),
              ),

              const SizedBox(height: 24),

              // ── Ticket card ────────────────────────────────────────────
              Expanded(
                child: SlideTransition(
                  position: _cardSlide,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: _TicketCard(booking: booking),
                  ),
                ),
              ),

              // ── Bottom buttons ─────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
                child: Column(children: [
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.play_arrow_rounded, size: 22),
                      label: const Text('Go to Ride Screen',
                          style: TextStyle(fontSize: 16,
                              fontWeight: FontWeight.w700)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kGreen,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      onPressed: () =>
                          context.go('/ride/${widget.bookingId}'),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: () => context.go('/'),
                    child: const Text('Back to Home',
                        style: TextStyle(color: Colors.white38)),
                  ),
                ]),
              ),
            ]),
          ),
        ),
      ]),
    );
  }
}

class _TicketCard extends StatelessWidget {
  final Booking booking;
  const _TicketCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    final elapsed   = DateTime.now().difference(booking.startTime).inSeconds;
    final totalSecs = booking.duration * 60;
    final remaining = (totalSecs - elapsed).clamp(0, totalSecs);
    final mins      = remaining ~/ 60;
    final secs      = remaining % 60;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E1A15),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: kAccent.withAlpha(40)),
        boxShadow: [BoxShadow(
            color: kAccent.withAlpha(15), blurRadius: 30)],
      ),
      child: Column(children: [
        // Card header
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2D2318), Color(0xFF1A1208)],
            ),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(bottom: BorderSide(color: kAccent.withAlpha(30))),
          ),
          child: Row(children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: kAccent.withAlpha(60), width: 2),
              ),
              child: ClipOval(child: Image.asset(
                  'assets/images/logo.png', fit: BoxFit.cover)),
            ),
            const SizedBox(width: 12),
            const Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Royal Quad Bikes',
                    style: TextStyle(fontFamily: 'Playfair',
                        fontSize: 15, fontWeight: FontWeight.w700,
                        color: Colors.white)),
                Text('Mambrui Sand Dunes',
                    style: TextStyle(color: Colors.white38, fontSize: 11)),
              ],
            )),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: kAccent.withAlpha(20),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: kAccent.withAlpha(50)),
              ),
              child: Text(booking.receiptId,
                  style: const TextStyle(color: kAccent2, fontSize: 10,
                      fontFamily: 'monospace', fontWeight: FontWeight.w700,
                      letterSpacing: 1.5)),
            ),
          ]),
        ),

        // Perforated divider
        _PerforationLine(),

        // Body
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(children: [
            // Quad + customer row
            Row(children: [
              _TicketStat(
                icon: Icons.directions_bike_rounded,
                color: kAccent,
                label: 'QUAD',
                value: booking.quadName,
              ),
              _VertDivider(),
              _TicketStat(
                icon: Icons.person_rounded,
                color: kIndigo,
                label: 'RIDER',
                value: booking.customerName,
              ),
            ]),
            const SizedBox(height: 16),
            // Duration + time row
            Row(children: [
              _TicketStat(
                icon: Icons.timer_rounded,
                color: kGreen,
                label: 'DURATION',
                value: '${booking.duration} min',
              ),
              _VertDivider(),
              _TicketStat(
                icon: Icons.schedule_rounded,
                color: kOrange,
                label: 'REMAINING',
                value: '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}',
                mono: true,
              ),
            ]),
            const SizedBox(height: 16),
            // Price
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2D2318), Color(0xFF1A1208)],
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: kAccent.withAlpha(30)),
              ),
              child: Row(children: [
                const Icon(Icons.payments_rounded, color: kAccent, size: 18),
                const SizedBox(width: 8),
                const Text('TOTAL PAID',
                    style: TextStyle(color: Colors.white38, fontSize: 11,
                        letterSpacing: 1)),
                const Spacer(),
                Text('${booking.totalPaid.kes} KES',
                    style: const TextStyle(fontFamily: 'Playfair',
                        color: kAccent2, fontSize: 20,
                        fontWeight: FontWeight.w800)),
              ]),
            ),
            const SizedBox(height: 20),

            // QR Code
            Center(child: Column(children: [
              const Text('SCAN TO VERIFY',
                  style: TextStyle(color: Colors.white24, fontSize: 9,
                      letterSpacing: 2)),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(
                      color: kAccent.withAlpha(40), blurRadius: 20)],
                ),
                child: QrImageView(
                  data: '${booking.receiptId}|${booking.quadName}|'
                      '${booking.customerName}|${booking.duration}min',
                  version: QrVersions.auto,
                  size: 160,
                  backgroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 10),
              Text(booking.receiptId,
                  style: const TextStyle(color: kAccent2, fontSize: 13,
                      fontFamily: 'monospace', fontWeight: FontWeight.w700,
                      letterSpacing: 2)),
            ])),
          ]),
        ),
      ]),
    );
  }
}

class _TicketStat extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label, value;
  final bool mono;
  const _TicketStat({required this.icon, required this.color,
      required this.label, required this.value, this.mono = false});

  @override
  Widget build(BuildContext context) => Expanded(child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(children: [
        Icon(icon, color: color, size: 13),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(color: Colors.white38,
            fontSize: 9, letterSpacing: 1.5)),
      ]),
      const SizedBox(height: 4),
      Text(value,
          style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: mono ? 18 : 14,
              fontFamily: mono ? 'monospace' : null,
              letterSpacing: mono ? 2 : 0)),
    ],
  ));
}

class _VertDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    width: 1, height: 44,
    color: Colors.white.withAlpha(15),
    margin: const EdgeInsets.symmetric(horizontal: 16),
  );
}

class _PerforationLine extends StatelessWidget {
  @override
  Widget build(BuildContext context) => SizedBox(
    height: 20,
    child: Row(children: [
      Container(width: 12, height: 20,
          decoration: BoxDecoration(
              color: heroColor(context),
              borderRadius: BorderRadius.horizontal(
                  right: Radius.circular(10)))),
      Expanded(child: LayoutBuilder(builder: (_, c) {
        final count = (c.maxWidth / 10).floor();
        return Row(children: List.generate(count, (i) => Expanded(
          child: Container(height: 1,
              color: i.isEven ? const Color(0xFF2D2820) : Colors.transparent),
        )));
      })),
      Container(width: 12, height: 20,
          decoration: BoxDecoration(
              color: heroColor(context),
              borderRadius: BorderRadius.horizontal(
                  left: Radius.circular(10)))),
    ]),
  );
}
