import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Pen, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { LoadingScreen } from '../lib/components/ui';
import type { Booking } from '../types';

export default function Waiver() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    api.getActiveBookings().then(data => {
      const b = data.find(b => b.id === Number(bookingId));
      if (b) setBooking(b);
      else navigate(`/ride/${bookingId}`);
    });
  }, [bookingId, navigate]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const src = 'touches' in e ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * (canvas.width / rect.width), y: (src.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const { x, y } = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(x, y);
    setDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y); ctx.stroke();
    setHasSignature(true);
  };

  const stopDraw = () => setDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!agreed || !hasSignature || !booking) return;
    setSigning(true);
    // Save waiver signature to booking
    const bookings = JSON.parse(localStorage.getItem('rq:bookings') || '[]');
    const updated = bookings.map((b: Booking) => b.id === booking.id ? { ...b, waiverSigned: true, waiverSignedAt: new Date().toISOString() } : b);
    localStorage.setItem('rq:bookings', JSON.stringify(updated));
    setSigned(true);
    setTimeout(() => navigate(`/ride/${bookingId}`), 1500);
  };

  if (!booking) return <LoadingScreen text="Loading waiver..." />;

  if (signed) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="font-display text-2xl font-bold text-[#1a1612] dark:text-[#f5f0e8]">Waiver Signed</h2>
      <p className="text-sm text-[#7a6e60] dark:text-[#a09070]">Starting your ride now…</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9972a] to-[#8a6010] flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-[#1a1612] dark:text-[#f5f0e8]">Safety Waiver</h1>
          <p className="text-xs font-mono text-[#7a6e60] dark:text-[#a09070]">{booking.customerName} · {booking.quadName}</p>
        </div>
      </div>

      <div className="bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-700/30 p-4 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">Please read and sign this indemnity form before starting your ride.</p>
      </div>

      <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 max-h-64 overflow-y-auto text-xs text-[#7a6e60] dark:text-[#a09070] leading-relaxed space-y-3 backdrop-blur-sm">
        <p className="font-display font-bold text-sm text-[#1a1612] dark:text-[#f5f0e8]">INDEMNITY & WAIVER AGREEMENT</p>
        <p>I, <strong className="text-[#1a1612] dark:text-[#f5f0e8]">{booking.customerName}</strong>, hereby acknowledge that quad biking is an activity that carries inherent risks of physical injury or death. I voluntarily choose to participate in quad biking activities provided by <strong className="text-[#1a1612] dark:text-[#f5f0e8]">Royal Quads Mambrui</strong>.</p>
        <p><strong className="text-[#1a1612] dark:text-[#f5f0e8]">I acknowledge that:</strong></p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Quad biking involves significant physical risk including injury or death.</li>
          <li>I am physically fit and capable of operating the quad safely.</li>
          <li>I will follow all safety instructions provided by Royal Quads staff.</li>
          <li>I will not operate the quad under the influence of alcohol or drugs.</li>
          <li>I will remain within the designated riding area at all times.</li>
          <li>I will wear the safety equipment provided.</li>
          <li>I accept full responsibility for any damage caused to the quad through my negligence.</li>
        </ul>
        <p><strong className="text-[#1a1612] dark:text-[#f5f0e8]">I hereby release, indemnify, and hold harmless</strong> Royal Quads Mambrui, its owners, employees and agents from any claims, damages, or liability arising from my participation in this activity.</p>
        <p>This waiver is binding on my heirs, executors, and legal representatives.</p>
        <p className="font-mono text-[10px]">By signing below I confirm I have read and understood this waiver and agree to all its terms.</p>
      </div>

      {/* Signature */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Pen className="w-4 h-4 text-[#c9972a]" />
            <span className="text-sm font-semibold text-[#1a1612] dark:text-[#f5f0e8]">Sign Below</span>
          </div>
          {hasSignature && (
            <button type="button" onClick={clearSignature} className="text-xs font-mono text-red-500 hover:text-red-600 transition-colors">Clear</button>
          )}
        </div>
        <div className="rounded-xl border-2 border-dashed border-[#c9b99a]/30 dark:border-[#c9b99a]/15 bg-white dark:bg-[#1a1612]/50 overflow-hidden">
          <canvas ref={canvasRef} width={400} height={150} className="w-full touch-none cursor-crosshair"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
          />
        </div>
        {!hasSignature && <p className="text-[10px] font-mono text-[#7a6e60] dark:text-[#a09070] text-center mt-1">Draw your signature above</p>}
      </div>

      {/* Agreement checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <div onClick={() => setAgreed(!agreed)} className={cn('mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
          agreed ? 'bg-[#c9972a] border-[#c9972a]' : 'border-[#c9b99a]/40 dark:border-[#c9b99a]/20')}>
          {agreed && <CheckCircle2 className="w-3 h-3 text-white" />}
        </div>
        <p className="text-xs text-[#7a6e60] dark:text-[#a09070] leading-relaxed">I have read, understood, and agree to the terms of this indemnity waiver. I confirm all information provided is accurate.</p>
      </label>

      <button onClick={handleSign} disabled={!agreed || !hasSignature || signing}
        className="btn-primary">
        {signing ? 'Processing...' : 'Sign & Start Ride'}
      </button>

      <button onClick={() => navigate(`/ride/${bookingId}`)} className="text-xs text-center text-[#7a6e60] dark:text-[#a09070] hover:text-[#c9972a] transition-colors font-mono">
        Skip for now
      </button>
    </motion.div>
  );
}

