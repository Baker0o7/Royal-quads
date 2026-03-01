import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Phone, ChevronRight, ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ErrorMessage, LoadingScreen, StatusBadge } from '../lib/components/ui';
import type { Prebooking, Quad } from '../types';
import { PRICING } from '../types';

export default function Prebook() {
  const [quads, setQuads] = useState<Quad[]>([]);
  const [prebookings, setPrebookings] = useState<Prebooking[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [quadId, setQuadId] = useState<number | null>(null);
  const [scheduledFor, setScheduledFor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.getQuads().then(setQuads);
    api.getPrebookings().then(setPrebookings);
    const u = localStorage.getItem('user');
    if (u) { const p = JSON.parse(u); setName(p.name || ''); setPhone(p.phone || ''); }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !duration || !scheduledFor) { setError('Please fill in all required fields'); return; }
    setLoading(true); setError('');
    try {
      const price = PRICING.find(p => p.duration === duration)?.price ?? 0;
      const quad = quads.find(q => q.id === quadId);
      await api.createPrebooking({
        quadId: quadId || null,
        quadName: quad?.name || null,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        duration,
        price,
        scheduledFor: new Date(scheduledFor).toISOString(),
      });
      setSuccess(true);
      api.getPrebookings().then(setPrebookings);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to pre-book'); }
    finally { setLoading(false); }
  };

  const myBookings = prebookings.filter(p => p.customerPhone === phone && p.status !== 'cancelled');

  const statusColor: Record<string, string> = {
    pending:   'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    confirmed: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    cancelled: 'bg-red-100 dark:bg-red-900/20 text-red-500',
    converted: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 rounded-xl bg-[#f5f0e8] dark:bg-[#2d2318] text-[#7a6e60] hover:text-[#c9972a] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-[#1a1612] dark:text-[#f5f0e8]">Pre-book a Ride</h1>
          <p className="text-xs font-mono text-[#7a6e60] dark:text-[#a09070]">Reserve your slot in advance</p>
        </div>
      </div>

      {success ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center py-10 gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#1a1612] dark:text-[#f5f0e8]">Request Sent!</h2>
          <p className="text-sm text-[#7a6e60] dark:text-[#a09070] max-w-xs">We'll call you on <strong className="text-[#1a1612] dark:text-[#f5f0e8]">{phone}</strong> to confirm your booking.</p>
          <button onClick={() => setSuccess(false)} className="btn-primary max-w-xs">Book Another</button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm flex flex-col gap-4">
            <input type="text" placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} className="input" required />
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7a6e60] pointer-events-none" />
              <input type="tel" placeholder="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)} style={{ paddingLeft: '2.75rem' }} className="input" required />
            </div>
            <div>
              <label className="text-xs font-mono text-[#7a6e60] dark:text-[#a09070] mb-2 block uppercase tracking-wider">Duration *</label>
              <div className="grid grid-cols-3 gap-2">
                {PRICING.map(p => (
                  <button key={p.duration} type="button" onClick={() => setDuration(p.duration)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${duration === p.duration ? 'border-[#c9972a] bg-[#c9972a]/5 shadow-[0_0_0_1px_#c9972a]' : 'border-[#c9b99a]/30 dark:border-[#c9b99a]/10 bg-white/60 dark:bg-[#1a1612]/60'}`}>
                    <p className="font-semibold text-xs text-[#1a1612] dark:text-[#f5f0e8]">{p.label}</p>
                    <p className="text-[10px] font-mono text-[#7a6e60] dark:text-[#a09070]">{p.price.toLocaleString()} KES</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-[#7a6e60] dark:text-[#a09070] mb-2 block uppercase tracking-wider">Preferred Quad (optional)</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setQuadId(null)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${!quadId ? 'border-[#c9972a] bg-[#c9972a]/5 text-[#c9972a]' : 'border-[#c9b99a]/30 dark:border-[#c9b99a]/10 text-[#7a6e60]'}`}>
                  Any
                </button>
                {quads.map(q => (
                  <button key={q.id} type="button" onClick={() => setQuadId(q.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${quadId === q.id ? 'border-[#c9972a] bg-[#c9972a]/5 text-[#c9972a]' : 'border-[#c9b99a]/30 dark:border-[#c9b99a]/10 text-[#7a6e60] dark:text-[#a09070]'}`}>
                    {q.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-[#7a6e60] dark:text-[#a09070] mb-2 block uppercase tracking-wider">Preferred Date & Time *</label>
              <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)}
                min={new Date().toISOString().slice(0,16)} className="input font-mono" required />
            </div>
            {error && <ErrorMessage message={error} />}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Sending...' : <><Calendar className="w-4 h-4" /> Request Pre-booking</>}
            </button>
          </div>
        </form>
      )}

      {myBookings.length > 0 && (
        <section>
          <h2 className="font-display text-sm font-bold mb-3 text-[#1a1612] dark:text-[#f5f0e8]">Your Pre-bookings</h2>
          <div className="flex flex-col gap-3">
            {myBookings.map(pb => (
              <div key={pb.id} className="bg-white/70 dark:bg-[#1a1612]/70 p-4 rounded-2xl border border-[#c9b99a]/15 dark:border-[#c9b99a]/8 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{pb.quadName || 'Any Quad'}</p>
                    <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{pb.duration} min · {pb.price.toLocaleString()} KES
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${statusColor[pb.status]}`}>{pb.status}</span>
                </div>
                <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{new Date(pb.scheduledFor).toLocaleString()}
                </p>
                {pb.status === 'pending' && (
                  <button onClick={() => api.cancelPrebooking(pb.id).then(() => api.getPrebookings().then(setPrebookings))}
                    className="mt-2 text-[10px] text-red-500 font-mono hover:text-red-600 transition-colors">
                    Cancel request
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
