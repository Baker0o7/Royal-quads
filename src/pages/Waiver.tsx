import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Pen, CheckCircle2, AlertTriangle, AlertOctagon, HeartPulse, Eye, Scale, Ban, CreditCard, Users, UserX } from 'lucide-react';
import { api } from '../lib/api';
import { LoadingScreen, Spinner } from '../lib/components/ui';
import { useToast } from '../lib/components/Toast';
import type { Booking } from '../types';
import { BUSINESS_NAME } from '../lib/constants';

const WAIVER_CLAUSES = [
  { icon: <Users className="w-3.5 h-3.5" />, text: 'I voluntarily participate in quad biking activities at Royal Quad Bikes, Mambrui Sand Dunes, Kilifi County, Kenya.' },
  { icon: <AlertOctagon className="w-3.5 h-3.5" />, text: 'I acknowledge that quad biking involves inherent risks including falls, rollovers, collisions, and serious physical injury.' },
  { icon: <HeartPulse className="w-3.5 h-3.5" />, text: 'I confirm that I am in good physical health and have no medical conditions (heart conditions, epilepsy, back injuries, pregnancy) that would prevent safe participation.' },
  { icon: <Shield className="w-3.5 h-3.5" />, text: 'I agree to wear all provided safety equipment — including helmet and protective gear — throughout the entire ride without exception.' },
  { icon: <Eye className="w-3.5 h-3.5" />, text: 'I will follow all instructions given by Royal Quad Bikes staff and operate the vehicle responsibly within designated riding areas.' },
  { icon: <Ban className="w-3.5 h-3.5" />, text: 'I will not operate the vehicle under the influence of alcohol, drugs, or any impairing substances.' },
  { icon: <CreditCard className="w-3.5 h-3.5" />, text: 'I accept full financial responsibility for any damage caused to the vehicle through negligent, reckless, or deliberate operation.' },
  { icon: <Scale className="w-3.5 h-3.5" />, text: 'I release Royal Quad Bikes, its owners, employees, and agents from any liability for personal injury or property damage arising from my participation.' },
  { icon: <UserX className="w-3.5 h-3.5" />, text: 'Parents or legal guardians must sign this waiver on behalf of all participants under 18 years of age.' },
];

export default function Waiver() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const toast   = useToast();
  const [booking, setBooking]     = useState<Booking | null>(null);
  const [agreed, setAgreed]       = useState(false);
  const [signed, setSigned]       = useState(false);
  const [signing, setSigning]     = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const waiverRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    api.getActiveBookings().then(data => {
      const b = data.find(b => b.id === Number(bookingId));
      if (b) {
        if (b.waiverSigned) { navigate(`/ride/${bookingId}`, { replace: true }); return; }
        setBooking(b);
      } else {
        navigate(`/ride/${bookingId}`, { replace: true });
      }
    }).catch(() => navigate(`/ride/${bookingId}`, { replace: true }));
  }, [bookingId, navigate]);

  const getXY = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const src = 'touches' in e ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { x, y } = getXY(e, canvas);
    ctx.beginPath(); ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.strokeStyle = '#1a1612';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    const { x, y } = getXY(e, canvas);
    ctx.lineTo(x, y); ctx.stroke();
    setHasStroke(true);
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  };

  const handleSign = async () => {
    if (!agreed || !hasStroke || !booking || signing || !scrolledToBottom) return;
    setSigning(true);
    try {
      await api.signWaiver(booking.id);
      setSigned(true);
      setTimeout(() => navigate(`/ride/${bookingId}`), 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sign waiver');
      setSigning(false);
    }
  };

  if (!booking) return <LoadingScreen text="Loading waiver…" />;

  if (signed) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(34,197,94,0.15)' }}>
        <CheckCircle2 className="w-8 h-8" style={{ color: '#16a34a' }} />
      </motion.div>
      <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--t-text)' }}>Waiver Signed</h2>
      <p className="text-sm" style={{ color: 'var(--t-muted)' }}>Starting your ride now…</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center shrink-0 shadow-sm">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--t-text)' }}>Safety Waiver</h1>
          <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>
            {booking.customerName} · {booking.quadName}
          </p>
        </div>
      </div>

      {/* Risk banner */}
      <div className="p-4 rounded-2xl flex flex-col gap-2.5"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
        <div className="flex items-start gap-2.5">
          <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>
            Important — Please Read Before Signing
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Inherent Risks', 'Physical Injury', 'Death', 'Financial Liability', 'Alcohol/Drugs'].map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Waiver clauses */}
      <div
        ref={waiverRef}
        onScroll={() => {
          const el = waiverRef.current;
          if (!el) return;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
          if (atBottom) setScrolledToBottom(true);
        }}
        className="p-5 rounded-2xl t-card text-xs leading-relaxed space-y-3 max-h-80 overflow-y-auto"
        style={{ color: 'var(--t-muted)' }}>
        <p className="font-display font-bold text-sm mb-1" style={{ color: 'var(--t-text)' }}>
          INDEMNITY &amp; WAIVER AGREEMENT
        </p>
        <p>
          I, <strong style={{ color: 'var(--t-text)' }}>{booking.customerName}</strong>, voluntarily
          participate in quad biking activities at{' '}
          <strong style={{ color: 'var(--t-text)' }}>{BUSINESS_NAME}</strong>, Mambrui Sand Dunes, Kilifi County, Kenya.
        </p>
        {WAIVER_CLAUSES.map((clause, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="shrink-0 mt-0.5" style={{ color: 'var(--t-accent)' }}>{clause.icon}</div>
            <p>{clause.text}</p>
          </div>
        ))}
        {!scrolledToBottom && (
          <div className="sticky bottom-0 pt-2 text-center"
            style={{ background: 'linear-gradient(transparent, var(--t-card))' }}>
            <p className="text-[10px] font-semibold" style={{ color: 'var(--t-accent)' }}>
              ↓ Scroll to read all clauses ↓
            </p>
          </div>
        )}
      </div>

      {/* Signature pad */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Pen className="w-4 h-4" style={{ color: 'var(--t-accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>Sign Below</span>
          </div>
          <AnimatePresence>
            {hasStroke && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={clearCanvas}
                className="text-xs font-mono transition-opacity hover:opacity-70"
                style={{ color: '#ef4444' }}>
                Clear
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="rounded-xl overflow-hidden"
          style={{ border: `2px dashed ${hasStroke ? 'var(--t-accent)' : 'var(--t-border)'}`, background: '#ffffff', transition: 'border-color 0.2s' }}>
          <canvas ref={canvasRef} width={400} height={150}
            className="w-full touch-none cursor-crosshair block"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          />
        </div>
        {!hasStroke && (
          <p className="text-[10px] font-mono text-center mt-1.5" style={{ color: 'var(--t-muted)' }}>
            Draw your signature in the box above
          </p>
        )}
      </div>

      {/* Agree checkbox */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <button type="button" onClick={() => setAgreed(!agreed)}
          className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150"
          style={{
            background: agreed ? 'var(--t-accent)' : 'transparent',
            borderColor: agreed ? 'var(--t-accent)' : 'var(--t-border)',
          }}>
          {agreed && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
              <CheckCircle2 className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </button>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--t-muted)' }}>
          I have read and agree to all {WAIVER_CLAUSES.length} clauses of this indemnity waiver.
        </p>
      </label>

      {/* Sign button */}
      <button onClick={handleSign}
        disabled={!agreed || !hasStroke || !scrolledToBottom || signing}
        className="btn-primary">
        {signing ? <><Spinner /> Signing…</> : <><Shield className="w-4 h-4" /> Sign &amp; Start Ride</>}
      </button>

      {/* Skip */}
      <button onClick={() => navigate(`/ride/${bookingId}`)}
        className="text-xs text-center font-mono pb-2 transition-opacity hover:opacity-70"
        style={{ color: 'var(--t-muted)' }}>
        Skip for now
      </button>

    </motion.div>
  );
}
