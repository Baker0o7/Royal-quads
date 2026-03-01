import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Home, Printer, Bike, Calendar, Clock, CreditCard, Tag, MapPin, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { LoadingScreen, SectionCard } from '../lib/components/ui';
import type { Booking } from '../types';

export default function Receipt() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getBookingHistory().then(data => {
      const b = data.find(b => b.id === Number(id));
      if (b) {
        setBooking(b);
        if (b.rating) { setRating(b.rating); setFeedbackText(b.feedback ?? ''); setFeedbackSubmitted(true); }
      }
    });
  }, [id]);

  const handleFeedback = async () => {
    if (!rating || !booking) return;
    setSubmitting(true);
    try { await api.submitFeedback(booking.id, rating, feedbackText); setFeedbackSubmitted(true); }
    catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  if (!booking) return <LoadingScreen text="Loading receipt..." />;

  const rows = [
    { icon: <Bike className="w-4 h-4" />,      label: 'Quad',     value: booking.quadName },
    { icon: <Clock className="w-4 h-4" />,     label: 'Duration', value: `${booking.duration} min` },
    { icon: <Calendar className="w-4 h-4" />,  label: 'Date',
      value: <div className="text-right"><div className="font-bold">{new Date(booking.startTime).toLocaleDateString()}</div><div className="text-xs text-stone-400">{new Date(booking.startTime).toLocaleTimeString()}</div></div> },
    { icon: <CreditCard className="w-4 h-4" />, label: 'M-Pesa', value: booking.customerPhone },
    ...(booking.promoCode ? [{ icon: <Tag className="w-4 h-4 text-emerald-600" />, label: <span className="text-emerald-700 dark:text-emerald-400">Promo ({booking.promoCode})</span>, value: <span className="font-bold text-emerald-600 dark:text-emerald-400">Applied ✓</span> }] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5 items-center">
      <SectionCard className="w-full max-w-sm px-7 py-8">
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Payment Received</h1>
          <p className="text-stone-400 text-xs mt-1 font-mono tracking-wider">#{booking.receiptId}</p>
        </div>
        <div className="flex flex-col gap-0 mb-7">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-stone-100 dark:border-stone-800 last:border-0">
              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-sm">{row.icon} {row.label}</div>
              <div className="font-bold text-sm">{row.value}</div>
            </div>
          ))}
        </div>
        <div className="bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl flex justify-between items-center">
          <span className="text-stone-500 dark:text-stone-400 font-medium">Total Paid</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{booking.price.toLocaleString()} KES</span>
        </div>
        {booking.promoCode && booking.originalPrice > booking.price && (
          <p className="text-right text-xs text-stone-400 line-through mt-1.5">{booking.originalPrice.toLocaleString()} KES</p>
        )}
        <div className="mt-7 text-center text-xs text-stone-400 space-y-1">
          <p>Thank you for riding with Royal Quads! 🏍️</p>
          <a href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6" target="_blank" rel="noopener noreferrer"
            className="hover:text-emerald-600 transition-colors inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Mambrui Sand Dunes
          </a>
        </div>
      </SectionCard>

      <SectionCard className="w-full max-w-sm">
        <h2 className="font-bold text-base mb-4 text-center">How was your ride? ⭐</h2>
        {feedbackSubmitted ? (
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <div className="flex justify-center gap-1 mb-2">
              {[1,2,3,4,5].map(s => <Star key={s} className={cn('w-6 h-6', s <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200 dark:text-stone-700')} />)}
            </div>
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm">Thanks for the feedback!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none">
                  <Star className={cn('w-8 h-8 transition-colors', s <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-200 dark:text-stone-700')} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-3 overflow-hidden">
                <textarea placeholder="Tell us about your experience (optional)" value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-emerald-600 dark:focus:border-emerald-500 focus:outline-none text-sm resize-none h-24 transition-colors" />
                <button onClick={handleFeedback} disabled={submitting}
                  className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 p-3 rounded-xl font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50 text-sm">
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </motion.div>
            )}
          </div>
        )}
      </SectionCard>

      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={() => window.print()}
          className="flex-1 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-colors text-sm">
          <Printer className="w-4 h-4" /> Print
        </button>
        <Link to="/"
          className="flex-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors text-sm">
          <Home className="w-4 h-4" /> Home
        </Link>
      </div>
    </motion.div>
  );
}
