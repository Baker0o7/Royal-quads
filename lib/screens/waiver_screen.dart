import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/storage.dart';
import '../theme/theme.dart';

class WaiverScreen extends StatefulWidget {
  final int bookingId;
  const WaiverScreen({super.key, required this.bookingId});
  @override State<WaiverScreen> createState() => _WaiverScreenState();
}

class _WaiverScreenState extends State<WaiverScreen>
    with SingleTickerProviderStateMixin {
  bool _agreed  = false;
  bool _loading = false;
  late AnimationController _checkCtrl;

  @override
  void initState() {
    super.initState();
    _checkCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
  }

  @override
  void dispose() { _checkCtrl.dispose(); super.dispose(); }

  Future<void> _sign() async {
    setState(() => _loading = true);
    try {
      final bookings = StorageService.getBookings().map((b) =>
          b.id == widget.bookingId ? b.copyWith(waiverSigned: true) : b
      ).toList();
      await StorageService.saveBookings(bookings);
      _checkCtrl.forward();
      await Future.delayed(const Duration(milliseconds: 800));
      if (!mounted) return;
      showToast(context, 'Waiver signed ✅');
      context.pop();
    } catch (e) {
      if (mounted) showToast(context, '$e', error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    body: CustomScrollView(slivers: [
      SliverAppBar(
        expandedHeight: 120, pinned: true,
        flexibleSpace: FlexibleSpaceBar(
          background: Stack(fit: StackFit.expand, children: [
            Container(decoration: const BoxDecoration(gradient: kHeroGradient)),
            Container(decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [kRed.withAlpha(20), Colors.transparent],
                begin: Alignment.topLeft, end: Alignment.bottomRight))),
          ]),
          title: const Text('Safety Waiver',
              style: TextStyle(fontFamily: 'Playfair',
                  fontSize: 17, color: Colors.white)),
        ),
        leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
            onPressed: () => context.pop()),
      ),

      SliverPadding(
        padding: const EdgeInsets.all(16),
        sliver: SliverList(delegate: SliverChildListDelegate([

          // ── Warning banner ──────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kRed.withAlpha(8),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: kRed.withAlpha(40))),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: kRed.withAlpha(15),
                  borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.warning_amber_rounded,
                    color: kRed, size: 22)),
              const SizedBox(width: 12),
              const Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('SAFETY WAIVER & RELEASE',
                      style: TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 13,
                          color: kRed, letterSpacing: 0.3)),
                  SizedBox(height: 4),
                  Text('Please read all terms carefully before signing.',
                      style: TextStyle(color: kMuted, fontSize: 12, height: 1.4)),
                ],
              )),
            ]),
          ),

          const SizedBox(height: 16),

          // ── Clauses ─────────────────────────────────────────────────────
          AppCard(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: _waiverClauses.asMap().entries.map((e) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  margin: const EdgeInsets.only(top: 2),
                  width: 22, height: 22,
                  decoration: BoxDecoration(
                    color: kAccent.withAlpha(15),
                    shape: BoxShape.circle),
                  child: Center(child: Text('${e.key + 1}', style: const TextStyle(
                      color: kAccent, fontSize: 10,
                      fontWeight: FontWeight.w800)))),
                const SizedBox(width: 10),
                Expanded(child: Text(e.value, style: const TextStyle(
                    fontSize: 13, height: 1.5, color: kText))),
              ]),
            )).toList(),
          )),

          const SizedBox(height: 16),

          // ── Agree checkbox ───────────────────────────────────────────────
          GestureDetector(
            onTap: () => setState(() => _agreed = !_agreed),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _agreed ? kGreen.withAlpha(10) : kCard,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                    color: _agreed ? kGreen.withAlpha(60) : kBorder,
                    width: _agreed ? 1.5 : 1),
                boxShadow: kShadowSm,
              ),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 24, height: 24,
                  decoration: BoxDecoration(
                    color: _agreed ? kGreen : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                        color: _agreed ? kGreen : kBorder, width: 2)),
                  child: _agreed
                      ? const Icon(Icons.check_rounded,
                          color: Colors.white, size: 16)
                      : null),
                const SizedBox(width: 12),
                const Expanded(child: Text(
                  'I have read and agree to all terms above. I accept full responsibility for my safety during the ride.',
                  style: TextStyle(fontSize: 13, height: 1.5))),
              ]),
            ),
          ),

          const SizedBox(height: 20),

          // ── Sign button ──────────────────────────────────────────────────
          AnimatedOpacity(
            opacity: _agreed ? 1.0 : 0.4,
            duration: const Duration(milliseconds: 200),
            child: PrimaryButton(
              label: 'Sign & Proceed',
              icon: Icons.draw_rounded,
              color: kGreen,
              loading: _loading,
              onTap: _agreed ? _sign : null,
            ),
          ),

          const SizedBox(height: 48),
        ])),
      ),
    ]),
  );
}

const _waiverClauses = [
  'I voluntarily participate in quad biking activities at Royal Quad Bikes, Mambrui.',
  'I acknowledge that quad biking involves inherent risks including falls, collisions, and physical injury.',
  'I confirm that I am in good physical health and have no medical conditions that would prevent safe participation.',
  'I agree to wear all provided safety equipment including helmet and protective gear at all times.',
  'I will follow all instructions given by Royal Quad Bikes staff and operate the vehicle responsibly.',
  'I will not operate the vehicle under the influence of alcohol or any substances.',
  'I accept full financial responsibility for any damage caused to the vehicle through negligent operation.',
  'I release Royal Quad Bikes and its employees from any liability for injury resulting from participation.',
  'Parents or guardians must sign on behalf of minors under 18 years of age.',
];
