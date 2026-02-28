import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, TrendingUp, Calendar, CheckCircle2, Tag, Plus, Trash2, Power, Edit2, X, Save, QrCode, Navigation } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'overview' | 'promotions' | 'inventory'>('overview');
  const [sales, setSales] = useState({ total: 0, today: 0 });
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  // Quads state
  const [quads, setQuads] = useState<any[]>([]);
  const [newQuadName, setNewQuadName] = useState('');
  const [newQuadImage, setNewQuadImage] = useState('');
  const [newQuadImei, setNewQuadImei] = useState('');
  const [quadError, setQuadError] = useState('');
  const [editingQuadId, setEditingQuadId] = useState<number | null>(null);
  const [editQuadData, setEditQuadData] = useState({ name: '', imageUrl: '', imei: '' });
  const [showQrForQuad, setShowQrForQuad] = useState<number | null>(null);
  
  // Promotions state
  const [promotions, setPromotions] = useState<any[]>([]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, activeRes, historyRes, promosRes, quadsRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/bookings/active'),
        fetch('/api/bookings/history'),
        fetch('/api/promotions'),
        fetch('/api/quads')
      ]);
      
      setSales(await salesRes.json());
      setActiveBookings(await activeRes.json());
      setHistory(await historyRes.json());
      setPromotions(await promosRes.json());
      setQuads(await quadsRes.json());
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    
    if (!newPromoCode || !newPromoDiscount) return;

    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newPromoCode,
          discountPercentage: parseInt(newPromoDiscount)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create promotion');
      }

      setNewPromoCode('');
      setNewPromoDiscount('');
      fetchData();
    } catch (err: any) {
      setPromoError(err.message);
    }
  };

  const togglePromo = async (id: number, currentStatus: number) => {
    try {
      await fetch(`/api/promotions/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle promo', err);
    }
  };

  const handleCreateQuad = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuadError('');
    if (!newQuadName) return;

    try {
      const res = await fetch('/api/quads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newQuadName, imageUrl: newQuadImage, imei: newQuadImei })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add quad');
      }

      setNewQuadName('');
      setNewQuadImage('');
      setNewQuadImei('');
      fetchData();
    } catch (err: any) {
      setQuadError(err.message);
    }
  };

  const handleSaveQuad = async (id: number, status: string) => {
    try {
      await fetch(`/api/quads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editQuadData, status })
      });
      setEditingQuadId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save quad', err);
    }
  };

  const handleUpdateQuadStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/quads/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update quad status', err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex bg-stone-200 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl font-bold text-sm transition-colors",
            activeTab === 'overview' ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('promotions')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl font-bold text-sm transition-colors",
            activeTab === 'promotions' ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"
          )}
        >
          Promotions
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl font-bold text-sm transition-colors",
            activeTab === 'inventory' ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"
          )}
        >
          Inventory
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-600 text-white p-5 rounded-3xl">
              <div className="text-emerald-200 text-sm font-medium mb-1 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Today's Sales
              </div>
              <div className="text-2xl font-bold">{sales.today.toLocaleString()} KES</div>
            </div>
            <div className="bg-stone-900 text-white p-5 rounded-3xl">
              <div className="text-stone-400 text-sm font-medium mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Total Sales
              </div>
              <div className="text-2xl font-bold">{sales.total.toLocaleString()} KES</div>
            </div>
          </div>

          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Rides ({activeBookings.length})
            </h2>
            <div className="flex flex-col gap-3">
              {activeBookings.length === 0 ? (
                <div className="p-4 bg-stone-100 rounded-2xl text-stone-500 text-sm text-center">
                  No active rides at the moment.
                </div>
              ) : (
                activeBookings.map(booking => (
                  <div key={booking.id} className="bg-white p-4 rounded-2xl border-2 border-emerald-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-lg">{booking.quadName}</div>
                      <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">
                        {booking.duration} min
                      </div>
                    </div>
                    <div className="text-sm text-stone-600 mb-1">
                      <span className="font-medium text-stone-900">{booking.customerName}</span> • {booking.customerPhone}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-stone-400">
                        Started: {new Date(booking.startTime).toLocaleTimeString()}
                      </div>
                      {booking.quadImei && (
                        <Link 
                          to={`/track/${booking.quadImei}`}
                          className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 px-2 py-1 rounded-lg"
                        >
                          <Navigation className="w-3 h-3" /> Track Quad
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-stone-400" />
              Recent History
            </h2>
            <div className="flex flex-col gap-3">
              {history.slice(0, 10).map(booking => (
                <div key={booking.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex justify-between items-center">
                  <div>
                    <div className="font-bold text-stone-900">{booking.quadName}</div>
                    <div className="text-xs text-stone-500">{booking.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">+{booking.price} KES</div>
                    <div className="text-xs text-stone-400">{new Date(booking.endTime).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === 'promotions' && (
        <>
          <section className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Create Promo Code
            </h2>
            <form onSubmit={handleCreatePromo} className="flex flex-col gap-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="CODE (e.g. SUMMER20)"
                  value={newPromoCode}
                  onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 p-3 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none uppercase"
                  required
                />
                <div className="relative w-32">
                  <input
                    type="number"
                    placeholder="Discount"
                    value={newPromoDiscount}
                    onChange={e => setNewPromoDiscount(e.target.value)}
                    min="1"
                    max="100"
                    className="w-full p-3 pr-8 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">%</span>
                </div>
              </div>
              {promoError && <p className="text-red-600 text-sm">{promoError}</p>}
              <button
                type="submit"
                className="w-full bg-stone-900 text-white p-3 rounded-xl font-bold hover:bg-stone-800 transition-colors"
              >
                Create Code
              </button>
            </form>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Tag className="w-5 h-5 text-stone-400" />
              Active & Past Codes
            </h2>
            <div className="flex flex-col gap-3">
              {promotions.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-3xl border border-stone-200 text-stone-500">
                  <p>No promo codes created yet.</p>
                </div>
              ) : (
                promotions.map(promo => (
                  <div key={promo.id} className={cn(
                    "p-4 rounded-2xl border-2 flex justify-between items-center transition-colors",
                    promo.isActive ? "bg-white border-emerald-100" : "bg-stone-50 border-stone-200 opacity-75"
                  )}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg tracking-wide">{promo.code}</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-bold",
                          promo.isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"
                        )}>
                          {promo.discountPercentage}% OFF
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mt-1">
                        Status: {promo.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <button
                      onClick={() => togglePromo(promo.id, promo.isActive)}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        promo.isActive 
                          ? "bg-red-50 text-red-600 hover:bg-red-100" 
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      )}
                      title={promo.isActive ? "Deactivate" : "Activate"}
                    >
                      <Power className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
      {activeTab === 'inventory' && (
        <>
          <section className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Add New Quad
            </h2>
            <form onSubmit={handleCreateQuad} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Quad Name (e.g. Quad 6)"
                value={newQuadName}
                onChange={e => setNewQuadName(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={newQuadImage}
                onChange={e => setNewQuadImage(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none"
              />
              <input
                type="text"
                placeholder="IMEI for Live Tracking (optional)"
                value={newQuadImei}
                onChange={e => setNewQuadImei(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none"
              />
              {quadError && <p className="text-red-600 text-sm">{quadError}</p>}
              <button
                type="submit"
                className="w-full bg-stone-900 text-white p-3 rounded-xl font-bold hover:bg-stone-800 transition-colors"
              >
                Add Quad
              </button>
            </form>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Tag className="w-5 h-5 text-stone-400" />
              Quad Inventory
            </h2>
            <div className="flex flex-col gap-3">
              {quads.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-3xl border border-stone-200 text-stone-500">
                  <p>No quads found.</p>
                </div>
              ) : (
                quads.map(quad => (
                  <div key={quad.id} className="p-4 rounded-2xl border-2 bg-white border-stone-200 flex flex-col gap-3 transition-colors">
                    {editingQuadId === quad.id ? (
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          value={editQuadData.name}
                          onChange={e => setEditQuadData({ ...editQuadData, name: e.target.value })}
                          className="w-full p-2 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none font-bold"
                          placeholder="Quad Name"
                        />
                        <input
                          type="text"
                          value={editQuadData.imageUrl}
                          onChange={e => setEditQuadData({ ...editQuadData, imageUrl: e.target.value })}
                          className="w-full p-2 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none text-sm"
                          placeholder="Image URL"
                        />
                        <input
                          type="text"
                          value={editQuadData.imei}
                          onChange={e => setEditQuadData({ ...editQuadData, imei: e.target.value })}
                          className="w-full p-2 rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none text-sm"
                          placeholder="IMEI"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setEditingQuadId(null)}
                            className="p-2 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleSaveQuad(quad.id, quad.status)}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          {quad.imageUrl ? (
                            <img src={quad.imageUrl} alt={quad.name} className="w-16 h-16 rounded-xl object-cover border border-stone-200" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
                              <Tag className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-lg flex items-center gap-2">
                              {quad.name}
                              <button 
                                onClick={() => {
                                  setEditingQuadId(quad.id);
                                  setEditQuadData({ name: quad.name, imageUrl: quad.imageUrl || '', imei: quad.imei || '' });
                                }}
                                className="text-stone-400 hover:text-emerald-600 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-xs text-stone-500 mt-1">
                              Status: <span className={cn(
                                "font-bold",
                                quad.status === 'available' ? "text-emerald-600" :
                                quad.status === 'rented' ? "text-amber-600" : "text-red-600"
                              )}>{quad.status.toUpperCase()}</span>
                            </div>
                            {quad.imei && (
                              <div className="text-xs text-stone-400 mt-1 font-mono">
                                IMEI: {quad.imei}
                              </div>
                            )}
                            <button
                              onClick={() => setShowQrForQuad(showQrForQuad === quad.id ? null : quad.id)}
                              className="mt-2 flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-emerald-600 transition-colors"
                            >
                              <QrCode className="w-3 h-3" />
                              {showQrForQuad === quad.id ? 'Hide QR' : 'Show QR'}
                            </button>
                          </div>
                        </div>
                        <select
                          value={quad.status}
                          onChange={(e) => handleUpdateQuadStatus(quad.id, e.target.value)}
                          className="p-2 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm font-bold focus:outline-none focus:border-emerald-600"
                        >
                          <option value="available">Available</option>
                          <option value="rented">Rented</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                    )}
                    
                    {showQrForQuad === quad.id && !editingQuadId && (
                      <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col items-center justify-center gap-3">
                        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                          <QRCodeSVG 
                            value={`${window.location.origin}/quad/${quad.id}`}
                            size={150}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                        <div className="text-xs text-stone-500 text-center max-w-[200px]">
                          Scan to view quad details and book directly
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
}
