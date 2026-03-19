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
  final _scroll    = ScrollController();
  bool _readAll    = false;
  bool _agreed     = false;
  bool _loading    = false;
  bool _signed     = false;

  late AnimationController _successCtrl;
  late Animation<double>   _successScale;
  late Animation<double>   _successFade;

  @override
  void initState() {
    super.initState();
    _successCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _successScale = CurvedAnimation(
        parent: _successCtrl, curve: Curves.elasticOut);
    _successFade  = CurvedAnimation(
        parent: _successCtrl, curve: Curves.easeOut);

    _scroll.addListener(() {
      if (!_readAll) {
        final maxScroll = _scroll.position.maxScrollExtent;
        if (maxScroll <= 0 || _scroll.offset >= maxScroll - 60) {
          setState(() => _readAll = true);
        }
      }
    });

    // Mark as read immediately if content fits without scrolling
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        if (_scroll.position.maxScrollExtent <= 0) {
          setState(() => _readAll = true);
        }
      }
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    _successCtrl.dispose();
    super.dispose();
  }

  Future<void> _sign() async {
    setState(() => _loading = true);
    try {
      final bookings = StorageService.getBookings().map((b) =>
          b.id == widget.bookingId ? b.copyWith(waiverSigned: true) : b
      ).toList();
      await StorageService.saveBookings(bookings);
      setState(() { _loading = false; _signed = true; });
      await _successCtrl.forward();
      await Future.delayed(const Duration(milliseconds: 900));
      if (!mounted) return;
      showToast(context, 'Waiver signed ✅');
      // Record waiver signature for 30-day expiry
      final booking = StorageService.getBookingById(widget.bookingId);
      if (booking != null) {
        await StorageService.recordWaiverSigned(booking.customerPhone);
      }
      if (!mounted) return;
      context.go('/ticket/${widget.bookingId}');
    } catch (e) {
      if (mounted) showToast(context, '$e', error: true);
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(children: [
        CustomScrollView(controller: _scroll, slivers: [
          // ── App Bar ──────────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 140, pinned: true, elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.parallax,
              background: Container(
                decoration: const BoxDecoration(gradient: kHeroGradient),
                child: Stack(children: [
                  // Red accent wash
                  Positioned.fill(child: Container(decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [kRed.withAlpha(25), Colors.transparent],
                      begin: Alignment.topLeft, end: Alignment.bottomRight,
                    ),
                  ))),
                  // Gold top line
                  Positioned(top: 0, left: 0, right: 0,
                    child: Container(height: 2,
                      decoration: const BoxDecoration(gradient: kGoldGradient))),
                  // Content
                  SafeArea(child: Center(child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: kRed.withAlpha(20),
                          shape: BoxShape.circle,
                          border: Border.all(color: kRed.withAlpha(60)),
                        ),
                        child: const Icon(Icons.shield_rounded,
                            color: kRed, size: 22)),
                      const SizedBox(height: 10),
                      const Text('Safety Waiver',
                          style: TextStyle(fontFamily: 'Playfair',
                              fontSize: 20, fontWeight: FontWeight.w700,
                              color: Colors.white)),
                      const SizedBox(height: 2),
                      const Text('READ ALL CLAUSES BEFORE SIGNING',
                          style: TextStyle(color: Colors.white30,
                              fontSize: 9, letterSpacing: 2.5)),
                    ],
                  ))),
                ]),
              ),
            ),
            leading: IconButton(
              icon: Container(
                width: 34, height: 34,
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.arrow_back_rounded,
                    color: Colors.white70, size: 18),
              ),
              onPressed: () => context.pop(),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 120),
            sliver: SliverList(delegate: SliverChildListDelegate([

              // ── Risk banner ─────────────────────────────────────────────
              _RiskBanner(),
              const SizedBox(height: 20),

              // ── Clauses list ─────────────────────────────────────────────
              AppCard(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: Row(children: [
                        const Icon(Icons.article_outlined,
                            color: kAccent, size: 18),
                        const SizedBox(width: 8),
                        const Text('Terms & Conditions',
                            style: TextStyle(fontFamily: 'Playfair',
                                fontSize: 15, fontWeight: FontWeight.w700)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: kAccent.withAlpha(12),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: kAccent.withAlpha(40)),
                          ),
                          child: Text(
                            '${_waiverClauses.length} clauses',
                            style: const TextStyle(color: kAccent,
                                fontSize: 10, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ]),
                    ),
                    ..._waiverClauses.asMap().entries.map((e) =>
                        _WaiverClause(num: e.key + 1, text: e.value)),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // ── Scroll hint ──────────────────────────────────────────────
              if (!_readAll)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: kAccent.withAlpha(10),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: kAccent.withAlpha(30)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.keyboard_arrow_down_rounded,
                          color: kAccent, size: 18),
                      const SizedBox(width: 6),
                      const Text('Scroll to read all clauses to continue',
                          style: TextStyle(color: kAccent, fontSize: 12,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              if (!_readAll) const SizedBox(height: 16),

              // ── Agree checkbox ───────────────────────────────────────────
              GestureDetector(
                onTap: _readAll
                    ? () => setState(() => _agreed = !_agreed)
                    : () => showToast(context,
                        'Please read all clauses first', error: true),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: _agreed
                        ? kGreen.withAlpha(10)
                        : _readAll ? kCard : kBg2,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: _agreed
                          ? kGreen.withAlpha(60)
                          : _readAll ? kBorder : kBorder.withAlpha(80),
                      width: _agreed ? 1.5 : 1,
                    ),
                    boxShadow: _agreed ? [
                      BoxShadow(color: kGreen.withAlpha(20),
                          blurRadius: 12, offset: const Offset(0, 4)),
                    ] : kShadowSm,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        width: 26, height: 26,
                        decoration: BoxDecoration(
                          color: _agreed ? kGreen : Colors.transparent,
                          borderRadius: BorderRadius.circular(7),
                          border: Border.all(
                            color: _agreed ? kGreen
                                : _readAll ? kBorder : kBorder.withAlpha(80),
                            width: 2,
                          ),
                        ),
                        child: _agreed
                            ? const Icon(Icons.check_rounded,
                                color: Colors.white, size: 16)
                            : null,
                      ),
                      const SizedBox(width: 14),
                      Expanded(child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _agreed ? 'Agreed ✓' : 'I agree to the safety waiver',
                            style: TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 14,
                              color: _agreed ? kGreen : kText,
                            ),
                          ),
                          const SizedBox(height: 3),
                          const Text(
                            'I have read all terms and accept full responsibility for my safety during the ride.',
                            style: TextStyle(color: kMuted, fontSize: 12, height: 1.4),
                          ),
                        ],
                      )),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),
            ])),
          ),
        ]),

        // ── Floating bottom sign button ────────────────────────────────────
        Positioned(
          bottom: 0, left: 0, right: 0,
          child: Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              border: Border(top: BorderSide(color: kBorder)),
              boxShadow: [
                BoxShadow(color: Colors.black.withAlpha(15),
                    blurRadius: 20, offset: const Offset(0, -4)),
              ],
            ),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              // Progress dots
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                _ProgDot(done: _readAll, label: 'Read'),
                _ProgLine(done: _readAll && _agreed),
                _ProgDot(done: _readAll && _agreed, label: 'Agreed'),
                _ProgLine(done: _signed),
                _ProgDot(done: _signed, label: 'Signed'),
              ]),
              const SizedBox(height: 12),
              AnimatedOpacity(
                opacity: _agreed ? 1.0 : 0.4,
                duration: const Duration(milliseconds: 300),
                child: SizedBox(
                  width: double.infinity, height: 54,
                  child: ElevatedButton(
                    onPressed: (_agreed && !_loading && !_signed) ? _sign : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kGreen,
                      disabledBackgroundColor: kGreen,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: _loading
                        ? const SizedBox(width: 22, height: 22,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2.5))
                        : _signed
                            ? ScaleTransition(
                                scale: _successScale,
                                child: FadeTransition(
                                  opacity: _successFade,
                                  child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.check_circle_rounded,
                                          size: 20),
                                      SizedBox(width: 10),
                                      Text('Waiver Signed!',
                                          style: TextStyle(fontSize: 15,
                                              fontWeight: FontWeight.w700)),
                                    ],
                                  ),
                                ))
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.draw_rounded, size: 18),
                                  SizedBox(width: 10),
                                  Text('Sign & Proceed',
                                      style: TextStyle(fontSize: 15,
                                          fontWeight: FontWeight.w700)),
                                ],
                              ),
                  ),
                ),
              ),
            ]),
          ),
        ),
      ]),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _RiskBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      gradient: LinearGradient(
        colors: [kRed.withAlpha(10), kRed.withAlpha(5)],
        begin: Alignment.topLeft, end: Alignment.bottomRight,
      ),
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: kRed.withAlpha(40)),
    ),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 44, height: 44,
        decoration: BoxDecoration(
          color: kRed.withAlpha(15), borderRadius: BorderRadius.circular(13)),
        child: const Icon(Icons.warning_amber_rounded, color: kRed, size: 24)),
      const SizedBox(width: 14),
      Expanded(child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('SAFETY WAIVER & LIABILITY RELEASE',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12,
                  color: kRed, letterSpacing: 0.5)),
          const SizedBox(height: 5),
          const Text(
            'Quad biking involves inherent risks. '
            'Please read each clause carefully. '
            'By signing you accept full responsibility for your safety.',
            style: TextStyle(color: kMuted, fontSize: 12, height: 1.5),
          ),
          const SizedBox(height: 10),
          Row(children: [
            _RiskPill(Icons.accessible_rounded, 'Age 16+'),
            const SizedBox(width: 8),
            _RiskPill(Icons.no_drinks_rounded, 'No alcohol'),
            const SizedBox(width: 8),
            _RiskPill(Icons.sports_motorsports_rounded, 'Helmet on'),
          ]),
        ],
      )),
    ]),
  );
}

class _RiskPill extends StatelessWidget {
  final IconData icon; final String label;
  const _RiskPill(this.icon, this.label);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(
      color: kRed.withAlpha(12),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: kRed.withAlpha(35)),
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 11, color: kRed),
      const SizedBox(width: 4),
      Text(label, style: const TextStyle(
          color: kRed, fontSize: 10, fontWeight: FontWeight.w700)),
    ]),
  );
}

class _WaiverClause extends StatelessWidget {
  final int num; final String text;
  const _WaiverClause({required this.num, required this.text});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 26, height: 26, margin: const EdgeInsets.only(top: 1),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [kAccent.withAlpha(30), kAccent.withAlpha(12)],
            begin: Alignment.topLeft, end: Alignment.bottomRight,
          ),
          shape: BoxShape.circle,
          border: Border.all(color: kAccent.withAlpha(50)),
        ),
        child: Center(child: Text('$num',
            style: const TextStyle(color: kAccent, fontSize: 10,
                fontWeight: FontWeight.w800))),
      ),
      const SizedBox(width: 12),
      Expanded(child: Text(text,
          style: const TextStyle(fontSize: 13, height: 1.6, color: kText))),
    ]),
  );
}

class _ProgDot extends StatelessWidget {
  final bool done; final String label;
  const _ProgDot({required this.done, required this.label});
  @override
  Widget build(BuildContext context) => Column(children: [
    AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: 22, height: 22,
      decoration: BoxDecoration(
        color: done ? kGreen : kBg2,
        shape: BoxShape.circle,
        border: Border.all(
            color: done ? kGreen : kBorder, width: done ? 0 : 1.5),
      ),
      child: done ? const Icon(Icons.check_rounded,
          color: Colors.white, size: 13) : null,
    ),
    const SizedBox(height: 3),
    Text(label, style: TextStyle(
        fontSize: 9, fontWeight: FontWeight.w600, letterSpacing: 0.5,
        color: done ? kGreen : kMuted)),
  ]);
}

class _ProgLine extends StatelessWidget {
  final bool done;
  const _ProgLine({required this.done});
  @override
  Widget build(BuildContext context) => AnimatedContainer(
    duration: const Duration(milliseconds: 400),
    width: 48, height: 2, margin: const EdgeInsets.only(bottom: 14),
    decoration: BoxDecoration(
      color: done ? kGreen : kBorder,
      borderRadius: BorderRadius.circular(2),
    ),
  );
}

const _waiverClauses = [
  'I voluntarily participate in quad biking activities at Royal Quad Bikes, Mambrui Sand Dunes, Kilifi County, Kenya.',
  'I acknowledge that quad biking involves inherent risks including falls, rollovers, collisions, and serious physical injury.',
  'I confirm that I am in good physical health and have no medical conditions (heart conditions, epilepsy, back injuries, pregnancy) that would prevent safe participation.',
  'I agree to wear all provided safety equipment — including helmet and protective gear — throughout the entire ride without exception.',
  'I will follow all instructions given by Royal Quad Bikes staff and operate the vehicle responsibly within designated riding areas.',
  'I will not operate the vehicle under the influence of alcohol, drugs, or any impairing substances.',
  'I accept full financial responsibility for any damage caused to the vehicle through negligent, reckless, or deliberate operation.',
  'I release Royal Quad Bikes, its owners, employees, and agents from any liability for personal injury or property damage arising from my participation.',
  'Parents or legal guardians must sign this waiver on behalf of all participants under 18 years of age.',
];
