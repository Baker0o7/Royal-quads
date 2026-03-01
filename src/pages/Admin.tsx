import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Calendar, Tag, Plus, Power, Edit2, X, Save, QrCode, Navigation, Trash2, RefreshCw, Users, Activity, Wrench, AlertOctagon, UserCheck, Clock, BarChart3, List, Wallet, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { EmptyState, ErrorMessage, StatusBadge } from '../lib/components/ui';
import { ImagePicker } from '../lib/components/ImagePicker';
import type { Quad, Booking, Promotion, SalesData, MaintenanceLog, DamageReport, Staff, WaitlistEntry, Prebooking } from '../types';

type Tab = 'overview' | 'fleet' | 'promos' | 'maintenance' | 'damage' | 'staff' | 'waitlist' | 'prebookings' | 'settings';

const TABS: { key: Tab; icon: React.ReactNode; label: string }[] = [
  { key: 'overview',    icon: <Activity className="w-4 h-4" />,     label: 'Overview'   },
  { key: 'fleet',       icon: <List className="w-4 h-4" />,         label: 'Fleet'      },
  { key: 'promos',      icon: <Tag className="w-4 h-4" />,          label: 'Promos'     },
  { key: 'maintenance', icon: <Wrench className="w-4 h-4" />,       label: 'Service'    },
  { key: 'damage',      icon: <AlertOctagon className="w-4 h-4" />, label: 'Damage'     },
  { key: 'staff',       icon: <UserCheck className="w-4 h-4" />,    label: 'Staff'      },
  { key: 'waitlist',    icon: <Clock className="w-4 h-4" />,        label: 'Waitlist'   },
  { key: 'prebookings', icon: <Calendar className="w-4 h-4" />,     label: 'Pre-books'  },
  { key: 'settings',   icon: <Lock className="w-4 h-4" />,          label: 'Settings'   },
];

// ── Admin PIN gate ──────────────────────────────────────────────────────────
function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (api.verifyAdminPin(pin)) { onUnlock(); }
    else { setError('Incorrect PIN'); setPin(''); }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c9972a] to-[#8a6010] flex items-center justify-center shadow-lg">
        <Lock className="w-7 h-7 text-white" />
      </div>
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-[#1a1612] dark:text-[#f5f0e8]">Admin Access</h1>
        <p className="text-xs font-mono text-[#7a6e60] dark:text-[#a09070] mt-1">Enter your PIN to continue</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xs">
        <input type="password" inputMode="numeric" maxLength={6} placeholder="Enter PIN" value={pin}
          onChange={e => { setPin(e.target.value); setError(''); }}
          className="input text-center font-mono text-2xl tracking-[0.5em]" autoFocus />
        {error && <p className="text-red-500 text-xs font-mono text-center">{error}</p>}
        <button type="submit" className="btn-primary">Unlock</button>
      </form>
      <p className="text-[10px] font-mono text-[#7a6e60] dark:text-[#a09070]">Default PIN: 1234</p>
    </div>
  );
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('rq:admin_unlocked') === '1');
  const [tab, setTab] = useState<Tab>('overview');
  const [sales, setSales] = useState<SalesData>({ total: 0, today: 0, thisWeek: 0, thisMonth: 0, overtimeRevenue: 0 });
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [history, setHistory] = useState<Booking[]>([]);
  const [quads, setQuads] = useState<Quad[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [maintLogs, setMaintLogs] = useState<MaintenanceLog[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [prebookings, setPrebookings] = useState<Prebooking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fleet state
  const [newQuadName, setNewQuadName] = useState('');
  const [newQuadImage, setNewQuadImage] = useState('');
  const [newQuadImei, setNewQuadImei] = useState('');
  const [quadError, setQuadError] = useState('');
  const [editingQuadId, setEditingQuadId] = useState<number | null>(null);
  const [editQuadData, setEditQuadData] = useState({ name: '', imageUrl: '', imei: '' });
  const [showQrFor, setShowQrFor] = useState<number | null>(null);

  // Promo state
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');
  const [promoError, setPromoError] = useState('');

  // Maintenance state
  const [newMaint, setNewMaint] = useState({ quadId: 0, type: 'service' as MaintenanceLog['type'], description: '', cost: '', date: new Date().toISOString().slice(0,10) });
  const [maintError, setMaintError] = useState('');

  // Damage state
  const [newDamage, setNewDamage] = useState({ quadId: 0, description: '', severity: 'minor' as DamageReport['severity'], repairCost: '', photoUrl: '' });
  const [damageError, setDamageError] = useState('');

  // Staff state
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', pin: '', role: 'operator' as Staff['role'] });
  const [staffError, setStaffError] = useState('');

  // Settings state
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [s, active, hist, promos, qs, ml, dr, sf, wl, pb] = await Promise.all([
        api.getSales(), api.getActiveBookings(), api.getBookingHistory(), api.getPromotions(),
        api.getQuads(), api.getMaintenanceLogs(), api.getDamageReports(), api.getStaff(),
        api.getWaitlist(), api.getPrebookings(),
      ]);
      setSales(s); setActiveBookings(active); setHistory(hist); setPromotions(promos);
      setQuads(qs); setMaintLogs(ml); setDamageReports(dr); setStaff(sf); setWaitlist(wl); setPrebookings(pb);
    } catch (err) { console.error(err); }
  }, []);

  const handleUnlock = () => { sessionStorage.setItem('rq:admin_unlocked', '1'); setUnlocked(true); };

  useEffect(() => { if (unlocked) { fetchData(); const i = setInterval(fetchData, 15_000); return () => clearInterval(i); } }, [fetchData, unlocked]);

  const handleRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  if (!unlocked) return <PinGate onUnlock={handleUnlock} />;

  const statCard = (icon: React.ReactNode, label: string, value: string, accent = false) => (
    <div className={cn('rounded-2xl p-4 border', accent ? 'bg-gradient-to-br from-[#2d2318] to-[#1a1612] border-[#c9972a]/20 text-white' : 'bg-white/70 dark:bg-[#1a1612]/70 border-[#c9b99a]/20 dark:border-[#c9b99a]/8 text-[#1a1612] dark:text-[#f5f0e8]')}>
      <div className={cn('mb-2', accent ? 'text-[#c9972a]' : 'text-[#7a6e60] dark:text-[#a09070]')}>{icon}</div>
      <p className="font-display font-bold text-xl">{value}</p>
      <p className={cn('font-mono text-[10px] uppercase tracking-wider mt-0.5', accent ? 'text-[#c9b99a]/50' : 'text-[#7a6e60] dark:text-[#a09070]')}>{label}</p>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-[#1a1612] dark:text-[#f5f0e8]">Dashboard</h1>
          <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] tracking-wider uppercase mt-0.5">Royal Quads Admin</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/analytics" className="p-2.5 rounded-xl bg-white/70 dark:bg-[#1a1612]/70 border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 text-[#7a6e60] hover:text-[#c9972a] transition-colors">
            <BarChart3 className="w-4 h-4" />
          </Link>
          <button onClick={handleRefresh} className="p-2.5 rounded-xl bg-white/70 dark:bg-[#1a1612]/70 border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 text-[#7a6e60] hover:text-[#c9972a] transition-colors">
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="overflow-x-auto -mx-4 px-4 pb-1">
        <div className="flex gap-1.5 min-w-max">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('flex items-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all whitespace-nowrap',
                tab === t.key ? 'bg-[#1a1612] dark:bg-[#f5f0e8]/10 text-white dark:text-[#f5f0e8] shadow-sm' : 'bg-white/60 dark:bg-[#1a1612]/60 text-[#7a6e60] dark:text-[#a09070] border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 hover:text-[#c9972a]')}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (<>
        <div className="grid grid-cols-2 gap-3">
          {statCard(<TrendingUp className="w-4 h-4" />, "Today's Revenue", `${sales.today.toLocaleString()} KES`, true)}
          {statCard(<Calendar className="w-4 h-4" />, 'This Week', `${sales.thisWeek.toLocaleString()} KES`)}
          {statCard(<Activity className="w-4 h-4" />, 'Active Rides', `${activeBookings.length}`)}
          {statCard(<Users className="w-4 h-4" />, 'Total Rides', `${history.length}`)}
          {statCard(<Wallet className="w-4 h-4" />, 'Overtime Revenue', `${sales.overtimeRevenue.toLocaleString()} KES`)}
          {statCard(<TrendingUp className="w-4 h-4" />, 'This Month', `${sales.thisMonth.toLocaleString()} KES`)}
        </div>
        <section>
          <h2 className="font-display text-sm font-bold mb-3 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live Rides ({activeBookings.length})
          </h2>
          {activeBookings.length === 0 ? <EmptyState message="No active rides." /> : (
            <div className="flex flex-col gap-3">
              {activeBookings.map(b => {
                const minsLeft = Math.max(0, Math.floor((new Date(b.startTime).getTime() + b.duration * 60_000 - Date.now()) / 60_000));
                const isOvertime = Date.now() > new Date(b.startTime).getTime() + b.duration * 60_000;
                return (
                  <div key={b.id} className="bg-white/70 dark:bg-[#1a1612]/70 p-4 rounded-2xl border border-emerald-200/40 dark:border-emerald-800/30 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{b.quadName}</p>
                      <span className={cn('text-[10px] font-mono font-bold px-2 py-0.5 rounded-full', isOvertime ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400')}>
                        {isOvertime ? 'Overtime' : `${minsLeft}m left`}
                      </span>
                    </div>
                    <p className="text-xs text-[#7a6e60] dark:text-[#a09070] font-mono">{b.customerName} · {b.customerPhone}</p>
                    {b.depositAmount! > 0 && <p className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-1">Deposit: {b.depositAmount!.toLocaleString()} KES {b.depositReturned ? '(returned)' : '(held)'}</p>}
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#c9b99a]/10">
                      <span className="text-[10px] font-mono text-[#7a6e60] dark:text-[#a09070]">Since {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="flex gap-2">
                        {b.idPhotoUrl && (
                          <button onClick={() => window.open(b.idPhotoUrl!, '_blank')} className="text-[10px] font-semibold text-[#7a6e60] bg-[#f5f0e8] dark:bg-[#2d2318] px-2 py-1 rounded-lg hover:bg-[#e8dfc9] transition-colors">ID</button>
                        )}
                        {b.quadImei && <Link to={`/track/${b.quadImei}`} className="text-[10px] font-semibold text-[#c9972a] bg-[#c9972a]/8 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-[#c9972a]/15 transition-colors"><Navigation className="w-3 h-3" />Track</Link>}
                        <button onClick={() => { if (confirm('Force complete this ride?')) api.completeBooking(b.id).then(fetchData); }}
                          className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/15 px-2 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/25 transition-colors">End</button>
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
                    <p className="font-display font-bold text-sm text-[#c9972a]">+{(b.price + (b.overtimeCharge || 0)).toLocaleString()} KES</p>
                    {b.overtimeCharge! > 0 && <p className="font-mono text-[9px] text-amber-500">+{b.overtimeCharge!.toLocaleString()} overtime</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        {/* Deposits to return */}
        {history.filter(b => b.depositAmount! > 0 && !b.depositReturned).length > 0 && (
          <section>
            <h2 className="font-display text-sm font-bold mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400"><Wallet className="w-4 h-4" /> Deposits to Return</h2>
            <div className="flex flex-col gap-2">
              {history.filter(b => b.depositAmount! > 0 && !b.depositReturned).map(b => (
                <div key={b.id} className="bg-amber-50/70 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200/50 dark:border-amber-800/30 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{b.customerName}</p>
                    <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">{b.depositAmount!.toLocaleString()} KES deposit</p>
                  </div>
                  <button onClick={() => api.returnDeposit(b.id).then(fetchData)}
                    className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Returned
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </>)}

      {/* ── FLEET ── */}
      {tab === 'fleet' && (<>
        <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
          <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]"><Plus className="w-4 h-4 text-[#c9972a]" />Add Quad</h2>
          <form onSubmit={async (e) => { e.preventDefault(); setQuadError(''); try { await api.createQuad({ name: newQuadName.trim(), imageUrl: newQuadImage || undefined, imei: newQuadImei || undefined }); setNewQuadName(''); setNewQuadImage(''); setNewQuadImei(''); fetchData(); } catch (err: unknown) { setQuadError(err instanceof Error ? err.message : 'Error'); } }} className="flex flex-col gap-3">
            <input type="text" placeholder="Quad Name" value={newQuadName} onChange={e => setNewQuadName(e.target.value)} className="input" required />
            <ImagePicker value={newQuadImage} onChange={setNewQuadImage} />
            <input type="text" placeholder="IMEI (GPS tracking, optional)" value={newQuadImei} onChange={e => setNewQuadImei(e.target.value)} className="input font-mono" />
            {quadError && <ErrorMessage message={quadError} />}
            <button type="submit" className="btn-primary">Add to Fleet</button>
          </form>
        </div>
        <div className="flex flex-col gap-3">
          {quads.map(quad => (
            <div key={quad.id} className="bg-white/70 dark:bg-[#1a1612]/70 p-4 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 flex flex-col gap-3 backdrop-blur-sm">
              {editingQuadId === quad.id ? (
                <div className="flex flex-col gap-3">
                  <input value={editQuadData.name} onChange={e => setEditQuadData({ ...editQuadData, name: e.target.value })} className="input font-semibold" />
                  <ImagePicker value={editQuadData.imageUrl} onChange={v => setEditQuadData({ ...editQuadData, imageUrl: v })} />
                  <input value={editQuadData.imei} onChange={e => setEditQuadData({ ...editQuadData, imei: e.target.value })} className="input font-mono text-sm" placeholder="IMEI" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingQuadId(null)} className="p-2 rounded-xl bg-[#f5f0e8] dark:bg-[#2d2318] text-[#7a6e60]"><X className="w-4 h-4" /></button>
                    <button onClick={() => api.updateQuad(quad.id, { ...editQuadData, status: quad.status }).then(() => { setEditingQuadId(null); fetchData(); })} className="p-2 rounded-xl bg-[#c9972a]/10 text-[#c9972a]"><Save className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {quad.imageUrl ? <img src={quad.imageUrl} alt={quad.name} className="w-14 h-14 rounded-xl object-cover border border-[#c9b99a]/20 shrink-0" />
                      : <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#e8dfc9] to-[#c9b99a] dark:from-[#2d2318] dark:to-[#1a1612] flex items-center justify-center text-2xl shrink-0">🏍️</div>}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{quad.name}</span>
                        <button onClick={() => { setEditingQuadId(quad.id); setEditQuadData({ name: quad.name, imageUrl: quad.imageUrl ?? '', imei: quad.imei ?? '' }); }} className="text-[#c9b99a]/50 hover:text-[#c9972a] transition-colors"><Edit2 className="w-3 h-3" /></button>
                      </div>
                      <StatusBadge status={quad.status} className="text-[9px]" />
                      {quad.imei && <p className="font-mono text-[9px] text-[#7a6e60] dark:text-[#a09070] mt-1">{quad.imei}</p>}
                      <button onClick={() => setShowQrFor(showQrFor === quad.id ? null : quad.id)} className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#7a6e60] hover:text-[#c9972a] transition-colors">
                        <QrCode className="w-2.5 h-2.5" />{showQrFor === quad.id ? 'Hide QR' : 'Show QR'}
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
                  <div className="bg-white p-2 rounded-xl shadow-sm"><QRCodeSVG value={`${window.location.origin}/quad/${quad.id}`} size={130} level="H" includeMargin /></div>
                  <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">Scan to book {quad.name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </>)}

      {/* ── PROMOS ── */}
      {tab === 'promos' && (<>
        <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
          <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]"><Plus className="w-4 h-4 text-[#c9972a]" />New Promo Code</h2>
          <form onSubmit={async (e) => { e.preventDefault(); setPromoError(''); try { await api.createPromotion(newPromoCode, parseInt(newPromoDiscount)); setNewPromoCode(''); setNewPromoDiscount(''); fetchData(); } catch (err: unknown) { setPromoError(err instanceof Error ? err.message : 'Error'); } }} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input type="text" placeholder="CODE" value={newPromoCode} onChange={e => setNewPromoCode(e.target.value.toUpperCase())} className="input flex-1 uppercase font-mono tracking-widest" required />
              <div className="relative w-24"><input type="number" placeholder="%" value={newPromoDiscount} onChange={e => setNewPromoDiscount(e.target.value)} min="1" max="100" className="input pr-6" required /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6e60] text-sm font-bold pointer-events-none">%</span></div>
            </div>
            {promoError && <ErrorMessage message={promoError} />}
            <button type="submit" className="btn-primary">Create Code</button>
          </form>
        </div>
        <div className="flex flex-col gap-3">
          {promotions.length === 0 ? <EmptyState message="No promo codes yet." /> : promotions.map(p => (
            <div key={p.id} className={cn('p-4 rounded-2xl border flex justify-between items-center', p.isActive ? 'bg-white/70 dark:bg-[#1a1612]/70 border-[#c9b99a]/20 dark:border-[#c9b99a]/8' : 'bg-[#f5f0e8]/40 dark:bg-[#1a1612]/30 border-[#c9b99a]/10 opacity-60')}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold tracking-widest text-sm text-[#1a1612] dark:text-[#f5f0e8]">{p.code}</span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold', p.isActive ? 'bg-[#c9972a]/10 text-[#c9972a]' : 'bg-[#7a6e60]/10 text-[#7a6e60]')}>{p.discountPercentage}% OFF</span>
                </div>
                <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] mt-0.5">{p.isActive ? '● Active' : '○ Inactive'}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => api.togglePromotion(p.id, !p.isActive).then(fetchData)} className={cn('p-2 rounded-xl transition-colors', p.isActive ? 'bg-red-50 dark:bg-red-900/15 text-red-500 hover:bg-red-100' : 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 hover:bg-emerald-100')}><Power className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm('Delete this promo code?')) api.deletePromotion(p.id).then(fetchData); }} className="p-2 rounded-xl bg-[#f5f0e8] dark:bg-[#2d2318] text-[#7a6e60] hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* ── MAINTENANCE ── */}
      {tab === 'maintenance' && (<>
        <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
          <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]"><Plus className="w-4 h-4 text-[#c9972a]" />Log Service</h2>
          <form onSubmit={async (e) => { e.preventDefault(); setMaintError(''); if (!newMaint.quadId) { setMaintError('Select a quad'); return; } try { const quad = quads.find(q => q.id === newMaint.quadId); await api.addMaintenanceLog({ ...newMaint, quadName: quad?.name || '', cost: Number(newMaint.cost) || 0, operatorId: null, operatorName: null }); setNewMaint({ quadId: 0, type: 'service', description: '', cost: '', date: new Date().toISOString().slice(0,10) }); fetchData(); } catch (err: unknown) { setMaintError(err instanceof Error ? err.message : 'Error'); } }} className="flex flex-col gap-3">
            <select value={newMaint.quadId} onChange={e => setNewMaint({ ...newMaint, quadId: Number(e.target.value) })} className="input">
              <option value={0}>Select Quad *</option>
              {quads.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select value={newMaint.type} onChange={e => setNewMaint({ ...newMaint, type: e.target.value as MaintenanceLog['type'] })} className="input text-sm">
                <option value="service">Service</option>
                <option value="fuel">Fuel</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
              </select>
              <input type="date" value={newMaint.date} onChange={e => setNewMaint({ ...newMaint, date: e.target.value })} className="input text-sm font-mono" />
            </div>
            <input type="text" placeholder="Description" value={newMaint.description} onChange={e => setNewMaint({ ...newMaint, description: e.target.value })} className="input" required />
            <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#7a6e60] pointer-events-none">KES</span><input type="number" placeholder="Cost" value={newMaint.cost} onChange={e => setNewMaint({ ...newMaint, cost: e.target.value })} min="0" style={{ paddingLeft: '3rem' }} className="input" /></div>
            {maintError && <ErrorMessage message={maintError} />}
            <button type="submit" className="btn-primary">Add Log</button>
          </form>
        </div>
        <div className="flex flex-col gap-2">
          {maintLogs.length === 0 ? <EmptyState message="No maintenance logs yet." /> : maintLogs.map(log => (
            <div key={log.id} className="bg-white/70 dark:bg-[#1a1612]/70 p-4 rounded-xl border border-[#c9b99a]/15 dark:border-[#c9b99a]/8 flex justify-between items-start backdrop-blur-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{log.quadName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c9972a]/10 text-[#c9972a] font-bold capitalize">{log.type}</span>
                </div>
                <p className="text-xs text-[#7a6e60] dark:text-[#a09070]">{log.description}</p>
                <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] mt-1">{new Date(log.date).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {log.cost > 0 && <span className="font-mono font-bold text-sm text-[#c9972a]">{log.cost.toLocaleString()} KES</span>}
                <button onClick={() => api.deleteMaintenanceLog(log.id).then(fetchData)} className="p-1.5 rounded-lg text-[#7a6e60] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* ── DAMAGE ── */}
      {tab === 'damage' && (<>
        <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
          <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]"><Plus className="w-4 h-4 text-[#c9972a]" />Report Damage</h2>
          <form onSubmit={async (e) => { e.preventDefault(); setDamageError(''); if (!newDamage.quadId) { setDamageError('Select a quad'); return; } try { const quad = quads.find(q => q.id === newDamage.quadId); await api.addDamageReport({ quadId: newDamage.quadId, quadName: quad?.name || '', bookingId: null, customerName: null, description: newDamage.description, photoUrl: newDamage.photoUrl || null, severity: newDamage.severity, repairCost: Number(newDamage.repairCost) || 0, resolved: false, date: new Date().toISOString() }); setNewDamage({ quadId: 0, description: '', severity: 'minor', repairCost: '', photoUrl: '' }); fetchData(); } catch (err: unknown) { setDamageError(err instanceof Error ? err.message : 'Error'); } }} className="flex flex-col gap-3">
            <select value={newDamage.quadId} onChange={e => setNewDamage({ ...newDamage, quadId: Number(e.target.value) })} className="input"><option value={0}>Select Quad *</option>{quads.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}</select>
            <div className="grid grid-cols-2 gap-2">
              <select value={newDamage.severity} onChange={e => setNewDamage({ ...newDamage, severity: e.target.value as DamageReport['severity'] })} className="input text-sm">
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#7a6e60] pointer-events-none">KES</span><input type="number" placeholder="Repair cost" value={newDamage.repairCost} onChange={e => setNewDamage({ ...newDamage, repairCost: e.target.value })} min="0" style={{ paddingLeft: '3rem' }} className="input" /></div>
            </div>
            <input type="text" placeholder="Description of damage" value={newDamage.description} onChange={e => setNewDamage({ ...newDamage, description: e.target.value })} className="input" required />
            <ImagePicker value={newDamage.photoUrl} onChange={v => setNewDamage({ ...newDamage, photoUrl: v })} />
            {damageError && <ErrorMessage message={damageError} />}
            <button type="submit" className="btn-primary">Submit Report</button>
          </form>
        </div>
        <div className="flex flex-col gap-3">
          {damageReports.length === 0 ? <EmptyState message="No damage reports." /> : damageReports.map(r => (
            <div key={r.id} className={cn('p-4 rounded-2xl border backdrop-blur-sm', r.resolved ? 'bg-[#f5f0e8]/40 dark:bg-[#1a1612]/30 border-[#c9b99a]/10 opacity-60' : r.severity === 'severe' ? 'bg-red-50/70 dark:bg-red-900/10 border-red-200/40 dark:border-red-800/30' : r.severity === 'moderate' ? 'bg-amber-50/70 dark:bg-amber-900/10 border-amber-200/40 dark:border-amber-800/30' : 'bg-white/70 dark:bg-[#1a1612]/70 border-[#c9b99a]/15 dark:border-[#c9b99a]/8')}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{r.quadName}</span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold capitalize', r.severity === 'severe' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : r.severity === 'moderate' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400')}>{r.severity}</span>
                </div>
                {r.resolved ? <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">✓ Resolved</span>
                  : <button onClick={() => api.resolveDamageReport(r.id).then(fetchData)} className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors">Mark Resolved</button>}
              </div>
              <p className="text-xs text-[#7a6e60] dark:text-[#a09070]">{r.description}</p>
              {r.photoUrl && <img src={r.photoUrl} alt="Damage" className="mt-2 w-full h-32 object-cover rounded-xl border border-[#c9b99a]/20" />}
              <div className="flex justify-between items-center mt-2">
                {r.repairCost > 0 && <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">Repair: {r.repairCost.toLocaleString()} KES</span>}
                <span className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">{new Date(r.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* ── STAFF ── */}
      {tab === 'staff' && (<>
        <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
          <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]"><Plus className="w-4 h-4 text-[#c9972a]" />Add Staff</h2>
          <form onSubmit={async (e) => { e.preventDefault(); setStaffError(''); try { await api.addStaff({ ...newStaff, isActive: true }); setNewStaff({ name: '', phone: '', pin: '', role: 'operator' }); fetchData(); } catch (err: unknown) { setStaffError(err instanceof Error ? err.message : 'Error'); } }} className="flex flex-col gap-3">
            <input type="text" placeholder="Full Name" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} className="input" required />
            <input type="tel" placeholder="Phone Number" value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} className="input" required />
            <div className="grid grid-cols-2 gap-2">
              <input type="password" inputMode="numeric" maxLength={6} placeholder="PIN" value={newStaff.pin} onChange={e => setNewStaff({ ...newStaff, pin: e.target.value })} className="input font-mono tracking-widest" required />
              <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value as Staff['role'] })} className="input text-sm">
                <option value="operator">Operator</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            {staffError && <ErrorMessage message={staffError} />}
            <button type="submit" className="btn-primary">Add Staff Member</button>
          </form>
        </div>
        <div className="flex flex-col gap-3">
          {staff.length === 0 ? <EmptyState message="No staff members yet." /> : staff.map(s => (
            <div key={s.id} className="bg-white/70 dark:bg-[#1a1612]/70 p-4 rounded-2xl border border-[#c9b99a]/15 dark:border-[#c9b99a]/8 flex justify-between items-center backdrop-blur-sm">
              <div>
                <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{s.name}</p>
                <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">{s.phone} · <span className="capitalize">{s.role}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', s.isActive ? 'bg-emerald-500' : 'bg-stone-300')} />
                <button onClick={() => api.updateStaff(s.id, { isActive: !s.isActive }).then(fetchData)} className="text-[10px] font-semibold text-[#7a6e60] bg-[#f5f0e8] dark:bg-[#2d2318] px-2 py-1 rounded-lg hover:bg-[#e8dfc9] transition-colors">{s.isActive ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => { if (confirm('Remove this staff member?')) api.deleteStaff(s.id).then(fetchData); }} className="p-1.5 rounded-lg text-[#7a6e60] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* ── WAITLIST ── */}
      {tab === 'waitlist' && (<>
        <div className="bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 p-4 rounded-2xl text-xs text-amber-800 dark:text-amber-400 font-mono">
          {waitlist.filter(w => !w.notified).length} customer{waitlist.filter(w => !w.notified).length !== 1 ? 's' : ''} waiting · {quads.filter(q => q.status === 'available').length} quad{quads.filter(q => q.status === 'available').length !== 1 ? 's' : ''} available
        </div>
        <div className="flex flex-col gap-3">
          {waitlist.length === 0 ? <EmptyState message="Waitlist is empty." /> : waitlist.map(w => (
            <div key={w.id} className={cn('p-4 rounded-2xl border backdrop-blur-sm', w.notified ? 'opacity-50 bg-[#f5f0e8]/40 dark:bg-[#1a1612]/30 border-[#c9b99a]/10' : 'bg-white/70 dark:bg-[#1a1612]/70 border-[#c9b99a]/15 dark:border-[#c9b99a]/8')}>
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{w.customerName}</p>
                {w.notified ? <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">✓ Notified</span>
                  : <button onClick={() => api.notifyWaitlist(w.id).then(fetchData)} className="text-[10px] font-semibold text-[#c9972a] bg-[#c9972a]/8 px-2 py-1 rounded-lg hover:bg-[#c9972a]/15 transition-colors">Mark Notified</button>}
              </div>
              <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">{w.customerPhone} · {w.duration}min requested</p>
              <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] mt-0.5">Added {new Date(w.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <button onClick={() => api.removeFromWaitlist(w.id).then(fetchData)} className="mt-2 text-[10px] text-red-500 font-mono hover:text-red-600">Remove</button>
            </div>
          ))}
        </div>
      </>)}

      {/* ── PREBOOKINGS ── */}
      {tab === 'prebookings' && (<>
        <div className="grid grid-cols-3 gap-2 text-center">
          {(['pending','confirmed','converted'] as const).map(s => (
            <div key={s} className="bg-white/70 dark:bg-[#1a1612]/70 rounded-xl border border-[#c9b99a]/15 dark:border-[#c9b99a]/8 p-3">
              <p className="font-display font-bold text-lg text-[#1a1612] dark:text-[#f5f0e8]">{prebookings.filter(p => p.status === s).length}</p>
              <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] capitalize">{s}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {prebookings.length === 0 ? <EmptyState message="No pre-bookings yet." /> : prebookings.map(pb => {
            const colors: Record<string, string> = { pending: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400', confirmed: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400', cancelled: 'bg-red-100 dark:bg-red-900/20 text-red-500', converted: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' };
            return (
              <div key={pb.id} className="bg-white/70 dark:bg-[#1a1612]/70 p-4 rounded-2xl border border-[#c9b99a]/15 dark:border-[#c9b99a]/8 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{pb.customerName}</p>
                    <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">{pb.customerPhone}</p>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold capitalize', colors[pb.status])}>{pb.status}</span>
                </div>
                <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">{pb.quadName || 'Any quad'} · {pb.duration}min · {pb.price.toLocaleString()} KES</p>
                <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] mt-0.5">📅 {new Date(pb.scheduledFor).toLocaleString()}</p>
                {pb.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => api.confirmPrebooking(pb.id).then(fetchData)} className="flex-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />Confirm</button>
                    <button onClick={() => api.cancelPrebooking(pb.id).then(fetchData)} className="flex-1 text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/15 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"><XCircle className="w-3 h-3" />Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>)}

      {/* ── SETTINGS ── */}
      {tab === 'settings' && (
        <div className="flex flex-col gap-5">
          <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
            <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]"><Lock className="w-4 h-4 text-[#c9972a]" />Change Admin PIN</h2>
            <form onSubmit={e => { e.preventDefault(); if (newPin.length < 4) { setPinMsg('PIN must be at least 4 digits'); return; } api.setAdminPin(newPin); setNewPin(''); setPinMsg('PIN updated successfully'); setTimeout(() => setPinMsg(''), 3000); }} className="flex flex-col gap-3">
              <input type="password" inputMode="numeric" maxLength={6} placeholder="New PIN (4-6 digits)" value={newPin} onChange={e => setNewPin(e.target.value)} className="input font-mono tracking-widest text-center text-xl" />
              {pinMsg && <p className={cn('text-xs font-mono text-center', pinMsg.includes('success') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>{pinMsg}</p>}
              <button type="submit" className="btn-primary">Update PIN</button>
            </form>
          </div>
          <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
            <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]">Data Management</h2>
            <div className="flex flex-col gap-3">
              <button onClick={() => api.exportBookings()} className="w-full flex items-center justify-between p-3 rounded-xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/10 bg-[#f5f0e8]/60 dark:bg-[#2d2318]/60 hover:border-[#c9972a]/50 transition-colors">
                <span className="text-sm font-medium text-[#1a1612] dark:text-[#f5f0e8]">Export Bookings CSV</span>
                <span className="text-xs font-mono text-[#c9972a]">Download →</span>
              </button>
              <button onClick={() => { if (confirm('Lock admin panel? You\'ll need your PIN to re-enter.')) { sessionStorage.removeItem('rq:admin_unlocked'); setUnlocked(false); } }} className="w-full flex items-center justify-between p-3 rounded-xl border border-red-200/50 dark:border-red-800/30 bg-red-50/60 dark:bg-red-900/10 hover:bg-red-50 transition-colors">
                <span className="text-sm font-medium text-red-700 dark:text-red-400">Lock Admin Panel</span>
                <Lock className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
