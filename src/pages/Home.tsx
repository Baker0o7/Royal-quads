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
      const params = new URLSearchParams(location.search);
      const quadParam = params.get('quad');
      if (quadParam) {
        const quadId = Number(quadParam);
        if (data.find(q => q.id === quadId && q.status === 'available')) {
          setSelectedQuad(quadId);
        }
      }
    }).catch(console.error);

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setCustomerName(u.name || '');
      setCustomerPhone(u.phone || '');
    }
  }, [location.search]);

  const availableQuads = quads.filter(q => q.status === 'available');
  const originalPrice = PRICING.find(p => p.duration === selectedDuration)?.price ?? 0;
  const discountedPrice = promoDiscount > 0
    ? Math.round(originalPrice * (1 - promoDiscount / 100))
    : originalPrice;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError('');
    setPromoSuccess('');
    try {
      const promo = await api.validatePromotion(promoCode.trim());
      setPromoDiscount(promo.discountPercentage);
      setPromoSuccess(`${promo.discountPercentage}% discount applied! 🎉`);
    } catch (err: unknown) {
      setPromoDiscount(0);
      setPromoError(err instanceof Error ? err.message : 'Invalid promo code');
    }
  };

  const validatePhone = (phone: string) => /^0[17]\d{8}$/.test(phone.replace(/\s/g, ''));

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuad || !selectedDuration || !customerName.trim() || !customerPhone.trim()) {
      setError('Please fill in all fields'); return;
    }
    if (!validatePhone(customerPhone)) {
      setError('Enter a valid Kenyan phone number (e.g. 0712345678)'); return;
    }
    setLoading(true);
    setError('');
    try {
      const storedUser = localStorage.getItem('user');
      const userId = storedUser ? JSON.parse(storedUser).id : null;
      const data = await api.createBooking({
        quadId: selectedQuad, userId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.replace(/\s/g, ''),
        duration: selectedDuration,
        price: discountedPrice,
        originalPrice,
        promoCode: promoDiscount > 0 ? promoCode.toUpperCase() : null,
      });
      setTimeout(() => navigate(`/ride/${data.id}`), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to book');
      setLoading(false);
    }
  };

  const copyTill = () => {
    navigator.clipboard.writeText('6685024').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inputCls = 'w-full p-4 rounded-2xl border-2 border-stone-200 bg-white focus:border-emerald-600 focus:outline-none transition-colors text-stone-900 placeholder:text-stone-400';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">

      {/* Hero */}
      <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-1 tracking-tight">Ride the Dunes 🏍️</h1>
          <p className="text-emerald-100 mb-4 text-sm">Experience Mambrui like never before.</p>
          <a href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors">
            <MapPin className="w-4 h-4" /> Mambrui Sand Dunes
          </a>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500 rounded-full blur-3xl opacity-40 pointer-events-none" />
      </div>

      <form onSubmit={handleBook} className="flex flex-col gap-6">

        {/* Step 1 — Select Quad */}
        <section>
          <StepHeader step={1} title="Select Quad" />
          {availableQuads.length === 0 ? (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl flex items-start gap-3 border border-amber-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">No quads available right now. Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableQuads.map(quad => (
                <button key={quad.id} type="button" onClick={() => setSelectedQuad(quad.id)}
                  className={cn(
                    'p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-2 active:scale-[0.98]',
                    selectedQuad === quad.id
                      ? 'border-emerald-600 bg-emerald-50 shadow-md shadow-emerald-100'
                      : 'border-stone-200 bg-white hover:border-emerald-300'
                  )}>
                  {quad.imageUrl ? (
                    <img src={quad.imageUrl} alt={quad.name} className="w-full h-20 object-cover rounded-xl border border-stone-100" />
                  ) : (
                    <div className="w-full h-20 bg-stone-100 rounded-xl flex items-center justify-center text-3xl">🏍️</div>
                  )}
                  <div>
                    <div className="font-bold text-stone-900 text-sm">{quad.name}</div>
                    <div className="text-xs text-emerald-600 font-semibold mt-0.5">Available ✓</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Step 2 — Duration */}
        <section>
          <StepHeader step={2} title="Duration" />
          <div className="grid grid-cols-3 gap-2">
            {PRICING.map(p => (
              <button key={p.duration} type="button" onClick={() => setSelectedDuration(p.duration)}
                className={cn(
                  'p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1 active:scale-[0.97]',
                  selectedDuration === p.duration
                    ? 'border-emerald-600 bg-emerald-50 shadow-md shadow-emerald-100'
                    : 'border-stone-200 bg-white hover:border-emerald-300'
                )}>
                <Clock className={cn('w-5 h-5', selectedDuration === p.duration ? 'text-emerald-600' : 'text-stone-400')} />
                <div className="font-bold text-sm">{p.label}</div>
                <div className="text-xs font-medium text-stone-500">{p.price.toLocaleString()} KES</div>
              </button>
            ))}
          </div>
        </section>

        {/* Step 3 — Details */}
        <section>
          <StepHeader step={3} title="Your Details" />
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Full Name" value={customerName}
              onChange={e => setCustomerName(e.target.value)} className={inputCls} required />
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input type="tel" placeholder="M-Pesa Number (e.g. 0712345678)" value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className={cn(inputCls, 'pl-12')} required maxLength={13} />
            </div>
          </div>
        </section>

        {/* Step 4 — Promo */}
        <section>
          <StepHeader step={4} title="Promo Code (Optional)" />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input type="text" placeholder="Enter code" value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); setPromoSuccess(''); }}
                  className={cn(inputCls, 'pl-12 uppercase tracking-wider')} />
              </div>
              <button type="button" onClick={handleApplyPromo} disabled={!promoCode.trim()}
                className="bg-stone-200 text-stone-900 px-5 rounded-2xl font-bold hover:bg-stone-300 transition-colors disabled:opacity-40">
                Apply
              </button>
            </div>
            {promoError   && <p className="text-red-600   text-sm pl-2">⚠ {promoError}</p>}
            {promoSuccess && <p className="text-emerald-600 text-sm pl-2">{promoSuccess}</p>}
          </div>
        </section>

        {/* Step 5 — Payment */}
        <section>
          <StepHeader step={5} title="Payment Instructions" />
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-emerald-900">M-Pesa Buy Goods & Services</div>
                <div className="text-sm text-emerald-700 mt-0.5">Pay to the till below before confirming.</div>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-stone-500 text-sm">Till Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xl tracking-widest text-stone-900">6685024</span>
                  <button type="button" onClick={copyTill}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors text-stone-500"
                    title="Copy till number">
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 text-sm">Name</span>
                <span className="font-semibold text-sm text-stone-900 text-right">YUSUF OMAR SHEIKH AHMED TAIB</span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-stone-100">
                <span className="text-stone-500 text-sm">Amount</span>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 text-lg">
                    {discountedPrice ? `${discountedPrice.toLocaleString()} KES` : '— KES'}
                  </span>
                  {promoDiscount > 0 && originalPrice > 0 && (
                    <div className="text-xs text-stone-400 line-through">{originalPrice.toLocaleString()} KES</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && <ErrorMessage message={error} />}

        <button type="submit"
          disabled={!selectedQuad || !selectedDuration || !customerName || !customerPhone || loading}
          className="w-full bg-stone-900 text-white p-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors mt-2 shadow-xl shadow-stone-900/20 active:scale-[0.99]">
          {loading ? (
            <><Spinner /> Confirming Payment...</>
          ) : (
            <> Confirm Payment <ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </form>
    </motion.div>
  );
}
