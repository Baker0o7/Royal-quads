import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, MapPin, CreditCard, ChevronRight, AlertCircle, Phone, Tag, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { Spinner, StepHeader, ErrorMessage } from '../lib/components/ui';
import type { Quad } from '../types';
import { PRICING } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [quads, setQuads] = useState<Quad[]>([]);
  const [selectedQuad, setSelectedQuad] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getQuads().then(data => {
      setQuads(data);
      const quadParam = new URLSearchParams(location.search).get('quad');
      if (quadParam) {
        const id = Number(quadParam);
        if (data.find(q => q.id === id && q.status === 'available')) setSelectedQuad(id);
      }
    });
    const u = localStorage.getItem('user');
    if (u) { const p = JSON.parse(u); setCustomerName(p.name || ''); setCustomerPhone(p.phone || ''); }
  }, [location.search]);

  const available = quads.filter(q => q.status === 'available');
  const originalPrice = PRICING.find(p => p.duration === selectedDuration)?.price ?? 0;
  const finalPrice = promoDiscount > 0 ? Math.round(originalPrice * (1 - promoDiscount / 100)) : originalPrice;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError(''); setPromoSuccess('');
    try {
      const p = await api.validatePromotion(promoCode.trim());
      setPromoDiscount(p.discountPercentage);
      setPromoSuccess(`${p.discountPercentage}% discount applied`);
    } catch (e: unknown) {
      setPromoDiscount(0);
      setPromoError(e instanceof Error ? e.message : 'Invalid promo code');
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuad || !selectedDuration || !customerName.trim() || !customerPhone.trim()) {
      setError('Please fill in all fields'); return;
    }
    setLoading(true); setError('');
    try {
      const u = localStorage.getItem('user');
      const userId = u ? JSON.parse(u).id : null;
      const data = await api.createBooking({
        quadId: selectedQuad, userId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.replace(/\s/g, ''),
        duration: selectedDuration, price: finalPrice, originalPrice,
        promoCode: promoDiscount > 0 ? promoCode.toUpperCase() : null,
      });
      setTimeout(() => navigate(`/ride/${data.id}`), 1000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to book');
      setLoading(false);
    }
  };

  const copyTill = () => {
    navigator.clipboard.writeText('6685024').then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="flex flex-col gap-7">

      {/* ── Hero ───────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-[#1a1612] text-white min-h-[180px] flex flex-col justify-end p-6">
        {/* Desert gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d2318] via-[#1a1612] to-[#0d0b09]" />
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(201,151,42,0.35) 0%, transparent 70%)' }} />
        {/* Dune silhouette */}
        <svg className="absolute bottom-0 left-0 right-0 opacity-10" viewBox="0 0 400 80" preserveAspectRatio="none">
          <path d="M0,80 Q100,20 200,50 Q300,80 400,30 L400,80 Z" fill="white"/>
        </svg>

        <div className="relative z-10">
          <p className="font-mono text-[#c9972a] text-[10px] tracking-[0.2em] uppercase mb-2">Mambrui Sand Dunes</p>
          <h1 className="font-display text-3xl font-bold leading-tight mb-3">
            Ride the<br />
            <span className="italic text-[#e8b84b]">Dunes</span>
          </h1>
          <a href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#c9b99a] hover:text-[#e8b84b] transition-colors bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <MapPin className="w-3 h-3" /> Get Directions
          </a>
        </div>
      </div>

      <form onSubmit={handleBook} className="flex flex-col gap-7">

        {/* ── Step 1 — Quad ──────────────────────────── */}
        <section>
          <StepHeader step={1} title="Choose Your Quad" />
          {available.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-700/30 flex items-start gap-3 text-amber-800 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm">No quads available right now. Please check back shortly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {available.map(quad => (
                <button key={quad.id} type="button" onClick={() => setSelectedQuad(quad.id)}
                  className={cn(
                    'p-3 rounded-2xl border-1.5 text-left transition-all duration-200 flex flex-col gap-2 active:scale-[0.97] group',
                    selectedQuad === quad.id
                      ? 'border-[#c9972a] bg-[#c9972a]/5 dark:bg-[#c9972a]/8 shadow-[0_0_0_1px_#c9972a]'
                      : 'border-[#c9b99a]/30 dark:border-[#c9b99a]/10 bg-white/60 dark:bg-[#1a1612]/60 hover:border-[#c9972a]/50'
                  )}>
                  {quad.imageUrl
                    ? <img src={quad.imageUrl} alt={quad.name} className="w-full h-20 object-cover rounded-xl" />
                    : (
                      <div className="w-full h-20 rounded-xl bg-gradient-to-br from-[#e8dfc9] to-[#c9b99a] dark:from-[#2d2318] dark:to-[#1a1612] flex items-center justify-center">
                        <span className={cn('text-3xl transition-transform duration-300 group-hover:scale-110', selectedQuad === quad.id && 'scale-110')}>🏍️</span>
                      </div>
                    )
                  }
                  <div>
                    <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{quad.name}</p>
                    <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                      Available
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Step 2 — Duration ──────────────────────── */}
        <section>
          <StepHeader step={2} title="Select Duration" />
          <div className="grid grid-cols-3 gap-2">
            {PRICING.map(p => {
              const active = selectedDuration === p.duration;
              return (
                <button key={p.duration} type="button" onClick={() => setSelectedDuration(p.duration)}
                  className={cn(
                    'p-3 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-1.5 active:scale-[0.96]',
                    active
                      ? 'border-[#c9972a] bg-[#c9972a]/5 dark:bg-[#c9972a]/8 shadow-[0_0_0_1px_#c9972a]'
                      : 'border-[#c9b99a]/30 dark:border-[#c9b99a]/10 bg-white/60 dark:bg-[#1a1612]/60 hover:border-[#c9972a]/50'
                  )}>
                  <Clock className={cn('w-4 h-4', active ? 'text-[#c9972a]' : 'text-[#7a6e60] dark:text-[#a09070]')} />
                  <span className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{p.label}</span>
                  <span className={cn('text-[10px] font-mono font-medium', active ? 'text-[#c9972a]' : 'text-[#7a6e60] dark:text-[#a09070]')}>
                    {p.price.toLocaleString()} KES
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Step 3 — Details ───────────────────────── */}
        <section>
          <StepHeader step={3} title="Your Details" />
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Full Name" value={customerName}
              onChange={e => setCustomerName(e.target.value)} className="input" required />
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7a6e60] pointer-events-none" />
              <input type="tel" placeholder="M-Pesa Number (e.g. 0712 345 678)" value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                style={{ paddingLeft: '2.75rem' }} className="input" required />
            </div>
          </div>
        </section>

        {/* ── Step 4 — Promo ─────────────────────────── */}
        <section>
          <StepHeader step={4} title="Promo Code" />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7a6e60] pointer-events-none" />
                <input type="text" placeholder="Enter code" value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); setPromoSuccess(''); }}
                  style={{ paddingLeft: '2.75rem' }} className="input uppercase tracking-widest font-mono" />
              </div>
              <button type="button" onClick={handleApplyPromo} disabled={!promoCode.trim()}
                className="px-5 rounded-xl bg-[#1a1612] dark:bg-[#f5f0e8]/10 text-white dark:text-[#f5f0e8] text-sm font-semibold hover:bg-[#2d2318] dark:hover:bg-[#f5f0e8]/15 disabled:opacity-40 transition-colors border border-[#c9b99a]/20">
                Apply
              </button>
            </div>
            {promoError   && <p className="text-red-600 dark:text-red-400 text-xs font-mono pl-1">⚠ {promoError}</p>}
            {promoSuccess && <p className="text-emerald-600 dark:text-emerald-400 text-xs font-mono pl-1">✓ {promoSuccess}</p>}
          </div>
        </section>

        {/* ── Step 5 — Payment ───────────────────────── */}
        <section>
          <StepHeader step={5} title="Payment via M-Pesa" />
          <div className="rounded-2xl border border-[#c9b99a]/25 dark:border-[#c9b99a]/10 overflow-hidden bg-white/70 dark:bg-[#1a1612]/70 backdrop-blur-sm shadow-sm">
            <div className="p-4 border-b border-[#c9b99a]/15 dark:border-[#c9b99a]/8 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c9972a] to-[#8a6010] flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">Buy Goods & Services</p>
                <p className="text-xs text-[#7a6e60] dark:text-[#a09070] mt-0.5">Pay before confirming your booking</p>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[
                { label: 'Till Number',
                  value: (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg text-[#1a1612] dark:text-[#f5f0e8] tracking-widest">6685024</span>
                      <button type="button" onClick={copyTill}
                        className="p-1.5 rounded-lg bg-[#f5f0e8] dark:bg-[#2d2318] hover:bg-[#e8dfc9] dark:hover:bg-[#3d3020] transition-colors text-[#7a6e60]">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )
                },
                { label: 'Business Name', value: <span className="font-semibold text-xs text-[#1a1612] dark:text-[#f5f0e8] text-right">YUSUF OMAR SHEIKH<br/>AHMED TAIB</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-[#7a6e60] dark:text-[#a09070]">{label}</span>
                  {value}
                </div>
              ))}
              <div className="pt-3 mt-1 border-t border-[#c9b99a]/15 dark:border-[#c9b99a]/8 flex justify-between items-center">
                <span className="text-xs text-[#7a6e60] dark:text-[#a09070]">Amount to Pay</span>
                <div className="text-right">
                  <p className="font-display font-bold text-xl text-[#c9972a]">
                    {finalPrice ? `${finalPrice.toLocaleString()} KES` : '—'}
                  </p>
                  {promoDiscount > 0 && originalPrice > 0 && (
                    <p className="text-[10px] font-mono text-[#7a6e60] line-through">{originalPrice.toLocaleString()} KES</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && <ErrorMessage message={error} />}

        <button type="submit"
          disabled={!selectedQuad || !selectedDuration || !customerName || !customerPhone || loading}
          className="btn-primary">
          {loading ? <><Spinner /> Confirming...</> : <>Confirm Booking <ChevronRight className="w-4 h-4" /></>}
        </button>
      </form>
    </motion.div>
  );
}
