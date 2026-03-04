import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Pen, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { LoadingScreen, Spinner } from '../lib/components/ui';
import type { Booking } from '../types';

export default function Waiver() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking]     = useState<Booking | null>(null);
  const [agreed, setAgreed]       = useState(false);
  const [signed, setSigned]       = useState(false);
  const [signing, setSigning]     = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    api.getActiveBookings().then(data => {
      const b = data.find(b => b.id === Number(bookingId));
      if (b) {
        // Already signed → skip straight to ride
        if (b.waiverSigned) { navigate(`/ride/${bookingId}`, { replace: true }); return; }
        setBooking(b);
      } else {
        navigate(`/ride/${bookingId}`, { replace: true });
      }
    });
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
    const { x, y } = getXY(e, canvas);
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath(); ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
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
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  };

  const handleSign = async () => {
    if (!agreed || !hasStroke || !booking || signing) return;
    setSigning(true);
    try {
      await api.signWaiver(booking.id);
      setSigned(true);
      setTimeout(() => navigate(`/ride/${bookingId}`), 1000);
    } catch { setSigning(false); }
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

      {/* Warning banner */}
      <div className="p-4 rounded-2xl flex items-start gap-3"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#b45309' }} />
        <p className="text-xs font-medium" style={{ color: '#b45309' }}>
          Please read and sign this indemnity form before starting your ride.
        </p>
      </div>

      {/* Waiver text */}
      <div className="p-5 rounded-2xl t-card max-h-60 overflow-y-auto text-xs leading-relaxed space-y-3"
        style={{ color: 'var(--t-muted)' }}>
        <p className="font-display font-bold text-sm" style={{ color: 'var(--t-text)' }}>
          INDEMNITY & WAIVER AGREEMENT
        </p>
        <p>
          I, <strong style={{ color: 'var(--t-text)' }}>{booking.customerName}</strong>, acknowledge
          that quad biking carries inherent risks including physical injury or death. I voluntarily
          choose to participate in activities provided by{' '}
          <strong style={{ color: 'var(--t-text)' }}>Royal Quads Mambrui</strong>.
        </p>
        <p><strong style={{ color: 'var(--t-text)' }}>I acknowledge that:</strong></p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Quad biking involves significant physical risk.</li>
          <li>I am physically fit and capable of operating the quad safely.</li>
          <li>I will follow all safety instructions provided by Royal Quads staff.</li>
          <li>I will not operate the quad under the influence of alcohol or drugs.</li>
          <li>I will remain within the designated riding area at all times.</li>
          <li>I will wear all safety equipment provided.</li>
          <li>I accept full responsibility for damage caused through my negligence.</li>
        </ul>
        <p>
          I hereby <strong style={{ color: 'var(--t-text)' }}>release, indemnify, and hold harmless</strong>{' '}
          Royal Quads Mambrui, its owners, employees and agents from any claims, damages, or
          liability arising from my participation.
        </p>
        <p className="font-mono text-[10px]">
          By signing below I confirm I have read and agree to all terms of this waiver.
        </p>
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
          I have read and agree to the terms of this indemnity waiver. All information provided is accurate.
        </p>
      </label>

      {/* Sign button */}
      <button onClick={handleSign}
        disabled={!agreed || !hasStroke || signing}
        className="btn-primary">
        {signing ? <><Spinner /> Signing…</> : <><Shield className="w-4 h-4" /> Sign & Start Ride</>}
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
