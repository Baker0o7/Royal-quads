import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, AlertTriangle, CheckCircle2, Navigation } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { LoadingScreen } from '../lib/components/ui';
import type { Booking } from '../types';

function formatTime(seconds: number) {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ActiveRide() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const calcSeconds = useCallback((b: Booking) => {
    const end = new Date(b.startTime).getTime() + b.duration * 60_000;
    return Math.floor((end - Date.now()) / 1000);
  }, []);

  useEffect(() => {
    api.getActiveBookings().then(data => {
      const current = data.find(b => b.id === Number(id));
      if (current) {
        setBooking(current);
        setSecondsLeft(calcSeconds(current));
      } else {
        navigate(`/receipt/${id}`, { replace: true });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, navigate, calcSeconds]);

  useEffect(() => {
    if (!booking) return;
    const timer = setInterval(() => setSecondsLeft(calcSeconds(booking)), 1000);
    return () => clearInterval(timer);
  }, [booking, calcSeconds]);

  const handleComplete = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      await api.completeBooking(Number(id));
      navigate(`/receipt/${id}`);
    } catch {
      setCompleting(false);
    }
  };

  if (loading) return <LoadingScreen text="Loading ride details..." />;
  if (!booking)  return <div className="p-8 text-center text-red-500 text-sm">Ride not found.</div>;

  const isOvertime  = secondsLeft < 0;
  const totalSecs   = booking.duration * 60;
  const elapsed     = totalSecs - secondsLeft;
  const progressPct = Math.min(100, Math.max(0, (elapsed / totalSecs) * 100));

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-5 items-center justify-center min-h-[70vh]">

      {/* Timer Card */}
      <div className={cn(
        'w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden transition-colors duration-700',
        isOvertime ? 'bg-red-600 text-white' : 'bg-stone-900 text-white'
      )}>
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white/10 p-4 rounded-full mb-5 backdrop-blur-sm">
            <span className={cn('text-5xl block', isOvertime && 'animate-pulse')}>⏱️</span>
          </div>

          <h2 className="text-base font-medium text-white/70 mb-1">{booking.quadName}</h2>

          {/* Time Display */}
          <div className="font-mono text-7xl font-bold tracking-tighter mb-1 tabular-nums">
            {isOvertime ? '+' : ''}{formatTime(secondsLeft)}
          </div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-6">
            {isOvertime ? 'Overtime' : 'Remaining'}
          </div>

          {/* Progress Bar */}
          {!isOvertime && (
            <div className="w-full bg-white/10 rounded-full h-2 mb-6 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }} />
            </div>
          )}

          {/* Booking Info */}
          <div className="w-full bg-white/10 rounded-2xl p-4 flex flex-col gap-2.5 text-left backdrop-blur-sm">
            {[
              ['Rider',    booking.customerName],
              ['Duration', `${booking.duration} min`],
              ['Price',    `${booking.price.toLocaleString()} KES`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-white/50 text-sm">{label}</span>
                <span className="font-bold text-sm">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">Location</span>
              <a href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6" target="_blank" rel="noopener noreferrer"
                className="font-bold text-sm flex items-center gap-1 hover:text-emerald-300 transition-colors">
                <MapPin className="w-3.5 h-3.5" /> Mambrui
              </a>
            </div>
            {booking.quadImei && (
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-white/10">
                <span className="text-white/50 text-sm">Tracking</span>
                <button onClick={() => navigate(`/track/${booking.quadImei}`)}
                  className="font-bold text-sm flex items-center gap-1 text-emerald-300 hover:text-emerald-200 transition-colors">
                  <Navigation className="w-3.5 h-3.5" /> Live Track
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="absolute -left-16 -top-16 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Overtime Warning */}
      {isOvertime && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-start gap-3 border border-red-200 w-full max-w-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Please return the quad</p>
            <p className="text-sm mt-1 text-red-600">Your rental has ended. Return to the starting point.</p>
          </div>
        </motion.div>
      )}

      {/* End Ride Button */}
      <button onClick={handleComplete} disabled={completing}
        className="w-full max-w-sm bg-emerald-600 text-white p-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/25 disabled:opacity-60 active:scale-[0.99]">
        {completing ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Ending...</>
        ) : (
          <><CheckCircle2 className="w-6 h-6" /> End Ride Now</>
        )}
      </button>
    </motion.div>
  );
}
