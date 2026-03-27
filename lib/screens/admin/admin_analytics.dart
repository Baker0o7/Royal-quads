import 'dart:math';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../models/models.dart';
import '../../services/storage.dart';
import '../../theme/theme.dart';

class AdminAnalyticsTab extends StatefulWidget {
  const AdminAnalyticsTab({super.key});
  @override State<AdminAnalyticsTab> createState() => _AdminAnalyticsTabState();
}

class _AdminAnalyticsTabState extends State<AdminAnalyticsTab> {
  bool _generating = false;

  @override
  Widget build(BuildContext context) {
    final history = StorageService.getHistory();
    final quads   = StorageService.getQuads();
    final now     = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);

    final todayRides = history.where((b) =>
        !b.startTime.isBefore(todayStart)).toList();
    final todayRev = todayRides.fold(0, (s, b) => s + b.totalPaid);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 60),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // ── End-of-Day Report ─────────────────────────────────────────────
        SectionHeading('End-of-Day Report',
            icon: Icons.summarize_rounded),
        _EodCard(
          todayRides: todayRides,
          todayRev: todayRev,
          generating: _generating,
          onGenerate: () => _generateEodReport(todayRides, todayRev),
        ),
        const SizedBox(height: 24),

        // ── Quad Utilisation ──────────────────────────────────────────────
        SectionHeading('Quad Utilisation (7 days)',
            icon: Icons.directions_bike_rounded),
        _UtilisationChart(history: history, quads: quads),
        const SizedBox(height: 24),

        // ── Peak Hours Heatmap ────────────────────────────────────────────
        SectionHeading('Peak Hours Heatmap',
            icon: Icons.thermostat_rounded),
        _PeakHoursHeatmap(history: history),
        const SizedBox(height: 24),

        // ── Customer Return Rate ──────────────────────────────────────────
        SectionHeading('Customer Insights',
            icon: Icons.people_rounded),
        _CustomerInsights(history: history),
        const SizedBox(height: 24),

        // ── Ride Stats ────────────────────────────────────────────────────
        SectionHeading('Ride Statistics',
            icon: Icons.analytics_rounded),
        _RideStats(history: history),
        const SizedBox(height: 24),

        // ── Dynamic Pricing ───────────────────────────────────────────────
        SectionHeading('Dynamic Pricing Rules',
            icon: Icons.price_change_rounded),
        _DynamicPricingCard(),
        const SizedBox(height: 24),

        // ── Incidents ─────────────────────────────────────────────────────
        SectionHeading('Incident Reports',
            icon: Icons.warning_amber_rounded),
        _IncidentsCard(onAdd: () => _addIncident(context)),
        const SizedBox(height: 24),

        // ── Loyalty Overview ──────────────────────────────────────────────
        SectionHeading('Loyalty Programme',
            icon: Icons.stars_rounded),
        _LoyaltyOverviewCard(history: history),
      ]),
    );
  }

  Future<void> _generateEodReport(
      List<Booking> rides, int totalRev) async {
    setState(() => _generating = true);
    HapticFeedback.mediumImpact();
    try {
      final now  = DateTime.now();
      final doc  = pw.Document();
      final ot   = rides.fold(0, (s, b) => s + b.overtimeCharge);
      final dep  = rides.fold(0, (s, b) =>
          b.depositAmount > 0 && !b.depositReturned ? s + b.depositAmount : s);
      const double kComm = 0.20;
      final commAmt   = (totalRev * kComm).round();
      final netAmt    = totalRev - commAmt;
      // Extract guide name from mpesaRef or customerName fields
      // Quick-start rides store guide in customerName as 'Walk-in' — check mpesaRef notes
      // We aggregate: if any ride has a guide, show the name
      final guideRides = rides.where((b) =>
          b.customerName.startsWith('Walk-in')).toList();

      doc.addPage(pw.Page(
        pageFormat: PdfPageFormat.a5,
        margin: const pw.EdgeInsets.all(28),
        build: (ctx) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            // Gold top bar
            pw.Container(height: 3,
              decoration: const pw.BoxDecoration(
                gradient: pw.LinearGradient(
                  colors: [PdfColors.amber300, PdfColors.amber800,
                           PdfColors.amber300]))),
            pw.SizedBox(height: 14),
            // Header
            pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
              pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                pw.Text('Royal Quad Bikes',
                    style: pw.TextStyle(fontSize: 18,
                        fontWeight: pw.FontWeight.bold)),
                pw.Text('End-of-Day Report',
                    style: const pw.TextStyle(fontSize: 11,
                        color: PdfColors.grey600)),
              ]),
              pw.Text(
                '${now.day}/${now.month}/${now.year}',
                style: pw.TextStyle(fontSize: 12,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.amber800)),
            ]),
            pw.SizedBox(height: 14),
            pw.Container(height: 1.5,
              decoration: const pw.BoxDecoration(
                gradient: pw.LinearGradient(
                  colors: [PdfColors.amber700, PdfColors.amber300,
                           PdfColors.amber700]))),
            pw.SizedBox(height: 16),

            // Summary stats
            pw.Container(
              padding: const pw.EdgeInsets.all(14),
              decoration: pw.BoxDecoration(
                color: PdfColors.amber50,
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                border: const pw.Border(
                  left: pw.BorderSide(color: PdfColors.amber700, width: 3)),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
                children: [
                  _pdfStat('Total Rides', '${rides.length}'),
                  _pdfStat('Revenue', '${totalRev.kes} KES'),
                  _pdfStat('Overtime', '${ot.kes} KES'),
                  _pdfStat('Deposits Held', '${dep.kes} KES'),
                ],
              ),
            ),
            pw.SizedBox(height: 12),

            // Commission breakdown
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: pw.BoxDecoration(
                border: const pw.Border(
                  left: pw.BorderSide(color: PdfColors.green700, width: 3)),
                color: const PdfColor.fromInt(0xFFF0FDF4),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('Commission Breakdown (20%)',
                      style: pw.TextStyle(fontSize: 9,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.green900)),
                  pw.SizedBox(height: 8),
                  pw.Table(
                    columnWidths: {
                      0: const pw.FlexColumnWidth(3),
                      1: const pw.FlexColumnWidth(2),
                    },
                    children: [
                      _pdfCommRow2('Total Revenue', '${totalRev.kes} KES',
                          PdfColors.grey800),
                      _pdfCommRow2('Guide Commission (20%)', '${commAmt.kes} KES',
                          PdfColors.green800),
                      _pdfCommRow2('Business Keeps (80%)', '${netAmt.kes} KES',
                          PdfColors.amber900),
                    ],
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 12),

            // Ride table
            pw.Text('Ride Details', style: pw.TextStyle(
                fontSize: 12, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 6),
            if (rides.isEmpty)
              pw.Text('No rides today',
                  style: const pw.TextStyle(
                      fontSize: 10, color: PdfColors.grey600))
            else
              pw.Table(
                border: pw.TableBorder.all(
                    color: PdfColors.grey300, width: 0.5),
                children: [
                  pw.TableRow(children: [
                    _pdfTh('Customer'), _pdfTh('Quad'),
                    _pdfTh('Dur'), _pdfTh('Base'),
                    _pdfTh('Comm'), _pdfTh('Net'), _pdfTh('Pay'),
                  ]),
                  ...rides.take(15).map((b) {
                    final comm = (b.totalPaid * 0.20).round();
                    final net  = b.totalPaid - comm;
                    final pay  = b.mpesaRef == 'CASH'
                        ? 'Cash'
                        : b.mpesaRef == 'MPESA-PENDING'
                            ? 'M-Pesa'
                            : b.mpesaRef ?? '-';
                    return pw.TableRow(children: [
                      _pdfTd(b.customerName), _pdfTd(b.quadName),
                      _pdfTd('${b.duration}m'), _pdfTd(b.totalPaid.kes),
                      _pdfTd(comm.kes, color: PdfColors.green800),
                      _pdfTd(net.kes, color: PdfColors.amber900),
                      _pdfTd(pay),
                    ]);
                  }),
                ],
              ),

            pw.Spacer(),
            pw.Container(height: 1, color: PdfColors.grey300),
            pw.SizedBox(height: 6),
            pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
              pw.Text('Generated ${now.hour}:${now.minute.toString().padLeft(2,"0")}',
                  style: const pw.TextStyle(
                      fontSize: 8, color: PdfColors.grey500)),
              pw.Text('Mambrui Sand Dunes, Kenya',
                  style: const pw.TextStyle(
                      fontSize: 8, color: PdfColors.grey400)),
            ]),
            pw.SizedBox(height: 4),
            pw.Container(height: 2,
              decoration: const pw.BoxDecoration(
                gradient: pw.LinearGradient(
                  colors: [PdfColors.amber300, PdfColors.amber700,
                           PdfColors.amber300]))),
          ],
        ),
      ));

      await Printing.layoutPdf(onLayout: (_) async => doc.save());
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  pw.TableRow _pdfCommRow2(String label, String value, PdfColor color) =>
    pw.TableRow(children: [
      pw.Padding(
        padding: const pw.EdgeInsets.only(bottom: 3),
        child: pw.Text(label,
            style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700))),
      pw.Padding(
        padding: const pw.EdgeInsets.only(bottom: 3),
        child: pw.Text(value, textAlign: pw.TextAlign.right,
            style: pw.TextStyle(fontSize: 9,
                fontWeight: pw.FontWeight.bold, color: color))),
    ]);

  pw.Widget _pdfStat(String label, String value) => pw.Column(
    children: [
      pw.Text(value, style: pw.TextStyle(
          fontSize: 14, fontWeight: pw.FontWeight.bold,
          color: PdfColors.amber900)),
      pw.Text(label, style: const pw.TextStyle(
          fontSize: 8, color: PdfColors.grey600)),
    ],
  );

  pw.Widget _pdfTh(String t) => pw.Container(
    padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 4),
    color: PdfColors.amber50,
    child: pw.Text(t, style: pw.TextStyle(
        fontSize: 9, fontWeight: pw.FontWeight.bold)),
  );

  pw.Widget _pdfTd(String t, {PdfColor? color}) => pw.Container(
    padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
    child: pw.Text(t, style: pw.TextStyle(fontSize: 9, color: color)),
  );

  void _addIncident(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddIncidentSheet(
        onAdd: (quadName, customerName, type, desc, reporter) async {
          await StorageService.addIncident(
            quadName: quadName, customerName: customerName,
            type: type, description: desc, reportedBy: reporter,
          );
          if (mounted) {
            setState(() {});
            showToast(context, 'Incident logged');
          }
        },
      ),
    );
  }
}

// ── EOD Card ──────────────────────────────────────────────────────────────────
class _EodCard extends StatelessWidget {
  final List<Booking> todayRides;
  final int todayRev;
  final bool generating;
  final VoidCallback onGenerate;
  const _EodCard({required this.todayRides, required this.todayRev,
      required this.generating, required this.onGenerate});

  @override
  Widget build(BuildContext context) => AppCard(
    padding: const EdgeInsets.all(20),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Today — ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}',
              style: TextStyle(fontWeight: FontWeight.w600,
                  fontSize: 13, color: context.rq.muted)),
            const SizedBox(height: 4),
            Text('${todayRev.kes} KES',
                style: const TextStyle(fontFamily: 'Playfair',
                    fontSize: 28, fontWeight: FontWeight.w800, color: kAccent)),
          ],
        )),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: kAccent.withAlpha(15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: kAccent.withAlpha(40)),
          ),
          child: Text('${todayRides.length} rides',
              style: const TextStyle(color: kAccent,
                  fontWeight: FontWeight.w700)),
        ),
      ]),
      const SizedBox(height: 16),
      Row(children: [
        _Pill(Icons.timer_outlined, kIndigo,
            '${todayRides.fold(0, (s,b)=>s+b.duration)} min total'),
        const SizedBox(width: 8),
        _Pill(Icons.warning_amber_rounded, kRed,
            '${todayRides.fold(0,(s,b)=>s+b.overtimeCharge).kes} KES OT'),
      ]),
      const SizedBox(height: 16),
      SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          icon: generating
              ? const SizedBox(width: 18, height: 18,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2))
              : const Icon(Icons.picture_as_pdf_rounded, size: 18),
          label: Text(generating ? 'Generating...' : 'Generate PDF Report'),
          onPressed: generating ? null : onGenerate,
          style: ElevatedButton.styleFrom(
            backgroundColor: kAccent,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
    ]),
  );
}

class _Pill extends StatelessWidget {
  final IconData icon; final Color color; final String label;
  const _Pill(this.icon, this.color, this.label);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(
      color: color.withAlpha(12),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: color.withAlpha(30)),
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 12, color: color),
      const SizedBox(width: 5),
      Text(label, style: TextStyle(
          color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    ]),
  );
}

// ── Utilisation Chart ─────────────────────────────────────────────────────────
class _UtilisationChart extends StatelessWidget {
  final List<Booking> history;
  final List<Quad> quads;
  const _UtilisationChart({required this.history, required this.quads});

  @override
  Widget build(BuildContext context) {
    final now    = DateTime.now();
    final cutoff = now.subtract(const Duration(days: 7));
    final recent = history.where((b) => b.startTime.isAfter(cutoff)).toList();

    // Minutes per quad
    final Map<String, int> minutes = {};
    for (final q in quads) { minutes[q.name] = 0; }
    for (final b in recent) {
      minutes[b.quadName] = (minutes[b.quadName] ?? 0) + b.duration;
    }

    final sorted = minutes.entries.toList()
      ..sort((a,b) => b.value.compareTo(a.value));
    final maxMin = sorted.isEmpty ? 1
        : sorted.first.value.clamp(1, 99999);

    final colors = [kAccent, kGreen, kIndigo, kRed, kOrange,
      const Color(0xFF06B6D4)];

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        ...sorted.asMap().entries.map((e) {
          final pct = e.value.value / maxMin;
          final color = colors[e.key % colors.length];
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(e.value.key,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 13))),
                Text('${e.value.value} min',
                    style: TextStyle(color: color,
                        fontWeight: FontWeight.w700, fontSize: 12)),
              ]),
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: pct,
                  minHeight: 8,
                  backgroundColor: color.withAlpha(20),
                  valueColor: AlwaysStoppedAnimation(color),
                ),
              ),
            ]),
          );
        }),
        if (sorted.isEmpty)
          Center(child: Padding(
            padding: EdgeInsets.all(24),
            child: Text('No rides in the last 7 days',
                style: TextStyle(color: context.rq.muted)),
          )),
      ]),
    );
  }
}

// ── Peak Hours Heatmap ────────────────────────────────────────────────────────
class _PeakHoursHeatmap extends StatelessWidget {
  final List<Booking> history;
  const _PeakHoursHeatmap({required this.history});

  @override
  Widget build(BuildContext context) {
    // Build 24-hour buckets
    final counts = List.filled(24, 0);
    for (final b in history) { counts[b.startTime.hour]++; }
    final maxCount = counts.reduce(max).clamp(1, 9999);

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Bookings by Hour of Day',
            style: TextStyle(color: context.rq.muted, fontSize: 12)),
        const SizedBox(height: 12),
        SizedBox(
          height: 60,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: List.generate(24, (h) {
              final frac = counts[h] / maxCount;
              final color = frac > 0.7 ? kRed
                  : frac > 0.4 ? kAccent
                  : frac > 0.1 ? kGreen
                  : kBorder;
              return Expanded(child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Expanded(child: Align(
                    alignment: Alignment.bottomCenter,
                    child: AnimatedContainer(
                      duration: Duration(milliseconds: 200 + h * 20),
                      width: 8,
                      height: max(2.0, frac * 44),
                      decoration: BoxDecoration(
                          color: color,
                          borderRadius: BorderRadius.circular(2)),
                    ),
                  )),
                  const SizedBox(height: 3),
                  if (h % 6 == 0)
                    Text('$h', style: TextStyle(
                        color: context.rq.muted, fontSize: 7)),
                ],
              ));
            }),
          ),
        ),
        const SizedBox(height: 8),
        Row(children: [
          _Legend(kGreen, 'Low'), const SizedBox(width: 8),
          _Legend(kAccent, 'Medium'), const SizedBox(width: 8),
          _Legend(kRed, 'Peak'),
        ]),
      ]),
    );
  }
}

class _Legend extends StatelessWidget {
  final Color color; final String label;
  const _Legend(this.color, this.label);
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min,
      children: [
    Container(width: 8, height: 8,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
    const SizedBox(width: 4),
    Text(label, style: TextStyle(color: context.rq.muted, fontSize: 10)),
  ]);
}

// ── Customer Insights ─────────────────────────────────────────────────────────
class _CustomerInsights extends StatelessWidget {
  final List<Booking> history;
  const _CustomerInsights({required this.history});

  @override
  Widget build(BuildContext context) {
    final phones = history.map((b) => b.customerPhone).toList();
    final unique = phones.toSet().length;
    final returning = phones.length - unique;
    final returnRate = history.isEmpty ? 0.0 : returning / history.length;

    final avgSpend = history.isEmpty ? 0
        : history.fold(0, (s,b)=>s+b.totalPaid) ~/ history.length;

    final withOt = history.where((b) => b.overtimeCharge > 0).length;
    final otRate = history.isEmpty ? 0.0 : withOt / history.length;

    return AppCard(
      child: Column(children: [
        _InsightRow('Unique Customers', '$unique',
            icon: Icons.person_rounded, color: kIndigo),
        const Divider(height: 1),
        _InsightRow('Return Rate',
            '${(returnRate * 100).toStringAsFixed(0)}%',
            icon: Icons.repeat_rounded, color: kGreen,
            sub: '$returning returning visits'),
        const Divider(height: 1),
        _InsightRow('Avg Spend per Ride', '${avgSpend.kes} KES',
            icon: Icons.payments_outlined, color: kAccent),
        const Divider(height: 1),
        _InsightRow('Overtime Rate',
            '${(otRate * 100).toStringAsFixed(0)}%',
            icon: Icons.timer_off_rounded, color: kOrange,
            sub: '$withOt rides went overtime'),
      ]),
    );
  }
}

class _InsightRow extends StatelessWidget {
  final String label, value;
  final IconData icon; final Color color;
  final String? sub;
  const _InsightRow(this.label, this.value,
      {required this.icon, required this.color, this.sub});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 12),
    child: Row(children: [
      Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
            color: color.withAlpha(15),
            borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: color, size: 18)),
      const SizedBox(width: 12),
      Expanded(child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(
              color: context.rq.muted, fontSize: 12)),
          if (sub != null) Text(sub!, style: TextStyle(
              color: context.rq.muted, fontSize: 10)),
        ],
      )),
      Text(value, style: TextStyle(
          color: color, fontWeight: FontWeight.w800,
          fontSize: 16, fontFamily: 'Playfair')),
    ]),
  );
}

// ── Ride Stats ────────────────────────────────────────────────────────────────
class _RideStats extends StatelessWidget {
  final List<Booking> history;
  const _RideStats({required this.history});

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty) return AppCard(
      child: Center(child: Padding(
        padding: EdgeInsets.all(20),
        child: Text('No ride data yet', style: TextStyle(color: context.rq.muted)),
      )),
    );

    final durations  = history.map((b) => b.duration).toList()..sort();
    final avgDur     = durations.reduce((a,b)=>a+b) ~/ durations.length;
    final popularDur = _mode(durations);
    final totalMins  = durations.reduce((a,b)=>a+b);

    return AppCard(
      child: Column(children: [
        _InsightRow('Total Ride Time', _fmtMins(totalMins),
            icon: Icons.schedule_rounded, color: kAccent),
        const Divider(height: 1),
        _InsightRow('Average Duration', '${avgDur} min',
            icon: Icons.timer_rounded, color: kGreen),
        const Divider(height: 1),
        _InsightRow('Most Popular', '$popularDur min',
            icon: Icons.star_rounded, color: kIndigo),
        const Divider(height: 1),
        _InsightRow('Total Rides', '${history.length}',
            icon: Icons.directions_bike_rounded, color: kOrange),
      ]),
    );
  }

  int _mode(List<int> list) {
    final count = <int,int>{};
    for (final v in list) count[v] = (count[v]??0)+1;
    return count.entries.reduce((a,b)=>a.value>b.value?a:b).key;
  }

  String _fmtMins(int mins) {
    if (mins < 60) return '$mins min';
    final h = mins ~/ 60; final m = mins % 60;
    return m > 0 ? '${h}h ${m}m' : '${h}h';
  }
}

// ── Dynamic Pricing Card ──────────────────────────────────────────────────────
class _DynamicPricingCard extends StatefulWidget {
  @override State<_DynamicPricingCard> createState() =>
      _DynamicPricingCardState();
}

class _DynamicPricingCardState extends State<_DynamicPricingCard> {
  List<DynamicPricingRule> _rules = [];

  @override
  void initState() {
    super.initState();
    _rules = StorageService.getDynamicPricing();
  }

  @override
  Widget build(BuildContext context) {
    final multiplier = StorageService.getCurrentPriceMultiplier();
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: kAccent.withAlpha(12),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: kAccent.withAlpha(30)),
          ),
          child: Row(children: [
            const Icon(Icons.bolt_rounded, color: kAccent, size: 20),
            const SizedBox(width: 8),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Current Multiplier',
                    style: TextStyle(color: context.rq.muted, fontSize: 11)),
                Text('${multiplier}x',
                    style: const TextStyle(color: kAccent,
                        fontSize: 18, fontWeight: FontWeight.w800)),
              ],
            )),
            const Text('Live', style: TextStyle(
                color: kGreen, fontSize: 11, fontWeight: FontWeight.w700)),
          ]),
        ),
        const SizedBox(height: 12),
        ..._rules.map((r) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(children: [
            Switch.adaptive(
              value: r.active,
              activeColor: kAccent,
              onChanged: (v) async {
                final updated = _rules.map((x) =>
                    x.id == r.id ? DynamicPricingRule(
                        id: x.id, label: x.label,
                        startHour: x.startHour, endHour: x.endHour,
                        multiplier: x.multiplier, active: v)
                    : x).toList();
                await StorageService.saveDynamicPricing(updated);
                setState(() => _rules = updated);
              },
            ),
            const SizedBox(width: 4),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.label, style: TextStyle(
                    fontWeight: FontWeight.w600, fontSize: 13,
                    color: r.active ? context.rq.text : context.rq.muted)),
                Text('${r.startHour}:00 – ${r.endHour}:00',
                    style: TextStyle(color: context.rq.muted, fontSize: 11)),
              ],
            )),
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: r.active
                    ? (r.multiplier > 1 ? kRed : kGreen).withAlpha(15)
                    : kBg2,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('${r.multiplier}x',
                  style: TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 13,
                      color: r.active
                          ? (r.multiplier > 1 ? kRed : kGreen)
                          : context.rq.muted)),
            ),
          ]),
        )),
      ]),
    );
  }
}

// ── Incidents Card ────────────────────────────────────────────────────────────
class _IncidentsCard extends StatelessWidget {
  final VoidCallback onAdd;
  const _IncidentsCard({required this.onAdd});

  @override
  Widget build(BuildContext context) {
    final incidents = StorageService.getIncidents();
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text('${incidents.length} incidents logged',
              style: TextStyle(color: context.rq.muted, fontSize: 12))),
          TextButton.icon(
            icon: const Icon(Icons.add, size: 14),
            label: Text('Log Incident'),
            onPressed: onAdd,
            style: TextButton.styleFrom(
                foregroundColor: kRed,
                textStyle: const TextStyle(fontSize: 12)),
          ),
        ]),
        if (incidents.isNotEmpty) ...[
          const SizedBox(height: 8),
          ...incidents.reversed.take(5).map((inc) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: kRed.withAlpha(10),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kRed.withAlpha(30), width: 1.5),
            ),
            child: Row(children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(
                    color: kRed.withAlpha(20),
                    borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.warning_amber_rounded,
                    color: kRed, size: 16)),
              const SizedBox(width: 10),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${inc.quadName} — ${inc.type}',
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 12)),
                  Text(inc.description,
                      style: TextStyle(color: context.rq.muted, fontSize: 11),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              )),
              Text('${inc.date.day}/${inc.date.month}',
                  style: TextStyle(color: context.rq.muted, fontSize: 10)),
            ]),
          )),
        ],
      ]),
    );
  }
}

// ── Loyalty Overview ──────────────────────────────────────────────────────────
class _LoyaltyOverviewCard extends StatelessWidget {
  final List<Booking> history;
  const _LoyaltyOverviewCard({required this.history});

  static const _tiers = [
    (name: 'Bronze',   pts: 0,    icon: Icons.workspace_premium_rounded, color: Color(0xFFCD7F32)),
    (name: 'Silver',   pts: 200,  icon: Icons.workspace_premium_rounded, color: Color(0xFF94A3B8)),
    (name: 'Gold',     pts: 500,  icon: Icons.workspace_premium_rounded, color: Color(0xFFC9972A)),
    (name: 'Platinum', pts: 1000, icon: Icons.diamond_rounded,           color: Color(0xFF6366F1)),
  ];

  Color _tierColor(int pts) {
    var c = _tiers[0].color;
    for (final t in _tiers) { if (pts >= t.pts) c = t.color; }
    return c;
  }
  IconData _tierIcon(int pts) {
    var ic = _tiers[0].icon;
    for (final t in _tiers) { if (pts >= t.pts) ic = t.icon; }
    return ic;
  }

  @override
  Widget build(BuildContext context) {
    final phones = history.map((b) => b.customerPhone).toSet().toList();
    final accounts = phones
        .map((p) => StorageService.getLoyaltyAccount(p))
        .where((a) => a != null)
        .cast<LoyaltyAccount>()
        .toList()
      ..sort((a, b) => b.points.compareTo(a.points));

    final totalPts  = accounts.fold(0, (s, a) => s + a.points);
    final active    = accounts.where((a) => a.points > 0).length;
    final platinum  = accounts.where((a) => a.points >= 1000).length;

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // Gold banner
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(gradient: kGoldGradient,
              borderRadius: BorderRadius.circular(14)),
          child: const Row(children: [
            const Icon(Icons.workspace_premium_rounded,
                color: Colors.white, size: 22),
            SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Loyalty Programme', style: TextStyle(color: Colors.white,
                    fontWeight: FontWeight.w800, fontSize: 13)),
                Text('1 pt per 100 KES \u00b7 Bronze\u2192Silver\u2192Gold\u2192Platinum',
                    style: TextStyle(color: Colors.white60, fontSize: 10)),
              ])),
          ]),
        ),

        const SizedBox(height: 14),

        // Summary row
        Row(children: [
          _LStat(context, 'Members', '$active', kAccent),
          const SizedBox(width: 8),
          _LStat(context, 'Total Pts', '$totalPts', kGreen),
          const SizedBox(width: 8),
          _LStat(context, 'Platinum', '$platinum', kIndigo),
        ]),

        const SizedBox(height: 14),

        // Tier breakdown
        Row(
          children: _tiers.map((t) {
            final tierIdx = _tiers.indexWhere((td) => td.name == t.name);
            final nextPts = tierIdx < _tiers.length - 1
                ? _tiers[tierIdx + 1].pts : 999999;
            final count = accounts
                .where((a) => a.points >= t.pts && a.points < nextPts)
                .length;
            return Expanded(child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 3),
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: t.color.withAlpha(10),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: t.color.withAlpha(30)),
              ),
              child: Column(children: [
                Icon(t.icon, color: t.color, size: 18),
                const SizedBox(height: 3),
                Text('$count', style: TextStyle(color: t.color,
                    fontWeight: FontWeight.w800, fontSize: 14)),
                Text(t.name, style: TextStyle(color: t.color.withAlpha(180),
                    fontSize: 9, fontWeight: FontWeight.w600)),
              ]),
            ));
          }).toList(),
        ),

        const SizedBox(height: 14),

        if (accounts.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text('No loyalty accounts yet.',
                style: TextStyle(color: context.rq.muted, fontSize: 13)),
          )
        else ...[
          Text('LEADERBOARD', style: TextStyle(fontWeight: FontWeight.w800,
              fontSize: 10, color: context.rq.muted, letterSpacing: 1.5)),
          const SizedBox(height: 8),
          ...accounts.take(8).toList().asMap().entries.map((entry) {
            final rank = entry.key + 1;
            final a    = entry.value;
            final col  = _tierColor(a.points);
            final icon = _tierIcon(a.points);
            final medalIcon = rank == 1 ? Icons.looks_one_rounded
                        : rank == 2 ? Icons.looks_two_rounded
                        : rank == 3 ? Icons.looks_3_rounded
                        : Icons.tag_rounded;
            final maskedPhone = a.phone.length >= 10
                ? '${a.phone.substring(0, 4)}****${a.phone.substring(a.phone.length - 3)}'
                : a.phone;
            return Container(
              margin: const EdgeInsets.only(bottom: 7),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: rank <= 3 ? col.withAlpha(8) : Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: rank <= 3
                    ? col.withAlpha(35) : Theme.of(context).dividerColor),
              ),
              child: Row(children: [
                SizedBox(width: 28, child: rank <= 3
                    ? Icon(medalIcon, size: 16,
                        color: rank == 1 ? const Color(0xFFC9972A)
                             : rank == 2 ? const Color(0xFF94A3B8)
                             : const Color(0xFFCD7F32))
                    : Text('$rank.', style: TextStyle(
                        fontSize: 11, fontWeight: FontWeight.w700,
                        color: context.rq.muted))),
                const SizedBox(width: 4),
                Icon(icon, size: 16, color: col),
                const SizedBox(width: 8),
                Expanded(child: Text(maskedPhone,
                    style: TextStyle(fontWeight: FontWeight.w600,
                        fontSize: 12, color: context.rq.text))),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('${a.points} pts',
                      style: TextStyle(color: col,
                          fontWeight: FontWeight.w800, fontSize: 12)),
                  Text('${a.totalRides} ride${a.totalRides == 1 ? "" : "s"}',
                      style: TextStyle(color: context.rq.muted, fontSize: 10)),
                ]),
              ]),
            );
          }),
        ],
      ]),
    );
  }
}

Widget _LStat(BuildContext ctx, String label, String value, Color color) =>
    Expanded(child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: color.withAlpha(10),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(30)),
      ),
      child: Column(children: [
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w800,
            fontSize: 18, fontFamily: 'Playfair')),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(color: ctx.rq.muted, fontSize: 10)),
      ]),
    ));

// ── Add Incident Sheet ────────────────────────────────────────────────────────
class _AddIncidentSheet extends StatefulWidget {
  final Function(String quadName, String customerName,
      String type, String desc, String reporter) onAdd;
  const _AddIncidentSheet({required this.onAdd});
  @override State<_AddIncidentSheet> createState() =>
      _AddIncidentSheetState();
}

class _AddIncidentSheetState extends State<_AddIncidentSheet> {
  final _quad     = TextEditingController();
  final _customer = TextEditingController();
  final _desc     = TextEditingController();
  final _reporter = TextEditingController();
  String _type = 'mechanical';
  bool   _loading = false;

  @override void dispose() {
    _quad.dispose(); _customer.dispose();
    _desc.dispose(); _reporter.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: Theme.of(context).cardColor,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
    ),
    padding: EdgeInsets.fromLTRB(
        20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Container(width: 40, height: 4,
          decoration: BoxDecoration(color: kBorder,
              borderRadius: BorderRadius.circular(2))),
      const SizedBox(height: 16),
      const Text('Log Incident',
          style: TextStyle(fontFamily: 'Playfair',
              fontSize: 20, fontWeight: FontWeight.w700)),
      const SizedBox(height: 16),
      _F(_quad, 'Quad Name', Icons.directions_bike_rounded),
      const SizedBox(height: 10),
      _F(_customer, 'Customer Name', Icons.person_rounded),
      const SizedBox(height: 10),
      // Type selector
      Wrap(spacing: 8, children: ['fall','mechanical','medical','other']
          .map((t) => ChoiceChip(
            label: Text(t),
            selected: _type == t,
            onSelected: (_) => setState(() => _type = t),
            selectedColor: kRed.withAlpha(30),
          )).toList()),
      const SizedBox(height: 10),
      _F(_desc, 'Description', Icons.description_rounded, maxLines: 2),
      const SizedBox(height: 10),
      _F(_reporter, 'Reported by', Icons.badge_rounded),
      const SizedBox(height: 16),
      SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _loading ? null : () async {
            if (_quad.text.isEmpty || _desc.text.isEmpty) return;
            setState(() => _loading = true);
            await widget.onAdd(_quad.text, _customer.text,
                _type, _desc.text, _reporter.text);
            if (mounted) Navigator.of(context).pop();
          },
          style: ElevatedButton.styleFrom(
              backgroundColor: kRed,
              padding: const EdgeInsets.symmetric(vertical: 14)),
          child: _loading
              ? const SizedBox(width: 18, height: 18,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2))
              : const Text('Log Incident',
                  style: TextStyle(fontWeight: FontWeight.w700)),
        ),
      ),
    ]),
  );

  Widget _F(TextEditingController c, String label, IconData icon,
      {int maxLines = 1}) =>
      TextField(
        controller: c,
        maxLines: maxLines,
        decoration: InputDecoration(
            labelText: label,
            prefixIcon: Icon(icon, size: 18)),
      );
}
