import '../../models/models.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../services/storage.dart';
import '../../theme/theme.dart';

// serverClientId = WEB OAuth client ID (works on Android without Firebase)
// clientId       = iOS only — do NOT use on Android
const _kWebClientId =
    '979880974098-uvtfo8sokk6bemv38h9dm89gfl84raj7.apps.googleusercontent.com';

final _gsi = GoogleSignIn(
  serverClientId: _kWebClientId,
  scopes: ['email', 'profile'],
);

enum _Role { customer, admin, guest }
enum _Mode { signIn, signUp }

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  _Role? _role;
  _Mode  _mode = _Mode.signIn;

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AppProvider>().user;
    if (user != null) return _LoggedIn(user: user);
    if (_role == null) return _RoleChooser(onSelect: (r) {
      if (r == _Role.admin) { context.go('/admin'); return; }
      if (r == _Role.guest) { context.go('/'); return; }
      setState(() => _role = r);
    });
    return _AuthForm(
      mode: _mode,
      onToggle: () => setState(() =>
          _mode = _mode == _Mode.signIn ? _Mode.signUp : _Mode.signIn),
      onBack: () => setState(() => _role = null),
    );
  }
}

// ─── Role Chooser ─────────────────────────────────────────────────────────────
class _RoleChooser extends StatelessWidget {
  final ValueChanged<_Role> onSelect;
  const _RoleChooser({required this.onSelect});

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(child: SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        const SizedBox(height: 20),
        HeroCard(
          padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 24),
          child: Column(children: [
            Stack(alignment: Alignment.center, children: [
              Container(width: 110, height: 110, decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: kAccent.withAlpha(80), width: 3),
                boxShadow: [BoxShadow(color: kAccent.withAlpha(40), blurRadius: 24)],
              )),
              CircleAvatar(radius: 50,
                  backgroundImage: const AssetImage('assets/images/logo.png'),
                  backgroundColor: Colors.transparent),
            ]),
            const SizedBox(height: 16),
            const Text('Royal Quad Bikes', style: TextStyle(
                fontFamily: 'Playfair', fontSize: 24,
                fontWeight: FontWeight.w700, color: Colors.white)),
            const SizedBox(height: 4),
            const Text('MAMBRUI SAND DUNES · KENYA',
                style: TextStyle(color: Colors.white30, fontSize: 11, letterSpacing: 2)),
          ]),
        ),
        const SizedBox(height: 24),
        const Text('HOW ARE YOU USING THE APP?', style: TextStyle(
            color: kMuted, fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        _RoleCard(icon: Icons.directions_bike_rounded, color: kAccent,
            title: 'Customer',
            desc: 'Book rides, view history & manage your account',
            onTap: () => onSelect(_Role.customer)),
        const SizedBox(height: 10),
        _RoleCard(icon: Icons.shield_rounded, color: kIndigo,
            title: 'Admin / Staff',
            desc: 'Fleet management, bookings & analytics',
            onTap: () => onSelect(_Role.admin)),
        const SizedBox(height: 10),
        _RoleCard(icon: Icons.person_outline_rounded, color: kMuted,
            title: 'Browse as Guest', desc: 'Explore without an account',
            onTap: () => onSelect(_Role.guest)),
        const SizedBox(height: 40),
      ]),
    )),
  );
}

class _RoleCard extends StatelessWidget {
  final IconData icon; final Color color;
  final String title, desc; final VoidCallback onTap;
  const _RoleCard({required this.icon, required this.color,
      required this.title, required this.desc, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: color.withAlpha(12), borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color.withAlpha(40))),
      child: Row(children: [
        Container(width: 44, height: 44,
            decoration: BoxDecoration(color: color.withAlpha(20),
                borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 22)),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 2),
          Text(desc, style: const TextStyle(color: kMuted, fontSize: 12, height: 1.3)),
        ])),
        Icon(Icons.chevron_right_rounded, color: color.withAlpha(100)),
      ]),
    ),
  );
}

// ─── Auth Form ────────────────────────────────────────────────────────────────
class _AuthForm extends StatefulWidget {
  final _Mode mode;
  final VoidCallback onToggle, onBack;
  const _AuthForm({required this.mode, required this.onToggle, required this.onBack});
  @override State<_AuthForm> createState() => _AuthFormState();
}

class _AuthFormState extends State<_AuthForm> {
  String _name = '', _phone = '', _password = '';
  bool _showPw = false, _loading = false, _gLoading = false;

  Future<void> _googleSignIn() async {
    setState(() => _gLoading = true);
    try {
      await _gsi.signOut(); // force account picker every time
      final account = await _gsi.signIn();
      if (account == null) return; // user cancelled

      final u = await StorageService.upsertGoogleUser(
        googleId:  account.id,
        name:      account.displayName ?? account.email.split('@').first,
        email:     account.email,
        avatarUrl: account.photoUrl ?? '',
      );
      if (!mounted) return;
      context.read<AppProvider>().setUser(u);
      showToast(context, 'Welcome, ${u.name}! 🏍️');
    } on Exception catch (e) {
      if (!mounted) return;
      final msg = e.toString();
      if (msg.contains('network_error')) {
        showToast(context, 'No internet connection', error: true);
      } else if (msg.contains('sign_in_failed') || msg.contains('ApiException: 10')) {
        showToast(context,
            'Google Sign-In not configured for this build.\nUse phone/password instead.',
            error: true);
      } else {
        showToast(context, 'Google Sign-In failed. Try phone/password.', error: true);
      }
    } finally {
      if (mounted) setState(() => _gLoading = false);
    }
  }

  Future<void> _submit() async {
    if (_phone.trim().isEmpty) { showToast(context, 'Enter phone number', error: true); return; }
    if (_password.isEmpty) { showToast(context, 'Enter password', error: true); return; }
    setState(() => _loading = true);
    try {
      final prov = context.read<AppProvider>();
      if (widget.mode == _Mode.signIn) {
        await prov.signIn(_phone.trim(), _password);
      } else {
        if (_name.trim().isEmpty) { showToast(context, 'Enter your name', error: true); return; }
        await prov.register(_name.trim(), _phone.trim(), _password);
      }
      if (mounted) showToast(context, 'Welcome! 🏍️');
    } catch (e) {
      if (mounted) showToast(context,
          e.toString().replaceFirst('Exception: ', ''), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(child: SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        HeroCard(radius: 24, child: Stack(children: [
          Positioned(top: 8, left: 8, child: IconButton(
            icon: const Icon(Icons.arrow_back_rounded, color: Colors.white54),
            onPressed: widget.onBack)),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 24),
            child: Column(children: [
              CircleAvatar(radius: 30,
                  backgroundImage: const AssetImage('assets/images/logo.png'),
                  backgroundColor: Colors.transparent),
              const SizedBox(height: 12),
              Text(widget.mode == _Mode.signIn ? 'Welcome Back' : 'Create Account',
                  style: const TextStyle(fontFamily: 'Playfair',
                      fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
              const SizedBox(height: 4),
              Text(widget.mode == _Mode.signIn ? 'Sign in to continue' : 'Join Royal Quad Bikes',
                  style: const TextStyle(color: Colors.white38, fontSize: 12)),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(color: Colors.black26,
                    borderRadius: BorderRadius.circular(16)),
                child: Row(children: [
                  _Tab('Sign In', widget.mode == _Mode.signIn,
                      widget.mode != _Mode.signIn ? widget.onToggle : null),
                  _Tab('Sign Up', widget.mode == _Mode.signUp,
                      widget.mode != _Mode.signUp ? widget.onToggle : null),
                ]),
              ),
            ]),
          ),
        ])),

        const SizedBox(height: 24),

        // ── Google button ────────────────────────────────────────────────
        _GoogleBtn(loading: _gLoading, onTap: _googleSignIn),

        const SizedBox(height: 16),
        Row(children: [
          const Expanded(child: Divider(color: kBorder)),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text('or', style: const TextStyle(color: kMuted, fontSize: 12))),
          const Expanded(child: Divider(color: kBorder)),
        ]),
        const SizedBox(height: 16),

        // ── Phone / password ─────────────────────────────────────────────
        if (widget.mode == _Mode.signUp) ...[
          TextFormField(
            decoration: const InputDecoration(labelText: 'Full Name',
                prefixIcon: Icon(Icons.person_outline_rounded, size: 18)),
            onChanged: (v) => _name = v,
          ),
          const SizedBox(height: 12),
        ],
        TextFormField(
          decoration: const InputDecoration(labelText: 'Phone Number',
              prefixIcon: Icon(Icons.phone_outlined, size: 18)),
          keyboardType: TextInputType.phone,
          onChanged: (v) => _phone = v,
        ),
        const SizedBox(height: 12),
        TextFormField(
          decoration: InputDecoration(
            labelText: 'Password',
            prefixIcon: const Icon(Icons.lock_outline_rounded, size: 18),
            suffixIcon: IconButton(
              icon: Icon(_showPw ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined, size: 18),
              onPressed: () => setState(() => _showPw = !_showPw),
            ),
          ),
          obscureText: !_showPw,
          onChanged: (v) => _password = v,
        ),
        const SizedBox(height: 20),

        PrimaryButton(
          label: widget.mode == _Mode.signIn ? 'Sign In' : 'Create Account',
          icon: widget.mode == _Mode.signIn
              ? Icons.login_rounded : Icons.person_add_rounded,
          onTap: _submit, loading: _loading,
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: widget.onToggle,
          child: Text(
            widget.mode == _Mode.signIn
                ? "Don't have an account? Register free"
                : 'Already have an account? Sign in',
            style: const TextStyle(color: kAccent, fontSize: 13)),
        ),
        const SizedBox(height: 40),
      ]),
    )),
  );
}

class _Tab extends StatelessWidget {
  final String label; final bool active; final VoidCallback? onTap;
  const _Tab(this.label, this.active, this.onTap);
  @override
  Widget build(BuildContext context) => Expanded(child: GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
          color: active ? Colors.white.withAlpha(25) : Colors.transparent,
          borderRadius: BorderRadius.circular(12)),
      child: Text(label, textAlign: TextAlign.center, style: TextStyle(
          color: active ? Colors.white : Colors.white38,
          fontWeight: active ? FontWeight.w700 : FontWeight.w400,
          fontSize: 13)),
    ),
  ));
}

// ── Google branded button ──────────────────────────────────────────────────────
class _GoogleBtn extends StatelessWidget {
  final bool loading; final VoidCallback onTap;
  const _GoogleBtn({required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: loading ? null : onTap,
    child: Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder, width: 1.5),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(12),
            blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: loading
          ? const Center(child: SizedBox(width: 20, height: 20,
              child: CircularProgressIndicator(strokeWidth: 2)))
          : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              _GoogleG(size: 22),
              const SizedBox(width: 10),
              const Text('Continue with Google', style: TextStyle(
                  color: Color(0xFF3C4043),
                  fontWeight: FontWeight.w600, fontSize: 15)),
            ]),
    ),
  );
}

class _GoogleG extends StatelessWidget {
  final double size;
  const _GoogleG({required this.size});

  @override
  Widget build(BuildContext context) => SizedBox(
    width: size, height: size,
    child: CustomPaint(painter: _GPainter()),
  );
}

class _GPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size s) {
    final cx = s.width / 2, cy = s.height / 2, r = s.width / 2;
    final p = Paint()..style = PaintingStyle.fill;
    void arc(Color c, double start, double sweep) {
      p.color = c;
      canvas.drawArc(Rect.fromCircle(center: Offset(cx, cy), radius: r),
          start, sweep, true, p);
    }
    arc(const Color(0xFF4285F4), -1.39, 3.84);
    arc(const Color(0xFF34A853),  2.45, 1.10);
    arc(const Color(0xFFFBBC04),  1.45, 1.00);
    arc(const Color(0xFFEA4335), -1.39, -1.00);
    // white disc
    p.color = Colors.white;
    canvas.drawCircle(Offset(cx, cy), r * 0.62, p);
    // blue right arm of G
    p.color = const Color(0xFF4285F4);
    canvas.drawRect(Rect.fromLTWH(cx, cy - r * 0.14, r * 1.02, r * 0.28), p);
  }
  @override bool shouldRepaint(_) => false;
}

// ─── Logged-In view ───────────────────────────────────────────────────────────
class _LoggedIn extends StatelessWidget {
  final AppUser user;
  const _LoggedIn({required this.user});

  @override
  Widget build(BuildContext context) {
    final prov    = context.watch<AppProvider>();
    final myRides = prov.getUserHistory();
    final spent   = myRides.fold(0, (s, b) => s + b.totalPaid);

    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 200, pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: HeroCard(child: SafeArea(child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                // Avatar
                user.avatarUrl != null && user.avatarUrl!.isNotEmpty
                    ? CircleAvatar(radius: 32,
                        backgroundImage: NetworkImage(user.avatarUrl!))
                    : CircleAvatar(radius: 32, backgroundColor: kAccent,
                        child: Text(
                          user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                          style: const TextStyle(color: Colors.white,
                              fontWeight: FontWeight.w700, fontSize: 24))),
                const SizedBox(width: 14),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const SizedBox(height: 4),
                  Text(user.name, style: const TextStyle(fontFamily: 'Playfair',
                      fontSize: 19, fontWeight: FontWeight.w700, color: Colors.white)),
                  if (user.email?.isNotEmpty == true)
                    Text(user.email!, style: const TextStyle(
                        color: Colors.white54, fontSize: 12)),
                  if (user.phone.isNotEmpty)
                    Text(user.phone, style: const TextStyle(
                        color: Colors.white54, fontSize: 12)),
                  if (user.googleId != null)
                    Container(margin: const EdgeInsets.only(top: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: Colors.white.withAlpha(20),
                          borderRadius: BorderRadius.circular(12)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        _GoogleG(size: 12),
                        const SizedBox(width: 4),
                        const Text('Google', style: TextStyle(
                            color: Colors.white70, fontSize: 10)),
                      ])),
                ])),
                TextButton(
                  onPressed: () async {
                    if (user.googleId != null) await _gsi.signOut();
                    if (!context.mounted) return;
                    context.read<AppProvider>().signOut();
                  },
                  child: const Text('Sign Out',
                      style: TextStyle(color: Colors.white54, fontSize: 12)),
                ),
              ]),
            ))),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(delegate: SliverChildListDelegate([
            Row(children: [
              Expanded(child: AppCard(child: Column(children: [
                const Icon(Icons.history_rounded, color: kAccent),
                const SizedBox(height: 4),
                Text('${myRides.length}', style: const TextStyle(
                    fontFamily: 'Playfair', fontSize: 24, fontWeight: FontWeight.w700)),
                const Text('Rides', style: TextStyle(color: kMuted, fontSize: 11)),
              ]))),
              const SizedBox(width: 12),
              Expanded(child: AppCard(child: Column(children: [
                const Icon(Icons.trending_up_rounded, color: kAccent),
                const SizedBox(height: 4),
                Text('${spent.kes}', style: const TextStyle(
                    fontFamily: 'Playfair', fontSize: 20, fontWeight: FontWeight.w700)),
                const Text('KES Spent', style: TextStyle(color: kMuted, fontSize: 11)),
              ]))),
            ]),
            const SizedBox(height: 20),
            SectionHeading('Ride History', icon: Icons.history_rounded),
            if (myRides.isEmpty)
              AppCard(child: const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Column(children: [
                  Text('🏜️', style: TextStyle(fontSize: 40)),
                  SizedBox(height: 8),
                  Text('No rides yet — hit the dunes!',
                      style: TextStyle(color: kMuted)),
                ])))
            else
              ...myRides.map((b) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: AppCard(child: Row(children: [
                  const Icon(Icons.directions_bike_rounded, color: kAccent),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(b.quadName, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text('${b.duration} min · '
                        '${b.startTime.day}/${b.startTime.month}/${b.startTime.year}',
                        style: const TextStyle(color: kMuted, fontSize: 12)),
                  ])),
                  Text('${b.totalPaid.kes} KES',
                      style: const TextStyle(color: kAccent, fontWeight: FontWeight.w700)),
                ]))),
              ),
            const SizedBox(height: 40),
          ])),
        ),
      ]),
    );
  }
}
