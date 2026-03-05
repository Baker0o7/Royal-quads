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
  bool   _pinVerified = false;
  String _pin = '';
  int    _tab = 0;

  @override
  void initState() {
    super.initState();
    context.read<AppProvider>().loadAll();
  }

  @override
  Widget build(BuildContext context) {
    if (!_pinVerified) return _PinScreen(
      onVerify: (pin) {
        if (StorageService.verifyAdminPin(pin)) {
          setState(() { _pinVerified = true; });
        } else {
          showToast(context, 'Incorrect PIN', error: true);
        }
      },
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard',
            style: TextStyle(fontFamily: 'Playfair', color: Colors.white)),
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
      body: [
        const AdminOverviewTab(),
        const AdminFleetTab(),
        const AdminHistoryTab(),
        const AdminToolsTab(),
      ][_tab],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tab,
        onTap: (i) => setState(() => _tab = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Overview'),
          BottomNavigationBarItem(icon: Icon(Icons.directions_bike_rounded), label: 'Fleet'),
          BottomNavigationBarItem(icon: Icon(Icons.history_rounded), label: 'History'),
          BottomNavigationBarItem(icon: Icon(Icons.settings_rounded), label: 'Tools'),
        ],
      ),
    );
  }
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
class AdminOverviewTab extends StatelessWidget {
  const AdminOverviewTab({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final sales    = StorageService.getSalesSummary();
    final quads    = provider.quads;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // ── Stats grid ────────────────────────────────────────────────────
        GridView.count(
          crossAxisCount: 2, shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.6,
          children: [
            _StatCard('Today', '${sales['today']!.kes} KES', Icons.today_rounded, kGreen),
            _StatCard('This Week', '${sales['week']!.kes} KES', Icons.calendar_view_week_rounded, kAccent),
            _StatCard('Live Rides', '${provider.active.length}', Icons.local_fire_department_rounded, kRed),
            _StatCard('Available', '${quads.where((q) => q.status == 'available').length}/${quads.length}',
                Icons.directions_bike_rounded, kIndigo),
          ],
        ),

        const SizedBox(height: 20),

        // ── Quick Start ───────────────────────────────────────────────────
        SectionHeading('Quick Actions', icon: Icons.bolt_rounded),
        Row(children: [
          Expanded(child: _ActionBtn(
            icon: Icons.add_circle_rounded, label: 'Quick Start', color: kGreen,
            onTap: () => _showQuickStart(context),
          )),
          const SizedBox(width: 12),
          Expanded(child: _ActionBtn(
            icon: Icons.bar_chart_rounded, label: 'Daily Report', color: kIndigo,
            onTap: () => _showDailyReport(context),
          )),
        ]),

        const SizedBox(height: 20),

        // ── Live Rides ────────────────────────────────────────────────────
        SectionHeading('Live Rides', icon: Icons.local_fire_department_rounded),
        if (provider.active.isEmpty)
          AppCard(child: const Padding(padding: EdgeInsets.symmetric(vertical: 20),
            child: Center(child: Text('No active rides', style: TextStyle(color: kMuted)))))
        else
          ...provider.active.map((b) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: AppCard(
              onTap: () => context.push('/ride/${b.id}'),
              child: Row(children: [
                Container(width: 44, height: 44,
                  decoration: BoxDecoration(color: kAccent.withAlpha(20),
                      borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.directions_bike_rounded, color: kAccent, size: 22)),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(b.quadName, style: const TextStyle(fontWeight: FontWeight.w700)),
                  Text('${b.customerName} · ${b.duration} min',
                      style: const TextStyle(color: kMuted, fontSize: 12)),
                ])),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('${b.price.kes} KES',
                      style: const TextStyle(color: kAccent, fontWeight: FontWeight.w700)),
                  const Icon(Icons.chevron_right_rounded, color: kMuted, size: 16),
                ]),
              ]),
            ),
          )),
      ]),
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

// ── Quick Start Sheet ──────────────────────────────────────────────────────────
class _QuickStartSheet extends StatefulWidget {
  const _QuickStartSheet();
  @override State<_QuickStartSheet> createState() => _QuickStartSheetState();
}

class _QuickStartSheetState extends State<_QuickStartSheet> {
  int?   _quadId;
  int?   _duration;
  int?   _price;
  String _name = '', _phone = '', _mpesa = '';
  bool   _loading = false;

  @override
  Widget build(BuildContext context) {
    final available = context.watch<AppProvider>().quads
        .where((q) => q.status == 'available').toList();

    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: kBg, borderRadius: BorderRadius.circular(24)),
      padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          top: 16, left: 20, right: 20),
      child: Column(mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 36, height: 4,
            decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 12),
        const Text('⚡ Quick Start', style: TextStyle(
            fontFamily: 'Playfair', fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),

        // Quad picker
        DropdownButtonFormField<int>(
          decoration: const InputDecoration(labelText: 'Select Quad'),
          value: _quadId,
          items: available.map((q) => DropdownMenuItem(value: q.id, child: Text(q.name))).toList(),
          onChanged: (v) => setState(() => _quadId = v),
        ),
        const SizedBox(height: 12),

        // Duration grid
        Wrap(spacing: 8, runSpacing: 8, children: kPricing.map((p) {
          final sel = _duration == p['duration'];
          return GestureDetector(
            onTap: () => setState(() { _duration = p['duration'] as int; _price = p['price'] as int; }),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: sel ? kText : kBg2,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: sel ? kAccent : kBorder),
              ),
              child: Column(children: [
                Text(p['label'] as String, style: TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 12,
                    color: sel ? kAccent2 : kText)),
                Text('${(p['price'] as int).kes}', style: TextStyle(
                    fontSize: 10, color: sel ? Colors.white54 : kMuted)),
              ]),
            ),
          );
        }).toList()),
        const SizedBox(height: 12),

        TextFormField(
          decoration: const InputDecoration(labelText: 'Customer Name',
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
        const SizedBox(height: 12),
        TextFormField(
          decoration: const InputDecoration(labelText: 'M-Pesa Ref (optional)',
              prefixIcon: Icon(Icons.confirmation_number_outlined, size: 18)),
          textCapitalization: TextCapitalization.characters,
          onChanged: (v) => _mpesa = v,
        ),
        const SizedBox(height: 16),

        PrimaryButton(
          label: 'Start Ride',
          icon: Icons.play_arrow_rounded,
          color: kGreen,
          loading: _loading,
          onTap: () async {
            if (_quadId == null || _duration == null || _name.isEmpty || _phone.isEmpty) {
              showToast(context, 'Fill all required fields', error: true); return;
            }
            setState(() => _loading = true);
            try {
              final b = await context.read<AppProvider>().createBooking(
                quadId: _quadId!, customerName: _name, customerPhone: _phone,
                duration: _duration!, price: _price!,
                mpesaRef: _mpesa.trim().isEmpty ? null : _mpesa.trim().toUpperCase(),
              );
              if (!context.mounted) return;
              Navigator.pop(context);
              context.push('/ride/${b.id}');
            } catch (e) {
              if (context.mounted)
                showToast(context, e.toString().replaceFirst('Exception: ', ''), error: true);
              setState(() => _loading = false);
            }
          },
        ),
        const SizedBox(height: 8),
      ]),
    );
  }
}

// ── Daily Report Sheet ──────────────────────────────────────────────────────────
class _DailyReportSheet extends StatefulWidget {
  const _DailyReportSheet();
  @override State<_DailyReportSheet> createState() => _DailyReportSheetState();
}

class _DailyReportSheetState extends State<_DailyReportSheet> {
  DateTime _date = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final all = StorageService.getHistory();
    final dayStart = DateTime(_date.year, _date.month, _date.day);
    final dayEnd   = dayStart.add(const Duration(days: 1));
    final rides = all.where((b) => !b.startTime.isBefore(dayStart) && b.startTime.isBefore(dayEnd)).toList();

    final total   = rides.fold(0, (s, b) => s + b.totalPaid);
    final overtime = rides.fold(0, (s, b) => s + b.overtimeCharge);
    final avg     = rides.isEmpty ? 0 : total ~/ rides.length;

    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: kBg, borderRadius: BorderRadius.circular(24)),
      padding: const EdgeInsets.all(20),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Center(child: Container(width: 36, height: 4,
            decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 12),
        Row(children: [
          const Text('📊 Daily Report', style: TextStyle(
              fontFamily: 'Playfair', fontSize: 18, fontWeight: FontWeight.w700)),
          const Spacer(),
          TextButton.icon(
            icon: const Icon(Icons.calendar_today_rounded, size: 16),
            label: Text('${_date.day}/${_date.month}/${_date.year}'),
            onPressed: () async {
              final d = await showDatePicker(
                context: context, initialDate: _date,
                firstDate: DateTime(2024), lastDate: DateTime.now(),
              );
              if (d != null) setState(() => _date = d);
            },
          ),
        ]),
        const SizedBox(height: 12),

        // Stats
        GridView.count(
          crossAxisCount: 2, shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 2.2,
          children: [
            _MiniStat('Rides', '${rides.length}', kAccent),
            _MiniStat('Revenue', '${total.kes} KES', kGreen),
            _MiniStat('Overtime', '${overtime.kes} KES', kRed),
            _MiniStat('Avg/Ride', '${avg.kes} KES', kIndigo),
          ],
        ),
        const SizedBox(height: 12),

        if (rides.isNotEmpty) ...[
          const Divider(color: kBorder),
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 200),
            child: ListView(children: rides.map((b) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(children: [
                Expanded(child: Text('${b.customerName} · ${b.quadName}',
                    style: const TextStyle(fontSize: 12))),
                Text('${b.totalPaid.kes} KES',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: kAccent)),
              ]),
            )).toList()),
          ),
        ],

        const SizedBox(height: 8),
      ]),
    );
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _StatCard(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) => AppCard(
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(icon, color: color, size: 18),
        const Spacer(),
      ]),
      const SizedBox(height: 6),
      Text(value, style: const TextStyle(
          fontFamily: 'Playfair', fontSize: 18, fontWeight: FontWeight.w700)),
      Text(label, style: const TextStyle(color: kMuted, fontSize: 11)),
    ]),
  );
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ActionBtn({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: color.withAlpha(15), borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withAlpha(50)),
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 8),
        Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13)),
      ]),
    ),
  );
}

class _MiniStat extends StatelessWidget {
  final String label, value;
  final Color color;
  const _MiniStat(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(
      color: color.withAlpha(12), borderRadius: BorderRadius.circular(10),
      border: Border.all(color: color.withAlpha(30)),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(value, style: TextStyle(
          fontWeight: FontWeight.w700, fontSize: 14, color: color)),
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

class _PinScreenState extends State<_PinScreen> {
  String _pin = '';

  void _tap(String d) {
    if (_pin.length >= 4) return;
    setState(() => _pin += d);
    if (_pin.length == 4) {
      Future.delayed(const Duration(milliseconds: 200), () {
        widget.onVerify(_pin);
        if (mounted) setState(() => _pin = '');
      });
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(colors: [kHeroFrom, kHeroTo],
            begin: Alignment.topLeft, end: Alignment.bottomRight)),
      child: SafeArea(child: Column(children: [
        const Spacer(),
        CircleAvatar(radius: 40,
            backgroundImage: const AssetImage('assets/images/logo.png'),
            backgroundColor: Colors.transparent),
        const SizedBox(height: 16),
        const Text('Admin Access', style: TextStyle(fontFamily: 'Playfair',
            fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white)),
        const Text('Enter your PIN', style: TextStyle(color: Colors.white38)),
        const SizedBox(height: 32),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(4, (i) =>
          Container(margin: const EdgeInsets.symmetric(horizontal: 8),
            width: 16, height: 16,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: i < _pin.length ? kAccent : Colors.white12,
            )),
        )),
        const Spacer(),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 48),
          child: GridView.count(
            shrinkWrap: true, crossAxisCount: 3,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 16, mainAxisSpacing: 16, childAspectRatio: 1.5,
            children: [
              ...'123456789'.split('').map((d) => _PinBtn(label: d, onTap: () => _tap(d))),
              const SizedBox.shrink(),
              _PinBtn(label: '0', onTap: () => _tap('0')),
              _PinBtn(icon: Icons.backspace_outlined, onTap: () {
                if (_pin.isNotEmpty) setState(() => _pin = _pin.substring(0, _pin.length - 1));
              }),
            ],
          ),
        ),
        const SizedBox(height: 32),
        TextButton(
          onPressed: () => context.go('/'),
          child: const Text('← Back to App', style: TextStyle(color: Colors.white38)),
        ),
        const SizedBox(height: 24),
      ])),
    ),
  );
}

class _PinBtn extends StatelessWidget {
  final String? label;
  final IconData? icon;
  final VoidCallback onTap;
  const _PinBtn({this.label, this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(10), borderRadius: BorderRadius.circular(12)),
      child: Center(child: label != null
          ? Text(label!, style: const TextStyle(
              color: Colors.white, fontSize: 22, fontWeight: FontWeight.w600))
          : Icon(icon, color: Colors.white54, size: 20)),
    ),
  );
}
