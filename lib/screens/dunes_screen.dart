import 'dart:io';
import 'dart:math' show pi, pow, log, tan, cos;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/theme.dart';

const double _lat = -3.3635;
const double _lng = 40.1347;

class DunesScreen extends StatefulWidget {
  const DunesScreen({super.key});
  @override State<DunesScreen> createState() => _DunesScreenState();
}

class _DunesScreenState extends State<DunesScreen> {
  final _repaintKey = GlobalKey();
  bool    _downloading = false;
  bool    _mapSaved    = false;
  String? _savedPath;
  int     _zoom        = 14;

  @override
  void initState() {
    super.initState();
    _checkSaved();
  }

  Future<void> _checkSaved() async {
    try {
      final dir  = await getApplicationDocumentsDirectory();
      final file = File('\${dir.path}/dunes_map.png');
      if (await file.exists()) {
        setState(() { _mapSaved = true; _savedPath = file.path; });
      }
    } catch (_) {}
  }

  Future<void> _saveMap() async {
    setState(() => _downloading = true);
    HapticFeedback.mediumImpact();
    try {
      await Future.delayed(const Duration(milliseconds: 400));
      final boundary = _repaintKey.currentContext
          ?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) throw Exception('Map not ready');
      final image = await boundary.toImage(pixelRatio: 2.0);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      if (bytes == null) throw Exception('Capture failed');
      final dir  = await getApplicationDocumentsDirectory();
      final file = File('\${dir.path}/dunes_map.png');
      await file.writeAsBytes(bytes.buffer.asUint8List());
      setState(() { _mapSaved = true; _savedPath = file.path; });
      if (mounted) showToast(context, 'Map saved for offline use');
    } catch (e) {
      if (mounted) showToast(context, 'Save failed', error: true);
    } finally {
      if (mounted) setState(() => _downloading = false);
    }
  }

  Future<void> _deleteMap() async {
    if (_savedPath == null) return;
    await File(_savedPath!).delete().catchError((_) {});
    setState(() { _mapSaved = false; _savedPath = null; });
    showToast(context, 'Offline map removed');
  }

  Future<void> _openGoogleMaps() async {
    final url = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=$_lat,$_lng');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openDirections() async {
    final url = Uri.parse(
        'https://www.google.com/maps/dir/?api=1&destination=$_lat,$_lng');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: CustomScrollView(slivers: [
      SliverAppBar(
        expandedHeight: 160,
        pinned: true,
        // No title or leading — they overlap the hero content
        // The back button and screen title are embedded in the hero
        automaticallyImplyLeading: false,
        flexibleSpace: FlexibleSpaceBar(
          background: Stack(fit: StackFit.expand, children: [
            Container(decoration: BoxDecoration(gradient: heroGradient(context))),
            CustomPaint(painter: _DunesPainter()),
            Positioned(top: 0, left: 0, right: 0,
              child: Container(height: 2,
                  decoration: const BoxDecoration(gradient: kGoldGradient))),
            // Content pushed below status bar + toolbar so nothing overlaps
            SafeArea(child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Back row
                  Row(children: [
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.arrow_back_rounded,
                            color: Colors.white, size: 18)),
                    ),
                    const SizedBox(width: 12),
                    const Text('Location', style: TextStyle(
                        color: Colors.white54, fontSize: 13,
                        letterSpacing: 0.3)),
                  ]),
                  const SizedBox(height: 10),
                  const Text('Mambrui Sand Dunes',
                      style: TextStyle(fontFamily: 'Playfair', fontSize: 22,
                          fontWeight: FontWeight.w700, color: Colors.white)),
                  const SizedBox(height: 3),
                  Row(children: [
                    Container(width: 6, height: 6,
                        decoration: const BoxDecoration(
                            color: kGreen, shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    const Text('Kilifi County, Kenya',
                        style: TextStyle(color: Colors.white54, fontSize: 11)),
                  ]),
                ],
              ),
            )),
          ]),
        ),
      ),

      SliverPadding(
        padding: const EdgeInsets.all(16),
        sliver: SliverList(delegate: SliverChildListDelegate([

          if (_mapSaved)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: kGreen.withAlpha(15),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: kGreen.withAlpha(40)),
              ),
              child: Row(children: [
                const Icon(Icons.download_done_rounded,
                    color: kGreen, size: 18),
                const SizedBox(width: 10),
                const Expanded(child: Text('Map saved for offline use',
                    style: TextStyle(color: kGreen,
                        fontWeight: FontWeight.w600, fontSize: 13))),
                TextButton(
                  onPressed: _deleteMap,
                  child: const Text('Remove',
                      style: TextStyle(color: kMuted, fontSize: 12)),
                ),
              ]),
            ),

          // Map tile display
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: SizedBox(
              height: 280,
              child: Stack(children: [
                RepaintBoundary(
                  key: _repaintKey,
                  child: _mapSaved && _savedPath != null
                      ? Image.file(File(_savedPath!),
                          fit: BoxFit.cover,
                          width: double.infinity, height: 280)
                      : _TileMapView(lat: _lat, lng: _lng, zoom: _zoom),
                ),

                // Live/Offline badge
                Positioned(top: 12, left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                        color: Colors.black.withAlpha(150),
                        borderRadius: BorderRadius.circular(20)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(width: 6, height: 6,
                          decoration: BoxDecoration(
                            color: _mapSaved ? kAccent2 : kGreen,
                            shape: BoxShape.circle)),
                      const SizedBox(width: 5),
                      Text(_mapSaved ? 'Offline' : 'Live',
                          style: const TextStyle(color: Colors.white,
                              fontSize: 10, fontWeight: FontWeight.w600)),
                    ]),
                  ),
                ),

                // Zoom controls
                if (!_mapSaved)
                  Positioned(bottom: 12, right: 12,
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      _ZoomBtn(Icons.add_rounded,
                          () => setState(() =>
                              _zoom = (_zoom + 1).clamp(10, 18))),
                      const SizedBox(height: 6),
                      _ZoomBtn(Icons.remove_rounded,
                          () => setState(() =>
                              _zoom = (_zoom - 1).clamp(10, 18))),
                    ]),
                  ),

                // Location pin overlay
                Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: kAccent,
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [BoxShadow(
                            color: kAccent.withAlpha(80), blurRadius: 10)],
                      ),
                      child: const Text('🏍️ Royal Quad Bikes',
                          style: TextStyle(color: Colors.white,
                              fontWeight: FontWeight.w700, fontSize: 12))),
                    Container(width: 2, height: 12, color: kAccent),
                    Container(width: 10, height: 10,
                        decoration: BoxDecoration(
                          color: kAccent, shape: BoxShape.circle,
                          boxShadow: [BoxShadow(
                              color: kAccent.withAlpha(80), blurRadius: 8)],
                        )),
                  ],
                )),
              ]),
            ),
          ),
          const SizedBox(height: 12),

          // Action buttons
          Row(children: [
            Expanded(child: _ActionBtn(
              icon: _mapSaved
                  ? Icons.download_done_rounded : Icons.download_rounded,
              label: _mapSaved ? 'Saved' : 'Save Offline',
              color: _mapSaved ? kGreen : kAccent,
              loading: _downloading,
              onTap: _mapSaved ? null : _saveMap,
            )),
            const SizedBox(width: 10),
            Expanded(child: _ActionBtn(
              icon: Icons.map_rounded,
              label: 'Google Maps',
              color: kIndigo,
              onTap: _openGoogleMaps,
            )),
            const SizedBox(width: 10),
            Expanded(child: _ActionBtn(
              icon: Icons.directions_rounded,
              label: 'Directions',
              color: kGreen,
              onTap: _openDirections,
            )),
          ]),
          const SizedBox(height: 20),

          SectionHeading('Location Details',
              icon: Icons.info_outline_rounded),
          _InfoCard(icon: Icons.location_on_rounded, color: kRed,
              title: 'Address',
              body: 'Mambrui Sand Dunes\nKilifi County, Kenya\n'
                  'Off the B8 Malindi-Mombasa highway'),
          const SizedBox(height: 12),
          _InfoCard(icon: Icons.access_time_rounded, color: kAccent,
              title: 'Operating Hours',
              body: 'Daily: 7:00 AM - 7:00 PM\nSunset rides by appointment'),
          const SizedBox(height: 12),
          _InfoCard(icon: Icons.directions_car_rounded, color: kIndigo,
              title: 'Getting There',
              body: '- From Malindi: 15 min south on B8\n'
                  '- From Watamu: 25 min north on B8\n'
                  'GPS: $_lat, $_lng'),
          const SizedBox(height: 12),
          _InfoCard(icon: Icons.phone_rounded, color: kGreen,
              title: 'Contact',
              body: 'WhatsApp or call for group bookings\nM-Pesa Till: 6685024'),
          const SizedBox(height: 20),

          SectionHeading('About the Dunes', icon: Icons.terrain_rounded),
          AppCard(child: const Column(children: [
            _Fact('🏔️', 'Height',   'Rise up to 30 metres'),
            _Fact('🌡️', 'Climate',  'Best Oct-Feb, cooler mornings'),
            _Fact('🏍️', 'Terrain',  'Soft sand, steep faces, ridge runs'),
            _Fact('📸', 'Views',    'Indian Ocean visible from the crest'),
            _Fact('🌊', 'Distance', '2 km from the Indian Ocean shoreline'),
          ])),
          const SizedBox(height: 48),
        ])),
      ),
    ]),
  );
}

// OSM tile grid — 3×3 tiles centred on the location
class _TileMapView extends StatelessWidget {
  final double lat, lng;
  final int zoom;
  const _TileMapView({required this.lat, required this.lng, required this.zoom});

  int _xTile(int z) => ((lng + 180) / 360 * pow(2, z)).floor();
  int _yTile(int z) {
    final latR = lat * pi / 180;
    return ((1 - log(tan(latR) + 1 / cos(latR)) / pi) / 2 * pow(2, z)).floor();
  }

  @override
  Widget build(BuildContext context) {
    final x = _xTile(zoom);
    final y = _yTile(zoom);
    return Stack(fit: StackFit.expand, children: [
      Container(color: const Color(0xFFAAD3DF)),
      GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3, childAspectRatio: 1),
        itemCount: 9,
        itemBuilder: (_, i) {
          final dx = (i % 3) - 1;
          final dy = (i ~/ 3) - 1;
          final url =
              'https://tile.openstreetmap.org/$zoom/${x + dx}/${y + dy}.png';
          return Image.network(url, fit: BoxFit.cover,
              errorBuilder: (_, __, ___) =>
                  Container(color: const Color(0xFFD4E8B4)));
        },
      ),
    ]);
  }
}

class _ZoomBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _ZoomBtn(this.icon, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 34, height: 34,
      decoration: BoxDecoration(color: Colors.white,
          borderRadius: BorderRadius.circular(8), boxShadow: kShadowMd),
      child: Icon(icon, size: 18, color: kText),
    ),
  );
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool loading;
  final VoidCallback? onTap;
  const _ActionBtn({required this.icon, required this.label,
      required this.color, this.loading = false, this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: onTap == null ? color.withAlpha(30) : color,
        borderRadius: BorderRadius.circular(12),
        boxShadow: onTap == null ? null : [
          BoxShadow(color: color.withAlpha(50),
              blurRadius: 10, offset: const Offset(0, 3))],
      ),
      child: loading
          ? const Center(child: SizedBox(width: 18, height: 18,
              child: CircularProgressIndicator(
                  color: Colors.white, strokeWidth: 2)))
          : Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(icon, color: Colors.white, size: 18),
              const SizedBox(height: 3),
              Text(label, style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.w700,
                  fontSize: 10)),
            ]),
    ),
  );
}

class _InfoCard extends StatelessWidget {
  final IconData icon; final Color color;
  final String title, body;
  const _InfoCard({required this.icon, required this.color,
      required this.title, required this.body});
  @override
  Widget build(BuildContext context) => AppCard(
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(width: 38, height: 38,
          decoration: BoxDecoration(color: color.withAlpha(15),
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

class _Fact extends StatelessWidget {
  final String emoji, label, value;
  const _Fact(this.emoji, this.label, this.value);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(children: [
      Text(emoji, style: const TextStyle(fontSize: 18)),
      const SizedBox(width: 12),
      Text(label, style: const TextStyle(
          color: kMuted, fontSize: 13, fontWeight: FontWeight.w600)),
      const Spacer(),
      Text(value, style: const TextStyle(fontSize: 12)),
    ]),
  );
}

class _DunesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    for (var i = 0; i < 3; i++) {
      final paint = Paint()..color = kAccent.withAlpha(10 + i * 8);
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
