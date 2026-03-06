import '../../models/models.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/theme.dart';

class AdminFleetTab extends StatefulWidget {
  const AdminFleetTab({super.key});
  @override State<AdminFleetTab> createState() => _AdminFleetTabState();
}

class _AdminFleetTabState extends State<AdminFleetTab> {
  @override
  Widget build(BuildContext context) {
    final quads = context.watch<AppProvider>().quads;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(children: [
        PrimaryButton(label: 'Add Quad', icon: Icons.add_rounded, color: kGreen,
            onTap: () => _addQuad(context)),
        const SizedBox(height: 16),
        ...quads.map((q) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: AppCard(child: Row(children: [
            Container(width: 48, height: 48,
              decoration: BoxDecoration(
                color: q.status == 'available' ? kGreen.withAlpha(20)
                    : q.status == 'rented' ? kAccent.withAlpha(20) : kRed.withAlpha(20),
                borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.directions_bike_rounded,
                color: q.status == 'available' ? kGreen
                    : q.status == 'rented' ? kAccent : kRed, size: 24)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(q.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              StatusBadge(q.status),
            ])),
            PopupMenuButton<String>(
              onSelected: (v) => _handleAction(context, q.id, v),
              itemBuilder: (_) => [
                if (q.status != 'available')
                  const PopupMenuItem(value: 'available', child: Text('Set Available')),
                if (q.status != 'maintenance')
                  const PopupMenuItem(value: 'maintenance', child: Text('Set Maintenance')),
                const PopupMenuItem(value: 'edit', child: Text('Edit')),
                const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: kRed))),
              ],
            ),
          ])),
        )),
      ]),
    );
  }

  void _addQuad(BuildContext context) {
    String name = '';
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Add Quad', style: TextStyle(fontFamily: 'Playfair')),
      content: TextFormField(
        decoration: const InputDecoration(labelText: 'Quad Name'),
        onChanged: (v) => name = v,
        autofocus: true,
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: () async {
            if (name.trim().isEmpty) return;
            await context.read<AppProvider>().addQuad(name.trim());
            if (context.mounted) Navigator.pop(context);
          },
          child: const Text('Add'),
        ),
      ],
    ));
  }

  void _handleAction(BuildContext context, int id, String action) {
    final prov = context.read<AppProvider>();
    if (action == 'available' || action == 'maintenance') {
      prov.updateQuad(id, status: action);
    } else if (action == 'edit') {
      String name = '';
      showDialog(context: context, builder: (_) => AlertDialog(
        title: const Text('Edit Quad'),
        content: TextFormField(
          decoration: const InputDecoration(labelText: 'New Name'),
          onChanged: (v) => name = v,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(onPressed: () async {
            if (name.trim().isNotEmpty) await prov.updateQuad(id, name: name.trim());
            if (context.mounted) Navigator.pop(context);
          }, child: const Text('Save')),
        ],
      ));
    }
  }
}
