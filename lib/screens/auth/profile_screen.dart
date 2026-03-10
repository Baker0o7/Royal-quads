import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../services/storage.dart';
import '../../theme/theme.dart';

// ── Google Sign-In config ─────────────────────────────────────────────────────
// serverClientId = Web OAuth 2.0 client ID from Google Cloud Console.
// ApiException:10 (DEVELOPER_ERROR) = SHA-1 not registered in GCP.
// See the fix banner inside the app for step-by-step instructions.
const _kWebClientId =
    '979880974098-uvtfo8sokk6bemv38h9dm89gfl84raj7.apps.googleusercontent.com';

final _gsi = GoogleSignIn(
  serverClientId: _kWebClientId,
  scopes: ['email', 'profile', 'openid'],
);

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
  const _RoleView({required this.onCustomer, required this.onAdmin, required this.onGuest});
  @override
  State<_RoleView> createState() => _RoleViewState();
}

class _RoleViewState extends State<_RoleView> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fade;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _fade  = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _slide = Tween(begin: const Offset(0, .04), end: Offset.zero)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
    _ctrl.forward();
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: FadeTransition(
      opacity: _fade,
      child: SlideTransition(
        position: _slide,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(child: _HeroHeader()),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 40),
              sliver: SliverToBoxAdapter(child: Column(children: [
                const _SectionLabel('HOW ARE YOU USING THE APP?'),
                const SizedBox(height: 16),
                _RoleCard(
                  icon: Icons.directions_bike_rounded, color: kAccent,
                  title: 'Customer',
                  subtitle: 'Book rides, track sessions & view history',
                  badge: null, onTap: widget.onCustomer,
                ),
                const SizedBox(height: 10),
                _RoleCard(
                  icon: Icons.admin_panel_settings_rounded, color: kIndigo,
                  title: 'Admin / Staff',
                  subtitle: 'Fleet management, analytics & bookings',
                  badge: 'STAFF', onTap: widget.onAdmin,
                ),
                const SizedBox(height: 10),
                _RoleCard(
                  icon: Icons.explore_outlined, color: kMuted,
                  title: 'Browse as Guest',
                  subtitle: 'Explore the app without signing in',
                  badge: null, onTap: widget.onGuest,
                ),
              ])),
            ),
          ],
        ),
      ),
    ),
  );
}

class _HeroHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      gradient: LinearGradient(
        colors: [kHeroFrom, kHeroMid, kHeroTo],
        begin: Alignment.topLeft, end: Alignment.bottomRight,
      ),
    ),
    child: SafeArea(bottom: false, child: Padding(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 40),
      child: Column(children: [
        Container(
          width: 100, height: 100,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: kAccent.withAlpha(80), width: 2),
            boxShadow: [
              BoxShadow(color: kAccent.withAlpha(50), blurRadius: 32),
              BoxShadow(color: Colors.black.withAlpha(60), blurRadius: 16),
            ],
          ),
          padding: const EdgeInsets.all(4),
          child: const CircleAvatar(
            backgroundImage: AssetImage('assets/images/logo.png'),
            backgroundColor: Colors.transparent,
          ),
        ),
        const SizedBox(height: 18),
        const Text('Royal Quad Bikes', style: TextStyle(
            fontFamily: 'Playfair', fontSize: 26,
            fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: -.5)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(8),
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: Colors.white.withAlpha(15)),
          ),
          child: const Text('📍  MAMBRUI SAND DUNES · KENYA',
              style: TextStyle(color: Colors.white38, fontSize: 10,
                  letterSpacing: 2.5, fontWeight: FontWeight.w600)),
        ),
      ]),
    )),
  );
}

class _RoleCard extends StatefulWidget {
  final IconData icon; final Color color;
  final String title, subtitle; final String? badge;
  final VoidCallback onTap;
  const _RoleCard({required this.icon, required this.color,
      required this.title, required this.subtitle,
      required this.badge, required this.onTap});
  @override State<_RoleCard> createState() => _RoleCardState();
}

class _RoleCardState extends State<_RoleCard> {
  bool _pressed = false;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTapDown: (_) => setState(() => _pressed = true),
    onTapUp:   (_) { setState(() => _pressed = false); widget.onTap(); },
    onTapCancel: () => setState(() => _pressed = false),
    child: AnimatedScale(
      scale: _pressed ? .97 : 1,
      duration: const Duration(milliseconds: 120),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [widget.color.withAlpha(25), widget.color.withAlpha(5)],
            begin: Alignment.topLeft, end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: widget.color.withAlpha(50)),
          boxShadow: kShadowSm,
        ),
        child: Row(children: [
          Container(
            width: 50, height: 50,
            decoration: BoxDecoration(
              color: widget.color.withAlpha(22),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: widget.color.withAlpha(40)),
            ),
            child: Icon(widget.icon, color: widget.color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Text(widget.title, style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 15, color: kText)),
                if (widget.badge != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: widget.color.withAlpha(20),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: widget.color.withAlpha(60)),
                    ),
                    child: Text(widget.badge!, style: TextStyle(
                        color: widget.color, fontSize: 8,
                        fontWeight: FontWeight.w800, letterSpacing: 1)),
                  ),
                ],
              ]),
              const SizedBox(height: 3),
              Text(widget.subtitle, style: const TextStyle(
                  color: kMuted, fontSize: 12, height: 1.4)),
            ],
          )),
          Icon(Icons.arrow_forward_ios_rounded,
              color: widget.color.withAlpha(120), size: 16),
        ]),
      ),
    ),
  );
}

// ─── Auth Form ────────────────────────────────────────────────────────────────
class _AuthView extends StatefulWidget {
  final _Mode mode;
  final VoidCallback onToggleMode, onBack;
  const _AuthView({required this.mode, required this.onToggleMode, required this.onBack});
  @override State<_AuthView> createState() => _AuthViewState();
}

class _AuthViewState extends State<_AuthView> {
  final _nameCtrl  = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _pwCtrl    = TextEditingController();
  final _formKey   = GlobalKey<FormState>();
  bool _showPw = false, _loading = false, _gLoading = false;
  bool _showSha1Fix = false;

  @override
  void dispose() {
    _nameCtrl.dispose(); _phoneCtrl.dispose(); _pwCtrl.dispose();
    super.dispose();
  }

  // ── Google Sign-In ────────────────────────────────────────────────────
  Future<void> _googleSignIn() async {
    setState(() { _gLoading = true; _showSha1Fix = false; });
    try {
      await _gsi.signOut();
      await _gsi.disconnect().catchError((_) {});
      final account = await _gsi.signIn();
      if (account == null) { setState(() => _gLoading = false); return; }

      // Ensure we get valid tokens
      await account.authentication;

      final u = await StorageService.upsertGoogleUser(
        googleId:  account.id,
        name:      account.displayName ?? account.email.split('@').first,
        email:     account.email,
        avatarUrl: account.photoUrl ?? '',
      );
      if (!mounted) return;
      context.read<AppProvider>().setUser(u);
      showToast(context, 'Welcome, ${u.name}! 🏍️');
    } catch (e) {
      if (!mounted) return;
      final msg = e.toString();
      if (msg.contains('10') || msg.contains('DEVELOPER_ERROR')) {
        showToast(context, 'SHA-1 not registered — see fix below', error: true);
        setState(() => _showSha1Fix = true);
      } else if (msg.contains('network_error') || msg.contains('NetworkError')) {
        showToast(context, 'No internet connection', error: true);
      } else if (msg.contains('12501') || msg.contains('cancelled')) {
        setState(() => _gLoading = false); return;
      } else if (msg.contains('12500')) {
        showToast(context, 'Google Play Services unavailable', error: true);
      } else {
        showToast(context, 'Google Sign-In failed. Try phone/password.', error: true);
      }
    } finally {
      if (mounted) setState(() => _gLoading = false);
    }
  }

  // ── Phone/Password submit ─────────────────────────────────────────────
  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _loading = true);
    try {
      final prov = context.read<AppProvider>();
      if (widget.mode == _Mode.signIn) {
        await prov.signIn(_phoneCtrl.text.trim(), _pwCtrl.text);
      } else {
        await prov.register(_nameCtrl.text.trim(), _phoneCtrl.text.trim(), _pwCtrl.text);
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
    body: SafeArea(child: Form(
      key: _formKey,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // ── Top bar ───────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.only(left: 0, top: 4, bottom: 0),
            child: Row(children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: kMuted),
                onPressed: widget.onBack,
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(color: kBg2,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: kBorder)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  _ModePill('Sign In',  widget.mode == _Mode.signIn,
                      () => widget.mode != _Mode.signIn ? widget.onToggleMode() : null),
                  _ModePill('Sign Up',  widget.mode == _Mode.signUp,
                      () => widget.mode != _Mode.signUp ? widget.onToggleMode() : null),
                ]),
              ),
            ]),
          ),
          const SizedBox(height: 12),

          // ── Title ─────────────────────────────────────────────────
          Text(
            widget.mode == _Mode.signIn ? 'Welcome back 👋' : 'Create account',
            style: const TextStyle(fontFamily: 'Playfair', fontSize: 28,
                fontWeight: FontWeight.w700, color: kText, letterSpacing: -.5),
          ),
          const SizedBox(height: 4),
          Text(
            widget.mode == _Mode.signIn
                ? 'Sign in to manage your rides'
                : 'Join Royal Quad Bikes today',
            style: const TextStyle(color: kMuted, fontSize: 14),
          ),
          const SizedBox(height: 28),

          // ── Google button ──────────────────────────────────────────
          _GoogleBtn(loading: _gLoading, onTap: _googleSignIn),

          // ── SHA-1 fix banner (shown on ApiException: 10) ───────────
          if (_showSha1Fix) ...[
            const SizedBox(height: 12),
            _Sha1FixBanner(),
          ],

          const SizedBox(height: 20),
          const _OrDivider(),
          const SizedBox(height: 20),

          // ── Fields ────────────────────────────────────────────────
          if (widget.mode == _Mode.signUp) ...[
            TextFormField(
              controller: _nameCtrl,
              validator: (v) => v?.trim().isEmpty == true ? 'Enter your name' : null,
              decoration: const InputDecoration(
                  labelText: 'Full Name', hintText: 'John Kamau',
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
                labelText: 'Phone Number', hintText: '0712 345 678',
                prefixIcon: Icon(Icons.phone_outlined, size: 18)),
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _pwCtrl,
            obscureText: !_showPw,
            validator: (v) => (v?.length ?? 0) < 4
                ? 'Password must be at least 4 characters' : null,
            decoration: InputDecoration(
              labelText: 'Password', hintText: '••••••••',
              prefixIcon: const Icon(Icons.lock_outline_rounded, size: 18),
              suffixIcon: IconButton(
                icon: Icon(_showPw ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined, size: 18, color: kMuted),
                onPressed: () => setState(() => _showPw = !_showPw),
              ),
            ),
          ),
          if (widget.mode == _Mode.signIn) ...[
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => showToast(context, 'Contact admin to reset password'),
                child: const Text('Forgot password?',
                    style: TextStyle(color: kMuted, fontSize: 13)),
              ),
            ),
          ] else
            const SizedBox(height: 24),

          // ── Submit ────────────────────────────────────────────────
          SizedBox(
            width: double.infinity, height: 54,
            child: ElevatedButton(
              onPressed: _loading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: kAccent, foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: _loading
                  ? const SizedBox(width: 22, height: 22,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2.5))
                  : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(widget.mode == _Mode.signIn
                          ? Icons.login_rounded : Icons.person_add_rounded, size: 18),
                      const SizedBox(width: 10),
                      Text(widget.mode == _Mode.signIn ? 'Sign In' : 'Create Account',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                    ]),
            ),
          ),
          const SizedBox(height: 16),
          Center(child: TextButton(
            onPressed: widget.onToggleMode,
            child: RichText(text: TextSpan(
              style: const TextStyle(fontSize: 13, color: kMuted),
              children: [
                TextSpan(text: widget.mode == _Mode.signIn
                    ? "Don't have an account? " : 'Already registered? '),
                TextSpan(
                  text: widget.mode == _Mode.signIn ? 'Register free' : 'Sign in',
                  style: const TextStyle(color: kAccent, fontWeight: FontWeight.w700),
                ),
              ],
            )),
          )),
        ]),
      ),
    )),
  );
}

// ── Google branded button ─────────────────────────────────────────────────────
class _GoogleBtn extends StatelessWidget {
  final bool loading; final VoidCallback onTap;
  const _GoogleBtn({required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: loading ? null : onTap,
    child: Container(
      width: double.infinity, height: 54,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder, width: 1.5),
        boxShadow: kShadowSm,
      ),
      child: loading
          ? const Center(child: SizedBox(width: 22, height: 22,
              child: CircularProgressIndicator(strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation(kAccent))))
          : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              _GoogleG(size: 22),
              const SizedBox(width: 12),
              const Text('Continue with Google', style: TextStyle(
                  color: Color(0xFF1F1F1F), fontWeight: FontWeight.w600, fontSize: 15)),
            ]),
    ),
  );
}

class _GoogleG extends StatelessWidget {
  final double size;
  const _GoogleG({required this.size});
  @override
  Widget build(BuildContext context) =>
      SizedBox(width: size, height: size, child: CustomPaint(painter: _GPainter()));
}

class _GPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size s) {
    final cx = s.width / 2, cy = s.height / 2, r = s.width / 2;
    final p = Paint()..style = PaintingStyle.fill;
    void arc(Color c, double st, double sw) {
      p.color = c;
      canvas.drawArc(Rect.fromCircle(center: Offset(cx, cy), radius: r), st, sw, true, p);
    }
    arc(const Color(0xFF4285F4), -1.39, 3.84);
    arc(const Color(0xFF34A853),  2.45, 1.10);
    arc(const Color(0xFFFBBC04),  1.45, 1.00);
    arc(const Color(0xFFEA4335), -1.39,-1.00);
    p.color = Colors.white;
    canvas.drawCircle(Offset(cx, cy), r * 0.60, p);
    p.color = const Color(0xFF4285F4);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx, cy - r*.135, r*1.0, r*.27), const Radius.circular(2)),
      p,
    );
  }
  @override bool shouldRepaint(_) => false;
}

// ── SHA-1 fix banner ──────────────────────────────────────────────────────────
class _Sha1FixBanner extends StatefulWidget {
  @override State<_Sha1FixBanner> createState() => _Sha1FixBannerState();
}

class _Sha1FixBannerState extends State<_Sha1FixBanner> {
  bool _expanded = true;

  static const _ciSha1 =
      '69:D6:F3:16:72:D5:55:FE:0D:22:DF:04:6B:F3:F9:18:64:EA:A1:97';

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: const Color(0xFFFFF8E6),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: const Color(0xFFE8B84B).withAlpha(120)),
      boxShadow: [BoxShadow(color: const Color(0xFFE8B84B).withAlpha(30),
          blurRadius: 12, offset: const Offset(0, 4))],
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Header
      GestureDetector(
        onTap: () => setState(() => _expanded = !_expanded),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFE8B84B).withAlpha(40),
                borderRadius: BorderRadius.circular(8)),
              child: const Center(child: Text('🔧',
                  style: TextStyle(fontSize: 16)))),
            const SizedBox(width: 10),
            const Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Fix Google Sign-In — Error 10',
                    style: TextStyle(fontWeight: FontWeight.w800,
                        fontSize: 13, color: Color(0xFF7A5800))),
                Text('Register your local SHA-1 in GCP (one-time)',
                    style: TextStyle(fontSize: 11, color: Color(0xFFAA8030))),
              ],
            )),
            AnimatedRotation(
              turns: _expanded ? 0.5 : 0,
              duration: const Duration(milliseconds: 200),
              child: const Icon(Icons.expand_more_rounded,
                  color: Color(0xFF7A5800), size: 18)),
          ]),
        ),
      ),

      if (_expanded) ...[
        const Divider(height: 1, color: Color(0xFFE8D08A)),
        Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

            // Why section
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFEFCC),
                borderRadius: BorderRadius.circular(8)),
              child: const Text(
                'Your local machine uses a different debug keystore than CI. '
                'You must register YOUR machine's SHA-1 in Google Cloud Console. '
                'You can register multiple SHA-1s on the same Android client.',
                style: TextStyle(fontSize: 12, color: Color(0xFF7A5800), height: 1.6),
              ),
            ),

            const SizedBox(height: 14),

            // Step 1 — get local SHA-1
            _FixStep('1', 'Get YOUR machine's SHA-1 — run this in a terminal:'),
            _CodeSnippet(
              'bash scripts/get_sha1.sh
'
              '# — OR manually —
'
              'keytool -list -v \\
'
              '  -keystore ~/.android/debug.keystore \\
'
              '  -alias androiddebugkey \\
'
              '  -storepass android -keypass android',
            ),

            const SizedBox(height: 8),

            // Step 2 — GCP
            _FixStep('2', 'Open Google Cloud Console → APIs & Services → Credentials'),
            _CopySnippet('https://console.cloud.google.com/apis/credentials'),

            const SizedBox(height: 6),

            // Step 3 — find client
            _FixStep('3',
                'Find your Android OAuth client for com.royalquadbikes.app. '
                'If it doesn't exist → + Create Credentials → OAuth 2.0 Client ID → Android'),

            const SizedBox(height: 6),

            // Step 4 — add SHA-1s
            _FixStep('4', 'Add BOTH SHA-1s (you can have multiple on one client):'),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.only(left: 26),
              child: Column(children: [
                _ShaBadge('LOCAL (your machine)', '← run step 1 above', false),
                const SizedBox(height: 6),
                _ShaBadge('CI (GitHub Actions)', _ciSha1, true),
              ]),
            ),

            const SizedBox(height: 8),

            // Step 5 — package name
            _FixStep('5', 'Package name (copy exactly):'),
            _CopySnippet('com.royalquadbikes.app'),

            const SizedBox(height: 8),

            // Step 6 — save
            _FixStep('6', 'Click Save → rebuild the APK → Google Sign-In works ✅'),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: kGreen.withAlpha(40))),
              child: const Row(children: [
                Icon(Icons.info_outline_rounded,
                    size: 14, color: Color(0xFF2E7D32)),
                SizedBox(width: 6),
                Expanded(child: Text(
                  'No google-services.json needed — this app doesn't use Firebase.',
                  style: TextStyle(fontSize: 11, color: Color(0xFF2E7D32),
                      fontWeight: FontWeight.w600))),
              ]),
            ),
          ]),
        ),
      ],
    ]),
  );
}

class _ShaBadge extends StatefulWidget {
  final String label, sha1; final bool copyable;
  const _ShaBadge(this.label, this.sha1, this.copyable);
  @override State<_ShaBadge> createState() => _ShaBadgeState();
}

class _ShaBadgeState extends State<_ShaBadge> {
  bool _copied = false;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: const Color(0xFF1E1E1E),
      borderRadius: BorderRadius.circular(8)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(widget.label, style: const TextStyle(
          color: Color(0xFF9CDCFE), fontSize: 10,
          fontWeight: FontWeight.w700, letterSpacing: 0.5)),
      const SizedBox(height: 4),
      Row(children: [
        Expanded(child: Text(widget.sha1, style: const TextStyle(
            fontFamily: 'monospace', fontSize: 11,
            color: Color(0xFFCE9178)))),
        if (widget.copyable)
          GestureDetector(
            onTap: () {
              Clipboard.setData(ClipboardData(text: widget.sha1));
              setState(() => _copied = true);
              Future.delayed(const Duration(seconds: 2),
                  () { if (mounted) setState(() => _copied = false); });
            },
            child: Icon(_copied ? Icons.check_rounded : Icons.copy_rounded,
                size: 14,
                color: _copied ? kGreen : Colors.white38)),
      ]),
    ]),
  );
}

class _FixStep extends StatelessWidget {
  final String n, t;
  const _FixStep(this.n, this.t);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 4),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 18, height: 18, decoration: const BoxDecoration(
            color: Color(0xFFE8B84B), shape: BoxShape.circle),
        child: Center(child: Text(n, style: const TextStyle(
            fontSize: 9, fontWeight: FontWeight.w800, color: Color(0xFF7A5800)))),
      ),
      const SizedBox(width: 8),
      Expanded(child: Text(t, style: const TextStyle(
          fontSize: 12, color: Color(0xFF5C4200), fontWeight: FontWeight.w600, height: 1.4))),
    ]),
  );
}

class _CodeSnippet extends StatelessWidget {
  final String code;
  const _CodeSnippet(this.code);
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(top: 4, left: 26),
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(8)),
    child: Text(code, style: const TextStyle(
        fontFamily: 'monospace', fontSize: 11, color: Color(0xFF4EC9B0), height: 1.5)),
  );
}

class _CopySnippet extends StatefulWidget {
  final String text;
  const _CopySnippet(this.text);
  @override State<_CopySnippet> createState() => _CopySnippetState();
}

class _CopySnippetState extends State<_CopySnippet> {
  bool _copied = false;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () {
      Clipboard.setData(ClipboardData(text: widget.text));
      setState(() => _copied = true);
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _copied = false);
      });
    },
    child: Container(
      margin: const EdgeInsets.only(top: 4, left: 26),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(color: const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(8)),
      child: Row(children: [
        Expanded(child: Text(widget.text, style: const TextStyle(
            fontFamily: 'monospace', fontSize: 11, color: Color(0xFFCE9178)))),
        Icon(_copied ? Icons.check_rounded : Icons.copy_rounded,
            size: 14, color: _copied ? kGreen : Colors.white38),
      ]),
    ),
  );
}

// ── Shared widgets ────────────────────────────────────────────────────────────
class _ModePill extends StatelessWidget {
  final String label; final bool active; final VoidCallback? onTap;
  const _ModePill(this.label, this.active, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: active ? Colors.white : Colors.transparent,
        borderRadius: BorderRadius.circular(9),
        boxShadow: active ? kShadowSm : null,
      ),
      child: Text(label, style: TextStyle(
          fontWeight: active ? FontWeight.w700 : FontWeight.w400,
          fontSize: 13, color: active ? kText : kMuted)),
    ),
  );
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();
  @override
  Widget build(BuildContext context) => Row(children: [
    const Expanded(child: Divider(color: kBorder)),
    const Padding(padding: EdgeInsets.symmetric(horizontal: 14),
        child: Text('or sign in with phone',
            style: TextStyle(color: kMuted, fontSize: 12))),
    const Expanded(child: Divider(color: kBorder)),
  ]);
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(color: kMuted, fontSize: 10,
          letterSpacing: 2.5, fontWeight: FontWeight.w600));
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
    final isGoogle = user.googleId != null;

    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 210, pinned: true, elevation: 0,
            backgroundColor: kHeroTo,
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.parallax,
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [kHeroFrom, kHeroMid, kHeroTo],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                    Stack(children: [
                      user.avatarUrl != null && user.avatarUrl!.isNotEmpty
                          ? CircleAvatar(radius: 36,
                              backgroundImage: NetworkImage(user.avatarUrl!),
                              backgroundColor: kHeroMid)
                          : CircleAvatar(radius: 36,
                              backgroundColor: kAccent.withAlpha(30),
                              child: Text(
                                user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                                style: const TextStyle(color: kAccent,
                                    fontWeight: FontWeight.w700, fontSize: 28))),
                      if (isGoogle)
                        Positioned(bottom: 0, right: 0, child: Container(
                          width: 20, height: 20,
                          decoration: BoxDecoration(color: Colors.white,
                              shape: BoxShape.circle,
                              border: Border.all(color: kHeroTo, width: 1.5)),
                          child: const Center(child: Text('G', style: TextStyle(
                              fontSize: 10, fontWeight: FontWeight.w800,
                              color: Color(0xFF4285F4)))),
                        )),
                    ]),
                    const SizedBox(width: 16),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(user.name, style: const TextStyle(
                            fontFamily: 'Playfair', fontSize: 20,
                            fontWeight: FontWeight.w700, color: Colors.white)),
                        if (user.email?.isNotEmpty == true)
                          Text(user.email!, style: const TextStyle(
                              color: Colors.white54, fontSize: 12)),
                        if (user.phone.isNotEmpty)
                          Text(user.phone, style: const TextStyle(
                              color: Colors.white54, fontSize: 12)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(10),
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(color: Colors.white.withAlpha(18)),
                          ),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            if (isGoogle) _GoogleG(size: 10)
                            else const Icon(Icons.verified_rounded,
                                size: 10, color: Colors.white38),
                            const SizedBox(width: 5),
                            Text(isGoogle ? 'Google Account' : 'Verified Customer',
                                style: const TextStyle(color: Colors.white38,
                                    fontSize: 10, fontWeight: FontWeight.w600)),
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
              // ── Stats ─────────────────────────────────────────────
              Row(children: [
                _StatTile(icon: Icons.directions_bike_rounded,
                    color: kAccent, value: '${myRides.length}', label: 'Total Rides'),
                const SizedBox(width: 12),
                _StatTile(icon: Icons.payments_outlined,
                    color: kGreen, value: spent.kes, label: 'KES Spent'),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                _StatTile(
                  icon: Icons.local_fire_department_rounded,
                  color: kRed,
                  value: myRides.isEmpty ? '—' : '${myRides.where((b) {
                    final now = DateTime.now();
                    return b.startTime.year == now.year && b.startTime.month == now.month;
                  }).fold(0, (s, b) => s + b.totalPaid).kes} KES',
                  label: 'This Month',
                ),
                const SizedBox(width: 12),
                _StatTile(
                  icon: Icons.star_rounded,
                  color: kOrange,
                  value: () {
                    if (myRides.isEmpty) return '—';
                    final rated = myRides.where((b) => b.rating != null).toList();
                    if (rated.isEmpty) return '—';
                    final avg = rated.fold(0, (s, b) => s + b.rating!) / rated.length;
                    return avg.toStringAsFixed(1);
                  }(),
                  label: 'Avg Rating',
                ),
              ]),
              const SizedBox(height: 20),

              // ── Account card ──────────────────────────────────────
              _Heading('Account'),
              const SizedBox(height: 10),
              AppCard(child: Column(children: [
                _InfoRow(Icons.person_outline_rounded, 'Name', user.name),
                if (user.email?.isNotEmpty == true)
                  _InfoRow(Icons.email_outlined, 'Email', user.email!),
                if (user.phone.isNotEmpty)
                  _InfoRow(Icons.phone_outlined, 'Phone', user.phone),
                _InfoRow(
                  isGoogle ? Icons.g_mobiledata_rounded : Icons.lock_outline_rounded,
                  'Auth', isGoogle ? 'Google Account' : 'Phone & Password',
                  isLast: true,
                ),
              ])),
              const SizedBox(height: 20),

              // ── History ───────────────────────────────────────────
              _Heading('Ride History'),
              const SizedBox(height: 10),
              if (myRides.isEmpty)
                AppCard(child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 32),
                  child: Column(children: [
                    const Text('🏜️', style: TextStyle(fontSize: 44)),
                    const SizedBox(height: 10),
                    const Text('No rides yet', style: TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 15)),
                    const SizedBox(height: 4),
                    const Text('Hit the dunes!',
                        style: TextStyle(color: kMuted, fontSize: 13)),
                    const SizedBox(height: 14),
                    TextButton.icon(
                      onPressed: () => context.go('/'),
                      icon: const Icon(Icons.directions_bike_rounded, size: 16),
                      label: const Text('Book a Ride'),
                      style: TextButton.styleFrom(foregroundColor: kAccent),
                    ),
                  ]),
                ))
              else
                ...myRides.map((b) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AppCard(child: Row(children: [
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(color: kAccent.withAlpha(15),
                          borderRadius: BorderRadius.circular(12)),
                      child: const Icon(Icons.directions_bike_rounded,
                          color: kAccent, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(b.quadName, style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 14)),
                        Text('${b.duration} min  ·  '
                            '${b.startTime.day}/${b.startTime.month}/${b.startTime.year}',
                            style: const TextStyle(color: kMuted, fontSize: 12)),
                      ],
                    )),
                    Text('${b.totalPaid.kes} KES',
                        style: const TextStyle(color: kAccent,
                            fontWeight: FontWeight.w700, fontSize: 14)),
                  ])),
                )),

              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    if (isGoogle) await _gsi.signOut().catchError((_) {});
                    if (!context.mounted) return;
                    context.read<AppProvider>().signOut();
                  },
                  icon: const Icon(Icons.logout_rounded, size: 18),
                  label: const Text('Sign Out'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: kMuted,
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

// ── Ride history tile ─────────────────────────────────────────────────────────
class _RideHistoryTile extends StatelessWidget {
  final Booking booking;
  const _RideHistoryTile({required this.booking});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () => context.push('/receipt/${booking.id}'),
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder),
        boxShadow: kShadowSm,
      ),
      child: Row(children: [
        // Star rating indicator
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
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                decoration: BoxDecoration(
                  color: kAccent,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.star_rounded, size: 8, color: Colors.white),
                  const SizedBox(width: 2),
                  Text('${booking.rating}', style: const TextStyle(
                      color: Colors.white, fontSize: 8, fontWeight: FontWeight.w800)),
                ]),
              )),
        ]),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(booking.quadName, style: const TextStyle(
                fontWeight: FontWeight.w700, fontSize: 14, color: kText)),
            const SizedBox(height: 3),
            Row(children: [
              const Icon(Icons.timer_rounded, size: 11, color: kMuted),
              const SizedBox(width: 3),
              Text('${booking.duration} min',
                  style: const TextStyle(color: kMuted, fontSize: 12)),
              const SizedBox(width: 8),
              const Icon(Icons.calendar_today_rounded, size: 11, color: kMuted),
              const SizedBox(width: 3),
              Text('${booking.startTime.day}/${booking.startTime.month}/${booking.startTime.year}',
                  style: const TextStyle(color: kMuted, fontSize: 12)),
            ]),
          ],
        )),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('${booking.totalPaid.kes} KES', style: const TextStyle(
              color: kAccent, fontWeight: FontWeight.w800, fontSize: 14)),
          if (booking.overtimeCharge > 0)
            Text('+${booking.overtimeCharge.kes} OT',
                style: const TextStyle(color: kRed, fontSize: 10)),
          const SizedBox(height: 2),
          const Icon(Icons.chevron_right_rounded, color: kMuted, size: 14),
        ]),
      ]),
    ),
  );
}

class _StatTile extends StatelessWidget {
  final IconData icon; final Color color;
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
          decoration: BoxDecoration(color: color.withAlpha(15),
              borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value, style: const TextStyle(fontFamily: 'Playfair',
              fontSize: 18, fontWeight: FontWeight.w700, color: kText)),
          Text(label, style: const TextStyle(color: kMuted, fontSize: 11)),
        ])),
      ]),
    )),
  );
}

class _InfoRow extends StatelessWidget {
  final IconData icon; final String label, value; final bool isLast;
  const _InfoRow(this.icon, this.label, this.value, {this.isLast = false});
  @override
  Widget build(BuildContext context) => Column(children: [
    Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(children: [
        Icon(icon, size: 16, color: kMuted),
        const SizedBox(width: 12),
        Text(label, style: const TextStyle(color: kMuted, fontSize: 13)),
        const Spacer(),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600,
            fontSize: 13, color: kText)),
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
      style: const TextStyle(fontFamily: 'Playfair',
          fontSize: 18, fontWeight: FontWeight.w700, color: kText));
}
