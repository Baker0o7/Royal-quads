import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/theme.dart';

class DunesScreen extends StatelessWidget {
  const DunesScreen({super.key});

  static const _lat  = -3.3635;
  static const _lng  = 40.1347;

  @override
  Widget build(BuildContext context) => Scaffold(
    body: CustomScrollView(slivers: [
      SliverAppBar(
        expandedHeight: 160,
        pinned: true,
        flexibleSpace: FlexibleSpaceBar(
          background: Stack(fit: StackFit.expand, children: [
            Container(decoration: const BoxDecoration(gradient: kHeroGradient)),
            CustomPaint(painter: _BigDunesPainter()),
            Positioned(top: 2, left: 0, right: 0,
              child: Container(height: 2,
                  decoration: const BoxDecoration(gradient: kGoldGradient))),
            SafeArea(child: Center(child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: kAccent.withAlpha(20),
                    shape: BoxShape.circle,
                    border: Border.all(color: kAccent.withAlpha(60)),
                  ),
                  child: const Icon(Icons.terrain_rounded,
                      color: kAccent2, size: 28)),
                const SizedBox(height: 8),
                const Text('Mambrui Sand Dunes',
                    style: TextStyle(fontFamily: 'Playfair', fontSize: 20,
                        fontWeight: FontWeight.w700, color: Colors.white)),
                const Text('Kilifi County, Kenya',
                    style: TextStyle(color: Colors.white38, fontSize: 11,
                        letterSpacing: 1)),
              ],
            ))),
          ]),
        ),
        title: const Text('Location',
            style: TextStyle(fontFamily: 'Playfair')),
      ),

      SliverPadding(
        padding: const EdgeInsets.all(16),
        sliver: SliverList(delegate: SliverChildListDelegate([

          // ── Map placeholder card ─────────────────────────────────────
          Container(
            height: 220,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: kBorder),
              color: kCard,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(fit: StackFit.expand, children: [
                // Satellite-style painted map
                CustomPaint(painter: _MapPainter()),
                // Pin overlay
                Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: kRed,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(
                            color: kRed.withAlpha(80), blurRadius: 16)],
                      ),
                      padding: const EdgeInsets.all(8),
                      child: const Icon(Icons.place_rounded,
                          color: Colors.white, size: 22),
                    ),
                    Container(
                      width: 2,
                      height: 16,
                      color: kRed.withAlpha(60),
                    ),
                    Container(
                      width: 10, height: 4,
                      decoration: BoxDecoration(
                        color: kRed.withAlpha(30),
                        borderRadius: BorderRadius.circular(5),
                      ),
                    ),
                  ],
                )),
                // Tap overlay
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () => _openMaps(),
                    child: const SizedBox.expand(),
                  ),
                ),
              ]),
            ),
          ),

          const SizedBox(height: 12),

          // Open in maps button
          _MapBtn(
            icon: Icons.map_rounded,
            label: 'Open in Google Maps',
            color: kGreen,
            onTap: _openMaps,
          ),

          const SizedBox(height: 20),

          // ── Info cards ────────────────────────────────────────────────
          SectionHeading('Location Details', icon: Icons.info_outline_rounded),

          _InfoCard(
            icon: Icons.location_on_rounded,
            color: kRed,
            title: 'Address',
            body: 'Mambrui Sand Dunes\nKilifi County, Kenya\n(off the B8 highway)',
          ),
          const SizedBox(height: 12),
          _InfoCard(
            icon: Icons.access_time_rounded,
            color: kAccent,
            title: 'Operating Hours',
            body: 'Daily: 7:00 AM – 7:00 PM\nSunset rides available by appointment',
          ),
          const SizedBox(height: 12),
          _InfoCard(
            icon: Icons.directions_rounded,
            color: kIndigo,
            title: 'Getting There',
            body: '• From Malindi: 15 min drive south on B8\n'
                '• From Watamu: 25 min north on B8\n'
                '• GPS: ${_lat.toStringAsFixed(4)}, ${_lng.toStringAsFixed(4)}',
          ),
          const SizedBox(height: 12),
          _InfoCard(
            icon: Icons.phone_rounded,
            color: kGreen,
            title: 'Contact',
            body: 'WhatsApp or call for bookings\nM-Pesa Till: 6685024',
          ),

          const SizedBox(height: 20),

          // ── Fun facts ─────────────────────────────────────────────────
          SectionHeading('About the Dunes', icon: Icons.terrain_rounded),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kHeroFrom.withAlpha(8),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: kBorder),
            ),
            child: const Column(children: [
              _DuneFact('🏔️', 'Height', 'Dunes rise up to 30 metres'),
              _DuneFact('🌡️', 'Climate', 'Best Oct–Feb, cooler mornings'),
              _DuneFact('🏍️', 'Terrain', 'Soft sand, steep faces, ridge runs'),
              _DuneFact('📸', 'Views', 'Indian Ocean visible from the crest'),
            ]),
          ),

          const SizedBox(height: 48),
        ])),
      ),
    ]),
  );

  static Future<void> _openMaps() async {
    final url = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=$_lat,$_lng');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }
}

class _MapBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _MapBtn({required this.icon, required this.label,
      required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(
            color: color.withAlpha(60), blurRadius: 12,
            offset: const Offset(0, 4))],
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: Colors.white, size: 18),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(
            color: Colors.white, fontWeight: FontWeight.w700)),
      ]),
    ),
  );
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title, body;
  const _InfoCard({required this.icon, required this.color,
      required this.title, required this.body});

  @override
  Widget build(BuildContext context) => AppCard(
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
          color: color.withAlpha(15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 18),
      ),
      const SizedBox(width: 12),
      Expanded(child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(
              fontWeight: FontWeight.w700, fontSize: 13)),
          const SizedBox(height: 4),
          Text(body, style: const TextStyle(
              color: kMuted, fontSize: 12, height: 1.5)),
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
    padding: const EdgeInsets.symmetric(vertical: 7),
    child: Row(children: [
      Text(emoji, style: const TextStyle(fontSize: 18)),
      const SizedBox(width: 12),
      Text(label, style: const TextStyle(
          color: kMuted, fontSize: 13, fontWeight: FontWeight.w600)),
      const Spacer(),
      Text(value, style: const TextStyle(
          fontSize: 12, color: kText, fontWeight: FontWeight.w500)),
    ]),
  );
}

// ── Painters ────────────────────────────────────────────────────────────────

class _BigDunesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    for (var i = 0; i < 3; i++) {
      final t = (i + 1) / 4.0;
      final paint = Paint()
        ..color = kAccent.withAlpha((10 + i * 8));
      final path = Path()
        ..moveTo(0, size.height)
        ..lineTo(0, size.height * (0.5 + i * 0.1))
        ..cubicTo(
          size.width * 0.25, size.height * (0.3 + i * 0.08),
          size.width * 0.55, size.height * (0.45 + i * 0.07),
          size.width * 0.70, size.height * (0.38 + i * 0.07),
        )
        ..cubicTo(
          size.width * 0.82, size.height * (0.32 + i * 0.07),
          size.width * 0.92, size.height * (0.44 + i * 0.06),
          size.width,        size.height * (0.42 + i * 0.06),
        )
        ..lineTo(size.width, size.height)
        ..close();
      canvas.drawPath(path, paint);
    }
  }
  @override bool shouldRepaint(_) => false;
}

class _MapPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Sky
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height * 0.4),
        Paint()..color = const Color(0xFF87CEEB).withAlpha(80));

    // Ocean
    canvas.drawRect(
        Rect.fromLTWH(0, 0, size.width * 0.18, size.height),
        Paint()..color = const Color(0xFF1A6896).withAlpha(80));

    // Ground / sand
    canvas.drawRect(
        Rect.fromLTWH(size.width * 0.18, 0, size.width * 0.82, size.height),
        Paint()..color = const Color(0xFFDEB887).withAlpha(80));

    // Dune ridges
    final dune = Paint()..color = const Color(0xFFC19A5B).withAlpha(100);
    for (var i = 0; i < 4; i++) {
      final path = Path()
        ..moveTo(size.width * (0.2 + i * 0.18), size.height)
        ..cubicTo(
          size.width * (0.3 + i * 0.18), size.height * 0.3,
          size.width * (0.35 + i * 0.18), size.height * 0.35,
          size.width * (0.42 + i * 0.18), size.height,
        )
        ..close();
      canvas.drawPath(path, dune);
    }

    // Road
    final road = Paint()..color = const Color(0xFF888888).withAlpha(120)
        ..strokeWidth = 6;
    canvas.drawLine(Offset(size.width * 0.75, 0),
        Offset(size.width * 0.75, size.height), road);

    // Center dot (location)
    canvas.drawCircle(Offset(size.width / 2, size.height / 2),
        18, Paint()..color = kRed.withAlpha(30));
    canvas.drawCircle(Offset(size.width / 2, size.height / 2),
        6, Paint()..color = kRed.withAlpha(180));
  }
  @override bool shouldRepaint(_) => false;
}
