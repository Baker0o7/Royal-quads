import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Home, Download, Bike, Calendar, Clock, CreditCard, Tag, MapPin, Star } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Receipt() {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/bookings/history')
      .then(res => res.json())
      .then(data => {
        const current = data.find((b: any) => b.id === Number(id));
        if (current) {
          setBooking(current);
          if (current.rating) {
            setRating(current.rating);
            setFeedbackText(current.feedback || '');
            setFeedbackSubmitted(true);
          }
        }
      });
  }, [id]);

  const handleFeedbackSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await fetch(`/api/bookings/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback: feedbackText })
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return <div className="p-8 text-center text-stone-500 animate-pulse">Loading receipt...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 items-center"
    >
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-stone-200 relative overflow-hidden">
        {/* Receipt jagged edge effect top/bottom could be added with CSS, keeping it clean for now */}
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Payment Successful</h1>
          <p className="text-stone-500 text-sm mt-1">Receipt #{booking.receiptId}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-500">
              <Bike className="w-4 h-4" /> Quad
            </div>
            <div className="font-bold">{booking.quadName}</div>
          </div>
          
          <div className="flex justify-between items-center pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-500">
              <Clock className="w-4 h-4" /> Duration
            </div>
            <div className="font-bold">{booking.duration} min</div>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-500">
              <Calendar className="w-4 h-4" /> Date
            </div>
            <div className="font-bold text-right">
              <div>{new Date(booking.startTime).toLocaleDateString()}</div>
              <div className="text-xs text-stone-400">{new Date(booking.startTime).toLocaleTimeString()}</div>
            </div>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-500">
              <CreditCard className="w-4 h-4" /> M-Pesa
            </div>
            <div className="font-bold">{booking.customerPhone}</div>
          </div>
          
          {booking.promoCode && (
            <div className="flex justify-between items-center pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2 text-emerald-600">
                <Tag className="w-4 h-4" /> Promo ({booking.promoCode})
              </div>
              <div className="font-bold text-emerald-600">Applied</div>
            </div>
          )}
        </div>

        <div className="bg-stone-50 p-4 rounded-2xl flex justify-between items-center">
          <div className="text-stone-500 font-medium">Total Paid</div>
          <div className="text-2xl font-bold text-emerald-600">{booking.price} KES</div>
        </div>
        
        {booking.promoCode && (
          <div className="text-right mt-2 text-xs text-stone-400 line-through">
            Original: {booking.originalPrice} KES
          </div>
        )}

        <div className="mt-8 text-center text-xs text-stone-400">
          <p>Thank you for riding with Royal Quads!</p>
          <a 
            href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 transition-colors inline-flex items-center gap-1 mt-1"
          >
            <MapPin className="w-3 h-3" /> Mambrui Sand Dunes
          </a>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
        <h2 className="font-bold text-lg text-stone-900 mb-4 text-center">How was your ride?</h2>
        
        {feedbackSubmitted ? (
          <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={cn("w-6 h-6", star <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300")} 
                />
              ))}
            </div>
            <p className="text-emerald-700 font-medium">Thank you for your feedback!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className={cn(
                      "w-8 h-8 transition-colors", 
                      star <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-stone-300"
                    )} 
                  />
                </button>
              ))}
            </div>
            
            {rating > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col gap-3"
              >
                <textarea
                  placeholder="Tell us about your experience (optional)"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none text-sm resize-none h-24"
                />
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={submitting}
                  className="w-full bg-stone-900 text-white p-3 rounded-xl font-bold hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <button 
          onClick={() => window.print()}
          className="flex-1 bg-white text-stone-900 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 border-stone-200 hover:border-stone-300 transition-colors"
        >
          <Download className="w-5 h-5" />
          Save
        </button>
        <Link 
          to="/"
          className="flex-1 bg-stone-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors"
        >
          <Home className="w-5 h-5" />
          Home
        </Link>
      </div>
    </motion.div>
  );
}
