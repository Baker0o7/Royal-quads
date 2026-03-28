import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
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
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 48),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // ── Promo codes ───────────────────────────────────────────────────
        _ToolHeader(
          icon: Icons.local_offer_rounded, label: 'Promo Codes',
          color: kAccent,
          action: _AddButton('New Code', () => _addPromo(context)),
        ),
        const SizedBox(height: 10),
        _PromoSection(
          promos: promos,
          onChanged: () => setState(() {}),
        ),

        const SizedBox(height: 24),

        // ── Admin PIN ─────────────────────────────────────────────────────
        _ToolHeader(
          icon: Icons.lock_rounded, label: 'Admin PIN',
          color: kIndigo,
        ),
        const SizedBox(height: 10),
        _PinCard(pin: pin, onChange: () => _changePin(context)),

        const SizedBox(height: 24),

        // ── Staff ─────────────────────────────────────────────────────────
        _ToolHeader(
          icon: Icons.people_rounded, label: 'Staff Members',
          color: kGreen,
          action: _AddButton('Add Staff', () => _addStaff(context)),
        ),
        const SizedBox(height: 10),
        _StaffSection(onChanged: () => setState(() {})),

        const SizedBox(height: 24),

        // ── Maintenance logs ──────────────────────────────────────────────
        _ToolHeader(
          icon: Icons.build_rounded, label: 'Maintenance Logs',
          color: kOrange,
          action: _AddButton('Log Entry', () => _logMaintenance(context)),
        ),
        const SizedBox(height: 10),
        _MaintenanceSection(onChanged: () => setState(() {})),

        const SizedBox(height: 24),

        // ── Backup & Restore ───────────────────────────────────────────────
        _ToolHeader(
          icon: Icons.backup_rounded, label: 'Backup & Restore',
          color: kIndigo,
        ),
        const SizedBox(height: 10),
        const _BackupRestoreCard(),
      ]),
    );
  }

  // ── Dialog launchers ─────────────────────────────────────────────────────

  void _addPromo(BuildContext context) {
    final codeCtrl = TextEditingController();
    final pctCtrl  = TextEditingController(text: '10');
    showDialog(context: context, builder: (_) => _ToolDialog(
      title: 'New Promo Code',
      icon: Icons.local_offer_rounded,
      color: kAccent,
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(
          controller: codeCtrl,
          textCapitalization: TextCapitalization.characters,
          inputFormatters: [FilteringTextInputFormatter.allow(
              RegExp(r'[A-Za-z0-9]'))],
          decoration: const InputDecoration(
              labelText: 'Code (e.g. DUNES20)',
              hintText: 'SUMMER15',
              prefixIcon: Icon(Icons.confirmation_number_outlined, size: 18)),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: pctCtrl,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: const InputDecoration(
              labelText: 'Discount %',
              prefixIcon: Icon(Icons.percent_rounded, size: 18),
              suffixText: '%'),
        ),
      ]),
      onConfirm: () async {
        final code = codeCtrl.text.trim().toUpperCase();
        final pct  = int.tryParse(pctCtrl.text) ?? 10;
        if (code.isEmpty) return false;
        final promos = StorageService.getPromotions();
        final newPromo = Promotion(
          id: promos.isEmpty ? 1 : promos.last.id + 1,
          code: code,
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
    final ctrl = TextEditingController();
    showDialog(context: context, builder: (_) => _ToolDialog(
      title: 'Change Admin PIN',
      icon: Icons.lock_rounded,
      color: kIndigo,
      content: TextField(
        controller: ctrl,
        keyboardType: TextInputType.number,
        obscureText: true,
        maxLength: 4,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        decoration: const InputDecoration(
            labelText: 'New 4-digit PIN',
            prefixIcon: Icon(Icons.lock_outline_rounded, size: 18),
            counterText: ''),
      ),
      onConfirm: () async {
        if (ctrl.text.length != 4) return false;
        await StorageService.setAdminPin(ctrl.text);
        setState(() {});
        return true;
      },
    ));
  }

  void _addStaff(BuildContext context) {
    final nameCtrl  = TextEditingController();
    final phoneCtrl = TextEditingController();
    final pinCtrl   = TextEditingController();
    showDialog(context: context, builder: (_) => _ToolDialog(
      title: 'Add Staff Member',
      icon: Icons.person_add_rounded,
      color: kGreen,
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(
          controller: nameCtrl,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
              labelText: 'Full Name',
              prefixIcon: Icon(Icons.person_outline, size: 18)),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: phoneCtrl,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
              labelText: 'Phone', hintText: '0712 345 678',
              prefixIcon: Icon(Icons.phone_outlined, size: 18)),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: pinCtrl,
          keyboardType: TextInputType.number,
          obscureText: true,
          maxLength: 4,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: const InputDecoration(
              labelText: '4-digit PIN',
              prefixIcon: Icon(Icons.lock_outline_rounded, size: 18),
              counterText: ''),
        ),
      ]),
      onConfirm: () async {
        final name = nameCtrl.text.trim();
        final pin  = pinCtrl.text;
        if (name.isEmpty || pin.length < 4) return false;
        final existing = StorageService.getStaff();
        final s = Staff(
          id: existing.isEmpty ? 1 : existing.last.id + 1,
          name: name,
          phone: phoneCtrl.text.trim(),
          pin: pin, role: 'operator', isActive: true);
        await StorageService.saveStaff([...existing, s]);
        setState(() {});
        return true;
      },
    ));
  }

  void _logMaintenance(BuildContext context) {
    final quads   = StorageService.getQuads();
    final descCtrl = TextEditingController();
    final costCtrl = TextEditingController();
    int? quadId;
    String type = 'service';
    showDialog(context: context, builder: (_) => _ToolDialog(
      title: 'Log Maintenance',
      icon: Icons.build_rounded,
      color: kOrange,
      content: StatefulBuilder(builder: (ctx, setS) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonFormField<int>(
            decoration: const InputDecoration(
                labelText: 'Quad',
                prefixIcon: Icon(Icons.directions_bike_rounded, size: 18)),
            items: quads.map((q) => DropdownMenuItem(
                value: q.id, child: Text(q.name))).toList(),
            onChanged: (v) => quadId = v,
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            value: type,
            decoration: const InputDecoration(
                labelText: 'Type',
                prefixIcon: Icon(Icons.category_rounded, size: 18)),
            items: [
              _typeItem('service',    'Service',    Icons.settings_rounded,     kIndigo),
              _typeItem('fuel',       'Fuel',       Icons.local_gas_station_rounded, kGreen),
              _typeItem('repair',     'Repair',     Icons.build_rounded,        kRed),
              _typeItem('inspection', 'Inspection', Icons.check_circle_outline_rounded, kAccent),
            ],
            onChanged: (v) { if (v != null) setS(() => type = v); },
          ),
          const SizedBox(height: 14),
          TextField(
            controller: descCtrl,
            decoration: const InputDecoration(
                labelText: 'Description',
                prefixIcon: Icon(Icons.notes_rounded, size: 18)),
            maxLines: 2,
          ),
          const SizedBox(height: 14),
          TextField(
            controller: costCtrl,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: const InputDecoration(
                labelText: 'Cost (KES)',
                prefixIcon: Icon(Icons.payments_outlined, size: 18),
                suffixText: 'KES'),
          ),
        ],
      )),
      onConfirm: () async {
        if (quadId == null || descCtrl.text.trim().isEmpty) return false;
        final quad = quads.firstWhere((q) => q.id == quadId);
        final log = MaintenanceLog(
          id: DateTime.now().millisecondsSinceEpoch,
          quadId: quadId!, quadName: quad.name, type: type,
          description: descCtrl.text.trim(),
          cost: int.tryParse(costCtrl.text) ?? 0,
          date: DateTime.now(),
        );
        await StorageService.saveMaintenance(
            [...StorageService.getMaintenance(), log]);
        setState(() {});
        return true;
      },
    ));
  }

  DropdownMenuItem<String> _typeItem(
      String v, String label, IconData icon, Color c) =>
    DropdownMenuItem(value: v,
      child: Row(children: [
        Icon(icon, color: c, size: 15),
        const SizedBox(width: 8),
        Text(label),
      ]),
    );
}

// ── Tool section header ───────────────────────────────────────────────────────
class _ToolHeader extends StatelessWidget {
  final IconData icon; final String label; final Color color;
  final Widget? action;
  const _ToolHeader({required this.icon, required this.label,
      required this.color, this.action});
  @override
  Widget build(BuildContext context) => Row(children: [
    Container(
      width: 32, height: 32,
      decoration: BoxDecoration(
        color: color.withAlpha(18),
        borderRadius: BorderRadius.circular(9),
      ),
      child: Icon(icon, color: color, size: 16),
    ),
    SizedBox(width: 10),
    Text(label, style: TextStyle(
        fontFamily: 'Playfair', fontSize: 16,
        fontWeight: FontWeight.w700, color: context.rq.text)),
    const Spacer(),
    if (action != null) action!,
  ]);
}

class _AddButton extends StatelessWidget {
  final String label; final VoidCallback onTap;
  const _AddButton(this.label, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: kAccent.withAlpha(10),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kAccent.withAlpha(40)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.add_rounded, color: kAccent, size: 14),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(
            color: kAccent, fontSize: 12, fontWeight: FontWeight.w700)),
      ]),
    ),
  );
}

// ── Promo codes section ───────────────────────────────────────────────────────
class _PromoSection extends StatelessWidget {
  final List<Promotion> promos;
  final VoidCallback onChanged;
  const _PromoSection({required this.promos, required this.onChanged});

  @override
  Widget build(BuildContext context) => promos.isEmpty
    ? _EmptyCard('No promo codes yet', Icons.local_offer_outlined)
    : AppCard(
        padding: EdgeInsets.zero,
        child: Column(children: promos.asMap().entries.map((e) {
          final i = e.key; final p = e.value;
          return Column(children: [
            if (i > 0) Divider(height: 1, color: context.rq.border),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: p.isActive
                        ? kGreen.withAlpha(12) : kBg2,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: p.isActive
                            ? kGreen.withAlpha(40) : context.rq.border)),
                  child: Text(p.code, style: TextStyle(
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                      color: p.isActive ? kGreen : context.rq.muted)),
                ),
                SizedBox(width: 12),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${p.discountPercentage}% off',
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 13)),
                    Text(p.isActive ? 'Active' : 'Disabled',
                        style: TextStyle(
                            color: p.isActive ? kGreen : context.rq.muted,
                            fontSize: 11)),
                  ],
                )),
                Switch(
                  value: p.isActive, activeColor: kGreen,
                  onChanged: (v) async {
                    final updated = promos.map((x) =>
                        x.id == p.id ? x.copyWith(isActive: v) : x).toList();
                    await StorageService.savePromotions(updated);
                    onChanged();
                  }),
              ]),
            ),
          ]);
        }).toList()),
      );
}

// ── PIN card ──────────────────────────────────────────────────────────────────
class _PinCard extends StatelessWidget {
  final String pin;
  final VoidCallback onChange;
  const _PinCard({required this.pin, required this.onChange});

  @override
  Widget build(BuildContext context) => AppCard(child: Row(children: [
    Container(
      width: 48, height: 48,
      decoration: BoxDecoration(
        color: kIndigo.withAlpha(12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kIndigo.withAlpha(30)),
      ),
      child: const Icon(Icons.lock_open_rounded, color: kIndigo, size: 22)),
    SizedBox(width: 14),
    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
      Text('Current PIN', style: TextStyle(
          color: context.rq.muted, fontSize: 11, fontWeight: FontWeight.w600)),
      const SizedBox(height: 4),
      Row(children: List.generate(pin.length, (_) => Container(
        width: 10, height: 10,
        margin: const EdgeInsets.only(right: 5),
        decoration: BoxDecoration(
          color: kIndigo, shape: BoxShape.circle,
          boxShadow: [BoxShadow(
              color: kIndigo.withAlpha(50), blurRadius: 4)],
        ),
      ))),
    ])),
    GestureDetector(
      onTap: onChange,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: kIndigo,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(
              color: kIndigo.withAlpha(50), blurRadius: 8,
              offset: const Offset(0, 3))],
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.edit_rounded, color: context.rq.text, size: 14),
          SizedBox(width: 6),
          Text('Change', style: TextStyle(
              color: context.rq.text, fontWeight: FontWeight.w700,
              fontSize: 13)),
        ]),
      ),
    ),
  ]));
}

// ── Staff section ─────────────────────────────────────────────────────────────
class _StaffSection extends StatefulWidget {
  final VoidCallback onChanged;
  const _StaffSection({required this.onChanged});
  @override State<_StaffSection> createState() => _StaffSectionState();
}

class _StaffSectionState extends State<_StaffSection> {
  @override
  Widget build(BuildContext context) {
    final staff = StorageService.getStaff();
    if (staff.isEmpty) return _EmptyCard('No staff members yet', Icons.people_outline);
    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(children: staff.asMap().entries.map((e) {
        final i = e.key; final s = e.value;
        return Column(children: [
          if (i > 0) Divider(height: 1, color: context.rq.border),
          Padding(
            padding: const EdgeInsets.symmetric(
                horizontal: 16, vertical: 12),
            child: Row(children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: kAccent.withAlpha(15),
                child: Text(
                  s.name.isNotEmpty ? s.name[0].toUpperCase() : '?',
                  style: const TextStyle(
                      color: kAccent, fontWeight: FontWeight.w800,
                      fontSize: 16)),
              ),
              SizedBox(width: 12),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.name, style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 14)),
                  Text('${s.role}  ·  ${s.phone}',
                      style: TextStyle(color: context.rq.muted, fontSize: 12)),
                ],
              )),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Transform.scale(scale: 0.85, child: Switch(
                  value: s.isActive, activeColor: kGreen,
                  onChanged: (v) async {
                    final all = staff.map((x) =>
                        x.id == s.id ? x.copyWith(isActive: v) : x).toList();
                    await StorageService.saveStaff(all);
                    setState(() {}); widget.onChanged();
                  },
                )),
                Text(s.isActive ? 'Active' : 'Off duty',
                    style: TextStyle(
                        fontSize: 10,
                        color: s.isActive ? kGreen : context.rq.muted,
                        fontWeight: FontWeight.w600)),
              ]),
            ]),
          ),
        ]);
      }).toList()),
    );
  }
}

// ── Maintenance section ───────────────────────────────────────────────────────
class _MaintenanceSection extends StatefulWidget {
  final VoidCallback onChanged;
  const _MaintenanceSection({required this.onChanged});
  @override State<_MaintenanceSection> createState() => _MaintenanceSectionState();
}

class _MaintenanceSectionState extends State<_MaintenanceSection> {
  static Color _typeColor(String t) => switch (t) {
    'service'    => kIndigo,
    'fuel'       => kGreen,
    'repair'     => kRed,
    'inspection' => kAccent,
    _ => kMuted,
  };

  static IconData _typeIcon(String t) => switch (t) {
    'service'    => Icons.settings_rounded,
    'fuel'       => Icons.local_gas_station_rounded,
    'repair'     => Icons.build_rounded,
    'inspection' => Icons.check_circle_outline_rounded,
    _ => Icons.build_circle_rounded,
  };

  @override
  Widget build(BuildContext context) {
    final logs = StorageService.getMaintenance().reversed.take(20).toList();
    if (logs.isEmpty) return _EmptyCard(
        'No maintenance logs yet', Icons.build_outlined);

    // Total spend
    final totalSpend = logs.fold(0, (s, l) => s + l.cost);

    return Column(children: [
      // Summary bar
      Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: kOrange.withAlpha(8),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: kOrange.withAlpha(30)),
        ),
        child: Row(children: [
          const Icon(Icons.analytics_outlined, color: kOrange, size: 14),
          SizedBox(width: 8),
          Text('${logs.length} logs', style: const TextStyle(
              color: kOrange, fontWeight: FontWeight.w700, fontSize: 13)),
          const Spacer(),
          Text('Total: ${totalSpend.kes} KES',
              style: TextStyle(color: context.rq.muted, fontSize: 12)),
        ]),
      ),
      AppCard(
        padding: EdgeInsets.zero,
        child: Column(children: logs.asMap().entries.map((e) {
          final i = e.key; final l = e.value;
          final tc = _typeColor(l.type);
          return Column(children: [
            if (i > 0) Divider(height: 1, color: context.rq.border),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(children: [
                Container(
                  width: 42, height: 42,
                  decoration: BoxDecoration(
                    color: tc.withAlpha(12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(_typeIcon(l.type), color: tc, size: 18)),
                SizedBox(width: 12),
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
                          color: tc.withAlpha(12),
                          borderRadius: BorderRadius.circular(6)),
                        child: Text(l.type, style: TextStyle(
                            color: tc, fontSize: 9,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3)),
                      ),
                    ]),
                    SizedBox(height: 2),
                    Text(l.description, style: TextStyle(
                        color: context.rq.muted, fontSize: 12, height: 1.3)),
                    Text(l.date.dateOnly,
                        style: TextStyle(color: context.rq.muted, fontSize: 10)),
                  ],
                )),
                if (l.cost > 0) Text('${l.cost.kes} KES',
                    style: const TextStyle(
                        color: kAccent, fontWeight: FontWeight.w700,
                        fontSize: 13)),
              ]),
            ),
          ]);
        }).toList()),
      ),
    ]);
  }
}

// ── Empty state card ──────────────────────────────────────────────────────────
class _EmptyCard extends StatelessWidget {
  final String label; final IconData icon;
  const _EmptyCard(this.label, this.icon);
  @override
  Widget build(BuildContext context) => AppCard(
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Center(child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: context.rq.border, size: 20),
          SizedBox(width: 10),
          Text(label, style: TextStyle(color: context.rq.muted, fontSize: 13)),
        ],
      )),
    ),
  );
}

// ── Shared dialog ─────────────────────────────────────────────────────────────
class _ToolDialog extends StatefulWidget {
  final String title; final IconData icon; final Color color;
  final Widget content;
  final Future<bool> Function() onConfirm;
  const _ToolDialog({required this.title, required this.icon,
      required this.color, required this.content, required this.onConfirm});
  @override State<_ToolDialog> createState() => _ToolDialogState();
}

class _ToolDialogState extends State<_ToolDialog> {
  bool _loading = false;

  @override
  Widget build(BuildContext context) => Dialog(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      // Header
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: widget.color.withAlpha(8),
          borderRadius: const BorderRadius.vertical(
              top: Radius.circular(24)),
          border: Border(bottom: BorderSide(
              color: widget.color.withAlpha(30))),
        ),
        child: Row(children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: widget.color.withAlpha(18),
              borderRadius: BorderRadius.circular(10)),
            child: Icon(widget.icon, color: widget.color, size: 18)),
          const SizedBox(width: 10),
          Expanded(child: Text(widget.title, style: const TextStyle(
              fontFamily: 'Playfair', fontSize: 17,
              fontWeight: FontWeight.w700))),
        ]),
      ),
      // Content
      Padding(padding: const EdgeInsets.all(20), child: widget.content),
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
              backgroundColor: widget.color,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            onPressed: _loading ? null : () async {
              setState(() => _loading = true);
              final ok = await widget.onConfirm();
              if (ok && context.mounted) Navigator.pop(context);
              else setState(() => _loading = false);
            },
            child: _loading
                ? SizedBox(width: 18, height: 18,
                    child: CircularProgressIndicator(
                        color: context.rq.text, strokeWidth: 2))
                : const Text('Save',
                    style: TextStyle(fontWeight: FontWeight.w700)),
          )),
        ]),
      ),
    ]),
  );
}

// ── Backup & Restore Card ─────────────────────────────────────────────────────
class _BackupRestoreCard extends StatefulWidget {
  const _BackupRestoreCard();
  @override State<_BackupRestoreCard> createState() => _BRCState();
}

class _BRCState extends State<_BackupRestoreCard> {
  bool _busy = false;
  String? _lastBackupPath;
  String? _status;
  int _refreshKey = 0;

  Future<Directory> _getDir() async {
    // Try /sdcard/Download/RoyalQuadBikes (always visible in Files app)
    try {
      const sdcard = '/sdcard/Download/RoyalQuadBikes';
      final dir = Directory(sdcard);
      if (!await dir.exists()) await dir.create(recursive: true);
      if (await dir.exists()) return dir;
    } catch (_) {}
    // Try via getExternalStorageDirectory path manipulation
    try {
      final ext = await getExternalStorageDirectory();
      if (ext != null) {
        final parts = ext.path.split('/');
        final rootIdx = parts.indexOf('Android');
        if (rootIdx > 0) {
          final root = parts.sublist(0, rootIdx).join('/');
          for (final sub in ['Downloads', 'Download']) {
            final dir = Directory('$root/$sub/RoyalQuadBikes');
            if (!await dir.exists()) await dir.create(recursive: true);
            if (await dir.exists()) return dir;
          }
        }
      }
    } catch (_) {}
    // Final fallback: app documents
    return getApplicationDocumentsDirectory();
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  Future<void> _backup() async {
    setState(() { _busy = true; _status = null; });
    try {
      final data = StorageService.exportBackup();
      final json = const JsonEncoder.withIndent('  ').convert(data);
      final dir  = await _getDir();
      final ts   = DateTime.now();
      final name = 'rq_backup_${ts.year}${ts.month.toString().padLeft(2,'0')}${ts.day.toString().padLeft(2,'0')}_${ts.hour.toString().padLeft(2,'0')}${ts.minute.toString().padLeft(2,'0')}.json';
      final file = File('${dir.path}/$name');
      await file.writeAsString(json);
      setState(() {
        _lastBackupPath = file.path;
        _status = '✅ Saved to Documents/$name';
        _busy = false;
        _refreshKey++;
      });
    } catch (e) {
      setState(() { _status = '❌ Error: $e'; _busy = false; });
    }
  }

  // ── List backups ───────────────────────────────────────────────────────────
  Future<List<File>> _listBackups() async {
    final dir = await _getDir();
    final all = dir.listSync()
        .whereType<File>()
        .where((f) => f.path.contains('rq_backup') && f.path.endsWith('.json'))
        .toList()
      ..sort((a, b) => b.path.compareTo(a.path));
    return all;
  }

  // ── Restore ────────────────────────────────────────────────────────────────
  Future<void> _restore(File file) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Restore Backup?'),
        content: Text('This will replace ALL current data with the backup from ${file.uri.pathSegments.last}.\n\nThis cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kRed),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Restore', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    setState(() { _busy = true; _status = null; });
    try {
      final json = await file.readAsString();
      final data = jsonDecode(json) as Map<String, dynamic>;
      final keys = await StorageService.importBackup(data);
      if (context.mounted) {
        await context.read<AppProvider>().loadAll();
        setState(() {
          _status = '✅ Restored ${keys.length} items. Restart recommended.';
          _busy = false;
        });
      }
    } catch (e) {
      setState(() { _status = '❌ Error: $e'; _busy = false; });
    }
  }

  // ── Delete backup file ─────────────────────────────────────────────────────
  Future<void> _delete(File file) async {
    await file.delete();
    setState(() => _refreshKey++);
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // Export button
        Row(children: [
          Expanded(child: ElevatedButton.icon(
            icon: const Icon(Icons.upload_rounded, size: 18),
            label: Text(_busy ? 'Working…' : 'Create Backup'),
            style: ElevatedButton.styleFrom(
              backgroundColor: kIndigo, foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 13),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            onPressed: _busy ? null : _backup,
          )),
        ]),

        if (_status != null) ...[
          SizedBox(height: 10),
          Text(_status!, style: TextStyle(fontSize: 12, color: context.rq.muted)),
        ],

        SizedBox(height: 16),
        Text('Saved Backups',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                color: context.rq.muted, letterSpacing: .5)),
        const SizedBox(height: 8),

        FutureBuilder<List<File>>(
          key: ValueKey(_refreshKey),
          future: _listBackups(),
          builder: (ctx, snap) {
            final files = snap.data ?? [];
            if (files.isEmpty) {
              return Text('No backups yet',
                  style: TextStyle(fontSize: 12, color: context.rq.muted));
            }
            return Column(
              children: files.map((f) {
                final name = f.uri.pathSegments.last
                    .replaceAll('rq_backup_', '')
                    .replaceAll('.json', '');
                // Parse date from filename
                final datePart = name.length >= 8 ? name.substring(0, 8) : name;
                final timePart = name.length >= 13 ? name.substring(9) : '';
                final display = datePart.length == 8
                    ? '${datePart.substring(6)}/${datePart.substring(4,6)}/${datePart.substring(0,4)}'
                        + (timePart.length == 4 ? '  ${timePart.substring(0,2)}:${timePart.substring(2)}' : '')
                    : name;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: context.rq.card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: context.rq.border),
                  ),
                  child: Row(children: [
                    Icon(Icons.description_rounded, size: 16, color: kIndigo),
                    SizedBox(width: 8),
                    Expanded(child: Text(display,
                        style: TextStyle(fontSize: 12,
                            fontWeight: FontWeight.w600, color: context.rq.text))),
                    // Restore
                    GestureDetector(
                      onTap: () => _restore(f),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: kGreen.withAlpha(18),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('Restore',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                                color: kGreen)),
                      ),
                    ),
                    const SizedBox(width: 6),
                    // Delete
                    GestureDetector(
                      onTap: () => _delete(f).then((_) => setState(() {})),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                        decoration: BoxDecoration(
                          color: kRed.withAlpha(12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.delete_outline_rounded,
                            size: 15, color: kRed),
                      ),
                    ),
                  ]),
                );
              }).toList(),
            );
          },
        ),
      ]),
    );
  }
}
