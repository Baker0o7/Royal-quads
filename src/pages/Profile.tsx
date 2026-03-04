import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, History, Clock, Star, TrendingUp, Calendar, Mail } from 'lucide-react';
import { api } from '../lib/api';
import { ErrorMessage, Spinner } from '../lib/components/ui';
import { renderGoogleButton, googleSignOut, isGoogleEnabled, waitForGSI } from '../lib/googleAuth';
import type { User, Booking } from '../types';

type FullUser = User & { googleId?: string; avatarUrl?: string; email?: string };

// ── Google sign-in button ────────────────────────────────────────────────────
// Uses waitForGSI() so we never poll — we await the SDK's own onGoogleLibraryLoad
// callback (fired from index.html).
function GoogleButton({ onSuccess }: { onSuccess: (u: FullUser) => void }) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    let cancelled = false;

    waitForGSI(8000).then(loaded => {
      if (cancelled) return;
      if (!loaded) { setStatus('unavailable'); return; }

      // Give the DOM one frame to lay out so offsetWidth is correct
      requestAnimationFrame(() => {
        if (cancelled) return;
        const ok = renderGoogleButton('gsi-btn', onSuccess as Parameters<typeof renderGoogleButton>[1]);
        setStatus(ok ? 'ready' : 'unavailable');
      });
    });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // onSuccess intentionally excluded — it's a stable callback; adding it would
  // re-render the button every keystroke while the user types their phone number.

  if (status === 'unavailable') {
    return (
      <div className="p-3 rounded-xl text-xs font-mono text-center"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
        Google Sign-In unavailable. Please use phone/password below.
      </div>
    );
  }

  return (
    <div className="relative" style={{ minHeight: 44 }}>
      {/* Official GSI button — hidden until ready to avoid layout flash */}
      <div id="gsi-btn" ref={containerRef}
        className="flex justify-center"
        style={{ opacity: status === 'ready' ? 1 : 0, transition: 'opacity 0.25s', minHeight: 44 }} />

      {/* Loading skeleton */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center gap-2.5 rounded-full border"
          style={{ borderColor: 'var(--t-border)', background: 'var(--t-card)' }}>
          <Spinner />
          <span className="text-sm font-medium" style={{ color: 'var(--t-muted)' }}>
            Loading Google Sign-In…
          </span>
        </div>
      )}
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px" style={{ background: 'var(--t-border)' }} />
      <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>or</span>
      <div className="flex-1 h-px" style={{ background: 'var(--t-border)' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function Profile() {
  const [user, setUser]         = useState<FullUser | null>(null);
  const [history, setHistory]   = useState<Booking[]>([]);
  const [isLogin, setIsLogin]   = useState(true);
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u: FullUser = JSON.parse(stored);
        setUser(u);
        api.getUserHistory(u.id).then(setHistory).catch(() => {});
      } catch {}
    }
  }, []);

  const signIn = (u: FullUser) => {
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    setError('');
    api.getUserHistory(u.id).then(setHistory).catch(() => {});
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const u = isLogin
        ? await api.login(phone, password)
        : await api.register(name, phone, password);
      signIn(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    googleSignOut();
    localStorage.removeItem('user');
    setUser(null); setHistory([]);
  };

  const totalSpent = history.reduce((s, b) => s + b.price + (b.overtimeCharge ?? 0), 0);
  const isGoogleUser = !!user?.googleId;

  /* ════════════════════════════════════════════════════════════
     NOT LOGGED IN
  ════════════════════════════════════════════════════════════ */
  if (!user) return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 max-w-sm mx-auto w-full">

      {/* Card */}
      <div className="t-card rounded-2xl overflow-hidden">

        {/* Header strip */}
        <div className="hero-card px-6 py-8 text-center">
          <div className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">🏍️</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            {isLogin ? 'Welcome Back' : 'Join Us'}
          </h1>
          <p className="text-sm text-white/50 mt-1 font-mono">
            {isLogin ? 'Sign in to your account' : 'Create your rider profile'}
          </p>
        </div>

        <div className="p-6 flex flex-col gap-4">

          {/* ── Google Sign-In ── */}
          {isGoogleEnabled() ? (
            <GoogleButton onSuccess={signIn} />
          ) : (
            <div className="p-3.5 rounded-xl text-xs font-mono flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#b45309' }}>
              <span className="text-base shrink-0">ℹ️</span>
              <span>
                Google Sign-In is not configured. Set{' '}
                <code className="font-bold">GOOGLE_CLIENT_ID</code> in your{' '}
                <code className="font-bold">.env</code> file to enable it.
              </span>
            </div>
          )}

          <OrDivider />

          {/* ── Phone / password form ── */}
          <form onSubmit={handleAuth} className="flex flex-col gap-3">
            <AnimatePresence>
              {!isLogin && (
                <motion.div key="name-field" initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <input type="text" placeholder="Full Name" value={name}
                    onChange={e => setName(e.target.value)} className="input" required autoComplete="name" />
                </motion.div>
              )}
            </AnimatePresence>

            <input type="tel" placeholder="Phone Number" value={phone}
              onChange={e => setPhone(e.target.value)} className="input" required autoComplete="tel" />

            <input type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} className="input" required autoComplete="current-password" />

            <ErrorMessage message={error} />

            <button type="submit" disabled={loading} className="btn-primary">
              {loading
                ? <><Spinner /> Please wait…</>
                : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle login/register */}
          <p className="text-center text-sm" style={{ color: 'var(--t-muted)' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="font-semibold transition-opacity hover:opacity-70"
              style={{ color: 'var(--t-accent)' }}>
              {isLogin ? 'Register' : 'Sign In'}
            </button>
          </p>

        </div>
      </div>
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════
     LOGGED IN
  ════════════════════════════════════════════════════════════ */
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">

      {/* ── Profile banner ── */}
      <div className="hero-card relative rounded-3xl overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ background: 'var(--t-accent2)' }} />

        <div className="relative z-10 p-6">
          <div className="flex items-start justify-between">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name}
                  className="w-14 h-14 rounded-2xl object-cover shadow-lg"
                  style={{ border: '2px solid rgba(255,255,255,0.25)' }} />
              ) : (
                <div className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center text-2xl shadow-lg">
                  👤
                </div>
              )}
              <div>
                <h1 className="font-display text-xl font-bold text-white leading-tight">{user.name}</h1>
                {user.email && (
                  <p className="flex items-center gap-1 text-white/50 text-[11px] font-mono mt-0.5">
                    <Mail className="w-3 h-3" /> {user.email}
                  </p>
                )}
                {!user.email && user.phone && (
                  <p className="text-white/50 text-[11px] font-mono mt-0.5">{user.phone}</p>
                )}
                {/* Google badge */}
                {isGoogleUser && (
                  <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                    {/* Google "G" logo */}
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google Account
                  </div>
                )}
              </div>
            </div>

            {/* Sign out button */}
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <History className="w-4 h-4" />,   value: history.length,              label: 'Total Rides' },
          { icon: <TrendingUp className="w-4 h-4" />, value: `${totalSpent.toLocaleString()} KES`, label: 'Total Spent' },
        ].map(({ icon, value, label }) => (
          <div key={label} className="t-card rounded-2xl p-4 text-center">
            <div className="flex justify-center mb-2" style={{ color: 'var(--t-accent)' }}>{icon}</div>
            <p className="font-display font-bold text-xl" style={{ color: 'var(--t-text)' }}>{value}</p>
            <p className="font-mono text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Ride history ── */}
      <section>
        <h2 className="section-heading" style={{ color: 'var(--t-text)' }}>
          <History className="w-4 h-4" style={{ color: 'var(--t-accent)' }} /> Ride History
        </h2>

        {history.length === 0 ? (
          <div className="text-center py-12 rounded-2xl t-card">
            <p className="text-3xl mb-2">🏜️</p>
            <p className="font-display font-semibold" style={{ color: 'var(--t-text)' }}>No rides yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--t-muted)' }}>Hit the dunes!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(b => (
              <div key={b.id} className="t-card rounded-2xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{b.quadName}</p>
                    <div className="flex items-center gap-1 mt-0.5 font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>
                      <Calendar className="w-3 h-3" />
                      {new Date(b.startTime).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold" style={{ color: 'var(--t-accent)' }}>
                      {(b.price + (b.overtimeCharge ?? 0)).toLocaleString()}{' '}
                      <span className="text-xs font-sans">KES</span>
                    </p>
                    {b.promoCode && (
                      <p className="font-mono text-[9px] line-through" style={{ color: 'var(--t-muted)' }}>
                        {b.originalPrice.toLocaleString()} KES
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: 'var(--t-border)' }}>
                  <span className="flex items-center gap-1 font-mono text-[11px]" style={{ color: 'var(--t-muted)' }}>
                    <Clock className="w-3 h-3" /> {b.duration} min
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>#{b.receiptId}</span>
                  {b.rating != null && (
                    <span className="ml-auto flex items-center gap-0.5" style={{ color: 'var(--t-accent)' }}>
                      <Star className="w-3 h-3" style={{ fill: 'var(--t-accent)' }} />
                      <span className="text-[10px] font-mono">{b.rating}/5</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </motion.div>
  );
}
