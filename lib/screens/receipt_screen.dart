import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:printing/printing.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:url_launcher/url_launcher.dart';
import '../models/models.dart';
import '../services/storage.dart';
import '../theme/theme.dart';

class ReceiptScreen extends StatefulWidget {
  final int bookingId;
  const ReceiptScreen({super.key, required this.bookingId});
  @override State<ReceiptScreen> createState() => _ReceiptScreenState();
}

class _ReceiptScreenState extends State<ReceiptScreen>
    with SingleTickerProviderStateMixin {
  int    _rating    = 0;
  String _feedback  = '';
  bool   _submitted = false;
  bool   _printing  = false;

  late AnimationController _checkCtrl;
  late Animation<double>   _checkAnim;

  @override
  void initState() {
    super.initState();
    _checkCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _checkAnim = CurvedAnimation(
        parent: _checkCtrl, curve: Curves.elasticOut);
    // Start check animation after short delay
    Future.delayed(const Duration(milliseconds: 300),
        () { if (mounted) _checkCtrl.forward(); });
  }

  @override
  void dispose() { _checkCtrl.dispose(); super.dispose(); }

  String _fmtDate(DateTime d) => d.display;

  @override
  Widget build(BuildContext context) {
    final booking = StorageService.getBookingById(widget.bookingId);
    if (booking == null) return Scaffold(
      body: Center(child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.receipt_long_outlined, size: 56, color: kBorder),
          const SizedBox(height: 16),
          const Text('Receipt not found',
              style: TextStyle(color: kMuted, fontSize: 16)),
          const SizedBox(height: 16),
          PrimaryButton(label: 'Go Home', icon: Icons.home_rounded,
              onTap: () => context.go('/')),
        ],
      )),
    );

    return Scaffold(
      backgroundColor: kBg,
      body: CustomScrollView(slivers: [
        // ── App bar ────────────────────────────────────────────────────────
        SliverAppBar(
          expandedHeight: 140, pinned: true, stretch: true,
          flexibleSpace: FlexibleSpaceBar(
            stretchModes: const [StretchMode.zoomBackground],
            background: Stack(fit: StackFit.expand, children: [
              Container(decoration: const BoxDecoration(gradient: kHeroGradient)),
              Container(decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [kGreen.withAlpha(30), Colors.transparent],
                  begin: Alignment.topCenter, end: Alignment.bottomCenter))),
              Center(child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 20),
                  ScaleTransition(
                    scale: _checkAnim,
                    child: Container(
                      width: 56, height: 56,
                      decoration: BoxDecoration(
                        color: kGreen, shape: BoxShape.circle,
                        boxShadow: [BoxShadow(
                            color: kGreen.withAlpha(80), blurRadius: 20)]),
                      child: const Icon(Icons.check_rounded,
                          color: Colors.white, size: 30)),
                  ),
                  const SizedBox(height: 8),
                  const Text('Ride Complete!', style: TextStyle(
                      fontFamily: 'Playfair', fontSize: 18,
                      fontWeight: FontWeight.w700, color: Colors.white)),
                ],
              )),
            ]),
          ),
          leading: IconButton(
              icon: const Icon(Icons.close_rounded, color: Colors.white),
              onPressed: () => context.go('/')),
          actions: [
            IconButton(
              icon: _printing
                  ? const SizedBox(width: 18, height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.print_rounded, color: Colors.white),
              onPressed: _printing ? null : () => _print(booking),
              tooltip: 'Print / Save PDF',
            ),
          ],
        ),

        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(delegate: SliverChildListDelegate([

            // ── Receipt card ─────────────────────────────────────────────
            _ReceiptCard(booking: booking),

            const SizedBox(height: 16),

            // ── Action buttons ────────────────────────────────────────────
            Row(children: [
              Expanded(child: _ActionBtn(
                icon: Icons.message_rounded,
                label: 'WhatsApp',
                color: const Color(0xFF25D366),
                onTap: () => _sendWhatsApp(booking),
              )),
              const SizedBox(width: 12),
              Expanded(child: _ActionBtn(
                icon: Icons.print_rounded,
                label: 'Print PDF',
                color: kIndigo,
                onTap: () => _print(booking),
              )),
            ]),

            const SizedBox(height: 24),

            // ── Rating ────────────────────────────────────────────────────
            SectionHeading('Rate Your Ride', icon: Icons.star_rounded),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: _submitted
                  ? _FeedbackDone(key: const ValueKey('done'))
                  : _RatingCard(
                      key: const ValueKey('rating'),
                      rating: _rating,
                      onRate: (r) => setState(() => _rating = r),
                      onFeedback: (v) => _feedback = v,
                      onSubmit: () async {
                        await StorageService.submitFeedback(
                            widget.bookingId, _rating, _feedback);
                        setState(() => _submitted = true);
                        if (mounted) showToast(context, 'Thank you! 🌟');
                      },
                    ),
            ),

            const SizedBox(height: 20),
            PrimaryButton(
              label: 'New Booking',
              icon: Icons.add_circle_outline_rounded,
              onTap: () => context.go('/'),
              outlined: true,
              color: kAccent,
            ),
            const SizedBox(height: 48),
          ])),
        ),
      ]),
    );
  }

  Future<void> _sendWhatsApp(Booking b) async {
    final msg = Uri.encodeComponent(
        '✅ *Royal Quad Bikes Receipt*\n\n'
        'Hi ${b.customerName}! Thank you for riding with us.\n\n'
        '🏍️ *Quad:* ${b.quadName}\n'
        '⏱️ *Duration:* ${b.duration} min\n'
        '📅 *Date:* ${_fmtDate(b.startTime)}\n'
        '🧾 *Receipt:* ${b.receiptId}\n'
        '💰 *Total:* ${b.totalPaid.kes} KES\n\n'
        'Mambrui Sand Dunes, Kenya 🇰🇪\n'
        'We hope to see you again!');
    final phone = b.customerPhone.startsWith('0')
        ? '254${b.customerPhone.substring(1)}'
        : b.customerPhone;
    final url = Uri.parse('https://wa.me/$phone?text=$msg');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) showToast(context, 'Cannot open WhatsApp', error: true);
    }
  }

  Future<void> _print(Booking booking) async {
    setState(() => _printing = true);
    try {
      final doc = pw.Document();
      final rows = _receiptRows(booking);
      doc.addPage(pw.Page(
        pageFormat: PdfPageFormat.a5,
        margin: const pw.EdgeInsets.all(32),
        build: (ctx) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            // Header
            pw.Row(crossAxisAlignment: pw.CrossAxisAlignment.center, children: [
              pw.Expanded(child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('Royal Quad Bikes',
                      style: pw.TextStyle(fontSize: 20,
                          fontWeight: pw.FontWeight.bold)),
                  pw.Text('Mambrui Sand Dunes, Kilifi County, Kenya',
                      style: const pw.TextStyle(fontSize: 10,
                          color: PdfColors.grey600)),
                ],
              )),
              pw.Container(
                padding: const pw.EdgeInsets.symmetric(
                    horizontal: 12, vertical: 6),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.amber700),
                  borderRadius: const pw.BorderRadius.all(
                      pw.Radius.circular(6)),
                ),
                child: pw.Text('RECEIPT',
                    style: pw.TextStyle(fontSize: 11,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.amber800)),
              ),
            ]),
            pw.SizedBox(height: 4),
            pw.Divider(color: PdfColors.amber700, thickness: 2),
            pw.SizedBox(height: 12),
            // Receipt ID
            pw.Text(booking.receiptId,
                style: pw.TextStyle(fontSize: 13,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.grey700)),
            pw.SizedBox(height: 16),
            // Rows
            ...rows.map((r) => pw.Padding(
              padding: const pw.EdgeInsets.symmetric(vertical: 4),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(r[0], style: const pw.TextStyle(
                      fontSize: 11, color: PdfColors.grey700)),
                  pw.Text(r[1], style: pw.TextStyle(
                      fontSize: 11, fontWeight: pw.FontWeight.bold)),
                ],
              ),
            )),
            pw.SizedBox(height: 8),
            pw.Divider(),
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text('TOTAL', style: pw.TextStyle(
                    fontSize: 16, fontWeight: pw.FontWeight.bold)),
                pw.Text('${booking.totalPaid.kes} KES',
                    style: pw.TextStyle(fontSize: 16,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.amber800)),
              ],
            ),
            pw.Spacer(),
            pw.Divider(color: PdfColors.grey300),
            pw.Center(child: pw.Text('Thank you for riding with us!',
                style: const pw.TextStyle(
                    fontSize: 10, color: PdfColors.grey600))),
          ],
        ),
      ));
      await Printing.layoutPdf(onLayout: (_) async => doc.save());
    } finally {
      if (mounted) setState(() => _printing = false);
    }
  }

  List<List<String>> _receiptRows(Booking b) => [
    ['Quad',      b.quadName],
    ['Customer',  b.customerName],
    ['Phone',     b.customerPhone],
    ['Duration',  '${b.duration} min'],
    ['Date',      _fmtDate(b.startTime)],
    ['Base Price','${b.price.kes} KES'],
    if (b.promoCode != null)
      ['Promo Code', b.promoCode!],
    if (b.overtimeCharge > 0)
      ['Overtime (${b.overtimeMinutes} min)', '+${b.overtimeCharge.kes} KES'],
    if (b.mpesaRef != null)
      ['M-Pesa Ref', b.mpesaRef!],
  ];
}

// ── Receipt card ──────────────────────────────────────────────────────────────
class _ReceiptCard extends StatelessWidget {
  final Booking booking;
  const _ReceiptCard({required this.booking});

  String _fmtDate(DateTime d) => d.display;

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: kCard,
      borderRadius: BorderRadius.circular(20),
      boxShadow: kShadowMd,
    ),
    child: Column(children: [
      // Card header
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: kHeroGradient,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Row(children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: kAccent.withAlpha(80), width: 2)),
            child: ClipOval(child: Image.asset(
                'assets/images/logo.png', fit: BoxFit.cover))),
          const SizedBox(width: 12),
          const Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Royal Quad Bikes', style: TextStyle(
                  fontFamily: 'Playfair', fontSize: 16,
                  fontWeight: FontWeight.w700, color: Colors.white)),
              Text('Mambrui Sand Dunes, Kenya',
                  style: TextStyle(color: Colors.white38, fontSize: 11)),
            ],
          )),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: kAccent.withAlpha(25),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: kAccent.withAlpha(60))),
            child: Text(booking.receiptId, style: const TextStyle(
                color: kAccent2, fontSize: 11, fontFamily: 'monospace',
                fontWeight: FontWeight.w700))),
        ]),
      ),

      // Jagged edge divider
      _PerforatedDivider(),

      // Body rows
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
        child: Column(children: [
          _Row('Quad', booking.quadName, icon: Icons.directions_bike_rounded),
          _Row('Customer', booking.customerName, icon: Icons.person_rounded),
          _Row('Phone', booking.customerPhone, icon: Icons.phone_rounded),
          _Row('Duration', '${booking.duration} min', icon: Icons.timer_rounded),
          _Row('Date', _fmtDate(booking.startTime), icon: Icons.calendar_today_rounded),
          _Row('Base Price', '${booking.price.kes} KES', icon: Icons.payments_rounded),
          if (booking.promoCode != null)
            _Row('Promo', booking.promoCode!, icon: Icons.local_offer_rounded,
                valueColor: kGreen),
          if (booking.overtimeCharge > 0)
            _Row('Overtime (${booking.overtimeMinutes} min)',
                '+${booking.overtimeCharge.kes} KES',
                icon: Icons.warning_amber_rounded,
                valueColor: kRed),
          if (booking.mpesaRef != null)
            _Row('M-Pesa', booking.mpesaRef!, icon: Icons.mobile_friendly_rounded,
                valueColor: kGreen),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              gradient: kGoldGradient,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(children: [
              const Icon(Icons.receipt_long_rounded,
                  color: Colors.white, size: 18),
              const SizedBox(width: 10),
              const Text('TOTAL',
                  style: TextStyle(color: Colors.white,
                      fontWeight: FontWeight.w800, fontSize: 14,
                      letterSpacing: 1)),
              const Spacer(),
              Text('${booking.totalPaid.kes} KES',
                  style: const TextStyle(
                      fontFamily: 'Playfair', color: Colors.white,
                      fontSize: 22, fontWeight: FontWeight.w900)),
            ]),
          ),
        ]),
      ),
    ]),
  );
}

class _Row extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color? valueColor;
  const _Row(this.label, this.value, {required this.icon, this.valueColor});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 7),
    child: Row(children: [
      Icon(icon, size: 15, color: kMuted.withAlpha(140)),
      const SizedBox(width: 8),
      Text(label, style: const TextStyle(color: kMuted, fontSize: 13)),
      const Spacer(),
      Text(value, style: TextStyle(
          fontWeight: FontWeight.w600, fontSize: 13,
          color: valueColor ?? kText)),
    ]),
  );
}

class _PerforatedDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) => SizedBox(
    height: 20,
    child: Row(children: [
      Container(width: 10, height: 20,
          decoration: const BoxDecoration(
              color: kBg,
              borderRadius: BorderRadius.horizontal(right: Radius.circular(10)))),
      Expanded(child: LayoutBuilder(builder: (_, c) {
        final count = (c.maxWidth / 10).floor();
        return Row(children: List.generate(count, (i) => Expanded(child: Container(
          height: 1,
          color: i % 2 == 0 ? kBorder : Colors.transparent))));
      })),
      Container(width: 10, height: 20,
          decoration: const BoxDecoration(
              color: kBg,
              borderRadius: BorderRadius.horizontal(left: Radius.circular(10)))),
    ]),
  );
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ActionBtn({required this.icon, required this.label,
      required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(
            color: color.withAlpha(60), blurRadius: 12,
            offset: const Offset(0, 4))],
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: Colors.white, size: 18),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(
            color: Colors.white, fontWeight: FontWeight.w700)),
      ]),
    ),
  );
}

class _RatingCard extends StatelessWidget {
  final int rating;
  final ValueChanged<int> onRate;
  final ValueChanged<String> onFeedback;
  final VoidCallback onSubmit;
  const _RatingCard({super.key, required this.rating,
      required this.onRate, required this.onFeedback, required this.onSubmit});

  @override
  Widget build(BuildContext context) => AppCard(
    child: Column(children: [
      const Text('How was your ride?', style: TextStyle(
          fontWeight: FontWeight.w700, fontSize: 15)),
      const SizedBox(height: 16),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) {
        final filled = i < rating;
        return GestureDetector(
          onTap: () => onRate(i + 1),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: AnimatedScale(
              scale: filled ? 1.15 : 1.0,
              duration: const Duration(milliseconds: 150),
              child: Icon(
                filled ? Icons.star_rounded : Icons.star_outline_rounded,
                color: filled ? kAccent : kBorder, size: 38)),
          ),
        );
      })),
      if (rating > 0) Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Text(_ratingLabel(rating),
            style: const TextStyle(color: kMuted, fontSize: 13))),
      const SizedBox(height: 16),
      TextFormField(
        decoration: const InputDecoration(
            hintText: 'Leave a comment (optional)',
            prefixIcon: Icon(Icons.chat_bubble_outline_rounded, size: 18)),
        maxLines: 2,
        onChanged: onFeedback,
      ),
      const SizedBox(height: 14),
      PrimaryButton(
        label: 'Submit Feedback',
        icon: Icons.send_rounded,
        color: kAccent,
        onTap: rating == 0 ? null : onSubmit,
      ),
    ]),
  );

  String _ratingLabel(int r) => switch (r) {
    1 => 'Poor — sorry to hear that 😔',
    2 => 'Fair — we\'ll do better',
    3 => 'Good — thanks!',
    4 => 'Great ride! 🏍️',
    5 => 'Amazing — you\'re the best! ⭐',
    _ => '',
  };
}

class _FeedbackDone extends StatelessWidget {
  const _FeedbackDone({super.key});
  @override
  Widget build(BuildContext context) => AppCard(
    color: kGreen.withAlpha(10),
    border: Border.all(color: kGreen.withAlpha(40)),
    child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(Icons.check_circle_rounded, color: kGreen, size: 22),
      SizedBox(width: 10),
      Text('Feedback submitted — thank you! 🌟',
          style: TextStyle(color: kGreen, fontWeight: FontWeight.w600)),
    ]),
  );
}
