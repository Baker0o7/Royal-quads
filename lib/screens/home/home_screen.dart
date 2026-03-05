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

class _HomeScreenState extends State<HomeScreen> {
  int?    _selectedQuad;
  int?    _selectedDuration;
  int?    _selectedPrice;
  String  _name      = '';
  String  _phone     = '';
  String  _promo     = '';
  String  _mpesaRef  = '';
  int?    _discounted;
  bool    _loading   = false;
  bool    _copied    = false;

  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    context.read<AppProvider>().loadAll();
  }

  void _selectPricing(Map p) => setState(() {
    _selectedDuration = p['duration'] as int;
    _selectedPrice    = p['price'] as int;
    _discounted       = null;
    _promo            = '';
  });

  Future<void> _applyPromo() async {
    if (_selectedPrice == null || _promo.trim().isEmpty) return;
    final disc = context.read<AppProvider>().applyPromo(_promo, _selectedPrice!);
    if (!mounted) return;
    if (disc == null) {
      showToast(context, 'Invalid or inactive promo code', error: true);
    } else {
      setState(() => _discounted = disc);
      showToast(context, 'Promo applied! 🎉');
    }
  }

  Future<void> _submit() async {
    if (_selectedQuad == null) { showToast(context, 'Select a quad', error: true); return; }
    if (_selectedDuration == null) { showToast(context, 'Select duration', error: true); return; }
    if (_name.trim().isEmpty) { showToast(context, 'Enter customer name', error: true); return; }
    if (_phone.trim().isEmpty) { showToast(context, 'Enter phone number', error: true); return; }

    setState(() => _loading = true);
    try {
      final booking = await context.read<AppProvider>().createBooking(
        quadId: _selectedQuad!,
        customerName: _name,
        customerPhone: _phone,
        duration: _selectedDuration!,
        price: _discounted ?? _selectedPrice!,
        originalPrice: _selectedPrice!,
        promoCode: _discounted != null ? _promo : null,
        mpesaRef: _mpesaRef.trim().isEmpty ? null : _mpesaRef.trim().toUpperCase(),
      );
      if (!mounted) return;
      context.push('/ride/${booking.id}');
    } catch (e) {
      if (!mounted) return;
      showToast(context, e.toString().replaceFirst('Exception: ', ''), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final available = provider.quads.where((q) => q.status == 'available').toList();

    return Scaffold(
      body: CustomScrollView(slivers: [
        _buildAppBar(),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(delegate: SliverChildListDelegate([

            // ── Live Rides ──────────────────────────────────────────────────
            if (provider.active.isNotEmpty) ...[
              SectionHeading('Live Rides', icon: Icons.local_fire_department_rounded),
              ...provider.active.map((b) => _ActiveTile(booking: b)),
              const SizedBox(height: 20),
            ],

            // ── Fleet ───────────────────────────────────────────────────────
            SectionHeading('Available Quads', icon: Icons.directions_bike_rounded),
            provider.quads.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : GridView.count(
                    crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.6,
                    children: provider.quads.map((q) => _QuadCard(
                      quad: q, selected: _selectedQuad == q.id,
                      onTap: q.status == 'available' ? () => setState(() => _selectedQuad = q.id) : null,
                    )).toList(),
                  ),

            const SizedBox(height: 24),

            // ── Duration picker ─────────────────────────────────────────────
            SectionHeading('Duration & Price', icon: Icons.timer_rounded),
            GridView.count(
              crossAxisCount: 3, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 8, mainAxisSpacing: 8, childAspectRatio: 1.4,
              children: kPricing.map((p) {
                final sel = _selectedDuration == p['duration'];
                return GestureDetector(
                  onTap: () => _selectPricing(p),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      color: sel ? kText : kCard,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: sel ? kAccent : kBorder, width: sel ? 2 : 1),
                    ),
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Text(p['label'] as String, style: TextStyle(
                          color: sel ? kAccent2 : kText,
                          fontWeight: FontWeight.w700, fontSize: 13)),
                      const SizedBox(height: 2),
                      Text('${(p['price'] as int).kes} KES', style: TextStyle(
                          color: sel ? Colors.white70 : kMuted, fontSize: 11)),
                    ]),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 24),

            // ── Customer details ─────────────────────────────────────────────
            SectionHeading('Customer Details', icon: Icons.person_rounded),
            Form(key: _formKey, child: Column(children: [
              _Field(label: 'Full Name', icon: Icons.person_outline,
                  onChanged: (v) => _name = v),
              const SizedBox(height: 12),
              _Field(label: 'Phone Number', icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  onChanged: (v) => _phone = v),
            ])),

            const SizedBox(height: 16),

            // ── Promo ────────────────────────────────────────────────────────
            Row(children: [
              Expanded(child: _Field(label: 'Promo Code', icon: Icons.local_offer_outlined,
                  onChanged: (v) => _promo = v)),
              const SizedBox(width: 8),
              ElevatedButton(onPressed: _applyPromo,
                child: const Text('Apply'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: kAccent, foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                )),
            ]),

            if (_discounted != null) Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(children: [
                const Icon(Icons.check_circle, color: kGreen, size: 16),
                const SizedBox(width: 6),
                Text('Promo applied! ${_discounted!.kes} KES (was ${_selectedPrice!.kes} KES)',
                    style: const TextStyle(color: kGreen, fontSize: 13, fontWeight: FontWeight.w600)),
              ]),
            ),

            const SizedBox(height: 20),

            // ── M-Pesa ───────────────────────────────────────────────────────
            _MpesaSection(
              price: _discounted ?? _selectedPrice ?? 0,
              mpesaRef: _mpesaRef,
              onRefChange: (v) => setState(() => _mpesaRef = v),
              copied: _copied,
              onCopy: () async {
                await Clipboard.setData(const ClipboardData(text: kTillNumber));
                setState(() => _copied = true);
                await Future.delayed(const Duration(seconds: 2));
                if (mounted) setState(() => _copied = false);
              },
            ),

            const SizedBox(height: 24),

            // ── Submit ───────────────────────────────────────────────────────
            PrimaryButton(
              label: 'Start Ride',
              icon: Icons.play_arrow_rounded,
              onTap: _submit,
              loading: _loading,
            ),

            const SizedBox(height: 40),
          ])),
        ),
      ]),
    );
  }

  SliverAppBar _buildAppBar() => SliverAppBar(
    expandedHeight: 160,
    pinned: true,
    flexibleSpace: FlexibleSpaceBar(
      background: Stack(fit: StackFit.expand, children: [
        Container(decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [kHeroFrom, kHeroTo],
            begin: Alignment.topLeft, end: Alignment.bottomRight),
        )),
        Positioned.fill(child: Opacity(opacity: 0.08, child: Image.asset(
            'assets/images/logo.png', fit: BoxFit.cover))),
        Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          CircleAvatar(radius: 36, backgroundImage: const AssetImage('assets/images/logo.png'),
              backgroundColor: Colors.transparent),
          const SizedBox(height: 8),
          const Text('Royal Quad Bikes', style: TextStyle(
              fontFamily: 'Playfair', fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
          const Text('Mambrui Sand Dunes · Kenya',
              style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
        ])),
      ]),
      title: const Text('Royal Quad Bikes',
          style: TextStyle(fontFamily: 'Playfair', fontSize: 18, color: Colors.white)),
      collapseMode: CollapseMode.parallax,
    ),
    actions: [
      IconButton(icon: const Icon(Icons.notifications_outlined, color: Colors.white70),
          onPressed: () {}),
    ],
  );
}

// ── Sub-widgets ────────────────────────────────────────────────────────────────

class _QuadCard extends StatelessWidget {
  final Quad quad;
  final bool selected;
  final VoidCallback? onTap;
  const _QuadCard({required this.quad, required this.selected, this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: selected ? kText : kCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: quad.status == 'available' ? (selected ? kAccent : kBorder)
                : (quad.status == 'rented' ? kAccent.withAlpha(80) : kRed.withAlpha(80)),
            width: selected ? 2 : 1),
      ),
      child: Stack(children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Icon(Icons.directions_bike_rounded,
                color: selected ? kAccent : kAccent, size: 28),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(quad.name, style: TextStyle(
                  color: selected ? Colors.white : kText,
                  fontWeight: FontWeight.w700, fontSize: 14)),
              const SizedBox(height: 2),
              StatusBadge(quad.status),
            ]),
          ]),
        ),
        if (selected) Positioned(top: 8, right: 8, child:
          const Icon(Icons.check_circle_rounded, color: kAccent, size: 18)),
      ]),
    ),
  );
}

class _ActiveTile extends StatelessWidget {
  final Booking booking;
  const _ActiveTile({required this.booking});

  @override
  Widget build(BuildContext context) {
    final elapsed = DateTime.now().difference(booking.startTime).inMinutes;
    final remaining = booking.duration - elapsed;

    return AppCard(
      onTap: () => context.push('/ride/${booking.id}'),
      padding: const EdgeInsets.all(14),
      color: kHeroFrom.withAlpha(10),
      child: Row(children: [
        Container(width: 44, height: 44,
            decoration: BoxDecoration(color: kAccent.withAlpha(20), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.directions_bike_rounded, color: kAccent, size: 22)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(booking.quadName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          Text(booking.customerName, style: const TextStyle(color: kMuted, fontSize: 12)),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(remaining > 0 ? '${remaining}m left' : 'OVERTIME',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13,
                  color: remaining > 0 ? kAccent : kRed)),
          const Icon(Icons.chevron_right_rounded, color: kMuted, size: 18),
        ]),
      ]),
    );
  }
}

class _MpesaSection extends StatelessWidget {
  final int price;
  final String mpesaRef;
  final ValueChanged<String> onRefChange;
  final bool copied;
  final VoidCallback onCopy;
  const _MpesaSection({required this.price, required this.mpesaRef,
    required this.onRefChange, required this.copied, required this.onCopy});

  @override
  Widget build(BuildContext context) {
    if (price == 0) return const SizedBox.shrink();
    return AppCard(
      color: const Color(0xFF166534).withAlpha(8),
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.phone_android_rounded, color: kGreen, size: 18),
          SizedBox(width: 6),
          Text('M-Pesa Payment', style: TextStyle(
              color: kGreen, fontWeight: FontWeight.w700, fontSize: 14)),
        ]),
        const SizedBox(height: 12),
        const Text('1. Open M-Pesa on your phone', style: TextStyle(fontSize: 13, color: kText)),
        const Text('2. Select Buy Goods & Services', style: TextStyle(fontSize: 13, color: kText)),
        const Text('3. Enter Till Number below', style: TextStyle(fontSize: 13, color: kText)),
        Text('4. Amount: ${price.kes} KES', style: const TextStyle(
            fontSize: 13, color: kText, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: onCopy,
          child: Container(
            width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            decoration: BoxDecoration(
                color: kGreen.withAlpha(15), borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kGreen.withAlpha(50))),
            child: Row(children: [
              const Text('Till: ', style: TextStyle(color: kMuted, fontSize: 13)),
              Text(kTillNumber, style: const TextStyle(
                  fontFamily: 'monospace', fontSize: 20, fontWeight: FontWeight.w700, color: kText,
                  letterSpacing: 2)),
              const Spacer(),
              Icon(copied ? Icons.check_circle_rounded : Icons.copy_rounded,
                  color: copied ? kGreen : kMuted, size: 20),
            ]),
          ),
        ),
        const SizedBox(height: 12),
        TextFormField(
          decoration: InputDecoration(
            labelText: 'M-Pesa Confirmation Code (optional)',
            hintText: 'e.g. QHL2X3P8KA',
            prefixIcon: const Icon(Icons.confirmation_number_outlined, size: 18),
            fillColor: Colors.white,
          ),
          textCapitalization: TextCapitalization.characters,
          maxLength: 12,
          onChanged: onRefChange,
        ),
      ]),
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final IconData icon;
  final ValueChanged<String> onChanged;
  final TextInputType? keyboardType;
  const _Field({required this.label, required this.icon, required this.onChanged, this.keyboardType});

  @override
  Widget build(BuildContext context) => TextFormField(
    decoration: InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, size: 18),
    ),
    keyboardType: keyboardType,
    onChanged: onChanged,
  );
}
