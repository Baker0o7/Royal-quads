import '../../models/models.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../services/storage.dart';
import '../../theme/theme.dart';

class AdminToolsTab extends StatefulWidget {
  const AdminToolsTab({super.key});
  @override State<AdminToolsTab> createState() => _AdminToolsTabState();
}

class _AdminToolsTabState extends State<AdminToolsTab> {
  @override
  Widget build(BuildContext context) {
    final promos = StorageService.getPromotions();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        SectionHeading('Promo Codes', icon: Icons.local_offer_rounded),
        AppCard(child: Column(children: [
          ...promos.map((p) => ListTile(
            dense: true,
            title: Text(p.code, style: const TextStyle(fontWeight: FontWeight.w700, fontFamily: 'monospace')),
            subtitle: Text('${p.discountPercentage}% off'),
            trailing: Switch(
              value: p.isActive, activeColor: kGreen,
              onChanged: (v) async {
                final updated = promos.map((x) => x.id == p.id ? x.copyWith(isActive: v) : x).toList();
                await StorageService.savePromotions(updated);
                setState(() {});
              },
            ),
          )),
          TextButton.icon(
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text('Add Promo Code'),
            onPressed: () => _addPromo(context),
          ),
        ])),

        const SizedBox(height: 16),
        SectionHeading('Admin PIN', icon: Icons.lock_rounded),
        AppCard(child: Column(children: [
          Text('Current PIN: ${StorageService.getAdminPin()}',
              style: const TextStyle(fontFamily: 'monospace', fontSize: 16)),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => _changePin(context),
            child: const Text('Change PIN'),
          ),
        ])),

        const SizedBox(height: 16),
        SectionHeading('Staff', icon: Icons.people_rounded),
        _StaffPanel(),

        const SizedBox(height: 16),
        SectionHeading('Maintenance', icon: Icons.build_rounded),
        _MaintenancePanel(),

        const SizedBox(height: 40),
      ]),
    );
  }

  void _addPromo(BuildContext context) {
    String code = ''; int pct = 10;
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Add Promo Code'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextFormField(decoration: const InputDecoration(labelText: 'Code'),
            textCapitalization: TextCapitalization.characters,
            onChanged: (v) => code = v),
        const SizedBox(height: 12),
        TextFormField(decoration: const InputDecoration(labelText: 'Discount %'),
            keyboardType: TextInputType.number,
            onChanged: (v) => pct = int.tryParse(v) ?? 10),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(onPressed: () async {
          if (code.trim().isEmpty) return;
          final promos = StorageService.getPromotions();
          final newPromo = Promotion(
            id: promos.isEmpty ? 1 : promos.last.id + 1,
            code: code.trim().toUpperCase(),
            discountPercentage: pct.clamp(1, 100),
            isActive: true,
          );
          await StorageService.savePromotions([...promos, newPromo]);
          if (context.mounted) { Navigator.pop(context); setState(() {}); }
        }, child: const Text('Add')),
      ],
    ));
  }

  void _changePin(BuildContext context) {
    String pin = '';
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Change Admin PIN'),
      content: TextFormField(
        decoration: const InputDecoration(labelText: 'New 4-digit PIN'),
        keyboardType: TextInputType.number, maxLength: 4,
        onChanged: (v) => pin = v,
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(onPressed: () async {
          if (pin.length == 4) {
            await StorageService.setAdminPin(pin);
            if (context.mounted) { Navigator.pop(context); setState(() {}); }
          }
        }, child: const Text('Save')),
      ],
    ));
  }
}

class _StaffPanel extends StatefulWidget {
  @override State<_StaffPanel> createState() => _StaffPanelState();
}

class _StaffPanelState extends State<_StaffPanel> {
  @override
  Widget build(BuildContext context) {
    final staff = StorageService.getStaff();
    return AppCard(child: Column(children: [
      ...staff.map((s) => ListTile(dense: true,
        leading: CircleAvatar(radius: 16, backgroundColor: kAccent.withAlpha(20),
            child: Text(s.name[0], style: const TextStyle(color: kAccent, fontWeight: FontWeight.w700))),
        title: Text(s.name),
        subtitle: Text('${s.role} · ${s.phone}', style: const TextStyle(fontSize: 11)),
        trailing: Switch(value: s.isActive, activeColor: kGreen,
          onChanged: (v) async {
            final all = staff.map((x) => x.id == s.id ? x.copyWith(isActive: v) : x).toList();
            await StorageService.saveStaff(all);
            setState(() {});
          }),
      )),
      TextButton.icon(
        icon: const Icon(Icons.person_add_rounded, size: 18),
        label: const Text('Add Staff'),
        onPressed: () => _add(context, staff),
      ),
    ]));
  }

  void _add(BuildContext context, List<Staff> existing) {
    String name = '', phone = '', pin = '';
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Add Staff'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextFormField(decoration: const InputDecoration(labelText: 'Name'), onChanged: (v) => name = v),
        const SizedBox(height: 8),
        TextFormField(decoration: const InputDecoration(labelText: 'Phone'),
            keyboardType: TextInputType.phone, onChanged: (v) => phone = v),
        const SizedBox(height: 8),
        TextFormField(decoration: const InputDecoration(labelText: 'PIN'),
            keyboardType: TextInputType.number, maxLength: 4, onChanged: (v) => pin = v),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(onPressed: () async {
          if (name.trim().isEmpty || pin.length < 4) return;
          final s = Staff(id: existing.isEmpty ? 1 : existing.last.id + 1,
              name: name.trim(), phone: phone.trim(), pin: pin, role: 'operator', isActive: true);
          await StorageService.saveStaff([...existing, s]);
          if (context.mounted) { Navigator.pop(context); setState(() {}); }
        }, child: const Text('Add')),
      ],
    ));
  }
}

class _MaintenancePanel extends StatefulWidget {
  @override State<_MaintenancePanel> createState() => _MaintenancePanelState();
}

class _MaintenancePanelState extends State<_MaintenancePanel> {
  @override
  Widget build(BuildContext context) {
    final logs = StorageService.getMaintenance().reversed.take(10).toList();
    return AppCard(child: Column(children: [
      if (logs.isEmpty)
        const Padding(padding: EdgeInsets.all(16),
          child: Text('No maintenance logs', style: TextStyle(color: kMuted))),
      ...logs.map((l) => ListTile(dense: true,
        leading: const Icon(Icons.build_rounded, color: kAccent, size: 18),
        title: Text('${l.quadName} — ${l.type}'),
        subtitle: Text(l.description, style: const TextStyle(fontSize: 11)),
        trailing: Text('${l.cost.kes} KES', style: const TextStyle(
            color: kAccent, fontWeight: FontWeight.w600, fontSize: 12)),
      )),
      TextButton.icon(
        icon: const Icon(Icons.add_rounded, size: 18),
        label: const Text('Log Maintenance'),
        onPressed: () => _add(context),
      ),
    ]));
  }

  void _add(BuildContext context) {
    final quads = StorageService.getQuads();
    int? quadId; String type = 'service', desc = ''; int cost = 0;
    showDialog(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Log Maintenance'),
      content: StatefulBuilder(builder: (ctx, setS) => Column(mainAxisSize: MainAxisSize.min, children: [
        DropdownButtonFormField<int>(
          decoration: const InputDecoration(labelText: 'Quad'),
          items: quads.map((q) => DropdownMenuItem(value: q.id, child: Text(q.name))).toList(),
          onChanged: (v) => quadId = v,
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          decoration: const InputDecoration(labelText: 'Type'),
          value: type,
          items: ['service','fuel','repair','inspection'].map((t) =>
              DropdownMenuItem(value: t, child: Text(t))).toList(),
          onChanged: (v) { if (v != null) setS(() => type = v); },
        ),
        const SizedBox(height: 8),
        TextFormField(decoration: const InputDecoration(labelText: 'Description'),
            onChanged: (v) => desc = v),
        const SizedBox(height: 8),
        TextFormField(decoration: const InputDecoration(labelText: 'Cost (KES)'),
            keyboardType: TextInputType.number,
            onChanged: (v) => cost = int.tryParse(v) ?? 0),
      ])),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(onPressed: () async {
          if (quadId == null || desc.trim().isEmpty) return;
          final quad = quads.firstWhere((q) => q.id == quadId);
          final log = MaintenanceLog(
            id: DateTime.now().millisecondsSinceEpoch,
            quadId: quadId!, quadName: quad.name, type: type,
            description: desc.trim(), cost: cost, date: DateTime.now(),
          );
          final logs = StorageService.getMaintenance();
          await StorageService.saveMaintenance([...logs, log]);
          if (context.mounted) { Navigator.pop(context); setState(() {}); }
        }, child: const Text('Save')),
      ],
    ));
  }
}
