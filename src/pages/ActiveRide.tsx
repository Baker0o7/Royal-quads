import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, AlertTriangle, CheckCircle2, Navigation, Shield, MessageCircle } from 'lucide-react';
import { api } from '../lib/api';
import { LoadingScreen, Spinner } from '../lib/components/ui';
import { notifications } from '../lib/notifications';
import { sendWhatsApp, smsTemplates } from '../lib/sms';
import { haptic } from '../lib/utils';
import type { Booking } from '../types';
import { OVERTIME_RATE } from '../types';

function pad(n: number) { return String(Math.abs(n)).padStart(2, '0'); }

export default function ActiveRide() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const [booking, setBooking]       = useState<Booking | null>(null);
  const [secondsLeft, setSeconds]   = useState(0);
  const [loading, setLoading]       = useState(true);
  const [completing, setCompleting] = useState(false);

  // Track whether we've fired each one-time notification
  const firedOvertime = useRef(false);
  const firedWarning  = useRef(false); // 2-min warning

  const calcSecs = useCallback((b: Booking) =>
    Math.floor((new Date(b.startTime).getTime() + b.duration * 60_000 - Date.now()) / 1000), []);

  useEffect(() => {
    api.getActiveBookings().then(data => {
      const cur = data.find(b => b.id === Number(id));
      if (cur) {
        setBooking(cur);
        setSeconds(calcSecs(cur));
        // Ride started notification (only once — check if already fired)
        const firedKey = `rq:notif_started_${cur.id}`;
        if (!localStorage.getItem(firedKey)) {
          localStorage.setItem(firedKey, '1');
          notifications.add('ride_started', 'Ride Started! 🏍️',
            `${cur.customerName} is riding ${cur.quadName} for ${cur.duration} min.`,
            `/ride/${cur.id}`);
        }
      } else {
        navigate(`/receipt/${id}`, { replace: true });
      }
    }).catch(() => navigate(`/receipt/${id}`, { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate, calcSecs]);

  useEffect(() => {
    if (!booking) return;
    const t = setInterval(() => {
      const secs = calcSecs(booking);
      setSeconds(secs);

      // 2-minute warning
      if (secs > 0 && secs <= 120 && !firedWarning.current) {
        firedWarning.current = true;
        notifications.add('info', '2 Minutes Remaining ⏱️',
          `${booking.customerName}'s ride on ${booking.quadName} ends in 2 minutes.`,
          `/ride/${booking.id}`);
      }

      // Overtime notification
      if (secs < 0 && !firedOvertime.current) {
        firedOvertime.current = true;
        const mins = Math.ceil(-secs / 60);
        notifications.add('overtime', 'Overtime! ⏰',
          `${booking.customerName} is ${mins} min overtime on ${booking.quadName}. ${mins * OVERTIME_RATE} KES extra.`,
          `/ride/${booking.id}`);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [booking, calcSecs]);

  const handleComplete = async () => {
    if (completing || !booking) return;
    haptic('medium');
    setCompleting(true);
    try {
      const overtimeMins = Math.max(0, Math.ceil(-Math.min(0, secondsLeft) / 60));
      await api.completeBooking(booking.id, overtimeMins);
      const total = booking.price + overtimeMins * OVERTIME_RATE;
      notifications.add('ride_complete', 'Ride Complete ✅',
        `${booking.customerName} finished riding ${booking.quadName}. Total: ${total.toLocaleString()} KES.`,
        `/receipt/${id}`);
      navigate(`/receipt/${id}`);
    } catch { setCompleting(false); }
  };

  if (loading) return <LoadingScreen text="Loading ride…" />;
  if (!booking) return null;

  const isOvertime     = secondsLeft < 0;
  const overtimeMins   = Math.ceil(-Math.min(0, secondsLeft) / 60);
  const overtimeCharge = overtimeMins * OVERTIME_RATE;
  const totalSecs      = booking.duration * 60;
  const elapsed        = totalSecs - secondsLeft;
  const progress       = Math.min(1, elapsed / totalSecs);
  const C              = 2 * Math.PI * 54;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col gap-5 items-center min-h-[70vh] justify-center">

      {/* Timer card */}
      <div className="w-full max-w-sm rounded-3xl overflow-hidden relative text-white"
        style={{ background: isOvertime
          ? 'linear-gradient(135deg,#7f1d1d,#450a0a)'
          : 'linear-gradient(135deg, var(--t-hero-from), var(--t-hero-to))' }}>
        {!isOvertime && (
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-10"
            style={{ background: 'var(--t-accent2)' }} />
        )}
        <div className="relative z-10 p-8 flex flex-col items-center">
          <p className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase mb-4">
            {booking.quadName}
          </p>

          {booking.waiverSigned && (
            <div className="flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full"
              style={{ background: 'rgba(34,197,94,0.2)' }}>
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-[10px] font-mono text-green-400">Waiver Signed</span>
            </div>
          )}

          {/* Ring timer */}
          <div className="relative w-36 h-36 mb-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <circle cx="60" cy="60" r="54" fill="none"
                stroke={isOvertime ? '#f87171' : 'var(--t-accent)'}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (isOvertime ? 0 : 1 - progress)}
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono font-bold text-3xl tabular-nums"
                style={{ color: isOvertime ? '#fca5a5' : 'white' }}>
                {isOvertime ? '+' : ''}{pad(Math.floor(Math.abs(secondsLeft) / 60))}:{pad(Math.abs(secondsLeft) % 60)}
              </span>
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-1">
                {isOvertime ? 'Overtime' : 'Remaining'}
              </span>
            </div>
          </div>

          {/* Info rows */}
          <div className="w-full rounded-2xl p-4 flex flex-col gap-2.5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              ['Rider',    booking.customerName],
              ['Duration', `${booking.duration} min`],
              ['Paid',     `${booking.price.toLocaleString()} KES`],
              ...((booking.depositAmount ?? 0) > 0 ? [['Deposit', `${(booking.depositAmount ?? 0).toLocaleString()} KES held`]] : []),
              ...((booking.groupSize ?? 1) > 1 ? [['Group', `${booking.groupSize} riders`]] : []),
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-white/40 uppercase tracking-wider">{l}</span>
                <span className="font-medium text-sm text-white">{v}</span>
              </div>
            ))}
            <div className="flex justify-between items-center border-t border-white/5 pt-2.5 mt-0.5">
              <span className="font-mono text-[11px] text-white/40 uppercase tracking-wider">Location</span>
              <a href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6" target="_blank" rel="noopener noreferrer"
                className="font-medium text-sm flex items-center gap-1 transition-opacity hover:opacity-70"
                style={{ color: 'var(--t-accent2)' }}>
                <MapPin className="w-3 h-3" /> Mambrui
              </a>
            </div>
            {booking.quadImei && (
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-white/40 uppercase tracking-wider">GPS</span>
                <button onClick={() => navigate(`/track/${booking.quadImei}`)}
                  className="font-medium text-sm flex items-center gap-1 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--t-accent2)' }}>
                  <Navigation className="w-3 h-3" /> Track Live
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overtime warning */}
      <AnimatePresence>
        {isOvertime && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full max-w-sm p-4 rounded-2xl flex flex-col gap-2"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-2" style={{ color: '#ef4444' }}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p className="font-semibold text-sm">Overtime — Please return the quad now</p>
            </div>
            <p className="text-xs pl-6 opacity-80" style={{ color: '#ef4444' }}>
              {overtimeMins} min · <span className="font-mono font-bold">{overtimeCharge.toLocaleString()} KES</span> extra
            </p>
            {/* WhatsApp alert button */}
            <button
              onClick={() => sendWhatsApp(booking.customerPhone,
                smsTemplates.overtime(booking.customerName, overtimeMins, overtimeCharge))}
              className="mt-1 ml-6 flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#22c55e' }}>
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp {booking.customerName}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={handleComplete} disabled={completing}
        className="w-full max-w-sm btn-primary">
        {completing
          ? <><Spinner /> Ending Ride…</>
          : <><CheckCircle2 className="w-4 h-4" />
              End Ride{isOvertime ? ` (+${overtimeCharge.toLocaleString()} KES)` : ''}</>}
      </button>
    </motion.div>
  );
}
