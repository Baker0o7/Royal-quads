import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../services/storage.dart';
import '../../theme/theme.dart';

enum _View { role, auth }
enum _Mode { signIn, signUp }

// ─── Root ─────────────────────────────────────────────────────────────────────
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  _View _view = _View.role;
  _Mode _mode = _Mode.signIn;

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AppProvider>().user;
    if (user != null) return _LoggedInView(user: user);

    return switch (_view) {
      _View.role => _RoleView(
          onCustomer: () => setState(() => _view = _View.auth),
          onAdmin:    () => context.go('/admin'),
          onGuest:    () => context.go('/'),
        ),
      _View.auth => _AuthView(
          mode: _mode,
          onToggleMode: () => setState(() =>
              _mode = _mode == _Mode.signIn ? _Mode.signUp : _Mode.signIn),
          onBack: () => setState(() => _view = _View.role),
        ),
    };
  }
}

// ─── Role Chooser ─────────────────────────────────────────────────────────────
class _RoleView extends StatefulWidget {
  final VoidCallback onCustomer, onAdmin, onGuest;
  const _RoleView({required this.onCustomer, required this.onAdmin,
      required this.onGuest});
  @override State<_RoleView> createState() => _RoleViewState();
}

class _RoleViewState extends State<_RoleView>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fade;
  late Animation<Offset>  _slide;

  @override
  void initState() {
    super.initState();
    _ctrl  = AnimationController(vsync: this,
        duration: const Duration(milliseconds: 500))..forward();
    _fade  = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut)
        .drive(Tween(begin: 0.0, end: 1.0));
    _slide = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic)
        .drive(Tween(begin: const Offset(0, 0.08), end: Offset.zero));
  }

  @override void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: FadeTransition(opacity: _fade,
      child: SlideTransition(position: _slide,
        child: SafeArea(child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 40),
          child: Column(children: [
            _HeroHeader(),
            const SizedBox(height: 40),
            // Loyalty teaser pill
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [kAccent.withAlpha(18), kAccent.withAlpha(8)],
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: kAccent.withAlpha(50)),
              ),
              child: Row(children: [
                Text('🏆', style: TextStyle(fontSize: 18)),
                const SizedBox(width: 10),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Loyalty Points',
                        style: TextStyle(fontWeight: FontWeight.w700,
                            fontSize: 13, color: kAccent2)),
                    Text('Sign in to earn 1 pt per 100 KES — '
                        'redeem for discounts',
                        style: TextStyle(fontSize: 11,
                            color: kAccent.withAlpha(180),
                            height: 1.4)),
                  ],
                )),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: kAccent.withAlpha(20),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text('FREE',
                      style: TextStyle(fontSize: 9,
                          fontWeight: FontWeight.w800, color: kAccent2)),
                ),
              ]),
            ),

            _RoleCard(
              icon: Icons.person_rounded,
              color: kAccent,
              title: 'Customer',
              subtitle: 'Sign in to see your rides, loyalty points\nand manage your profile',
              onTap: widget.onCustomer,
            ),
            const SizedBox(height: 14),
            _RoleCard(
              icon: Icons.admin_panel_settings_rounded,
              color: kIndigo,
              title: 'Admin / Staff',
              subtitle: 'Manage fleet, bookings and\nview business analytics',
              onTap: widget.onAdmin,
            ),
            const Spacer(),
            TextButton(
              onPressed: widget.onGuest,
              child: Text('Continue as Guest',
                  style: TextStyle(color: context.rq.muted, fontSize: 14)),
            ),
          ]),
        )),
      ),
    ),
  );
}

class _HeroHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Column(children: [
    Container(
      width: 80, height: 80,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [heroBg(context), heroColor(context)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
        boxShadow: [BoxShadow(
            color: kAccent.withAlpha(40), blurRadius: 20)],
        border: Border.all(color: kAccent.withAlpha(60), width: 2),
      ),
      child: ClipOval(child: Image.asset(
          'assets/images/logo.png', fit: BoxFit.cover)),
    ),
    const SizedBox(height: 16),
    Text('Royal Quad Bikes',
        style: TextStyle(fontFamily: 'Playfair', fontSize: 24,
            fontWeight: FontWeight.w700,
            color: Theme.of(context).colorScheme.onSurface)),
    const SizedBox(height: 4),
    Text('Who are you?',
        style: TextStyle(
            color: Theme.of(context).colorScheme.onSurface.withAlpha(140),
            fontSize: 14)),
  ]);
}

class _RoleCard extends StatefulWidget {
  final IconData icon;
  final Color color;
  final String title, subtitle;
  final VoidCallback onTap;
  const _RoleCard({required this.icon, required this.color,
      required this.title, required this.subtitle, required this.onTap});
  @override State<_RoleCard> createState() => _RoleCardState();
}

class _RoleCardState extends State<_RoleCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTapDown:   (_) => setState(() => _pressed = true),
    onTapUp:     (_) { setState(() => _pressed = false); widget.onTap(); },
    onTapCancel: ()  => setState(() => _pressed = false),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 120),
      transform: Matrix4.identity()..scale(_pressed ? 0.97 : 1.0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Theme.of(context).dividerColor),
        boxShadow: Theme.of(context).brightness == Brightness.dark
            ? kShadowMd : kShadowSm,
      ),
      child: Row(children: [
        Container(
          width: 52, height: 52,
          decoration: BoxDecoration(
            color: widget.color.withAlpha(15),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(widget.icon, color: widget.color, size: 26),
        ),
        const SizedBox(width: 16),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.title, style: TextStyle(
                fontWeight: FontWeight.w700, fontSize: 16, color: context.rq.text)),
            const SizedBox(height: 4),
            Text(widget.subtitle, style: TextStyle(
                color: context.rq.muted, fontSize: 12, height: 1.5)),
          ],
        )),
        Icon(Icons.chevron_right_rounded,
            color: widget.color.withAlpha(120), size: 22),
      ]),
    ),
  );
}

// ─── Auth Form ────────────────────────────────────────────────────────────────
class _AuthView extends StatefulWidget {
  final _Mode mode;
  final VoidCallback onToggleMode, onBack;
  const _AuthView({required this.mode, required this.onToggleMode,
      required this.onBack});
  @override State<_AuthView> createState() => _AuthViewState();
}

class _AuthViewState extends State<_AuthView> {
  final _nameCtrl  = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _pwCtrl    = TextEditingController();
  final _formKey   = GlobalKey<FormState>();
  bool   _showPw   = false;
  bool   _loading  = false;
  bool   _otpStep  = false;   // true = showing OTP entry screen
  String _otpCode  = '';       // the generated code (shown in snackbar)
  String _otpEntered = '';

  @override
  void dispose() {
    _nameCtrl.dispose(); _phoneCtrl.dispose(); _pwCtrl.dispose();
    super.dispose();
  }

  /// Generate a 6-digit OTP, display it (simulates SMS), show OTP screen.
  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    HapticFeedback.mediumImpact();

    if (widget.mode == _Mode.signUp && !_otpStep) {
      // Generate OTP and show verification step
      final rng = DateTime.now().millisecondsSinceEpoch % 1000000;
      _otpCode = rng.toString().padLeft(6, '0');
      setState(() => _otpStep = true);
      // Simulate SMS — display code in snackbar
      if (mounted) {
        showToast(context,
            'OTP sent to ${_phoneCtrl.text.trim()}: $_otpCode');
      }
      return;
    }

    setState(() => _loading = true);
    try {
      final prov = context.read<AppProvider>();
      if (widget.mode == _Mode.signIn) {
        await prov.signIn(_phoneCtrl.text.trim(), _pwCtrl.text);
        if (mounted) showToast(context, 'Welcome back! 🏍️');
      } else {
        // OTP already verified — register
        await prov.register(
            _nameCtrl.text.trim(), _phoneCtrl.text.trim(), _pwCtrl.text);
        if (mounted) showToast(context, 'Account created! Welcome 🏍️');
      }
    } catch (e) {
      if (mounted) showToast(context,
          e.toString().replaceFirst('Exception: ', ''), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _verifyOtp(String entered) {
    if (entered == _otpCode) {
      _otpEntered = entered;
      _submit(); // proceed to register
    } else {
      showToast(context, 'Incorrect OTP — please try again', error: true);
    }
  }

  void _resendOtp() {
    final rng = DateTime.now().millisecondsSinceEpoch % 1000000;
    _otpCode = rng.toString().padLeft(6, '0');
    showToast(context, 'New OTP: $_otpCode');
  }

  @override
  Widget build(BuildContext context) {
    if (_otpStep) return _OtpScreen(
      phone: _phoneCtrl.text.trim(),
      onVerify: _verifyOtp,
      onResend: _resendOtp,
      onBack: () => setState(() => _otpStep = false),
      loading: _loading,
    );

    return Scaffold(
    body: SafeArea(child: Form(
      key: _formKey,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

          // Top bar
          Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 0),
            child: Row(children: [
              IconButton(
                icon: Icon(Icons.arrow_back_rounded, color: context.rq.muted),
                onPressed: widget.onBack,
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(color: kBg2,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: kBorder)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  _ModePill('Sign In', widget.mode == _Mode.signIn,
                      () => widget.mode != _Mode.signIn
                          ? widget.onToggleMode() : null),
                  _ModePill('Sign Up', widget.mode == _Mode.signUp,
                      () => widget.mode != _Mode.signUp
                          ? widget.onToggleMode() : null),
                ]),
              ),
            ]),
          ),
          const SizedBox(height: 12),

          // Title
          Text(
            widget.mode == _Mode.signIn
                ? 'Welcome back 👋'
                : 'Create account',
            style: TextStyle(fontFamily: 'Playfair', fontSize: 28,
                fontWeight: FontWeight.w700, color: context.rq.text,
                letterSpacing: -.5),
          ),
          const SizedBox(height: 4),
          Text(
            widget.mode == _Mode.signIn
                ? 'Sign in to manage your rides'
                : 'Join Royal Quad Bikes today',
            style: TextStyle(color: context.rq.muted, fontSize: 14),
          ),
          const SizedBox(height: 32),

          // Fields
          if (widget.mode == _Mode.signUp) ...[
            TextFormField(
              controller: _nameCtrl,
              textCapitalization: TextCapitalization.words,
              validator: (v) =>
                  v?.trim().isEmpty == true ? 'Enter your name' : null,
              decoration: const InputDecoration(
                  labelText: 'Full Name',
                  hintText: 'John Kamau',
                  prefixIcon: Icon(Icons.person_outline_rounded, size: 18)),
            ),
            const SizedBox(height: 14),
          ],
          TextFormField(
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
            validator: (v) {
              final n = v?.replaceAll(RegExp(r'[\s\-().]+'), '') ?? '';
              return n.length < 9 ? 'Enter a valid phone number' : null;
            },
            decoration: const InputDecoration(
                labelText: 'Phone Number',
                hintText: '0712 345 678',
                prefixIcon: Icon(Icons.phone_outlined, size: 18)),
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _pwCtrl,
            obscureText: !_showPw,
            validator: (v) => (v?.length ?? 0) < 4
                ? 'Password must be at least 4 characters' : null,
            decoration: InputDecoration(
              labelText: 'Password',
              hintText: '••••••••',
              prefixIcon: const Icon(Icons.lock_outline_rounded, size: 18),
              suffixIcon: IconButton(
                icon: Icon(
                  _showPw ? Icons.visibility_off_outlined
                           : Icons.visibility_outlined,
                  size: 18, color: context.rq.muted),
                onPressed: () => setState(() => _showPw = !_showPw),
              ),
            ),
          ),

          if (widget.mode == _Mode.signIn) ...[
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => showToast(
                    context, 'Contact admin to reset your password'),
                child: Text('Forgot password?',
                    style: TextStyle(color: context.rq.muted, fontSize: 13)),
              ),
            ),
          ] else
            const SizedBox(height: 24),

          // Submit button
          SizedBox(
            width: double.infinity, height: 54,
            child: ElevatedButton(
              onPressed: _loading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: kAccent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: _loading
                  ? const SizedBox(width: 22, height: 22,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2.5))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(widget.mode == _Mode.signIn
                            ? Icons.login_rounded
                            : Icons.person_add_rounded,
                            size: 18),
                        const SizedBox(width: 10),
                        Text(
                          widget.mode == _Mode.signIn
                              ? 'Sign In'
                              : 'Create Account',
                          style: const TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
            ),
          ),

          const SizedBox(height: 16),
          Center(child: TextButton(
            onPressed: widget.onToggleMode,
            child: RichText(text: TextSpan(
              style: TextStyle(fontSize: 13, color: context.rq.muted),
              children: [
                TextSpan(text: widget.mode == _Mode.signIn
                    ? "Don't have an account? "
                    : 'Already registered? '),
                TextSpan(
                  text: widget.mode == _Mode.signIn
                      ? 'Register free' : 'Sign in',
                  style: const TextStyle(
                      color: kAccent, fontWeight: FontWeight.w700),
                ),
              ],
            )),
          )),
        ]),
      ),
    )),
  );
  }
}

// ── Shared auth widgets ────────────────────────────────────────────────────────
class _ModePill extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback? onTap;
  const _ModePill(this.label, this.active, this.onTap);

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: active ? kCard : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        boxShadow: active ? kShadowSm : null,
      ),
      child: Text(label, style: TextStyle(
        fontSize: 13, fontWeight: FontWeight.w600,
        color: active ? context.rq.text : context.rq.muted,
      )),
    ),
  );
}

// ─── Logged-In View ───────────────────────────────────────────────────────────
class _LoggedInView extends StatelessWidget {
  final AppUser user;
  const _LoggedInView({required this.user});

  @override
  Widget build(BuildContext context) {
    final prov    = context.watch<AppProvider>();
    final myRides = prov.getUserHistory();
    final spent   = myRides.fold(0, (s, b) => s + b.totalPaid);

    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 210, pinned: true, elevation: 0,
            backgroundColor: heroColor(context),
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.parallax,
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [heroBg(context), heroColor(context), heroColor(context)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: kAccent.withAlpha(30),
                      child: Text(
                        user.name.isNotEmpty
                            ? user.name[0].toUpperCase() : '?',
                        style: const TextStyle(color: kAccent,
                            fontWeight: FontWeight.w700, fontSize: 28)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(user.name, style: const TextStyle(
                            fontFamily: 'Playfair', fontSize: 20,
                            fontWeight: FontWeight.w700, color: Colors.white)),
                        if (user.phone.isNotEmpty)
                          Text(user.phone, style: const TextStyle(
                              color: context.rq.muted, fontSize: 12)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(10),
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(
                                color: Colors.white.withAlpha(18)),
                          ),
                          child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                            Icon(Icons.verified_rounded,
                                size: 10, color: context.rq.muted),
                            SizedBox(width: 5),
                            Text('Verified Customer', style: TextStyle(
                                color: context.rq.muted, fontSize: 10,
                                fontWeight: FontWeight.w600)),
                          ]),
                        ),
                      ],
                    )),
                  ]),
                )),
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(delegate: SliverChildListDelegate([

              // Stats
              Row(children: [
                _StatTile(icon: Icons.directions_bike_rounded,
                    color: kAccent,
                    value: '${myRides.length}',
                    label: 'Total Rides'),
                const SizedBox(width: 12),
                _StatTile(icon: Icons.payments_outlined,
                    color: kGreen,
                    value: spent.kes,
                    label: 'KES Spent'),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                _StatTile(
                  icon: Icons.local_fire_department_rounded,
                  color: kRed,
                  value: () {
                    if (myRides.isEmpty) return '--';
                    final now = DateTime.now();
                    final total = myRides.where((b) =>
                        b.startTime.year == now.year &&
                        b.startTime.month == now.month)
                        .fold(0, (s, b) => s + b.totalPaid);
                    return '${total.kes} KES';
                  }(),
                  label: 'This Month',
                ),
                const SizedBox(width: 12),
                _StatTile(
                  icon: Icons.star_rounded,
                  color: kOrange,
                  value: () {
                    if (myRides.isEmpty) return '--';
                    final rated = myRides
                        .where((b) => b.rating != null).toList();
                    if (rated.isEmpty) return '--';
                    final avg = rated.fold(0,
                            (s, b) => s + b.rating!) / rated.length;
                    return avg.toStringAsFixed(1);
                  }(),
                  label: 'Avg Rating',
                ),
              ]),
              const SizedBox(height: 20),

              // ── Loyalty Points Card ─────────────────────────────────
              _LoyaltyCard(phone: user.phone),
              const SizedBox(height: 20),

              // Account card
              _Heading('Account'),
              const SizedBox(height: 10),
              AppCard(child: Column(children: [
                _InfoRow(Icons.person_outline_rounded, 'Name', user.name),
                if (user.phone.isNotEmpty)
                  _InfoRow(Icons.phone_outlined, 'Phone', user.phone),
                _InfoRow(Icons.lock_outline_rounded, 'Auth',
                    'Phone & Password', isLast: true),
              ])),
              const SizedBox(height: 20),

              // Ride history
              _Heading('Ride History'),
              const SizedBox(height: 10),
              if (myRides.isEmpty)
                AppCard(child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 32),
                  child: Column(children: [
                    Text('🏜️',
                        style: TextStyle(fontSize: 44)),
                    const SizedBox(height: 10),
                    const Text('No rides yet',
                        style: TextStyle(fontWeight: FontWeight.w700,
                            fontSize: 15)),
                    const SizedBox(height: 4),
                    Text('Hit the dunes!',
                        style: TextStyle(color: context.rq.muted, fontSize: 13)),
                    const SizedBox(height: 14),
                    TextButton.icon(
                      onPressed: () => context.go('/'),
                      icon: const Icon(
                          Icons.directions_bike_rounded, size: 16),
                      label: const Text('Book a Ride'),
                      style: TextButton.styleFrom(
                          foregroundColor: kAccent),
                    ),
                  ]),
                ))
              else
                ...myRides.map((b) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _RideHistoryTile(booking: b),
                )),

              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () =>
                      context.read<AppProvider>().signOut(),
                  icon: const Icon(Icons.logout_rounded, size: 18),
                  label: const Text('Sign Out'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: context.rq.muted,
                    side: const BorderSide(color: kBorder),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ])),
          ),
        ],
      ),
    );
  }
}

// ─── Ride History Tile ────────────────────────────────────────────────────────
class _RideHistoryTile extends StatelessWidget {
  final Booking booking;
  const _RideHistoryTile({required this.booking});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () => context.push('/receipt/${booking.id}'),
    child: AppCard(child: Row(children: [
      Stack(children: [
        Container(
          width: 46, height: 46,
          decoration: BoxDecoration(
            color: kAccent.withAlpha(12),
            borderRadius: BorderRadius.circular(13),
          ),
          child: const Icon(Icons.directions_bike_rounded,
              color: kAccent, size: 22),
        ),
        if (booking.rating != null)
          Positioned(bottom: -1, right: -1,
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: kAccent,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.star_rounded,
                    size: 8, color: Colors.white),
                const SizedBox(width: 2),
                Text('${booking.rating}', style: const TextStyle(
                    color: Colors.white, fontSize: 8,
                    fontWeight: FontWeight.w800)),
              ]),
            )),
      ]),
      const SizedBox(width: 12),
      Expanded(child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(booking.quadName, style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14, color: context.rq.text)),
          const SizedBox(height: 3),
          Row(children: [
            Icon(Icons.timer_rounded,
                size: 11, color: context.rq.muted),
            const SizedBox(width: 3),
            Text('${booking.duration} min',
                style: TextStyle(color: context.rq.muted, fontSize: 12)),
            const SizedBox(width: 8),
            Icon(Icons.calendar_today_rounded,
                size: 11, color: context.rq.muted),
            const SizedBox(width: 3),
            Text(
              '${booking.startTime.day}/'
              '${booking.startTime.month}/'
              '${booking.startTime.year}',
              style: TextStyle(color: context.rq.muted, fontSize: 12)),
          ]),
        ],
      )),
      Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
        Text('${booking.totalPaid.kes} KES',
            style: const TextStyle(color: kAccent,
                fontWeight: FontWeight.w800, fontSize: 14)),
        if (booking.overtimeCharge > 0)
          Text('+${booking.overtimeCharge.kes} OT',
              style: const TextStyle(color: kRed, fontSize: 10)),
        const SizedBox(height: 2),
        Icon(Icons.chevron_right_rounded,
            color: context.rq.muted, size: 14),
      ]),
    ])),
  );
}

// ── Helper widgets ─────────────────────────────────────────────────────────────
class _StatTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String value, label;
  const _StatTile({required this.icon, required this.color,
      required this.value, required this.label});

  @override
  Widget build(BuildContext context) => Expanded(
    child: AppCard(child: Padding(
      padding: const EdgeInsets.all(4),
      child: Row(children: [
        Container(
          width: 42, height: 42,
          decoration: BoxDecoration(
              color: color.withAlpha(15),
              borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
          Text(value, style: TextStyle(fontFamily: 'Playfair',
              fontSize: 18, fontWeight: FontWeight.w700, color: context.rq.text)),
          Text(label, style: TextStyle(
              color: context.rq.muted, fontSize: 11)),
        ])),
      ]),
    )),
  );
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final bool isLast;
  const _InfoRow(this.icon, this.label, this.value, {this.isLast = false});

  @override
  Widget build(BuildContext context) => Column(children: [
    Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(children: [
        Icon(icon, size: 16, color: context.rq.muted),
        const SizedBox(width: 12),
        Text(label, style: TextStyle(color: context.rq.muted, fontSize: 13)),
        const Spacer(),
        Text(value, style: TextStyle(
            fontWeight: FontWeight.w600, fontSize: 13, color: context.rq.text)),
      ]),
    ),
    if (!isLast) const Divider(height: 1, color: kBorder),
  ]);
}

class _Heading extends StatelessWidget {
  final String text;
  const _Heading(this.text);

  @override
  Widget build(BuildContext context) => Text(text,
      style: TextStyle(fontFamily: 'Playfair',
          fontSize: 18, fontWeight: FontWeight.w700, color: context.rq.text));
}

// ── OTP Verification Screen ───────────────────────────────────────────────────
class _OtpScreen extends StatefulWidget {
  final String phone;
  final void Function(String) onVerify;
  final VoidCallback onResend, onBack;
  final bool loading;
  const _OtpScreen({required this.phone, required this.onVerify,
      required this.onResend, required this.onBack, required this.loading});
  @override State<_OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<_OtpScreen>
    with SingleTickerProviderStateMixin {
  final _controllers = List.generate(6, (_) => TextEditingController());
  final _focuses     = List.generate(6, (_) => FocusNode());
  late AnimationController _shakeCtrl;
  late Animation<double>   _shakeAnim;
  int _resendSeconds = 30;

  @override
  void initState() {
    super.initState();
    _shakeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500));
    _shakeAnim = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: -8.0), weight: 1),
      TweenSequenceItem(tween: Tween(begin: -8.0, end: 8.0), weight: 2),
      TweenSequenceItem(tween: Tween(begin: 8.0, end: -8.0), weight: 2),
      TweenSequenceItem(tween: Tween(begin: -8.0, end: 0.0), weight: 1),
    ]).animate(CurvedAnimation(parent: _shakeCtrl, curve: Curves.easeInOut));

    _startResendTimer();
  }

  void _startResendTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() => _resendSeconds = (_resendSeconds - 1).clamp(0, 30));
      return _resendSeconds > 0;
    });
  }

  @override
  void dispose() {
    for (final c in _controllers) c.dispose();
    for (final f in _focuses) f.dispose();
    _shakeCtrl.dispose();
    super.dispose();
  }

  String get _enteredCode =>
      _controllers.map((c) => c.text).join();

  void _onDigit(int index, String val) {
    if (val.length > 1) {
      // Handle paste — fill all boxes
      final digits = val.replaceAll(RegExp(r'\D'), '').substring(0, 6.clamp(0, val.length));
      for (var i = 0; i < digits.length && i < 6; i++) {
        _controllers[i].text = digits[i];
      }
      if (digits.length == 6) {
        _focuses[5].requestFocus();
        _verify();
      }
      return;
    }
    if (val.isNotEmpty && index < 5) {
      _focuses[index + 1].requestFocus();
    }
    if (_enteredCode.length == 6) _verify();
  }

  void _onBackspace(int index) {
    if (_controllers[index].text.isEmpty && index > 0) {
      _controllers[index - 1].clear();
      _focuses[index - 1].requestFocus();
    }
  }

  void _verify() {
    final code = _enteredCode;
    if (code.length < 6) return;
    widget.onVerify(code);
    // Shake on wrong (handled by parent showing toast)
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted && code != '') _shakeCtrl.forward(from: 0);
    });
  }

  void _resend() {
    if (_resendSeconds > 0) return;
    for (final c in _controllers) c.clear();
    _focuses[0].requestFocus();
    setState(() => _resendSeconds = 30);
    widget.onResend();
    _startResendTimer();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: IconButton(
              icon: Icon(Icons.arrow_back_rounded, color: context.rq.muted),
              onPressed: widget.onBack,
            ),
          ),
          const SizedBox(height: 16),

          // Icon
          Container(
            width: 72, height: 72,
            decoration: BoxDecoration(
              color: kAccent.withAlpha(15),
              shape: BoxShape.circle,
              border: Border.all(color: kAccent.withAlpha(40), width: 2),
            ),
            child: const Icon(Icons.sms_rounded, color: kAccent, size: 32),
          ),
          const SizedBox(height: 20),

          Text('Verify your number',
              style: TextStyle(fontFamily: 'Playfair', fontSize: 28,
                  fontWeight: FontWeight.w700, color: context.rq.text,
                  letterSpacing: -0.5)),
          const SizedBox(height: 6),
          RichText(text: TextSpan(
            style: TextStyle(color: context.rq.muted, fontSize: 14,
                height: 1.5),
            children: [
              const TextSpan(text: 'Enter the 6-digit code sent to '),
              TextSpan(text: widget.phone,
                  style: TextStyle(color: context.rq.text,
                      fontWeight: FontWeight.w700)),
            ],
          )),
          const SizedBox(height: 32),

          // OTP boxes
          AnimatedBuilder(
            animation: _shakeAnim,
            builder: (_, child) => Transform.translate(
              offset: Offset(_shakeAnim.value, 0),
              child: child,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(6, (i) => _OtpBox(
                controller: _controllers[i],
                focusNode: _focuses[i],
                onChanged: (v) => _onDigit(i, v),
                onBackspace: () => _onBackspace(i),
                autofocus: i == 0,
              )),
            ),
          ),

          const SizedBox(height: 32),

          // Verify button
          SizedBox(
            width: double.infinity, height: 54,
            child: ElevatedButton(
              onPressed: widget.loading ? null : () => _verify(),
              style: ElevatedButton.styleFrom(
                backgroundColor: kAccent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: widget.loading
                  ? const SizedBox(width: 22, height: 22,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2.5))
                  : Text('Verify & Create Account',
                      style: TextStyle(fontSize: 15,
                          fontWeight: FontWeight.w700)),
            ),
          ),

          const SizedBox(height: 20),

          // Resend
          Center(child: GestureDetector(
            onTap: _resendSeconds == 0 ? _resend : null,
            child: RichText(text: TextSpan(
              style: TextStyle(fontSize: 13, color: context.rq.muted),
              children: [
                const TextSpan(text: "Didn't receive it? "),
                TextSpan(
                  text: _resendSeconds > 0
                      ? 'Resend in ${_resendSeconds}s'
                      : 'Resend OTP',
                  style: TextStyle(
                    color: _resendSeconds > 0 ? context.rq.muted : kAccent,
                    fontWeight: _resendSeconds > 0
                        ? FontWeight.w400 : FontWeight.w700,
                  ),
                ),
              ],
            )),
          )),

          const SizedBox(height: 16),

          // Info note
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: kIndigo.withAlpha(10),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: kIndigo.withAlpha(30)),
            ),
            child: const Row(children: [
              Icon(Icons.info_outline_rounded, color: kIndigo, size: 16),
              SizedBox(width: 10),
              Expanded(child: Text(
                'The OTP is shown in the notification bar above for testing. '
                'In production, it will be sent via SMS.',
                style: TextStyle(color: kIndigo, fontSize: 12, height: 1.5),
              )),
            ]),
          ),
        ]),
      ),
    ),
  );
}

// ── Single OTP digit box ──────────────────────────────────────────────────────
class _OtpBox extends StatefulWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;
  final VoidCallback onBackspace;
  final bool autofocus;
  const _OtpBox({required this.controller, required this.focusNode,
      required this.onChanged, required this.onBackspace,
      this.autofocus = false});
  @override State<_OtpBox> createState() => _OtpBoxState();
}

class _OtpBoxState extends State<_OtpBox> {
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    widget.focusNode.addListener(() {
      if (mounted) setState(() => _focused = widget.focusNode.hasFocus);
    });
  }

  @override
  Widget build(BuildContext context) => AnimatedContainer(
    duration: const Duration(milliseconds: 150),
    width: 46, height: 56,
    decoration: BoxDecoration(
      color: _focused
          ? kAccent.withAlpha(10)
          : Theme.of(context).cardColor,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(
        color: _focused ? kAccent
            : widget.controller.text.isNotEmpty ? kAccent.withAlpha(80)
            : kBorder,
        width: _focused ? 2 : 1.5,
      ),
      boxShadow: _focused ? [
        BoxShadow(color: kAccent.withAlpha(30),
            blurRadius: 12, offset: const Offset(0, 3))
      ] : kShadowXs,
    ),
    child: KeyboardListener(
      focusNode: FocusNode(),
      onKeyEvent: (e) {
        if (e is KeyDownEvent &&
            e.logicalKey == LogicalKeyboardKey.backspace &&
            widget.controller.text.isEmpty) {
          widget.onBackspace();
        }
      },
      child: TextField(
        controller: widget.controller,
        focusNode: widget.focusNode,
        autofocus: widget.autofocus,
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        maxLength: 6, // Allow paste of full 6 digits
        style: TextStyle(
            fontSize: 22, fontWeight: FontWeight.w800, color: context.rq.text),
        decoration: const InputDecoration(
          border: InputBorder.none,
          counterText: '',
          contentPadding: EdgeInsets.zero,
        ),
        onChanged: widget.onChanged,
        inputFormatters: [
          // Allow only digits
        ],
      ),
    ),
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Loyalty Points Card
// ─────────────────────────────────────────────────────────────────────────────
class _LoyaltyCard extends StatelessWidget {
  final String phone;
  const _LoyaltyCard({required this.phone});

  // Tier thresholds
  static const _tiers = [
    (name: 'Bronze',   pts: 0,    icon: '🥉', color: Color(0xFFCD7F32)),
    (name: 'Silver',   pts: 200,  icon: '🥈', color: Color(0xFF94A3B8)),
    (name: 'Gold',     pts: 500,  icon: '🥇', color: Color(0xFFC9972A)),
    (name: 'Platinum', pts: 1000, icon: '💎', color: Color(0xFF6366F1)),
  ];

  static ({String name, String icon, Color color, int next}) _tier(int pts) {
    var idx = 0;
    for (var i = 0; i < _tiers.length; i++) {
      if (pts >= _tiers[i].pts) idx = i;
    }
    final next = idx < _tiers.length - 1 ? _tiers[idx + 1].pts : -1;
    return (
      name:  _tiers[idx].name,
      icon:  _tiers[idx].icon,
      color: _tiers[idx].color,
      next:  next,
    );
  }

  @override
  Widget build(BuildContext context) {
    final acc    = StorageService.getLoyaltyAccount(phone);
    final pts    = acc?.points ?? 0;
    final earned = acc?.totalEarned ?? 0;
    final rides  = acc?.totalRides ?? 0;
    final tier   = _tier(pts);
    final accent = Theme.of(context).colorScheme.primary;

    // Progress to next tier
    final tierIdx = _tiers.indexWhere((t) => t.name == tier.name);
    final prevPts = _tiers[tierIdx].pts;
    final nextPts = tier.next;
    final progress = nextPts == -1
        ? 1.0
        : ((pts - prevPts) / (nextPts - prevPts)).clamp(0.0, 1.0);

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            tier.color.withAlpha(30),
            Theme.of(context).cardColor,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
            color: tier.color.withAlpha(60), width: 1.5),
        boxShadow: [
          BoxShadow(color: tier.color.withAlpha(25),
              blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

          // ── Header ────────────────────────────────────────────────────────
          Row(children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: tier.color.withAlpha(20),
                borderRadius: BorderRadius.circular(13),
                border: Border.all(color: tier.color.withAlpha(50), width: 1.5),
              ),
              child: Center(child: Text(tier.icon,
                  style: const TextStyle(fontSize: 22))),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text('Loyalty Points',
                      style: TextStyle(
                          fontFamily: 'Playfair',
                          fontSize: 16, fontWeight: FontWeight.w700,
                          color: Theme.of(context).colorScheme.onSurface)),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: tier.color.withAlpha(18),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: tier.color.withAlpha(50)),
                    ),
                    child: Text(tier.name,
                        style: TextStyle(
                            fontSize: 10, fontWeight: FontWeight.w800,
                            color: tier.color, letterSpacing: .5)),
                  ),
                ]),
                const SizedBox(height: 2),
                Text('Earn 1 pt per 100 KES spent',
                    style: TextStyle(
                        fontSize: 11,
                        color: Theme.of(context).colorScheme.onSurface
                            .withAlpha(110))),
              ],
            )),
          ]),

          const SizedBox(height: 20),

          // ── Big points number ──────────────────────────────────────────────
          Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('$pts',
                style: TextStyle(
                    fontFamily: 'Playfair',
                    fontSize: 52, fontWeight: FontWeight.w900,
                    color: tier.color, height: 1)),
            const SizedBox(width: 8),
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text('pts',
                  style: TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w600,
                      color: tier.color.withAlpha(160))),
            ),
            const Spacer(),
            // Mini stats
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              _MiniStat('Total earned', '$earned pts'),
              const SizedBox(height: 4),
              _MiniStat('Total rides', '$rides'),
            ]),
          ]),

          const SizedBox(height: 16),

          // ── Progress bar ───────────────────────────────────────────────────
          ClipRRect(
            borderRadius: BorderRadius.circular(100),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 7,
              backgroundColor: tier.color.withAlpha(15),
              valueColor: AlwaysStoppedAnimation<Color>(tier.color),
            ),
          ),
          const SizedBox(height: 8),
          Row(children: [
            Text(nextPts == -1
                ? '🏆 Maximum tier reached!'
                : '${nextPts - pts} pts to ${_tiers[tierIdx + 1].name}',
                style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w600,
                    color: tier.color.withAlpha(180))),
            const Spacer(),
            Text(nextPts == -1
                ? 'Platinum'
                : '$pts / $nextPts',
                style: TextStyle(
                    fontSize: 11,
                    color: Theme.of(context).colorScheme.onSurface.withAlpha(80))),
          ]),

          const SizedBox(height: 16),
          Divider(color: Theme.of(context).dividerColor),
          const SizedBox(height: 12),

          // ── Tier ladder ────────────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: _tiers.map((t) {
              final reached = pts >= t.pts;
              return Column(children: [
                Text(t.icon, style: TextStyle(
                    fontSize: 18,
                    color: reached ? null : const Color(0x33000000))),
                const SizedBox(height: 3),
                Text(t.name, style: TextStyle(
                    fontSize: 9, fontWeight: FontWeight.w700,
                    color: reached
                        ? t.color
                        : Theme.of(context).colorScheme.onSurface.withAlpha(40))),
                const SizedBox(height: 2),
                Text(t.pts == 0 ? 'Start' : '${t.pts}',
                    style: TextStyle(
                        fontSize: 8,
                        color: Theme.of(context).colorScheme.onSurface.withAlpha(60))),
              ]);
            }).toList(),
          ),

          const SizedBox(height: 12),

          // ── Redeem info ────────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(
                horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: accent.withAlpha(8),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: accent.withAlpha(20)),
            ),
            child: Row(children: [
              Icon(Icons.info_outline_rounded, size: 14, color: accent),
              const SizedBox(width: 8),
              Expanded(child: Text(
                  'Show your points to staff at the dunes '
                  'to redeem — 100 pts = 100 KES discount.',
                  style: TextStyle(
                      fontSize: 11, color: accent.withAlpha(200),
                      height: 1.5))),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label, value;
  const _MiniStat(this.label, this.value);
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.end,
    children: [
      Text(value, style: TextStyle(
          fontSize: 13, fontWeight: FontWeight.w800,
          color: Theme.of(context).colorScheme.onSurface)),
      Text(label, style: TextStyle(
          fontSize: 9,
          color: Theme.of(context).colorScheme.onSurface.withAlpha(80))),
    ],
  );
}
