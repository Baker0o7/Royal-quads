import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { LogOut, History, Clock, Star, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { ErrorMessage, Spinner } from '../lib/components/ui';
import { renderGoogleButton } from '../lib/googleAuth';
import type { User, Booking } from '../types';

type FullUser = User & { googleId?: string; avatarUrl?: string };
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID as string) || '';

export default function Profile() {
  const [user, setUser]         = useState<FullUser | null>(null);
  const [history, setHistory]   = useState<Booking[]>([]);
  const [isLogin, setIsLogin]   = useState(true);
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (user || !GOOGLE_CLIENT_ID) return;
    const mount = () => {
      renderGoogleButton('google-btn', (googleUser) => {
        localStorage.setItem('user', JSON.stringify(googleUser));
        setUser(googleUser);
        api.getUserHistory(googleUser.id).then(setHistory).catch(() => {});
      });
    };
    const t = setTimeout(mount, 600);
    return () => clearTimeout(t);
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const u = isLogin
        ? await api.login(phone, password)
        : await api.register(name, phone, password);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      api.getUserHistory(u.id).then(setHistory).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null); setHistory([]);
    try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch {}
  };

  const totalSpent = history.reduce((s, b) => s + b.price + (b.overtimeCharge || 0), 0);

  /* ── Not logged in ── */
  if (!user) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
      <div className="t-card rounded-2xl p-6">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-3 shadow-md">
            <span className="text-xl">🏍️</span>
          </div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--t-text)' }}>
            {isLogin ? 'Welcome Back' : 'Join Us'}
          </h1>
          <p className="text-xs font-mono mt-1" style={{ color: 'var(--t-muted)' }}>
            {isLogin ? 'Sign in to your account' : 'Create your rider profile'}
          </p>
        </div>

        {/* Google button */}
        {GOOGLE_CLIENT_ID ? (
          <>
            <div id="google-btn" ref={googleBtnRef} className="w-full mb-4 flex justify-center min-h-[44px]" />
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'var(--t-border)' }} />
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'var(--t-border)' }} />
            </div>
          </>
        ) : (
          <div className="mb-4 p-3 rounded-xl flex items-start gap-2"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#b45309' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: '#b45309' }}>Google Sign-In not configured</p>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: '#b45309' }}>
                Set <code>GOOGLE_CLIENT_ID</code> in your .env file to enable.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          {!isLogin && (
            <input type="text" placeholder="Full Name" value={name}
              onChange={e => setName(e.target.value)} className="input" required autoComplete="name" />
          )}
          <input type="tel" placeholder="Phone Number" value={phone}
            onChange={e => setPhone(e.target.value)} className="input" required autoComplete="tel" />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} className="input" required autoComplete="current-password" />
          <ErrorMessage message={error} />
          <button type="submit" disabled={loading} className="btn-primary mt-1">
            {loading ? <><Spinner /> Please wait…</> : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--t-accent)' }}>
            {isLogin ? "Don't have an account? Register" : 'Already registered? Sign In'}
          </button>
        </div>
      </div>
    </motion.div>
  );

  /* ── Logged in ── */
  const isGoogleUser = !!(user as FullUser).googleId;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">

      {/* Banner */}
      <div className="hero-card relative rounded-3xl p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-10"
          style={{ background: 'var(--t-accent2)' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(user as FullUser).avatarUrl ? (
              <img src={(user as FullUser).avatarUrl} alt={user.name}
                className="w-12 h-12 rounded-2xl object-cover shadow-lg"
                style={{ border: `2px solid color-mix(in srgb, var(--t-accent) 50%, transparent)` }} />
            ) : (
              <div className="w-12 h-12 rounded-2xl accent-gradient flex items-center justify-center text-xl shadow-lg">
                👤
              </div>
            )}
            <div>
              <h1 className="font-display text-lg font-bold text-white">{user.name}</h1>
              <p className="font-mono text-[11px] text-white/50">
                {isGoogleUser ? '● Google Account' : user.phone}
              </p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="p-2 rounded-xl text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <History className="w-4 h-4" />,  value: history.length, label: 'Total Rides' },
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

      {/* Ride history */}
      <section>
        <h2 className="section-heading" style={{ color: 'var(--t-text)' }}>
          <History className="w-4 h-4" style={{ color: 'var(--t-accent)' }} /> Ride History
        </h2>
        {history.length === 0 ? (
          <div className="text-center py-12 rounded-2xl t-card">
            <p className="text-2xl mb-2">🏜️</p>
            <p className="text-sm" style={{ color: 'var(--t-muted)' }}>No rides yet — hit the dunes!</p>
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
                      {new Date(b.startTime).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold" style={{ color: 'var(--t-accent)' }}>
                      {(b.price + (b.overtimeCharge || 0)).toLocaleString()} <span className="text-xs font-sans">KES</span>
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
