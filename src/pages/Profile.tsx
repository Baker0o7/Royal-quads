import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut, History, Clock, Calendar, Star, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import { SectionCard, LoadingScreen, ErrorMessage } from '../lib/components/ui';
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
      const u = isLogin
        ? await api.login(phone, password)
        : await api.register(name, phone, password);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      api.getUserHistory(u.id).then(setHistory).catch(console.error);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setHistory([]);
  };

  const totalSpent = history.reduce((s, b) => s + b.price, 0);

  const inputCls = 'w-full p-4 rounded-2xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none transition-colors text-stone-900 placeholder:text-stone-400';

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
        <SectionCard>
          <h1 className="text-2xl font-bold mb-6 text-center tracking-tight">
            {isLogin ? 'Welcome Back 👋' : 'Create Account'}
          </h1>
          <form onSubmit={handleAuth} className="flex flex-col gap-3">
            {!isLogin && (
              <input type="text" placeholder="Full Name" value={name}
                onChange={e => setName(e.target.value)} className={inputCls} required />
            )}
            <input type="tel" placeholder="Phone Number" value={phone}
              onChange={e => setPhone(e.target.value)} className={inputCls} required />
            <input type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} className={inputCls} required />
            {error && <ErrorMessage message={error} />}
            <button type="submit" disabled={loading}
              className="w-full bg-stone-900 text-white p-4 rounded-2xl font-bold text-lg hover:bg-stone-800 transition-colors mt-2 disabled:opacity-50">
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
          <div className="mt-5 text-center">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-emerald-600 font-medium hover:underline text-sm">
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
        </SectionCard>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">

      {/* Profile Header */}
      <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">{user.name}</h1>
            <p className="text-emerald-200 text-sm">{user.phone}</p>
          </div>
          <button onClick={handleLogout} title="Logout"
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500 rounded-full blur-3xl opacity-40 pointer-events-none" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard className="text-center py-4">
          <div className="text-2xl font-bold">{history.length}</div>
          <div className="text-xs text-stone-500 mt-1 flex items-center justify-center gap-1">
            <History className="w-3 h-3" /> Total Rides
          </div>
        </SectionCard>
        <SectionCard className="text-center py-4">
          <div className="text-2xl font-bold text-emerald-600">{totalSpent.toLocaleString()}</div>
          <div className="text-xs text-stone-500 mt-1 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" /> KES Spent
          </div>
        </SectionCard>
      </div>

      {/* Ride History */}
      <section>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-600" /> Ride History
        </h2>
        {history.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-3xl border border-stone-200 text-stone-500 text-sm">
            No rides yet. Time to hit the dunes! 🏜️
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(b => (
              <div key={b.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-stone-900">{b.quadName}</h3>
                    <div className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(b.startTime).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">{b.price.toLocaleString()} KES</div>
                    {b.promoCode && (
                      <div className="text-xs text-stone-400 line-through">{b.originalPrice.toLocaleString()} KES</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-stone-100">
                  <div className="flex items-center gap-1 text-xs text-stone-500">
                    <Clock className="w-3.5 h-3.5" /> {b.duration} min
                  </div>
                  <div className="text-xs text-stone-400 font-mono">#{b.receiptId}</div>
                  {b.rating != null && (
                    <div className="flex items-center gap-0.5 ml-auto text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="text-xs font-bold text-stone-500">{b.rating}/5</span>
                    </div>
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
