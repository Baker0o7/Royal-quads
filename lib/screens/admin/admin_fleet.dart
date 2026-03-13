import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../services/storage.dart';
import '../../theme/theme.dart';

class AdminFleetTab extends StatefulWidget {
  const AdminFleetTab({super.key});
  @override State<AdminFleetTab> createState() => _AdminFleetTabState();
}

class _AdminFleetTabState extends State<AdminFleetTab> {
  String _filter = 'all'; // all | available | rented | maintenance

  @override
  Widget build(BuildContext context) {
    final allQuads = context.watch<AppProvider>().quads;
    final quads = _filter == 'all'
        ? allQuads
        : allQuads.where((q) => q.status == _filter).toList();

    final avail  = allQuads.where((q) => q.status == 'available').length;
    final rented = allQuads.where((q) => q.status == 'rented').length;
    final maint  = allQuads.where((q) => q.status == 'maintenance').length;

    return RefreshIndicator(
      color: kAccent,
      onRefresh: () => context.read<AppProvider>().refreshQuads(),
      child: CustomScrollView(slivers: [

        // ── Fleet stats bar ─────────────────────────────────────────────
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: HeroCard(
            padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 20),
            child: Row(children: [
              _FleetStat('Total',     '${allQuads.length}', Colors.white70),
              _FleetDivider(),
              _FleetStat('Available', '$avail',  kGreen),
              _FleetDivider(),
              _FleetStat('On Track',  '$rented', kAccent),
              _FleetDivider(),
              _FleetStat('Service',   '$maint',  kRed),
            ]),
          ),
        )),

        // ── Filter chips ────────────────────────────────────────────────
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              _FilterChip('All',         'all',         kAccent,      kAccent),
              _FilterChip('Available',   'available',   kGreen,       kGreen),
              _FilterChip('On Track',    'rented',      kAccent,      kAccent),
              _FilterChip('Maintenance', 'maintenance', kRed,         kRed),
            ].map((c) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _buildChip(c),
            )).toList()),
          ),
        )),

        // ── Add button ──────────────────────────────────────────────────
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
          child: GestureDetector(
            onTap: () => _addQuad(context),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: kAccent.withAlpha(8),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                    color: kAccent.withAlpha(40),
                    style: BorderStyle.solid),
              ),
              child: Row(mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                Icon(Icons.add_circle_rounded, color: kAccent, size: 18),
                SizedBox(width: 8),
                Text('Add New Quad', style: TextStyle(
                    color: kAccent, fontWeight: FontWeight.w700, fontSize: 14)),
              ]),
            ),
          ),
        )),

        // ── Empty state ──────────────────────────────────────────────────
        if (quads.isEmpty)
          SliverFillRemaining(child: Center(child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  color: kAccent.withAlpha(10),
                  shape: BoxShape.circle,
                  border: Border.all(color: kAccent.withAlpha(30)),
                ),
                child: const Icon(Icons.directions_bike_outlined,
                    size: 36, color: kAccent)),
              const SizedBox(height: 16),
              Text(
                allQuads.isEmpty ? 'No quads in fleet' : 'No $_filter quads',
                style: const TextStyle(
                    fontFamily: 'Playfair', fontSize: 17,
                    fontWeight: FontWeight.w700, color: kText)),
              const SizedBox(height: 6),
              Text(
                allQuads.isEmpty
                    ? 'Tap "Add New Quad" to get started'
                    : 'Try a different filter',
                style: const TextStyle(color: kMuted, fontSize: 13)),
            ],
          )))

        // ── Quad list ────────────────────────────────────────────────────
        else
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            sliver: SliverList(delegate: SliverChildBuilderDelegate(
              (ctx, i) {
                final q = quads[i];
                final rides = StorageService.getHistory()
                    .where((b) => b.quadId == q.id).length;
                final revenue = StorageService.getHistory()
                    .where((b) => b.quadId == q.id)
                    .fold(0, (s, b) => s + b.totalPaid);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _QuadCard(
                    quad: q,
                    totalRides: rides,
                    totalRevenue: revenue,
                    onEdit:   () => _editQuad(context, q),
                    onStatus: () => _cycleStatus(context, q),
                    onDelete: () => _deleteQuad(context, q),
                  ),
                );
              },
              childCount: quads.length,
            )),
          ),
      ]),
    );
  }

  // ignore: unused_element
  static const _chips = <({String label, String value, Color? color, Color accent})>[];

  Widget _buildChip(_FilterChip c) {
    final active = _filter == c.value;
    return GestureDetector(
      onTap: () => setState(() => _filter = c.value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: active ? c.accent : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: active ? c.accent : kBorder,
              width: active ? 0 : 1),
          boxShadow: active ? kShadowSm : null,
        ),
        child: Text(c.label, style: TextStyle(
            color: active ? Colors.white : kMuted,
            fontWeight: active ? FontWeight.w700 : FontWeight.w500,
            fontSize: 13)),
      ),
    );
  }

  void _addQuad(BuildContext context) {
    String name = '', imei = '';
    showDialog(context: context, builder: (_) => _QuadDialog(
      title: 'Add New Quad',
      icon: Icons.add_circle_rounded,
      color: kAccent,
      initialName: '',
      initialImei: '',
      onConfirm: (n, im) async {
        if (n.trim().isEmpty) return false;
        await context.read<AppProvider>().addQuad(
            n.trim(), imei: im.trim().isEmpty ? null : im.trim());
        return true;
      },
    ));
  }

  void _editQuad(BuildContext context, Quad quad) {
    showDialog(context: context, builder: (_) => _QuadDialog(
      title: 'Edit ${quad.name}',
      icon: Icons.edit_rounded,
      color: kIndigo,
      initialName: quad.name,
      initialImei: quad.imei ?? '',
      onConfirm: (n, im) async {
        await context.read<AppProvider>().updateQuad(
            quad.id, name: n.trim(),
            imei: im.trim().isEmpty ? null : im.trim());
        return true;
      },
    ));
  }

  void _cycleStatus(BuildContext context, Quad quad) {
    if (quad.status == 'rented') {
      showToast(context, 'Cannot change status of an active ride', error: true);
      return;
    }
    final next = quad.status == 'available' ? 'maintenance' : 'available';
    context.read<AppProvider>().updateQuad(quad.id, status: next);
    showToast(context,
        '${quad.name} → ${next == 'maintenance' ? '🔧 In Maintenance' : '✅ Available'}');
  }

  void _deleteQuad(BuildContext context, Quad quad) {
    if (quad.status == 'rented') {
      showToast(context, 'Cannot delete an active ride quad', error: true);
      return;
    }
    showDialog(context: context, builder: (_) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(children: [
        Container(width: 32, height: 32,
            decoration: BoxDecoration(
                color: kRed.withAlpha(15),
                borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.delete_outline_rounded,
                color: kRed, size: 18)),
        const SizedBox(width: 10),
        const Text('Delete Quad', style: TextStyle(
            fontFamily: 'Playfair', fontWeight: FontWeight.w700)),
      ]),
      content: RichText(text: TextSpan(
        style: const TextStyle(color: kText, fontSize: 14, height: 1.5),
        children: [
          const TextSpan(text: 'Remove '),
          TextSpan(text: quad.name,
              style: const TextStyle(fontWeight: FontWeight.w700)),
          const TextSpan(text: ' from the fleet?\n'),
          const TextSpan(text: 'This cannot be undone.',
              style: TextStyle(color: kMuted, fontSize: 12)),
        ],
      )),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context),
            child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
              backgroundColor: kRed, foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10))),
          onPressed: () async {
            final quads = StorageService.getQuads()
                .where((q) => q.id != quad.id).toList();
            await StorageService.saveQuads(quads);
            if (context.mounted) {
              Navigator.pop(context);
              context.read<AppProvider>().refreshQuads();
            }
          },
          child: const Text('Delete'),
        ),
      ],
    ));
  }
}

// ── Add/Edit dialog ───────────────────────────────────────────────────────────
class _QuadDialog extends StatefulWidget {
  final String title, initialName, initialImei;
  final IconData icon; final Color color;
  final Future<bool> Function(String name, String imei) onConfirm;
  const _QuadDialog({required this.title, required this.icon,
      required this.color, required this.initialName, required this.initialImei,
      required this.onConfirm});
  @override State<_QuadDialog> createState() => _QuadDialogState();
}

class _QuadDialogState extends State<_QuadDialog> {
  late TextEditingController _nameCtrl;
  late TextEditingController _imeiCtrl;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.initialName);
    _imeiCtrl = TextEditingController(text: widget.initialImei);
  }

  @override
  void dispose() { _nameCtrl.dispose(); _imeiCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Dialog(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      // Header
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: widget.color.withAlpha(8),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(bottom: BorderSide(color: widget.color.withAlpha(30))),
        ),
        child: Row(children: [
          Container(width: 36, height: 36,
              decoration: BoxDecoration(
                  color: widget.color.withAlpha(18),
                  borderRadius: BorderRadius.circular(10)),
              child: Icon(widget.icon, color: widget.color, size: 18)),
          const SizedBox(width: 10),
          Text(widget.title, style: const TextStyle(
              fontFamily: 'Playfair', fontSize: 17,
              fontWeight: FontWeight.w700)),
        ]),
      ),
      // Fields
      Padding(
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(
            controller: _nameCtrl,
            textCapitalization: TextCapitalization.words,
            autofocus: true,
            decoration: const InputDecoration(
                labelText: 'Quad Name', hintText: 'e.g. Raptor 1',
                prefixIcon: Icon(Icons.directions_bike_rounded, size: 18)),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _imeiCtrl,
            decoration: const InputDecoration(
                labelText: 'IMEI / Serial (optional)',
                prefixIcon: Icon(Icons.numbers_rounded, size: 18)),
          ),
        ]),
      ),
      // Actions
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Row(children: [
          Expanded(child: TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'))),
          const SizedBox(width: 12),
          Expanded(child: ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: widget.color, foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12))),
            onPressed: _loading ? null : () async {
              setState(() => _loading = true);
              final ok = await widget.onConfirm(
                  _nameCtrl.text, _imeiCtrl.text);
              if (ok && context.mounted) Navigator.pop(context);
              else setState(() => _loading = false);
            },
            child: _loading
                ? const SizedBox(width: 18, height: 18,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2))
                : const Text('Save', style: TextStyle(fontWeight: FontWeight.w700)),
          )),
        ]),
      ),
    ]),
  );
}

// ── Quad Card ─────────────────────────────────────────────────────────────────
class _QuadCard extends StatefulWidget {
  final Quad quad;
  final int totalRides, totalRevenue;
  final VoidCallback onEdit, onStatus, onDelete;
  const _QuadCard({required this.quad, required this.totalRides,
      required this.totalRevenue, required this.onEdit,
      required this.onStatus, required this.onDelete});
  @override State<_QuadCard> createState() => _QuadCardState();
}

class _QuadCardState extends State<_QuadCard> {
  bool _expanded = false;

  Color get _color => switch (widget.quad.status) {
    'available'   => kGreen,
    'rented'      => kAccent,
    'maintenance' => kRed,
    _ => kMuted,
  };

  @override
  Widget build(BuildContext context) => AnimatedContainer(
    duration: const Duration(milliseconds: 250),
    decoration: BoxDecoration(
      color: kCard,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: _color.withAlpha(40)),
      boxShadow: kShadowMd,
    ),
    child: Column(children: [
      // Main row
      GestureDetector(
        onTap: () => setState(() => _expanded = !_expanded),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            // Icon with status indicator
            Stack(children: [
              Container(
                width: 52, height: 52,
                decoration: BoxDecoration(
                  color: _color.withAlpha(12),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: _color.withAlpha(30)),
                ),
                child: Icon(Icons.directions_bike_rounded,
                    color: _color, size: 26)),
              Positioned(bottom: 2, right: 2,
                child: Container(
                  width: 12, height: 12,
                  decoration: BoxDecoration(
                    color: _color, shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                )),
            ]),
            const SizedBox(width: 14),
            // Info
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.quad.name, style: const TextStyle(
                    fontWeight: FontWeight.w800, fontSize: 15, color: kText)),
                const SizedBox(height: 4),
                Row(children: [
                  StatusBadge(widget.quad.status),
                  if (widget.quad.imei != null) ...[
                    const SizedBox(width: 8),
                    Text('SN: ${widget.quad.imei}',
                        style: const TextStyle(color: kMuted, fontSize: 10,
                            fontFamily: 'monospace')),
                  ],
                ]),
              ],
            )),
            // Expand chevron
            AnimatedRotation(
              turns: _expanded ? 0.5 : 0,
              duration: const Duration(milliseconds: 200),
              child: const Icon(Icons.expand_more_rounded,
                  color: kMuted, size: 20)),
          ]),
        ),
      ),

      // Expanded stats + actions
      AnimatedSize(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
        child: _expanded ? Column(children: [
          Container(
            height: 1, color: kBorder,
            margin: const EdgeInsets.symmetric(horizontal: 16)),
          // Stats row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Row(children: [
              _MiniStat(Icons.directions_bike_rounded,
                  '${widget.totalRides}', 'Total rides', kAccent),
              const SizedBox(width: 8),
              _MiniStat(Icons.payments_outlined,
                  widget.totalRevenue.kes, 'Revenue', kGreen),
            ]),
          ),
          // Action buttons
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
            child: Row(children: [
              _ActionBtn(Icons.edit_outlined, 'Edit', kIndigo, widget.onEdit),
              const SizedBox(width: 8),
              _ActionBtn(
                widget.quad.status == 'available'
                    ? Icons.build_outlined : Icons.check_circle_outline_rounded,
                widget.quad.status == 'available' ? 'Maintenance' : 'Available',
                widget.quad.status == 'available' ? kOrange : kGreen,
                widget.onStatus,
              ),
              const SizedBox(width: 8),
              _ActionBtn(Icons.delete_outline_rounded,
                  'Delete', kRed, widget.onDelete),
            ]),
          ),
        ]) : const SizedBox.shrink(),
      ),
    ]),
  );
}

class _MiniStat extends StatelessWidget {
  final IconData icon; final String value, label; final Color color;
  const _MiniStat(this.icon, this.value, this.label, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(
      color: color.withAlpha(8),
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: color.withAlpha(25)),
    ),
    child: Row(children: [
      Icon(icon, color: color, size: 14),
      const SizedBox(width: 6),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value, style: TextStyle(
            color: color, fontWeight: FontWeight.w800, fontSize: 13)),
        Text(label, style: const TextStyle(color: kMuted, fontSize: 9)),
      ]),
    ]),
  ));
}

class _ActionBtn extends StatelessWidget {
  final IconData icon; final String label;
  final Color color; final VoidCallback onTap;
  const _ActionBtn(this.icon, this.label, this.color, this.onTap);
  @override
  Widget build(BuildContext context) => Expanded(child: GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: BoxDecoration(
        color: color.withAlpha(10),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withAlpha(35)),
      ),
      child: Column(children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(height: 3),
        Text(label, style: TextStyle(
            color: color, fontSize: 10, fontWeight: FontWeight.w700)),
      ]),
    ),
  ));
}

class _FleetStat extends StatelessWidget {
  final String label, value; final Color color;
  const _FleetStat(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Column(children: [
    Text(value, style: TextStyle(
        fontFamily: 'Playfair', fontSize: 22,
        fontWeight: FontWeight.w900, color: color)),
    const SizedBox(height: 2),
    Text(label, style: const TextStyle(
        color: Colors.white30, fontSize: 10, letterSpacing: 0.3)),
  ]));
}

class _FleetDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
      width: 1, height: 32, color: Colors.white.withAlpha(15));
}

class _FilterChip {
  final String label, value; final Color color, accent;
  const _FilterChip(this.label, this.value, this.color, this.accent);
}
