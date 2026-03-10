import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../theme/theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  int?    _selectedQuad;
  int?    _selectedDuration;
  int?    _selectedPrice;
  String  _name      = '';
  String  _phone     = '';
  String  _promo     = '';
  String  _mpesaRef  = '';
  int     _deposit   = 0;
  int?    _discounted;
  bool    _loading   = false;
  bool    _copied    = false;
  int     get _step {
    if (_selectedQuad == null) return 0;
    if (_selectedDuration == null) return 1;
    if (_name.trim().isEmpty || _phone.trim().isEmpty) return 2;
    return 3;
  }

  final _nameCtrl  = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _promoCtrl = TextEditingController();
  final _mpesaCtrl = TextEditingController();
  final _depositCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadAll();
    });
    // Tick every second so live ride timers update
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && context.read<AppProvider>().active.isNotEmpty) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _nameCtrl.dispose(); _phoneCtrl.dispose();
    _promoCtrl.dispose(); _mpesaCtrl.dispose();
    _depositCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _selectPricing(Map p) => setState(() {
    _selectedDuration = p['duration'] as int;
    _selectedPrice    = p['price'] as int;
    _discounted       = null;
    _promoCtrl.clear();
    _promo = '';
  });

  Future<void> _applyPromo() async {
    if (_selectedPrice == null || _promo.trim().isEmpty) {
      showToast(context, 'Select a duration first', error: true); return;
    }
    final disc = context.read<AppProvider>().applyPromo(_promo.trim(), _selectedPrice!);
    if (!mounted) return;
    if (disc == null) {
      showToast(context, 'Invalid or inactive promo code', error: true);
    } else {
      setState(() => _discounted = disc);
      showToast(context, 'Promo applied — saved ${(_selectedPrice! - disc).kes} KES! 🎉');
    }
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (_selectedQuad == null) {
      showToast(context, 'Please select a quad', error: true); return;
    }
    if (_selectedDuration == null) {
      showToast(context, 'Please select a duration', error: true); return;
    }
    if (_name.trim().isEmpty) {
      showToast(context, 'Enter the customer name', error: true); return;
    }
    if (_phone.trim().isEmpty) {
      showToast(context, 'Enter the customer phone', error: true); return;
    }
    setState(() => _loading = true);
    try {
      final booking = await context.read<AppProvider>().createBooking(
        quadId: _selectedQuad!,
        customerName: _name.trim(),
        customerPhone: _phone.trim(),
        duration: _selectedDuration!,
        price: _discounted ?? _selectedPrice!,
        originalPrice: _selectedPrice!,
        promoCode: _discounted != null ? _promo.trim() : null,
        mpesaRef: _mpesaRef.trim().isEmpty ? null : _mpesaRef.trim(),
        depositAmount: _deposit,
      );
      if (!mounted) return;
      // Reset form
      _nameCtrl.clear(); _phoneCtrl.clear();
      _promoCtrl.clear(); _mpesaCtrl.clear(); _depositCtrl.clear();
      setState(() {
        _selectedQuad = null; _selectedDuration = null;
        _selectedPrice = null; _discounted = null;
        _name = ''; _phone = ''; _promo = ''; _mpesaRef = ''; _deposit = 0;
      });
      // Route through waiver screen first, then to ride
      context.push('/waiver/${booking.id}');
    } catch (e) {
      if (!mounted) return;
      showToast(context, e.toString().replaceFirst('Exception: ', ''), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider  = context.watch<AppProvider>();
    final available = provider.quads.where((q) => q.status == 'available').toList();
    final effectivePrice = _discounted ?? _selectedPrice ?? 0;

    return Scaffold(
      body: CustomScrollView(controller: _scrollCtrl, slivers: [

        // ── App Bar ─────────────────────────────────────────────────────────
        SliverAppBar(
          expandedHeight: 170,
          pinned: true,
          stretch: true,
          flexibleSpace: FlexibleSpaceBar(
            collapseMode: CollapseMode.parallax,
            stretchModes: const [StretchMode.zoomBackground],
            background: Stack(fit: StackFit.expand, children: [
              Container(decoration: const BoxDecoration(gradient: kHeroGradient)),
              // Subtle logo watermark
              Positioned.fill(child: Opacity(
                opacity: 0.06,
                child: Image.asset('assets/images/logo.png', fit: BoxFit.cover))),
              // Gold shimmer line at top
              Positioned(top: 0, left: 0, right: 0,
                child: Container(height: 2,
                  decoration: const BoxDecoration(gradient: kGoldGradient))),
              SafeArea(child: Center(child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(
                          color: kAccent.withAlpha(60), blurRadius: 20)]),
                    child: CircleAvatar(radius: 34,
                        backgroundImage: const AssetImage('assets/images/logo.png'),
                        backgroundColor: Colors.transparent)),
                  const SizedBox(height: 10),
                  const Text('Royal Quad Bikes', style: TextStyle(
                      fontFamily: 'Playfair', fontSize: 22,
                      fontWeight: FontWeight.w700, color: Colors.white,
                      shadows: [Shadow(color: Colors.black54, blurRadius: 8)])),
                  const SizedBox(height: 2),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Container(width: 4, height: 4,
                        decoration: const BoxDecoration(
                            color: kAccent, shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    const Text('MAMBRUI SAND DUNES · KENYA',
                        style: TextStyle(color: Colors.white38,
                            fontSize: 10, letterSpacing: 2)),
                    const SizedBox(width: 6),
                    Container(width: 4, height: 4,
                        decoration: const BoxDecoration(
                            color: kAccent, shape: BoxShape.circle)),
                  ]),
                ],
              ))),
            ]),
            title: const Text('Royal Quad Bikes',
                style: TextStyle(
                    fontFamily: 'Playfair', fontSize: 17, color: Colors.white)),
          ),
          actions: [
            if (provider.active.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(right: 8, top: 8, bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                    color: kRed.withAlpha(40),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: kRed.withAlpha(80))),
                child: Row(children: [
                  Container(width: 6, height: 6,
                      decoration: const BoxDecoration(
                          color: kRed, shape: BoxShape.circle)),
                  const SizedBox(width: 5),
                  Text('${provider.active.length} live',
                      style: const TextStyle(
                          color: kRed, fontSize: 11, fontWeight: FontWeight.w700)),
                ]),
              ),
          ],
        ),

        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          sliver: SliverList(delegate: SliverChildListDelegate([

            // ── Live rides banner ────────────────────────────────────────────
            if (provider.active.isNotEmpty) ...[
              _LiveRidesBanner(rides: provider.active),
              const SizedBox(height: 20),
            ],

            // ── Booking stepper ──────────────────────────────────────────
            _BookingStepper(step: _step),
            const SizedBox(height: 20),

            // ── Fleet grid ────────────────────────────────────────────────────
            SectionHeading('Select Quad', icon: Icons.directions_bike_rounded,
              trailing: Text('${available.length} available',
                  style: const TextStyle(color: kMuted, fontSize: 12))),

            if (provider.loading)
              GridView.count(
                crossAxisCount: 2, shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.6,
                children: List.generate(4, (_) =>
                    const ShimmerBox(height: 80, radius: 16)),
              )
            else if (provider.quads.isEmpty)
              _EmptyState(icon: Icons.directions_bike_outlined,
                  title: 'No quads in fleet',
                  sub: 'Ask admin to add quads')
            else
              GridView.count(
                crossAxisCount: 2, shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.6,
                children: provider.quads.map((q) => _QuadCard(
                  quad: q, selected: _selectedQuad == q.id,
                  onTap: q.status == 'available'
                      ? () => setState(() => _selectedQuad = q.id)
                      : null,
                )).toList(),
              ),

            const SizedBox(height: 24),

            // ── Duration ─────────────────────────────────────────────────────
            SectionHeading('Duration & Price', icon: Icons.timer_rounded),
            GridView.count(
              crossAxisCount: 3, shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 8, mainAxisSpacing: 8, childAspectRatio: 1.5,
              children: kPricing.map((p) {
                final sel = _selectedDuration == p['duration'];
                return GestureDetector(
                  onTap: () => _selectPricing(p),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    decoration: BoxDecoration(
                      color: sel ? kText : kCard,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: sel ? kAccent : kBorder,
                          width: sel ? 2 : 1),
                      boxShadow: sel ? [
                        BoxShadow(color: kAccent.withAlpha(30),
                            blurRadius: 12, offset: const Offset(0, 4)),
                      ] : kShadowSm,
                    ),
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      if (sel)
                        const Icon(Icons.check_circle_rounded,
                            color: kAccent, size: 14),
                      if (sel) const SizedBox(height: 2),
                      Text(p['label'] as String, style: TextStyle(
                          color: sel ? kAccent2 : kText,
                          fontWeight: FontWeight.w800, fontSize: 13)),
                      const SizedBox(height: 2),
                      Text('${(p['price'] as int).kes} KES', style: TextStyle(
                          color: sel ? Colors.white54 : kMuted,
                          fontSize: 11)),
                    ]),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 24),

            // ── Customer details ──────────────────────────────────────────────
            SectionHeading('Customer Details', icon: Icons.person_rounded),
            _TextField(ctrl: _nameCtrl, label: 'Full Name',
                icon: Icons.person_outline_rounded,
                onChanged: (v) => _name = v),
            const SizedBox(height: 12),
            _TextField(ctrl: _phoneCtrl, label: 'Phone Number',
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                onChanged: (v) => _phone = v),
            const SizedBox(height: 12),
            // Deposit (refundable)
            TextFormField(
              controller: _depositCtrl,
              decoration: InputDecoration(
                labelText: 'Security Deposit (optional)',
                hintText: '500',
                prefixIcon: Container(
                  margin: const EdgeInsets.all(10),
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: kOrange.withAlpha(15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.shield_outlined, color: kOrange, size: 16)),
                helperText: 'Refundable deposit collected from customer',
                suffixText: 'KES',
              ),
              keyboardType: TextInputType.number,
              onChanged: (v) => setState(() {
                _deposit = int.tryParse(v.trim()) ?? 0;
              }),
            ),

            const SizedBox(height: 20),

            // ── Promo code ────────────────────────────────────────────────────
            SectionHeading('Promo Code', icon: Icons.local_offer_rounded,
              trailing: const Text('Optional',
                  style: TextStyle(color: kMuted, fontSize: 11))),
            Row(children: [
              Expanded(child: _TextField(
                  ctrl: _promoCtrl, label: 'Enter promo code',
                  icon: Icons.confirmation_number_outlined,
                  textCapitalization: TextCapitalization.characters,
                  onChanged: (v) => setState(() => _promo = v))),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: _applyPromo,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 18, vertical: 17),
                  decoration: BoxDecoration(
                    color: kAccent,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [BoxShadow(
                        color: kAccent.withAlpha(50), blurRadius: 8,
                        offset: const Offset(0, 3))],
                  ),
                  child: const Text('Apply', style: TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w700)),
                ),
              ),
            ]),
            AnimatedSize(
              duration: const Duration(milliseconds: 200),
              child: _discounted != null
                  ? Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: kGreen.withAlpha(12),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: kGreen.withAlpha(40)),
                        ),
                        child: Row(children: [
                          const Icon(Icons.check_circle_rounded,
                              color: kGreen, size: 16),
                          const SizedBox(width: 8),
                          Expanded(child: Text(
                            'Promo applied! ${_discounted!.kes} KES  (saved ${(_selectedPrice! - _discounted!).kes} KES)',
                            style: const TextStyle(
                                color: kGreen, fontSize: 13,
                                fontWeight: FontWeight.w600))),
                        ]),
                      ))
                  : const SizedBox.shrink(),
            ),

            const SizedBox(height: 20),

            // ── M-Pesa section ────────────────────────────────────────────────
            if (effectivePrice > 0) _MpesaSection(
              price: effectivePrice,
              ctrl: _mpesaCtrl,
              copied: _copied,
              onRefChange: (v) => _mpesaRef = v,
              onCopy: () async {
                await Clipboard.setData(const ClipboardData(text: kTillNumber));
                if (!mounted) return;
                setState(() => _copied = true);
                await Future.delayed(const Duration(seconds: 2));
                if (mounted) setState(() => _copied = false);
              },
            ),

            const SizedBox(height: 28),

            // ── Summary pill ──────────────────────────────────────────────────
            if (_selectedDuration != null)
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: kHeroFrom,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: kAccent.withAlpha(50)),
                ),
                child: Row(children: [
                  const Icon(Icons.receipt_long_rounded,
                      color: kAccent, size: 20),
                  const SizedBox(width: 10),
                  Expanded(child: Text(
                    '${_selectedDuration} min ride',
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600))),
                  Text('${effectivePrice.kes} KES',
                      style: const TextStyle(
                          fontFamily: 'Playfair', color: kAccent2,
                          fontSize: 18, fontWeight: FontWeight.w700)),
                ]),
              ),

            // ── Start ride ────────────────────────────────────────────────────
            _StartButton(
              step: _step,
              loading: _loading,
              onTap: _submit,
            ),
            const SizedBox(height: 48),

          ])),
        ),
      ]),
    );
  }
}

// ── Sub-widgets ────────────────────────────────────────────────────────────────

class _LiveRidesBanner extends StatelessWidget {
  final List<Booking> rides;
  const _LiveRidesBanner({required this.rides});

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      SectionHeading('Live Rides', icon: Icons.local_fire_department_rounded,
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
                color: kRed.withAlpha(15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: kRed.withAlpha(40))),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Container(width: 6, height: 6,
                  decoration: const BoxDecoration(color: kRed, shape: BoxShape.circle)),
              const SizedBox(width: 4),
              Text('${rides.length}',
                  style: const TextStyle(color: kRed, fontSize: 11,
                      fontWeight: FontWeight.w700)),
            ]),
          )),
      ...rides.map((b) => _ActiveTile(booking: b, key: ValueKey(b.id))),
    ],
  );
}

class _QuadCard extends StatelessWidget {
  final Quad quad;
  final bool selected;
  final VoidCallback? onTap;
  const _QuadCard({super.key, required this.quad,
      required this.selected, this.onTap});

  @override
  Widget build(BuildContext context) {
    final isAvail = quad.status == 'available';
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: selected ? kHeroFrom : kCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected
                ? kAccent
                : isAvail
                    ? kBorder
                    : kRed.withAlpha(60),
            width: selected ? 2 : 1,
          ),
          boxShadow: selected
              ? [BoxShadow(color: kAccent.withAlpha(30),
                  blurRadius: 16, offset: const Offset(0, 4))]
              : kShadowSm,
        ),
        child: Stack(children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(children: [
                  Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      color: selected
                          ? kAccent.withAlpha(30)
                          : kAccent.withAlpha(12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(Icons.directions_bike_rounded,
                        color: selected ? kAccent2 : kAccent, size: 20)),
                  const Spacer(),
                  if (!isAvail && !selected)
                    Icon(Icons.lock_outline_rounded,
                        color: kMuted.withAlpha(80), size: 14),
                ]),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(quad.name, style: TextStyle(
                      color: selected ? Colors.white : kText,
                      fontWeight: FontWeight.w800, fontSize: 13)),
                  const SizedBox(height: 4),
                  StatusBadge(quad.status),
                ]),
              ],
            ),
          ),
          if (selected)
            Positioned(top: 8, right: 8, child:
              Container(
                width: 20, height: 20,
                decoration: BoxDecoration(
                    color: kAccent, shape: BoxShape.circle),
                child: const Icon(Icons.check_rounded,
                    color: Colors.white, size: 13))),
        ]),
      ),
    );
  }
}

class _ActiveTile extends StatelessWidget {
  final Booking booking;
  const _ActiveTile({super.key, required this.booking});

  @override
  Widget build(BuildContext context) {
    final elapsed   = DateTime.now().difference(booking.startTime).inSeconds;
    final totalSecs = booking.duration * 60;
    final remaining = totalSecs - elapsed;
    final overtime  = remaining < 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: () => context.push('/ride/${booking.id}'),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: overtime ? kRed.withAlpha(8) : kHeroFrom.withAlpha(8),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
                color: overtime ? kRed.withAlpha(40) : kBorder),
            boxShadow: kShadowSm,
          ),
          child: Row(children: [
            Container(
              width: 42, height: 42,
              decoration: BoxDecoration(
                color: overtime ? kRed.withAlpha(20) : kAccent.withAlpha(15),
                borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.directions_bike_rounded,
                  color: overtime ? kRed : kAccent, size: 20)),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(booking.quadName, style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 14)),
                Text(booking.customerName,
                    style: const TextStyle(color: kMuted, fontSize: 12)),
              ],
            )),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text(
                overtime
                    ? 'OT ${((-remaining) ~/ 60).toString().padLeft(2,'0')}:${((-remaining) % 60).toString().padLeft(2,'0')}'
                    : '${(remaining ~/ 60).toString().padLeft(2,'0')}:${(remaining % 60).toString().padLeft(2,'0')} left',
                style: TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 13,
                    fontFamily: 'monospace',
                    color: overtime ? kRed : kAccent)),
              const Icon(Icons.chevron_right_rounded, color: kMuted, size: 16),
            ]),
          ]),
        ),
      ),
    );
  }
}

class _MpesaSection extends StatelessWidget {
  final int price;
  final TextEditingController ctrl;
  final bool copied;
  final ValueChanged<String> onRefChange;
  final VoidCallback onCopy;

  const _MpesaSection({required this.price, required this.ctrl,
      required this.copied, required this.onRefChange, required this.onCopy});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: const Color(0xFF166534).withAlpha(8),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: kGreen.withAlpha(35)),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Header
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: kGreen.withAlpha(12),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          border: Border(bottom: BorderSide(color: kGreen.withAlpha(30))),
        ),
        child: Row(children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
                color: kGreen.withAlpha(20),
                borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.phone_android_rounded,
                color: kGreen, size: 18)),
          const SizedBox(width: 10),
          const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('M-Pesa Payment',
                style: TextStyle(color: kGreen, fontWeight: FontWeight.w700,
                    fontSize: 14)),
            Text('Lipa na M-Pesa',
                style: TextStyle(color: kGreen, fontSize: 10)),
          ]),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: kGreen.withAlpha(15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: kGreen.withAlpha(40)),
            ),
            child: Text('${price.kes} KES', style: const TextStyle(
                color: kGreen, fontWeight: FontWeight.w800, fontSize: 13))),
        ]),
      ),

      Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Steps
          _Step('1', 'Open M-Pesa on your phone'),
          _Step('2', 'Select  Buy Goods & Services'),
          _Step('3', 'Enter Till Number below and send ${price.kes} KES'),
          const SizedBox(height: 12),

          // Till number copy
          GestureDetector(
            onTap: onCopy,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(
                  horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: copied ? kGreen.withAlpha(20) : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: copied ? kGreen : kBorder,
                    width: copied ? 1.5 : 1),
                boxShadow: kShadowSm,
              ),
              child: Row(children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('TILL NUMBER', style: TextStyle(
                      color: kMuted, fontSize: 10, letterSpacing: 1)),
                  Text(kTillNumber, style: const TextStyle(
                      fontFamily: 'monospace', fontSize: 24,
                      fontWeight: FontWeight.w900, color: kText,
                      letterSpacing: 3)),
                ]),
                const Spacer(),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    copied ? Icons.check_circle_rounded : Icons.copy_rounded,
                    key: ValueKey(copied),
                    color: copied ? kGreen : kMuted, size: 22)),
              ]),
            ),
          ),

          const SizedBox(height: 12),

          // M-Pesa confirmation code
          TextFormField(
            controller: ctrl,
            decoration: const InputDecoration(
              labelText: 'M-Pesa Confirmation Code',
              hintText: 'e.g. QHL2X3P8KA',
              helperText: 'Optional — enter after sending payment',
              prefixIcon: Icon(Icons.confirmation_number_outlined, size: 18),
              counterText: '',
            ),
            textCapitalization: TextCapitalization.characters,
            maxLength: 12,
            onChanged: onRefChange,
          ),
        ]),
      ),
    ]),
  );
}

class _Step extends StatelessWidget {
  final String num, text;
  const _Step(this.num, this.text);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Row(children: [
      Container(
        width: 20, height: 20,
        decoration: BoxDecoration(
            color: kGreen.withAlpha(20),
            shape: BoxShape.circle,
            border: Border.all(color: kGreen.withAlpha(50))),
        child: Center(child: Text(num, style: const TextStyle(
            color: kGreen, fontSize: 10, fontWeight: FontWeight.w800)))),
      const SizedBox(width: 8),
      Text(text, style: const TextStyle(color: kText, fontSize: 13)),
    ]),
  );
}

class _TextField extends StatelessWidget {
  final TextEditingController ctrl;
  final String label;
  final IconData icon;
  final ValueChanged<String> onChanged;
  final TextInputType? keyboardType;
  final TextCapitalization textCapitalization;

  const _TextField({required this.ctrl, required this.label,
      required this.icon, required this.onChanged,
      this.keyboardType, this.textCapitalization = TextCapitalization.words});

  @override
  Widget build(BuildContext context) => TextFormField(
    controller: ctrl,
    decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 18)),
    keyboardType: keyboardType,
    textCapitalization: textCapitalization,
    onChanged: onChanged,
  );
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title, sub;
  const _EmptyState({required this.icon, required this.title, required this.sub});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 32),
    child: Column(children: [
      Icon(icon, size: 48, color: kBorder),
      const SizedBox(height: 12),
      Text(title, style: const TextStyle(
          fontWeight: FontWeight.w700, color: kMuted)),
      const SizedBox(height: 4),
      Text(sub, style: const TextStyle(color: kMuted, fontSize: 12)),
    ]),
  );
}


// ── Smart start button ────────────────────────────────────────────────────────
class _StartButton extends StatelessWidget {
  final int step;
  final bool loading;
  final VoidCallback onTap;
  const _StartButton({required this.step, required this.loading,
      required this.onTap});

  static const _hints = [
    'Select a quad to continue',
    'Choose a duration to continue',
    'Enter customer details to continue',
    'Ready to start!',
  ];

  @override
  Widget build(BuildContext context) {
    final ready = step >= 3;
    return Column(children: [
      AnimatedSize(
        duration: const Duration(milliseconds: 200),
        child: !ready
            ? Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.info_outline_rounded,
                        size: 13, color: kMuted.withAlpha(160)),
                    const SizedBox(width: 6),
                    Text(_hints[step.clamp(0, 3)],
                        style: const TextStyle(
                            color: kMuted, fontSize: 12)),
                  ],
                ),
              )
            : const SizedBox.shrink(),
      ),
      SizedBox(
        width: double.infinity,
        height: 56,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          decoration: BoxDecoration(
            gradient: ready
                ? LinearGradient(colors: [
                    kGreen,
                    const Color(0xFF00A550),
                  ])
                : null,
            color: ready ? null : kBg2,
            borderRadius: BorderRadius.circular(16),
            boxShadow: ready
                ? [BoxShadow(color: kGreen.withAlpha(60),
                    blurRadius: 16, offset: const Offset(0, 6))]
                : null,
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: ready && !loading ? onTap : null,
              child: Center(
                child: loading
                    ? const SizedBox(width: 24, height: 24,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2.5))
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            ready
                                ? Icons.play_arrow_rounded
                                : Icons.lock_outline_rounded,
                            color: ready ? Colors.white : kMuted,
                            size: 22,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            ready ? 'Start Ride' : 'Start Ride',
                            style: TextStyle(
                                color: ready ? Colors.white : kMuted,
                                fontWeight: FontWeight.w800,
                                fontSize: 16),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    ]);
  }
}

// ── Booking stepper widget ────────────────────────────────────────────────────
class _BookingStepper extends StatelessWidget {
  final int step;
  const _BookingStepper({required this.step});

  static const _steps = ['Quad', 'Duration', 'Details', 'Pay'];

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    decoration: BoxDecoration(
      color: kSurface,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: kBorder),
      boxShadow: kShadowSm,
    ),
    child: Column(children: [
      // Step dots + lines
      Row(children: List.generate(_steps.length * 2 - 1, (i) {
        if (i.isOdd) {
          // connector line
          final lineIdx = i ~/ 2;
          return Expanded(child: AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            height: 2,
            decoration: BoxDecoration(
              color: step > lineIdx ? kAccent : kBorder,
              borderRadius: BorderRadius.circular(1),
            ),
          ));
        }
        final dotIdx = i ~/ 2;
        final isDone   = step > dotIdx;
        final isActive = step == dotIdx;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          width: 28, height: 28,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isDone ? kAccent : isActive ? kText : Colors.transparent,
            border: Border.all(
              color: isDone ? kAccent : isActive ? kText : kBorder,
              width: isActive ? 2 : 1.5,
            ),
            boxShadow: isActive ? [
              BoxShadow(color: kText.withAlpha(20), blurRadius: 8),
            ] : isDone ? [
              BoxShadow(color: kAccent.withAlpha(40), blurRadius: 8),
            ] : null,
          ),
          child: Center(
            child: isDone
                ? const Icon(Icons.check_rounded, color: Colors.white, size: 14)
                : Text('${dotIdx + 1}', style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w800,
                    color: isActive ? Colors.white : kMuted)),
          ),
        );
      })),
      const SizedBox(height: 8),
      // Step labels
      Row(children: List.generate(_steps.length, (i) {
        final isDone   = step > i;
        final isActive = step == i;
        return Expanded(child: Text(
          _steps[i],
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 9, fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
            color: isDone ? kAccent : isActive ? kText : kMuted,
          ),
        ));
      })),
    ]),
  );
}
