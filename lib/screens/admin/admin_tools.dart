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
    final pin    = StorageService.getAdminPin();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // ── Promo codes ──────────────────────────────────────────────────────
        SectionHeading('Promo Codes', icon: Icons.local_offer_rounded,
          trailing: GestureDetector(
            onTap: () => _addPromo(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: kAccent.withAlpha(12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kAccent.withAlpha(40))),
              child: const Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.add_rounded, color: kAccent, size: 14),
                SizedBox(width: 4),
                Text('Add', style: TextStyle(
                    color: kAccent, fontSize: 12, fontWeight: FontWeight.w700)),
              ])),
          ),
        ),

        AppCard(
          padding: EdgeInsets.zero,
          child: promos.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(child: Text('No promo codes yet',
                      style: TextStyle(color: kMuted))))
              : Column(children: promos.asMap().entries.map((e) {
                  final i = e.key;
                  final p = e.value;
                  return Column(children: [
                    if (i > 0) const Divider(height: 1, color: kBorder),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      child: Row(children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: p.isActive
                                ? kGreen.withAlpha(12) : kBg2,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: p.isActive
                                    ? kGreen.withAlpha(40) : kBorder)),
                          child: Text(p.code, style: TextStyle(
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w900,
                              fontSize: 14,
                              color: p.isActive ? kGreen : kMuted))),
                        const SizedBox(width: 10),
                        Expanded(child: Text(
                            '${p.discountPercentage}% discount',
                            style: const TextStyle(
                                color: kMuted, fontSize: 13))),
                        Switch(
                          value: p.isActive, activeColor: kGreen,
                          onChanged: (v) async {
                            final updated = promos.map((x) =>
                                x.id == p.id ? x.copyWith(isActive: v) : x
                            ).toList();
                            await StorageService.savePromotions(updated);
                            setState(() {});
                          }),
                      ]),
                    ),
                  ]);
                }).toList()),
        ),

        const SizedBox(height: 20),

        // ── Admin PIN ────────────────────────────────────────────────────────
        SectionHeading('Admin PIN', icon: Icons.lock_rounded),
        AppCard(child: Row(children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: kIndigo.withAlpha(12),
              borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.lock_open_rounded,
                color: kIndigo, size: 22)),
          const SizedBox(width: 12),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Current PIN', style: TextStyle(
                  color: kMuted, fontSize: 11)),
              Text('• ' * pin.length, style: const TextStyle(
                  fontSize: 20, letterSpacing: 4, color: kText)),
            ],
          )),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: kIndigo,
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10)),
            onPressed: () => _changePin(context),
            child: const Text('Change'),
          ),
        ])),

        const SizedBox(height: 20),

        // ── Staff ────────────────────────────────────────────────────────────
        SectionHeading('Staff', icon: Icons.people_rounded),
        _StaffPanel(onChanged: () => setState(() {})),

        const SizedBox(height: 20),

        // ── Maintenance ──────────────────────────────────────────────────────
        SectionHeading('Maintenance Logs', icon: Icons.build_rounded),
        _MaintenancePanel(onChanged: () => setState(() {})),

        const SizedBox(height: 40),
      ]),
    );
  }

  void _addPromo(BuildContext context) {
    String code = ''; int pct = 10;
    showDialog(context: context, builder: (_) => _StyledDialog(
      title: 'New Promo Code',
      icon: Icons.local_offer_rounded,
      color: kAccent,
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextFormField(
          decoration: const InputDecoration(
              labelText: 'Code (e.g. DUNES20)',
              prefixIcon: Icon(Icons.confirmation_number_outlined, size: 18)),
          textCapitalization: TextCapitalization.characters,
          onChanged: (v) => code = v),
        const SizedBox(height: 12),
        TextFormField(
          initialValue: '10',
          decoration: const InputDecoration(
              labelText: 'Discount %',
              prefixIcon: Icon(Icons.percent_rounded, size: 18),
              suffixText: '%'),
          keyboardType: TextInputType.number,
          onChanged: (v) => pct = int.tryParse(v) ?? 10),
      ]),
      onConfirm: () async {
        if (code.trim().isEmpty) return false;
        final promos = StorageService.getPromotions();
        final newPromo = Promotion(
          id: promos.isEmpty ? 1 : promos.last.id + 1,
          code: code.trim().toUpperCase(),
          discountPercentage: pct.clamp(1, 100),
          isActive: true,
        );
        await StorageService.savePromotions([...promos, newPromo]);
        setState(() {});
        return true;
      },
    ));
  }

  void _changePin(BuildContext context) {
    String pin = '';
    showDialog(context: context, builder: (_) => _StyledDialog(
      title: 'Change Admin PIN',
      icon: Icons.lock_rounded,
      color: kIndigo,
      content: TextFormField(
        decoration: const InputDecoration(
            labelText: 'New 4-digit PIN',
            prefixIcon: Icon(Icons.lock_outline_rounded, size: 18),
            counterText: ''),
        keyboardType: TextInputType.number,
        obscureText: true,
        maxLength: 4,
        onChanged: (v) => pin = v,
      ),
      onConfirm: () async {
        if (pin.length != 4) return false;
        await StorageService.setAdminPin(pin);
        setState(() {});
        return true;
      },
    ));
  }
}

// ── Staff Panel ────────────────────────────────────────────────────────────────
class _StaffPanel extends StatefulWidget {
  final VoidCallback onChanged;
  const _StaffPanel({required this.onChanged});
  @override State<_StaffPanel> createState() => _StaffPanelState();
}

class _StaffPanelState extends State<_StaffPanel> {
  @override
  Widget build(BuildContext context) {
    final staff = StorageService.getStaff();
    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(children: [
        if (staff.isEmpty)
          const Padding(
            padding: EdgeInsets.all(20),
            child: Center(child: Text('No staff members',
                style: TextStyle(color: kMuted))))
        else
          ...staff.asMap().entries.map((e) {
            final i = e.key;
            final s = e.value;
            return Column(children: [
              if (i > 0) const Divider(height: 1, color: kBorder),
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
                child: Row(children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: kAccent.withAlpha(20),
                    child: Text(s.name.isNotEmpty ? s.name[0].toUpperCase() : '?',
                        style: const TextStyle(
                            color: kAccent, fontWeight: FontWeight.w700))),
                  const SizedBox(width: 10),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.name, style: const TextStyle(
                          fontWeight: FontWeight.w700)),
                      Text('${s.role} · ${s.phone}',
                          style: const TextStyle(
                              color: kMuted, fontSize: 11)),
                    ],
                  )),
                  Switch(
                    value: s.isActive, activeColor: kGreen,
                    onChanged: (v) async {
                      final all = staff.map((x) =>
                          x.id == s.id ? x.copyWith(isActive: v) : x
                      ).toList();
                      await StorageService.saveStaff(all);
                      setState(() {});
                      widget.onChanged();
                    }),
                ]),
              ),
            ]);
          }),
        const Divider(height: 1, color: kBorder),
        TextButton.icon(
          icon: const Icon(Icons.person_add_rounded, size: 16),
          label: const Text('Add Staff Member'),
          style: TextButton.styleFrom(foregroundColor: kAccent),
          onPressed: () => _add(context, staff),
        ),
      ]),
    );
  }

  void _add(BuildContext context, List<Staff> existing) {
    String name = '', phone = '', pin = '';
    showDialog(context: context, builder: (_) => _StyledDialog(
      title: 'Add Staff Member',
      icon: Icons.person_add_rounded,
      color: kAccent,
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextFormField(
          decoration: const InputDecoration(
              labelText: 'Full Name',
              prefixIcon: Icon(Icons.person_outline, size: 18)),
          textCapitalization: TextCapitalization.words,
          onChanged: (v) => name = v),
        const SizedBox(height: 12),
        TextFormField(
          decoration: const InputDecoration(
              labelText: 'Phone',
              prefixIcon: Icon(Icons.phone_outlined, size: 18)),
          keyboardType: TextInputType.phone,
          onChanged: (v) => phone = v),
        const SizedBox(height: 12),
        TextFormField(
          decoration: const InputDecoration(
              labelText: '4-digit PIN',
              prefixIcon: Icon(Icons.lock_outline_rounded, size: 18),
              counterText: ''),
          keyboardType: TextInputType.number,
          obscureText: true,
          maxLength: 4,
          onChanged: (v) => pin = v),
      ]),
      onConfirm: () async {
        if (name.trim().isEmpty || pin.length < 4) return false;
        final s = Staff(
          id: existing.isEmpty ? 1 : existing.last.id + 1,
          name: name.trim(), phone: phone.trim(),
          pin: pin, role: 'operator', isActive: true);
        await StorageService.saveStaff([...existing, s]);
        setState(() {});
        widget.onChanged();
        return true;
      },
    ));
  }
}

// ── Maintenance Panel ──────────────────────────────────────────────────────────
class _MaintenancePanel extends StatefulWidget {
  final VoidCallback onChanged;
  const _MaintenancePanel({required this.onChanged});
  @override State<_MaintenancePanel> createState() => _MaintenancePanelState();
}

class _MaintenancePanelState extends State<_MaintenancePanel> {
  @override
  Widget build(BuildContext context) {
    final logs = StorageService.getMaintenance().reversed.take(15).toList();
    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(children: [
        if (logs.isEmpty)
          const Padding(
            padding: EdgeInsets.all(20),
            child: Center(child: Text('No maintenance logs',
                style: TextStyle(color: kMuted))))
        else
          ...logs.asMap().entries.map((e) {
            final i = e.key;
            final l = e.value;
            final typeColor = _typeColor(l.type);
            return Column(children: [
              if (i > 0) const Divider(height: 1, color: kBorder),
              Padding(
                padding: const EdgeInsets.all(14),
                child: Row(children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: typeColor.withAlpha(15),
                      borderRadius: BorderRadius.circular(12)),
                    child: Icon(_typeIcon(l.type),
                        color: typeColor, size: 18)),
                  const SizedBox(width: 10),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Text(l.quadName, style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 13)),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: typeColor.withAlpha(15),
                            borderRadius: BorderRadius.circular(6)),
                          child: Text(l.type, style: TextStyle(
                              color: typeColor, fontSize: 9,
                              fontWeight: FontWeight.w700))),
                      ]),
                      Text(l.description, style: const TextStyle(
                          color: kMuted, fontSize: 12, height: 1.3)),
                      Text(l.date.dateOnly,
                          style: const TextStyle(
                              color: kMuted, fontSize: 10)),
                    ],
                  )),
                  Text('${l.cost.kes} KES', style: const TextStyle(
                      color: kAccent, fontWeight: FontWeight.w700,
                      fontSize: 13)),
                ]),
              ),
            ]);
          }),
        const Divider(height: 1, color: kBorder),
        TextButton.icon(
          icon: const Icon(Icons.add_rounded, size: 16),
          label: const Text('Log Maintenance'),
          style: TextButton.styleFrom(foregroundColor: kAccent),
          onPressed: () => _add(context),
        ),
      ]),
    );
  }

  Color _typeColor(String t) => switch (t) {
    'service'    => kIndigo,
    'fuel'       => kGreen,
    'repair'     => kRed,
    'inspection' => kAccent,
    _ => kMuted,
  };

  IconData _typeIcon(String t) => switch (t) {
    'service'    => Icons.settings_rounded,
    'fuel'       => Icons.local_gas_station_rounded,
    'repair'     => Icons.build_rounded,
    'inspection' => Icons.check_circle_outline_rounded,
    _ => Icons.build_circle_rounded,
  };

  void _add(BuildContext context) {
    final quads = StorageService.getQuads();
    int? quadId; String type = 'service', desc = ''; int cost = 0;
    showDialog(context: context, builder: (ctx) => _StyledDialog(
      title: 'Log Maintenance',
      icon: Icons.build_rounded,
      color: kAccent,
      content: StatefulBuilder(builder: (ctx, setS) =>
        Column(mainAxisSize: MainAxisSize.min, children: [
          DropdownButtonFormField<int>(
            decoration: const InputDecoration(
                labelText: 'Quad',
                prefixIcon: Icon(Icons.directions_bike_rounded, size: 18)),
            items: quads.map((q) => DropdownMenuItem(
                value: q.id, child: Text(q.name))).toList(),
            onChanged: (v) => quadId = v),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: type,
            decoration: const InputDecoration(
                labelText: 'Type',
                prefixIcon: Icon(Icons.category_rounded, size: 18)),
            items: ['service','fuel','repair','inspection'].map((t) =>
                DropdownMenuItem(value: t, child: Text(t))).toList(),
            onChanged: (v) { if (v != null) setS(() => type = v); }),
          const SizedBox(height: 12),
          TextFormField(
            decoration: const InputDecoration(
                labelText: 'Description',
                prefixIcon: Icon(Icons.notes_rounded, size: 18)),
            maxLines: 2,
            onChanged: (v) => desc = v),
          const SizedBox(height: 12),
          TextFormField(
            decoration: const InputDecoration(
                labelText: 'Cost (KES)',
                prefixIcon: Icon(Icons.payments_outlined, size: 18),
                suffixText: 'KES'),
            keyboardType: TextInputType.number,
            onChanged: (v) => cost = int.tryParse(v) ?? 0),
        ])),
      onConfirm: () async {
        if (quadId == null || desc.trim().isEmpty) return false;
        final quad = quads.firstWhere((q) => q.id == quadId);
        final log = MaintenanceLog(
          id: DateTime.now().millisecondsSinceEpoch,
          quadId: quadId!, quadName: quad.name, type: type,
          description: desc.trim(), cost: cost, date: DateTime.now());
        await StorageService.saveMaintenance(
            [...StorageService.getMaintenance(), log]);
        setState(() {});
        widget.onChanged();
        return true;
      },
    ));
  }
}

// ── Reusable styled dialog ──────────────────────────────────────────────────────
class _StyledDialog extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final Widget content;
  final Future<bool> Function() onConfirm;

  const _StyledDialog({required this.title, required this.icon,
      required this.color, required this.content, required this.onConfirm});

  @override
  Widget build(BuildContext context) => Dialog(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      // Header
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: color.withAlpha(10),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(bottom: BorderSide(color: color.withAlpha(30)))),
        child: Row(children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
                color: color.withAlpha(20),
                borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 18)),
          const SizedBox(width: 10),
          Text(title, style: const TextStyle(
              fontFamily: 'Playfair', fontSize: 17,
              fontWeight: FontWeight.w700)),
        ]),
      ),
      // Content
      Padding(
        padding: const EdgeInsets.all(20),
        child: content),
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
                backgroundColor: color,
                padding: const EdgeInsets.symmetric(vertical: 14)),
            onPressed: () async {
              final ok = await onConfirm();
              if (ok && context.mounted) Navigator.pop(context);
            },
            child: const Text('Confirm'),
          )),
        ]),
      ),
    ]),
  );
}
