import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../services/storage.dart';
import '../../theme/theme.dart';
import 'admin_fleet.dart';
import 'admin_history.dart';
import 'admin_tools.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});
  @override State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  bool _pinVerified = false;
  int  _tab = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadAll();
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_pinVerified) return _PinScreen(
      onVerify: (pin) {
        if (StorageService.verifyAdminPin(pin)) {
          setState(() => _pinVerified = true);
        } else {
          showToast(context, 'Incorrect PIN', error: true);
        }
      },
    );

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        title: const Text('Admin Dashboard',
            style: TextStyle(fontFamily: 'Playfair',
                fontSize: 18, color: Colors.white)),
        backgroundColor: kHeroTo,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => context.go('/'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white70),
            onPressed: () => context.read<AppProvider>().loadAll(),
          ),
        ],
      ),
      body: IndexedStack(
        index: _tab,
        children: const [
          AdminOverviewTab(),
          AdminFleetTab(),
          AdminHistoryTab(),
          AdminToolsTab(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: kHeroTo,
          boxShadow: [BoxShadow(
              color: Colors.black.withAlpha(60),
              blurRadius: 20, offset: const Offset(0, -4))],
        ),
        child: SafeArea(top: false, child: SizedBox(height: 64,
          child: Row(children: [
            _NavItem(Icons.dashboard_rounded,     'Overview', 0, _tab, () => setState(() => _tab = 0)),
            _NavItem(Icons.directions_bike_rounded,'Fleet',   1, _tab, () => setState(() => _tab = 1)),
            _NavItem(Icons.history_rounded,        'History', 2, _tab, () => setState(() => _tab = 2)),
            _NavItem(Icons.settings_rounded,       'Tools',   3, _tab, () => setState(() => _tab = 3)),
          ]),
        )),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final int index, current;
  final VoidCallback onTap;
  const _NavItem(this.icon, this.label, this.index, this.current, this.onTap);

  @override
  Widget build(BuildContext context) {
    final active = index == current;
    return Expanded(child: GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          decoration: BoxDecoration(
            color: active ? kAccent.withAlpha(25) : Colors.transparent,
            borderRadius: BorderRadius.circular(20)),
          child: Icon(icon,
              color: active ? kAccent : Colors.white38, size: 22)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(
            color: active ? kAccent : Colors.white30,
            fontSize: 10,
            fontWeight: active ? FontWeight.w700 : FontWeight.w400)),
      ]),
    ));
  }
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
class AdminOverviewTab extends StatelessWidget {
  const AdminOverviewTab({super.key});

  @override
  Widget build(BuildContext context) {
    final prov  = context.watch<AppProvider>();
    final sales = StorageService.getSalesSummary();
    final quads = prov.quads;
    final avail = quads.where((q) => q.status == 'available').length;
    final history = StorageService.getHistory();

    return RefreshIndicator(
      color: kAccent,
      onRefresh: () => prov.loadAll(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

          // ── Revenue strip ─────────────────────────────────────────────────
          HeroCard(
            padding: const EdgeInsets.all(20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Row(children: [
                Icon(Icons.bar_chart_rounded, color: kAccent2, size: 18),
                SizedBox(width: 8),
                Text('Revenue Overview',
                    style: TextStyle(color: Colors.white54,
                        fontSize: 12, letterSpacing: 0.5)),
              ]),
              const SizedBox(height: 10),
              Text('${sales['total']!.kes} KES',
                  style: const TextStyle(
                      fontFamily: 'Playfair', fontSize: 32,
                      fontWeight: FontWeight.w900, color: Colors.white)),
              const Text('All-time revenue',
                  style: TextStyle(color: Colors.white30, fontSize: 12)),
              const SizedBox(height: 16),
              Row(children: [
                _RevPill('Today',  '${sales['today']!.kes}',  kGreen),
                const SizedBox(width: 8),
                _RevPill('Week',   '${sales['week']!.kes}',   kAccent),
                const SizedBox(width: 8),
                _RevPill('Month',  '${sales['month']!.kes}',  kIndigo),
              ]),
            ]),
          ),

          const SizedBox(height: 16),

          // ── Quick stats ───────────────────────────────────────────────────
          GridView.count(
            crossAxisCount: 2, shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.7,
            children: [
              _StatCard('Live Rides', '${prov.active.length}',
                  Icons.local_fire_department_rounded, kRed,
                  sub: prov.active.isEmpty ? 'All clear' : 'On track'),
              _StatCard('Fleet', '$avail / ${quads.length}',
                  Icons.directions_bike_rounded, kAccent,
                  sub: 'available'),
              _StatCard('Today Rides',
                  '${history.where((b) {
                    final d = DateTime.now();
                    return b.startTime.year == d.year &&
                        b.startTime.month == d.month &&
                        b.startTime.day == d.day;
                  }).length}',
                  Icons.today_rounded, kGreen, sub: 'completed'),
              _StatCard('Overtime', '${sales['overtime']!.kes} KES',
                  Icons.timer_off_rounded, kOrange,
                  sub: 'total earned'),
            ],
          ),

          const SizedBox(height: 20),

          // ── Quick actions ─────────────────────────────────────────────────
          SectionHeading('Quick Actions', icon: Icons.bolt_rounded),
          Row(children: [
            Expanded(child: _ActionCard(
              icon: Icons.play_circle_rounded,
              label: 'Quick Start',
              sub: 'Start a ride fast',
              color: kGreen,
              onTap: () => _showQuickStart(context),
            )),
            const SizedBox(width: 12),
            Expanded(child: _ActionCard(
              icon: Icons.analytics_rounded,
              label: 'Daily Report',
              sub: 'View today\'s stats',
              color: kIndigo,
              onTap: () => _showDailyReport(context),
            )),
          ]),

          const SizedBox(height: 20),

          // ── Live rides ────────────────────────────────────────────────────
          SectionHeading('Live Rides', icon: Icons.local_fire_department_rounded,
            trailing: prov.active.isEmpty ? null : _LiveBadge(prov.active.length)),
          if (prov.active.isEmpty)
            AppCard(child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 28),
              child: Column(children: [
                Text('🏜️', style: TextStyle(fontSize: 36)),
                SizedBox(height: 8),
                Text('No active rides right now',
                    style: TextStyle(color: kMuted)),
              ]),
            ))
          else
            ...prov.active.map((b) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _LiveRideTile(booking: b),
            )),
        ]),
      ),
    );
  }

  void _showQuickStart(BuildContext context) {
    showModalBottomSheet(
      context: context, isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ChangeNotifierProvider.value(
          value: context.read<AppProvider>(),
          child: const _QuickStartSheet()),
    );
  }

  void _showDailyReport(BuildContext context) {
    showModalBottomSheet(
      context: context, isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _DailyReportSheet(),
    );
  }
}

class _RevPill extends StatelessWidget {
  final String label, value;
  final Color color;
  const _RevPill(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
    decoration: BoxDecoration(
      color: color.withAlpha(20),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: color.withAlpha(40))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(value, style: TextStyle(
          color: color, fontWeight: FontWeight.w800, fontSize: 13)),
      Text(label, style: const TextStyle(
          color: Colors.white38, fontSize: 10)),
    ]),
  ));
}

class _StatCard extends StatelessWidget {
  final String label, value, sub;
  final IconData icon;
  final Color color;
  const _StatCard(this.label, this.value, this.icon, this.color,
      {required this.sub});
  @override
  Widget build(BuildContext context) => AppCard(
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
              color: color.withAlpha(18),
              borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 17)),
        const Spacer(),
      ]),
      const SizedBox(height: 6),
      Text(value, style: const TextStyle(
          fontFamily: 'Playfair', fontSize: 19,
          fontWeight: FontWeight.w900)),
      Text('$label · $sub',
          style: const TextStyle(color: kMuted, fontSize: 10)),
    ]),
  );
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label, sub;
  final Color color;
  final VoidCallback onTap;
  const _ActionCard({required this.icon, required this.label,
      required this.sub, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withAlpha(10),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withAlpha(40)),
        boxShadow: kShadowSm,
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
              color: color, borderRadius: BorderRadius.circular(10),
              boxShadow: [BoxShadow(
                  color: color.withAlpha(60), blurRadius: 8,
                  offset: const Offset(0, 3))]),
          child: Icon(icon, color: Colors.white, size: 18)),
        const SizedBox(height: 10),
        Text(label, style: TextStyle(
            color: color, fontWeight: FontWeight.w800, fontSize: 14)),
        Text(sub, style: const TextStyle(
            color: kMuted, fontSize: 11)),
      ]),
    ),
  );
}

class _LiveBadge extends StatelessWidget {
  final int count;
  const _LiveBadge(this.count);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: kRed.withAlpha(15),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: kRed.withAlpha(40))),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Container(width: 6, height: 6,
          decoration: const BoxDecoration(color: kRed, shape: BoxShape.circle)),
      const SizedBox(width: 4),
      Text('$count', style: const TextStyle(
          color: kRed, fontSize: 11, fontWeight: FontWeight.w700)),
    ]),
  );
}

class _LiveRideTile extends StatelessWidget {
  final Booking booking;
  const _LiveRideTile({required this.booking});
  @override
  Widget build(BuildContext context) {
    final elapsed   = DateTime.now().difference(booking.startTime).inSeconds;
    final remaining = booking.duration * 60 - elapsed;
    final overtime  = remaining < 0;
    return AppCard(
      onTap: () => context.push('/ride/${booking.id}'),
      child: Row(children: [
        Container(width: 44, height: 44,
          decoration: BoxDecoration(
            color: overtime ? kRed.withAlpha(15) : kAccent.withAlpha(12),
            borderRadius: BorderRadius.circular(12)),
          child: Icon(Icons.directions_bike_rounded,
              color: overtime ? kRed : kAccent, size: 22)),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(booking.quadName,
                style: const TextStyle(fontWeight: FontWeight.w700)),
            Text('${booking.customerName} · ${booking.duration} min',
                style: const TextStyle(color: kMuted, fontSize: 12)),
          ],
        )),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('${booking.price.kes} KES',
              style: const TextStyle(
                  color: kAccent, fontWeight: FontWeight.w700, fontSize: 13)),
          Text(overtime ? 'OVERTIME' : '${(remaining ~/ 60)} min left',
              style: TextStyle(
                  color: overtime ? kRed : kMuted,
                  fontSize: 11, fontWeight: FontWeight.w600)),
        ]),
      ]),
    );
  }
}

// ── Quick Start Sheet ──────────────────────────────────────────────────────────
class _QuickStartSheet extends StatefulWidget {
  const _QuickStartSheet();
  @override State<_QuickStartSheet> createState() => _QSSState();
}

class _QSSState extends State<_QuickStartSheet> {
  int? _qId, _dur, _price;
  String _name = '', _phone = '', _mpesa = '';
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    final available = context.watch<AppProvider>().quads
        .where((q) => q.status == 'available').toList();
    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: kBg, borderRadius: BorderRadius.circular(24)),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        top: 16, left: 20, right: 20),
      child: Column(mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 40, height: 4,
            decoration: BoxDecoration(
                color: kBorder, borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 16),
        Row(children: [
          Container(width: 36, height: 36,
            decoration: BoxDecoration(
                color: kGreen, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 20)),
          const SizedBox(width: 10),
          const Text('Quick Start', style: TextStyle(
              fontFamily: 'Playfair', fontSize: 20, fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 20),
        DropdownButtonFormField<int>(
          decoration: const InputDecoration(
              labelText: 'Select Quad',
              prefixIcon: Icon(Icons.directions_bike_rounded, size: 18)),
          value: _qId,
          items: available.map((q) => DropdownMenuItem(
              value: q.id,
              child: Text(q.name))).toList(),
          onChanged: (v) => setState(() => _qId = v),
        ),
        const SizedBox(height: 16),
        const Text('Duration', style: TextStyle(
            fontWeight: FontWeight.w700, fontSize: 13, color: kMuted)),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8, children: kPricing.map((p) {
          final sel = _dur == p['duration'];
          return GestureDetector(
            onTap: () => setState(() {
              _dur = p['duration'] as int;
              _price = p['price'] as int;
            }),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: sel ? kText : kBg2,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: sel ? kAccent : kBorder),
              ),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text(p['label'] as String, style: TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 13,
                    color: sel ? kAccent2 : kText)),
                Text('${(p['price'] as int).kes} KES', style: TextStyle(
                    fontSize: 10, color: sel ? Colors.white54 : kMuted)),
              ]),
            ),
          );
        }).toList()),
        const SizedBox(height: 16),
        TextFormField(
          decoration: const InputDecoration(
              labelText: 'Customer Name',
              prefixIcon: Icon(Icons.person_outline, size: 18)),
          textCapitalization: TextCapitalization.words,
          onChanged: (v) => _name = v,
        ),
        const SizedBox(height: 12),
        TextFormField(
          decoration: const InputDecoration(
              labelText: 'Phone',
              prefixIcon: Icon(Icons.phone_outlined, size: 18)),
          keyboardType: TextInputType.phone,
          onChanged: (v) => _phone = v,
        ),
        const SizedBox(height: 12),
        TextFormField(
          decoration: const InputDecoration(
              labelText: 'M-Pesa Ref (optional)',
              prefixIcon: Icon(Icons.confirmation_number_outlined, size: 18)),
          textCapitalization: TextCapitalization.characters,
          onChanged: (v) => _mpesa = v,
        ),
        const SizedBox(height: 20),
        PrimaryButton(
          label: _price != null
              ? 'Start Ride  ·  ${_price!.kes} KES'
              : 'Start Ride',
          icon: Icons.play_arrow_rounded,
          color: kGreen,
          loading: _loading,
          onTap: () async {
            if (_qId == null || _dur == null ||
                _name.trim().isEmpty || _phone.trim().isEmpty) {
              showToast(context, 'Please fill all required fields',
                  error: true);
              return;
            }
            setState(() => _loading = true);
            try {
              final b = await context.read<AppProvider>().createBooking(
                quadId: _qId!, customerName: _name.trim(),
                customerPhone: _phone.trim(),
                duration: _dur!, price: _price!,
                mpesaRef: _mpesa.trim().isEmpty ? null : _mpesa.trim(),
              );
              if (!context.mounted) return;
              Navigator.pop(context);
              context.push('/ride/${b.id}');
            } catch (e) {
              if (context.mounted)
                showToast(context,
                    e.toString().replaceFirst('Exception: ',''), error: true);
              setState(() => _loading = false);
            }
          },
        ),
      ]),
    );
  }
}

// ── Daily Report ───────────────────────────────────────────────────────────────
class _DailyReportSheet extends StatefulWidget {
  const _DailyReportSheet();
  @override State<_DailyReportSheet> createState() => _DRSState();
}

class _DRSState extends State<_DailyReportSheet> {
  DateTime _date = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final all = StorageService.getHistory();
    final start = DateTime(_date.year, _date.month, _date.day);
    final end   = start.add(const Duration(days: 1));
    final rides = all.where((b) =>
        !b.startTime.isBefore(start) && b.startTime.isBefore(end)).toList();
    final total    = rides.fold(0, (s, b) => s + b.totalPaid);
    final overtime = rides.fold(0, (s, b) => s + b.overtimeCharge);

    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: kBg, borderRadius: BorderRadius.circular(24)),
      padding: const EdgeInsets.all(20),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Center(child: Container(width: 40, height: 4,
            decoration: BoxDecoration(
                color: kBorder, borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 16),
        Row(children: [
          const Text('Daily Report', style: TextStyle(
              fontFamily: 'Playfair', fontSize: 20,
              fontWeight: FontWeight.w700)),
          const Spacer(),
          GestureDetector(
            onTap: () async {
              final d = await showDatePicker(
                context: context, initialDate: _date,
                firstDate: DateTime(2024), lastDate: DateTime.now());
              if (d != null) setState(() => _date = d);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: kAccent.withAlpha(12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kAccent.withAlpha(40))),
              child: Row(children: [
                const Icon(Icons.calendar_today_rounded,
                    color: kAccent, size: 14),
                const SizedBox(width: 6),
                Text(_date.dateOnly, style: const TextStyle(
                    color: kAccent, fontWeight: FontWeight.w700,
                    fontSize: 13)),
              ]),
            ),
          ),
        ]),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2, shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 2.4,
          children: [
            _MiniStat('Total Rides',  '${rides.length}',         kAccent),
            _MiniStat('Revenue',      '${total.kes} KES',        kGreen),
            _MiniStat('Overtime',     '${overtime.kes} KES',     kRed),
            _MiniStat('Avg/Ride',
                rides.isEmpty ? '0 KES'
                    : '${(total ~/ rides.length).kes} KES', kIndigo),
          ],
        ),
        if (rides.isNotEmpty) ...[
          const SizedBox(height: 12),
          const Divider(color: kBorder),
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 200),
            child: ListView(children: rides.map((b) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(children: [
                Container(width: 6, height: 6,
                    decoration: const BoxDecoration(
                        color: kAccent, shape: BoxShape.circle)),
                const SizedBox(width: 8),
                Expanded(child: Text(
                    '${b.customerName} — ${b.quadName}',
                    style: const TextStyle(fontSize: 13))),
                Text('${b.totalPaid.kes} KES',
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w700,
                        color: kAccent)),
              ]),
            )).toList()),
          ),
        ] else
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Column(children: [
              const Text('📭', style: TextStyle(fontSize: 32)),
              const SizedBox(height: 8),
              Text('No rides on ${_date.dateOnly}',
                  style: const TextStyle(color: kMuted)),
            ]),
          ),
        const SizedBox(height: 8),
      ]),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label, value;
  final Color color;
  const _MiniStat(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(
      color: color.withAlpha(10),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: color.withAlpha(30))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(value, style: TextStyle(
          fontWeight: FontWeight.w800, fontSize: 14, color: color)),
      Text(label, style: const TextStyle(color: kMuted, fontSize: 10)),
    ]),
  );
}

// ── PIN Screen ─────────────────────────────────────────────────────────────────
class _PinScreen extends StatefulWidget {
  final ValueChanged<String> onVerify;
  const _PinScreen({required this.onVerify});
  @override State<_PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends State<_PinScreen>
    with SingleTickerProviderStateMixin {
  String _pin = '';
  bool   _shake = false;
  late AnimationController _shakeCtrl;
  late Animation<double>   _shakeAnim;

  @override
  void initState() {
    super.initState();
    _shakeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 400));
    _shakeAnim = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0, end: -12), weight: 1),
      TweenSequenceItem(tween: Tween(begin: -12, end: 12), weight: 2),
      TweenSequenceItem(tween: Tween(begin: 12, end: -10), weight: 2),
      TweenSequenceItem(tween: Tween(begin: -10, end: 10), weight: 2),
      TweenSequenceItem(tween: Tween(begin: 10, end: 0), weight: 1),
    ]).animate(_shakeCtrl);
  }

  @override
  void dispose() { _shakeCtrl.dispose(); super.dispose(); }

  void _tap(String d) {
    if (_pin.length >= 4) return;
    setState(() => _pin += d);
    if (_pin.length == 4) {
      Future.delayed(const Duration(milliseconds: 150), () {
        if (!mounted) return;
        final p = _pin;
        setState(() => _pin = '');
        widget.onVerify(p);
      });
    }
  }

  void _back() {
    if (_pin.isNotEmpty) setState(() => _pin = _pin.substring(0, _pin.length - 1));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Container(
      decoration: const BoxDecoration(gradient: kHeroGradient),
      child: SafeArea(child: Column(children: [
        const Spacer(),

        Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(
                color: kAccent.withAlpha(60), blurRadius: 24)]),
          child: CircleAvatar(radius: 44,
              backgroundImage: const AssetImage('assets/images/logo.png'),
              backgroundColor: Colors.transparent)),
        const SizedBox(height: 20),
        const Text('Admin Access', style: TextStyle(
            fontFamily: 'Playfair', fontSize: 26,
            fontWeight: FontWeight.w700, color: Colors.white)),
        const SizedBox(height: 4),
        const Text('Enter your 4-digit PIN',
            style: TextStyle(color: Colors.white38, fontSize: 14)),
        const SizedBox(height: 36),

        // Dots
        AnimatedBuilder(
          animation: _shakeAnim,
          builder: (_, child) => Transform.translate(
            offset: Offset(_shakeAnim.value, 0),
            child: child),
          child: Row(mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(4, (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 10),
              width: i < _pin.length ? 18 : 16,
              height: i < _pin.length ? 18 : 16,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: i < _pin.length ? kAccent : Colors.white12,
                boxShadow: i < _pin.length ? [
                  BoxShadow(color: kAccent.withAlpha(80), blurRadius: 8)
                ] : null,
              ),
            ))),
        ),

        const Spacer(),

        // Numpad
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 56),
          child: Column(children: [
            ...[['1','2','3'],['4','5','6'],['7','8','9']].map((row) =>
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: row.map((d) => _PinKey(
                    label: d, onTap: () => _tap(d))).toList()),
              )),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const SizedBox(width: 70, height: 70),
              _PinKey(label: '0', onTap: () => _tap('0')),
              _PinKey(icon: Icons.backspace_outlined, onTap: _back),
            ]),
          ]),
        ),

        const SizedBox(height: 24),
        TextButton(
          onPressed: () => context.go('/'),
          child: const Text('← Back to App',
              style: TextStyle(color: Colors.white30, fontSize: 13)),
        ),
        const SizedBox(height: 20),
      ])),
    ),
  );
}

class _PinKey extends StatelessWidget {
  final String? label;
  final IconData? icon;
  final VoidCallback onTap;
  const _PinKey({this.label, this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 70, height: 70,
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(10),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withAlpha(15))),
      child: Center(child: label != null
          ? Text(label!, style: const TextStyle(
              color: Colors.white, fontSize: 24,
              fontWeight: FontWeight.w600))
          : Icon(icon, color: Colors.white54, size: 22)),
    ),
  );
}
