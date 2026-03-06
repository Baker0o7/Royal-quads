import '../../models/models.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../services/storage.dart';
import '../../theme/theme.dart';

class AdminFleetTab extends StatefulWidget {
  const AdminFleetTab({super.key});
  @override State<AdminFleetTab> createState() => _AdminFleetTabState();
}

class _AdminFleetTabState extends State<AdminFleetTab> {
  @override
  Widget build(BuildContext context) {
    final quads = context.watch<AppProvider>().quads;
    final avail = quads.where((q) => q.status == 'available').length;
    final rented = quads.where((q) => q.status == 'rented').length;
    final maint  = quads.where((q) => q.status == 'maintenance').length;

    return RefreshIndicator(
      color: kAccent,
      onRefresh: () => context.read<AppProvider>().refreshQuads(),
      child: CustomScrollView(slivers: [
        // Fleet summary bar
        SliverToBoxAdapter(child: Container(
          margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: kHeroGradient,
            borderRadius: BorderRadius.circular(18)),
          child: Row(children: [
            _FleetStat('Total', '${quads.length}', Colors.white),
            _FleetStat('Available', '$avail', kGreen),
            _FleetStat('Rented', '$rented', kAccent),
            _FleetStat('Service', '$maint', kRed),
          ]),
        )),

        // Add button
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: GestureDetector(
            onTap: () => _addQuad(context),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: kAccent.withAlpha(10),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                    color: kAccent.withAlpha(50), style: BorderStyle.solid),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_circle_rounded, color: kAccent, size: 20),
                  SizedBox(width: 8),
                  Text('Add New Quad', style: TextStyle(
                      color: kAccent, fontWeight: FontWeight.w700)),
                ]),
            ),
          ),
        )),

        if (quads.isEmpty)
          SliverFillRemaining(child: Center(child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.directions_bike_outlined,
                  size: 64, color: kBorder),
              const SizedBox(height: 16),
              const Text('No quads in fleet',
                  style: TextStyle(color: kMuted, fontSize: 16)),
              const SizedBox(height: 8),
              TextButton(
                  onPressed: () => _addQuad(context),
                  child: const Text('Add your first quad')),
            ],
          )))
        else
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            sliver: SliverList(delegate: SliverChildBuilderDelegate(
              (ctx, i) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _QuadTile(
                  quad: quads[i],
                  onEdit:   () => _editQuad(context, quads[i]),
                  onStatus: () => _cycleStatus(context, quads[i]),
                  onDelete: () => _deleteQuad(context, quads[i]),
                ),
              ),
              childCount: quads.length,
            )),
          ),
      ]),
    );
  }

  void _addQuad(BuildContext context) {
    String name = '', imei = '';
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Add Quad', style: TextStyle(
          fontFamily: 'Playfair', fontWeight: FontWeight.w700)),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextFormField(decoration: const InputDecoration(
            labelText: 'Quad Name',
            hintText: 'e.g. Raptor 1',
            prefixIcon: Icon(Icons.directions_bike_rounded, size: 18)),
            textCapitalization: TextCapitalization.words,
            onChanged: (v) => name = v),
        const SizedBox(height: 12),
        TextFormField(decoration: const InputDecoration(
            labelText: 'IMEI / Serial (optional)',
            prefixIcon: Icon(Icons.numbers_rounded, size: 18)),
            onChanged: (v) => imei = v),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context),
            child: const Text('Cancel')),
        ElevatedButton(onPressed: () async {
          if (name.trim().isEmpty) return;
          await context.read<AppProvider>().addQuad(
              name.trim(), imei: imei.trim().isEmpty ? null : imei.trim());
          if (context.mounted) Navigator.pop(context);
        }, child: const Text('Add')),
      ],
    ));
  }

  void _editQuad(BuildContext context, Quad quad) {
    String name = quad.name, imei = quad.imei ?? '';
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Edit Quad', style: TextStyle(
          fontFamily: 'Playfair', fontWeight: FontWeight.w700)),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextFormField(
          initialValue: name,
          decoration: const InputDecoration(
              labelText: 'Quad Name',
              prefixIcon: Icon(Icons.directions_bike_rounded, size: 18)),
          textCapitalization: TextCapitalization.words,
          onChanged: (v) => name = v),
        const SizedBox(height: 12),
        TextFormField(
          initialValue: imei,
          decoration: const InputDecoration(
              labelText: 'IMEI / Serial',
              prefixIcon: Icon(Icons.numbers_rounded, size: 18)),
          onChanged: (v) => imei = v),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context),
            child: const Text('Cancel')),
        ElevatedButton(onPressed: () async {
          await context.read<AppProvider>().updateQuad(
              quad.id, name: name.trim(),
              imei: imei.trim().isEmpty ? null : imei.trim());
          if (context.mounted) Navigator.pop(context);
        }, child: const Text('Save')),
      ],
    ));
  }

  void _cycleStatus(BuildContext context, Quad quad) {
    if (quad.status == 'rented') {
      showToast(context, 'Cannot change status of a rented quad', error: true);
      return;
    }
    final next = quad.status == 'available' ? 'maintenance' : 'available';
    context.read<AppProvider>().updateQuad(quad.id, status: next);
    showToast(context,
        '${quad.name} → ${next == 'maintenance' ? 'In Maintenance' : 'Available'}');
  }

  void _deleteQuad(BuildContext context, Quad quad) {
    if (quad.status == 'rented') {
      showToast(context, 'Cannot delete a rented quad', error: true); return;
    }
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete Quad'),
      content: Text('Remove ${quad.name} from the fleet?'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context),
            child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: kRed),
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

class _QuadTile extends StatelessWidget {
  final Quad quad;
  final VoidCallback onEdit, onStatus, onDelete;
  const _QuadTile({required this.quad, required this.onEdit,
      required this.onStatus, required this.onDelete});

  Color get _statusColor => switch (quad.status) {
    'available'   => kGreen,
    'rented'      => kAccent,
    'maintenance' => kRed,
    _ => kMuted,
  };

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: kCard,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: _statusColor.withAlpha(30)),
      boxShadow: kShadowSm,
    ),
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        // Icon
        Container(
          width: 50, height: 50,
          decoration: BoxDecoration(
            color: _statusColor.withAlpha(12),
            borderRadius: BorderRadius.circular(14)),
          child: Icon(Icons.directions_bike_rounded,
              color: _statusColor, size: 24)),
        const SizedBox(width: 12),
        // Info
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(quad.name, style: const TextStyle(
                fontWeight: FontWeight.w800, fontSize: 15)),
            const SizedBox(height: 4),
            StatusBadge(quad.status),
            if (quad.imei != null) Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text('SN: ${quad.imei}',
                  style: const TextStyle(
                      color: kMuted, fontSize: 10,
                      fontFamily: 'monospace'))),
          ],
        )),
        // Actions
        Column(mainAxisSize: MainAxisSize.min, children: [
          _Chip(Icons.edit_outlined, kIndigo, onEdit),
          const SizedBox(height: 6),
          _Chip(
            quad.status == 'available'
                ? Icons.build_outlined : Icons.check_circle_outline_rounded,
            quad.status == 'available' ? kOrange : kGreen,
            onStatus),
          const SizedBox(height: 6),
          _Chip(Icons.delete_outline_rounded, kRed, onDelete),
        ]),
      ]),
    ),
  );
}

class _Chip extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _Chip(this.icon, this.color, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 32, height: 32,
      decoration: BoxDecoration(
          color: color.withAlpha(12),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withAlpha(30))),
      child: Icon(icon, color: color, size: 15)),
  );
}

class _FleetStat extends StatelessWidget {
  final String label, value;
  final Color color;
  const _FleetStat(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Column(children: [
    Text(value, style: TextStyle(
        fontFamily: 'Playfair', fontSize: 20,
        fontWeight: FontWeight.w900, color: color)),
    Text(label, style: const TextStyle(
        color: Colors.white30, fontSize: 10)),
  ]));
}
