import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, AlertTriangle, CheckCircle2, Navigation, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { LoadingScreen } from '../lib/components/ui';
import type { Booking } from '../types';
import { OVERTIME_RATE } from '../types';

function pad(n: number) { return String(Math.abs(n)).padStart(2, '0'); }

export default function ActiveRide() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const calcSeconds = useCallback((b: Booking) =>
    Math.floor((new Date(b.startTime).getTime() + b.duration * 60_000 - Date.now()) / 1000), []);

  useEffect(() => {
    api.getActiveBookings().then(data => {
      const cur = data.find(b => b.id === Number(id));
      if (cur) { setBooking(cur); setSecondsLeft(calcSeconds(cur)); }
      else navigate(`/receipt/${id}`, { replace: true });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, navigate, calcSeconds]);

  useEffect(() => {
    if (!booking) return;
    const t = setInterval(() => setSecondsLeft(calcSeconds(booking)), 1000);
    return () => clearInterval(t);
  }, [booking, calcSeconds]);

  const handleComplete = async () => {
    if (completing) return; setCompleting(true);
    try {
      const overtimeMinutes = Math.max(0, Math.ceil(Math.abs(Math.min(0, secondsLeft)) / 60));
      await api.completeBooking(Number(id), overtimeMinutes);
      navigate(`/receipt/${id}`);
    } catch { setCompleting(false); }
  };

  if (loading) return <LoadingScreen text="Loading ride..." />;
  if (!booking) return <div className="p-8 text-center text-red-500 text-sm">Ride not found.</div>;

  const isOvertime = secondsLeft < 0;
  const overtimeMins = Math.ceil(Math.abs(Math.min(0, secondsLeft)) / 60);
  const overtimeCharge = overtimeMins * OVERTIME_RATE;
  const mins = Math.floor(Math.abs(secondsLeft) / 60);
  const secs = Math.abs(secondsLeft) % 60;
  const total = booking.duration * 60;
  const progress = Math.min(100, ((total - secondsLeft) / total) * 100);
  const circumference = 2 * Math.PI * 54;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col gap-5 items-center min-h-[70vh] justify-center">

      <div className={cn(
        'w-full max-w-sm rounded-3xl overflow-hidden relative text-white',
        isOvertime ? 'bg-gradient-to-br from-red-900 to-red-800' : 'bg-gradient-to-br from-[#1a1612] to-[#0d0b09]'
      )}>
        {!isOvertime && <div className="absolute top-0 right-0 w-48 h-48 bg-[#c9972a]/10 rounded-full blur-3xl pointer-events-none" />}
        <div className="relative z-10 p-8 flex flex-col items-center">
          <p className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase mb-5">{booking.quadName}</p>
          {/* waiver badge */}
          {booking.waiverSigned && (
            <div className="flex items-center gap-1.5 mb-3 bg-emerald-500/20 px-3 py-1 rounded-full">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400">Waiver Signed</span>
            </div>
          )}
          <div className="relative w-36 h-36 mb-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <circle cx="60" cy="60" r="54" fill="none" stroke={isOvertime ? '#f87171' : '#c9972a'} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={circumference * (1 - (isOvertime ? 1 : progress / 100))}
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('font-mono font-bold text-3xl tabular-nums', isOvertime && 'text-red-300')}>
                {isOvertime ? '+' : ''}{pad(mins)}:{pad(secs)}
              </span>
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-0.5">
                {isOvertime ? 'Overtime' : 'Remaining'}
              </span>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-2xl p-4 flex flex-col gap-3 text-sm border border-white/5">
            {[['Rider', booking.customerName], ['Duration', `${booking.duration} min`], ['Paid', `${booking.price.toLocaleString()} KES`]].map(([l, v]) => (
              <div key={l} className="flex justify-between"><span className="text-white/40 font-mono text-xs">{l}</span><span className="font-medium text-sm">{v}</span></div>
            ))}
            {booking.depositAmount! > 0 && (
              <div className="flex justify-between"><span className="text-white/40 font-mono text-xs">Deposit</span><span className="font-medium text-sm text-amber-300">{booking.depositAmount!.toLocaleString()} KES held</span></div>
            )}
            {booking.groupSize! > 1 && (
              <div className="flex justify-between"><span className="text-white/40 font-mono text-xs">Group</span><span className="font-medium text-sm">{booking.groupSize} riders</span></div>
            )}
            <div className="flex justify-between">
              <span className="text-white/40 font-mono text-xs">Location</span>
              <a href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6" target="_blank" rel="noopener noreferrer"
                className="font-medium text-sm flex items-center gap-1 text-[#e8b84b] hover:text-[#c9972a] transition-colors">
                <MapPin className="w-3 h-3" /> Mambrui
              </a>
            </div>
            {booking.quadImei && (
              <div className="flex justify-between pt-2 border-t border-white/5">
                <span className="text-white/40 font-mono text-xs">GPS</span>
                <button onClick={() => navigate(`/track/${booking.quadImei}`)} className="font-medium text-sm text-[#e8b84b] hover:text-[#c9972a] transition-colors flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> Track Live
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOvertime && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full max-w-sm bg-red-50 dark:bg-red-900/15 text-red-700 dark:text-red-400 p-4 rounded-2xl flex flex-col gap-1 border border-red-200/60 dark:border-red-800/40">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p className="font-semibold text-sm">Overtime — Please return the quad</p>
            </div>
            <p className="text-xs pl-6 opacity-80">
              {overtimeMins} min overtime · <span className="font-mono font-bold">{overtimeCharge.toLocaleString()} KES</span> extra charge ({OVERTIME_RATE} KES/min)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={handleComplete} disabled={completing} className="w-full max-w-sm btn-primary">
        {completing
          ? <><div className="w-4 h-4 rounded-full border-2 border-current/20 border-t-current animate-spin" /> Ending Ride...</>
          : <><CheckCircle2 className="w-4 h-4" /> End Ride{isOvertime ? ` (+${overtimeCharge.toLocaleString()} KES)` : ''}</>}
      </button>
    </motion.div>
  );
}
