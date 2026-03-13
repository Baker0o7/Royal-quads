import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
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

  final _nameCtrl  = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _formKey   = GlobalKey<FormState>();

  String   _name  = '', _phone = '', _notes = '';
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
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDateTime() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _scheduled,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(primary: kAccent),
        ),
        child: child!,
      ),
    );
    if (!mounted || d == null) return;
    final t = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_scheduled),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(primary: kAccent),
        ),
        child: child!,
      ),
    );
    if (!mounted || t == null) return;
    setState(() => _scheduled =
        DateTime(d.year, d.month, d.day, t.hour, t.minute));
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_duration == null) {
      showToast(context, 'Select a ride duration', error: true); return;
    }
    setState(() => _loading = true);
    try {
      final pb = Prebooking(
        id: DateTime.now().millisecondsSinceEpoch,
        customerName: _name.trim(),
        customerPhone: _phone.trim(),
        duration: _duration!, price: _price!,
        scheduledFor: _scheduled,
        status: 'pending',
        createdAt: DateTime.now(),
        notes: _notes.trim().isEmpty ? null : _notes.trim(),
      );
      await StorageService.savePrebookings(
          [...StorageService.getPrebookings(), pb]);
      if (!mounted) return;
      showToast(context, 'Pre-booking confirmed! 🎉');
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
            expandedHeight: 130, pinned: true, stretch: true,
            flexibleSpace: FlexibleSpaceBar(
              stretchModes: const [StretchMode.zoomBackground],
              background: Stack(fit: StackFit.expand, children: [
                Container(decoration: const BoxDecoration(gradient: kHeroGradient)),
                // Gold shimmer top
                Positioned(top: 0, left: 0, right: 0,
                  child: Container(height: 2,
                    decoration: const BoxDecoration(gradient: kGoldGradient))),
                SafeArea(child: Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 48, height: 48,
                      decoration: BoxDecoration(
                        color: kAccent.withAlpha(20),
                        shape: BoxShape.circle,
                        border: Border.all(color: kAccent.withAlpha(60)),
                        boxShadow: [BoxShadow(
                            color: kAccent.withAlpha(40), blurRadius: 16)],
                      ),
                      child: const Icon(Icons.calendar_month_rounded,
                          color: kAccent2, size: 24)),
                    const SizedBox(height: 8),
                    const Text('Pre-Bookings', style: TextStyle(
                        fontFamily: 'Playfair', fontSize: 20,
                        fontWeight: FontWeight.w700, color: Colors.white)),
                    const SizedBox(height: 2),
                    const Text('SCHEDULE A RIDE IN ADVANCE',
                        style: TextStyle(color: Colors.white30,
                            fontSize: 9, letterSpacing: 2.5)),
                  ],
                ))),
              ]),
              title: const Text('Pre-Bookings', style: TextStyle(
                  fontFamily: 'Playfair', fontSize: 17, color: Colors.white)),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(46),
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
                  tabs: [
                    Tab(child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.add_circle_outline_rounded, size: 14),
                        SizedBox(width: 6),
                        Text('New Booking'),
                      ],
                    )),
                    Tab(child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.list_rounded, size: 14),
                        const SizedBox(width: 6),
                        const Text('All Bookings'),
                        if (bookings.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: kAccent.withAlpha(30),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text('${bookings.length}',
                                style: const TextStyle(
                                    fontSize: 10, fontWeight: FontWeight.w800,
                                    color: kAccent)),
                          ),
                        ],
                      ],
                    )),
                  ],
                ),
              ),
            ),
          ),
        ],
        body: TabBarView(controller: _tabs, children: [

          // ── Tab 1: New Booking Form ──────────────────────────────────────
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  // Customer details
                  _SectionLabel('Customer Details',
                      Icons.person_rounded),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _nameCtrl,
                    textCapitalization: TextCapitalization.words,
                    validator: (v) => v?.trim().isEmpty == true
                        ? 'Enter customer name' : null,
                    decoration: const InputDecoration(
                        labelText: 'Full Name',
                        hintText: 'John Kamau',
                        prefixIcon: Icon(Icons.person_outline, size: 18)),
                    onChanged: (v) => _name = v,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                    validator: (v) {
                      final n = v?.replaceAll(RegExp(r'[\s\-().]+'), '') ?? '';
                      return n.length < 9 ? 'Enter a valid phone number' : null;
                    },
                    decoration: const InputDecoration(
                        labelText: 'Phone Number',
                        hintText: '0712 345 678',
                        prefixIcon: Icon(Icons.phone_outlined, size: 18)),
                    onChanged: (v) => _phone = v,
                  ),
                  const SizedBox(height: 14),

                  // Notes / special requests
                  TextFormField(
                    controller: _notesCtrl,
                    maxLines: 2,
                    decoration: const InputDecoration(
                        labelText: 'Notes / Special Requests',
                        hintText: 'e.g. group of 3, first-time rider...',
                        prefixIcon: Padding(
                          padding: EdgeInsets.only(bottom: 24),
                          child: Icon(Icons.sticky_note_2_outlined, size: 18))),
                    onChanged: (v) => setState(() => _notes = v),
                  ),

                  const SizedBox(height: 28),

                  // Duration
                  _SectionLabel('Duration & Price', Icons.timer_rounded),
                  const SizedBox(height: 12),
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
                            boxShadow: sel
                                ? [BoxShadow(color: kAccent.withAlpha(30),
                                    blurRadius: 10, offset: const Offset(0,3))]
                                : kShadowSm,
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              if (sel)
                                const Icon(Icons.check_circle_rounded,
                                    color: kAccent, size: 12),
                              if (sel) const SizedBox(height: 2),
                              Text(p['label'] as String, style: TextStyle(
                                  fontWeight: FontWeight.w800, fontSize: 13,
                                  color: sel ? kAccent2 : kText)),
                              const SizedBox(height: 2),
                              Text('${(p['price'] as int).kes} KES',
                                  style: TextStyle(fontSize: 11,
                                      color: sel ? Colors.white54 : kMuted)),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 28),

                  // Date & Time
                  _SectionLabel('Scheduled Date & Time',
                      Icons.calendar_today_rounded),
                  const SizedBox(height: 12),
                  _DateTimePicker(
                    scheduled: _scheduled,
                    onTap: _pickDateTime,
                  ),

                  const SizedBox(height: 28),

                  // Summary
                  if (_duration != null) ...[
                    _BookingSummary(
                      duration: _duration!,
                      price: _price!,
                      scheduled: _scheduled,
                      name: _name,
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Submit
                  SizedBox(
                    width: double.infinity, height: 54,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kAccent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: _loading
                          ? const SizedBox(width: 22, height: 22,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2.5))
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.bookmark_add_rounded, size: 18),
                                SizedBox(width: 10),
                                Text('Confirm Pre-Booking',
                                    style: TextStyle(fontSize: 15,
                                        fontWeight: FontWeight.w700)),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Tab 2: All Bookings ──────────────────────────────────────────
          bookings.isEmpty
              ? _EmptyBookings(onAdd: () => _tabs.animateTo(0))
              : _BookingsList(
                  bookings: bookings,
                  onStatusChange: (id, status) async {
                    final all = StorageService.getPrebookings().map((b) =>
                        b.id == id ? b.copyWith(status: status) : b).toList();
                    await StorageService.savePrebookings(all);
                    setState(() {});
                  },
                ),
        ]),
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String text; final IconData icon;
  const _SectionLabel(this.text, this.icon);
  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, color: kAccent, size: 16),
    const SizedBox(width: 8),
    Text(text, style: const TextStyle(fontFamily: 'Playfair',
        fontSize: 16, fontWeight: FontWeight.w700, color: kText)),
  ]);
}

class _DateTimePicker extends StatelessWidget {
  final DateTime scheduled;
  final VoidCallback onTap;
  const _DateTimePicker({required this.scheduled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final now    = DateTime.now();
    final isToday = scheduled.year == now.year &&
        scheduled.month == now.month && scheduled.day == now.day;
    final isTomorrow = scheduled.year == now.year &&
        scheduled.month == now.month && scheduled.day == now.day + 1;
    final dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow'
        : '${_weekday(scheduled.weekday)}, ${scheduled.day} ${_month(scheduled.month)}';
    final timeLabel =
        '${scheduled.hour.toString().padLeft(2, '0')}:${scheduled.minute.toString().padLeft(2, '0')}';

    return GestureDetector(
      onTap: onTap,
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
            width: 52, height: 52,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [kAccent.withAlpha(25), kAccent.withAlpha(10)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: kAccent.withAlpha(40)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('${scheduled.day}', style: const TextStyle(
                    color: kAccent, fontWeight: FontWeight.w900,
                    fontSize: 18, height: 1)),
                Text(_month(scheduled.month).substring(0, 3).toUpperCase(),
                    style: const TextStyle(color: kAccent, fontSize: 9,
                        fontWeight: FontWeight.w700, letterSpacing: 0.5)),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(dayLabel, style: const TextStyle(
                  fontWeight: FontWeight.w700, fontSize: 15, color: kText)),
              const SizedBox(height: 2),
              Row(children: [
                const Icon(Icons.access_time_rounded,
                    size: 12, color: kMuted),
                const SizedBox(width: 4),
                Text(timeLabel, style: const TextStyle(
                    color: kMuted, fontSize: 13, fontWeight: FontWeight.w600)),
              ]),
            ],
          )),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: kAccent.withAlpha(12),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: kAccent.withAlpha(30)),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: const [
              Icon(Icons.edit_calendar_rounded, color: kAccent, size: 14),
              SizedBox(width: 6),
              Text('Change', style: TextStyle(
                  color: kAccent, fontWeight: FontWeight.w700, fontSize: 12)),
            ]),
          ),
        ]),
      ),
    );
  }

  String _weekday(int w) => const ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][w-1];
  String _month(int m) => const ['January','February','March','April','May',
    'June','July','August','September','October','November','December'][m-1];
}

class _BookingSummary extends StatelessWidget {
  final int duration, price;
  final DateTime scheduled;
  final String name;
  const _BookingSummary({required this.duration, required this.price,
      required this.scheduled, required this.name});

  @override
  Widget build(BuildContext context) => AnimatedContainer(
    duration: const Duration(milliseconds: 300),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: kHeroFrom,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: kAccent.withAlpha(50)),
      boxShadow: [BoxShadow(
          color: kAccent.withAlpha(15), blurRadius: 16, offset: const Offset(0,4))],
    ),
    child: Column(children: [
      Row(children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color: kAccent.withAlpha(20),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.bookmark_rounded, color: kAccent, size: 18)),
        const SizedBox(width: 10),
        const Text('Booking Summary', style: TextStyle(
            color: Colors.white54, fontSize: 12,
            fontWeight: FontWeight.w600, letterSpacing: 0.5)),
        const Spacer(),
        Text('${price.kes} KES', style: const TextStyle(
            fontFamily: 'Playfair', color: kAccent2,
            fontSize: 20, fontWeight: FontWeight.w700)),
      ]),
      const SizedBox(height: 12),
      const Divider(color: Colors.white12, height: 1),
      const SizedBox(height: 12),
      _SummaryRow(Icons.timer_rounded,       '$duration min ride'),
      const SizedBox(height: 6),
      _SummaryRow(Icons.calendar_today_rounded,
          '${scheduled.day}/${scheduled.month}/${scheduled.year}  '
          '${scheduled.hour.toString().padLeft(2,'0')}:${scheduled.minute.toString().padLeft(2,'0')}'),
      if (name.trim().isNotEmpty) ...[
        const SizedBox(height: 6),
        _SummaryRow(Icons.person_outline_rounded, name.trim()),
      ],
    ]),
  );
}

class _SummaryRow extends StatelessWidget {
  final IconData icon; final String text;
  const _SummaryRow(this.icon, this.text);
  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, size: 14, color: Colors.white38),
    const SizedBox(width: 8),
    Text(text, style: const TextStyle(color: Colors.white70, fontSize: 13)),
  ]);
}

class _EmptyBookings extends StatelessWidget {
  final VoidCallback onAdd;
  const _EmptyBookings({required this.onAdd});
  @override
  Widget build(BuildContext context) => Center(child: Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Container(
        width: 80, height: 80,
        decoration: BoxDecoration(
          color: kAccent.withAlpha(10),
          shape: BoxShape.circle,
          border: Border.all(color: kAccent.withAlpha(30)),
        ),
        child: const Icon(Icons.calendar_month_rounded,
            color: kAccent, size: 36)),
      const SizedBox(height: 16),
      const Text('No pre-bookings yet', style: TextStyle(
          fontFamily: 'Playfair', fontSize: 18,
          fontWeight: FontWeight.w700, color: kText)),
      const SizedBox(height: 6),
      const Text('Schedule rides in advance for your customers',
          style: TextStyle(color: kMuted, fontSize: 13),
          textAlign: TextAlign.center),
      const SizedBox(height: 20),
      ElevatedButton.icon(
        onPressed: onAdd,
        icon: const Icon(Icons.add_rounded, size: 18),
        label: const Text('Create first booking'),
        style: ElevatedButton.styleFrom(
          backgroundColor: kAccent, foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          elevation: 0,
        ),
      ),
    ],
  ));
}

class _BookingsList extends StatelessWidget {
  final List<Prebooking> bookings;
  final Function(int id, String status) onStatusChange;
  const _BookingsList({required this.bookings, required this.onStatusChange});

  @override
  Widget build(BuildContext context) {
    // Group by date
    final today    = bookings.where((b) => _isToday(b.scheduledFor)).toList();
    final upcoming = bookings.where((b) =>
        !_isToday(b.scheduledFor) && b.scheduledFor.isAfter(DateTime.now())).toList();
    final past     = bookings.where((b) =>
        !_isToday(b.scheduledFor) && b.scheduledFor.isBefore(DateTime.now())).toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (today.isNotEmpty) ...[
          _GroupHeader('Today', kGreen, '${today.length}'),
          ...today.map((b) => _PrebookTile(
              prebooking: b, onStatusChange: onStatusChange)),
          const SizedBox(height: 8),
        ],
        if (upcoming.isNotEmpty) ...[
          _GroupHeader('Upcoming', kAccent, '${upcoming.length}'),
          ...upcoming.map((b) => _PrebookTile(
              prebooking: b, onStatusChange: onStatusChange)),
          const SizedBox(height: 8),
        ],
        if (past.isNotEmpty) ...[
          _GroupHeader('Past', kMuted, '${past.length}'),
          ...past.map((b) => _PrebookTile(
              prebooking: b, onStatusChange: onStatusChange)),
        ],
        const SizedBox(height: 24),
      ],
    );
  }

  bool _isToday(DateTime d) {
    final now = DateTime.now();
    return d.year == now.year && d.month == now.month && d.day == now.day;
  }
}

class _GroupHeader extends StatelessWidget {
  final String label, count; final Color color;
  const _GroupHeader(this.label, this.color, this.count);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(children: [
      Text(label, style: TextStyle(
          fontFamily: 'Playfair', fontSize: 14,
          fontWeight: FontWeight.w700, color: color)),
      const SizedBox(width: 8),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(
          color: color.withAlpha(15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withAlpha(40)),
        ),
        child: Text(count, style: TextStyle(
            color: color, fontSize: 10, fontWeight: FontWeight.w800)),
      ),
      const SizedBox(width: 12),
      Expanded(child: Container(height: 1, color: color.withAlpha(20))),
    ]),
  );
}

class _PrebookTile extends StatelessWidget {
  final Prebooking prebooking;
  final Function(int id, String status) onStatusChange;
  const _PrebookTile({required this.prebooking, required this.onStatusChange});

  @override
  Widget build(BuildContext context) {
    final isPast = prebooking.scheduledFor.isBefore(DateTime.now());
    final statusColor = _statusColor(prebooking.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
            // Avatar
            CircleAvatar(
              radius: 22,
              backgroundColor: statusColor.withAlpha(20),
              child: Text(
                prebooking.customerName.isNotEmpty
                    ? prebooking.customerName[0].toUpperCase() : '?',
                style: TextStyle(color: statusColor,
                    fontWeight: FontWeight.w800, fontSize: 18)),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(prebooking.customerName, style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 14, color: kText)),
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
                      color: kAccent, fontWeight: FontWeight.w700,
                      fontSize: 13)),
            ]),
          ]),
        ),

        // Footer
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isPast ? kBg2 : kGreen.withAlpha(6),
            borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(18)),
            border: Border(top: BorderSide(color: kBorder)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
            Icon(Icons.schedule_rounded, size: 13,
                color: isPast ? kMuted : kGreen),
            const SizedBox(width: 6),
            Expanded(child: Text(
              '${prebooking.duration} min  ·  '
              '${prebooking.scheduledFor.day}/${prebooking.scheduledFor.month}/${prebooking.scheduledFor.year}  '
              '${prebooking.scheduledFor.hour.toString().padLeft(2,'0')}:'
              '${prebooking.scheduledFor.minute.toString().padLeft(2,'0')}',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                  color: isPast ? kMuted : kGreen),
            )),
            if (prebooking.status == 'pending') ...[
              _ActionChip('Confirm', kGreen, Icons.check_rounded,
                  () => onStatusChange(prebooking.id, 'confirmed')),
              const SizedBox(width: 6),
              _ActionChip('Cancel', kRed, Icons.close_rounded,
                  () => onStatusChange(prebooking.id, 'cancelled')),
            ],
            if (prebooking.status == 'confirmed')
              _StartRideChip(prebooking: prebooking,
                  onStarted: () => onStatusChange(prebooking.id, 'completed')),
          ]),
              if (prebooking.notes != null) ...[
                const SizedBox(height: 6),
                Row(children: [
                  const Icon(Icons.sticky_note_2_outlined, size: 11, color: kMuted),
                  const SizedBox(width: 4),
                  Expanded(child: Text(prebooking.notes!,
                      style: const TextStyle(color: kMuted, fontSize: 11),
                      maxLines: 1, overflow: TextOverflow.ellipsis)),
                ]),
              ],
            ],
          ),
        ),
      ]),
    );
  }

  Color _statusColor(String s) => switch (s) {
    'confirmed'  => kGreen,
    'cancelled'  => kRed,
    'completed'  => kIndigo,
    _            => kAccent,
  };
}

class _ActionChip extends StatelessWidget {
  final String label; final Color color;
  final IconData icon; final VoidCallback onTap;
  const _ActionChip(this.label, this.color, this.icon, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withAlpha(12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withAlpha(40)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 11, color: color),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(
            color: color, fontSize: 11, fontWeight: FontWeight.w700)),
      ]),
    ),
  );
}

// ── Start Ride chip — converts prebooking to live booking ────────────────────
class _StartRideChip extends StatefulWidget {
  final Prebooking prebooking;
  final VoidCallback onStarted;
  const _StartRideChip({required this.prebooking, required this.onStarted});
  @override State<_StartRideChip> createState() => _StartRideChipState();
}

class _StartRideChipState extends State<_StartRideChip> {
  bool _loading = false;

  Future<void> _start() async {
    setState(() => _loading = true);
    try {
      // Pick first available quad
      final quads = StorageService.getQuads()
          .where((q) => q.status == 'available').toList();
      if (quads.isEmpty) {
        if (mounted) showToast(context, 'No quads available right now', error: true);
        setState(() => _loading = false);
        return;
      }

      final booking = await context.read<AppProvider>().createBooking(
        quadId: quads.first.id,
        customerName: widget.prebooking.customerName,
        customerPhone: widget.prebooking.customerPhone,
        duration: widget.prebooking.duration,
        price: widget.prebooking.price,
        originalPrice: widget.prebooking.price,
        mpesaRef: widget.prebooking.mpesaRef,
      );

      widget.onStarted(); // mark prebooking completed
      if (!mounted) return;
      context.push('/waiver/${booking.id}');
    } catch (e) {
      if (mounted) {
        showToast(context, e.toString().replaceFirst('Exception: ', ''), error: true);
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: _loading ? null : _start,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: kGreen.withAlpha(20),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: kGreen.withAlpha(60)),
        boxShadow: [BoxShadow(color: kGreen.withAlpha(30), blurRadius: 8)],
      ),
      child: _loading
          ? const SizedBox(width: 14, height: 14,
              child: CircularProgressIndicator(
                  color: kGreen, strokeWidth: 2))
          : Row(mainAxisSize: MainAxisSize.min, children: const [
              Icon(Icons.play_arrow_rounded, size: 13, color: kGreen),
              SizedBox(width: 4),
              Text('Start Ride', style: TextStyle(
                  color: kGreen, fontSize: 11, fontWeight: FontWeight.w800)),
            ]),
    ),
  );
}
