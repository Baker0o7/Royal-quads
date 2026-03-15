import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/theme.dart';

class DunesScreen extends StatefulWidget {
  const DunesScreen({super.key});
  @override State<DunesScreen> createState() => _DunesScreenState();
}

class _DunesScreenState extends State<DunesScreen> {
  static const _location = LatLng(-3.3635, 40.1347);
  static const _zoom     = 14.0;

  final _mapCtrl = MapController();
  final _repaintKey = GlobalKey();

  bool _downloading = false;
  bool _mapSaved    = false;
  String? _savedPath;

  @override
  void initState() {
    super.initState();
    _checkSaved();
  }

  Future<void> _checkSaved() async {
    try {
      final dir  = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/dunes_map.png');
      if (await file.exists()) {
        setState(() { _mapSaved = true; _savedPath = file.path; });
      }
    } catch (_) {}
  }

  Future<void> _downloadMap() async {
    setState(() => _downloading = true);
    HapticFeedback.mediumImpact();
    try {
      // Capture the map widget as an image
      await Future.delayed(const Duration(milliseconds: 500));
      final boundary = _repaintKey.currentContext?.findRenderObject()
          as RenderRepaintBoundary?;
      if (boundary == null) throw Exception('Map not ready');

      final image = await boundary.toImage(pixelRatio: 2.5);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      if (bytes == null) throw Exception('Failed to capture map');

      final dir  = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/dunes_map.png');
      await file.writeAsBytes(bytes.buffer.asUint8List());

      setState(() { _mapSaved = true; _savedPath = file.path; });
      if (mounted) showToast(context, 'Map saved for offline use ✅');
    } catch (e) {
      if (mounted) showToast(context, 'Save failed: $e', error: true);
    } finally {
      if (mounted) setState(() => _downloading = false);
    }
  }

  Future<void> _openMaps() async {
    final url = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=${_location.latitude},${_location.longitude}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: CustomScrollView(slivers: [

      // ── AppBar ────────────────────────────────────────────────────────
      SliverAppBar(
        expandedHeight: 140,
        pinned: true,
        flexibleSpace: FlexibleSpaceBar(
          background: Stack(fit: StackFit.expand, children: [
            Container(decoration: const BoxDecoration(gradient: kHeroGradient)),
            CustomPaint(painter: _BigDunesPainter()),
            Positioned(top: 0, left: 0, right: 0,
              child: Container(height: 2,
                  decoration: const BoxDecoration(gradient: kGoldGradient))),
            SafeArea(child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  const Text('Mambrui Sand Dunes',
                      style: TextStyle(fontFamily: 'Playfair', fontSize: 22,
                          fontWeight: FontWeight.w700, color: Colors.white)),
                  const SizedBox(height: 2),
                  Row(children: [
                    Container(width: 6, height: 6,
                        decoration: const BoxDecoration(
                            color: kGreen, shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    const Text('Kilifi County, Kenya · GPS active',
                        style: TextStyle(color: Colors.white54,
                            fontSize: 11, letterSpacing: 0.5)),
                  ]),
                ],
              ),
            )),
          ]),
        ),
        title: const Text('Location',
            style: TextStyle(fontFamily: 'Playfair', color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),

      SliverPadding(
        padding: const EdgeInsets.all(16),
        sliver: SliverList(delegate: SliverChildListDelegate([

          // ── Offline status banner ─────────────────────────────────────
          if (_mapSaved)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: kGreen.withAlpha(15),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: kGreen.withAlpha(40)),
              ),
              child: Row(children: [
                const Icon(Icons.download_done_rounded,
                    color: kGreen, size: 18),
                const SizedBox(width: 10),
                const Expanded(child: Text(
                  'Map saved for offline use',
                  style: TextStyle(color: kGreen,
                      fontWeight: FontWeight.w600, fontSize: 13),
                )),
                TextButton(
                  onPressed: () async {
                    if (_savedPath == null) return;
                    await File(_savedPath!).delete();
                    setState(() { _mapSaved = false; _savedPath = null; });
                  },
                  child: const Text('Remove',
                      style: TextStyle(color: kMuted, fontSize: 12)),
                ),
              ]),
            ),

          // ── Interactive Map ───────────────────────────────────────────
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: SizedBox(
              height: 280,
              child: Stack(children: [
                // Live map (online)
                if (!_mapSaved)
                  RepaintBoundary(
                    key: _repaintKey,
                    child: FlutterMap(
                      mapController: _mapCtrl,
                      options: MapOptions(
                        center: _location,
                        zoom: _zoom,
                        minZoom: 10,
                        maxZoom: 18,
                        interactiveFlags: InteractiveFlag.all,
                      ),
                      children: [
                        TileLayer(
                          urlTemplate:
                              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.royalquadbikes.app',
                          maxZoom: 19,
                        ),
                        MarkerLayer(markers: [
                          Marker(
                            point: _location,
                            width: 56,
                            height: 70,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: kAccent,
                                    borderRadius: BorderRadius.circular(8),
                                    boxShadow: [BoxShadow(
                                        color: kAccent.withAlpha(80),
                                        blurRadius: 8)],
                                  ),
                                  child: const Text('🏍️',
                                      style: TextStyle(fontSize: 14)),
                                ),
                                Container(
                                  width: 2, height: 10,
                                  color: kAccent),
                                Container(
                                  width: 8, height: 8,
                                  decoration: BoxDecoration(
                                    color: kAccent,
                                    shape: BoxShape.circle,
                                    boxShadow: [BoxShadow(
                                        color: kAccent.withAlpha(60),
                                        blurRadius: 6)],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ]),
                      ],
                    ),
                  )
                else
                  // Saved offline map image
                  Image.file(
                    File(_savedPath!),
                    fit: BoxFit.cover,
                    width: double.infinity,
                    height: 280,
                  ),

                // Map overlay controls
                Positioned(
                  bottom: 12, right: 12,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (!_mapSaved) ...[
                        _MapBtn(
                          icon: Icons.add_rounded,
                          onTap: () => _mapCtrl.move(
                              _mapCtrl.center,
                              _mapCtrl.zoom + 1),
                        ),
                        const SizedBox(height: 6),
                        _MapBtn(
                          icon: Icons.remove_rounded,
                          onTap: () => _mapCtrl.move(
                              _mapCtrl.center,
                              _mapCtrl.zoom - 1),
                        ),
                        const SizedBox(height: 6),
                        _MapBtn(
                          icon: Icons.my_location_rounded,
                          onTap: () => _mapCtrl.move(_location, _zoom),
                        ),
                        const SizedBox(height: 6),
                      ],
                    ],
                  ),
                ),

                // Offline / Online badge
                Positioned(
                  top: 12, left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.black.withAlpha(140),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(
                        width: 6, height: 6,
                        decoration: BoxDecoration(
                          color: _mapSaved ? kAccent2 : kGreen,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(_mapSaved ? 'Offline' : 'Live',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 10,
                              fontWeight: FontWeight.w600)),
                    ]),
                  ),
                ),
              ]),
            ),
          ),

          const SizedBox(height: 12),

          // ── Action Buttons ────────────────────────────────────────────
          Row(children: [
            Expanded(child: _ActionCard(
              icon: _mapSaved
                  ? Icons.download_done_rounded
                  : Icons.download_rounded,
              label: _mapSaved ? 'Map Saved' : 'Save Offline',
              color: _mapSaved ? kGreen : kAccent,
              loading: _downloading,
              onTap: _mapSaved ? null : _downloadMap,
            )),
            const SizedBox(width: 12),
            Expanded(child: _ActionCard(
              icon: Icons.map_rounded,
              label: 'Google Maps',
              color: kIndigo,
              onTap: _openMaps,
            )),
          ]),

          const SizedBox(height: 20),

          // ── Info cards ────────────────────────────────────────────────
          SectionHeading('Location Details',
              icon: Icons.info_outline_rounded),

          _InfoCard(icon: Icons.location_on_rounded, color: kRed,
              title: 'Address',
              body: 'Mambrui Sand Dunes\nKilifi County, Kenya\n'
                  '(off the B8 Malindi-Mombasa highway)'),
          const SizedBox(height: 12),
          _InfoCard(icon: Icons.access_time_rounded, color: kAccent,
              title: 'Operating Hours',
              body: 'Daily: 7:00 AM – 7:00 PM\n'
                  'Sunset rides available by appointment'),
          const SizedBox(height: 12),
          _InfoCard(icon: Icons.directions_rounded, color: kIndigo,
              title: 'Getting There',
              body: '• From Malindi: 15 min drive south on B8\n'
                  '• From Watamu: 25 min north on B8\n'
                  '• GPS: ${_location.latitude.toStringAsFixed(4)}, '
                  '${_location.longitude.toStringAsFixed(4)}'),
          const SizedBox(height: 12),
          _InfoCard(icon: Icons.phone_rounded, color: kGreen,
              title: 'Contact',
              body: 'WhatsApp or call for group bookings\n'
                  'M-Pesa Till: 6685024'),

          const SizedBox(height: 20),

          // ── Dune Facts ────────────────────────────────────────────────
          SectionHeading('About the Dunes',
              icon: Icons.terrain_rounded),
          AppCard(child: const Column(children: [
            _DuneFact('🏔️', 'Height',  'Dunes rise up to 30 metres'),
            _DuneFact('🌡️', 'Climate', 'Best Oct–Feb, cooler mornings'),
            _DuneFact('🏍️', 'Terrain', 'Soft sand, steep faces, ridge runs'),
            _DuneFact('📸', 'Views',   'Indian Ocean visible from the crest'),
            _DuneFact('🌊', 'Distance','2 km from the Indian Ocean shoreline'),
          ])),

          const SizedBox(height: 48),
        ])),
      ),
    ]),
  );
}

// ── Map control button ────────────────────────────────────────────────────────
class _MapBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _MapBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 36, height: 36,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: kShadowMd,
      ),
      child: Icon(icon, size: 20, color: kText),
    ),
  );
}

// ── Action card button ────────────────────────────────────────────────────────
class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool loading;
  final VoidCallback? onTap;
  const _ActionCard({required this.icon, required this.label,
      required this.color, this.loading = false, this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: onTap == null ? color.withAlpha(30) : color,
        borderRadius: BorderRadius.circular(14),
        boxShadow: onTap == null ? null : [
          BoxShadow(color: color.withAlpha(60),
              blurRadius: 12, offset: const Offset(0, 3))],
      ),
      child: loading
          ? const Center(child: SizedBox(width: 20, height: 20,
              child: CircularProgressIndicator(
                  color: Colors.white, strokeWidth: 2)))
          : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(icon, color: Colors.white, size: 17),
              const SizedBox(width: 7),
              Text(label, style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.w700,
                  fontSize: 13)),
            ]),
    ),
  );
}

// ── Info card ─────────────────────────────────────────────────────────────────
class _InfoCard extends StatelessWidget {
  final IconData icon; final Color color;
  final String title, body;
  const _InfoCard({required this.icon, required this.color,
      required this.title, required this.body});

  @override
  Widget build(BuildContext context) => AppCard(
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 38, height: 38,
        decoration: BoxDecoration(
          color: color.withAlpha(15),
          borderRadius: BorderRadius.circular(11)),
        child: Icon(icon, color: color, size: 19)),
      const SizedBox(width: 12),
      Expanded(child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(
              fontWeight: FontWeight.w700, fontSize: 13)),
          const SizedBox(height: 4),
          Text(body, style: const TextStyle(
              color: kMuted, fontSize: 12, height: 1.6)),
        ],
      )),
    ]),
  );
}

class _DuneFact extends StatelessWidget {
  final String emoji, label, value;
  const _DuneFact(this.emoji, this.label, this.value);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(children: [
      Text(emoji, style: const TextStyle(fontSize: 18)),
      const SizedBox(width: 12),
      Text(label, style: const TextStyle(
          color: kMuted, fontSize: 13, fontWeight: FontWeight.w600)),
      const Spacer(),
      Text(value, style: const TextStyle(
          fontSize: 12, fontWeight: FontWeight.w500)),
    ]),
  );
}

// ── Painters ──────────────────────────────────────────────────────────────────
class _BigDunesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    for (var i = 0; i < 3; i++) {
      final paint = Paint()
        ..color = kAccent.withAlpha(10 + i * 8);
      final path = Path()
        ..moveTo(0, size.height)
        ..lineTo(0, size.height * (0.5 + i * 0.1))
        ..cubicTo(
          size.width * 0.25, size.height * (0.3 + i * 0.08),
          size.width * 0.55, size.height * (0.45 + i * 0.07),
          size.width * 0.70, size.height * (0.38 + i * 0.07))
        ..cubicTo(
          size.width * 0.82, size.height * (0.32 + i * 0.07),
          size.width * 0.92, size.height * (0.44 + i * 0.06),
          size.width,        size.height * (0.42 + i * 0.06))
        ..lineTo(size.width, size.height)
        ..close();
      canvas.drawPath(path, paint);
    }
  }
  @override bool shouldRepaint(_) => false;
}
