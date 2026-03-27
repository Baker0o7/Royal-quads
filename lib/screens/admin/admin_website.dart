import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import '../../models/models.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../services/storage.dart';
import '../../theme/theme.dart';

// ─────────────────────────────────────────────────────────────────────────────
// GitHub config — updates docs/data.json via GitHub Contents API
// ─────────────────────────────────────────────────────────────────────────────
const _kOwner  = 'Baker0o7';
const _kRepo   = 'Royal-quads';
const _kBranch = 'main';
const _kPath   = 'docs/data.json';
const _kRawUrl =
    'https://raw.githubusercontent.com/$_kOwner/$_kRepo/$_kBranch/$_kPath';
const _kApiUrl =
    'https://api.github.com/repos/$_kOwner/$_kRepo/contents/$_kPath';

// Token stored in SharedPreferences so admin can update it without a rebuild
const _kTokenPref = 'gh_api_token';

// ─────────────────────────────────────────────────────────────────────────────
class AdminWebsiteTab extends StatefulWidget {
  const AdminWebsiteTab({super.key});
  @override State<AdminWebsiteTab> createState() => _AdminWebsiteTabState();
}

class _AdminWebsiteTabState extends State<AdminWebsiteTab> {
  // Website state mirrors
  bool   _open          = true;
  String _notice        = '';
  int    _overtimeRate  = 100;
  String _token         = '';
  String _fileSha       = '';

  List<Map<String,dynamic>> _quads   = [];
  List<Map<String,dynamic>> _pricing = [];
  List<Map<String,dynamic>> _promos  = [];

  bool _loading  = false;
  bool _saving   = false;
  bool _dirty    = false;

  final _noticeCtrl = TextEditingController();
  final _tokenCtrl  = TextEditingController();

  @override
  void initState() {
    super.initState();
    _token = StorageService.getString(_kTokenPref) ?? '';
    _tokenCtrl.text = _token;
    _loadFromGitHub();
  }

  @override
  void dispose() {
    _noticeCtrl.dispose();
    _tokenCtrl.dispose();
    super.dispose();
  }

  // ── Fetch current data.json + merge with live app fleet ─────────────────
  Future<void> _loadFromGitHub() async {
    setState(() => _loading = true);
    try {
      final r = await http.get(
        Uri.parse('$_kRawUrl?t=${DateTime.now().millisecondsSinceEpoch}'),
        headers: {'Cache-Control': 'no-cache'},
      ).timeout(const Duration(seconds: 12));

      if (r.statusCode == 200) {
        final d = json.decode(r.body) as Map<String,dynamic>;
        final biz = d['business'] as Map<String,dynamic>? ?? {};
        setState(() {
          _open         = biz['open'] as bool? ?? true;
          _notice       = d['notice'] as String? ?? '';
          _overtimeRate = (d['overtimeRate'] as num?)?.toInt() ?? 100;
          _pricing      = List<Map<String,dynamic>>.from(d['pricing'] ?? []);
          _promos       = List<Map<String,dynamic>>.from(d['promos'] ?? []);
          _noticeCtrl.text = _notice;
        });
        // Always sync quads from the live app fleet (real names + real status)
        _syncQuadsFromApp();
      }
      await _fetchSha();
    } catch (e) {
      _toast('Could not load website data: $e', error: true);
      // Even on error, still load local app quads
      _syncQuadsFromApp();
    } finally {
      setState(() { _loading = false; _dirty = false; });
    }
  }

  // ── Sync quad list from the app's live fleet ──────────────────────────────
  void _syncQuadsFromApp() {
    final appQuads = StorageService.getQuads();
    setState(() {
      _quads = appQuads.map((q) => {
        'id':     q.id,
        'name':   q.name,
        'status': q.status,
        'emoji':  '🏍️',
      }).toList();
    });
  }

  Future<void> _fetchSha() async {
    if (_token.isEmpty) return;
    try {
      final r = await http.get(
        Uri.parse(_kApiUrl),
        headers: {
          'Authorization': 'token $_token',
          'Accept': 'application/vnd.github.v3+json',
        },
      ).timeout(const Duration(seconds: 10));
      if (r.statusCode == 200) {
        final data = json.decode(r.body);
        setState(() => _fileSha = data['sha'] as String? ?? '');
      }
    } catch (_) {}
  }

  // ── Push update to GitHub ─────────────────────────────────────────────────
  Future<void> _saveToGitHub() async {
    if (_token.isEmpty) {
      _showTokenDialog();
      return;
    }
    if (_fileSha.isEmpty) {
      await _fetchSha();
      if (_fileSha.isEmpty) {
        _toast('Could not get file SHA. Check your token.', error: true);
        return;
      }
    }

    setState(() => _saving = true);
    try {
      // Build updated JSON
      final payload = {
        '_comment': 'Managed by Royal Quad Bikes admin app.',
        '_updated': DateTime.now().toUtc().toIso8601String(),
        'business': {
          'name': 'Royal Quad Bikes',
          'location': 'Mambrui Sand Dunes, Kilifi County, Kenya',
          'tillNumber': '6685024',
          'phone1': '254784589999',
          'phone2': '254784993996',
          'open': _open,
          'hours': 'Sunrise to Sunset',
        },
        'quads': _quads,
        'pricing': _pricing,
        'promos': _promos,
        'overtimeRate': _overtimeRate,
        'notice': _notice.trim(),
      };

      final content = base64Encode(utf8.encode(
          const JsonEncoder.withIndent('  ').convert(payload)));

      final r = await http.put(
        Uri.parse(_kApiUrl),
        headers: {
          'Authorization': 'token $_token',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'message': 'chore: admin website update via app',
          'content': content,
          'sha': _fileSha,
          'branch': _kBranch,
        }),
      ).timeout(const Duration(seconds: 20));

      if (r.statusCode == 200 || r.statusCode == 201) {
        final resp = json.decode(r.body);
        setState(() {
          _fileSha = resp['content']['sha'] as String? ?? _fileSha;
          _dirty   = false;
        });
        _toast('✅ Website updated successfully!');
      } else {
        final err = json.decode(r.body)['message'] ?? r.statusCode;
        _toast('GitHub error: $err', error: true);
      }
    } catch (e) {
      _toast('Save failed: $e', error: true);
    } finally {
      setState(() => _saving = false);
    }
  }

  // ── Quad availability ─────────────────────────────────────────────────────
  void _toggleQuad(int index, String status) {
    setState(() {
      _quads[index]['status'] =
          status == 'available' ? 'maintenance' : 'available';
      _dirty = true;
    });
  }

  // ── Sync from app button ──────────────────────────────────────────────────
  void _syncAndMark() {
    _syncQuadsFromApp();
    setState(() => _dirty = true);
    _toast('Synced ${_quads.length} quads from fleet');
  }

  // ── Promo management ──────────────────────────────────────────────────────
  void _togglePromo(int index) {
    setState(() {
      _promos[index]['active'] = !(_promos[index]['active'] as bool? ?? false);
      _dirty = true;
    });
  }

  void _addPromo(String code, int discount) {
    setState(() {
      _promos.add({'code': code.toUpperCase(), 'discount': discount, 'active': true});
      _dirty = true;
    });
  }

  void _deletePromo(int index) {
    setState(() { _promos.removeAt(index); _dirty = true; });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  void _toast(String msg, {bool error = false}) {
    showToast(context, msg, error: error);
  }

  void _mark() => setState(() => _dirty = true);

  void _showTokenDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Theme.of(context).cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('GitHub API Token',
            style: TextStyle(fontFamily: 'Playfair', fontWeight: FontWeight.w700)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('A GitHub Personal Access Token with repo write access is needed to update the website.',
              style: TextStyle(fontSize: 13, color: context.rq.muted, height: 1.6)),
          const SizedBox(height: 16),
          TextField(
            controller: _tokenCtrl,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'Token (ghp_...)',
              prefixIcon: Icon(Icons.key_rounded, size: 18),
            ),
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              final t = _tokenCtrl.text.trim();
              if (t.isEmpty) return;
              setState(() => _token = t);
              StorageService.setString(_kTokenPref, t);
              Navigator.pop(context);
              _fetchSha().then((_) => _saveToGitHub());
            },
            child: const Text('Save & Update'),
          ),
        ],
      ),
    );
  }

  void _showAddPromoDialog() {
    final codeCtrl = TextEditingController();
    final discCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Theme.of(context).cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('New Promo Code',
            style: TextStyle(fontFamily: 'Playfair', fontWeight: FontWeight.w700)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(
            controller: codeCtrl,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(labelText: 'Code', prefixIcon: Icon(Icons.sell_rounded, size: 18)),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: discCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Discount %', prefixIcon: Icon(Icons.percent_rounded, size: 18)),
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              final code = codeCtrl.text.trim();
              final disc = int.tryParse(discCtrl.text.trim()) ?? 0;
              if (code.length >= 4 && disc > 0 && disc <= 100) {
                _addPromo(code, disc);
                Navigator.pop(context);
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  // ── Build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final accent = Theme.of(context).colorScheme.primary;

    return RefreshIndicator(
      color: accent,
      onRefresh: _loadFromGitHub,
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [

                // ── Header / save bar ───────────────────────────────────────
                _SectionCard(
                  child: Row(children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: accent.withAlpha(18),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(Icons.language_rounded, color: accent, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Website Control', style: TextStyle(
                          fontFamily: 'Playfair', fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: context.rq.text)),
                      Text('baker0o7.github.io/Royal-quads',
                          style: TextStyle(fontSize: 11, color: context.rq.muted)),
                    ])),
                    if (_dirty)
                      FilledButton.icon(
                        onPressed: _saving ? null : _saveToGitHub,
                        icon: _saving
                            ? const SizedBox(width: 14, height: 14,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.cloud_upload_rounded, size: 16),
                        label: Text(_saving ? 'Saving…' : 'Publish'),
                        style: FilledButton.styleFrom(
                            backgroundColor: kGreen,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 10)),
                      )
                    else
                      IconButton(
                        icon: Icon(Icons.refresh_rounded, color: context.rq.muted),
                        onPressed: _loadFromGitHub,
                      ),
                  ]),
                ),

                const SizedBox(height: 12),

                // ── Open / Closed toggle ────────────────────────────────────
                _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  SectionHeading('Business Status', icon: Icons.storefront_rounded),
                  Row(children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(_open ? '🟢  Open — accepting bookings'
                                 : '🔴  Closed — website shows closed banner',
                          style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w600,
                              color: _open ? kGreen : kRed)),
                      const SizedBox(height: 4),
                      Text('Customers see this status in real time.',
                          style: TextStyle(fontSize: 12, color: context.rq.muted)),
                    ])),
                    Switch(
                      value: _open,
                      activeColor: kGreen,
                      onChanged: (v) { setState(() { _open = v; _dirty = true; }); },
                    ),
                  ]),
                ])),

                const SizedBox(height: 12),

                // ── Notice banner ───────────────────────────────────────────
                _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  SectionHeading('Website Notice', icon: Icons.campaign_rounded),
                  TextField(
                    controller: _noticeCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Notice (leave blank for none)',
                      hintText: 'e.g. Closed on public holiday — reopening Monday',
                      prefixIcon: Icon(Icons.announcement_outlined, size: 18),
                    ),
                    onChanged: (v) { _notice = v; _mark(); },
                  ),
                ])),

                const SizedBox(height: 12),

                // ── Quad availability ───────────────────────────────────────
                _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Expanded(child: SectionHeading(
                        'Quad Availability', icon: Icons.directions_bike_rounded)),
                    TextButton.icon(
                      onPressed: _syncAndMark,
                      icon: const Icon(Icons.sync_rounded, size: 16),
                      label: Text('Sync from App'),
                    ),
                  ]),
                  Text('Quad names and list sync automatically from your fleet.',
                      style: TextStyle(fontSize: 12, color: context.rq.muted)),
                  const SizedBox(height: 14),
                  ..._quads.asMap().entries.map((e) {
                    final i = e.key;
                    final q = e.value;
                    final avail = q['status'] == 'available';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: avail
                              ? kGreen.withAlpha(50)
                              : kRed.withAlpha(40),
                          width: 1.5,
                        ),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 4),
                        leading: Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(
                            color: avail
                                ? kGreen.withAlpha(15)
                                : kRed.withAlpha(12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Center(child: Text(
                              q['emoji'] as String? ?? '🏍️',
                              style: const TextStyle(fontSize: 18))),
                        ),
                        title: Text(q['name'] as String? ?? '',
                            style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: context.rq.text)),
                        subtitle: Text(avail ? 'Available' : 'Maintenance',
                            style: TextStyle(
                                fontSize: 12,
                                color: avail ? kGreen : kRed,
                                fontWeight: FontWeight.w600)),
                        trailing: Switch(
                          value: avail,
                          activeColor: kGreen,
                          onChanged: (_) => _toggleQuad(i, q['status'] as String),
                        ),
                      ),
                    );
                  }),
                ])),

                const SizedBox(height: 12),

                // ── Pricing ─────────────────────────────────────────────────
                _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  SectionHeading('Pricing', icon: Icons.payments_rounded),
                  Text('Tap a price to edit it.',
                      style: TextStyle(fontSize: 12, color: context.rq.muted)),
                  const SizedBox(height: 14),
                  GridView.count(
                    crossAxisCount: 3, shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 8, mainAxisSpacing: 8,
                    childAspectRatio: 1.4,
                    children: _pricing.asMap().entries.map((e) {
                      final i = e.key;
                      final p = e.value;
                      final pop = p['popular'] as bool? ?? false;
                      return GestureDetector(
                        onTap: () => _showPriceEdit(i),
                        child: Container(
                          decoration: BoxDecoration(
                            color: pop
                                ? accent.withAlpha(12)
                                : Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: pop ? accent : Theme.of(context).dividerColor,
                              width: pop ? 2 : 1.5,
                            ),
                          ),
                          child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                            Text(p['label'] as String? ?? '',
                                style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                    color: context.rq.text)),
                            const SizedBox(height: 3),
                            Text('${(p['price'] as num).toInt()} KES',
                                style: TextStyle(
                                    fontSize: 11,
                                    color: pop ? accent : context.rq.muted)),
                            if (pop)
                              Container(
                                margin: const EdgeInsets.only(top: 4),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: accent.withAlpha(20),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text('★ Popular',
                                    style: TextStyle(
                                        fontSize: 9, color: accent,
                                        fontWeight: FontWeight.w700)),
                              ),
                          ]),
                        ),
                      );
                    }).toList(),
                  ),
                ])),

                const SizedBox(height: 12),

                // ── Promo codes ─────────────────────────────────────────────
                _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Expanded(child: SectionHeading(
                        'Promo Codes', icon: Icons.sell_rounded)),
                    TextButton.icon(
                      onPressed: _showAddPromoDialog,
                      icon: const Icon(Icons.add_rounded, size: 16),
                      label: Text('Add'),
                    ),
                  ]),
                  if (_promos.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text('No promo codes yet.',
                          style: TextStyle(color: context.rq.muted, fontSize: 13)),
                    )
                  else
                    ..._promos.asMap().entries.map((e) {
                      final i = e.key;
                      final p = e.value;
                      final active = p['active'] as bool? ?? false;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: active
                              ? kGreen.withAlpha(8)
                              : Theme.of(context).cardColor,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: active
                                ? kGreen.withAlpha(40)
                                : Theme.of(context).dividerColor,
                          ),
                        ),
                        child: Row(children: [
                          Expanded(child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                            Text(p['code'] as String? ?? '',
                                style: TextStyle(
                                    fontFamily: 'monospace',
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14,
                                    color: context.rq.text)),
                            Text('${p['discount']}% off — '
                                '${active ? 'Active' : 'Disabled'}',
                                style: TextStyle(
                                    fontSize: 12,
                                    color: active ? kGreen : context.rq.muted)),
                          ])),
                          Switch(
                            value: active,
                            activeColor: kGreen,
                            onChanged: (_) => _togglePromo(i),
                          ),
                          IconButton(
                            icon: Icon(Icons.delete_outline_rounded,
                                size: 18, color: kRed.withAlpha(160)),
                            onPressed: () => _deletePromo(i),
                          ),
                        ]),
                      );
                    }),
                ])),

                const SizedBox(height: 12),

                // ── GitHub token ────────────────────────────────────────────
                _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  SectionHeading('API Token', icon: Icons.key_rounded),
                  Text('GitHub Personal Access Token with repo write scope.',
                      style: TextStyle(fontSize: 12, color: context.rq.muted)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _tokenCtrl,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'Token (ghp_...)',
                      prefixIcon: const Icon(Icons.token_rounded, size: 18),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.save_rounded, size: 18),
                        onPressed: () {
                          final t = _tokenCtrl.text.trim();
                          setState(() => _token = t);
                          StorageService.setString(_kTokenPref, t);
                          _toast('Token saved');
                          _fetchSha();
                        },
                      ),
                    ),
                    onChanged: (v) => setState(() => _token = v),
                  ),
                ])),

                const SizedBox(height: 24),

                // ── Publish button ──────────────────────────────────────────
                if (_dirty)
                  SizedBox(
                    height: 52,
                    child: FilledButton.icon(
                      onPressed: _saving ? null : _saveToGitHub,
                      icon: _saving
                          ? const SizedBox(width: 18, height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.cloud_upload_rounded),
                      label: Text(_saving ? 'Publishing…' : 'Publish Changes to Website'),
                      style: FilledButton.styleFrom(
                          backgroundColor: kGreen,
                          foregroundColor: Colors.white,
                          textStyle: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 15)),
                    ),
                  ),

                const SizedBox(height: 40),
              ],
            ),
    );
  }

  void _showPriceEdit(int index) {
    final p = _pricing[index];
    final ctrl = TextEditingController(text: '${(p['price'] as num).toInt()}');
    final popCtrl = ValueNotifier<bool>(p['popular'] as bool? ?? false);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Theme.of(context).cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Edit — ${p['label']}',
            style: const TextStyle(fontFamily: 'Playfair', fontWeight: FontWeight.w700)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(
            controller: ctrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Price (KES)',
              prefixIcon: Icon(Icons.attach_money_rounded, size: 18),
            ),
          ),
          const SizedBox(height: 12),
          ValueListenableBuilder<bool>(
            valueListenable: popCtrl,
            builder: (_, pop, __) => SwitchListTile(
              value: pop,
              activeColor: Theme.of(context).colorScheme.primary,
              onChanged: (v) => popCtrl.value = v,
              title: const Text('Mark as Popular',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              final price = int.tryParse(ctrl.text.trim());
              if (price != null && price > 0) {
                setState(() {
                  _pricing[index]['price']   = price;
                  _pricing[index]['popular'] = popCtrl.value;
                  // Clear popular flag on all others if this one is popular
                  if (popCtrl.value) {
                    for (var j = 0; j < _pricing.length; j++) {
                      if (j != index) _pricing[j]['popular'] = false;
                    }
                  }
                  _dirty = true;
                });
                Navigator.pop(context);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
class _SectionCard extends StatelessWidget {
  final Widget child;
  const _SectionCard({required this.child});
  @override
  Widget build(BuildContext context) => AppCard(child: child);
}
