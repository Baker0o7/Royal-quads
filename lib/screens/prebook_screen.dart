import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/storage.dart';
import '../theme/theme.dart';

class PrebookScreen extends StatefulWidget {
  const PrebookScreen({super.key});
  @override State<PrebookScreen> createState() => _PrebookScreenState();
}

class _PrebookScreenState extends State<PrebookScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;

  // Form state
  final _nameCtrl  = TextEditingController();
  final _phoneCtrl = TextEditingController();
  String   _name      = '', _phone = '';
  int?     _duration, _price;
  DateTime _scheduled = DateTime.now().add(const Duration(hours: 2));
  bool     _loading   = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (_name.trim().isEmpty) {
      showToast(context, 'Enter customer name', error: true); return;
    }
    if (_phone.trim().isEmpty) {
      showToast(context, 'Enter phone number', error: true); return;
    }
    if (_duration == null) {
      showToast(context, 'Select a duration', error: true); return;
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
      await StorageService.savePrebookings(
          [...StorageService.getPrebookings(), pb]);
      if (!mounted) return;
      showToast(context, 'Pre-booking confirmed! 🎉');
      // Reset form
      _nameCtrl.clear(); _phoneCtrl.clear();
      setState(() {
        _name = ''; _phone = ''; _duration = null; _price = null;
        _scheduled = DateTime.now().add(const Duration(hours: 2));
      });
      _tabs.animateTo(1);
    } catch (e) {
      if (mounted) showToast(context, '$e', error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookings = StorageService.getPrebookings().reversed.toList();

    return Scaffold(
      backgroundColor: kBg,
      body: NestedScrollView(
        headerSliverBuilder: (_, __) => [
          SliverAppBar(
            expandedHeight: 110, pinned: true, stretch: true,
            flexibleSpace: FlexibleSpaceBar(
              stretchModes: const [StretchMode.zoomBackground],
              background: Stack(fit: StackFit.expand, children: [
                Container(decoration: const BoxDecoration(gradient: kHeroGradient)),
                SafeArea(child: Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 8),
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: kAccent.withAlpha(20),
                        shape: BoxShape.circle,
                        border: Border.all(color: kAccent.withAlpha(60))),
                      child: const Icon(Icons.calendar_month_rounded,
                          color: kAccent2, size: 22)),
                    const SizedBox(height: 6),
                    const Text('Pre-Bookings', style: TextStyle(
                        fontFamily: 'Playfair', fontSize: 18,
                        fontWeight: FontWeight.w700, color: Colors.white)),
                  ],
                ))),
              ]),
              title: const Text('Pre-Bookings', style: TextStyle(
                  fontFamily: 'Playfair', fontSize: 17, color: Colors.white)),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(44),
              child: Container(
                color: kHeroTo,
                child: TabBar(
                  controller: _tabs,
                  indicatorColor: kAccent,
                  indicatorWeight: 3,
                  labelColor: kAccent,
                  unselectedLabelColor: Colors.white38,
                  labelStyle: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 13),
                  tabs: const [
                    Tab(text: 'New Booking'),
                    Tab(text: 'All Bookings'),
                  ],
                ),
              ),
            ),
          ),
        ],
        body: TabBarView(controller: _tabs, children: [
          // ── New booking form ───────────────────────────────────────────
          SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Customer details
                SectionHeading('Customer Details', icon: Icons.person_rounded),
                TextFormField(
                  controller: _nameCtrl,
                  decoration: const InputDecoration(
                      labelText: 'Full Name',
                      prefixIcon: Icon(Icons.person_outline, size: 18)),
                  textCapitalization: TextCapitalization.words,
                  onChanged: (v) => _name = v),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phoneCtrl,
                  decoration: const InputDecoration(
                      labelText: 'Phone Number',
                      prefixIcon: Icon(Icons.phone_outlined, size: 18)),
                  keyboardType: TextInputType.phone,
                  onChanged: (v) => _phone = v),

                const SizedBox(height: 24),

                // Duration
                SectionHeading('Duration & Price', icon: Icons.timer_rounded),
                GridView.count(
                  crossAxisCount: 3, shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 8, mainAxisSpacing: 8,
                  childAspectRatio: 1.5,
                  children: kPricing.map((p) {
                    final sel = _duration == p['duration'];
                    return GestureDetector(
                      onTap: () => setState(() {
                        _duration = p['duration'] as int;
                        _price    = p['price']    as int;
                      }),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        decoration: BoxDecoration(
                          color: sel ? kText : kCard,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                              color: sel ? kAccent : kBorder,
                              width: sel ? 2 : 1),
                          boxShadow: sel ? [BoxShadow(
                              color: kAccent.withAlpha(30),
                              blurRadius: 10, offset: const Offset(0, 3))]
                              : kShadowSm,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(p['label'] as String, style: TextStyle(
                                fontWeight: FontWeight.w800, fontSize: 13,
                                color: sel ? kAccent2 : kText)),
                            const SizedBox(height: 2),
                            Text('${(p['price'] as int).kes} KES',
                                style: TextStyle(
                                    fontSize: 11,
                                    color: sel ? Colors.white54 : kMuted)),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 24),

                // Date & time
                SectionHeading('Scheduled Date & Time',
                    icon: Icons.calendar_today_rounded),
                GestureDetector(
                  onTap: () async {
                    final d = await showDatePicker(
                      context: context,
                      initialDate: _scheduled,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 90)));
                    if (!mounted || d == null) return;
                    final t = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay.fromDateTime(_scheduled));
                    if (!mounted || t == null) return;
                    setState(() => _scheduled = DateTime(
                        d.year, d.month, d.day, t.hour, t.minute));
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: kCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: kBorder),
                      boxShadow: kShadowSm,
                    ),
                    child: Row(children: [
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: kAccent.withAlpha(12),
                          borderRadius: BorderRadius.circular(12)),
                        child: const Icon(Icons.event_rounded,
                            color: kAccent, size: 22)),
                      const SizedBox(width: 14),
                      Expanded(child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${_scheduled.day.toString().padLeft(2,'0')}/'
                            '${_scheduled.month.toString().padLeft(2,'0')}/'
                            '${_scheduled.year}',
                            style: const TextStyle(
                                fontWeight: FontWeight.w700, fontSize: 16)),
                          Text(
                            '${_scheduled.hour.toString().padLeft(2,'0')}:'
                            '${_scheduled.minute.toString().padLeft(2,'0')}',
                            style: const TextStyle(
                                color: kMuted, fontSize: 13)),
                        ],
                      )),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: kAccent.withAlpha(12),
                          borderRadius: BorderRadius.circular(10)),
                        child: const Text('Change', style: TextStyle(
                            color: kAccent, fontWeight: FontWeight.w700,
                            fontSize: 12))),
                    ]),
                  ),
                ),

                if (_duration != null) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: kHeroFrom,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: kAccent.withAlpha(40))),
                    child: Row(children: [
                      const Icon(Icons.bookmark_rounded,
                          color: kAccent, size: 20),
                      const SizedBox(width: 10),
                      Expanded(child: Text(
                          '${_duration} min · ${_scheduled.day}/${_scheduled.month}/${_scheduled.year}',
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w600))),
                      Text('${_price!.kes} KES', style: const TextStyle(
                          fontFamily: 'Playfair', color: kAccent2,
                          fontSize: 18, fontWeight: FontWeight.w700)),
                    ]),
                  ),
                ],

                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Confirm Pre-Booking',
                  icon: Icons.bookmark_add_rounded,
                  color: kAccent,
                  loading: _loading,
                  onTap: _submit,
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),

          // ── All bookings list ──────────────────────────────────────────
          bookings.isEmpty
              ? Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('📅', style: TextStyle(fontSize: 48)),
                    const SizedBox(height: 16),
                    const Text('No pre-bookings yet',
                        style: TextStyle(color: kMuted, fontSize: 16)),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => _tabs.animateTo(0),
                      child: const Text('Create the first one →')),
                  ]))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: bookings.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (ctx, i) => _PrebookTile(
                    prebooking: bookings[i],
                    onStatusChange: (status) async {
                      final all = StorageService.getPrebookings().map((b) =>
                          b.id == bookings[i].id
                              ? b.copyWith(status: status) : b).toList();
                      await StorageService.savePrebookings(all);
                      setState(() {});
                    },
                  ),
                ),
        ]),
      ),
    );
  }
}

class _PrebookTile extends StatelessWidget {
  final Prebooking prebooking;
  final ValueChanged<String> onStatusChange;
  const _PrebookTile({required this.prebooking, required this.onStatusChange});

  @override
  Widget build(BuildContext context) {
    final isPast = prebooking.scheduledFor.isBefore(DateTime.now());
    return Container(
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: kBorder),
        boxShadow: kShadowSm,
      ),
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Container(
              width: 46, height: 46,
              decoration: BoxDecoration(
                color: kAccent.withAlpha(12),
                borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.calendar_month_rounded,
                  color: kAccent, size: 22)),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(prebooking.customerName, style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 15)),
                const SizedBox(height: 2),
                Text(prebooking.customerPhone,
                    style: const TextStyle(color: kMuted, fontSize: 12)),
              ],
            )),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              StatusBadge(prebooking.status),
              const SizedBox(height: 4),
              Text('${prebooking.price.kes} KES',
                  style: const TextStyle(
                      color: kAccent, fontWeight: FontWeight.w700)),
            ]),
          ]),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isPast ? kBg2 : kGreen.withAlpha(8),
            borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(18)),
            border: Border(top: BorderSide(color: kBorder))),
          child: Row(children: [
            Icon(Icons.schedule_rounded,
                size: 14,
                color: isPast ? kMuted : kGreen),
            const SizedBox(width: 6),
            Text(
              '${prebooking.duration} min  ·  '
              '${prebooking.scheduledFor.day}/${prebooking.scheduledFor.month}/${prebooking.scheduledFor.year}  '
              '${prebooking.scheduledFor.hour.toString().padLeft(2,'0')}:'
              '${prebooking.scheduledFor.minute.toString().padLeft(2,'0')}',
              style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w600,
                  color: isPast ? kMuted : kGreen)),
            const Spacer(),
            if (prebooking.status == 'pending')
              GestureDetector(
                onTap: () => onStatusChange('confirmed'),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: kGreen.withAlpha(15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: kGreen.withAlpha(40))),
                  child: const Text('Confirm', style: TextStyle(
                      color: kGreen, fontSize: 11,
                      fontWeight: FontWeight.w700)))),
            if (prebooking.status == 'confirmed')
              GestureDetector(
                onTap: () => onStatusChange('cancelled'),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: kRed.withAlpha(10),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: kRed.withAlpha(30))),
                  child: const Text('Cancel', style: TextStyle(
                      color: kRed, fontSize: 11,
                      fontWeight: FontWeight.w700)))),
          ]),
        ),
      ]),
    );
  }
}
