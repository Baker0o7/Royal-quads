import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Phone, CheckCircle2, ArrowLeft, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ErrorMessage, LoadingScreen, Spinner } from '../lib/components/ui';
import { notifications } from '../lib/notifications';
import { useToast } from '../lib/components/Toast';
import type { Prebooking, Quad } from '../types';
import { PRICING } from '../types';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(245,158,11,0.1)',  color: '#b45309' },
  confirmed: { bg: 'rgba(34,197,94,0.1)',   color: '#16a34a' },
  cancelled: { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
  converted: { bg: 'rgba(59,130,246,0.1)',  color: '#2563eb' },
};

export default function Prebook() {
  const toast = useToast();
  const [quads, setQuads]           = useState<Quad[]>([]);
  const [prebookings, setPrebookings] = useState<Prebooking[]>([]);
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [duration, setDuration]     = useState<number | null>(null);
  const [quadId, setQuadId]         = useState<number | null>(null);
  const [scheduledFor, setScheduledFor] = useState('');
  const [notes, setNotes]           = useState('');
  const [mpesaRef, setMpesaRef]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    api.getQuads().then(setQuads).catch(() => {});
    api.getPrebookings().then(setPrebookings).catch(() => {});
    const stored = localStorage.getItem('user');
    if (stored) {
      try { const u = JSON.parse(stored); if (u.name) setName(u.name); if (u.phone) setPhone(u.phone); }
      catch {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { setError('Please enter a valid name'); return; }
    if (!duration) { setError('Please select a duration'); return; }
    if (!scheduledFor) { setError('Please pick a date and time'); return; }
    setLoading(true); setError('');
    try {
      const price = PRICING.find(p => p.duration === duration)?.price ?? 0;
      const quad = quads.find(q => q.id === quadId);
      await api.createPrebooking({
        quadId: quadId ?? null,
        quadName: quad?.name ?? null,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        duration,
        price,
        scheduledFor: new Date(scheduledFor).toISOString(),
        notes: notes.trim() || undefined,
        mpesaRef: mpesaRef.trim() || undefined,
      });
      notifications.add('prebook_reminder', 'Pre-booking Requested 📅',
        `${name.trim()} requested a ${duration}min ride for ${new Date(scheduledFor).toLocaleString()}`);
      toast.success('Pre-booking request sent!');
      setSuccess(true);
      api.getPrebookings().then(setPrebookings);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send request');
      setError(e instanceof Error ? e.message : 'Failed to send request');
    } finally { setLoading(false); }
  };

  const myBookings = prebookings.filter(
    p => p.customerPhone === phone && p.status !== 'cancelled'
  );

  // Min datetime = now + 30 min
  const minDate = new Date(Date.now() + 30 * 60_000).toISOString().slice(0, 16);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 rounded-xl transition-opacity hover:opacity-70"
          style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--t-text)' }}>Pre-book a Ride</h1>
          <p className="text-xs font-mono" style={{ color: 'var(--t-muted)' }}>Reserve your slot in advance</p>
        </div>
      </div>

      {success ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center py-10 gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.12)' }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: '#16a34a' }} />
          </div>
          <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--t-text)' }}>Request Sent!</h2>
          <p className="text-sm max-w-xs" style={{ color: 'var(--t-muted)' }}>
            We'll call <strong style={{ color: 'var(--t-text)' }}>{phone}</strong> to confirm your booking.
          </p>
          <button onClick={() => setSuccess(false)} className="btn-primary max-w-xs">Book Another</button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="t-card rounded-2xl p-5 flex flex-col gap-4">
            <input type="text" placeholder="Full Name *" value={name}
              onChange={e => setName(e.target.value)} className="input" required autoComplete="name" />
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--t-muted)' }} />
              <input type="tel" placeholder="Phone Number *" value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ paddingLeft: '2.75rem' }} className="input" required autoComplete="tel" />
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider mb-2 block" style={{ color: 'var(--t-muted)' }}>
                Duration *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRICING.map(p => (
                  <button key={p.duration} type="button" onClick={() => setDuration(p.duration)}
                    className={`tile items-center ${duration === p.duration ? 'selected' : ''}`}>
                    <span className="font-semibold text-xs" style={{ color: 'var(--t-text)' }}>{p.label}</span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--t-muted)' }}>
                      {p.price.toLocaleString()} KES
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred quad */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider mb-2 block" style={{ color: 'var(--t-muted)' }}>
                Preferred Quad <span className="normal-case">(optional)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setQuadId(null)}
                  className={`tile items-center ${!quadId ? 'selected' : ''}`}>
                  <span className="font-semibold text-xs" style={{ color: 'var(--t-text)' }}>Any</span>
                </button>
                {quads.map(q => (
                  <button key={q.id} type="button" onClick={() => setQuadId(q.id)}
                    className={`tile items-center ${quadId === q.id ? 'selected' : ''}`}>
                    <span className="font-semibold text-xs" style={{ color: 'var(--t-text)' }}>{q.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date/time */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider mb-2 block" style={{ color: 'var(--t-muted)' }}>
                Date & Time *
              </label>
              <input type="datetime-local" value={scheduledFor} min={minDate}
                onChange={e => setScheduledFor(e.target.value)} className="input font-mono" required />
            </div>

            {/* M-Pesa ref */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider mb-2 block" style={{ color: 'var(--t-muted)' }}>
                M-Pesa Ref <span className="normal-case">(optional)</span>
              </label>
              <input type="text" placeholder="e.g. AA11BB22CC" value={mpesaRef}
                onChange={e => setMpesaRef(e.target.value.toUpperCase())}
                className="input font-mono uppercase" maxLength={12}
                style={{ letterSpacing: '0.05em' }} />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider mb-2 block" style={{ color: 'var(--t-muted)' }}>
                Special Requests <span className="normal-case">(optional)</span>
              </label>
              <textarea placeholder="Group size, special occasion, accessibility needs…"
                value={notes} onChange={e => setNotes(e.target.value)}
                className="input resize-none text-sm" rows={2} />
            </div>

            <ErrorMessage message={error} />

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><Spinner /> Sending…</> : <><Calendar className="w-4 h-4" /> Request Pre-booking</>}
            </button>
          </div>
        </form>
      )}

      {/* My pre-bookings */}
      {myBookings.length > 0 && (
        <section>
          <h2 className="font-display text-sm font-bold mb-3" style={{ color: 'var(--t-text)' }}>
            Your Pre-bookings
          </h2>
          <div className="flex flex-col gap-3">
            {myBookings.map(pb => {
              const s = STATUS_STYLE[pb.status] ?? STATUS_STYLE.pending;
              return (
                <div key={pb.id} className="t-card rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>
                        {pb.quadName || 'Any Quad'}
                      </p>
                      <p className="font-mono text-[10px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--t-muted)' }}>
                        <Clock className="w-3 h-3" /> {pb.duration} min · {pb.price.toLocaleString()} KES
                      </p>
                    </div>
                    <span className="pill capitalize" style={{ background: s.bg, color: s.color }}>{pb.status}</span>
                  </div>
                  <p className="font-mono text-[10px] flex items-center gap-1" style={{ color: 'var(--t-muted)' }}>
                    <Calendar className="w-3 h-3" /> {new Date(pb.scheduledFor).toLocaleString()}
                  </p>
                  {pb.notes && (
                    <p className="font-mono text-[10px] mt-1 flex items-center gap-1" style={{ color: 'var(--t-muted)' }}>
                      <MessageSquare className="w-3 h-3" /> {pb.notes}
                    </p>
                  )}
                  {pb.mpesaRef && (
                    <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--t-accent)' }}>
                      📱 {pb.mpesaRef}
                    </p>
                  )}
                  {pb.status === 'pending' && (
                    <button onClick={() => api.cancelPrebooking(pb.id).then(() => api.getPrebookings().then(setPrebookings))}
                      className="mt-2 text-[10px] font-mono transition-opacity hover:opacity-70"
                      style={{ color: '#ef4444' }}>
                      Cancel request
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </motion.div>
  );
}
