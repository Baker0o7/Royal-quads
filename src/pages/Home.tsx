import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MapPin, AlertCircle, Phone, Tag, Copy, Check, Users, Shield, Wallet, Calendar, Zap, Star, ChevronRight, CreditCard } from 'lucide-react';
import { api } from '../lib/api';
import { notifications } from '../lib/notifications';
import { haptic } from '../lib/utils';
import { useToast } from '../lib/components/Toast';
import { Spinner, StepHeader, ErrorMessage } from '../lib/components/ui';
import { ImagePicker } from '../lib/components/ImagePicker';
import { TILL_NUMBER, BUSINESS_NAME } from '../lib/constants';
import type { Quad, Booking } from '../types';
import { PRICING } from '../types';
import { sendWhatsApp } from '../lib/sms';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast    = useToast();
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
  const [mpesaRef, setMpesaRef]               = useState('');
  const [liveRides, setLiveRides]             = useState<Booking[]>([]);
  const [loyalty, setLoyalty]                 = useState<{ points: number; totalRides: number } | null>(null);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [loyaltyOpen, setLoyaltyOpen]         = useState(false);

  useEffect(() => {
    setLoadingQuads(true);
    api.getQuads().then(data => {
      setQuads(data);
      const qp = new URLSearchParams(location.search).get('quad');
      if (qp) {
        const id = Number(qp);
        if (data.find(q => q.id === id && q.status === 'available')) setSelectedQuad(id);
      }
    }).catch(() => {}).finally(() => setLoadingQuads(false));

    api.getActiveBookings().then(setLiveRides).catch(() => {});

    const u = localStorage.getItem('user');
    if (u) {
      try {
        const p = JSON.parse(u);
        if (p.name)  setCustomerName(p.name);
        if (p.phone) {
          setCustomerPhone(p.phone);
          api.getLoyaltyAccount(p.phone).then(acc => {
            if (acc) setLoyalty({ points: acc.points, totalRides: acc.totalRides });
          }).catch(() => {});
          const ec = api.getEmergencyContact(p.phone);
          if (ec) setEmergencyContact(ec);
        }
      } catch {}
    }
  }, [location.search]);

  const available = quads.filter(q => q.status === 'available');
  const pricingRow = PRICING.find(p => p.duration === selectedDuration);
  const multiplier = api.getCurrentPriceMultiplier();
  const originalPrice = pricingRow ? Math.round(pricingRow.price * multiplier) : 0;
  const finalPrice = promoDiscount > 0 ? Math.round(originalPrice * (1 - promoDiscount / 100)) : originalPrice;
  const promoSaved = promoDiscount > 0 ? originalPrice - finalPrice : 0;

  const multiplierLabel = (() => {
    if (multiplier === 1) return null;
    if (multiplier < 1) {
      const pct = Math.round((1 - multiplier) * 100);
      return { label: `Early Bird —${pct}%`, color: '#16a34a' };
    }
    const pct = Math.round((multiplier - 1) * 100);
    if (multiplier >= 1.5) return { label: `Peak +${pct}%`, color: '#ef4444' };
    return { label: `Peak +${pct}%`, color: '#f59e0b' };
  })();

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError(''); setPromoSuccess('');
    try {
      const p = await api.validatePromotion(promoCode.trim());
      if (!p) { setPromoDiscount(0); setPromoError('Invalid or inactive promo code'); return; }
      setPromoDiscount(p.discountPercentage);
      setPromoSuccess(`${p.discountPercentage}% discount applied!`);
    } catch (e) {
      setPromoDiscount(0);
      setPromoError(e instanceof Error ? e.message : 'Invalid promo code');
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuad)    { toast.error('Please choose a quad'); return; }
    if (!selectedDuration) { toast.error('Please select a duration'); return; }
    if (!customerName.trim()) { toast.error('Please enter your name'); return; }
    if (customerName.trim().length < 2) { toast.error('Please enter a valid name (at least 2 characters)'); return; }
    if (!customerPhone.trim()) { toast.error('Please enter your M-Pesa number'); return; }
    if (customerPhone.replace(/\D/g,'').length < 9) { toast.error('Please enter a valid phone number'); return; }

    setLoading(true); setError('');
    try {
      const u = localStorage.getItem('user');
      let userId: number | null = null;
      if (u) {
        try { userId = JSON.parse(u).id ?? null; } catch {}
      }
      const quad = quads.find(q => q.id === selectedQuad);
      const booking = await api.createBooking({
        quadId: selectedQuad,
        userId,
        customerName: customerName.trim(),
        customerPhone: customerPhone,
        duration: selectedDuration,
        price: finalPrice,
        originalPrice,
        promoCode: promoDiscount > 0 ? promoCode.toUpperCase() : null,
        groupSize,
        idPhotoUrl: idPhoto || null,
        depositAmount: depositAmount || 0,
        waiverSigned: false,
        mpesaRef: mpesaRef.trim().toUpperCase() || null,
      });

      if (emergencyContact.trim()) {
        api.setEmergencyContact(customerPhone, emergencyContact.trim());
      }

      api.addLoyaltyPoints(customerPhone, Math.floor(finalPrice / 100)).catch(() => {});

      notifications.add('ride_started', 'Booking Created 🏍️',
        `${customerName.trim()} booked ${quad?.name} for ${selectedDuration} min — ${finalPrice.toLocaleString()} KES`,
        `/ride/${booking.id}`);
      haptic('success');

      const wMsg = `Hi ${customerName.trim()}! 🏍️ Your ${selectedDuration}-min quad ride on *${quad?.name}* has started at ${BUSINESS_NAME}.\n\nReceipt: ${booking.receiptId}\nEnjoy the dunes! 🏜️\n\n📍 https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6`;
      sendWhatsApp(customerPhone, wMsg);

      navigate(`/waiver/${booking.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Booking failed — please try again');
      haptic('error');
      setLoading(false);
    }
  };

  const copyTill = () => {
    navigator.clipboard.writeText(TILL_NUMBER)
      .then(() => {
        toast.success('Till number copied!');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error(`Clipboard access denied — please copy manually: ${TILL_NUMBER}`);
      });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
      className="flex flex-col gap-6">

      {/* ── Hero ── */}
      <div className="hero-card relative rounded-3xl overflow-hidden min-h-[176px] flex flex-col justify-end p-6">
        <div className="absolute inset-0 opacity-25"
          style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 70% 15%, var(--t-accent2) 0%, transparent 70%)' }} />
        {/* Logo watermark */}
        <div className="absolute top-4 right-4 w-20 h-20 rounded-full overflow-hidden opacity-80 shadow-lg"
          style={{ border: '2px solid rgba(255,255,255,0.2)' }}>
          <img src="/logo.png" alt="Royal Quad Bikes" className="w-full h-full object-cover" />
        </div>
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
            {loyalty && (
              <button type="button" onClick={() => setLoyaltyOpen(o => !o)}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-white/70 hover:text-white transition-colors bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
                <Star className="w-3 h-3" /> {loyalty.points} pts
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Live rides banner ── */}
      {liveRides.length > 0 && (
        <div className="p-3 rounded-2xl border"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>
              {liveRides.length} ride{liveRides.length > 1 ? 's' : ''} in progress
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {liveRides.slice(0, 3).map(b => {
              const elapsed = Math.floor((Date.now() - new Date(b.startTime).getTime()) / 1000);
              const remaining = b.duration * 60 - elapsed;
              return (
                <div key={b.id} className="shrink-0 px-3 py-2 rounded-xl border"
                  style={{ background: 'var(--t-card)', borderColor: 'var(--t-border)' }}>
                  <p className="text-xs font-semibold truncate max-w-[120px]" style={{ color: 'var(--t-text)' }}>
                    {b.quadName}
                  </p>
                  <p className="text-[10px] font-mono" style={{ color: 'var(--t-muted)' }}>
                    {b.customerName} · {Math.max(0, Math.ceil(remaining / 60))}m left
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            <div className="grid grid-cols-2 gap-3">
              {[0,1,2,3].map(i => (
                <div key={i} className="tile flex-col gap-2 pointer-events-none">
                  <div className="skeleton w-full h-20 rounded-xl" />
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
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
                      <div className="w-full h-20 rounded-xl overflow-hidden relative flex items-center justify-center"
                        style={{ background: 'color-mix(in srgb, var(--t-accent) 10%, var(--t-bg))' }}>
                        <img src="/logo.png" alt={quad.name}
                          className="w-16 h-16 object-cover rounded-full opacity-70"
                          style={{ border: '1px solid var(--t-border)' }} />
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
          <div className="flex items-center justify-between mb-3">
            <StepHeader step={2} title="Select Duration" />
            {multiplierLabel && (
              <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded-full"
                style={{ background: `${multiplierLabel.color}18`, color: multiplierLabel.color }}>
                <Zap className="w-3 h-3 inline mr-1" />{multiplierLabel.label}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRICING.map(p => {
              const active = selectedDuration === p.duration;
              const basePrice = p.price;
              const finalP = Math.round(basePrice * multiplier);
              const hasMulti = multiplier !== 1;
              return (
                <button key={p.duration} type="button"
                  onClick={() => { setSelectedDuration(p.duration); haptic('light'); }}
                  className={`tile items-center ${active ? 'selected' : ''}`}>
                  <Clock className="w-4 h-4" style={{ color: active ? 'var(--t-accent)' : 'var(--t-muted)' }} />
                  <span className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{p.label}</span>
                  <span className="text-[10px] font-mono font-medium" style={{ color: active ? 'var(--t-accent)' : 'var(--t-muted)' }}>
                    {finalP.toLocaleString()} KES{hasMulti && <span className="line-through opacity-50 ml-0.5">{basePrice}</span>}
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
            <input type="text" placeholder="Emergency Contact (optional)" value={emergencyContact}
              onChange={e => setEmergencyContact(e.target.value)} className="input" autoComplete="tel" />
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
            {promoSuccess && <p className="text-xs font-mono pl-1" style={{ color: '#16a34a' }}>
              ✓ {promoSuccess}{promoSaved > 0 && <span className="ml-1">(save {promoSaved.toLocaleString()} KES)</span>}
            </p>}
          </div>
        </section>

        {/* Step 5 — M-Pesa */}
        <section>
          <StepHeader step={5} title="Pay via M-Pesa" />

          {/* STK push steps */}
          <div className="rounded-2xl overflow-hidden t-card shadow-sm mb-3">
            <div className="p-4 flex items-start gap-3 border-b" style={{ borderColor: 'var(--t-border)' }}>
              <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center shrink-0 shadow-sm">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>Lipa na M-Pesa — Buy Goods</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--t-muted)' }}>Follow these steps on your phone</p>
              </div>
            </div>

            {/* How-to steps */}
            <div className="p-4 flex flex-col gap-3">
              {[
                { n: 1, text: 'Open M-Pesa on your phone' },
                { n: 2, text: 'Select Lipa na M-Pesa → Buy Goods' },
                { n: 3, text: <>Enter Till: <strong className="font-mono tracking-widest" style={{ color: 'var(--t-text)' }}>{TILL_NUMBER}</strong></> },
                { n: 4, text: <>Amount: <strong className="font-mono" style={{ color: 'var(--t-accent)' }}>{finalPrice ? `${finalPrice.toLocaleString()} KES` : '—'}{depositAmount > 0 ? ` + ${depositAmount.toLocaleString()} deposit` : ''}</strong></> },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold font-mono"
                    style={{ background: 'var(--t-accent)', color: 'white' }}>{n}</div>
                  <p className="text-sm" style={{ color: 'var(--t-muted)' }}>{text}</p>
                </div>
              ))}

              {/* Copy till */}
              <div className="flex items-center justify-between pt-2 border-t mt-1" style={{ borderColor: 'var(--t-border)' }}>
                <span className="text-xs font-mono" style={{ color: 'var(--t-muted)' }}>Business Name</span>
                <span className="font-semibold text-xs text-right" style={{ color: 'var(--t-text)' }}>YUSUF OMAR SHEIKH AHMED TAIB</span>
              </div>

              <button type="button" onClick={copyTill}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-[0.98]"
                style={{ borderColor: 'var(--t-border)', background: 'var(--t-bg2)', color: 'var(--t-text)' }}>
                {copied
                  ? <><Check className="w-4 h-4" style={{ color: '#16a34a' }} /> Till Number Copied!</>
                  : <><Copy className="w-4 h-4" /> Copy Till Number ({TILL_NUMBER})</>}
              </button>
            </div>
          </div>

          {/* M-Pesa reference input */}
          <div className="rounded-2xl p-4 t-card">
            <label className="block text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--t-muted)' }}>
              M-Pesa Confirmation Code
            </label>
            <input
              type="text"
              placeholder="e.g. QHL2X3P8KA (optional)"
              value={mpesaRef}
              onChange={e => setMpesaRef(e.target.value.toUpperCase())}
              className="input font-mono tracking-wider"
              maxLength={12}
              style={{ letterSpacing: '0.1em' }}
            />
            <p className="text-[10px] font-mono mt-2" style={{ color: 'var(--t-muted)' }}>
              Found in your M-Pesa SMS confirmation message
            </p>
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

      {/* ── Loyalty Modal ── */}
      <AnimatePresence>
        {loyaltyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setLoyaltyOpen(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
              style={{ background: 'var(--t-card)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(201,151,42,0.15)' }}>
                  <Star className="w-6 h-6" style={{ color: 'var(--t-accent2)' }} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold" style={{ color: 'var(--t-text)' }}>Loyalty Points</h3>
                  <p className="text-xs" style={{ color: 'var(--t-muted)' }}>Earn 1 point per 100 KES spent</p>
                </div>
              </div>
              {loyalty ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl text-center border"
                    style={{ background: 'rgba(201,151,42,0.08)', borderColor: 'rgba(201,151,42,0.2)' }}>
                    <p className="font-mono text-3xl font-bold" style={{ color: 'var(--t-accent2)' }}>{loyalty.points}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: 'var(--t-muted)' }}>Points Balance</p>
                  </div>
                  <div className="p-4 rounded-2xl text-center border"
                    style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }}>
                    <p className="font-mono text-3xl font-bold" style={{ color: '#10b981' }}>{loyalty.totalRides}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: 'var(--t-muted)' }}>Total Rides</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-center" style={{ color: 'var(--t-muted)' }}>No loyalty account yet. Complete your first ride!</p>
              )}
              <button type="button" onClick={() => setLoyaltyOpen(false)}
                className="w-full mt-4 btn-primary">
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
