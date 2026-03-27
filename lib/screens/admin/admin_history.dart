import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../services/storage.dart';
import '../../theme/theme.dart';

class AdminHistoryTab extends StatefulWidget {
  const AdminHistoryTab({super.key});
  @override State<AdminHistoryTab> createState() => _AdminHistoryTabState();
}

class _AdminHistoryTabState extends State<AdminHistoryTab> {
  final _searchCtrl = TextEditingController();
  String    _search = '';
  DateTime? _date;
  String    _sort   = 'newest'; // newest | oldest | highest | lowest

  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    var history = context.watch<AppProvider>().history;

    // Filter
    if (_search.isNotEmpty) {
      final q = _search.toLowerCase();
      history = history.where((b) =>
          b.customerName.toLowerCase().contains(q) ||
          b.customerPhone.contains(q) ||
          b.quadName.toLowerCase().contains(q) ||
          b.receiptId.toLowerCase().contains(q) ||
          (b.mpesaRef?.toLowerCase().contains(q) ?? false)
      ).toList();
    }
    if (_date != null) {
      final d = DateTime(_date!.year, _date!.month, _date!.day);
      history = history.where((b) {
        final s = DateTime(b.startTime.year, b.startTime.month, b.startTime.day);
        return s == d;
      }).toList();
    }

    // Sort
    switch (_sort) {
      case 'oldest':  history.sort((a,b) => a.startTime.compareTo(b.startTime)); break;
      case 'highest': history.sort((a,b) => b.totalPaid.compareTo(a.totalPaid)); break;
      case 'lowest':  history.sort((a,b) => a.totalPaid.compareTo(b.totalPaid)); break;
      default:        history.sort((a,b) => b.startTime.compareTo(a.startTime));
    }

    final total    = history.fold(0, (s, b) => s + b.totalPaid);
    final overtime = history.fold(0, (s, b) => s + b.overtimeCharge);
    final filtered = _search.isNotEmpty || _date != null;

    return Column(children: [

      // ── Search + filter bar ──────────────────────────────────────────
      Container(
        color: Theme.of(context).scaffoldBackgroundColor,
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
        child: Column(children: [
          Row(children: [
            Expanded(child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search name, phone, receipt…',
                prefixIcon: const Icon(Icons.search_rounded, size: 18),
                isDense: true,
                suffixIcon: _search.isNotEmpty
                    ? GestureDetector(
                        onTap: () { _searchCtrl.clear(); setState(() => _search = ''); },
                        child: const Icon(Icons.clear_rounded, size: 16))
                    : null,
              ),
              onChanged: (v) => setState(() => _search = v),
            )),
            SizedBox(width: 8),
            // Export CSV
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => _showExport(context, history),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: kBorder),
                ),
                child: Icon(Icons.download_rounded, color: context.rq.muted, size: 16),
              ),
            ),
            const SizedBox(width: 8),
            // Date filter
            GestureDetector(
              onTap: () async {
                final d = await showDatePicker(
                  context: context,
                  initialDate: _date ?? DateTime.now(),
                  firstDate: DateTime(2024), lastDate: DateTime.now(),
                  builder: (ctx, child) => Theme(
                    data: Theme.of(ctx).copyWith(
                        colorScheme: const ColorScheme.light(primary: kAccent)),
                    child: child!,
                  ),
                );
                if (d != null) setState(() => _date = d);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                decoration: BoxDecoration(
                  color: _date != null ? kAccent : Colors.transparent,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                      color: _date != null ? kAccent : kBorder)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.calendar_today_rounded,
                      color: _date != null ? Colors.white : context.rq.muted, size: 16),
                  if (_date != null) ...[
                    SizedBox(width: 6),
                    Text(_date!.dateOnly, style: TextStyle(
                        color: context.rq.text, fontSize: 11,
                        fontWeight: FontWeight.w700)),
                    SizedBox(width: 4),
                    GestureDetector(
                      onTap: () => setState(() => _date = null),
                      child: Icon(Icons.close_rounded,
                          color: context.rq.text, size: 14)),
                  ],
                ]),
              ),
            ),
          ]),
          const SizedBox(height: 8),
          // Sort chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              Icon(Icons.sort_rounded, color: context.rq.muted, size: 14),
              const SizedBox(width: 6),
              ...['newest', 'oldest', 'highest', 'lowest'].map((s) {
                final active = _sort == s;
                final label = s[0].toUpperCase() + s.substring(1);
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: GestureDetector(
                    onTap: () => setState(() => _sort = s),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: active ? kAccent : Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: active ? kAccent : kBorder),
                      ),
                      child: Text(label, style: TextStyle(
                          color: active ? Colors.white : context.rq.muted,
                          fontSize: 12,
                          fontWeight: active ? FontWeight.w700 : FontWeight.w500)),
                    ),
                  ),
                );
              }),
            ]),
          ),
        ]),
      ),

      // ── Stats strip ──────────────────────────────────────────────────
      if (filtered || history.isNotEmpty)
        Container(
          color: Theme.of(context).scaffoldBackgroundColor,
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: kBorder),
            ),
            child: Row(children: [
              _StatPill('${history.length}', 'rides', kAccent),
              _Divider(),
              _StatPill('${total.kes} KES', 'revenue', kGreen),
              if (overtime > 0) ...[
                _Divider(),
                _StatPill('${overtime.kes} KES', 'overtime', kRed),
              ],
            ]),
          ),
        ),

      // ── List ─────────────────────────────────────────────────────────
      Expanded(
        child: history.isEmpty
            ? _EmptyHistory(filtered: filtered, onClear: () {
                _searchCtrl.clear();
                setState(() { _search = ''; _date = null; });
              })
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(12, 4, 12, 32),
                itemCount: history.length,
                itemBuilder: (ctx, i) {
                  final b = history[i];
                  // Date header
                  final showHeader = i == 0 ||
                      !_sameDay(b.startTime, history[i - 1].startTime);
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (showHeader) _DateHeader(b.startTime),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _HistoryTile(booking: b),
                      ),
                    ],
                  );
                },
              ),
      ),
    ]);
  }

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  void _showExport(BuildContext ctx, List<Booking> rides) {
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ExportSheet(bookings: rides),
    );
  }
}

class _DateHeader extends StatelessWidget {
  final DateTime date;
  const _DateHeader(this.date);

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final isToday = date.year == now.year && date.month == now.month
        && date.day == now.day;
    final isYesterday = date.year == now.year && date.month == now.month
        && date.day == now.day - 1;
    final label = isToday ? 'Today'
        : isYesterday ? 'Yesterday' : date.dateOnly;

    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 6),
      child: Row(children: [
        Text(label, style: TextStyle(
            color: context.rq.muted, fontSize: 11,
            fontWeight: FontWeight.w700, letterSpacing: 0.5)),
        const SizedBox(width: 10),
        Expanded(child: Container(height: 1, color: kBorder)),
      ]),
    );
  }
}

class _EmptyHistory extends StatelessWidget {
  final bool filtered;
  final VoidCallback onClear;
  const _EmptyHistory({required this.filtered, required this.onClear});

  @override
  Widget build(BuildContext context) => Center(child: Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Text(filtered ? '🔍' : '📋',
          style: const TextStyle(fontSize: 44)),
      SizedBox(height: 14),
      Text(
        filtered ? 'No results found' : 'No ride history yet',
        style: TextStyle(fontFamily: 'Playfair',
            fontSize: 17, fontWeight: FontWeight.w700, color: context.rq.text),
      ),
      SizedBox(height: 6),
      Text(
        filtered ? 'Try adjusting your search or filters'
            : 'Completed rides will appear here',
        style: TextStyle(color: context.rq.muted, fontSize: 13),
        textAlign: TextAlign.center,
      ),
      if (filtered) ...[
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: onClear,
          icon: const Icon(Icons.clear_all_rounded, size: 16),
          label: const Text('Clear filters'),
          style: ElevatedButton.styleFrom(
            backgroundColor: kAccent, foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            elevation: 0,
          ),
        ),
      ],
    ],
  ));
}

class _HistoryTile extends StatelessWidget {
  final Booking booking;
  const _HistoryTile({required this.booking});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () => context.push('/receipt/${booking.id}'),
    child: Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder),
        boxShadow: kShadowSm,
      ),
      child: Column(children: [
        // Main row
        Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: kAccent.withAlpha(15),
              child: Text(
                booking.customerName.isNotEmpty
                    ? booking.customerName[0].toUpperCase() : '?',
                style: const TextStyle(
                    color: kAccent, fontWeight: FontWeight.w800, fontSize: 17)),
            ),
            SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(booking.customerName, style: TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 14, color: context.rq.text)),
                SizedBox(height: 3),
                Row(children: [
                  QuadIcon(size: 11, color: context.rq.muted),
                  SizedBox(width: 3),
                  Text(booking.quadName,
                      style: TextStyle(color: context.rq.muted, fontSize: 12)),
                  SizedBox(width: 8),
                  Icon(Icons.timer_rounded, size: 11, color: context.rq.muted),
                  SizedBox(width: 3),
                  Text('${booking.duration} min',
                      style: TextStyle(color: context.rq.muted, fontSize: 12)),
                ]),
                if (booking.mpesaRef != null) ...[
                  const SizedBox(height: 2),
                  Row(children: [
                    Icon(
                      booking.mpesaRef == 'CASH'
                          ? Icons.payments_rounded
                          : Icons.smartphone_rounded,
                      size: 11, color: kGreen),
                    const SizedBox(width: 3),
                    Text(
                      booking.mpesaRef == 'MPESA-PENDING'
                          ? 'M-Pesa'
                          : booking.mpesaRef == 'CASH'
                              ? 'Cash'
                              : booking.mpesaRef!,
                      style: const TextStyle(
                          color: kGreen, fontSize: 11,
                          fontWeight: FontWeight.w700)),
                  ]),
                ],
                // Guide row
                if (booking.guideName != null && booking.guideName!.isNotEmpty) ...[
                  SizedBox(height: 5),
                  Row(children: [
                    Icon(Icons.person_rounded, size: 11,
                        color: context.rq.muted),
                    SizedBox(width: 3),
                    Text(booking.guideName!,
                        style: TextStyle(fontSize: 11,
                            color: context.rq.muted,
                            fontWeight: FontWeight.w600)),
                    SizedBox(width: 6),
                    // Commission amount
                    Text('·  ${(booking.totalPaid * 0.20).round().kes} KES',
                        style: TextStyle(fontSize: 10,
                            color: context.rq.muted)),
                    const Spacer(),
                    // Guide paid toggle
                    GestureDetector(
                      onTap: () => context.read<AppProvider>()
                          .toggleGuidePaid(booking.id),
                      child: Row(children: [
                        Text(
                          booking.guidePaid ? '✅ Paid' : '🚫 Unpaid',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: booking.guidePaid ? kGreen : kRed,
                          ),
                        ),
                      ]),
                    ),
                  ]),
                ],
              ],
            )),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('${booking.totalPaid.kes}', style: const TextStyle(
                  color: kAccent, fontWeight: FontWeight.w800, fontSize: 16)),
              Text('KES', style: TextStyle(
                  color: context.rq.muted, fontSize: 9, fontWeight: FontWeight.w600)),
              if (booking.overtimeCharge > 0) ...[
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: kRed.withAlpha(12),
                    borderRadius: BorderRadius.circular(6)),
                  child: Text('+${booking.overtimeCharge.kes} OT',
                      style: const TextStyle(
                          color: kRed, fontSize: 9, fontWeight: FontWeight.w700)),
                ),
              ],
              if (booking.rating != null) ...[
                const SizedBox(height: 3),
                Row(mainAxisSize: MainAxisSize.min,
                    children: List.generate(booking.rating!, (_) =>
                        const Icon(Icons.star_rounded, color: kAccent, size: 10))),
              ],
              SizedBox(height: 2),
              Text(
                '${booking.startTime.hour.toString().padLeft(2,'0')}:'
                '${booking.startTime.minute.toString().padLeft(2,'0')}',
                style: TextStyle(color: context.rq.muted, fontSize: 10)),
              const SizedBox(height: 6),
              GestureDetector(
                onTap: () async {
                  final ok = await showDialog<bool>(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: const Text('Delete Booking?'),
                      content: Text(
                          'Delete ${booking.quadName} · '
                          '${booking.duration} min · '
                          '${booking.totalPaid.kes} KES?'),
                      actions: [
                        TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Cancel')),
                        TextButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Delete',
                                style: TextStyle(color: kRed))),
                      ],
                    ),
                  );
                  if (ok == true && context.mounted) {
                    await context.read<AppProvider>().deleteBooking(booking.id);
                  }
                },
                child: Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: kRed.withAlpha(12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.delete_outline_rounded,
                      size: 15, color: kRed),
                ),
              ),
            ]),
          ]),
        ),
        // Deposit banner
        if (booking.depositAmount > 0 && !booking.depositReturned)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: kOrange.withAlpha(8),
              borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(15)),
              border: Border(top: BorderSide(color: kOrange.withAlpha(30))),
            ),
            child: Row(children: [
              const Icon(Icons.shield_rounded, size: 13, color: kOrange),
              const SizedBox(width: 6),
              Text('Deposit: ${booking.depositAmount.kes} KES on hold',
                  style: const TextStyle(color: kOrange, fontSize: 12,
                      fontWeight: FontWeight.w600)),
              const Spacer(),
              GestureDetector(
                onTap: () async {
                  await StorageService.returnDeposit(booking.id);
                  if (context.mounted) {
                    context.read<AppProvider>().loadAll();
                    showToast(context, 'Deposit returned ✓');
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: kOrange.withAlpha(15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: kOrange.withAlpha(50)),
                  ),
                  child: const Text('Mark Returned', style: TextStyle(
                      color: kOrange, fontSize: 11,
                      fontWeight: FontWeight.w700)),
                ),
              ),
            ]),
          ),
      ]),
    ),
  );
}

class _StatPill extends StatelessWidget {
  final String value, label; final Color color;
  const _StatPill(this.value, this.label, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Column(
    crossAxisAlignment: CrossAxisAlignment.center,
    children: [
      Text(value, style: TextStyle(
          fontWeight: FontWeight.w800, fontSize: 13, color: color)),
      Text(label, style: TextStyle(color: context.rq.muted, fontSize: 10)),
    ],
  ));
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
      Container(width: 1, height: 28, color: kBorder);
}

// ── CSV Export Sheet ──────────────────────────────────────────────────────────
class _ExportSheet extends StatefulWidget {
  final List<Booking> bookings;
  const _ExportSheet({required this.bookings});
  @override State<_ExportSheet> createState() => _ExportSheetState();
}

class _ExportSheetState extends State<_ExportSheet> {
  bool _copied = false;

  String _buildCsv() {
    final buf = StringBuffer();
    // Header
    buf.writeln('Receipt ID,Date,Time,Customer Name,Phone,'
        'Quad,Duration (min),Base Price (KES),Overtime (min),'
        'Overtime Charge (KES),Total (KES),Promo Code,M-Pesa Ref,Rating');
    // Rows
    for (final b in widget.bookings) {
      final date = '${b.startTime.day.toString().padLeft(2,'0')}/'
          '${b.startTime.month.toString().padLeft(2,'0')}/'
          '${b.startTime.year}';
      final time = '${b.startTime.hour.toString().padLeft(2,'0')}:'
          '${b.startTime.minute.toString().padLeft(2,'0')}';
      // Escape commas in names
      String esc(String? s) {
        if (s == null || s.isEmpty) return '';
        if (s.contains(',') || s.contains('"') || s.contains('\n')) {
          return '"${s.replaceAll('"', '""')}"';
        }
        return s;
      }
      buf.writeln('${b.receiptId},$date,$time,'
          '${esc(b.customerName)},${b.customerPhone},'
          '${esc(b.quadName)},${b.duration},'
          '${b.price},${b.overtimeMinutes},'
          '${b.overtimeCharge},${b.totalPaid},'
          '${esc(b.promoCode)},${esc(b.mpesaRef)},'
          '${b.rating ?? ''}');
    }
    return buf.toString();
  }

  Future<void> _copy() async {
    final csv = _buildCsv();
    await Clipboard.setData(ClipboardData(text: csv));
    setState(() => _copied = true);
    await Future.delayed(const Duration(seconds: 3));
    if (mounted) setState(() => _copied = false);
  }

  @override
  Widget build(BuildContext context) {
    final total = widget.bookings.fold(0, (s, b) => s + b.totalPaid);

    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor, borderRadius: BorderRadius.circular(24)),
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      child: Column(mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Handle
        Center(child: Container(width: 40, height: 4,
            decoration: BoxDecoration(
                color: kBorder, borderRadius: BorderRadius.circular(2)))),
        SizedBox(height: 16),

        // Title
        Row(children: [
          Container(width: 40, height: 40,
            decoration: BoxDecoration(
                color: kGreen.withAlpha(15),
                borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.table_chart_rounded,
                color: kGreen, size: 20)),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Export to CSV', style: TextStyle(
                fontFamily: 'Playfair', fontSize: 20,
                fontWeight: FontWeight.w700)),
            Text('Copy and paste into Google Sheets',
                style: TextStyle(color: context.rq.muted, fontSize: 12)),
          ]),
        ]),

        const SizedBox(height: 16),

        // Summary
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(14),
            border: Border.all(color: kBorder),
          ),
          child: Row(children: [
            _ExStat('${widget.bookings.length}', 'Rides', kAccent),
            _ExDivider(),
            _ExStat('${total.kes} KES', 'Revenue', kGreen),
            _ExDivider(),
            _ExStat('14', 'Columns', kIndigo),
          ]),
        ),

        const SizedBox(height: 12),

        // Columns list
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Theme.of(context).dividerColor.withAlpha(60), borderRadius: BorderRadius.circular(12),
            border: Border.all(color: kBorder),
          ),
          child: Wrap(
            spacing: 6, runSpacing: 6,
            children: [
              'Receipt ID', 'Date', 'Time', 'Customer', 'Phone',
              'Quad', 'Duration', 'Base Price', 'OT Mins',
              'OT Charge', 'Total', 'Promo', 'M-Pesa', 'Rating',
            ].map((col) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(6),
                border: Border.all(color: kBorder),
              ),
              child: Text(col, style: TextStyle(
                  color: context.rq.muted, fontSize: 10, fontWeight: FontWeight.w600)),
            )).toList(),
          ),
        ),

        SizedBox(height: 16),

        // Instructions
        Row(children: [
          Icon(Icons.info_outline_rounded, size: 14, color: context.rq.muted),
          SizedBox(width: 8),
          Expanded(child: Text(
            'Copy → Open Google Sheets → paste in cell A1.',
            style: TextStyle(color: context.rq.muted, fontSize: 12),
          )),
        ]),

        const SizedBox(height: 16),

        // Copy button
        SizedBox(width: double.infinity, height: 54,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            decoration: BoxDecoration(
              color: _copied ? kGreen : kAccent,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(
                color: (_copied ? kGreen : kAccent).withAlpha(60),
                blurRadius: 16, offset: const Offset(0, 6))],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: _copy,
                child: Center(child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    key: ValueKey(_copied),
                    children: [
                      Icon(_copied
                          ? Icons.check_circle_rounded
                          : Icons.copy_rounded,
                          color: context.rq.text, size: 20),
                      const SizedBox(width: 10),
                      Text(
                        _copied
                            ? 'Copied! Paste into Google Sheets'
                            : 'Copy ${widget.bookings.length} rows to clipboard',
                        style: TextStyle(
                            color: context.rq.text,
                            fontWeight: FontWeight.w800,
                            fontSize: 14)),
                    ],
                  ),
                )),
              ),
            ),
          ),
        ),
      ]),
    );
  }
}

class _ExStat extends StatelessWidget {
  final String value, label; final Color color;
  const _ExStat(this.value, this.label, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Column(
    crossAxisAlignment: CrossAxisAlignment.center,
    children: [
      Text(value, style: TextStyle(
          fontWeight: FontWeight.w800, fontSize: 14, color: color)),
      Text(label, style: TextStyle(color: context.rq.muted, fontSize: 10)),
    ],
  ));
}

class _ExDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
      Container(width: 1, height: 28, color: kBorder);
}
