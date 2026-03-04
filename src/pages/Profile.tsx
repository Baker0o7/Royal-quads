import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, History, Clock, Star, TrendingUp, Calendar, Mail,
  Shield, User, Users, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { api } from '../lib/api';
import { ErrorMessage, Spinner } from '../lib/components/ui';
import { renderGoogleButton, googleSignOut, isGoogleEnabled, waitForGSI } from '../lib/googleAuth';
import type { User as UserType, Booking } from '../types';

type FullUser = UserType & { googleId?: string; avatarUrl?: string; email?: string };
type Role = 'admin' | 'customer' | 'guest';

// ── Google button ────────────────────────────────────────────────────────────
function GoogleButton({ onSuccess }: { onSuccess: (u: FullUser) => void }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  const mount = useCallback(async () => {
    setStatus('loading');
    const loaded = await waitForGSI(12_000);
    if (!loaded) { setStatus('unavailable'); return; }
    requestAnimationFrame(() => {
      const ok = renderGoogleButton('gsi-btn', onSuccess as Parameters<typeof renderGoogleButton>[1]);
      setStatus(ok ? 'ready' : 'unavailable');
    });
  }, [onSuccess]);

  useEffect(() => { mount(); }, [mount]);

  if (status === 'unavailable') return (
    <div className="p-3 rounded-xl text-xs font-mono text-center"
      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#b45309' }}>
      Google Sign-In didn't load.{' '}
      <button onClick={mount} className="underline font-bold">Try again</button>
    </div>
  );

  return (
    <div className="relative" style={{ minHeight: 44 }}>
      <div id="gsi-btn" className="flex justify-center"
        style={{ opacity: status === 'ready' ? 1 : 0, transition: 'opacity 0.25s', minHeight: 44 }} />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center gap-2.5 rounded-full border"
          style={{ borderColor: 'var(--t-border)', background: 'var(--t-card)' }}>
          <Spinner />
          <span className="text-sm font-medium" style={{ color: 'var(--t-muted)' }}>Loading Google…</span>
        </div>
      )}
    </div>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px" style={{ background: 'var(--t-border)' }} />
      <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>or</span>
      <div className="flex-1 h-px" style={{ background: 'var(--t-border)' }} />
    </div>
  );
}

// ── Role chooser card ────────────────────────────────────────────────────────
const ROLES: {
  id: Role;
  emoji: string;
  label: string;
  desc: string;
  accent: string;
  bg: string;
}[] = [
  {
    id: 'customer',
    emoji: '🏍️',
    label: 'Customer',
    desc: 'Book rides, view history & manage your account',
    accent: 'var(--t-accent)',
    bg: 'color-mix(in srgb, var(--t-accent) 10%, transparent)',
  },
  {
    id: 'admin',
    emoji: '🛡️',
    label: 'Admin',
    desc: 'Manage fleet, bookings, staff & analytics',
    accent: '#6366f1',
    bg: 'rgba(99,102,241,0.10)',
  },
  {
    id: 'guest',
    emoji: '👤',
    label: 'Continue as Guest',
    desc: 'Browse & book without creating an account',
    accent: 'var(--t-muted)',
    bg: 'var(--t-bg2)',
  },
];

function RoleChooser({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 max-w-sm mx-auto w-full">

      {/* Hero */}
      <div className="hero-card rounded-3xl px-6 py-8 text-center">
        <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-4 shadow-lg text-3xl">
          🏍️
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Royal Quads</h1>
        <p className="text-sm text-white/50 mt-1 font-mono tracking-wide">Mambrui Sand Dunes</p>
      </div>

      {/* Role cards */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono uppercase tracking-widest text-center" style={{ color: 'var(--t-muted)' }}>
          How are you using the app?
        </p>

        {ROLES.map((r, i) => (
          <motion.button
            key={r.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => onSelect(r.id)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] hover:opacity-90"
            style={{ background: r.bg, borderColor: `color-mix(in srgb, ${r.accent} 30%, transparent)` }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `color-mix(in srgb, ${r.accent} 15%, transparent)` }}>
              {r.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{r.label}</p>
              <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--t-muted)' }}>{r.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--t-muted)' }} />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser]         = useState<FullUser | null>(null);
  const [history, setHistory]   = useState<Booking[]>([]);
  const [role, setRole]         = useState<Role | null>(null);
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
    setUser(u); setError('');
    api.getUserHistory(u.id).then(setHistory).catch(() => {});
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const u = isLogin
        ? await api.login(phone, password)
        : await api.register(name, phone, password);
      signIn(u as FullUser);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    googleSignOut();
    localStorage.removeItem('user');
    setUser(null); setHistory([]); setRole(null);
  };

  const handleRoleSelect = (r: Role) => {
    if (r === 'admin') { navigate('/admin'); return; }
    if (r === 'guest') { navigate('/'); return; }
    setRole(r); // 'customer' → show sign-in form
  };

  const totalSpent = history.reduce((s, b) => s + b.price + (b.overtimeCharge ?? 0), 0);
  const isGoogleUser = !!user?.googleId;

  /* ════════════════════════════════════════
     LOGGED IN — profile view
  ════════════════════════════════════════ */
  if (user) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">

      {/* Banner */}
      <div className="hero-card relative rounded-3xl overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ background: 'var(--t-accent2)' }} />
        <div className="relative z-10 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name}
                  className="w-14 h-14 rounded-2xl object-cover shadow-lg"
                  style={{ border: '2px solid rgba(255,255,255,0.25)' }} />
              ) : (
                <div className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center text-2xl shadow-lg">👤</div>
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
                {isGoogleUser && (
                  <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
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
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <History className="w-4 h-4" />,    value: history.length,                           label: 'Total Rides' },
          { icon: <TrendingUp className="w-4 h-4" />, value: `${totalSpent.toLocaleString()} KES`,     label: 'Total Spent' },
        ].map(({ icon, value, label }) => (
          <div key={label} className="t-card rounded-2xl p-4 text-center">
            <div className="flex justify-center mb-2" style={{ color: 'var(--t-accent)' }}>{icon}</div>
            <p className="font-display font-bold text-xl" style={{ color: 'var(--t-text)' }}>{value}</p>
            <p className="font-mono text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Ride history */}
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
                      {(b.price + (b.overtimeCharge ?? 0)).toLocaleString()} <span className="text-xs font-sans">KES</span>
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

  /* ════════════════════════════════════════
     ROLE CHOOSER
  ════════════════════════════════════════ */
  if (!role) return <RoleChooser onSelect={handleRoleSelect} />;

  /* ════════════════════════════════════════
     CUSTOMER SIGN-IN / REGISTER
  ════════════════════════════════════════ */
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 max-w-sm mx-auto w-full">

      <div className="t-card rounded-2xl overflow-hidden">

        {/* Header strip */}
        <div className="hero-card px-6 py-7 relative">
          {/* Back button */}
          <button onClick={() => { setRole(null); setError(''); }}
            className="absolute top-4 left-4 p-2 rounded-xl transition-opacity hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <div className="w-12 h-12 rounded-xl accent-gradient flex items-center justify-center mx-auto mb-3 shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display text-xl font-bold text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-white/50 mt-0.5 font-mono">
              {isLogin ? 'Sign in to your account' : 'Join as a customer'}
            </p>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4">

          {/* Google */}
          {isGoogleEnabled() ? (
            <GoogleButton onSuccess={signIn} />
          ) : null}

          {isGoogleEnabled() && <OrDivider />}

          {/* Phone form */}
          <form onSubmit={handleAuth} className="flex flex-col gap-3">
            <AnimatePresence>
              {!isLogin && (
                <motion.div key="name" initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <input type="text" placeholder="Full Name" value={name}
                    onChange={e => setName(e.target.value)} className="input" required />
                </motion.div>
              )}
            </AnimatePresence>
            <input type="tel" placeholder="Phone Number" value={phone}
              onChange={e => setPhone(e.target.value)} className="input" required />
            <input type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} className="input" required />
            <ErrorMessage message={error} />
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><Spinner /> Please wait…</> : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: 'var(--t-muted)' }}>
            {isLogin ? "Don't have an account? " : 'Already registered? '}
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
}
