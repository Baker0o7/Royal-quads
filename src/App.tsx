import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { format } from 'date-fns';
import { 
  Bike, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  CreditCard,
  ChevronRight,
  Menu,
  X,
  Phone,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

// --- Types ---
type Quad = { id: number; name: string; status: 'available' | 'rented'; emoji: string };
type Pricing = { dur: number; price: number; label: string; popular?: boolean };

// --- Constants ---
const M_PESA_TILL = '6685024';
const WHATSAPP_NUM = '254784589999';

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [step, setStep] = useState(1);
  const [quads, setQuads] = useState<Quad[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking State
  const [selectedQuad, setSelectedQuad] = useState<Quad | null>(null);
  const [selectedDur, setSelectedDur] = useState<Pricing | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState<{text: string, type: 'ok'|'err'} | null>(null);
  
  const [form, setForm] = useState({
    fName: '', lName: '', phone: '', email: '', notes: '', waiver: false
  });
  
  const [mpesaRef, setMpesaRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticket, setTicket] = useState<any>(null);

  // Fetch initial data
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    fetchData();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchData = async () => {
    try {
      // In a real app, this might come from Supabase. For this replica, we'll use the original API
      const res = await fetch('https://raw.githubusercontent.com/Baker0o7/Royal-quads/main/docs/data.json?t=' + Date.now());
      const data = await res.json();
      setQuads(data.quads || []);
      setPricing(data.pricing || []);
    } catch (e) {
      // Fallback data if fetch fails
      setQuads([
        { id: 1, name: 'Quad 1', status: 'available', emoji: '🏍️' },
        { id: 2, name: 'Quad 2', status: 'available', emoji: '🏍️' },
        { id: 3, name: 'Quad 3', status: 'available', emoji: '🏍️' },
        { id: 4, name: 'Quad 4', status: 'available', emoji: '🏍️' },
        { id: 5, name: 'Quad 5', status: 'available', emoji: '🏍️' }
      ]);
      setPricing([
        { dur: 5, price: 1000, label: '5 min' },
        { dur: 10, price: 1800, label: '10 min' },
        { dur: 15, price: 2200, label: '15 min' },
        { dur: 20, price: 2500, label: '20 min', popular: true },
        { dur: 30, price: 3500, label: '30 min' },
        { dur: 60, price: 6000, label: '1 hr' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const basePrice = selectedDur?.price || 0;
  const finalPrice = discount ? Math.round(basePrice * (1 - discount / 100)) : basePrice;
  const fullName = `${form.fName} ${form.lName}`.trim();

  // Handlers
  const handlePromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) { setPromoMsg({text: 'Please enter a code', type: 'err'}); return; }
    
    // Mock promo logic matching original
    const promos: Record<string, number> = { DUNES20: 20, MAMBRUI10: 10, WELCOME25: 25 };
    if (promos[code]) {
      setDiscount(promos[code]);
      setPromoMsg({text: `✓ "${code}" applied — ${promos[code]}% off!`, type: 'ok'});
    } else {
      setDiscount(0);
      setPromoMsg({text: '✗ Invalid or expired code', type: 'err'});
    }
  };

  const copyTill = () => {
    navigator.clipboard.writeText(M_PESA_TILL);
    // Could add a toast here
  };

  const confirmBooking = async () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      const id = 'RQ-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      setTicket({
        id,
        quad: selectedQuad?.name,
        name: fullName,
        phone: form.phone,
        dur: selectedDur?.dur,
        date: new Date(),
        ref: mpesaRef,
        total: finalPrice
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const shareWA = () => {
    if (!ticket) return;
    const msg = encodeURIComponent(`🏍️ *BOOKING CONFIRMED — Royal Quad Bikes*

📋 Receipt: ${ticket.id}
👤 Customer: ${ticket.name}
📞 Phone: ${ticket.phone}
🏍️ Quad: ${ticket.quad}
⏱️ Duration: ${ticket.dur} min
💰 Total: KES ${ticket.total.toLocaleString()}
📱 M-Pesa: ${ticket.ref}

📍 Mambrui Sand Dunes, Kilifi County, Kenya`);
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${msg}`, '_blank');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-sky-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-sky-50 font-sans text-slate-800 selection:bg-sky-400 selection:text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 md:px-16 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-sky-100' : 'bg-transparent'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-sky-200 p-0.5 shadow-[0_0_0_3px_rgba(14,165,233,0.1)]">
            <img src="https://raw.githubusercontent.com/Baker0o7/Royal-quads/flutter/assets/images/logo.png" alt="Logo" className="w-full h-full rounded-full object-cover" />
          </div>
          <span className="font-serif font-bold text-lg text-slate-900">Royal Quad Bikes</span>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-semibold text-green-700">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"></div>
          Open · Mambrui
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center text-center px-4 pt-24 pb-16 overflow-hidden bg-gradient-to-b from-sky-50 via-sky-100 to-sky-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_110%_70%_at_50%_-5%,rgba(14,165,233,0.1)_0%,transparent_60%)] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-8 text-[10px] font-mono font-medium text-sky-600 tracking-[0.2em] uppercase">
            <div className="w-6 h-px bg-sky-300"></div>
            Mambrui Sand Dunes · Kilifi County · Kenya
            <div className="w-6 h-px bg-sky-300"></div>
          </div>
          
          <h1 className="font-serif text-5xl md:text-7xl lg:text-[7.5rem] font-black leading-[0.9] tracking-tight text-slate-900 mb-6">
            Royal<br/>
            <em className="font-normal italic text-sky-500">Quad Bikes</em>
          </h1>
          
          <div className="w-12 h-px bg-gradient-to-r from-sky-200 via-sky-500 to-sky-200 mx-auto my-8"></div>
          
          <p className="text-base md:text-lg text-slate-600 max-w-lg mx-auto mb-10 leading-relaxed font-light">
            Conquer Kenya's most breathtaking coastal dunes. Book in under two minutes — pay with M-Pesa, get instant confirmation.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => document.getElementById('book')?.scrollIntoView({behavior: 'smooth'})}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded font-bold text-sm tracking-wider uppercase shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 transition-all relative overflow-hidden group"
            >
              Book a Ride <ArrowRight className="w-4 h-4" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1s_infinite]"></div>
            </button>
            <button 
              onClick={() => document.getElementById('book')?.scrollIntoView({behavior: 'smooth'})}
              className="inline-flex items-center gap-2 bg-sky-500/5 text-slate-800 border-2 border-sky-200 px-8 py-4 rounded font-bold text-sm tracking-wider uppercase hover:bg-sky-50 hover:border-sky-400 transition-all"
            >
              View Pricing
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-20 pt-10 border-t border-sky-200/60">
            {[
              { n: '6', l: 'Ride Durations' },
              { n: '1,000', l: 'From KES' },
              { n: 'M-Pesa', l: 'Instant Pay' },
              { n: '100%', l: 'Outdoor Thrill' }
            ].map(s => (
              <div key={s.l}>
                <span className="block font-serif text-3xl md:text-4xl font-bold text-slate-900 mb-1">{s.n}</span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-sky-600/70">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="book" className="py-20 px-4 md:px-12 bg-gradient-to-b from-sky-50 to-sky-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start">
          
          {/* Main Booking Flow */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-sky-500"></div>
              <span className="font-mono text-[10px] font-medium tracking-[0.2em] uppercase text-sky-600">Reservation</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-10 tracking-tight">
              Book Your<br/><em className="font-normal italic text-sky-500">Adventure</em>
            </h2>

            {/* Stepper */}
            <div className="mb-10">
              <div className="flex items-center mb-4">
                {[1, 2, 3, 4].map((num, i) => (
                  <React.Fragment key={num}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                      step === num ? 'bg-slate-900 text-white border-2 border-slate-900' :
                      step > num ? 'bg-sky-500 text-white border-2 border-sky-500' :
                      'bg-sky-100 text-sky-400 border-2 border-sky-200'
                    }`}>
                      {step > num ? '✓' : num}
                    </div>
                    {i < 3 && <div className={`flex-1 h-px mx-1 transition-colors ${step > num ? 'bg-sky-500' : 'bg-sky-200'}`}></div>}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase text-sky-600/70 px-1">
                <span className={step >= 1 ? 'text-slate-900' : ''}>Quad</span>
                <span className={step >= 2 ? 'text-slate-900' : ''}>Duration</span>
                <span className={step >= 3 ? 'text-slate-900' : ''}>Details</span>
                <span className={step >= 4 ? 'text-slate-900' : ''}>Pay</span>
              </div>
            </div>

            {/* Panels */}
            <div className="relative min-h-[400px]">
              {/* Step 1: Quad */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mb-2">Choose your quad</h3>
                  <p className="text-sm text-slate-600 mb-8">All bikes maintained daily. Green badge means ready to ride right now.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                    {quads.map(q => (
                      <div 
                        key={q.id}
                        onClick={() => q.status === 'available' && setSelectedQuad(q)}
                        className={`relative p-5 rounded-xl border-2 text-center transition-all ${
                          q.status === 'rented' ? 'opacity-40 cursor-not-allowed bg-white border-sky-100' :
                          selectedQuad?.id === q.id ? 'border-sky-500 bg-sky-50 shadow-[0_0_0_3px_rgba(14,165,233,0.1),0_4px_20px_rgba(14,165,233,0.15)] -translate-y-1 cursor-pointer' :
                          'bg-white border-sky-100 hover:border-sky-300 hover:-translate-y-1 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        {selectedQuad?.id === q.id && <div className="absolute top-2 right-2 w-5 h-5 bg-sky-500 rounded-full text-white flex items-center justify-center text-[10px] font-bold">✓</div>}
                        <div className="text-sky-500 mb-3 flex justify-center"><Bike className="w-10 h-10" /></div>
                        <div className="font-bold text-sm text-slate-900 mb-2">{q.name}</div>
                        <div className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          q.status === 'available' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {q.status === 'available' ? 'Available' : 'In Use'}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-3 mt-8">
                    <button 
                      disabled={!selectedQuad}
                      onClick={() => setStep(2)}
                      className="flex-1 bg-slate-900 text-white py-4 rounded font-bold text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                    >
                      Continue {selectedQuad && <span className="opacity-50 text-xs font-normal ml-1">· {selectedQuad.name}</span>}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Duration */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mb-2">Pick your duration</h3>
                  <p className="text-sm text-slate-600 mb-8">Overtime charged at 100 KES/min automatically after your session ends.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {pricing.map(p => (
                      <div 
                        key={p.dur}
                        onClick={() => setSelectedDur(p)}
                        className={`relative p-5 pt-6 rounded-xl border-2 text-center transition-all cursor-pointer ${
                          selectedDur?.dur === p.dur ? 'border-sky-500 bg-sky-50 shadow-[0_0_0_3px_rgba(14,165,233,0.1),0_4px_20px_rgba(14,165,233,0.15)] -translate-y-1' :
                          'bg-white border-sky-100 hover:border-sky-300 hover:-translate-y-1 hover:shadow-md'
                        }`}
                      >
                        {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono tracking-widest px-3 py-1 rounded-full whitespace-nowrap">MOST POPULAR</div>}
                        <div className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mb-1">{p.label}</div>
                        <div className="font-bold text-sky-600 text-base">{p.price.toLocaleString()}</div>
                        <div className="font-mono text-[10px] text-slate-400 mt-1 uppercase tracking-widest">KES</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-sky-100/50 border border-sky-200 rounded-xl p-5 mb-8">
                    <div className="text-[11px] font-bold tracking-widest uppercase text-sky-700 mb-3 flex items-center gap-2">
                      <span className="text-base">🎟</span> Promo Code
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                        placeholder="Enter code e.g. DUNES20" 
                        className="flex-1 bg-white border border-sky-200 rounded-lg px-4 py-3 font-mono text-sm font-medium uppercase tracking-wider focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                      <button onClick={handlePromo} className="bg-slate-900 text-white px-6 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors">Apply</button>
                    </div>
                    {promoMsg && (
                      <div className={`mt-3 p-3 rounded-lg text-xs font-bold ${promoMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {promoMsg.text}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="px-6 py-4 border border-sky-200 rounded text-slate-500 font-semibold text-sm uppercase tracking-wider hover:border-slate-900 hover:text-slate-900 transition-colors">← Back</button>
                    <button 
                      disabled={!selectedDur}
                      onClick={() => setStep(3)}
                      className="flex-1 bg-slate-900 text-white py-4 rounded font-bold text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Details */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mb-2">Your details</h3>
                  <p className="text-sm text-slate-600 mb-8">We'll send your WhatsApp receipt to this number immediately after the ride.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-widest uppercase text-sky-700">First Name *</label>
                      <input required type="text" value={form.fName} onChange={e => setForm({...form, fName: e.target.value})} placeholder="John" className="w-full bg-white border border-sky-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-widest uppercase text-sky-700">Last Name *</label>
                      <input required type="text" value={form.lName} onChange={e => setForm({...form, lName: e.target.value})} placeholder="Kamau" className="w-full bg-white border border-sky-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-widest uppercase text-sky-700">Phone Number *</label>
                      <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="0712 345 678" className="w-full bg-white border border-sky-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-widest uppercase text-sky-700 flex justify-between">Email <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span></label>
                      <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@gmail.com" className="w-full bg-white border border-sky-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold tracking-widest uppercase text-sky-700 flex justify-between">Special Requests <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span></label>
                      <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="e.g. First time rider, need extra briefing" className="w-full bg-white border border-sky-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm" />
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="text-[11px] font-bold tracking-widest uppercase text-sky-700 mb-3 flex items-center gap-2">
                      <span className="text-base">📋</span> Safety Waiver
                    </div>
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 max-h-48 overflow-y-auto mb-3 space-y-3 text-sm text-slate-700 leading-relaxed shadow-inner">
                      {[
                        "I confirm I am physically fit and capable of operating a quad bike safely.",
                        "I acknowledge that quad biking carries inherent risks and accept full responsibility for my safety.",
                        "I will wear all provided safety gear including helmet and protective clothing at all times.",
                        "I will not operate the quad under the influence of alcohol, drugs or any impairing substance.",
                        "I will follow all operator instructions and stay within designated riding areas.",
                        "I understand overtime beyond my session is billed at 100 KES per minute automatically.",
                        "I agree Royal Quad Bikes is not liable for personal injury arising from my ride.",
                        "I confirm all information is accurate and I am at least 16 years of age."
                      ].map((text, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-5 h-5 rounded-full shrink-0 bg-sky-100 border border-sky-200 flex items-center justify-center font-mono text-[10px] font-bold text-sky-600 mt-0.5">{i+1}</div>
                          <p>{text}</p>
                        </div>
                      ))}
                    </div>
                    <div 
                      onClick={() => setForm({...form, waiver: !form.waiver})}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.waiver ? 'border-green-400 bg-green-50' : 'border-sky-200 bg-white hover:border-sky-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                        form.waiver ? 'bg-green-600 border-green-600 text-white' : 'bg-sky-50 border-sky-200'
                      }`}>
                        {form.waiver && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <span className="font-semibold text-sm text-slate-800">I have read and agree to the safety waiver</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="px-6 py-4 border border-sky-200 rounded text-slate-500 font-semibold text-sm uppercase tracking-wider hover:border-slate-900 hover:text-slate-900 transition-colors">← Back</button>
                    <button 
                      disabled={!(form.fName.length > 1 && form.lName.length > 1 && form.phone.length > 8 && form.waiver)}
                      onClick={() => setStep(4)}
                      className="flex-1 bg-slate-900 text-white py-4 rounded font-bold text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Pay */}
              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mb-2">Pay via M-Pesa</h3>
                  <p className="text-sm text-slate-600 mb-6">Send the exact amount shown, then paste your M-Pesa confirmation code below.</p>
                  
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 mb-4 flex items-center justify-between shadow-xl shadow-slate-900/20 text-white">
                    <div>
                      <div className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-sky-300/70 mb-1">Amount to Send</div>
                      <div className="font-serif text-4xl font-bold text-sky-300 leading-none mb-1">KES {finalPrice.toLocaleString()}</div>
                      <div className="text-xs text-sky-200/50">{selectedQuad?.name} · {selectedDur?.label}</div>
                    </div>
                    <div className="text-5xl opacity-80">📲</div>
                  </div>

                  <div 
                    onClick={copyTill}
                    className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between cursor-pointer hover:bg-green-100/50 transition-colors group"
                  >
                    <div>
                      <div className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-green-700 mb-1">M-Pesa Buy Goods — Till Number</div>
                      <div className="font-mono text-3xl font-medium text-slate-900 tracking-widest">{M_PESA_TILL}</div>
                    </div>
                    <button className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-bold border border-green-200 group-hover:bg-green-600 group-hover:text-white group-hover:border-green-600 transition-all">
                      ⧉ Copy
                    </button>
                  </div>

                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 mb-6 text-sm text-slate-700 space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full shrink-0 bg-sky-100 border border-sky-200 flex items-center justify-center font-mono text-[10px] font-bold text-sky-600 mt-0.5">1</div>
                      <span>Open M-Pesa → <b>Lipa na M-Pesa</b></span>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full shrink-0 bg-sky-100 border border-sky-200 flex items-center justify-center font-mono text-[10px] font-bold text-sky-600 mt-0.5">2</div>
                      <span>Select <b>Buy Goods & Services</b></span>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full shrink-0 bg-sky-100 border border-sky-200 flex items-center justify-center font-mono text-[10px] font-bold text-sky-600 mt-0.5">3</div>
                      <span>Enter till: <b className="font-mono text-green-600">{M_PESA_TILL}</b></span>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full shrink-0 bg-sky-100 border border-sky-200 flex items-center justify-center font-mono text-[10px] font-bold text-sky-600 mt-0.5">4</div>
                      <span>Enter <b>KES {finalPrice.toLocaleString()}</b> and confirm with PIN</span>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full shrink-0 bg-sky-100 border border-sky-200 flex items-center justify-center font-mono text-[10px] font-bold text-sky-600 mt-0.5">5</div>
                      <span>Copy the <b>confirmation code</b> from your SMS</span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-sky-700 block mb-2">M-Pesa Confirmation Code *</label>
                    <input 
                      type="text" 
                      value={mpesaRef}
                      onChange={e => setMpesaRef(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      maxLength={10}
                      placeholder="e.g. QHL2X3P8KA" 
                      className="w-full bg-white border-2 border-sky-200 rounded-lg px-5 py-4 font-mono text-lg font-medium uppercase tracking-[0.2em] focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 shadow-sm" 
                    />
                    <div className="text-xs text-slate-500 mt-2">10-character code from your M-Pesa SMS</div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button onClick={() => setStep(3)} className="px-6 py-4 border border-sky-200 rounded text-slate-500 font-semibold text-sm uppercase tracking-wider hover:border-slate-900 hover:text-slate-900 transition-colors">← Back</button>
                    <button 
                      disabled={mpesaRef.length < 8 || isSubmitting}
                      onClick={confirmBooking}
                      className="flex-1 bg-gradient-to-r from-sky-500 to-sky-400 text-white py-4 rounded font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        'Confirm Booking →'
                      )}
                    </button>
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-4 px-4">By confirming you agree to the safety waiver. Overtime billed at 100 KES/min.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-xl shadow-sky-900/5">
              <div className="text-center pb-5 mb-5 border-b border-sky-100">
                <img src="https://raw.githubusercontent.com/Baker0o7/Royal-quads/flutter/assets/images/logo.png" alt="Logo" className="w-14 h-14 mx-auto rounded-full border-2 border-sky-100 p-0.5 shadow-[0_0_0_4px_rgba(14,165,233,0.05)] mb-3" />
                <h4 className="font-serif font-bold text-lg text-slate-900">Royal Quad Bikes</h4>
                <div className="font-mono text-[10px] text-sky-600/70 tracking-widest mt-1">Mambrui · Kilifi</div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-1 bg-sky-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-sky-400 to-sky-300 transition-all duration-500 ease-out" style={{width: `${((step-1)/3)*100}%`}}></div>
                </div>
                <div className="font-mono text-[10px] text-slate-400 tracking-wider">Step {step} of 4 {step === 4 && '— Ready to pay!'}</div>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Quad</span>
                  <span className="font-bold text-slate-900 text-right">{selectedQuad?.name || '—'}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-bold text-slate-900 text-right">{selectedDur?.label || '—'}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Base price</span>
                  <span className="font-bold text-slate-900 text-right">{basePrice ? `${basePrice.toLocaleString()} KES` : '—'}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-baseline text-green-600">
                    <span className="text-green-600/80">Discount</span>
                    <span className="font-bold text-right text-xs">-{Math.round(basePrice * (discount/100)).toLocaleString()} KES ({discount}%)</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Name</span>
                  <span className="font-bold text-slate-900 text-right truncate max-w-[150px]">{fullName || '—'}</span>
                </div>
              </div>

              <div className="bg-sky-50 border-2 border-sky-100 rounded-xl p-4 flex justify-between items-center">
                <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-sky-700">Total</span>
                <span className="font-serif text-2xl font-bold text-sky-600">
                  {finalPrice ? `KES ${finalPrice.toLocaleString()}` : 'KES —'}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-xl shadow-sky-900/5">
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-sky-700 mb-4">Good to Know</h4>
              
              <div className="space-y-4">
                <div className="flex gap-3 pb-4 border-b border-sky-50">
                  <Clock className="w-5 h-5 text-sky-400 shrink-0" />
                  <div>
                    <div className="font-bold text-sm text-slate-900 mb-0.5">Overtime Policy</div>
                    <div className="text-xs text-slate-500 leading-relaxed">100 KES/min charged live after session ends.</div>
                  </div>
                </div>
                <div className="flex gap-3 pb-4 border-b border-sky-50">
                  <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
                  <div>
                    <div className="font-bold text-sm text-slate-900 mb-0.5">Safety Gear</div>
                    <div className="text-xs text-slate-500 leading-relaxed">Helmet + clothing provided. Briefing every ride.</div>
                  </div>
                </div>
                <div className="flex gap-3 pb-4 border-b border-sky-50">
                  <MapPin className="w-5 h-5 text-sky-400 shrink-0" />
                  <div>
                    <div className="font-bold text-sm text-slate-900 mb-0.5">Location</div>
                    <div className="text-xs text-slate-500 leading-relaxed">Mambrui Dunes, Kilifi County — near Malindi.</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl overflow-hidden border border-sky-100 shadow-sm relative h-32 bg-slate-100">
                {/* Simulated Map */}
                <iframe 
                  src="https://www.openstreetmap.org/export/embed.html?bbox=40.1197%2C-3.3785%2C40.1497%2C-3.3485&layer=mapnik&marker=-3.3635%2C40.1347" 
                  className="w-full h-full border-0 pointer-events-none opacity-80"
                  title="Map"
                ></iframe>
                <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                  <a href="https://maps.google.com/?q=-3.3635,40.1347" target="_blank" rel="noreferrer" className="flex-1 bg-white/90 backdrop-blur text-indigo-600 text-[10px] font-bold py-2 rounded shadow-sm text-center border border-indigo-100 hover:bg-white transition-colors">🗺 Open Maps</a>
                  <a href="https://www.google.com/maps/dir/?api=1&destination=-3.3635,40.1347" target="_blank" rel="noreferrer" className="flex-1 bg-green-500/90 backdrop-blur text-white text-[10px] font-bold py-2 rounded shadow-sm text-center border border-green-600 hover:bg-green-500 transition-colors">🧭 Directions</a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sky-100 py-8 text-center font-mono text-xs text-slate-500 border-t border-sky-200">
        © {new Date().getFullYear()} <span className="text-sky-600 font-bold">Royal Quad Bikes</span> · Mambrui, Kilifi County, Kenya · M-Pesa Till <span className="text-sky-600 font-bold">{M_PESA_TILL}</span>
      </footer>

      {/* WhatsApp FAB */}
      <a 
        href={`https://wa.me/${WHATSAPP_NUM}?text=Hi,%20I%20want%20to%20book%20a%20quad%20ride%20at%20Mambrui%20Sand%20Dunes`} 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center text-3xl shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:scale-110 hover:shadow-[0_8px_30px_rgba(37,211,102,0.5)] transition-all z-40"
      >
        💬
      </a>

      {/* Success Overlay */}
      {ticket && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 md:p-10 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-300 via-sky-500 to-sky-300"></div>
            
            <div className="w-16 h-16 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <h3 className="font-serif text-3xl font-bold text-center text-slate-900 mb-2">You're Booked!</h3>
            <p className="text-center text-sm text-slate-600 mb-8 leading-relaxed">
              Hi {form.fName}! Your {ticket.dur}-min ride on {ticket.quad} is confirmed. Show this ticket at the dunes.
            </p>

            <div className="bg-sky-50 border border-sky-100 rounded-2xl overflow-hidden mb-8">
              <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                <span className="font-serif font-bold text-sm">Royal Quad Bikes</span>
                <span className="font-mono text-[10px] bg-sky-500/20 text-sky-300 px-2 py-1 rounded border border-sky-500/30">{ticket.id}</span>
              </div>
              <div className="h-0.5 bg-[repeating-linear-gradient(90deg,#bae6fd_0,#bae6fd_8px,transparent_8px,transparent_16px)]"></div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Quad</span><span className="font-bold text-slate-900">{ticket.quad}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-bold text-slate-900">{ticket.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-bold text-slate-900">{ticket.phone}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Duration</span><span className="font-bold text-slate-900">{ticket.dur} min</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-bold text-slate-900">{format(ticket.date, 'E, MMM d, yyyy')}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">M-Pesa</span><span className="font-mono font-bold text-green-600">{ticket.ref}</span></div>
              </div>
              <div className="bg-sky-100/50 p-4 border-t border-sky-200 flex justify-between items-center">
                <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-sky-700">Total Paid</span>
                <span className="font-serif text-2xl font-bold text-sky-600">KES {ticket.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={shareWA}
                className="flex-1 bg-[#25D366] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#1fae54] transition-colors flex items-center justify-center gap-2"
              >
                💬 Share on WhatsApp
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-xl font-bold text-sm hover:border-slate-900 hover:text-slate-900 transition-colors"
              >
                Book Another
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}