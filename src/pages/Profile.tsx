import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut, History, Clock, Star, TrendingUp, Calendar, Mail,
  ChevronRight, ArrowLeft, Eye, EyeOff, User, Phone, Lock,
  Bike, ShieldCheck, UserCircle2, RefreshCw, MapPin,
} from 'lucide-react';
import { api } from '../lib/api';
import { Spinner } from '../lib/components/ui';
import { useToast } from '../lib/components/Toast';
import {
  renderGoogleButton, googleSignOut, isGoogleEnabled, waitForGSI,
} from '../lib/googleAuth';
import type { GoogleUser } from '../lib/googleAuth';
import type { User as UserType, Booking } from '../types';

type FullUser  = UserType & { googleId?: string; avatarUrl?: string; email?: string };
type Role      = 'admin' | 'customer' | 'guest';
type AuthMode  = 'signin' | 'signup';

/* ─── Google colour mark ──────────────────────────────────────────────────── */
const GIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ─── GSI button with robust width measurement + remount-on-retry ─────────── */
interface GBtnProps { onSuccess: (u: GoogleUser) => void; onError: (m: string) => void; }

function GoogleBtn({ onSuccess, onError }: GBtnProps) {
  // Incrementing this key fully unmounts + remounts the inner component
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(n => n + 1), []);
  // React.createElement is used so TypeScript doesn't complain about `key` not
  // being in the prop type of GoogleBtnInner.
  return React.createElement(GoogleBtnInner, { key: attempt, onSuccess, onError, onRetry: retry });
}

interface GBtnInnerProps extends GBtnProps { onRetry: () => void; }

function GoogleBtnInner({ onSuccess, onError, onRetry }: GBtnInnerProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const dead     = useRef(false);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'fail'>('loading');

  useEffect(() => {
    dead.current = false;
    (async () => {
      const ok = await waitForGSI(15_000);
      if (dead.current) return;
      if (!ok) { setPhase('fail'); return; }

      // Two rAFs: first lets the DOM paint, second lets CSS resolve widths
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (dead.current || !innerRef.current || !outerRef.current) return;
        // Force explicit pixel width so GSI's iframe renders full-width
        innerRef.current.style.width = `${outerRef.current.clientWidth}px`;
        try {
          renderGoogleButton(innerRef.current, u => {
            if (!dead.current) onSuccess(u);
          });
          setPhase('ready');
        } catch (e) {
          if (!dead.current) {
            const msg = e instanceof Error ? e.message : 'Google Sign-In failed';
            setPhase('fail');
            onError(msg);
          }
        }
      }));
    })();
    return () => { dead.current = true; };
  }, []); // eslint-disable-line

  if (phase === 'fail') return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2.5 py-3 px-4 rounded-2xl text-center"
      style={{ background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.3)' }}>
      <p className="text-xs" style={{ color: 'var(--t-muted)' }}>
        Google Sign-In couldn't load — check your connection
      </p>
      <button onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
          transition-all active:scale-95 hover:opacity-80"
        style={{ background: 'white', border: '1px solid #dadce0', color: '#3c4043' }}>
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </motion.div>
  );

  return (
    <div ref={outerRef} className="w-full relative" style={{ minHeight: 50 }}>
      {/* GSI iframe renders here */}
      <div ref={innerRef}
        className="overflow-hidden"
        style={{
          opacity: phase === 'ready' ? 1 : 0,
          transition: 'opacity 0.3s',
          minHeight: 50,
          display: 'flex',
          justifyContent: 'center',
        }} />

      {/* Shimmer while loading */}
      <AnimatePresence>
        {phase === 'loading' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center gap-2.5 rounded-full border"
            style={{ background: '#fff', borderColor: '#dadce0', pointerEvents: 'none' }}>
            <Spinner />
            <span className="text-sm font-medium" style={{ color: '#5f6368' }}>Loading Google…</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── "— or —" divider ────────────────────────────────────────────────────── */
const OrDivider = () => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px" style={{ background: 'var(--t-border)' }} />
    <span className="font-mono text-[11px] uppercase tracking-widest px-1"
      style={{ color: 'var(--t-muted)' }}>or</span>
    <div className="flex-1 h-px" style={{ background: 'var(--t-border)' }} />
  </div>
);

/* ─── Labelled input row ──────────────────────────────────────────────────── */
function InputRow({
  label, icon, type = 'text', placeholder, value, onChange,
  autoComplete, suffix, error,
}: {
  label: string; icon: React.ReactNode; type?: string;
  placeholder: string; value: string; onChange: (v: string) => void;
  autoComplete?: string; suffix?: React.ReactNode; error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider"
        style={{ color: 'var(--t-muted)' }}>
        <span style={{ color: 'var(--t-accent)' }}>{icon}</span>
        {label}
      </label>
      <div className="relative flex items-center">
        <input type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="input"
          style={suffix ? { paddingRight: '3rem' } : {}} />
        {suffix && (
          <span className="absolute right-3 flex items-center">{suffix}</span>
        )}
      </div>
      {error && (
        <p className="text-xs font-mono" style={{ color: '#ef4444' }}>{error}</p>
      )}
    </div>
  );
}

/* ─── Role chooser ────────────────────────────────────────────────────────── */
type RoleCard = { id: Role; icon: React.ReactNode; title: string; desc: string; accent: string; };
const ROLES: RoleCard[] = [
  {
    id: 'customer', icon: <Bike className="w-5 h-5" />,
    title: 'Customer', desc: 'Book rides, view history & manage your account',
    accent: 'var(--t-accent)',
  },
  {
    id: 'admin', icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Admin / Staff', desc: 'Fleet management, bookings & analytics',
    accent: '#818cf8',
  },
  {
    id: 'guest', icon: <UserCircle2 className="w-5 h-5" />,
    title: 'Continue as Guest', desc: 'Browse and book without an account',
    accent: 'var(--t-muted)',
  },
];

function RoleChooser({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className="flex flex-col gap-5 max-w-sm mx-auto w-full pt-2">

      {/* ── Hero ── */}
      <div className="relative rounded-3xl overflow-hidden hero-card">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 0%, rgba(201,151,42,0.28) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col items-center gap-4 pt-10 pb-8 px-6">
          {/* Logo */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden shadow-2xl"
              style={{ border: '3px solid rgba(255,255,255,0.15)' }}>
              <img src="/logo.png" alt="Royal Quad Bikes" className="w-full h-full object-cover" />
            </div>
            {/* Gold ring */}
            <div className="absolute inset-0 rounded-full pointer-events-none"
              style={{ boxShadow: '0 0 0 1px rgba(201,151,42,0.4), 0 8px 32px rgba(0,0,0,0.5)' }} />
          </div>

          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-white leading-tight">
              Royal Quad Bikes
            </h1>
            <div className="flex items-center justify-center gap-1.5 mt-1.5">
              <MapPin className="w-3 h-3 text-white/40" />
              <p className="text-white/40 text-xs font-mono tracking-[0.18em] uppercase">
                Mambrui · Kenya
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Role cards ── */}
      <div className="flex flex-col gap-2.5">
        <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-center"
          style={{ color: 'var(--t-muted)' }}>
          Who are you?
        </p>

        {ROLES.map((r, i) => (
          <motion.button key={r.id}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 + 0.1, type: 'spring', damping: 20 }}
            onClick={() => onSelect(r.id)}
            className="group flex items-center gap-4 w-full text-left p-4 rounded-2xl
              transition-all duration-150 active:scale-[0.97]"
            style={{
              background: `color-mix(in srgb, ${r.accent} 7%, var(--t-bg2))`,
              border: `1.5px solid color-mix(in srgb, ${r.accent} 20%, var(--t-border))`,
            }}>
            {/* Icon */}
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0
              transition-transform duration-150 group-hover:scale-110"
              style={{
                background: `color-mix(in srgb, ${r.accent} 14%, transparent)`,
                color: r.accent,
              }}>
              {r.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{r.title}</p>
              <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--t-muted)' }}>{r.desc}</p>
            </div>

            <ChevronRight className="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
              style={{ color: 'var(--t-muted)' }} />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Auth form (sign-in / sign-up) ──────────────────────────────────────── */
function AuthForm({
  onSuccess, onBack,
}: {
  onSuccess: (u: FullUser) => void;
  onBack: () => void;
}) {
  const toast = useToast();
  const [mode,     setMode]     = useState<AuthMode>('signin');
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [busy,     setBusy]     = useState(false);

  const switchMode = (m: AuthMode) => { setMode(m); setPassword(''); setShowPw(false); };

  const handleGoogleSuccess = useCallback((u: GoogleUser) => {
    onSuccess(u as FullUser);
  }, [onSuccess]);

  const handleGoogleError = useCallback((msg: string) => {
    toast.error(msg || 'Google Sign-In unavailable — try again or use phone/password');
  }, [toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim(), p = phone.trim();
    if (mode === 'signup' && !n)       { toast.error('Please enter your name'); return; }
    if (!p)                             { toast.error('Please enter your phone number'); return; }
    if (!password)                      { toast.error('Please enter a password'); return; }
    if (mode === 'signup' && password.length < 4) {
      toast.error('Password must be at least 4 characters'); return;
    }
    setBusy(true);
    try {
      const u = mode === 'signin'
        ? await api.login(p, password)
        : await api.register(n, p, password);
      onSuccess(u as FullUser);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed — please try again');
    } finally { setBusy(false); }
  };

  const pwSuffix = (
    <button type="button" tabIndex={-1}
      onClick={() => setShowPw(v => !v)}
      className="p-1 transition-opacity hover:opacity-70"
      style={{ color: 'var(--t-muted)' }}>
      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className="max-w-sm mx-auto w-full">

      {/* ── Card shell ── */}
      <div className="rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--t-bg)', border: '1px solid var(--t-border)' }}>

        {/* ── Header ── */}
        <div className="hero-card relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,151,42,0.35) 0%, transparent 70%)' }} />

          {/* Back button */}
          <button onClick={onBack}
            className="absolute top-4 left-4 z-20 p-2 rounded-xl
              transition-all hover:bg-white/10 active:scale-90"
            style={{ color: 'rgba(255,255,255,0.65)' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Logo + title */}
          <div className="relative z-10 flex flex-col items-center gap-3 pt-8 pb-5 px-6">
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-xl"
              style={{ border: '2.5px solid rgba(255,255,255,0.18)' }}>
              <img src="/logo.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <h1 className="font-display text-xl font-bold text-white">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-white/45 text-xs font-mono mt-0.5">
                {mode === 'signin' ? 'Sign in to continue' : 'Join Royal Quad Bikes'}
              </p>
            </div>
          </div>

          {/* Mode toggle pill */}
          <div className="relative z-10 mx-5 mb-5 flex p-1 rounded-2xl gap-1"
            style={{ background: 'rgba(0,0,0,0.3)' }}>
            {(['signin', 'signup'] as AuthMode[]).map(m => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200"
                style={{
                  background:  mode === m ? 'rgba(255,255,255,0.16)' : 'transparent',
                  color:       mode === m ? 'white' : 'rgba(255,255,255,0.4)',
                  boxShadow:   mode === m ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
                }}>
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-6 flex flex-col gap-4">

          {/* Google sign-in */}
          {isGoogleEnabled() && (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-center"
                  style={{ color: 'var(--t-muted)' }}>
                  Quick sign-in with Google
                </p>
                <GoogleBtn onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
              </div>
              <OrDivider />
            </>
          )}

          {/* Phone/password form */}
          <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>

            <AnimatePresence initial={false}>
              {mode === 'signup' && (
                <motion.div key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}>
                  <InputRow
                    label="Full Name" icon={<User className="w-3.5 h-3.5" />}
                    placeholder="e.g. Aisha Mohamed"
                    value={name} onChange={setName} autoComplete="name" />
                </motion.div>
              )}
            </AnimatePresence>

            <InputRow
              label="Phone Number" icon={<Phone className="w-3.5 h-3.5" />}
              type="tel" placeholder="07xx xxx xxx"
              value={phone} onChange={setPhone} autoComplete="tel" />

            <InputRow
              label="Password" icon={<Lock className="w-3.5 h-3.5" />}
              type={showPw ? 'text' : 'password'}
              placeholder={mode === 'signup' ? 'Min 4 characters' : 'Your password'}
              value={password} onChange={setPassword}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              suffix={pwSuffix} />

            <motion.button type="submit" disabled={busy}
              whileTap={{ scale: 0.97 }}
              className="btn-primary mt-1"
              style={{ borderRadius: '0.875rem' }}>
              {busy
                ? <><Spinner /> Please wait…</>
                : mode === 'signin'
                  ? <><ShieldCheck className="w-4 h-4" /> Sign In</>
                  : <><User className="w-4 h-4" /> Create Account</>}
            </motion.button>
          </form>

          {/* Toggle link */}
          <p className="text-center text-xs pb-1" style={{ color: 'var(--t-muted)' }}>
            {mode === 'signin' ? "Don't have an account?" : 'Already registered?'}{' '}
            <button type="button"
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-semibold hover:underline underline-offset-2 transition-opacity hover:opacity-80"
              style={{ color: 'var(--t-accent)' }}>
              {mode === 'signin' ? 'Register free' : 'Sign in instead'}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Logged-in profile view ─────────────────────────────────────────────── */
function LoggedInView({
  user, history, onLogout,
}: {
  user: FullUser; history: Booking[]; onLogout: () => void;
}) {
  const totalSpent = history.reduce((s, b) => s + b.price + (b.overtimeCharge ?? 0), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">

      {/* ── Hero banner ── */}
      <div className="hero-card relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 80% at 85% 0%, rgba(201,151,42,0.22) 0%, transparent 65%)' }} />
        <div className="relative z-10 p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.name}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-lg"
                  style={{ border: '2px solid rgba(255,255,255,0.2)' }} />
              : <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center
                  justify-center text-2xl shrink-0 shadow-lg">👤</div>
            }

            {/* Name & meta */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h1 className="font-display text-lg font-bold text-white leading-tight truncate">
                {user.name}
              </h1>
              {user.email && (
                <p className="flex items-center gap-1 text-white/45 text-[11px] font-mono mt-0.5 truncate">
                  <Mail className="w-3 h-3 shrink-0" /> {user.email}
                </p>
              )}
              {!user.email && user.phone && (
                <p className="text-white/45 text-[11px] font-mono mt-0.5">{user.phone}</p>
              )}
              {user.googleId && (
                <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full
                  text-[10px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)' }}>
                  <GIcon s={11} /> Google Account
                </span>
              )}
            </div>

            {/* Sign-out */}
            <button onClick={onLogout}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs
                font-semibold transition-all hover:bg-white/15 active:scale-90"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
              <LogOut className="w-3.5 h-3.5" /> Out
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <History className="w-4 h-4" />, value: history.length, label: 'Total Rides' },
          { icon: <TrendingUp className="w-4 h-4" />, value: `${totalSpent.toLocaleString()} KES`, label: 'Total Spent' },
        ].map(({ icon, value, label }) => (
          <div key={label} className="t-card rounded-2xl p-4 text-center">
            <div className="flex justify-center mb-2" style={{ color: 'var(--t-accent)' }}>{icon}</div>
            <p className="font-display font-bold text-xl" style={{ color: 'var(--t-text)' }}>{value}</p>
            <p className="font-mono text-[10px] mt-0.5 uppercase tracking-wider"
              style={{ color: 'var(--t-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Ride history ── */}
      <section>
        <h2 className="section-heading" style={{ color: 'var(--t-text)' }}>
          <History className="w-4 h-4" style={{ color: 'var(--t-accent)' }} /> Ride History
        </h2>

        {history.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="t-card rounded-3xl flex flex-col items-center gap-4 py-14 px-6 text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden opacity-30">
              <img src="/logo.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-display font-semibold text-lg" style={{ color: 'var(--t-text)' }}>
                No rides yet
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--t-muted)' }}>
                Your first dune adventure awaits!
              </p>
            </div>
            <Link to="/"
              className="btn-primary"
              style={{ maxWidth: 160, padding: '0.65rem 1.2rem', fontSize: '0.85rem', borderRadius: '0.75rem' }}>
              Book a Ride
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((b, i) => (
              <motion.div key={b.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.035 }}
                className="t-card rounded-2xl p-4">

                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>
                      {b.quadName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 font-mono text-[10px]"
                      style={{ color: 'var(--t-muted)' }}>
                      <Calendar className="w-3 h-3" />
                      {new Date(b.startTime).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold" style={{ color: 'var(--t-accent)' }}>
                      {(b.price + (b.overtimeCharge ?? 0)).toLocaleString()}
                      {' '}<span className="text-xs font-sans">KES</span>
                    </p>
                    {b.promoCode && (
                      <p className="font-mono text-[9px] line-through" style={{ color: 'var(--t-muted)' }}>
                        {b.originalPrice.toLocaleString()} KES
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t"
                  style={{ borderColor: 'var(--t-border)' }}>
                  <span className="flex items-center gap-1 font-mono text-[11px]"
                    style={{ color: 'var(--t-muted)' }}>
                    <Clock className="w-3 h-3" /> {b.duration} min
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>
                    #{b.receiptId}
                  </span>
                  {b.rating != null && (
                    <span className="ml-auto flex items-center gap-0.5"
                      style={{ color: 'var(--t-accent)' }}>
                      <Star className="w-3 h-3" style={{ fill: 'var(--t-accent)' }} />
                      <span className="font-mono text-[10px]">{b.rating}/5</span>
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────── */
export default function Profile() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [user,    setUser]    = useState<FullUser | null>(null);
  const [history, setHistory] = useState<Booking[]>([]);
  const [role,    setRole]    = useState<Role | null>(null);

  // Restore persisted session
  useEffect(() => {
    let raw = '';
    try { raw = localStorage.getItem('user') || ''; } catch {}
    if (!raw) return;
    try {
      const u: FullUser = JSON.parse(raw);
      setUser(u);
      api.getUserHistory(u.id).then(setHistory).catch((e) => console.warn('[Profile] getUserHistory failed:', e));
    } catch { /* corrupted session */ }
  }, []);

  const signIn = useCallback((u: FullUser) => {
    try { localStorage.setItem('user', JSON.stringify(u)); } catch {}
    setUser(u);
    api.getUserHistory(u.id).then(setHistory).catch((e) => console.warn('[Profile] signIn history load failed:', e));
    toast.success(`Welcome${u.name ? `, ${u.name.split(' ')[0]}` : ''}! 🏍️`);
  }, [toast]);

  const signOut = () => {
    googleSignOut().catch((e) => console.warn('[Profile] googleSignOut failed:', e));
    try { localStorage.removeItem('user'); } catch {}
    setUser(null); setHistory([]); setRole(null);
  };

  const pickRole = (r: Role) => {
    if (r === 'admin') { navigate('/admin'); return; }
    if (r === 'guest') { navigate('/');      return; }
    setRole(r);
  };

  if (user)  return <LoggedInView user={user} history={history} onLogout={signOut} />;
  if (!role) return <RoleChooser onSelect={pickRole} />;
  return     <AuthForm onSuccess={signIn} onBack={() => setRole(null)} />;
}
