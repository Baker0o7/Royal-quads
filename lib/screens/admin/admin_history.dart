import '../../models/models.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/theme.dart';

class AdminHistoryTab extends StatefulWidget {
  const AdminHistoryTab({super.key});
  @override State<AdminHistoryTab> createState() => _AdminHistoryTabState();
}

class _AdminHistoryTabState extends State<AdminHistoryTab> {
  final _searchCtrl = TextEditingController();
  String    _search = '';
  DateTime? _date;

  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    var history = context.watch<AppProvider>().history;

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

    final total    = history.fold(0, (s, b) => s + b.totalPaid);
    final overtime = history.fold(0, (s, b) => s + b.overtimeCharge);
    final filtered = _search.isNotEmpty || _date != null;

    return Column(children: [
      // ── Search bar ──────────────────────────────────────────────────────
      Container(
        color: kBg,
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
        child: Row(children: [
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
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () async {
              final d = await showDatePicker(
                context: context,
                initialDate: _date ?? DateTime.now(),
                firstDate: DateTime(2024), lastDate: DateTime.now());
              if (d != null) setState(() => _date = d);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              decoration: BoxDecoration(
                color: _date != null ? kAccent : kBg2,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: _date != null ? kAccent : kBorder)),
              child: Row(children: [
                Icon(Icons.calendar_today_rounded,
                    color: _date != null ? Colors.white : kMuted, size: 16),
                if (_date != null) ...[
                  const SizedBox(width: 6),
                  Text(_date!.dateOnly, style: const TextStyle(
                      color: Colors.white, fontSize: 11,
                      fontWeight: FontWeight.w700)),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: () => setState(() => _date = null),
                    child: const Icon(Icons.close_rounded,
                        color: Colors.white70, size: 14)),
                ],
              ]),
            ),
          ),
        ]),
      ),

      // ── Stats strip ─────────────────────────────────────────────────────
      if (filtered)
        Container(
          color: kBg,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: kAccent.withAlpha(10),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kAccent.withAlpha(30))),
            child: Row(children: [
              _Strip('${history.length}', 'rides', kAccent),
              _VSep(),
              _Strip('${total.kes} KES', 'revenue', kGreen),
              if (overtime > 0) ...[
                _VSep(),
                _Strip('${overtime.kes} KES', 'overtime', kRed),
              ],
            ]),
          ),
        ),

      // ── List ─────────────────────────────────────────────────────────────
      Expanded(
        child: history.isEmpty
            ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('🔍', style: TextStyle(fontSize: 40)),
                  const SizedBox(height: 12),
                  Text(filtered ? 'No results found' : 'No booking history',
                      style: const TextStyle(color: kMuted, fontSize: 15)),
                  if (filtered) ...[
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () {
                        _searchCtrl.clear();
                        setState(() { _search = ''; _date = null; });
                      },
                      child: const Text('Clear filters')),
                  ],
                ]))
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 32),
                itemCount: history.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (ctx, i) => _HistoryTile(booking: history[i]),
              ),
      ),
    ]);
  }
}

class _HistoryTile extends StatelessWidget {
  final Booking booking;
  const _HistoryTile({required this.booking});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () => context.push('/receipt/${booking.id}'),
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder),
        boxShadow: kShadowSm,
      ),
      child: Row(children: [
        // Icon with date
        Column(children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: kAccent.withAlpha(12),
              borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.receipt_long_rounded,
                color: kAccent, size: 22)),
          const SizedBox(height: 4),
          Text('${booking.startTime.day}/${booking.startTime.month}',
              style: const TextStyle(color: kMuted, fontSize: 9)),
        ]),
        const SizedBox(width: 12),
        // Details
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(booking.customerName, style: const TextStyle(
                fontWeight: FontWeight.w700, fontSize: 14)),
            const SizedBox(height: 2),
            Row(children: [
              const Icon(Icons.directions_bike_rounded,
                  size: 11, color: kMuted),
              const SizedBox(width: 3),
              Text(booking.quadName,
                  style: const TextStyle(color: kMuted, fontSize: 12)),
              const SizedBox(width: 8),
              const Icon(Icons.timer_rounded, size: 11, color: kMuted),
              const SizedBox(width: 3),
              Text('${booking.duration} min',
                  style: const TextStyle(color: kMuted, fontSize: 12)),
            ]),
            if (booking.mpesaRef != null)
              Row(children: [
                const Icon(Icons.phone_android_rounded,
                    size: 11, color: kGreen),
                const SizedBox(width: 3),
                Text(booking.mpesaRef!, style: const TextStyle(
                    color: kGreen, fontSize: 11, fontFamily: 'monospace')),
              ]),
          ],
        )),
        // Amount
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('${booking.totalPaid.kes}', style: const TextStyle(
              color: kAccent, fontWeight: FontWeight.w800, fontSize: 16)),
          const Text('KES', style: TextStyle(color: kMuted, fontSize: 10)),
          if (booking.overtimeCharge > 0)
            Container(
              margin: const EdgeInsets.only(top: 3),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: kRed.withAlpha(12),
                borderRadius: BorderRadius.circular(8)),
              child: Text('+${booking.overtimeCharge.kes} OT',
                  style: const TextStyle(
                      color: kRed, fontSize: 9,
                      fontWeight: FontWeight.w700))),
          if (booking.rating != null)
            Row(mainAxisSize: MainAxisSize.min,
                children: List.generate(booking.rating!, (i) =>
                    const Icon(Icons.star_rounded,
                        color: kAccent, size: 10))),
          const SizedBox(height: 2),
          const Icon(Icons.chevron_right_rounded, color: kMuted, size: 16),
        ]),
      ]),
    ),
  );
}

class _Strip extends StatelessWidget {
  final String value, label;
  final Color color;
  const _Strip(this.value, this.label, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Column(
    crossAxisAlignment: CrossAxisAlignment.center,
    children: [
      Text(value, style: TextStyle(
          fontWeight: FontWeight.w800, fontSize: 13, color: color)),
      Text(label, style: const TextStyle(color: kMuted, fontSize: 10)),
    ],
  ));
}

class _VSep extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
      width: 1, height: 28, color: kBorder);
}
