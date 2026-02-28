import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, MapPin, CreditCard, ChevronRight, AlertCircle, Phone, Tag } from 'lucide-react';
import { cn } from '../lib/utils';

const PRICING = [
  { duration: 5, price: 1000, label: '5 min' },
  { duration: 10, price: 1800, label: '10 min' },
  { duration: 15, price: 2200, label: '15 min' },
  { duration: 20, price: 2500, label: '20 min' },
  { duration: 30, price: 3500, label: '30 min' },
  { duration: 60, price: 6000, label: '1 hour' },
];

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [quads, setQuads] = useState<any[]>([]);
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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/quads')
      .then(res => res.json())
      .then(data => {
        setQuads(data);
        const params = new URLSearchParams(location.search);
        const quadParam = params.get('quad');
        if (quadParam) {
          const quadId = Number(quadParam);
          const quad = data.find((q: any) => q.id === quadId && q.status === 'available');
          if (quad) {
            setSelectedQuad(quadId);
          }
        }
      });

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setCustomerName(parsedUser.name);
      setCustomerPhone(parsedUser.phone);
    }
  }, []);

  const availableQuads = quads.filter(q => q.status === 'available');

  const originalPrice = PRICING.find(p => p.duration === selectedDuration)?.price || 0;
  const selectedPrice = promoDiscount > 0 
    ? Math.max(0, originalPrice - (originalPrice * (promoDiscount / 100)))
    : originalPrice;

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setPromoError('');
    setPromoSuccess('');
    
    try {
      const res = await fetch(`/api/promotions/validate/${promoCode}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Invalid promo code');
      
      setPromoDiscount(data.discountPercentage);
      setPromoSuccess(`${data.discountPercentage}% discount applied!`);
    } catch (err: any) {
      setPromoDiscount(0);
      setPromoError(err.message);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuad || !selectedDuration || !customerName || !customerPhone) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quadId: selectedQuad,
          userId: user?.id,
          customerName,
          customerPhone,
          duration: selectedDuration,
          price: selectedPrice,
          originalPrice: originalPrice,
          promoCode: promoDiscount > 0 ? promoCode : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book');

      // Simulate M-Pesa prompt delay
      setTimeout(() => {
        navigate(`/ride/${data.id}`);
      }, 1500);
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Ride the Dunes</h1>
          <p className="text-emerald-100 mb-4">Experience Mambrui like never before.</p>
          <a 
            href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Mambrui Sand Dunes
          </a>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500 rounded-full blur-3xl opacity-50" />
      </div>

      <form onSubmit={handleBook} className="flex flex-col gap-6">
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="bg-stone-200 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
            Select Quad
          </h2>
          {availableQuads.length === 0 ? (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl flex items-start gap-3 border border-amber-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">No quads available right now. Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableQuads.map(quad => (
                <button
                  key={quad.id}
                  type="button"
                  onClick={() => setSelectedQuad(quad.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2",
                    selectedQuad === quad.id 
                      ? "border-emerald-600 bg-emerald-50 shadow-sm" 
                      : "border-stone-200 bg-white hover:border-emerald-200"
                  )}
                >
                  {quad.imageUrl ? (
                    <img src={quad.imageUrl} alt={quad.name} className="w-full h-24 object-cover rounded-xl border border-stone-200" />
                  ) : (
                    <div className="w-full h-24 bg-stone-100 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400">
                      <Tag className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-stone-900">{quad.name}</div>
                    <div className="text-xs text-emerald-600 font-medium mt-1">Available</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="bg-stone-200 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
            Duration
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {PRICING.map(p => (
              <button
                key={p.duration}
                type="button"
                onClick={() => setSelectedDuration(p.duration)}
                className={cn(
                  "p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1",
                  selectedDuration === p.duration 
                    ? "border-emerald-600 bg-emerald-50 shadow-sm" 
                    : "border-stone-200 bg-white hover:border-emerald-200"
                )}
              >
                <Clock className={cn("w-5 h-5", selectedDuration === p.duration ? "text-emerald-600" : "text-stone-400")} />
                <div className="font-bold text-sm">{p.label}</div>
                <div className="text-xs font-medium text-stone-500">{p.price} KES</div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="bg-stone-200 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
            Your Details
          </h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Full Name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-stone-200 bg-white focus:border-emerald-600 focus:outline-none transition-colors"
              required
            />
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="tel"
                placeholder="M-Pesa Number (e.g. 0712345678)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full p-4 pl-12 rounded-2xl border-2 border-stone-200 bg-white focus:border-emerald-600 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="bg-stone-200 w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
            Promo Code
          </h2>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full p-4 pl-12 rounded-2xl border-2 border-stone-200 bg-white focus:border-emerald-600 focus:outline-none transition-colors uppercase"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={!promoCode}
                className="bg-stone-200 text-stone-900 px-6 rounded-2xl font-bold hover:bg-stone-300 transition-colors disabled:opacity-50"
              >
                Apply
              </button>
            </div>
            {promoError && <p className="text-red-600 text-sm pl-2">{promoError}</p>}
            {promoSuccess && <p className="text-emerald-600 text-sm pl-2">{promoSuccess}</p>}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="bg-stone-200 w-6 h-6 rounded-full flex items-center justify-center text-sm">5</span>
            Payment Instructions
          </h2>
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-emerald-900">M-Pesa Buy Goods & Services</div>
                <div className="text-sm text-emerald-700 mt-1">Please make your payment to the till number below before confirming your booking.</div>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-stone-500 text-sm">Till Number</span>
                <span className="font-mono font-bold text-lg tracking-wider text-stone-900">6685024</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 text-sm">Name</span>
                <span className="font-bold text-sm text-stone-900 text-right">YUSUF OMAR SHEIKH AHMED TAIB</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-stone-100">
                <span className="text-stone-500 text-sm">Amount to Pay</span>
                <span className="font-bold text-emerald-600">{selectedPrice ? `${selectedPrice} KES` : '0 KES'}</span>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedQuad || !selectedDuration || !customerName || !customerPhone || loading}
          className="w-full bg-stone-900 text-white p-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors mt-4 shadow-xl shadow-stone-900/20"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Confirming Payment...
            </div>
          ) : (
            <>
              Confirm Payment
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
