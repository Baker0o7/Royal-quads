import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, AlertTriangle, CheckCircle2, Navigation, Shield, MessageCircle, Pause, Play, Plus, X } from 'lucide-react';
import { api } from '../lib/api';
import { LoadingScreen, Spinner } from '../lib/components/ui';
import { useToast } from '../lib/components/Toast';
import { notifications } from '../lib/notifications';
import { sendWhatsApp, smsTemplates } from '../lib/sms';
import { haptic } from '../lib/utils';
import type { Booking } from '../types';
import { OVERTIME_RATE } from '../types';

function pad(n: number) { return String(Math.abs(n)).padStart(2, '0'); }

const EXTEND_OPTIONS = [
  { mins: 5,  price: 1000, label: '+ 5 min'  },
  { mins: 10, price: 1800, label: '+ 10 min' },
  { mins: 15, price: 2200, label: '+ 15 min' },
  { mins: 30, price: 3500, label: '+ 30 min' },
];

function ExtendModal({ booking, onClose, onExtended }: {
  booking: Booking;
  onClose: () => void;
  onExtended: () => void;
}) {
  const toast = useToast();
  const [selected, setSelected] = useState<typeof EXTEND_OPTIONS[number] | null>(null);
  const [loading, setLoading]  = useState(false);

  const handleExtend = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.extendBooking(booking.id, selected.mins, selected.price);
      toast.success(`Ride extended by ${selected.mins} min`);
      onExtended();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to extend ride');
    } finally { setLoading(false); }
  };

  return (
    <motion.div className="fixed inset-0 z-[9998] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-3xl overflow-hidden"
        style={{ background: 'var(--t-bg)' }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--t-border)' }} />
        </div>
        <div className="px-5 pb-8 pt-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--t-accent) 15%, transparent)', color: 'var(--t-accent)' }}>
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--t-text)' }}>Extend Ride</h2>
              <p className="font-mono text-[11px]" style={{ color: 'var(--t-muted)' }}>Current: {booking.duration} min</p>
            </div>
            <button onClick={onClose} className="ml-auto p-2 rounded-xl" style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {EXTEND_OPTIONS.map(opt => {
              const sel = selected?.mins === opt.mins;
              return (
                <button key={opt.mins} onClick={() => setSelected(opt)}
                  className="py-4 rounded-2xl text-center border transition-all"
                  style={{
                    background:   sel ? 'color-mix(in srgb, var(--t-accent) 12%, var(--t-bg2))' : 'var(--t-bg2)',
                    borderColor:  sel ? 'var(--t-accent)' : 'var(--t-border)',
                    borderWidth:  sel ? 2 : 1,
                    boxShadow:    sel ? '0 0 0 1px var(--t-accent)' : 'none',
                  }}>
                  <p className="font-bold text-base" style={{ color: sel ? 'var(--t-accent)' : 'var(--t-text)' }}>
                    {opt.label}
                  </p>
                  <p className="font-mono text-[11px] mt-1" style={{ color: 'var(--t-muted)' }}>
                    {opt.price.toLocaleString()} KES
                  </p>
                </button>
              );
            })}
          </div>
          <button onClick={handleExtend} disabled={!selected || loading}
            className="w-full btn-primary py-3.5">
            {!selected ? 'Select a duration' : loading ? 'Extending…' : `Add ${selected.mins} min  ·  ${selected.price.toLocaleString()} KES`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ActiveRide() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const toast     = useToast();
  const [booking, setBooking]       = useState<Booking | null>(null);
  const [secondsLeft, setSeconds]   = useState(0);
  const [loading, setLoading]       = useState(true);
  const [completing, setCompleting] = useState(false);
  const [paused, setPaused]         = useState(false);
  const [pausedAt, setPausedAt]     = useState<number | null>(null);
  const [showExtend, setShowExtend] = useState(false);

  const firedOvertime = useRef(false);
  const firedWarning  = useRef(false);

  const calcSecs = useCallback((b: Booking) =>
    Math.floor((new Date(b.startTime).getTime() + b.duration * 60_000 - (pausedAt ?? Date.now())) / 1000), [pausedAt]);

  useEffect(() => {
    api.getActiveBookings().then(data => {
      const cur = data.find(b => b.id === Number(id));
      if (cur) {
        setBooking(cur);
        setSeconds(calcSecs(cur));
        const firedKey = `rq:notif_started_${cur.id}`;
        try {
          if (!localStorage.getItem(firedKey)) {
            localStorage.setItem(firedKey, '1');
            notifications.add('ride_started', 'Ride Started! 🏍️',
              `${cur.customerName} is riding ${cur.quadName} for ${cur.duration} min.`,
              `/ride/${cur.id}`);
          }
        } catch {}
      } else {
        navigate(`/receipt/${id}`, { replace: true });
      }
    }).catch(() => navigate(`/receipt/${id}`, { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate, calcSecs]);

  useEffect(() => {
    if (!booking || paused) return;
    const t = setInterval(() => {
      const secs = calcSecs(booking);
      setSeconds(secs);
      if (secs > 0 && secs <= 120 && !firedWarning.current) {
        firedWarning.current = true;
        notifications.add('info', '2 Minutes Remaining ⏱️',
          `${booking.customerName}'s ride on ${booking.quadName} ends in 2 minutes.`,
          `/ride/${booking.id}`);
      }
      if (secs < 0 && !firedOvertime.current) {
        firedOvertime.current = true;
        const mins = Math.ceil(-secs / 60);
        notifications.add('overtime', 'Overtime! ⏰',
          `${booking.customerName} is ${mins} min overtime on ${booking.quadName}. ${mins * OVERTIME_RATE} KES extra.`,
          `/ride/${booking.id}`);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [booking, paused, calcSecs]);

  const handlePause = () => {
    haptic('light');
    if (paused) {
      // Resume: adjust startTime to account for paused duration
      if (booking && pausedAt !== null) {
        const pausedDuration = Date.now() - pausedAt;
        const newStartTime = new Date(new Date(booking.startTime).getTime() + pausedDuration).toISOString();
        api.updateBookingStartTime(booking.id, newStartTime).catch(() => toast.error('Failed to resume ride'));
      }
      setPaused(false);
      setPausedAt(null);
    } else {
      setPaused(true);
      setPausedAt(Date.now());
    }
  };

  const handleComplete = async () => {
    if (completing || !booking) return;
    haptic('medium');
    setCompleting(true);
    try {
      const overtimeMins = secondsLeft < 0 ? Math.max(0, Math.ceil(Math.abs(secondsLeft) / 60)) : 0;
      await api.completeBooking(booking.id, overtimeMins);
      const total = booking.price + overtimeMins * OVERTIME_RATE;
      notifications.add('ride_complete', 'Ride Complete ✅',
        `${booking.customerName} finished riding ${booking.quadName}. Total: ${total.toLocaleString()} KES.`,
        `/receipt/${id}`);
      navigate(`/receipt/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete ride');
      setCompleting(false);
    }
  };

  const handleExtended = () => {
    api.getActiveBookings().then(data => {
      const cur = data.find(b => b.id === Number(id));
      if (cur) setBooking(cur);
    }).catch(() => {});
  };

  if (loading) return <LoadingScreen text="Loading ride…" />;
  if (!booking) return null;

  const isOvertime     = !paused && secondsLeft < 0;
  const overtimeMins   = Math.ceil(-Math.min(0, secondsLeft) / 60);
  const overtimeCharge = overtimeMins * OVERTIME_RATE;
  const totalSecs      = booking.duration * 60;
  const elapsed        = totalSecs - secondsLeft;
  const progress       = Math.min(1, elapsed / totalSecs);
  const C              = 2 * Math.PI * 54;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col gap-5 items-center min-h-[70vh] justify-center">

      <AnimatePresence>
        {showExtend && (
          <ExtendModal
            booking={booking}
            onClose={() => setShowExtend(false)}
            onExtended={handleExtended}
          />
        )}
      </AnimatePresence>

      {/* Timer card */}
      <div className="w-full max-w-sm rounded-3xl overflow-hidden relative text-white"
        style={{ background: paused
          ? 'linear-gradient(135deg,#374151,#1f2937)'
          : isOvertime
            ? 'linear-gradient(135deg,#7f1d1d,#450a0a)'
            : 'linear-gradient(135deg, var(--t-hero-from), var(--t-hero-to))' }}>
        {!isOvertime && !paused && (
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-10"
            style={{ background: 'var(--t-accent2)' }} />
        )}
        <div className="relative z-10 p-8 flex flex-col items-center">
          <p className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase mb-2">
            {booking.quadName}
          </p>

          {booking.waiverSigned && (
            <div className="flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full"
              style={{ background: 'rgba(34,197,94,0.2)' }}>
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-[10px] font-mono text-green-400">Waiver Signed</span>
            </div>
          )}

          {paused && (
            <div className="flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full"
              style={{ background: 'rgba(245,158,11,0.2)' }}>
              <Pause className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] font-mono text-yellow-400">Ride Paused</span>
            </div>
          )}

          {/* Ring timer */}
          <div className="relative w-36 h-36 mb-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              {!paused && (
                <circle cx="60" cy="60" r="54" fill="none"
                  stroke={isOvertime ? '#f87171' : 'var(--t-accent)'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (isOvertime ? 0 : 1 - progress)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }} />
              )}
              {paused && (
                <circle cx="60" cy="60" r="54" fill="none"
                  stroke="#f59e0b" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${C * 0.5} ${C}`} />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono font-bold text-3xl tabular-nums"
                style={{ color: paused ? '#fcd34d' : isOvertime ? '#fca5a5' : 'white' }}>
                {paused ? '||' : `${isOvertime ? '+' : ''}${pad(Math.floor(Math.abs(secondsLeft) / 60))}:${pad(Math.abs(secondsLeft) % 60)}`}
              </span>
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-1">
                {paused ? 'Paused' : isOvertime ? 'Overtime' : 'Remaining'}
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

      {/* Pause/Resume button */}
      <button onClick={handlePause}
        className="w-full max-w-sm py-3 rounded-2xl text-sm font-semibold border transition-all active:scale-95"
        style={{
          background:   paused ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
          borderColor:  paused ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)',
          color:        paused ? '#16a34a' : '#b45309',
        }}>
        {paused ? <><Play className="w-4 h-4 inline-block mr-2" /> Resume Ride</> : <><Pause className="w-4 h-4 inline-block mr-2" /> Pause Ride</>}
      </button>

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

      {/* Action buttons row */}
      <div className="w-full max-w-sm flex gap-2">
        <button onClick={() => setShowExtend(true)}
          className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border transition-all active:scale-95"
          style={{ borderColor: 'var(--t-border)', background: 'var(--t-bg2)', color: 'var(--t-accent)' }}>
          <Plus className="w-4 h-4 inline-block mr-1" /> Extend
        </button>
        <button onClick={handleComplete} disabled={completing}
          className="flex-[2] btn-primary">
          {completing
            ? <><Spinner /> Ending…</>
            : <><CheckCircle2 className="w-4 h-4" />
                End Ride{isOvertime ? ` (+${overtimeCharge.toLocaleString()})` : ''}</>}
        </button>
      </div>
    </motion.div>
  );
}
