import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut, History, Clock, Star, TrendingUp, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { LoadingScreen, ErrorMessage } from '../lib/components/ui';
import type { User, Booking } from '../types';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<Booking[]>([]);
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u: User = JSON.parse(stored);
      setUser(u);
      api.getUserHistory(u.id).then(setHistory).catch(console.error);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const u = isLogin ? await api.login(phone, password) : await api.register(name, phone, password);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      api.getUserHistory(u.id).then(setHistory).catch(console.error);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally { setLoading(false); }
  };

  const handleLogout = () => { localStorage.removeItem('user'); setUser(null); setHistory([]); };
  const totalSpent = history.reduce((s, b) => s + b.price, 0);

  if (!user) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
      <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-6 backdrop-blur-sm">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9972a] to-[#8a6010] flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🏍️</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#1a1612] dark:text-[#f5f0e8]">
            {isLogin ? 'Welcome Back' : 'Join Us'}
          </h1>
          <p className="text-xs text-[#7a6e60] dark:text-[#a09070] mt-1 font-mono">
            {isLogin ? 'Sign in to your account' : 'Create your rider profile'}
          </p>
        </div>
        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          {!isLogin && <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="input" required />}
          <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="input" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input" required />
          {error && <ErrorMessage message={error} />}
          <button type="submit" disabled={loading} className="btn-primary mt-1">
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-[#c9972a] hover:text-[#e8b84b] text-sm transition-colors font-medium">
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">

      {/* Profile banner */}
      <div className="relative rounded-3xl overflow-hidden bg-[#1a1612] p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d2318] via-[#1a1612] to-[#0d0b09]" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#c9972a]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9972a] to-[#8a6010] flex items-center justify-center text-xl shadow-lg">
              👤
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white">{user.name}</h1>
              <p className="font-mono text-[11px] text-[#c9b99a]/60">{user.phone}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/60 hover:text-white transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <History className="w-4 h-4" />, value: history.length, label: 'Total Rides' },
          { icon: <TrendingUp className="w-4 h-4" />, value: `${totalSpent.toLocaleString()} KES`, label: 'Total Spent' },
        ].map(({ icon, value, label }) => (
          <div key={label} className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-4 text-center backdrop-blur-sm">
            <div className="text-[#c9972a] flex justify-center mb-2">{icon}</div>
            <p className="font-display font-bold text-xl text-[#1a1612] dark:text-[#f5f0e8]">{value}</p>
            <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] mt-0.5 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* History */}
      <section>
        <h2 className="font-display text-base font-bold mb-3 text-[#1a1612] dark:text-[#f5f0e8] flex items-center gap-2">
          <History className="w-4 h-4 text-[#c9972a]" /> Ride History
        </h2>
        {history.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-[#c9b99a]/15 dark:border-[#c9b99a]/8 bg-white/40 dark:bg-[#1a1612]/40">
            <p className="text-2xl mb-2">🏜️</p>
            <p className="text-sm text-[#7a6e60] dark:text-[#a09070]">No rides yet. Hit the dunes!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(b => (
              <div key={b.id} className="bg-white/70 dark:bg-[#1a1612]/70 p-4 rounded-2xl border border-[#c9b99a]/15 dark:border-[#c9b99a]/8 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{b.quadName}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] font-mono text-[#7a6e60] dark:text-[#a09070]">
                      <Calendar className="w-3 h-3" /> {new Date(b.startTime).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-[#c9972a]">{b.price.toLocaleString()} <span className="text-xs font-sans">KES</span></p>
                    {b.promoCode && <p className="font-mono text-[9px] text-[#7a6e60] line-through">{b.originalPrice.toLocaleString()} KES</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-[#c9b99a]/10 dark:border-[#c9b99a]/5">
                  <span className="flex items-center gap-1 text-[11px] font-mono text-[#7a6e60] dark:text-[#a09070]">
                    <Clock className="w-3 h-3" /> {b.duration} min
                  </span>
                  <span className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">#{b.receiptId}</span>
                  {b.rating != null && (
                    <span className="ml-auto flex items-center gap-0.5 text-[#c9972a]">
                      <Star className="w-3 h-3 fill-[#c9972a]" />
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
