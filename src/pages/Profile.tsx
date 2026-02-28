import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, LogOut, History, Clock, Calendar, CreditCard } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchHistory(parsedUser.id);
    }
  }, []);

  const fetchHistory = async (userId: number) => {
    try {
      const res = await fetch(`/api/users/${userId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { phone, password } : { name, phone, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      if (data.id) {
        fetchHistory(data.id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setHistory([]);
  };

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
          <h1 className="text-2xl font-bold mb-6 text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none transition-colors"
                required
              />
            )}
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none transition-colors"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none transition-colors"
              required
            />
            
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-stone-900 text-white p-4 rounded-2xl font-bold text-lg hover:bg-stone-800 transition-colors mt-2"
            >
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-600 font-medium hover:underline"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
            <p className="text-emerald-100">{user.phone}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500 rounded-full blur-3xl opacity-50" />
      </div>

      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-600" />
          Ride History
        </h2>
        
        {history.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-3xl border border-stone-200 text-stone-500">
            <p>No rides yet. Time to hit the dunes!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((booking) => (
              <div key={booking.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-stone-900">{booking.quadName}</h3>
                    <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(booking.startTime).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">{booking.price} KES</div>
                    {booking.promoCode && (
                      <div className="text-xs text-stone-500 line-through">{booking.originalPrice} KES</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pt-3 border-t border-stone-100">
                  <div className="flex items-center gap-1 text-sm text-stone-600">
                    <Clock className="w-4 h-4 text-stone-400" />
                    {booking.duration} min
                  </div>
                  <div className="flex items-center gap-1 text-sm text-stone-600">
                    <CreditCard className="w-4 h-4 text-stone-400" />
                    {booking.receiptId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
