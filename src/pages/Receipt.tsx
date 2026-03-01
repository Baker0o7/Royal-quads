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
      const current = data.find(b => b.id === Number(id));
      if (current) {
        setBooking(current);
        if (current.rating) {
          setRating(current.rating);
          setFeedbackText(current.feedback ?? '');
          setFeedbackSubmitted(true);
        }
      }
    }).catch(console.error);
  }, [id]);

  const handleFeedbackSubmit = async () => {
    if (rating === 0 || !booking) return;
    setSubmitting(true);
    try {
      await api.submitFeedback(booking.id, rating, feedbackText);
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return <LoadingScreen text="Loading receipt..." />;

  const rows = [
    { icon: <Bike className="w-4 h-4" />,      label: 'Quad',     value: booking.quadName },
    { icon: <Clock className="w-4 h-4" />,     label: 'Duration', value: `${booking.duration} min` },
    { icon: <Calendar className="w-4 h-4" />,  label: 'Date',
      value: (
        <div className="text-right">
          <div className="font-bold">{new Date(booking.startTime).toLocaleDateString()}</div>
          <div className="text-xs text-stone-400">{new Date(booking.startTime).toLocaleTimeString()}</div>
        </div>
      )
    },
    { icon: <CreditCard className="w-4 h-4" />, label: 'M-Pesa',  value: booking.customerPhone },
    ...(booking.promoCode ? [{
      icon: <Tag className="w-4 h-4 text-emerald-600" />,
      label: <span className="text-emerald-700">Promo ({booking.promoCode})</span>,
      value: <span className="font-bold text-emerald-600">Applied ✓</span>,
    }] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 items-center">

      {/* Receipt Card */}
      <SectionCard className="w-full max-w-sm px-7 py-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Payment Received</h1>
          <p className="text-stone-400 text-xs mt-1 font-mono tracking-wider">#{booking.receiptId}</p>
        </div>

        {/* Line Items */}
        <div className="flex flex-col gap-0 mb-7">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-stone-100 last:border-0">
              <div className="flex items-center gap-2 text-stone-500 text-sm">{row.icon} {row.label}</div>
              <div className="font-bold text-sm text-stone-900">{row.value}</div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="bg-stone-50 p-4 rounded-2xl flex justify-between items-center">
          <span className="text-stone-500 font-medium">Total Paid</span>
          <span className="text-2xl font-bold text-emerald-600">{booking.price.toLocaleString()} KES</span>
        </div>
        {booking.promoCode && booking.originalPrice > booking.price && (
          <p className="text-right text-xs text-stone-400 line-through mt-1.5">
            {booking.originalPrice.toLocaleString()} KES
          </p>
        )}

        {/* Footer */}
        <div className="mt-7 text-center text-xs text-stone-400 space-y-1">
          <p>Thank you for riding with Royal Quads! 🏍️</p>
          <a href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6" target="_blank" rel="noopener noreferrer"
            className="hover:text-emerald-600 transition-colors inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Mambrui Sand Dunes
          </a>
        </div>
      </SectionCard>

      {/* Feedback */}
      <SectionCard className="w-full max-w-sm">
        <h2 className="font-bold text-base text-stone-900 mb-4 text-center">How was your ride? ⭐</h2>
        {feedbackSubmitted ? (
          <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex justify-center gap-1 mb-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={cn('w-6 h-6', s <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200')} />
              ))}
            </div>
            <p className="text-emerald-700 font-semibold text-sm">Thanks for the feedback!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none">
                  <Star className={cn('w-8 h-8 transition-colors',
                    s <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-200')} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col gap-3 overflow-hidden">
                <textarea placeholder="Tell us about your experience (optional)"
                  value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none text-sm resize-none h-24 transition-colors" />
                <button onClick={handleFeedbackSubmit} disabled={submitting}
                  className="w-full bg-stone-900 text-white p-3 rounded-xl font-bold hover:bg-stone-800 transition-colors disabled:opacity-50 text-sm">
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </motion.div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={() => window.print()}
          className="flex-1 bg-white text-stone-900 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 border-stone-200 hover:border-stone-300 transition-colors text-sm">
          <Printer className="w-4 h-4" /> Print
        </button>
        <Link to="/"
          className="flex-1 bg-stone-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors text-sm">
          <Home className="w-4 h-4" /> Home
        </Link>
      </div>
    </motion.div>
  );
}
