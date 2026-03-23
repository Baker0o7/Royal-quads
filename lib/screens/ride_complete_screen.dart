import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/models.dart';
import '../services/storage.dart';
import '../models/models.dart';
import '../theme/theme.dart';

class RideCompleteScreen extends StatefulWidget {
  final int bookingId;
  const RideCompleteScreen({super.key, required this.bookingId});
  @override State<RideCompleteScreen> createState() => _RideCompleteScreenState();
}

class _RideCompleteScreenState extends State<RideCompleteScreen>
    with TickerProviderStateMixin {
  late ConfettiController _confetti;
  late AnimationController _enterCtrl;
  late AnimationController _countCtrl;
  late Animation<double>   _fadeFull;
  late Animation<Offset>   _cardSlide;
  late Animation<double>   _countAnim;

  int _rating = 0;

  @override
  void initState() {
    super.initState();
    HapticFeedback.heavyImpact();

    _confetti  = ConfettiController(duration: const Duration(seconds: 4));
    _enterCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _countCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1200));

    _fadeFull  = CurvedAnimation(parent: _enterCtrl, curve: Curves.easeOut)
        .drive(Tween(begin: 0.0, end: 1.0));
    _cardSlide = CurvedAnimation(parent: _enterCtrl, curve: Curves.easeOutCubic)
        .drive(Tween(begin: const Offset(0, 0.3), end: Offset.zero));
    _countAnim = CurvedAnimation(parent: _countCtrl, curve: Curves.easeOutCubic)
        .drive(Tween(begin: 0.0, end: 1.0));

    Future.delayed(const Duration(milliseconds: 100), () {
      _confetti.play();
      _enterCtrl.forward();
    });
    Future.delayed(const Duration(milliseconds: 600), () {
      _countCtrl.forward();
    });
  }

  @override
  void dispose() {
    _confetti.dispose();
    _enterCtrl.dispose();
    _countCtrl.dispose();
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
            ElevatedButton(onPressed: () => context.go('/'), child: const Text('Home')),
          ],
        )),
      );
    }

    return Scaffold(
      backgroundColor: heroColor(context),
      body: Stack(children: [
        // Background gradient
        Container(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: Alignment(0, -0.6),
              radius: 1.2,
              colors: [heroBg(context), heroColor(context)],
            ),
          ),
        ),

        // Confetti centre
        Align(
          alignment: Alignment.topCenter,
          child: ConfettiWidget(
            confettiController: _confetti,
            blastDirectionality: BlastDirectionality.explosive,
            numberOfParticles: 18,
            gravity: 0.3,
            colors: const [kAccent, kAccent2, kGreen, kIndigo, Colors.white],
            child: const SizedBox.shrink(),
          ),
        ),

        // Main content
        SafeArea(
          child: FadeTransition(
            opacity: _fadeFull,
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
              child: Column(children: [

                // ── Back button ───────────────────────────────────────────
                Align(
                  alignment: Alignment.centerLeft,
                  child: GestureDetector(
                    onTap: () => context.go('/'),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.arrow_back_rounded,
                          color: Colors.white, size: 22),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // ── Checkmark header ──────────────────────────────────────
                const _CheckHeader(),
                const SizedBox(height: 8),

                const Text(
                  'Ride Complete!',
                  style: TextStyle(
                    fontFamily: 'Playfair',
                    fontSize: 30,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  booking.quadName,
                  style: const TextStyle(color: kAccent2, fontSize: 15),
                ),

                const SizedBox(height: 32),

                // ── Big total counter ─────────────────────────────────────
                SlideTransition(
                  position: _cardSlide,
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: kAccent.withAlpha(15),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: kAccent.withAlpha(50)),
                      boxShadow: [BoxShadow(
                          color: kAccent.withAlpha(25), blurRadius: 30)],
                    ),
                    child: Column(children: [
                      const Text('TOTAL PAID',
                          style: TextStyle(color: kAccent, fontSize: 11,
                              letterSpacing: 2, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      AnimatedBuilder(
                        animation: _countAnim,
                        builder: (_, __) {
                          final shown = (booking.totalPaid * _countAnim.value).round();
                          return Text(
                            '${shown.kes} KES',
                            style: const TextStyle(
                              fontFamily: 'Playfair',
                              fontSize: 40,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 16),
                      // Stats row
                      Row(children: [
                        _Stat(Icons.timer_rounded, '${booking.duration} min', 'Duration'),
                        _StatDiv(),
                        _Stat(Icons.directions_bike_rounded, booking.quadName, 'Quad'),
                        if (booking.overtimeCharge > 0) ...[ _StatDiv(),
                          _Stat(Icons.warning_amber_rounded,
                              '${booking.overtimeMinutes} min OT', 'Overtime',
                              color: kRed),
                        ],
                      ]),
                    ]),
                  ),
                ),

                const SizedBox(height: 16),

                // ── Loyalty points earned ─────────────────────────────────
                Builder(builder: (ctx) {
                  final acc = StorageService.getLoyaltyAccount(
                      booking.customerPhone);
                  final currentPts = acc?.points ?? 0;
                  final earned = (booking.totalPaid / 100).floor();
                  if (earned == 0) return const SizedBox(height: 4);
                  return AnimatedOpacity(
                    opacity: 1.0, duration: const Duration(milliseconds: 600),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: kAccent.withAlpha(12),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: kAccent.withAlpha(45)),
                      ),
                      child: Row(children: [
                        const Text('🏆', style: TextStyle(fontSize: 20)),
                        const SizedBox(width: 10),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('+$earned pts earned this ride!',
                                style: const TextStyle(
                                    color: kAccent2,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13)),
                            Text('Your balance: $currentPts pts',
                                style: TextStyle(
                                    color: kAccent.withAlpha(160),
                                    fontSize: 11)),
                          ],
                        )),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 9, vertical: 4),
                          decoration: BoxDecoration(
                            color: kAccent.withAlpha(22),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text('$currentPts pts',
                              style: const TextStyle(
                                  color: kAccent2,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 11)),
                        ),
                      ]),
                    ),
                  );
                }),

                const SizedBox(height: 4),

                // ── QR Code ───────────────────────────────────────────────
                SlideTransition(
                  position: _cardSlide,
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.onSurface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF2D2820)),
                    ),
                    child: Row(children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: QrImageView(
                          data: booking.receiptId,
                          version: QrVersions.auto,
                          size: 90,
                          backgroundColor: Colors.white,
                          padding: const EdgeInsets.all(8),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Receipt ID',
                              style: TextStyle(color: Colors.white38,
                                  fontSize: 11, letterSpacing: 1)),
                          const SizedBox(height: 4),
                          Text(booking.receiptId,
                              style: const TextStyle(
                                  fontFamily: 'monospace',
                                  color: kAccent2,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 2)),
                          const SizedBox(height: 8),
                          Text(booking.customerName,
                              style: const TextStyle(
                                  color: Colors.white70, fontSize: 13)),
                          Text(booking.customerPhone,
                              style: const TextStyle(
                                  color: Colors.white38, fontSize: 12)),
                        ],
                      )),
                    ]),
                  ),
                ),

                const SizedBox(height: 20),

                // ── Star Rating ───────────────────────────────────────────
                _RatingRow(
                  rating: _rating,
                  onRate: (r) async {
                    setState(() => _rating = r);
                    HapticFeedback.lightImpact();
                    await StorageService.submitFeedback(booking.id, r, '');
                  },
                ),

                const SizedBox(height: 24),

                // ── Action buttons ────────────────────────────────────────
                Row(children: [
                  Expanded(child: _BigBtn(
                    icon: Icons.message_rounded,
                    label: 'WhatsApp',
                    color: const Color(0xFF25D366),
                    onTap: () => _whatsapp(booking),
                  )),
                  const SizedBox(width: 12),
                  Expanded(child: _BigBtn(
                    icon: Icons.receipt_long_rounded,
                    label: 'Full Receipt',
                    color: kAccent,
                    onTap: () => context.go('/receipt/${booking.id}'),
                  )),
                ]),

                const SizedBox(height: 12),

                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => context.go('/'),
                    child: const Text('New Booking',
                        style: TextStyle(color: Colors.white38)),
                  ),
                ),
              ]),
            ),
          ),
        ),
      ]),
    );
  }

  Future<void> _whatsapp(Booking b) async {
    final otLine = b.overtimeCharge > 0
        ? '\n⚠️ *Overtime:* ${b.overtimeMinutes} min (+${b.overtimeCharge.kes} KES)'
        : '';
    final mpesaLine = (b.mpesaRef?.isNotEmpty ?? false)
        ? '\n📲 *M-Pesa:* ${b.mpesaRef}'
        : '';
    final msg = Uri.encodeComponent(
        '✅ *Royal Quad Bikes Receipt*\n\n'
        'Hi ${b.customerName}! Thank you for riding with us 🤙\n\n'
        '🏍️ *Quad:* ${b.quadName}\n'
        '⏱️ *Duration:* ${b.duration} min$otLine\n'
        '🧾 *Receipt:* ${b.receiptId}\n'
        '💰 *Total:* ${b.totalPaid.kes} KES$mpesaLine\n\n'
        'Mambrui Sand Dunes 🏜️ — Book again:\n'
        'https://baker0o7.github.io/Royal-quads/');
    final phone = b.customerPhone.startsWith('0')
        ? '254${b.customerPhone.substring(1)}'
        : b.customerPhone;
    final url = Uri.parse('https://wa.me/$phone?text=$msg');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }
}

// ── Subwidgets ─────────────────────────────────────────────────────────────────

class _CheckHeader extends StatefulWidget {
  const _CheckHeader();
  @override State<_CheckHeader> createState() => _CheckHeaderState();
}

class _CheckHeaderState extends State<_CheckHeader>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _scale = CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut)
        .drive(Tween(begin: 0.0, end: 1.0));
    Future.delayed(const Duration(milliseconds: 150), _ctrl.forward);
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => ScaleTransition(
    scale: _scale,
    child: Container(
      width: 72, height: 72,
      decoration: BoxDecoration(
        color: kGreen,
        shape: BoxShape.circle,
        boxShadow: [BoxShadow(color: kGreen.withAlpha(100), blurRadius: 30)],
      ),
      child: const Icon(Icons.check_rounded, color: Colors.white, size: 36),
    ),
  );
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final String value, label;
  final Color color;
  const _Stat(this.icon, this.value, this.label, {this.color = Colors.white70});

  @override
  Widget build(BuildContext context) => Expanded(child: Column(children: [
    Container(
      width: 36, height: 36,
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(icon, color: color, size: 18)),
    const SizedBox(height: 6),
    Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w700,
        fontSize: 13), textAlign: TextAlign.center),
    const SizedBox(height: 2),
    Text(label, style: const TextStyle(color: Colors.white38, fontSize: 10)),
  ]));
}

class _StatDiv extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    width: 1, height: 40,
    color: Colors.white10,
    margin: const EdgeInsets.symmetric(horizontal: 8),
  );
}

class _BigBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _BigBtn({required this.icon, required this.label,
      required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(
            color: color.withAlpha(70), blurRadius: 16, offset: const Offset(0, 4))],
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: Colors.white, size: 18),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(
            color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
      ]),
    ),
  );
}

class _RatingRow extends StatelessWidget {
  final int rating;
  final ValueChanged<int> onRate;
  const _RatingRow({required this.rating, required this.onRate});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.onSurface,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: const Color(0xFF2D2820)),
    ),
    child: Column(children: [
      const Text('Rate this ride',
          style: TextStyle(color: Colors.white54, fontSize: 13)),
      const SizedBox(height: 12),
      Row(mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(5, (i) => GestureDetector(
            onTap: () => onRate(i + 1),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: AnimatedScale(
                scale: i < rating ? 1.2 : 1.0,
                duration: const Duration(milliseconds: 150),
                child: Icon(
                  i < rating ? Icons.star_rounded : Icons.star_outline_rounded,
                  color: i < rating ? kAccent : Colors.white24,
                  size: 34,
                ),
              ),
            ),
          ))),
      if (rating > 0) ...[
        const SizedBox(height: 8),
        Text(_label(rating),
            style: const TextStyle(color: kAccent2, fontSize: 12)),
      ],
    ]),
  );

  String _label(int r) => switch (r) {
    1 => 'Poor — we\'ll do better 😔',
    2 => 'Fair — thanks for the feedback',
    3 => 'Good ride! 👍',
    4 => 'Great experience! 🏍️',
    5 => 'Amazing — you\'re the best! ⭐',
    _ => '',
  };
}
