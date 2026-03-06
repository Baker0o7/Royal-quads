import '../../models/models.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/theme.dart';

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
      if (r == _Role.admin)  { context.go('/admin'); return; }
      if (r == _Role.guest)  { context.go('/'); return; }
      setState(() => _role = r);
    });
    return _AuthForm(
      mode: _mode,
      onToggle: () => setState(() => _mode = _mode == _Mode.signIn ? _Mode.signUp : _Mode.signIn),
      onBack:  () => setState(() => _role = null),
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

        // Hero
        HeroCard(
          padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 24),
          child: Column(children: [
            Stack(alignment: Alignment.center, children: [
              Container(width: 110, height: 110,
                decoration: BoxDecoration(
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
                fontFamily: 'Playfair', fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white)),
            const SizedBox(height: 4),
            const Text('MAMBRUI SAND DUNES · KENYA', style: TextStyle(
                color: Colors.white30, fontSize: 11, letterSpacing: 2)),
          ]),
        ),

        const SizedBox(height: 24),

        const Text('HOW ARE YOU USING THE APP?', style: TextStyle(
            color: kMuted, fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),

        _RoleCard(icon: Icons.directions_bike_rounded, color: kAccent,
            title: 'Customer', desc: 'Book rides, view history & manage your account',
            onTap: () => onSelect(_Role.customer)),
        const SizedBox(height: 10),
        _RoleCard(icon: Icons.shield_rounded, color: kIndigo,
            title: 'Admin / Staff', desc: 'Fleet management, bookings & analytics',
            onTap: () => onSelect(_Role.admin)),
        const SizedBox(height: 10),
        _RoleCard(icon: Icons.person_outline_rounded, color: kMuted,
            title: 'Browse as Guest', desc: 'Explore without creating an account',
            onTap: () => onSelect(_Role.guest)),

        const SizedBox(height: 40),
      ]),
    )),
  );
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title, desc;
  final VoidCallback onTap;
  const _RoleCard({required this.icon, required this.color, required this.title,
    required this.desc, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withAlpha(12),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withAlpha(40)),
      ),
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
  bool   _showPw = false, _loading = false;

  Future<void> _submit() async {
    if (_phone.trim().isEmpty) { showToast(context, 'Enter phone number', error: true); return; }
    if (_password.isEmpty)    { showToast(context, 'Enter password', error: true); return; }
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
      if (mounted) showToast(context, e.toString().replaceFirst('Exception: ', ''), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(child: SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        // Header
        HeroCard(
          radius: 24,
          child: Stack(children: [
            Positioned(top: 8, left: 8,
              child: IconButton(
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
                // Mode toggle
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.black26, borderRadius: BorderRadius.circular(16)),
                  child: Row(children: [
                    _Tab('Sign In', widget.mode == _Mode.signIn, widget.mode != _Mode.signIn ? widget.onToggle : null),
                    _Tab('Sign Up', widget.mode == _Mode.signUp, widget.mode != _Mode.signUp ? widget.onToggle : null),
                  ]),
                ),
              ]),
            ),
          ]),
        ),

        const SizedBox(height: 24),

        // Form fields
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
              icon: Icon(_showPw ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 18),
              onPressed: () => setState(() => _showPw = !_showPw),
            ),
          ),
          obscureText: !_showPw,
          onChanged: (v) => _password = v,
        ),

        const SizedBox(height: 20),

        PrimaryButton(
          label: widget.mode == _Mode.signIn ? 'Sign In' : 'Create Account',
          icon: widget.mode == _Mode.signIn ? Icons.login_rounded : Icons.person_add_rounded,
          onTap: _submit, loading: _loading,
        ),

        const SizedBox(height: 16),

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
  final String label;
  final bool active;
  final VoidCallback? onTap;
  const _Tab(this.label, this.active, this.onTap);

  @override
  Widget build(BuildContext context) => Expanded(child: GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: active ? Colors.white.withAlpha(25) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(label, textAlign: TextAlign.center,
        style: TextStyle(
          color: active ? Colors.white : Colors.white38,
          fontWeight: active ? FontWeight.w700 : FontWeight.w400,
          fontSize: 13)),
    ),
  ));
}

// ─── Logged In View ───────────────────────────────────────────────────────────
class _LoggedIn extends StatelessWidget {
  final AppUser user;
  const _LoggedIn({required this.user});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final myRides  = provider.getUserHistory();
    final spent    = myRides.fold(0, (s, b) => s + b.totalPaid);

    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 180, pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: HeroCard(child: SafeArea(child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  user.avatarUrl != null
                      ? CircleAvatar(radius: 28, backgroundImage: NetworkImage(user.avatarUrl!))
                      : const CircleAvatar(radius: 28, backgroundColor: kAccent,
                          child: Icon(Icons.person_rounded, color: Colors.white, size: 28)),
                  const SizedBox(width: 14),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(user.name, style: const TextStyle(fontFamily: 'Playfair',
                        fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
                    if (user.email != null) Text(user.email!,
                        style: const TextStyle(color: Colors.white38, fontSize: 12)),
                    if (user.phone.isNotEmpty) Text(user.phone,
                        style: const TextStyle(color: Colors.white38, fontSize: 12)),
                  ])),
                  TextButton.icon(
                    onPressed: () => context.read<AppProvider>().signOut(),
                    icon: const Icon(Icons.logout_rounded, color: Colors.white54, size: 16),
                    label: const Text('Out', style: TextStyle(color: Colors.white54, fontSize: 12)),
                  ),
                ]),
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
                ]),
              ))
            else
              ...myRides.map((b) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: AppCard(child: Row(children: [
                  const Icon(Icons.directions_bike_rounded, color: kAccent),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(b.quadName, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text('${b.duration} min · ${b.startTime.day}/${b.startTime.month}/${b.startTime.year}',
                        style: const TextStyle(color: kMuted, fontSize: 12)),
                  ])),
                  Text('${b.totalPaid.kes} KES', style: const TextStyle(
                      color: kAccent, fontWeight: FontWeight.w700)),
                ])),
              )),
            const SizedBox(height: 40),
          ])),
        ),
      ]),
    );
  }
}
