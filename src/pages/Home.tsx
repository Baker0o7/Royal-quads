import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MapPin, CreditCard, ChevronRight, AlertCircle, Phone, Tag, Copy, Check, Users, Shield, Wallet, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { notifications } from '../lib/notifications';
import { haptic } from '../lib/utils';
import { Spinner, StepHeader, ErrorMessage } from '../lib/components/ui';
import { ImagePicker } from '../lib/components/ImagePicker';
import type { Quad } from '../types';
import { PRICING } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [quads, setQuads]                     = useState<Quad[]>([]);
  const [selectedQuad, setSelectedQuad]       = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customerName, setCustomerName]       = useState('');
  const [customerPhone, setCustomerPhone]     = useState('');
  const [groupSize, setGroupSize]             = useState(1);
  const [idPhoto, setIdPhoto]                 = useState('');
  const [depositAmount, setDepositAmount]     = useState(0);
  const [promoCode, setPromoCode]             = useState('');
  const [promoDiscount, setPromoDiscount]     = useState(0);
  const [promoError, setPromoError]           = useState('');
  const [promoSuccess, setPromoSuccess]       = useState('');
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [copied, setCopied]                   = useState(false);
  const [showAdvanced, setShowAdvanced]       = useState(false);
  const [loadingQuads, setLoadingQuads]       = useState(true);

  useEffect(() => {
    setLoadingQuads(true);
    api.getQuads().then(data => {
      setQuads(data);
      const qp = new URLSearchParams(location.search).get('quad');
      if (qp) {
        const id = Number(qp);
        if (data.find(q => q.id === id && q.status === 'available')) setSelectedQuad(id);
      }
    }).finally(() => setLoadingQuads(false));

    const u = localStorage.getItem('user');
    if (u) {
      try {
        const p = JSON.parse(u);
        if (p.name)  setCustomerName(p.name);
        if (p.phone) setCustomerPhone(p.phone);
      } catch {}
    }
  }, [location.search]);

  const available = quads.filter(q => q.status === 'available');
  const pricingRow = PRICING.find(p => p.duration === selectedDuration);
  const originalPrice = pricingRow?.price ?? 0;
  const finalPrice = promoDiscount > 0 ? Math.round(originalPrice * (1 - promoDiscount / 100)) : originalPrice;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError(''); setPromoSuccess('');
    try {
      const p = await api.validatePromotion(promoCode.trim());
      setPromoDiscount(p.discountPercentage);
      setPromoSuccess(`${p.discountPercentage}% discount applied!`);
    } catch (e) {
      setPromoDiscount(0);
      setPromoError(e instanceof Error ? e.message : 'Invalid promo code');
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuad)    { setError('Please choose a quad'); return; }
    if (!selectedDuration) { setError('Please select a duration'); return; }
    if (!customerName.trim()) { setError('Please enter your name'); return; }
    if (!customerPhone.trim()) { setError('Please enter your M-Pesa number'); return; }
    if (customerPhone.replace(/\D/g,'').length < 9) { setError('Please enter a valid phone number'); return; }

    setLoading(true); setError('');
    try {
      const u = localStorage.getItem('user');
      const userId = u ? JSON.parse(u).id : null;
      const booking = await api.createBooking({
        quadId: selectedQuad,
        userId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.replace(/\s/g, ''),
        duration: selectedDuration,
        price: finalPrice,
        originalPrice,
        promoCode: promoDiscount > 0 ? promoCode.toUpperCase() : null,
        groupSize,
        idPhotoUrl: idPhoto || null,
        depositAmount: depositAmount || 0,
        waiverSigned: false,
      });
      notifications.add('ride_started', 'Booking Created 🏍️',
        `${customerName.trim()} booked ${quads.find(q => q.id === selectedQuad)?.name} for ${selectedDuration} min — ${finalPrice.toLocaleString()} KES`,
        `/ride/${booking.id}`);
      navigate(`/waiver/${booking.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed — please try again');
      setLoading(false);
    }
  };

  const copyTill = () => {
    navigator.clipboard.writeText('6685024').catch(() => {}).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
      className="flex flex-col gap-6">

      {/* ── Hero ── */}
      <div className="hero-card relative rounded-3xl overflow-hidden min-h-[176px] flex flex-col justify-end p-6">
        <div className="absolute inset-0 opacity-25"
          style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 70% 15%, var(--t-accent2) 0%, transparent 70%)' }} />
        <svg className="absolute bottom-0 left-0 right-0 opacity-10" viewBox="0 0 400 80" preserveAspectRatio="none">
          <path d="M0,80 Q100,20 200,50 Q300,80 400,30 L400,80 Z" fill="white"/>
        </svg>
        <div className="relative z-10">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--t-accent2)' }}>
            Mambrui Sand Dunes
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-white mb-3">
            Ride the<br /><em className="not-italic" style={{ color: 'var(--t-accent2)' }}>Dunes</em>
          </h1>
          <div className="flex items-center gap-2">
            <a href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-white/70 hover:text-white transition-colors bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
              <MapPin className="w-3 h-3" /> Directions
            </a>
            <Link to="/prebook"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-white/70 hover:text-white transition-colors bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
              <Calendar className="w-3 h-3" /> Pre-book
            </Link>
          </div>
        </div>
      </div>

      {/* ── No quads banner ── */}
      {!loadingQuads && available.length === 0 && (
        <div className="p-4 rounded-2xl flex flex-col gap-3"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="flex items-start gap-3" style={{ color: '#b45309' }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">All quads are currently rented.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/prebook"
              className="flex-1 text-center text-xs font-semibold py-2 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--t-accent)' }}>
              Pre-book a slot
            </Link>
            <button type="button" onClick={async () => {
              const n = prompt('Your name?');
              const p = prompt('Your phone number?');
              const d = prompt('How many minutes? (5/10/15/20/30/60)');
              if (n && p && d) {
                await api.addToWaitlist({ customerName: n, customerPhone: p, duration: Number(d) || 30 });
                alert("Added to waitlist! We'll call you when a quad is free.");
              }
            }} className="flex-1 text-xs font-semibold py-2 rounded-xl border transition-colors hover:opacity-80"
              style={{ borderColor: 'rgba(245,158,11,0.4)', color: '#b45309' }}>
              Join Waitlist
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleBook} className="flex flex-col gap-6">

        {/* Step 1 — Quad */}
        <section>
          <StepHeader step={1} title="Choose Your Quad" />
          {loadingQuads ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : available.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--t-muted)' }}>No quads available right now.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {available.map(quad => (
                <button key={quad.id} type="button"
                  onClick={() => { setSelectedQuad(quad.id); haptic('light'); }}
                  className={`tile ${selectedQuad === quad.id ? 'selected' : ''}`}>
                  {quad.imageUrl
                    ? <img src={quad.imageUrl} alt={quad.name} className="w-full h-20 object-cover rounded-xl" />
                    : (
                      <div className="w-full h-20 rounded-xl flex items-center justify-center text-3xl"
                        style={{ background: 'color-mix(in srgb, var(--t-accent) 10%, var(--t-bg))' }}>
                        🏍️
                      </div>
                    )
                  }
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{quad.name}</p>
                    <p className="text-[10px] font-mono mt-0.5 flex items-center gap-1" style={{ color: '#16a34a' }}>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"
                        style={{ animation: 'pulse 2s infinite' }} />
                      Available
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Step 2 — Duration */}
        <section>
          <StepHeader step={2} title="Select Duration" />
          <div className="grid grid-cols-3 gap-2">
            {PRICING.map(p => {
              const active = selectedDuration === p.duration;
              return (
                <button key={p.duration} type="button"
                  onClick={() => { setSelectedDuration(p.duration); haptic('light'); }}
                  className={`tile items-center ${active ? 'selected' : ''}`}>
                  <Clock className="w-4 h-4" style={{ color: active ? 'var(--t-accent)' : 'var(--t-muted)' }} />
                  <span className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{p.label}</span>
                  <span className="text-[10px] font-mono font-medium" style={{ color: active ? 'var(--t-accent)' : 'var(--t-muted)' }}>
                    {p.price.toLocaleString()} KES
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3 — Details */}
        <section>
          <StepHeader step={3} title="Your Details" />
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Full Name *" value={customerName}
              onChange={e => setCustomerName(e.target.value)} className="input" required autoComplete="name" />
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--t-muted)' }} />
              <input type="tel" placeholder="M-Pesa Number *" value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                style={{ paddingLeft: '2.75rem' }} className="input" required autoComplete="tel" />
            </div>
            {/* Group size */}
            <div className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ background: 'color-mix(in srgb, var(--t-bg2) 60%, transparent)', borderColor: 'var(--t-border)' }}>
              <Users className="w-4 h-4 shrink-0" style={{ color: 'var(--t-muted)' }} />
              <span className="text-sm flex-1" style={{ color: 'var(--t-text)' }}>Group Size</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setGroupSize(Math.max(1, groupSize - 1))}
                  className="w-7 h-7 rounded-lg font-bold text-lg flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{ background: 'var(--t-border)', color: 'var(--t-text)' }}>−</button>
                <span className="w-5 text-center font-mono font-bold text-sm" style={{ color: 'var(--t-text)' }}>
                  {groupSize}
                </span>
                <button type="button" onClick={() => setGroupSize(Math.min(10, groupSize + 1))}
                  className="w-7 h-7 rounded-lg font-bold text-lg flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{ background: 'var(--t-border)', color: 'var(--t-text)' }}>+</button>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced: ID + Deposit */}
        <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs font-semibold self-start -mt-2 transition-colors hover:opacity-70"
          style={{ color: 'var(--t-muted)' }}>
          <span className={`transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
          {showAdvanced ? 'Hide' : 'Show'} ID & deposit options
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div key="advanced" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 overflow-hidden -mt-3">
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4" style={{ color: 'var(--t-accent)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>Customer ID Photo</span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--t-muted)' }}>(recommended)</span>
                </div>
                <ImagePicker value={idPhoto} onChange={setIdPhoto} />
              </section>
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4" style={{ color: 'var(--t-accent)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>Damage Deposit</span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--t-muted)' }}>(optional)</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono pointer-events-none"
                    style={{ color: 'var(--t-muted)' }}>KES</span>
                  <input type="number" placeholder="0" value={depositAmount || ''}
                    onChange={e => setDepositAmount(Math.max(0, Number(e.target.value)))}
                    min="0" style={{ paddingLeft: '3rem' }} className="input" />
                </div>
                <p className="text-[10px] font-mono mt-1.5 pl-1" style={{ color: 'var(--t-muted)' }}>
                  Refunded when quad is returned undamaged
                </p>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 4 — Promo */}
        <section>
          <StepHeader step={4} title="Promo Code" />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--t-muted)' }} />
                <input type="text" placeholder="Enter code" value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); setPromoSuccess(''); }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())}
                  style={{ paddingLeft: '2.75rem' }} className="input uppercase tracking-widest font-mono" />
              </div>
              <button type="button" onClick={handleApplyPromo} disabled={!promoCode.trim()}
                className="px-5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-30"
                style={{ background: 'var(--t-btn-bg)', color: 'var(--t-btn-text)' }}>
                Apply
              </button>
            </div>
            {promoError   && <p className="text-xs font-mono pl-1" style={{ color: '#ef4444' }}>⚠ {promoError}</p>}
            {promoSuccess && <p className="text-xs font-mono pl-1" style={{ color: '#16a34a' }}>✓ {promoSuccess}</p>}
          </div>
        </section>

        {/* Step 5 — M-Pesa */}
        <section>
          <StepHeader step={5} title="Payment via M-Pesa" />
          <div className="rounded-2xl overflow-hidden t-card shadow-sm">
            <div className="p-4 flex items-start gap-3 border-b" style={{ borderColor: 'var(--t-border)' }}>
              <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center shrink-0 shadow-sm">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>Buy Goods & Services</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--t-muted)' }}>Pay before confirming your booking</p>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="info-row">
                <span className="text-xs" style={{ color: 'var(--t-muted)' }}>Till Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg tracking-widest" style={{ color: 'var(--t-text)' }}>6685024</span>
                  <button type="button" onClick={copyTill}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
                    {copied
                      ? <Check className="w-3.5 h-3.5" style={{ color: '#16a34a' }} />
                      : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="info-row">
                <span className="text-xs" style={{ color: 'var(--t-muted)' }}>Business Name</span>
                <span className="font-semibold text-xs text-right" style={{ color: 'var(--t-text)' }}>
                  YUSUF OMAR SHEIKH<br />AHMED TAIB
                </span>
              </div>
              <div className="info-row" style={{ borderBottom: 'none', paddingTop: '0.75rem', borderTop: `1px solid var(--t-border)` }}>
                <span className="text-xs" style={{ color: 'var(--t-muted)' }}>Amount to Pay</span>
                <div className="text-right">
                  <p className="font-display font-bold text-xl" style={{ color: 'var(--t-accent)' }}>
                    {finalPrice ? `${finalPrice.toLocaleString()} KES` : '—'}
                  </p>
                  {promoDiscount > 0 && originalPrice > 0 && (
                    <p className="text-[10px] font-mono line-through" style={{ color: 'var(--t-muted)' }}>
                      {originalPrice.toLocaleString()} KES
                    </p>
                  )}
                </div>
              </div>
              {depositAmount > 0 && (
                <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: 'var(--t-border)' }}>
                  <span className="text-xs" style={{ color: 'var(--t-muted)' }}>+ Deposit (refundable)</span>
                  <span className="font-mono font-bold text-sm" style={{ color: 'var(--t-muted)' }}>
                    {depositAmount.toLocaleString()} KES
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        <ErrorMessage message={error} />

        <button type="submit"
          disabled={!selectedQuad || !selectedDuration || !customerName.trim() || !customerPhone.trim() || loading}
          className="btn-primary">
          {loading
            ? <><Spinner /> Confirming…</>
            : <>Continue to Waiver <ChevronRight className="w-4 h-4" /></>}
        </button>
      </form>
    </motion.div>
  );
}
