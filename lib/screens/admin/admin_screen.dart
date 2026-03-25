import 'dart:async';
import 'package:fl_chart/fl_chart.dart';
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
import 'admin_analytics.dart';
import 'admin_website.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});
  @override State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  bool   _pinVerified = false;
  int    _tab = 0;
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadAll();
    });
    // Keep live-ride timers ticking
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() { _ticker?.cancel(); super.dispose(); }

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
      appBar: AppBar(
        title: const Text('Admin Dashboard',
            style: TextStyle(fontFamily: 'Playfair',
                fontSize: 18, color: Colors.white)),
        backgroundColor: heroColor(context),
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
          AdminAnalyticsTab(),
          const AdminWebsiteTab(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: heroColor(context),
          boxShadow: [BoxShadow(
              color: Colors.black.withAlpha(60),
              blurRadius: 20, offset: const Offset(0, -4))],
        ),
        child: SafeArea(top: false, child: SizedBox(height: 64,
          child: Row(children: [
            _NavItem(Icons.dashboard_rounded,     'Overview',  0, _tab, () => setState(() => _tab = 0)),
            _NavItem(null,'Fleet',1,_tab,()=>setState(()=>_tab=1),iconWidget: const SizedBox()),
            _NavItem(Icons.history_rounded,        'History',   2, _tab, () => setState(() => _tab = 2)),
            _NavItem(Icons.settings_rounded,       'Tools',     3, _tab, () => setState(() => _tab = 3)),
            _NavItem(Icons.analytics_rounded,      'Analytics', 4, _tab, () => setState(() => _tab = 4)),
            _NavItem(Icons.language_rounded,           'Website',   5, _tab, () => setState(() => _tab = 5)),
          ]),
        )),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData? icon;
  final Widget?   iconWidget;
  final String label;
  final int index, current;
  final VoidCallback onTap;
  const _NavItem(this.icon, this.label, this.index, this.current, this.onTap,
      {this.iconWidget});

  @override
  Widget build(BuildContext context) {
    final active = index == current;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(
                  horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: active
                    ? kAccent.withAlpha(25)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(24),
              ),
              child: iconWidget != null
                  ? QuadIcon(size: 22,
                      color: active ? kAccent : Colors.white38)
                  : Icon(icon!,
                      color: active ? kAccent : Colors.white38,
                      size: 22),
            ),
            const SizedBox(height: 2),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                fontSize: 9.5,
                fontWeight: active
                    ? FontWeight.w700 : FontWeight.w400,
                color: active ? kAccent : Colors.white30,
                fontFamily: 'DM Sans',
              ),
              child: Text(label),
            ),
          ],
        ),
      ),
    );
  }
}

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

          // ── Revenue strip ─────────────────────────────────────────────────
          AppCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Icon(Icons.bar_chart_rounded, color: kAccent, size: 18),
                const SizedBox(width: 8),
                Text('Revenue Overview',
                    style: TextStyle(
                        color: context.rq.muted,
                        fontSize: 12, fontWeight: FontWeight.w600,
                        letterSpacing: 0.5)),
              ]),
              const SizedBox(height: 10),
              Text('${sales['total']!.kes} KES',
                  style: TextStyle(
                      fontFamily: 'Playfair', fontSize: 32,
                      fontWeight: FontWeight.w900, color: context.rq.text)),
              Text('All-time revenue',
                  style: TextStyle(color: context.rq.muted, fontSize: 12)),
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

          // ── 7-day revenue chart ───────────────────────────────────────────
          const _WeeklyChart(),

          const SizedBox(height: 16),

          // ── 30-day line chart ─────────────────────────────────────────────
          const _MonthlyLineChart(),

          const SizedBox(height: 16),

          // ── Revenue by quad pie chart ─────────────────────────────────────
          _QuadPieChart(history: history),

          const SizedBox(height: 16),

          // ── Quick stats ───────────────────────────────────────────────────
          GridView.count(
            crossAxisCount: 2, shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.3,
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


          const SizedBox(height: 16),

          // ── Live rides ────────────────────────────────────────────────────
          SectionHeading('Live Rides', icon: Icons.local_fire_department_rounded,
            trailing: prov.active.isEmpty ? null : _LiveBadge(prov.active.length)),
          if (prov.active.isEmpty)
            AppCard(child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 28),
              child: Column(children: [
                const Text('🏜️', style: TextStyle(fontSize: 36)),
                const SizedBox(height: 8),
                Text('No active rides right now',
                    style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurface
                            .withAlpha(100))),
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


// ── 7-day Revenue Chart ───────────────────────────────────────────────────────
class _WeeklyChart extends StatefulWidget {
  const _WeeklyChart();
  @override State<_WeeklyChart> createState() => _WeeklyChartState();
}

class _WeeklyChartState extends State<_WeeklyChart>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double>   _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1000));
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic);
    _ctrl.forward();
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final now   = DateTime.now();
    final days  = List.generate(7, (i) =>
        DateTime(now.year, now.month, now.day - 6 + i));
    final all   = StorageService.getHistory();

    final revenues = days.map((d) {
      final start = d;
      final end   = d.add(const Duration(days: 1));
      return all.where((b) =>
          !b.startTime.isBefore(start) && b.startTime.isBefore(end))
          .fold(0, (s, b) => s + b.totalPaid);
    }).toList();

    final counts = days.map((d) {
      final start = d;
      final end   = d.add(const Duration(days: 1));
      return all.where((b) =>
          !b.startTime.isBefore(start) && b.startTime.isBefore(end)).length;
    }).toList();

    final maxRev = revenues.fold(0, (m, v) => v > m ? v : m);
    final total7 = revenues.fold(0, (s, v) => s + v);

    final dayLabels = days.map((d) {
      final isToday = d.day == now.day && d.month == now.month;
      const names = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      return isToday ? 'Today' : names[d.weekday - 1];
    }).toList();

    return AppCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.bar_chart_rounded, color: kAccent, size: 16),
          const SizedBox(width: 8),
          const Text('7-Day Revenue', style: TextStyle(
              fontWeight: FontWeight.w700, fontSize: 14)),
          const Spacer(),
          Text('${total7.kes} KES', style: const TextStyle(
              color: kAccent, fontWeight: FontWeight.w800, fontSize: 13)),
        ]),
        const SizedBox(height: 6),
        Text('${total7 == 0 ? 0 : (total7 / 7).round().kes} KES avg/day',
            style: TextStyle(color: context.rq.muted, fontSize: 11)),
        const SizedBox(height: 16),
        AnimatedBuilder(
          animation: _anim,
          builder: (_, __) => SizedBox(
            height: 100,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(7, (i) {
                final rev    = revenues[i];
                final cnt    = counts[i];
                final frac   = maxRev == 0 ? 0.0 : rev / maxRev;
                final barH   = (frac * 80 * _anim.value).clamp(2.0, 80.0);
                final isToday = i == 6;
                final isEmpty = rev == 0;
                return Expanded(child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      // Count badge
                      if (cnt > 0 && _anim.value > 0.8)
                        FadeTransition(
                          opacity: _anim,
                          child: Text('$cnt',
                              style: TextStyle(
                                  color: isToday ? kAccent : context.rq.muted,
                                  fontSize: 9, fontWeight: FontWeight.w700)),
                        )
                      else
                        const SizedBox(height: 12),
                      const SizedBox(height: 2),
                      // Bar
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        height: barH,
                        decoration: BoxDecoration(
                          gradient: isEmpty ? null : LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: isToday
                                ? [kAccent, kAccent2]
                                : [kAccent.withAlpha(80), kAccent.withAlpha(120)],
                          ),
                          color: isEmpty ? Theme.of(context).dividerColor.withAlpha(60) : null,
                          borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(6)),
                          boxShadow: isToday && !isEmpty ? [
                            BoxShadow(color: kAccent.withAlpha(50),
                                blurRadius: 8, offset: const Offset(0, 2)),
                          ] : null,
                        ),
                      ),
                      const SizedBox(height: 6),
                      // Day label
                      Text(dayLabels[i],
                          style: TextStyle(
                              fontSize: isToday ? 10 : 9,
                              color: isToday ? kAccent : context.rq.muted,
                              fontWeight: isToday
                                  ? FontWeight.w800 : FontWeight.w500)),
                    ],
                  ),
                ));
              }),
            ),
          ),
        ),
      ]),
    );
  }
}

class _MonthlyLineChart extends StatelessWidget {
  const _MonthlyLineChart();

  @override
  Widget build(BuildContext context) {
    final now     = DateTime.now();
    final history = StorageService.getHistory();

    // Build 30-day buckets
    final days = List.generate(30, (i) {
      final day = DateTime(now.year, now.month, now.day)
          .subtract(Duration(days: 29 - i));
      final total = history
          .where((b) =>
              b.startTime.year  == day.year  &&
              b.startTime.month == day.month &&
              b.startTime.day   == day.day)
          .fold(0, (s, b) => s + b.totalPaid);
      return FlSpot(i.toDouble(), total.toDouble());
    });

    final maxY = days.map((s) => s.y).reduce((a, b) => a > b ? a : b);
    final safeMax = maxY < 100 ? 5000.0 : maxY * 1.15;

    final muted = context.rq.muted;
    return AppCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.show_chart_rounded, color: kIndigo, size: 16),
          const SizedBox(width: 8),
          Text('30-Day Revenue',
              style: TextStyle(color: muted,
                  fontWeight: FontWeight.w700, fontSize: 13)),
        ]),
        const SizedBox(height: 16),
        SizedBox(
          height: 140,
          child: LineChart(LineChartData(
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              horizontalInterval: safeMax / 4,
              getDrawingHorizontalLine: (_) => FlLine(
                color: Colors.black.withAlpha(10),
                strokeWidth: 1,
              ),
            ),
            titlesData: FlTitlesData(
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 48,
                  interval: safeMax / 4,
                  getTitlesWidget: (v, _) => Text(
                    v >= 1000 ? '${(v / 1000).toStringAsFixed(0)}k' : v.toInt().toString(),
                    style: TextStyle(color: muted, fontSize: 9),
                  ),
                ),
              ),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  interval: 7,
                  getTitlesWidget: (v, _) {
                    final day = DateTime(now.year, now.month, now.day)
                        .subtract(Duration(days: 29 - v.toInt()));
                    return Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        '${day.day}/${day.month}',
                        style: TextStyle(color: muted, fontSize: 9),
                      ),
                    );
                  },
                ),
              ),
              rightTitles:  const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles:    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            borderData: FlBorderData(show: false),
            minX: 0, maxX: 29,
            minY: 0, maxY: safeMax,
            lineBarsData: [
              LineChartBarData(
                spots: days,
                isCurved: true,
                color: kIndigo,
                barWidth: 2.5,
                dotData: const FlDotData(show: false),
                belowBarData: BarAreaData(
                  show: true,
                  gradient: LinearGradient(
                    colors: [kIndigo.withAlpha(50), kIndigo.withAlpha(0)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
            ],
          )),
        ),
      ]),
    );
  }
}

class _QuadPieChart extends StatelessWidget {
  final List<Booking> history;
  const _QuadPieChart({required this.history});

  @override
  Widget build(BuildContext context) {
    // Revenue per quad
    final Map<String, int> byQuad = {};
    for (final b in history) {
      byQuad[b.quadName] = (byQuad[b.quadName] ?? 0) + b.totalPaid;
    }
    if (byQuad.isEmpty) return const SizedBox.shrink();

    final sorted = byQuad.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final total = sorted.fold(0, (s, e) => s + e.value);
    final colors = [kAccent, kGreen, kIndigo, kRed, kOrange,
                    const Color(0xFF06B6D4), const Color(0xFFA855F7)];

    return AppCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.pie_chart_rounded, color: kIndigo, size: 16),
          const SizedBox(width: 8),
          Text('Revenue by Quad',
              style: TextStyle(color: context.rq.muted,
                  fontWeight: FontWeight.w700, fontSize: 13)),
        ]),
        const SizedBox(height: 16),
        Row(children: [
          SizedBox(
            width: 130, height: 130,
            child: PieChart(PieChartData(
              sections: sorted.asMap().entries.map((e) {
                final pct = e.value.value / total * 100;
                return PieChartSectionData(
                  value: e.value.value.toDouble(),
                  color: colors[e.key % colors.length],
                  radius: 40,
                  title: '${pct.round()}%',
                  titleStyle: const TextStyle(
                      color: Colors.white, fontSize: 9,
                      fontWeight: FontWeight.w700),
                );
              }).toList(),
              sectionsSpace: 2,
              centerSpaceRadius: 28,
            )),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: sorted.asMap().entries.map((e) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(children: [
                Container(width: 8, height: 8,
                    decoration: BoxDecoration(
                        color: colors[e.key % colors.length],
                        shape: BoxShape.circle)),
                const SizedBox(width: 8),
                Expanded(child: Text(e.value.key,
                    style: TextStyle(color: context.rq.text,
                        fontSize: 11, fontWeight: FontWeight.w600),
                    overflow: TextOverflow.ellipsis)),
                Text('${e.value.value.kes}',
                    style: TextStyle(color: context.rq.muted, fontSize: 10,
                        fontWeight: FontWeight.w500)),
              ]),
            )).toList(),
          )),
        ]),
      ]),
    );
  }
}

class _RevPill extends StatelessWidget {
  final String label, value;
  final Color color;
  const _RevPill(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(
      color: color.withAlpha(18),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: color.withAlpha(35), width: 1.5),
      boxShadow: [BoxShadow(color: color.withAlpha(25),
          blurRadius: 8, offset: const Offset(0, 2))]),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(value, style: TextStyle(
          color: color, fontWeight: FontWeight.w800, fontSize: 14)),
      const SizedBox(height: 1),
      Text(label, style: TextStyle(
          color: context.rq.muted, fontSize: 10, fontWeight: FontWeight.w600)),
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
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textCol = isDark ? kDarkText : context.rq.text;
    final mutedCol = isDark ? kDarkMuted : context.rq.muted;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? kDarkCard : kCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
            color: color.withAlpha(isDark ? 40 : 25), width: 1.5),
        boxShadow: [
          BoxShadow(color: color.withAlpha(isDark ? 30 : 18),
              blurRadius: 18, offset: const Offset(0, 4)),
          BoxShadow(color: Colors.black.withAlpha(isDark ? 30 : 6),
              blurRadius: 6, offset: const Offset(0, 1)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Icon with glow
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: color.withAlpha(isDark ? 28 : 18),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(
                    color: color.withAlpha(isDark ? 60 : 35),
                    blurRadius: 10, spreadRadius: 0)],
              ),
              child: Icon(icon, color: color, size: 20)),
            const SizedBox(height: 10),
            // Value
            Text(value, style: TextStyle(
                fontFamily: 'Playfair', fontSize: 24,
                fontWeight: FontWeight.w900, color: textCol)),
            const SizedBox(height: 2),
            // Label row
            Row(children: [
              Text(label, style: TextStyle(
                  color: mutedCol, fontSize: 11,
                  fontWeight: FontWeight.w500)),
              Text(' · ', style: TextStyle(
                  color: mutedCol.withAlpha(100), fontSize: 11)),
              Text(sub, style: TextStyle(
                  color: color.withAlpha(isDark ? 220 : 180),
                  fontSize: 11, fontWeight: FontWeight.w600)),
            ]),
          ],
        ),
      ),
    );
  }
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
        Text(sub, style: TextStyle(
            color: context.rq.muted, fontSize: 11)),
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
          child: QuadIcon(color: overtime ? kRed : kAccent, size: 22)),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(booking.quadName,
                style: const TextStyle(fontWeight: FontWeight.w700)),
            Text('${booking.customerName} · ${booking.duration} min',
                style: TextStyle(color: context.rq.muted, fontSize: 12)),
          ],
        )),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('${booking.price.kes} KES',
              style: const TextStyle(
                  color: kAccent, fontWeight: FontWeight.w700, fontSize: 13)),
          Text(overtime ? 'OVERTIME' : '${(remaining ~/ 60)} min left',
              style: TextStyle(
                  color: overtime ? kRed : context.rq.muted,
                  fontSize: 11, fontWeight: FontWeight.w600)),
        ]),
      ]),
    );
  }
}

// ── Quick Start Sheet — unlimited quads ──────────────────────────────────────
class _QSSEntry {
  int?   quadId;
  String payMethod = 'cash'; // per-quad payment method
  final  durCtrl   = TextEditingController();
  final  priceCtrl = TextEditingController();
  void dispose() { durCtrl.dispose(); priceCtrl.dispose(); }
}

// Commission rate (20%)
const double kGuideCommission = 0.20;

class _QuickStartSheet extends StatefulWidget {
  const _QuickStartSheet();
  @override State<_QuickStartSheet> createState() => _QSSState();
}

class _QSSState extends State<_QuickStartSheet> {
  final List<_QSSEntry> _entries = [_QSSEntry()];
  final _guideCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    for (final e in _entries) e.dispose();
    _guideCtrl.dispose();
    super.dispose();
  }

  void _addEntry() => setState(() => _entries.add(_QSSEntry()));

  void _removeEntry(int i) {
    _entries[i].dispose();
    setState(() => _entries.removeAt(i));
  }

  @override
  Widget build(BuildContext context) {
    final available = context.watch<AppProvider>().quads
        .where((q) => q.status == 'available').toList();
    final usedIds = _entries.map((e) => e.quadId).whereType<int>().toSet();

    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: BorderRadius.circular(24)),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        // ── Handle ───────────────────────────────────────────────────────────
        const SizedBox(height: 12),
        Center(child: Container(width: 40, height: 4,
            decoration: BoxDecoration(
                color: kBorder, borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 16),

        // ── Header ───────────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(children: [
            Container(width: 36, height: 36,
              decoration: BoxDecoration(
                  color: kGreen, borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 20)),
            const SizedBox(width: 10),
            const Expanded(child: Text('Quick Start', style: TextStyle(
                fontFamily: 'Playfair', fontSize: 20, fontWeight: FontWeight.w700))),
            Text('${_entries.length} quad${_entries.length == 1 ? "" : "s"}',
                style: TextStyle(
                    color: kGreen, fontSize: 12, fontWeight: FontWeight.w700)),
          ]),
        ),
        const SizedBox(height: 14),

        // ── Guide name ───────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
          child: TextFormField(
            controller: _guideCtrl,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: 'Guide Name',
              hintText: 'e.g. Hassan',
              prefixIcon: const Icon(Icons.person_rounded, size: 18),
              suffixIcon: _guideCtrl.text.isNotEmpty
                ? GestureDetector(
                    onTap: () { _guideCtrl.clear(); setState(() {}); },
                    child: const Icon(Icons.close_rounded, size: 16))
                : null,
            ),
          ),
        ),

        // ── Scrollable entries ────────────────────────────────────────────────
        ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.52,
          ),
          child: ListView.separated(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
            itemCount: _entries.length,
            separatorBuilder: (_, __) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(children: [
                Expanded(child: Divider(color: kBorder)),
              ]),
            ),
            itemBuilder: (ctx, i) {
              final e = _entries[i];
              // quads available to this entry = all available minus others chosen
              final localAvail = available.where(
                  (q) => q.id == e.quadId || !usedIds.contains(q.id)).toList();
              return _EntryRow(
                entry: e,
                index: i,
                available: localAvail,
                canRemove: _entries.length > 1,
                onRemove: () => _removeEntry(i),
                onChanged: () => setState(() {}),
              );
            },
          ),
        ),

        // ── Add another ───────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 4),
          child: SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: available.length > _entries.length ? _addEntry : null,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Add Another Quad'),
              style: OutlinedButton.styleFrom(
                foregroundColor: kGreen,
                side: BorderSide(color: kGreen.withAlpha(60)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(vertical: 13),
              ),
            ),
          ),
        ),

        // ── Commission summary ────────────────────────────────────────────────
        Builder(builder: (ctx) {
          final total = _entries.fold<int>(0,
              (s, e) => s + (int.tryParse(e.priceCtrl.text.trim()) ?? 0));
          final comm  = (total * kGuideCommission).round();
          final guide = _guideCtrl.text.trim();
          if (total == 0) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: kAccent.withAlpha(12),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: kAccent.withAlpha(40)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Icon(Icons.receipt_long_rounded, size: 14, color: kAccent2),
                  const SizedBox(width: 6),
                  Text('Revenue Breakdown',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800,
                          color: context.rq.muted, letterSpacing: .4)),
                ]),
                const SizedBox(height: 10),
                _CommRow('Total charged', total.kes + ' KES', context.rq.text),
                const SizedBox(height: 6),
                _CommRow(
                  guide.isNotEmpty
                      ? 'Guide ($guide) 20%'
                      : 'Guide commission 20%',
                  comm.kes + ' KES',
                  kGreen,
                ),
                const SizedBox(height: 6),
                const Divider(height: 1),
                const SizedBox(height: 6),
                _CommRow('Business keeps',
                    (total - comm).kes + ' KES',
                    kAccent2, bold: true),
                const SizedBox(height: 8),
                ..._entries.map((e) => Padding(
                  padding: const EdgeInsets.only(top: 3),
                  child: Row(children: [
                    Icon(e.payMethod == 'cash'
                        ? Icons.payments_rounded
                        : Icons.phone_android_rounded,
                        size: 13, color: kAccent),
                    const SizedBox(width: 5),
                    Text(
                      'Quad ${_entries.indexOf(e)+1}: ${e.payMethod == 'cash' ? 'Cash' : 'M-Pesa'}',
                      style: const TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w700,
                          color: kAccent)),
                  ]),
                )).toList(),
              ]),
            ),
          );
        }),

        // ── Start all ─────────────────────────────────────────────────────────
        Padding(
          padding: EdgeInsets.fromLTRB(
              20, 8, 20, MediaQuery.of(context).viewInsets.bottom + 20),
          child: PrimaryButton(
            label: _loading
                ? 'Starting...'
                : () {
                    final total = _entries.fold<int>(0, (s, e) {
                      return s + (int.tryParse(e.priceCtrl.text.trim()) ?? 0);
                    });
                    final comm = (total * kGuideCommission).round();
                    if (total == 0) {
                      return _entries.length == 1
                          ? 'Start Ride' : 'Start ${_entries.length} Rides';
                    }
                    final guide = _guideCtrl.text.trim();
                    return '${_entries.length == 1 ? 'Start Ride' : 'Start ${_entries.length} Rides'}'
                        '  ·  ${total.kes} KES';
                  }(),
            icon: Icons.play_arrow_rounded,
            color: kGreen,
            loading: _loading,
            onTap: () async {
              // Validate all entries
              for (int i = 0; i < _entries.length; i++) {
                final e = _entries[i];
                final dur   = int.tryParse(e.durCtrl.text.trim());
                final price = int.tryParse(e.priceCtrl.text.trim());
                if (e.quadId == null || dur == null || dur <= 0 ||
                    price == null || price <= 0) {
                  showToast(context,
                      'Complete all fields for quad ${i + 1}', error: true);
                  return;
                }
              }
              setState(() => _loading = true);
              try {
                final prov = context.read<AppProvider>();
                final bookings = <int>[];
                for (final e in _entries) {
                  final b = await prov.createBooking(
                    quadId: e.quadId!,
                    customerName: 'Walk-in',
                    customerPhone: '0000000000',
                    duration: int.parse(e.durCtrl.text.trim()),
                    price: int.parse(e.priceCtrl.text.trim()),
                    mpesaRef: e.payMethod == 'mpesa' ? 'MPESA-PENDING' : 'CASH',
                    guideName: _guideCtrl.text.trim().isEmpty ? null : _guideCtrl.text.trim(),
                  );
                  bookings.add(b.id);
                }
                if (!context.mounted) return;
                Navigator.pop(context);
                // Navigate to first booking waiver; rider can handle the rest
                if (bookings.isNotEmpty) {
                  context.push('/ride/${bookings.first}');
                }
              } catch (e) {
                if (context.mounted)
                  showToast(context,
                      e.toString().replaceFirst('Exception: ', ''), error: true);
                setState(() => _loading = false);
              }
            },
          ),
        ),
      ]),
    );
  }
}

// ── Single quad entry row ──────────────────────────────────────────────────────
class _EntryRow extends StatelessWidget {
  final _QSSEntry     entry;
  final int           index;
  final List<Quad>    available;
  final bool          canRemove;
  final VoidCallback  onRemove;
  final VoidCallback  onChanged;
  const _EntryRow({
    required this.entry, required this.index,
    required this.available, required this.canRemove,
    required this.onRemove, required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(
          width: 22, height: 22,
          decoration: BoxDecoration(
              color: kGreen.withAlpha(18),
              borderRadius: BorderRadius.circular(6)),
          child: Center(child: Text('${index + 1}',
              style: const TextStyle(
                  color: kGreen, fontSize: 11, fontWeight: FontWeight.w800))),
        ),
        const SizedBox(width: 8),
        Text('Quad ${index + 1}',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        const Spacer(),
        if (canRemove)
          GestureDetector(
            onTap: onRemove,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                  color: kRed.withAlpha(10),
                  borderRadius: BorderRadius.circular(8)),
              child: Icon(Icons.close_rounded, size: 16,
                  color: kRed.withAlpha(160)),
            ),
          ),
      ]),
      const SizedBox(height: 10),

      // Quad picker
      DropdownButtonFormField<int>(
        decoration: const InputDecoration(
            isDense: true,
            labelText: 'Select Quad',
            prefixIcon: QuadIcon(size: 18, color: kAccent)),
        value: entry.quadId,
        items: available.map((q) => DropdownMenuItem(
            value: q.id, child: Text(q.name))).toList(),
        onChanged: (v) { entry.quadId = v; onChanged(); },
      ),
      const SizedBox(height: 10),

      // Duration + Amount side by side
      Row(children: [
        Expanded(child: TextFormField(
          controller: entry.durCtrl,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            isDense: true,
            labelText: 'Duration',
            prefixIcon: const Icon(Icons.timer_outlined, size: 18),
            suffixText: 'min',
            suffixStyle: TextStyle(color: context.rq.muted, fontSize: 12),
          ),
          onChanged: (_) => onChanged(),
        )),
        const SizedBox(width: 10),
        Expanded(child: TextFormField(
          controller: entry.priceCtrl,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            isDense: true,
            labelText: 'Amount',
            prefixIcon: const Icon(Icons.payments_outlined, size: 18),
            suffixText: 'KES',
            suffixStyle: TextStyle(color: context.rq.muted, fontSize: 12),
          ),
          onChanged: (_) => onChanged(),
        )),
      ]),
      const SizedBox(height: 10),
      // Per-quad payment method
      Row(children: [
        Expanded(child: _PayChip(
          label: 'Cash',
          icon: Icons.payments_rounded,
          selected: entry.payMethod == 'cash',
          onTap: () { entry.payMethod = 'cash'; onChanged(); },
        )),
        const SizedBox(width: 8),
        Expanded(child: _PayChip(
          label: 'M-Pesa',
          icon: Icons.phone_android_rounded,
          selected: entry.payMethod == 'mpesa',
          onTap: () { entry.payMethod = 'mpesa'; onChanged(); },
        )),
      ]),
    ]);
  }
}

// ── Payment method chip ────────────────────────────────────────────────────────
class _PayChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  const _PayChip({required this.label, required this.icon,
      required this.selected, required this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(vertical: 13),
      decoration: BoxDecoration(
        color: selected ? kGreen.withAlpha(18) : Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: selected ? kGreen : kBorder,
          width: selected ? 2 : 1.5,
        ),
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, size: 17,
            color: selected ? kGreen : context.rq.muted),
        const SizedBox(width: 7),
        Text(label, style: TextStyle(
            fontSize: 13, fontWeight: FontWeight.w700,
            color: selected ? kGreen : context.rq.muted)),
      ]),
    ),
  );
}

// ── Commission row helper ────────────────────────────────────────────────────────
Widget _CommRow(String label, String value, Color valueColor, {bool bold = false}) {
  return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
    Text(label, style: TextStyle(fontSize: 12, color: const Color(0xFF888888))),
    Text(value, style: TextStyle(fontSize: 12,
        fontWeight: bold ? FontWeight.w800 : FontWeight.w700,
        color: valueColor)),
  ]);
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
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: BorderRadius.circular(24)),
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
                  style: TextStyle(color: context.rq.muted)),
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
      Text(label, style: TextStyle(color: context.rq.muted, fontSize: 10)),
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
      decoration: BoxDecoration(gradient: heroGradient(context)),
      child: SafeArea(child: Column(children: [

        // Back button
        Align(
          alignment: Alignment.topLeft,
          child: Padding(
            padding: const EdgeInsets.only(left: 8, top: 4),
            child: IconButton(
              icon: Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(10),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.arrow_back_rounded,
                    color: Colors.white54, size: 18),
              ),
              onPressed: () => context.go('/'),
            ),
          ),
        ),

        const Spacer(),

        // Logo
        Container(
          width: 90, height: 90,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: kAccent.withAlpha(60), width: 2),
            boxShadow: [
              BoxShadow(color: kAccent.withAlpha(50), blurRadius: 32),
              BoxShadow(color: Colors.black.withAlpha(40), blurRadius: 16),
            ],
          ),
          padding: const EdgeInsets.all(3),
          child: const CircleAvatar(
            backgroundImage: AssetImage('assets/images/logo.png'),
            backgroundColor: Colors.transparent,
          ),
        ),
        const SizedBox(height: 20),
        const Text('Admin Access', style: TextStyle(
            fontFamily: 'Playfair', fontSize: 28,
            fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: -.5)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(8),
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: Colors.white.withAlpha(15)),
          ),
          child: const Text('🔐  ENTER YOUR 4-DIGIT PIN',
              style: TextStyle(color: Colors.white38, fontSize: 9,
                  letterSpacing: 2.5, fontWeight: FontWeight.w600)),
        ),
        const SizedBox(height: 36),

        // Dots
        AnimatedBuilder(
          animation: _shakeAnim,
          builder: (_, child) => Transform.translate(
            offset: Offset(_shakeAnim.value, 0), child: child),
          child: Row(mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(4, (i) {
              final filled = i < _pin.length;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                margin: const EdgeInsets.symmetric(horizontal: 10),
                width: filled ? 20 : 16,
                height: filled ? 20 : 16,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: filled ? kAccent : Colors.white.withAlpha(15),
                  border: Border.all(
                    color: filled ? kAccent : Colors.white.withAlpha(25),
                    width: filled ? 0 : 1.5,
                  ),
                  boxShadow: filled ? [
                    BoxShadow(color: kAccent.withAlpha(80), blurRadius: 10)
                  ] : null,
                ),
              );
            }),
          ),
        ),

        const Spacer(),

        // Numpad
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 44),
          child: Column(children: [
            ...[['1','2','3'],['4','5','6'],['7','8','9']].map((row) =>
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: row.map((d) => _PinKey(
                      label: d, onTap: () => _tap(d))).toList()),
              )),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const SizedBox(width: 74, height: 74),
              _PinKey(label: '0', onTap: () => _tap('0')),
              _PinKey(icon: Icons.backspace_outlined, onTap: _back),
            ]),
          ]),
        ),

        const SizedBox(height: 32),
      ])),
    ),
  );
}

class _PinKey extends StatefulWidget {
  final String? label;
  final IconData? icon;
  final VoidCallback onTap;
  const _PinKey({this.label, this.icon, required this.onTap});
  @override State<_PinKey> createState() => _PinKeyState();
}

class _PinKeyState extends State<_PinKey> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTapDown: (_) => setState(() => _pressed = true),
    onTapUp:   (_) { setState(() => _pressed = false); widget.onTap(); },
    onTapCancel: () => setState(() => _pressed = false),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 100),
      width: 74, height: 74,
      decoration: BoxDecoration(
        color: _pressed
            ? kAccent.withAlpha(40)
            : Colors.white.withAlpha(10),
        shape: BoxShape.circle,
        border: Border.all(
            color: _pressed
                ? kAccent.withAlpha(80)
                : Colors.white.withAlpha(15)),
        boxShadow: _pressed ? [
          BoxShadow(color: kAccent.withAlpha(30), blurRadius: 12)
        ] : null,
      ),
      child: Center(child: widget.label != null
          ? Text(widget.label!, style: TextStyle(
              color: _pressed ? kAccent : Colors.white,
              fontSize: 24, fontWeight: FontWeight.w600))
          : Icon(widget.icon,
              color: _pressed ? kAccent : Colors.white54, size: 22)),
    ),
  );
}
