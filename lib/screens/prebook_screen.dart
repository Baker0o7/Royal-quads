import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/storage.dart';
import '../theme/theme.dart';

class PrebookScreen extends StatefulWidget {
  const PrebookScreen({super.key});
  @override State<PrebookScreen> createState() => _PrebookScreenState();
}

class _PrebookScreenState extends State<PrebookScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  String _name = '', _phone = '';
  int?   _duration, _price;
  DateTime _scheduled = DateTime.now().add(const Duration(hours: 2));
  bool   _loading = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final bookings = StorageService.getPrebookings().reversed.toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pre-Bookings', style: TextStyle(color: Colors.white)),
        backgroundColor: kHeroTo,
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: kAccent,
          labelColor: kAccent,
          unselectedLabelColor: Colors.white54,
          tabs: const [Tab(text: 'New Booking'), Tab(text: 'All Bookings')],
        ),
      ),
      body: TabBarView(controller: _tabs, children: [
        // ── New ──────────────────────────────────────────────────────────
        SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(children: [
            SectionHeading('Customer', icon: Icons.person_rounded),
            TextFormField(
              decoration: const InputDecoration(labelText: 'Full Name',
                  prefixIcon: Icon(Icons.person_outline, size: 18)),
              onChanged: (v) => _name = v,
            ),
            const SizedBox(height: 12),
            TextFormField(
              decoration: const InputDecoration(labelText: 'Phone',
                  prefixIcon: Icon(Icons.phone_outlined, size: 18)),
              keyboardType: TextInputType.phone,
              onChanged: (v) => _phone = v,
            ),
            const SizedBox(height: 20),

            SectionHeading('Duration', icon: Icons.timer_rounded),
            Wrap(spacing: 8, runSpacing: 8, children: kPricing.map((p) {
              final sel = _duration == p['duration'];
              return GestureDetector(
                onTap: () => setState(() { _duration = p['duration'] as int; _price = p['price'] as int; }),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: sel ? kText : kBg2, borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: sel ? kAccent : kBorder),
                  ),
                  child: Column(children: [
                    Text(p['label'] as String, style: TextStyle(
                        fontWeight: FontWeight.w700, color: sel ? kAccent2 : kText)),
                    Text('${(p['price'] as int).kes} KES',
                        style: TextStyle(fontSize: 11, color: sel ? Colors.white54 : kMuted)),
                  ]),
                ),
              );
            }).toList()),
            const SizedBox(height: 20),

            SectionHeading('Date & Time', icon: Icons.calendar_today_rounded),
            AppCard(child: Row(children: [
              const Icon(Icons.schedule_rounded, color: kAccent),
              const SizedBox(width: 12),
              Expanded(child: Text(
                '${_scheduled.day}/${_scheduled.month}/${_scheduled.year}  '
                '${_scheduled.hour.toString().padLeft(2,'0')}:${_scheduled.minute.toString().padLeft(2,'0')}',
                style: const TextStyle(fontWeight: FontWeight.w700))),
              TextButton(
                onPressed: () async {
                  final d = await showDatePicker(
                    context: context, initialDate: _scheduled,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 90)),
                  );
                  if (d == null || !mounted) return;
                  final t = await showTimePicker(
                    context: context,
                    initialTime: TimeOfDay.fromDateTime(_scheduled),
                  );
                  if (t == null) return;
                  setState(() => _scheduled = DateTime(d.year, d.month, d.day, t.hour, t.minute));
                },
                child: const Text('Change'),
              ),
            ])),
            const SizedBox(height: 24),

            PrimaryButton(
              label: 'Confirm Pre-Booking',
              icon: Icons.bookmark_add_rounded,
              loading: _loading,
              onTap: () async {
                if (_name.trim().isEmpty || _phone.trim().isEmpty || _duration == null) {
                  showToast(context, 'Fill all fields', error: true); return;
                }
                setState(() => _loading = true);
                try {
                  final pb = Prebooking(
                    id: DateTime.now().millisecondsSinceEpoch,
                    customerName: _name.trim(), customerPhone: _phone.trim(),
                    duration: _duration!, price: _price!,
                    scheduledFor: _scheduled, status: 'pending',
                    createdAt: DateTime.now(),
                  );
                  final all = StorageService.getPrebookings();
                  await StorageService.savePrebookings([...all, pb]);
                  if (mounted) {
                    showToast(context, 'Pre-booking confirmed! 🎉');
                    _tabs.animateTo(1);
                  }
                } catch (e) {
                  if (mounted) showToast(context, '$e', error: true);
                } finally {
                  if (mounted) setState(() => _loading = false);
                }
              },
            ),
            const SizedBox(height: 40),
          ]),
        ),

        // ── All bookings ────────────────────────────────────────────────
        bookings.isEmpty
            ? const Center(child: Text('No pre-bookings yet', style: TextStyle(color: kMuted)))
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: bookings.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (ctx, i) {
                  final b = bookings[i];
                  return AppCard(child: Row(children: [
                    StatusBadge(b.status),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(b.customerName, style: const TextStyle(fontWeight: FontWeight.w700)),
                      Text('${b.duration} min · ${b.scheduledFor.day}/${b.scheduledFor.month}/${b.scheduledFor.year}',
                          style: const TextStyle(color: kMuted, fontSize: 12)),
                    ])),
                    Text('${b.price.kes} KES',
                        style: const TextStyle(color: kAccent, fontWeight: FontWeight.w700)),
                  ]));
                },
              ),
      ]),
    );
  }
}
