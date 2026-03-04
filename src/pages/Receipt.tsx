import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Home, Download, Star, MapPin, AlertTriangle, MessageCircle, Phone } from 'lucide-react';
import { api } from '../lib/api';
import { LoadingScreen, Spinner } from '../lib/components/ui';
import { notifications } from '../lib/notifications';
import { sendWhatsApp, smsTemplates } from '../lib/sms';
import { exportReceiptPDF } from '../lib/pdfExport';
import type { Booking } from '../types';
import { OVERTIME_RATE } from '../types';

export default function Receipt() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking]       = useState<Booking | null>(null);
  const [notFound, setNotFound]     = useState(false);
  const [rating, setRating]         = useState(0);
  const [hovered, setHovered]       = useState(0);
  const [feedback, setFeedback]     = useState('');
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const numId = Number(id);
    api.getBookingHistory().then(history => {
      const b = history.find(b => b.id === numId);
      if (b) {
        setBooking(b);
        if (b.rating != null) { setRating(b.rating); setFeedback(b.feedback ?? ''); setSubmitted(true); }
      } else {
        return api.getActiveBookings().then(active => {
          const ab = active.find(b => b.id === numId);
          if (ab) setBooking(ab);
          else setNotFound(true);
        });
      }
    }).catch(() => setNotFound(true));
  }, [id]);

  const handleFeedback = async () => {
    if (!rating || !booking || submitting) return;
    setSubmitting(true);
    try { await api.submitFeedback(booking.id, rating, feedback); setSubmitted(true); }
    catch {} finally { setSubmitting(false); }
  };

  const handlePDF = async () => {
    if (!booking || pdfLoading) return;
    setPdfLoading(true);
    try { await exportReceiptPDF(booking); }
    catch (e) { console.error('PDF error', e); }
    finally { setPdfLoading(false); }
  };

  const handleWhatsApp = () => {
    if (!booking) return;
    const total = booking.price + (booking.overtimeCharge ?? 0);
    sendWhatsApp(booking.customerPhone,
      smsTemplates.rideComplete(booking.customerName, total, booking.receiptId));
    notifications.add('ride_complete', 'Receipt sent via WhatsApp',
      `Sent receipt to ${booking.customerName} (${booking.customerPhone})`, `/receipt/${id}`);
  };

  if (!booking && !notFound) return <LoadingScreen text="Loading receipt…" />;
  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <p className="text-4xl">🔍</p>
      <p className="font-display text-xl font-bold" style={{ color: 'var(--t-text)' }}>Receipt not found</p>
      <Link to="/" className="btn-primary max-w-xs">Go Home</Link>
    </div>
  );

  const b = booking!;
  const totalPaid = b.price + (b.overtimeCharge || 0);

  const rows: { label: string; value: string }[] = [
    { label: 'Quad',     value: b.quadName },
    { label: 'Duration', value: `${b.duration} min` },
    { label: 'Date',     value: new Date(b.startTime).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { label: 'Time',     value: new Date(b.startTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) },
    { label: 'Customer', value: b.customerName },
    { label: 'Phone',    value: b.customerPhone },
    ...((b.groupSize ?? 1) > 1 ? [{ label: 'Group',   value: `${b.groupSize} riders` }] : []),
    ...(b.promoCode            ? [{ label: 'Promo',   value: `${b.promoCode} ✓` }]       : []),
    ...(b.waiverSigned         ? [{ label: 'Waiver',  value: 'Signed ✓' }]               : []),
    ...((b.depositAmount ?? 0) > 0
      ? [{ label: 'Deposit', value: `${(b.depositAmount ?? 0).toLocaleString()} KES ${b.depositReturned ? '(returned)' : '(held)'}` }]
      : []),
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 items-center">

      {/* ── Receipt card ── */}
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-lg"
        style={{ background: 'var(--t-bg)', border: '1px solid var(--t-border)' }}>

        {/* Header */}
        <div className="p-6 flex flex-col items-center"
          style={{ background: 'linear-gradient(135deg, var(--t-hero-from), var(--t-hero-to))' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 14, delay: 0.1 }}
            className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center mb-3 shadow-lg">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="font-display text-xl font-bold text-white">Payment Received</h1>
          <p className="font-mono text-[10px] tracking-[0.15em] mt-1 text-white/40">#{b.receiptId}</p>
        </div>

        {/* Tear line */}
        <div className="flex items-center" style={{ background: 'var(--t-bg)' }}>
          <div className="w-5 h-5 rounded-full -ml-2.5 shrink-0" style={{ background: 'var(--t-bg2)' }} />
          <div className="flex-1 border-t-2 border-dashed mx-1" style={{ borderColor: 'var(--t-border)' }} />
          <div className="w-5 h-5 rounded-full -mr-2.5 shrink-0" style={{ background: 'var(--t-bg2)' }} />
        </div>

        {/* Line items */}
        <div className="px-6 py-3">
          {rows.map(({ label, value }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex justify-between items-center py-2.5 border-b last:border-b-0"
              style={{ borderColor: 'var(--t-border)' }}>
              <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>{label}</span>
              <span className="text-sm font-medium text-right max-w-[55%]" style={{ color: 'var(--t-text)' }}>{value}</span>
            </motion.div>
          ))}
        </div>

        {/* Pricing */}
        <div className="px-6 pb-5 space-y-2">
          {(b.overtimeCharge || 0) > 0 && (
            <div className="p-3 rounded-xl flex justify-between items-center"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                <span className="font-mono text-[11px]" style={{ color: '#ef4444' }}>
                  Overtime {b.overtimeMinutes}min × {OVERTIME_RATE} KES
                </span>
              </div>
              <span className="font-mono font-bold text-sm" style={{ color: '#ef4444' }}>
                +{(b.overtimeCharge ?? 0).toLocaleString()} KES
              </span>
            </div>
          )}

          <div className="p-4 rounded-2xl flex justify-between items-center"
            style={{ background: 'var(--t-bg2)' }}>
            <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>Total Paid</span>
            <div className="text-right">
              <p className="font-display font-bold text-2xl" style={{ color: 'var(--t-accent)' }}>
                {totalPaid.toLocaleString()} <span className="text-sm font-sans">KES</span>
              </p>
              {b.promoCode && b.originalPrice > b.price && (
                <p className="font-mono text-[10px] line-through" style={{ color: 'var(--t-muted)' }}>
                  {b.originalPrice.toLocaleString()} KES
                </p>
              )}
            </div>
          </div>

          {(b.depositAmount ?? 0) > 0 && !b.depositReturned && (
            <div className="p-3 rounded-xl flex items-center gap-2"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#b45309' }} />
              <p className="text-xs" style={{ color: '#b45309' }}>
                Deposit of <strong>{(b.depositAmount ?? 0).toLocaleString()} KES</strong> held — returned when quad is back.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center border-t" style={{ borderColor: 'var(--t-border)', paddingTop: '1rem' }}>
          <p className="font-display text-xs italic" style={{ color: 'var(--t-muted)' }}>Thank you for riding with Royal Quads</p>
          <a href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1.5 font-mono text-[10px] transition-opacity hover:opacity-70"
            style={{ color: 'var(--t-accent)' }}>
            <MapPin className="w-2.5 h-2.5" /> Mambrui Sand Dunes
          </a>
        </div>
      </div>

      {/* ── Send receipt ── */}
      <div className="w-full max-w-sm rounded-2xl p-5 t-card">
        <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--t-text)' }}>Send Receipt to Customer</h2>
        <div className="flex gap-2">
          <button onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 hover:opacity-90"
            style={{ background: '#22c55e', color: 'white' }}>
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          <a href={`tel:${b.customerPhone}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 hover:opacity-90"
            style={{ borderColor: 'var(--t-border)', color: 'var(--t-text)', background: 'var(--t-card)' }}>
            <Phone className="w-4 h-4" /> Call
          </a>
        </div>
      </div>

      {/* ── Feedback ── */}
      <div className="w-full max-w-sm rounded-2xl p-5 t-card">
        <h2 className="font-display text-base font-bold text-center mb-4" style={{ color: 'var(--t-text)' }}>
          Rate Your Experience
        </h2>
        {submitted ? (
          <div className="text-center p-4 rounded-2xl" style={{ background: 'var(--t-bg2)' }}>
            <div className="flex justify-center gap-1.5 mb-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="w-6 h-6"
                  style={{ fill: s <= rating ? 'var(--t-accent)' : 'transparent',
                            color: s <= rating ? 'var(--t-accent)' : 'var(--t-border)' }} />
              ))}
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--t-muted)' }}>Thanks for your feedback!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-0.5 transition-transform hover:scale-110">
                  <Star className="w-8 h-8 transition-all"
                    style={{
                      fill:  s <= (hovered || rating) ? 'var(--t-accent)' : 'transparent',
                      color: s <= (hovered || rating) ? 'var(--t-accent)' : 'var(--t-border)',
                      transform: s <= (hovered || rating) ? 'scale(1.05)' : 'scale(1)',
                    }} />
                </button>
              ))}
            </div>
            <AnimatePresence>
              {rating > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-3 overflow-hidden">
                  <textarea placeholder="Tell us about your ride (optional)"
                    value={feedback} onChange={e => setFeedback(e.target.value)}
                    className="input resize-none h-20 text-sm" />
                  <button onClick={handleFeedback} disabled={submitting} className="btn-primary">
                    {submitting ? <><Spinner /> Submitting…</> : 'Submit Feedback'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={handlePDF} disabled={pdfLoading}
          className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 hover:opacity-80"
          style={{ borderColor: 'var(--t-border)', color: 'var(--t-text)', background: 'var(--t-card)' }}>
          {pdfLoading ? <Spinner /> : <Download className="w-4 h-4" />}
          {pdfLoading ? 'Generating…' : 'Save PDF'}
        </button>
        <Link to="/"
          className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95 hover:opacity-80"
          style={{ background: 'var(--t-btn-bg)', color: 'var(--t-btn-text)' }}>
          <Home className="w-4 h-4" /> Home
        </Link>
      </div>

    </motion.div>
  );
}
