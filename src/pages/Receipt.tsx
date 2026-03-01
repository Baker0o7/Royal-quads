import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Home, Printer, Star, MapPin, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { LoadingScreen } from '../lib/components/ui';
import type { Booking } from '../types';
import { OVERTIME_RATE } from '../types';

export default function Receipt() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getBookingHistory().then(data => {
      const b = data.find(b => b.id === Number(id));
      if (b) { setBooking(b); if (b.rating) { setRating(b.rating); setFeedbackText(b.feedback ?? ''); setSubmitted(true); } }
    });
  }, [id]);

  const handleFeedback = async () => {
    if (!rating || !booking) return; setSubmitting(true);
    try { await api.submitFeedback(booking.id, rating, feedbackText); setSubmitted(true); }
    catch { } finally { setSubmitting(false); }
  };

  if (!booking) return <LoadingScreen text="Loading receipt..." />;

  const totalPaid = booking.price + (booking.overtimeCharge || 0);

  const rows = [
    { label: 'Quad',     value: booking.quadName },
    { label: 'Duration', value: `${booking.duration} min` },
    { label: 'Date',     value: new Date(booking.startTime).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { label: 'Time',     value: new Date(booking.startTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) },
    { label: 'Customer', value: booking.customerName },
    { label: 'M-Pesa',  value: booking.customerPhone },
    ...(booking.groupSize! > 1 ? [{ label: 'Group', value: `${booking.groupSize} riders` }] : []),
    ...(booking.promoCode ? [{ label: 'Promo', value: `${booking.promoCode} ✓` }] : []),
    ...(booking.waiverSigned ? [{ label: 'Waiver', value: 'Signed ✓' }] : []),
    ...(booking.depositAmount! > 0 ? [{ label: 'Deposit', value: `${booking.depositAmount!.toLocaleString()} KES ${booking.depositReturned ? '(returned)' : '(held)'}` }] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-5 items-center">

      <div className="w-full max-w-sm bg-white dark:bg-[#1a1612] rounded-3xl overflow-hidden shadow-[0_4px_32px_rgba(26,22,18,0.12)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)] border border-[#c9b99a]/20 dark:border-[#c9b99a]/8">
        <div className="bg-gradient-to-br from-[#2d2318] to-[#1a1612] p-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c9972a] to-[#8a6010] flex items-center justify-center mb-3 shadow-lg"><CheckCircle2 className="w-7 h-7 text-white" /></div>
          <h1 className="font-display text-xl font-bold text-white">Payment Received</h1>
          <p className="font-mono text-[10px] tracking-[0.15em] text-[#c9b99a]/60 mt-1">#{booking.receiptId}</p>
        </div>
        <div className="flex items-center"><div className="w-5 h-5 rounded-full bg-[#f5f0e8] dark:bg-[#0d0b09] -ml-2.5 shrink-0" /><div className="flex-1 border-t-2 border-dashed border-[#c9b99a]/20 dark:border-[#c9b99a]/10 mx-1" /><div className="w-5 h-5 rounded-full bg-[#f5f0e8] dark:bg-[#0d0b09] -mr-2.5 shrink-0" /></div>
        <div className="px-6 py-4 flex flex-col gap-0">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2.5 border-b border-[#c9b99a]/10 dark:border-[#c9b99a]/5 last:border-0">
              <span className="font-mono text-[11px] text-[#7a6e60] dark:text-[#a09070] uppercase tracking-wider">{label}</span>
              <span className="text-sm font-medium text-[#1a1612] dark:text-[#f5f0e8] text-right max-w-[55%]">{value}</span>
            </div>
          ))}
        </div>
        {/* Price breakdown */}
        <div className="mx-6 mb-5 space-y-2">
          {booking.overtimeCharge! > 0 && (
            <div className="bg-red-50/70 dark:bg-red-900/10 p-3 rounded-xl border border-red-200/40 dark:border-red-800/30 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span className="font-mono text-[11px] text-red-600 dark:text-red-400">Overtime ({booking.overtimeMinutes}min × {OVERTIME_RATE} KES)</span>
              </div>
              <span className="font-mono font-bold text-sm text-red-600 dark:text-red-400">+{booking.overtimeCharge!.toLocaleString()} KES</span>
            </div>
          )}
          <div className="bg-[#f5f0e8] dark:bg-[#2d2318]/60 rounded-2xl p-4 flex justify-between items-center">
            <span className="font-mono text-xs text-[#7a6e60] dark:text-[#a09070] uppercase tracking-wider">Total Paid</span>
            <div className="text-right">
              <p className="font-display font-bold text-2xl text-[#c9972a]">{totalPaid.toLocaleString()} <span className="text-sm font-sans font-semibold">KES</span></p>
              {booking.promoCode && booking.originalPrice > booking.price && <p className="font-mono text-[10px] text-[#7a6e60] line-through">{booking.originalPrice.toLocaleString()} KES</p>}
            </div>
          </div>
        </div>
        {booking.depositAmount! > 0 && !booking.depositReturned && (
          <div className="mx-6 mb-5 bg-amber-50/70 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200/40 dark:border-amber-800/30 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">Deposit of <strong>{booking.depositAmount!.toLocaleString()} KES</strong> held pending quad return.</p>
          </div>
        )}
        <div className="px-6 pb-6 text-center">
          <p className="font-display text-xs italic text-[#7a6e60] dark:text-[#a09070]">Thank you for riding with Royal Quads</p>
          <a href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 font-mono text-[10px] text-[#c9972a] hover:text-[#e8b84b] transition-colors"><MapPin className="w-2.5 h-2.5" />Mambrui Sand Dunes</a>
        </div>
      </div>

      {/* Feedback */}
      <div className="w-full max-w-sm bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
        <h2 className="font-display text-base font-bold text-center mb-4 text-[#1a1612] dark:text-[#f5f0e8]">Rate Your Experience</h2>
        {submitted ? (
          <div className="text-center p-4 rounded-2xl bg-[#f5f0e8] dark:bg-[#2d2318]/50">
            <div className="flex justify-center gap-1.5 mb-2">{[1,2,3,4,5].map(s => <Star key={s} className={cn('w-6 h-6', s <= rating ? 'fill-[#c9972a] text-[#c9972a]' : 'text-[#c9b99a]/30')} />)}</div>
            <p className="text-sm font-medium text-[#7a6e60] dark:text-[#a09070]">Thank you for your feedback!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} className="p-0.5 transition-transform hover:scale-110">
                  <Star className={cn('w-8 h-8 transition-all', s <= (hover || rating) ? 'fill-[#c9972a] text-[#c9972a] scale-105' : 'text-[#c9b99a]/30')} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-3 overflow-hidden">
                <textarea placeholder="Tell us about your ride (optional)" value={feedbackText} onChange={e => setFeedbackText(e.target.value)} className="input resize-none h-20 text-sm" />
                <button onClick={handleFeedback} disabled={submitting} className="btn-primary">{submitting ? 'Submitting...' : 'Submit Feedback'}</button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl border border-[#c9b99a]/30 dark:border-[#c9b99a]/10 bg-white/60 dark:bg-[#1a1612]/60 text-sm font-semibold text-[#1a1612] dark:text-[#f5f0e8] hover:border-[#c9972a]/50 transition-colors">
          <Printer className="w-4 h-4" /> Print
        </button>
        <Link to="/" className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#1a1612] dark:bg-[#f5f0e8]/10 text-white dark:text-[#f5f0e8] text-sm font-semibold hover:bg-[#2d2318] dark:hover:bg-[#f5f0e8]/15 transition-colors">
          <Home className="w-4 h-4" /> Home
        </Link>
      </div>
    </motion.div>
  );
}
