import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:printing/printing.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import '../models/models.dart';
import '../services/storage.dart';
import '../theme/theme.dart';
import 'package:url_launcher/url_launcher.dart';

class ReceiptScreen extends StatefulWidget {
  final int bookingId;
  const ReceiptScreen({super.key, required this.bookingId});
  @override State<ReceiptScreen> createState() => _ReceiptScreenState();
}

class _ReceiptScreenState extends State<ReceiptScreen> {
  int    _rating   = 0;
  String _feedback = '';
  bool   _submitted = false;

  @override
  Widget build(BuildContext context) {
    final booking = StorageService.getBookingById(widget.bookingId);
    if (booking == null) return Scaffold(body: Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Text('Receipt not found', style: TextStyle(color: kMuted)),
          TextButton(onPressed: () => context.go('/'), child: const Text('Go Home')),
        ])));

    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 120, pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: const HeroCard(child: SizedBox.expand()),
            title: Text('Receipt ${booking.receiptId}',
                style: const TextStyle(fontSize: 15, color: Colors.white)),
          ),
          leading: IconButton(
              icon: const Icon(Icons.close_rounded, color: Colors.white),
              onPressed: () => context.go('/')),
          actions: [
            IconButton(
              icon: const Icon(Icons.print_rounded, color: Colors.white),
              onPressed: () => _printPdf(booking),
              tooltip: 'Print / Save PDF',
            ),
          ],
        ),

        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(delegate: SliverChildListDelegate([

            // ── Summary card ─────────────────────────────────────────────
            AppCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // Logo row
              Row(children: [
                CircleAvatar(radius: 22,
                    backgroundImage: const AssetImage('assets/images/logo.png'),
                    backgroundColor: kBg2),
                const SizedBox(width: 12),
                const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Royal Quad Bikes', style: TextStyle(
                      fontFamily: 'Playfair', fontWeight: FontWeight.w700, fontSize: 16)),
                  Text('Mambrui Sand Dunes, Kenya',
                      style: TextStyle(color: kMuted, fontSize: 11)),
                ]),
              ]),

              const Divider(height: 24, color: kBorder),

              ..._rows(booking).map((row) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 5),
                child: Row(children: [
                  Text(row[0], style: const TextStyle(color: kMuted, fontSize: 13)),
                  const Spacer(),
                  Text(row[1], style: const TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 13)),
                ]),
              )),

              const Divider(height: 24, color: kBorder),

              Row(children: [
                const Text('TOTAL', style: TextStyle(
                    fontWeight: FontWeight.w800, fontSize: 15, letterSpacing: 0.5)),
                const Spacer(),
                Text('${booking.totalPaid.kes} KES', style: const TextStyle(
                    fontFamily: 'Playfair', fontWeight: FontWeight.w700,
                    fontSize: 20, color: kAccent)),
              ]),
            ])),

            const SizedBox(height: 16),

            // ── WhatsApp share ────────────────────────────────────────────
            _WhatsAppBtn(booking: booking),

            const SizedBox(height: 20),

            // ── Rating ────────────────────────────────────────────────────
            if (!_submitted) ...[
              SectionHeading('Rate Your Ride', icon: Icons.star_rounded),
              AppCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) =>
                  GestureDetector(
                    onTap: () => setState(() => _rating = i + 1),
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Icon(
                        i < _rating ? Icons.star_rounded : Icons.star_border_rounded,
                        color: kAccent, size: 36),
                    ),
                  ))),
                const SizedBox(height: 12),
                TextFormField(
                  decoration: const InputDecoration(
                      hintText: 'Leave a comment (optional)',
                      prefixIcon: Icon(Icons.comment_outlined, size: 18)),
                  maxLines: 2,
                  onChanged: (v) => _feedback = v,
                ),
                const SizedBox(height: 12),
                PrimaryButton(
                  label: 'Submit Feedback',
                  icon: Icons.send_rounded,
                  onTap: _rating == 0 ? null : () async {
                    await StorageService.submitFeedback(widget.bookingId, _rating, _feedback);
                    setState(() => _submitted = true);
                    if (mounted) showToast(context, 'Thank you! 🌟');
                  },
                ),
              ])),
            ] else
              AppCard(color: kGreen.withAlpha(15), child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle_rounded, color: kGreen, size: 20),
                  SizedBox(width: 8),
                  Text('Feedback submitted — thank you!',
                      style: TextStyle(color: kGreen, fontWeight: FontWeight.w600)),
                ])),

            const SizedBox(height: 20),

            PrimaryButton(
              label: 'Book Another Ride',
              icon: Icons.add_rounded,
              onTap: () => context.go('/'),
            ),
            const SizedBox(height: 40),
          ])),
        ),
      ]),
    );
  }

  List<List<String>> _rows(Booking b) => [
    ['Receipt ID',  b.receiptId],
    ['Quad',        b.quadName],
    ['Customer',    b.customerName],
    ['Phone',       b.customerPhone],
    ['Duration',    '${b.duration} min'],
    ['Date',        _fmtDate(b.startTime)],
    ['Base Price',  '${b.price.kes} KES'],
    if (b.promoCode != null) ['Promo', b.promoCode!],
    if (b.overtimeCharge > 0) ['Overtime (${b.overtimeMinutes} min)', '+${b.overtimeCharge.kes} KES'],
    if (b.mpesaRef != null) ['M-Pesa Ref', b.mpesaRef!],
  ];

  String _fmtDate(DateTime d) =>
      '${d.day}/${d.month}/${d.year} ${d.hour.toString().padLeft(2,'0')}:${d.minute.toString().padLeft(2,'0')}';

  Future<void> _printPdf(Booking booking) async {
    final doc = pw.Document();
    doc.addPage(pw.Page(
      pageFormat: PdfPageFormat.a5,
      build: (ctx) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text('Royal Quad Bikes', style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold)),
          pw.Text('Mambrui Sand Dunes, Kenya', style: const pw.TextStyle(fontSize: 12)),
          pw.Divider(),
          ..._rows(booking).map((r) => pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(r[0], style: const pw.TextStyle(fontSize: 12)),
              pw.Text(r[1], style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
            ],
          )),
          pw.Divider(),
          pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
            pw.Text('TOTAL', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
            pw.Text('${booking.totalPaid.kes} KES',
                style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
          ]),
        ],
      ),
    ));
    await Printing.layoutPdf(onLayout: (_) async => doc.save());
  }
}

class _WhatsAppBtn extends StatelessWidget {
  final Booking booking;
  const _WhatsAppBtn({required this.booking});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        final msg = Uri.encodeComponent(
            'Thank you ${booking.customerName}! Your receipt for ${booking.quadName} — '
            '${booking.duration} min — ${booking.totalPaid.kes} KES. '
            'Receipt: ${booking.receiptId}. Royal Quad Bikes, Mambrui.');
        final phone = booking.customerPhone.startsWith('0')
            ? '254${booking.customerPhone.substring(1)}' : booking.customerPhone;
        final url = Uri.parse('https://wa.me/$phone?text=$msg');
        if (await canLaunchUrl(url)) await launchUrl(url);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF25D366),
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.message_rounded, color: Colors.white, size: 20),
          SizedBox(width: 8),
          Text('Send Receipt via WhatsApp',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
        ]),
      ),
    );
  }
}
