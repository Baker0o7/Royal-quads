import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
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
        color: kBg,
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
          const SizedBox(height: 8),
          // Sort chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              const Icon(Icons.sort_rounded, color: kMuted, size: 14),
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
                          color: active ? Colors.white : kMuted,
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
          color: kBg,
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: kCard,
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
        Text(label, style: const TextStyle(
            color: kMuted, fontSize: 11,
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
      const SizedBox(height: 14),
      Text(
        filtered ? 'No results found' : 'No ride history yet',
        style: const TextStyle(fontFamily: 'Playfair',
            fontSize: 17, fontWeight: FontWeight.w700, color: kText),
      ),
      const SizedBox(height: 6),
      Text(
        filtered ? 'Try adjusting your search or filters'
            : 'Completed rides will appear here',
        style: const TextStyle(color: kMuted, fontSize: 13),
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
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder),
        boxShadow: kShadowSm,
      ),
      child: Row(children: [
        // Avatar with initial
        CircleAvatar(
          radius: 22,
          backgroundColor: kAccent.withAlpha(15),
          child: Text(
            booking.customerName.isNotEmpty
                ? booking.customerName[0].toUpperCase() : '?',
            style: const TextStyle(
                color: kAccent, fontWeight: FontWeight.w800, fontSize: 17),
          ),
        ),
        const SizedBox(width: 12),
        // Details
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(booking.customerName, style: const TextStyle(
                fontWeight: FontWeight.w700, fontSize: 14, color: kText)),
            const SizedBox(height: 3),
            Row(children: [
              const Icon(Icons.directions_bike_rounded, size: 11, color: kMuted),
              const SizedBox(width: 3),
              Text(booking.quadName,
                  style: const TextStyle(color: kMuted, fontSize: 12)),
              const SizedBox(width: 8),
              const Icon(Icons.timer_rounded, size: 11, color: kMuted),
              const SizedBox(width: 3),
              Text('${booking.duration} min',
                  style: const TextStyle(color: kMuted, fontSize: 12)),
            ]),
            if (booking.mpesaRef != null) ...[
              const SizedBox(height: 2),
              Row(children: [
                const Icon(Icons.smartphone_rounded, size: 11, color: kGreen),
                const SizedBox(width: 3),
                Text(booking.mpesaRef!, style: const TextStyle(
                    color: kGreen, fontSize: 11, fontFamily: 'monospace')),
              ]),
            ],
          ],
        )),
        // Right side
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('${booking.totalPaid.kes}', style: const TextStyle(
              color: kAccent, fontWeight: FontWeight.w800, fontSize: 16)),
          const Text('KES', style: TextStyle(color: kMuted, fontSize: 9,
              fontWeight: FontWeight.w600)),
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
          const SizedBox(height: 2),
          Text('${booking.startTime.hour.toString().padLeft(2,'0')}:'
              '${booking.startTime.minute.toString().padLeft(2,'0')}',
              style: const TextStyle(color: kMuted, fontSize: 10)),
        ]),
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
      Text(label, style: const TextStyle(color: kMuted, fontSize: 10)),
    ],
  ));
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
      Container(width: 1, height: 28, color: kBorder);
}
