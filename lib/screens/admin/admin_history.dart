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
  String _search = '';
  DateTime? _date;

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
    final total = history.fold(0, (s, b) => s + b.totalPaid);

    return Column(children: [
      Padding(
        padding: const EdgeInsets.all(12),
        child: Row(children: [
          Expanded(child: TextField(
            decoration: InputDecoration(
              hintText: 'Search name, phone, quad…',
              prefixIcon: const Icon(Icons.search_rounded, size: 18),
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              suffixIcon: _search.isNotEmpty
                ? IconButton(icon: const Icon(Icons.clear_rounded, size: 16),
                    onPressed: () => setState(() => _search = ''))
                : null,
            ),
            onChanged: (v) => setState(() => _search = v),
          )),
          const SizedBox(width: 8),
          TextButton.icon(
            icon: const Icon(Icons.calendar_today_rounded, size: 16),
            label: Text(_date != null ? '${_date!.day}/${_date!.month}' : 'Date',
                style: const TextStyle(fontSize: 12)),
            onPressed: () async {
              final d = await showDatePicker(
                context: context, initialDate: _date ?? DateTime.now(),
                firstDate: DateTime(2024), lastDate: DateTime.now(),
              );
              setState(() => _date = d);
            },
          ),
          if (_date != null) IconButton(
            icon: const Icon(Icons.clear_rounded, size: 16),
            onPressed: () => setState(() => _date = null),
          ),
        ]),
      ),

      if (_search.isNotEmpty || _date != null)
        Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Row(children: [
            Text('${history.length} result(s) · ${total.kes} KES total',
                style: const TextStyle(color: kMuted, fontSize: 12, fontStyle: FontStyle.italic)),
          ])),

      Expanded(child: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: history.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (ctx, i) {
          final b = history[i];
          return GestureDetector(
            onTap: () => context.push('/receipt/${b.id}'),
            child: AppCard(
              padding: const EdgeInsets.all(12),
              child: Row(children: [
                const Icon(Icons.receipt_long_rounded, color: kAccent, size: 20),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${b.customerName} · ${b.quadName}',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 2),
                  Text('${b.duration} min · ${b.startTime.day}/${b.startTime.month}/${b.startTime.year}',
                      style: const TextStyle(color: kMuted, fontSize: 11)),
                  if (b.mpesaRef != null) Text('📱 ${b.mpesaRef}',
                      style: const TextStyle(color: kMuted, fontSize: 10,
                          fontFamily: 'monospace')),
                ])),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('${b.totalPaid.kes} KES',
                      style: const TextStyle(color: kAccent, fontWeight: FontWeight.w700)),
                  Text('#${b.receiptId}',
                      style: const TextStyle(color: kMuted, fontSize: 10)),
                ]),
              ]),
            ),
          );
        },
      )),
    ]);
  }
}
