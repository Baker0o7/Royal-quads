import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Calendar, Tag, Plus, Power, Edit2, X, Save, QrCode, Navigation, Trash2, RefreshCw, Users, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../lib/api';
import { EmptyState, ErrorMessage, StatusBadge } from '../lib/components/ui';
import type { Quad, Booking, Promotion, SalesData } from '../types';

type Tab = 'overview' | 'promotions' | 'inventory';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('overview');
  const [sales, setSales] = useState<SalesData>({ total: 0, today: 0 });
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [history, setHistory] = useState<Booking[]>([]);
  const [quads, setQuads] = useState<Quad[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [newQuadName, setNewQuadName] = useState('');
  const [newQuadImage, setNewQuadImage] = useState('');
  const [newQuadImei, setNewQuadImei] = useState('');
  const [quadError, setQuadError] = useState('');
  const [editingQuadId, setEditingQuadId] = useState<number | null>(null);
  const [editQuadData, setEditQuadData] = useState({ name: '', imageUrl: '', imei: '' });
  const [showQrFor, setShowQrFor] = useState<number | null>(null);

  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');
  const [promoError, setPromoError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [s, active, hist, promos, qs] = await Promise.all([
        api.getSales(), api.getActiveBookings(), api.getBookingHistory(), api.getPromotions(), api.getQuads(),
      ]);
      setSales(s); setActiveBookings(active); setHistory(hist); setPromotions(promos); setQuads(qs);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15_000); return () => clearInterval(i); }, [fetchData]);

  const handleRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault(); setPromoError('');
    try { await api.createPromotion(newPromoCode, parseInt(newPromoDiscount)); setNewPromoCode(''); setNewPromoDiscount(''); fetchData(); }
    catch (err: unknown) { setPromoError(err instanceof Error ? err.message : 'Error'); }
  };

  const handleCreateQuad = async (e: React.FormEvent) => {
    e.preventDefault(); setQuadError('');
    try { await api.createQuad({ name: newQuadName.trim(), imageUrl: newQuadImage || undefined, imei: newQuadImei || undefined }); setNewQuadName(''); setNewQuadImage(''); setNewQuadImei(''); fetchData(); }
    catch (err: unknown) { setQuadError(err instanceof Error ? err.message : 'Error'); }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'promotions', label: 'Promotions' },
    { key: 'inventory', label: 'Fleet' },
  ];

  const statCard = (icon: React.ReactNode, label: string, value: string, accent = false) => (
    <div className={cn('rounded-2xl p-5 border', accent
      ? 'bg-gradient-to-br from-[#2d2318] to-[#1a1612] border-[#c9972a]/20 text-white'
      : 'bg-white/70 dark:bg-[#1a1612]/70 border-[#c9b99a]/20 dark:border-[#c9b99a]/8 text-[#1a1612] dark:text-[#f5f0e8]')}>
      <div className={cn('mb-2', accent ? 'text-[#c9972a]' : 'text-[#7a6e60] dark:text-[#a09070]')}>{icon}</div>
      <p className="font-display font-bold text-2xl">{value}</p>
      <p className={cn('font-mono text-[10px] uppercase tracking-wider mt-0.5', accent ? 'text-[#c9b99a]/50' : 'text-[#7a6e60] dark:text-[#a09070]')}>{label}</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-[#1a1612] dark:text-[#f5f0e8]">Dashboard</h1>
          <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] tracking-wider uppercase mt-0.5">Royal Quads Admin</p>
        </div>
        <button onClick={handleRefresh}
          className="p-2.5 rounded-xl bg-white/70 dark:bg-[#1a1612]/70 border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 text-[#7a6e60] hover:text-[#c9972a] transition-colors">
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#e8dfc9]/50 dark:bg-[#1a1612]/50 p-1 rounded-2xl gap-1 border border-[#c9b99a]/20 dark:border-[#c9b99a]/10">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('flex-1 py-2 px-3 rounded-xl font-semibold text-xs transition-all',
              tab === t.key
                ? 'bg-white dark:bg-[#2d2318] shadow-sm text-[#1a1612] dark:text-[#f5f0e8]'
                : 'text-[#7a6e60] dark:text-[#a09070] hover:text-[#1a1612] dark:hover:text-[#f5f0e8]')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {statCard(<TrendingUp className="w-4 h-4" />, "Today's Revenue", `${sales.today.toLocaleString()} KES`, true)}
            {statCard(<Calendar className="w-4 h-4" />, 'Total Revenue', `${sales.total.toLocaleString()} KES`)}
            {statCard(<Activity className="w-4 h-4" />, 'Active Now', `${activeBookings.length}`)}
            {statCard(<Users className="w-4 h-4" />, 'Total Rides', `${history.length}`)}
          </div>

          <section>
            <h2 className="font-display text-sm font-bold mb-3 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live Rides ({activeBookings.length})
            </h2>
            {activeBookings.length === 0 ? <EmptyState message="No active rides." /> : (
              <div className="flex flex-col gap-3">
                {activeBookings.map(b => {
                  const end = new Date(b.startTime).getTime() + b.duration * 60_000;
                  const minsLeft = Math.max(0, Math.floor((end - Date.now()) / 60_000));
                  return (
                    <div key={b.id} className="bg-white/70 dark:bg-[#1a1612]/70 p-4 rounded-2xl border border-emerald-200/40 dark:border-emerald-800/30 backdrop-blur-sm">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{b.quadName}</p>
                        <span className={cn('text-[10px] font-mono font-bold px-2 py-0.5 rounded-full',
                          minsLeft > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400')}>
                          {minsLeft > 0 ? `${minsLeft}m left` : 'Overtime'}
                        </span>
                      </div>
                      <p className="text-xs text-[#7a6e60] dark:text-[#a09070] font-mono">{b.customerName} · {b.customerPhone}</p>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#c9b99a]/10 dark:border-[#c9b99a]/5">
                        <span className="text-[10px] font-mono text-[#7a6e60] dark:text-[#a09070]">Since {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <div className="flex gap-2">
                          {b.quadImei && (
                            <Link to={`/track/${b.quadImei}`}
                              className="text-[10px] font-semibold text-[#c9972a] bg-[#c9972a]/8 dark:bg-[#c9972a]/10 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-[#c9972a]/15 transition-colors">
                              <Navigation className="w-3 h-3" /> Track
                            </Link>
                          )}
                          <button onClick={() => { if (confirm('Force complete this ride?')) api.completeBooking(b.id).then(fetchData); }}
                            className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/15 px-2 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/25 transition-colors">
                            End
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-sm font-bold mb-3 text-[#1a1612] dark:text-[#f5f0e8]">Recent Rides</h2>
            {history.length === 0 ? <EmptyState message="No completed rides yet." /> : (
              <div className="flex flex-col gap-2">
                {history.slice(0, 15).map(b => (
                  <div key={b.id} className="bg-white/70 dark:bg-[#1a1612]/70 px-4 py-3 rounded-xl border border-[#c9b99a]/15 dark:border-[#c9b99a]/8 flex justify-between items-center backdrop-blur-sm">
                    <div>
                      <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{b.quadName}</p>
                      <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">{b.customerName} · {b.duration}min</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-sm text-[#c9972a]">+{b.price.toLocaleString()} KES</p>
                      {b.endTime && <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">{new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ── PROMOTIONS ── */}
      {tab === 'promotions' && (
        <>
          <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
            <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]">
              <Plus className="w-4 h-4 text-[#c9972a]" /> New Promo Code
            </h2>
            <form onSubmit={handleCreatePromo} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input type="text" placeholder="CODE" value={newPromoCode}
                  onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                  className="input flex-1 uppercase font-mono tracking-widest" required />
                <div className="relative w-24">
                  <input type="number" placeholder="%" value={newPromoDiscount}
                    onChange={e => setNewPromoDiscount(e.target.value)} min="1" max="100"
                    className="input pr-6" required />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6e60] text-sm font-bold pointer-events-none">%</span>
                </div>
              </div>
              {promoError && <ErrorMessage message={promoError} />}
              <button type="submit" className="btn-primary">Create Code</button>
            </form>
          </div>

          <section>
            <h2 className="font-display text-sm font-bold mb-3 text-[#1a1612] dark:text-[#f5f0e8]">Promo Codes ({promotions.length})</h2>
            {promotions.length === 0 ? <EmptyState message="No promo codes yet." /> : (
              <div className="flex flex-col gap-3">
                {promotions.map(p => (
                  <div key={p.id}
                    className={cn('p-4 rounded-2xl border flex justify-between items-center',
                      p.isActive ? 'bg-white/70 dark:bg-[#1a1612]/70 border-[#c9b99a]/20 dark:border-[#c9b99a]/8' : 'bg-[#f5f0e8]/40 dark:bg-[#1a1612]/30 border-[#c9b99a]/10 dark:border-[#c9b99a]/5 opacity-60')}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold tracking-widest text-sm text-[#1a1612] dark:text-[#f5f0e8]">{p.code}</span>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold',
                          p.isActive ? 'bg-[#c9972a]/10 text-[#c9972a]' : 'bg-[#7a6e60]/10 text-[#7a6e60]')}>
                          {p.discountPercentage}% OFF
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] mt-0.5">{p.isActive ? '● Active' : '○ Inactive'}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => api.togglePromotion(p.id, !p.isActive).then(fetchData)}
                        className={cn('p-2 rounded-xl transition-colors',
                          p.isActive ? 'bg-red-50 dark:bg-red-900/15 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/25' : 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/25')}>
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this promo code?')) api.deletePromotion(p.id).then(fetchData); }}
                        className="p-2 rounded-xl bg-[#f5f0e8] dark:bg-[#2d2318] text-[#7a6e60] hover:bg-red-50 dark:hover:bg-red-900/15 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ── FLEET ── */}
      {tab === 'inventory' && (
        <>
          <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
            <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]">
              <Plus className="w-4 h-4 text-[#c9972a]" /> Add Quad
            </h2>
            <form onSubmit={handleCreateQuad} className="flex flex-col gap-3">
              <input type="text" placeholder="Quad Name" value={newQuadName} onChange={e => setNewQuadName(e.target.value)} className="input" required />
              <input type="url" placeholder="Image URL (optional)" value={newQuadImage} onChange={e => setNewQuadImage(e.target.value)} className="input" />
              <input type="text" placeholder="IMEI for GPS tracking (optional)" value={newQuadImei} onChange={e => setNewQuadImei(e.target.value)} className="input font-mono" />
              {quadError && <ErrorMessage message={quadError} />}
              <button type="submit" className="btn-primary">Add to Fleet</button>
            </form>
          </div>

          <section>
            <h2 className="font-display text-sm font-bold mb-3 text-[#1a1612] dark:text-[#f5f0e8]">Fleet ({quads.length})</h2>
            <div className="flex flex-col gap-3">
              {quads.length === 0 ? <EmptyState message="No quads found." /> : quads.map(quad => (
                <div key={quad.id} className="bg-white/70 dark:bg-[#1a1612]/70 p-4 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 flex flex-col gap-3 backdrop-blur-sm">
                  {editingQuadId === quad.id ? (
                    <div className="flex flex-col gap-3">
                      <input value={editQuadData.name} onChange={e => setEditQuadData({ ...editQuadData, name: e.target.value })} className="input font-semibold" />
                      <input value={editQuadData.imageUrl} onChange={e => setEditQuadData({ ...editQuadData, imageUrl: e.target.value })} className="input text-sm" placeholder="Image URL" />
                      <input value={editQuadData.imei} onChange={e => setEditQuadData({ ...editQuadData, imei: e.target.value })} className="input font-mono text-sm" placeholder="IMEI" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingQuadId(null)} className="p-2 rounded-xl bg-[#f5f0e8] dark:bg-[#2d2318] text-[#7a6e60]"><X className="w-4 h-4" /></button>
                        <button onClick={() => api.updateQuad(quad.id, { ...editQuadData, status: quad.status }).then(() => { setEditingQuadId(null); fetchData(); })} className="p-2 rounded-xl bg-[#c9972a]/10 text-[#c9972a]"><Save className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        {quad.imageUrl
                          ? <img src={quad.imageUrl} alt={quad.name} className="w-14 h-14 rounded-xl object-cover border border-[#c9b99a]/20 shrink-0" />
                          : <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#e8dfc9] to-[#c9b99a] dark:from-[#2d2318] dark:to-[#1a1612] flex items-center justify-center text-2xl shrink-0">🏍️</div>
                        }
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{quad.name}</span>
                            <button onClick={() => { setEditingQuadId(quad.id); setEditQuadData({ name: quad.name, imageUrl: quad.imageUrl ?? '', imei: quad.imei ?? '' }); }}
                              className="text-[#c9b99a]/50 hover:text-[#c9972a] transition-colors"><Edit2 className="w-3 h-3" /></button>
                          </div>
                          <StatusBadge status={quad.status} className="text-[9px]" />
                          {quad.imei && <p className="font-mono text-[9px] text-[#7a6e60] dark:text-[#a09070] mt-1">{quad.imei}</p>}
                          <button onClick={() => setShowQrFor(showQrFor === quad.id ? null : quad.id)}
                            className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#7a6e60] dark:text-[#a09070] hover:text-[#c9972a] transition-colors">
                            <QrCode className="w-2.5 h-2.5" /> {showQrFor === quad.id ? 'Hide' : 'QR'}
                          </button>
                        </div>
                      </div>
                      <select value={quad.status} onChange={e => api.updateQuadStatus(quad.id, e.target.value).then(fetchData)}
                        className="text-[10px] font-semibold rounded-xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/10 bg-[#f5f0e8] dark:bg-[#2d2318] text-[#1a1612] dark:text-[#f5f0e8] px-2 py-1.5 focus:outline-none focus:border-[#c9972a] cursor-pointer">
                        <option value="available">Available</option>
                        <option value="rented">Rented</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  )}
                  {showQrFor === quad.id && !editingQuadId && (
                    <div className="pt-3 border-t border-[#c9b99a]/10 dark:border-[#c9b99a]/5 flex flex-col items-center gap-2">
                      <div className="bg-white p-2 rounded-xl shadow-sm">
                        <QRCodeSVG value={`${window.location.origin}/quad/${quad.id}`} size={130} level="H" includeMargin />
                      </div>
                      <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">Scan to book</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
}
