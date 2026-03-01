import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Calendar, Tag, Plus, Power, Edit2, X, Save, QrCode, Navigation, Trash2, RefreshCw, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../lib/api';
import { SectionCard, EmptyState, ErrorMessage, StatusBadge, LoadingScreen } from '../lib/components/ui';
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

  // Quad form
  const [newQuadName, setNewQuadName] = useState('');
  const [newQuadImage, setNewQuadImage] = useState('');
  const [newQuadImei, setNewQuadImei] = useState('');
  const [quadError, setQuadError] = useState('');
  const [editingQuadId, setEditingQuadId] = useState<number | null>(null);
  const [editQuadData, setEditQuadData] = useState({ name: '', imageUrl: '', imei: '' });
  const [showQrFor, setShowQrFor] = useState<number | null>(null);

  // Promo form
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');
  const [promoError, setPromoError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [s, active, hist, promos, qs] = await Promise.all([
        api.getSales(),
        api.getActiveBookings(),
        api.getBookingHistory(),
        api.getPromotions(),
        api.getQuads(),
      ]);
      setSales(s);
      setActiveBookings(active);
      setHistory(hist);
      setPromotions(promos);
      setQuads(qs);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // — Promotions —
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault(); setPromoError('');
    if (!newPromoCode || !newPromoDiscount) return;
    try {
      await api.createPromotion(newPromoCode, parseInt(newPromoDiscount));
      setNewPromoCode(''); setNewPromoDiscount('');
      fetchData();
    } catch (err: unknown) {
      setPromoError(err instanceof Error ? err.message : 'Failed to create promo');
    }
  };

  const handleTogglePromo = async (id: number, current: number) => {
    await api.togglePromotion(id, !current).catch(console.error);
    fetchData();
  };

  const handleDeletePromo = async (id: number) => {
    if (!confirm('Delete this promo code?')) return;
    await api.deletePromotion(id).catch(console.error);
    fetchData();
  };

  // — Quads —
  const handleCreateQuad = async (e: React.FormEvent) => {
    e.preventDefault(); setQuadError('');
    if (!newQuadName.trim()) return;
    try {
      await api.createQuad({ name: newQuadName.trim(), imageUrl: newQuadImage || undefined, imei: newQuadImei || undefined });
      setNewQuadName(''); setNewQuadImage(''); setNewQuadImei('');
      fetchData();
    } catch (err: unknown) {
      setQuadError(err instanceof Error ? err.message : 'Failed to add quad');
    }
  };

  const handleSaveQuad = async (id: number, status: string) => {
    await api.updateQuad(id, { ...editQuadData, status }).catch(console.error);
    setEditingQuadId(null);
    fetchData();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await api.updateQuadStatus(id, status).catch(console.error);
    fetchData();
  };

  const handleForceComplete = async (bookingId: number) => {
    if (!confirm('Force complete this ride?')) return;
    await api.completeBooking(bookingId).catch(console.error);
    fetchData();
  };

  const inputCls = 'w-full p-3 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none transition-colors text-sm bg-white';
  const tabs: Tab[] = ['overview', 'promotions', 'inventory'];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <button onClick={handleRefresh}
          className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors text-stone-500">
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-200 p-1 rounded-2xl gap-1">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 py-2 px-3 rounded-xl font-bold text-xs capitalize transition-all',
              tab === t ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700')}>
            {t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-600 text-white p-5 rounded-3xl">
              <div className="text-emerald-200 text-xs font-semibold mb-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Today's Sales
              </div>
              <div className="text-2xl font-bold">{sales.today.toLocaleString()} KES</div>
            </div>
            <div className="bg-stone-900 text-white p-5 rounded-3xl">
              <div className="text-stone-400 text-xs font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> All-Time Sales
              </div>
              <div className="text-2xl font-bold">{sales.total.toLocaleString()} KES</div>
            </div>
          </div>

          {/* Extra stats */}
          <div className="grid grid-cols-2 gap-3">
            <SectionCard className="text-center py-4">
              <div className="text-2xl font-bold text-stone-900">{activeBookings.length}</div>
              <div className="text-xs text-stone-500 mt-1 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                Active Rides
              </div>
            </SectionCard>
            <SectionCard className="text-center py-4">
              <div className="text-2xl font-bold text-stone-900">{history.length}</div>
              <div className="text-xs text-stone-500 mt-1 flex items-center justify-center gap-1">
                <Users className="w-3 h-3" /> Total Rides
              </div>
            </SectionCard>
          </div>

          {/* Active Rides */}
          <section>
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Active Rides ({activeBookings.length})
            </h2>
            {activeBookings.length === 0
              ? <EmptyState message="No active rides right now." />
              : (
                <div className="flex flex-col gap-3">
                  {activeBookings.map(b => {
                    const end = new Date(b.startTime).getTime() + b.duration * 60_000;
                    const minsLeft = Math.max(0, Math.floor((end - Date.now()) / 60_000));
                    return (
                      <div key={b.id} className="bg-white p-4 rounded-2xl border-2 border-emerald-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold">{b.quadName}</div>
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                            {minsLeft > 0 ? `${minsLeft} min left` : 'Overtime'}
                          </span>
                        </div>
                        <div className="text-sm text-stone-600">
                          <span className="font-medium text-stone-900">{b.customerName}</span> · {b.customerPhone}
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-stone-400">Started {new Date(b.startTime).toLocaleTimeString()}</span>
                          <div className="flex gap-2">
                            {b.quadImei && (
                              <Link to={`/track/${b.quadImei}`}
                                className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-emerald-100 transition-colors">
                                <Navigation className="w-3 h-3" /> Track
                              </Link>
                            )}
                            <button onClick={() => handleForceComplete(b.id)}
                              className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors">
                              End Ride
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </section>

          {/* History */}
          <section>
            <h2 className="text-sm font-bold mb-3">Recent Completed Rides</h2>
            {history.length === 0
              ? <EmptyState message="No completed rides yet." />
              : (
                <div className="flex flex-col gap-2">
                  {history.slice(0, 15).map(b => (
                    <div key={b.id} className="bg-white p-3.5 rounded-2xl border border-stone-200 flex justify-between items-center shadow-sm">
                      <div>
                        <div className="font-bold text-sm">{b.quadName}</div>
                        <div className="text-xs text-stone-500">{b.customerName} · {b.duration} min</div>
                        <div className="text-xs text-stone-400 font-mono mt-0.5">{b.receiptId}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 text-sm">+{b.price.toLocaleString()} KES</div>
                        {b.endTime && <div className="text-xs text-stone-400">{new Date(b.endTime).toLocaleTimeString()}</div>}
                        {b.rating != null && (
                          <div className="text-xs text-amber-500 font-bold">{'★'.repeat(b.rating)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </section>
        </>
      )}

      {/* ── PROMOTIONS ── */}
      {tab === 'promotions' && (
        <>
          <SectionCard>
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> Create Promo Code
            </h2>
            <form onSubmit={handleCreatePromo} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input type="text" placeholder="CODE (e.g. SUMMER20)" value={newPromoCode}
                  onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                  className={cn(inputCls, 'flex-1 uppercase tracking-wider font-mono')} required />
                <div className="relative w-28">
                  <input type="number" placeholder="%" value={newPromoDiscount}
                    onChange={e => setNewPromoDiscount(e.target.value)}
                    min="1" max="100" className={cn(inputCls, 'pr-6')} required />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">%</span>
                </div>
              </div>
              {promoError && <ErrorMessage message={promoError} />}
              <button type="submit"
                className="w-full bg-stone-900 text-white p-3 rounded-xl font-bold hover:bg-stone-800 transition-colors text-sm">
                Create Code
              </button>
            </form>
          </SectionCard>

          <section>
            <h2 className="text-sm font-bold mb-3">All Promo Codes ({promotions.length})</h2>
            {promotions.length === 0
              ? <EmptyState message="No promo codes yet." />
              : (
                <div className="flex flex-col gap-3">
                  {promotions.map(p => (
                    <div key={p.id}
                      className={cn('p-4 rounded-2xl border-2 flex justify-between items-center transition-colors',
                        p.isActive ? 'bg-white border-emerald-100' : 'bg-stone-50 border-stone-200 opacity-60')}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono tracking-wider text-sm">{p.code}</span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold',
                            p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600')}>
                            {p.discountPercentage}% OFF
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          {p.isActive ? '✓ Active' : '✗ Inactive'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleTogglePromo(p.id, p.isActive)}
                          className={cn('p-2 rounded-full transition-colors',
                            p.isActive ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')}>
                          <Power className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeletePromo(p.id)}
                          className="p-2 rounded-full bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </section>
        </>
      )}

      {/* ── INVENTORY ── */}
      {tab === 'inventory' && (
        <>
          <SectionCard>
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> Add New Quad
            </h2>
            <form onSubmit={handleCreateQuad} className="flex flex-col gap-3">
              <input type="text" placeholder="Quad Name (e.g. Quad 6)" value={newQuadName}
                onChange={e => setNewQuadName(e.target.value)} className={inputCls} required />
              <input type="url" placeholder="Image URL (optional)" value={newQuadImage}
                onChange={e => setNewQuadImage(e.target.value)} className={inputCls} />
              <input type="text" placeholder="IMEI for GPS Tracking (optional)" value={newQuadImei}
                onChange={e => setNewQuadImei(e.target.value)} className={inputCls} />
              {quadError && <ErrorMessage message={quadError} />}
              <button type="submit"
                className="w-full bg-stone-900 text-white p-3 rounded-xl font-bold hover:bg-stone-800 transition-colors text-sm">
                Add Quad
              </button>
            </form>
          </SectionCard>

          <section>
            <h2 className="text-sm font-bold mb-3">Fleet ({quads.length} quads)</h2>
            <div className="flex flex-col gap-3">
              {quads.length === 0
                ? <EmptyState message="No quads found." />
                : quads.map(quad => (
                  <div key={quad.id} className="bg-white p-4 rounded-2xl border-2 border-stone-200 flex flex-col gap-3">
                    {editingQuadId === quad.id ? (
                      <div className="flex flex-col gap-3">
                        <input value={editQuadData.name} placeholder="Name"
                          onChange={e => setEditQuadData({ ...editQuadData, name: e.target.value })}
                          className={cn(inputCls, 'font-bold')} />
                        <input value={editQuadData.imageUrl} placeholder="Image URL"
                          onChange={e => setEditQuadData({ ...editQuadData, imageUrl: e.target.value })}
                          className={inputCls} />
                        <input value={editQuadData.imei} placeholder="IMEI"
                          onChange={e => setEditQuadData({ ...editQuadData, imei: e.target.value })}
                          className={cn(inputCls, 'font-mono')} />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingQuadId(null)}
                            className="p-2 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleSaveQuad(quad.id, quad.status)}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors">
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          {quad.imageUrl
                            ? <img src={quad.imageUrl} alt={quad.name} className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0" />
                            : <div className="w-14 h-14 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-2xl shrink-0">🏍️</div>
                          }
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              {quad.name}
                              <button onClick={() => {
                                setEditingQuadId(quad.id);
                                setEditQuadData({ name: quad.name, imageUrl: quad.imageUrl ?? '', imei: quad.imei ?? '' });
                              }} className="text-stone-300 hover:text-emerald-600 transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <StatusBadge status={quad.status} className="mt-1 text-xs" />
                            {quad.imei && (
                              <div className="text-xs text-stone-400 font-mono mt-1">IMEI: {quad.imei}</div>
                            )}
                            <button onClick={() => setShowQrFor(showQrFor === quad.id ? null : quad.id)}
                              className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-stone-400 hover:text-emerald-600 transition-colors">
                              <QrCode className="w-3 h-3" />
                              {showQrFor === quad.id ? 'Hide QR' : 'QR Code'}
                            </button>
                          </div>
                        </div>
                        <select value={quad.status} onChange={e => handleStatusChange(quad.id, e.target.value)}
                          className="p-1.5 rounded-xl border-2 border-stone-200 bg-stone-50 text-xs font-bold focus:outline-none focus:border-emerald-600 cursor-pointer">
                          <option value="available">Available</option>
                          <option value="rented">Rented</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                    )}
                    {showQrFor === quad.id && !editingQuadId && (
                      <div className="pt-3 border-t border-stone-100 flex flex-col items-center gap-2">
                        <div className="bg-white p-2 rounded-xl border border-stone-200 shadow-sm">
                          <QRCodeSVG value={`${window.location.origin}/quad/${quad.id}`} size={140} level="H" includeMargin />
                        </div>
                        <p className="text-xs text-stone-400 text-center">Scan to book this quad</p>
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
}
