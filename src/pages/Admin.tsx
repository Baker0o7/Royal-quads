import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, Calendar, Tag, Plus, Power, Edit2, X, Save, QrCode,
  Navigation, Trash2, RefreshCw, Users, Activity, Wrench, AlertOctagon,
  UserCheck, Clock, BarChart3, List, Wallet, CheckCircle2, XCircle, Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../lib/api';
import { EmptyState, ErrorMessage, StatusBadge, Spinner } from '../lib/components/ui';
import { ImagePicker } from '../lib/components/ImagePicker';
import { notifications } from '../lib/notifications';
import { sendWhatsApp, smsTemplates } from '../lib/sms';
import type {
  Quad, Booking, Promotion, SalesData, MaintenanceLog,
  DamageReport, Staff, WaitlistEntry, Prebooking,
} from '../types';

type Tab = 'overview' | 'fleet' | 'promos' | 'maintenance' | 'damage' | 'staff' | 'waitlist' | 'prebookings' | 'settings';

const TABS: { key: Tab; icon: React.ReactNode; label: string }[] = [
  { key: 'overview',    icon: <Activity    className="w-4 h-4" />, label: 'Overview'  },
  { key: 'fleet',       icon: <List        className="w-4 h-4" />, label: 'Fleet'     },
  { key: 'promos',      icon: <Tag         className="w-4 h-4" />, label: 'Promos'    },
  { key: 'maintenance', icon: <Wrench      className="w-4 h-4" />, label: 'Service'   },
  { key: 'damage',      icon: <AlertOctagon className="w-4 h-4" />, label: 'Damage'   },
  { key: 'staff',       icon: <UserCheck   className="w-4 h-4" />, label: 'Staff'     },
  { key: 'waitlist',    icon: <Clock       className="w-4 h-4" />, label: 'Waitlist'  },
  { key: 'prebookings', icon: <Calendar    className="w-4 h-4" />, label: 'Pre-books' },
  { key: 'settings',   icon: <Lock        className="w-4 h-4" />, label: 'Settings'  },
];

// ── Shared themed card wrapper ────────────────────────────────────────────
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`t-card rounded-2xl p-5 ${className}`}>{children}</div>
  );
}

// ── Section heading inside panel ──────────────────────────────────────────
function PanelHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--t-text)' }}>
      <span style={{ color: 'var(--t-accent)' }}>{icon}</span>
      {children}
    </h2>
  );
}

// ── Admin PIN gate ────────────────────────────────────────────────────────
function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin]   = useState('');
  const [err, setErr]   = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (api.verifyAdminPin(pin)) { onUnlock(); }
    else { setErr('Incorrect PIN'); setPin(''); }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <div className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center shadow-lg">
        <Lock className="w-7 h-7 text-white" />
      </div>
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--t-text)' }}>Admin Access</h1>
        <p className="text-xs font-mono mt-1" style={{ color: 'var(--t-muted)' }}>Enter your PIN to continue</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3 w-full max-w-xs">
        <input type="password" inputMode="numeric" maxLength={6} placeholder="Enter PIN" value={pin}
          onChange={e => { setPin(e.target.value); setErr(''); }}
          className="input text-center font-mono text-2xl tracking-[0.5em]" autoFocus />
        {err && <p className="text-xs font-mono text-center" style={{ color: '#ef4444' }}>{err}</p>}
        <button type="submit" className="btn-primary">Unlock</button>
      </form>
      <p className="text-[10px] font-mono" style={{ color: 'var(--t-muted)' }}>Default PIN: 1234</p>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent = false }: {
  icon: React.ReactNode; label: string; value: string; accent?: boolean;
}) {
  return (
    <div className="rounded-2xl p-4 border"
      style={accent
        ? { background: 'linear-gradient(135deg, var(--t-hero-from), var(--t-hero-to))', borderColor: 'color-mix(in srgb, var(--t-accent) 30%, transparent)', color: 'white' }
        : { background: 'var(--t-card)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }}>
      <div className="mb-2" style={{ color: accent ? 'var(--t-accent2)' : 'var(--t-accent)' }}>{icon}</div>
      <p className="font-display font-bold text-xl">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider mt-0.5"
        style={{ color: accent ? 'rgba(255,255,255,0.45)' : 'var(--t-muted)' }}>{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('rq:admin_unlocked') === '1');
  const [tab, setTab]           = useState<Tab>('overview');
  const [sales, setSales]       = useState<SalesData>({ total: 0, today: 0, thisWeek: 0, thisMonth: 0, overtimeRevenue: 0 });
  const [activeBookings, setActive] = useState<Booking[]>([]);
  const [history, setHistory]   = useState<Booking[]>([]);
  const [quads, setQuads]       = useState<Quad[]>([]);
  const [promotions, setPromos] = useState<Promotion[]>([]);
  const [maintLogs, setMaintLogs]   = useState<MaintenanceLog[]>([]);
  const [damageReports, setDmgReports] = useState<DamageReport[]>([]);
  const [staff, setStaff]       = useState<Staff[]>([]);
  const [waitlist, setWait]     = useState<WaitlistEntry[]>([]);
  const [prebookings, setPrebooks] = useState<Prebooking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fleet
  const [newName, setNewName]   = useState('');
  const [newImg, setNewImg]     = useState('');
  const [newImei, setNewImei]   = useState('');
  const [quadErr, setQuadErr]   = useState('');
  const [editId, setEditId]     = useState<number | null>(null);
  const [editData, setEditData] = useState({ name: '', imageUrl: '', imei: '' });
  const [showQr, setShowQr]     = useState<number | null>(null);

  // Promo
  const [promoCode, setPromoCode]   = useState('');
  const [promoPct, setPromoPct]     = useState('');
  const [promoErr, setPromoErr]     = useState('');

  // Maintenance
  const [maint, setMaint] = useState({ quadId: 0, type: 'service' as MaintenanceLog['type'], description: '', cost: '', date: new Date().toISOString().slice(0, 10) });
  const [maintErr, setMaintErr] = useState('');

  // Damage
  const [dmg, setDmg] = useState({ quadId: 0, description: '', severity: 'minor' as DamageReport['severity'], repairCost: '', photoUrl: '' });
  const [dmgErr, setDmgErr] = useState('');

  // Staff form
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', pin: '', role: 'operator' as Staff['role'] });
  const [staffErr, setStaffErr] = useState('');

  // Settings
  const [newPin, setNewPin]   = useState('');
  const [pinMsg, setPinMsg]   = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [s, active, hist, promos, qs, ml, dr, sf, wl, pb] = await Promise.all([
        api.getSales(), api.getActiveBookings(), api.getBookingHistory(),
        api.getPromotions(), api.getQuads(), api.getMaintenanceLogs(),
        api.getDamageReports(), api.getStaff(), api.getWaitlist(), api.getPrebookings(),
      ]);
      setSales(s); setActive(active); setHistory(hist); setPromos(promos);
      setQuads(qs); setMaintLogs(ml); setDmgReports(dr); setStaff(sf); setWait(wl); setPrebooks(pb);
    } catch (err) { console.error('Admin fetch error', err); }
  }, []);

  const handleUnlock = () => { sessionStorage.setItem('rq:admin_unlocked', '1'); setUnlocked(true); };

  useEffect(() => {
    if (!unlocked) return;
    fetchAll();
    const t = setInterval(fetchAll, 15_000);
    return () => clearInterval(t);
  }, [fetchAll, unlocked]);

  const refresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

  if (!unlocked) return <PinGate onUnlock={handleUnlock} />;

  // ── STATUS PILL ────────────────────────────────────────────────────────
  const prebookColor: Record<string, { bg: string; color: string }> = {
    pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#b45309' },
    confirmed: { bg: 'rgba(34,197,94,0.12)',   color: '#16a34a' },
    cancelled: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
    converted: { bg: 'rgba(59,130,246,0.12)',  color: '#2563eb' },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--t-text)' }}>Dashboard</h1>
          <p className="font-mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--t-muted)' }}>
            Royal Quads Admin
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/analytics"
            className="p-2.5 rounded-xl border t-card transition-opacity hover:opacity-70"
            style={{ color: 'var(--t-muted)' }}
            title="Analytics">
            <BarChart3 className="w-4 h-4" />
          </Link>
          <button onClick={refresh}
            className="p-2.5 rounded-xl border t-card transition-opacity hover:opacity-70"
            style={{ color: 'var(--t-muted)' }}
            title="Refresh">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'spinner' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="tab-bar -mx-4 px-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          OVERVIEW
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (<>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Today's Revenue"  value={`${sales.today.toLocaleString()} KES`} accent />
          <StatCard icon={<Calendar   className="w-4 h-4" />} label="This Week"        value={`${sales.thisWeek.toLocaleString()} KES`} />
          <StatCard icon={<Activity   className="w-4 h-4" />} label="Active Rides"     value={`${activeBookings.length}`} />
          <StatCard icon={<Users      className="w-4 h-4" />} label="Total Rides"      value={`${history.length}`} />
          <StatCard icon={<Wallet     className="w-4 h-4" />} label="Overtime Revenue" value={`${sales.overtimeRevenue.toLocaleString()} KES`} />
          <StatCard icon={<TrendingUp className="w-4 h-4" />} label="This Month"       value={`${sales.thisMonth.toLocaleString()} KES`} />
        </div>

        {/* Live rides */}
        <section>
          <h2 className="section-heading" style={{ color: 'var(--t-text)' }}>
            <span className="w-2 h-2 bg-green-500 rounded-full" style={{ animation: 'pulse 2s infinite' }} />
            Live Rides ({activeBookings.length})
          </h2>
          {activeBookings.length === 0
            ? <EmptyState message="No active rides right now." />
            : (
              <div className="flex flex-col gap-3">
                {activeBookings.map(b => {
                  const end     = new Date(b.startTime).getTime() + b.duration * 60_000;
                  const overtime = Date.now() > end;
                  const minsLeft = Math.max(0, Math.floor((end - Date.now()) / 60_000));
                  return (
                    <div key={b.id} className="t-card rounded-2xl p-4"
                      style={{ borderColor: overtime ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.25)' }}>
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{b.quadName}</p>
                        <span className="pill"
                          style={overtime
                            ? { background: 'rgba(239,68,68,0.12)', color: '#ef4444' }
                            : { background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                          {overtime ? 'Overtime' : `${minsLeft}m left`}
                        </span>
                      </div>
                      <p className="font-mono text-[11px]" style={{ color: 'var(--t-muted)' }}>
                        {b.customerName} · {b.customerPhone}
                      </p>
                      {(b.depositAmount ?? 0) > 0 && (
                        <p className="font-mono text-[10px] mt-1" style={{ color: '#b45309' }}>
                          Deposit: {(b.depositAmount ?? 0).toLocaleString()} KES {b.depositReturned ? '(returned)' : '(held)'}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-3 pt-2 border-t"
                        style={{ borderColor: 'var(--t-border)' }}>
                        <span className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>
                          Since {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex gap-1.5">
                          {b.idPhotoUrl && (
                            <button onClick={() => window.open(b.idPhotoUrl!, '_blank')}
                              className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                              style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>ID</button>
                          )}
                          {b.quadImei && (
                            <Link to={`/track/${b.quadImei}`}
                              className="text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1"
                              style={{ background: 'color-mix(in srgb, var(--t-accent) 12%, transparent)', color: 'var(--t-accent)' }}>
                              <Navigation className="w-3 h-3" /> Track
                            </Link>
                          )}
                          <button onClick={() => { if (confirm('Force complete this ride?')) api.completeBooking(b.id, 0).then(fetchAll); }}
                            className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>End</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </section>

        {/* Recent rides */}
        <section>
          <h2 className="section-heading" style={{ color: 'var(--t-text)' }}>Recent Rides</h2>
          {history.length === 0
            ? <EmptyState message="No completed rides yet." />
            : (
              <div className="flex flex-col gap-2">
                {history.slice(0, 15).map(b => (
                  <div key={b.id} className="t-card rounded-xl px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{b.quadName}</p>
                      <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>
                        {b.customerName} · {b.duration}min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-sm" style={{ color: 'var(--t-accent)' }}>
                        +{(b.price + (b.overtimeCharge ?? 0)).toLocaleString()} KES
                      </p>
                      {(b.overtimeCharge ?? 0) > 0 && (
                        <p className="font-mono text-[9px]" style={{ color: '#b45309' }}>
                          +{(b.overtimeCharge ?? 0).toLocaleString()} overtime
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </section>

        {/* Deposits to return */}
        {history.filter(b => (b.depositAmount ?? 0) > 0 && !b.depositReturned).length > 0 && (
          <section>
            <h2 className="section-heading" style={{ color: '#b45309' }}>
              <Wallet className="w-4 h-4" /> Deposits to Return
            </h2>
            <div className="flex flex-col gap-2">
              {history.filter(b => (b.depositAmount ?? 0) > 0 && !b.depositReturned).map(b => (
                <div key={b.id} className="p-3 rounded-xl flex justify-between items-center"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{b.customerName}</p>
                    <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>
                      {(b.depositAmount ?? 0).toLocaleString()} KES deposit
                    </p>
                  </div>
                  <button onClick={() => api.returnDeposit(b.id).then(fetchAll)}
                    className="text-[10px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                    <CheckCircle2 className="w-3 h-3" /> Returned
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </>)}

      {/* ══════════════════════════════════════════════════════════════════
          FLEET
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'fleet' && (<>
        <Panel>
          <PanelHeading icon={<Plus className="w-4 h-4" />}>Add Quad</PanelHeading>
          <form onSubmit={async e => {
            e.preventDefault(); setQuadErr('');
            try {
              await api.createQuad({ name: newName.trim(), imageUrl: newImg || undefined, imei: newImei || undefined });
              setNewName(''); setNewImg(''); setNewImei(''); fetchAll();
            } catch (e) { setQuadErr(e instanceof Error ? e.message : 'Error'); }
          }} className="flex flex-col gap-3">
            <input type="text" placeholder="Quad Name *" value={newName}
              onChange={e => setNewName(e.target.value)} className="input" required />
            <ImagePicker value={newImg} onChange={setNewImg} />
            <input type="text" placeholder="IMEI for GPS tracking (optional)" value={newImei}
              onChange={e => setNewImei(e.target.value)} className="input font-mono" />
            <ErrorMessage message={quadErr} />
            <button type="submit" className="btn-primary">Add to Fleet</button>
          </form>
        </Panel>

        <div className="flex flex-col gap-3">
          {quads.length === 0 && <EmptyState message="No quads in fleet yet." />}
          {quads.map(quad => (
            <div key={quad.id} className="t-card rounded-2xl p-4 flex flex-col gap-3">
              {editId === quad.id ? (
                <div className="flex flex-col gap-3">
                  <input value={editData.name}
                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                    className="input font-semibold" placeholder="Quad name" />
                  <ImagePicker value={editData.imageUrl}
                    onChange={v => setEditData({ ...editData, imageUrl: v })} />
                  <input value={editData.imei}
                    onChange={e => setEditData({ ...editData, imei: e.target.value })}
                    className="input font-mono text-sm" placeholder="IMEI (optional)" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditId(null)}
                      className="p-2 rounded-xl" style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={() =>
                      api.updateQuad(quad.id, { name: editData.name, imageUrl: editData.imageUrl, imei: editData.imei, status: quad.status })
                        .then(() => { setEditId(null); fetchAll(); })
                    } className="p-2 rounded-xl"
                      style={{ background: 'color-mix(in srgb, var(--t-accent) 12%, transparent)', color: 'var(--t-accent)' }}>
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {quad.imageUrl
                      ? <img src={quad.imageUrl} alt={quad.name} className="w-14 h-14 rounded-xl object-cover shrink-0 border" style={{ borderColor: 'var(--t-border)' }} />
                      : <div className="w-14 h-14 rounded-xl hero-card flex items-center justify-center text-2xl shrink-0">🏍️</div>
                    }
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{quad.name}</span>
                        <button onClick={() => { setEditId(quad.id); setEditData({ name: quad.name, imageUrl: quad.imageUrl ?? '', imei: quad.imei ?? '' }); }}
                          className="transition-opacity hover:opacity-60" style={{ color: 'var(--t-muted)' }}>
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      <StatusBadge status={quad.status} />
                      {quad.imei && <p className="font-mono text-[9px] mt-1" style={{ color: 'var(--t-muted)' }}>{quad.imei}</p>}
                      <button onClick={() => setShowQr(showQr === quad.id ? null : quad.id)}
                        className="mt-1 flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-70"
                        style={{ color: 'var(--t-muted)' }}>
                        <QrCode className="w-2.5 h-2.5" />
                        {showQr === quad.id ? 'Hide QR' : 'Show QR'}
                      </button>
                    </div>
                  </div>
                  <select value={quad.status}
                    onChange={e => api.updateQuadStatus(quad.id, e.target.value).then(fetchAll)}
                    className="input text-[10px] font-semibold w-auto px-2 py-1.5" style={{ width: 'auto' }}>
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              )}
              {showQr === quad.id && editId !== quad.id && (
                <div className="pt-3 border-t flex flex-col items-center gap-2" style={{ borderColor: 'var(--t-border)' }}>
                  <div className="bg-white p-2 rounded-xl shadow-sm">
                    <QRCodeSVG value={`${window.location.origin}/quad/${quad.id}`} size={130} level="H" includeMargin />
                  </div>
                  <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>Scan to book {quad.name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </>)}

      {/* ══════════════════════════════════════════════════════════════════
          PROMOS
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'promos' && (<>
        <Panel>
          <PanelHeading icon={<Plus className="w-4 h-4" />}>New Promo Code</PanelHeading>
          <form onSubmit={async e => {
            e.preventDefault(); setPromoErr('');
            try {
              await api.createPromotion(promoCode, parseInt(promoPct));
              setPromoCode(''); setPromoPct(''); fetchAll();
            } catch (e) { setPromoErr(e instanceof Error ? e.message : 'Error'); }
          }} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input type="text" placeholder="CODE" value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                className="input flex-1 uppercase font-mono tracking-widest" required />
              <div className="relative w-24">
                <input type="number" placeholder="%" value={promoPct}
                  onChange={e => setPromoPct(e.target.value)} min="1" max="100"
                  className="input pr-7" required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold pointer-events-none"
                  style={{ color: 'var(--t-muted)' }}>%</span>
              </div>
            </div>
            <ErrorMessage message={promoErr} />
            <button type="submit" className="btn-primary">Create Code</button>
          </form>
        </Panel>
        <div className="flex flex-col gap-3">
          {promotions.length === 0 && <EmptyState message="No promo codes yet." />}
          {promotions.map(p => (
            <div key={p.id} className="t-card rounded-2xl p-4 flex justify-between items-center"
              style={{ opacity: p.isActive ? 1 : 0.55 }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold tracking-widest text-sm" style={{ color: 'var(--t-text)' }}>{p.code}</span>
                  <span className="pill" style={{ background: 'color-mix(in srgb, var(--t-accent) 12%, transparent)', color: 'var(--t-accent)' }}>
                    {p.discountPercentage}% OFF
                  </span>
                </div>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--t-muted)' }}>
                  {p.isActive ? '● Active' : '○ Inactive'}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => api.togglePromotion(p.id, !p.isActive).then(fetchAll)}
                  className="p-2 rounded-xl transition-opacity hover:opacity-70"
                  style={p.isActive
                    ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
                    : { background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { if (confirm('Delete this promo?')) api.deletePromotion(p.id).then(fetchAll); }}
                  className="p-2 rounded-xl transition-opacity hover:opacity-70"
                  style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* ══════════════════════════════════════════════════════════════════
          MAINTENANCE
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'maintenance' && (<>
        <Panel>
          <PanelHeading icon={<Plus className="w-4 h-4" />}>Log Service</PanelHeading>
          <form onSubmit={async e => {
            e.preventDefault(); setMaintErr('');
            if (!maint.quadId) { setMaintErr('Please select a quad'); return; }
            try {
              const quad = quads.find(q => q.id === maint.quadId);
              await api.addMaintenanceLog({ ...maint, quadName: quad?.name ?? '', cost: Number(maint.cost) || 0, operatorId: null, operatorName: null });
              setMaint({ quadId: 0, type: 'service', description: '', cost: '', date: new Date().toISOString().slice(0, 10) });
              fetchAll();
            } catch (e) { setMaintErr(e instanceof Error ? e.message : 'Error'); }
          }} className="flex flex-col gap-3">
            <select value={maint.quadId} onChange={e => setMaint({ ...maint, quadId: Number(e.target.value) })} className="input">
              <option value={0}>Select Quad *</option>
              {quads.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select value={maint.type} onChange={e => setMaint({ ...maint, type: e.target.value as MaintenanceLog['type'] })} className="input">
                <option value="service">Service</option>
                <option value="fuel">Fuel</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
              </select>
              <input type="date" value={maint.date} onChange={e => setMaint({ ...maint, date: e.target.value })} className="input font-mono" />
            </div>
            <input type="text" placeholder="Description *" value={maint.description}
              onChange={e => setMaint({ ...maint, description: e.target.value })} className="input" required />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono pointer-events-none" style={{ color: 'var(--t-muted)' }}>KES</span>
              <input type="number" placeholder="Cost" value={maint.cost}
                onChange={e => setMaint({ ...maint, cost: e.target.value })} min="0"
                style={{ paddingLeft: '3rem' }} className="input" />
            </div>
            <ErrorMessage message={maintErr} />
            <button type="submit" className="btn-primary">Add Log</button>
          </form>
        </Panel>
        <div className="flex flex-col gap-2">
          {maintLogs.length === 0 && <EmptyState message="No maintenance logs yet." />}
          {(maintLogs as MaintenanceLog[]).map(log => (
            <div key={log.id} className="t-card rounded-xl p-4 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{log.quadName}</span>
                  <span className="pill capitalize"
                    style={{ background: 'color-mix(in srgb, var(--t-accent) 12%, transparent)', color: 'var(--t-accent)' }}>
                    {log.type}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--t-muted)' }}>{log.description}</p>
                <p className="font-mono text-[10px] mt-1" style={{ color: 'var(--t-muted)' }}>{new Date(log.date).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {log.cost > 0 && <span className="font-mono font-bold text-sm" style={{ color: 'var(--t-accent)' }}>{log.cost.toLocaleString()} KES</span>}
                <button onClick={() => api.deleteMaintenanceLog(log.id).then(fetchAll)}
                  className="p-1.5 rounded-lg transition-opacity hover:opacity-60"
                  style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* ══════════════════════════════════════════════════════════════════
          DAMAGE
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'damage' && (<>
        <Panel>
          <PanelHeading icon={<Plus className="w-4 h-4" />}>Report Damage</PanelHeading>
          <form onSubmit={async e => {
            e.preventDefault(); setDmgErr('');
            if (!dmg.quadId) { setDmgErr('Please select a quad'); return; }
            try {
              const quad = quads.find(q => q.id === dmg.quadId);
              await api.addDamageReport({
                quadId: dmg.quadId, quadName: quad?.name ?? '',
                bookingId: null, customerName: null,
                description: dmg.description, photoUrl: dmg.photoUrl || null,
                severity: dmg.severity, repairCost: Number(dmg.repairCost) || 0,
                resolved: false, date: new Date().toISOString(),
              });
              setDmg({ quadId: 0, description: '', severity: 'minor', repairCost: '', photoUrl: '' });
              fetchAll();
            } catch (e) { setDmgErr(e instanceof Error ? e.message : 'Error'); }
          }} className="flex flex-col gap-3">
            <select value={dmg.quadId} onChange={e => setDmg({ ...dmg, quadId: Number(e.target.value) })} className="input">
              <option value={0}>Select Quad *</option>
              {quads.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select value={dmg.severity} onChange={e => setDmg({ ...dmg, severity: e.target.value as DamageReport['severity'] })} className="input">
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono pointer-events-none" style={{ color: 'var(--t-muted)' }}>KES</span>
                <input type="number" placeholder="Repair cost" value={dmg.repairCost}
                  onChange={e => setDmg({ ...dmg, repairCost: e.target.value })} min="0"
                  style={{ paddingLeft: '3rem' }} className="input" />
              </div>
            </div>
            <input type="text" placeholder="Description *" value={dmg.description}
              onChange={e => setDmg({ ...dmg, description: e.target.value })} className="input" required />
            <ImagePicker value={dmg.photoUrl} onChange={v => setDmg({ ...dmg, photoUrl: v })} />
            <ErrorMessage message={dmgErr} />
            <button type="submit" className="btn-primary">Submit Report</button>
          </form>
        </Panel>
        <div className="flex flex-col gap-3">
          {damageReports.length === 0 && <EmptyState message="No damage reports." />}
          {(damageReports as DamageReport[]).map(r => {            const sev = r.severity === 'severe'
              ? { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', color: '#ef4444' }
              : r.severity === 'moderate'
              ? { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', color: '#b45309' }
              : { bg: 'var(--t-card)',          border: 'var(--t-border)',          color: 'var(--t-muted)' };
            return (
              <div key={r.id} className="rounded-2xl p-4 border"
                style={{ background: r.resolved ? 'var(--t-bg2)' : sev.bg, borderColor: r.resolved ? 'var(--t-border)' : sev.border, opacity: r.resolved ? 0.6 : 1 }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{r.quadName}</span>
                    <span className="pill capitalize" style={{ background: `${sev.color}18`, color: sev.color }}>{r.severity}</span>
                  </div>
                  {r.resolved
                    ? <span className="text-[10px] font-mono" style={{ color: '#16a34a' }}>✓ Resolved</span>
                    : <button onClick={() => api.resolveDamageReport(r.id).then(fetchAll)}
                        className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>Mark Resolved</button>
                  }
                </div>
                <p className="text-xs" style={{ color: 'var(--t-muted)' }}>{r.description}</p>
                {r.photoUrl && <img src={r.photoUrl} alt="Damage" className="mt-2 w-full h-32 object-cover rounded-xl" style={{ border: '1px solid var(--t-border)' }} />}
                <div className="flex justify-between items-center mt-2">
                  {r.repairCost > 0 && <span className="font-mono text-xs font-bold" style={{ color: '#ef4444' }}>Repair: {r.repairCost.toLocaleString()} KES</span>}
                  <span className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>{new Date(r.date).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </>)}

      {/* ══════════════════════════════════════════════════════════════════
          STAFF
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'staff' && (<>
        <Panel>
          <PanelHeading icon={<Plus className="w-4 h-4" />}>Add Staff Member</PanelHeading>
          <form onSubmit={async e => {
            e.preventDefault(); setStaffErr('');
            if (newStaff.pin.length < 4) { setStaffErr('PIN must be at least 4 digits'); return; }
            try {
              await api.addStaff({ ...newStaff, isActive: true });
              setNewStaff({ name: '', phone: '', pin: '', role: 'operator' }); fetchAll();
            } catch (e) { setStaffErr(e instanceof Error ? e.message : 'Error'); }
          }} className="flex flex-col gap-3">
            <input type="text" placeholder="Full Name *" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} className="input" required />
            <input type="tel" placeholder="Phone Number *" value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} className="input" required />
            <div className="grid grid-cols-2 gap-2">
              <input type="password" inputMode="numeric" maxLength={6} placeholder="PIN *" value={newStaff.pin} onChange={e => setNewStaff({ ...newStaff, pin: e.target.value })} className="input font-mono tracking-widest" required />
              <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value as Staff['role'] })} className="input">
                <option value="operator">Operator</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <ErrorMessage message={staffErr} />
            <button type="submit" className="btn-primary">Add Staff Member</button>
          </form>
        </Panel>
        <div className="flex flex-col gap-3">
          {staff.length === 0 && <EmptyState message="No staff members yet." />}
          {staff.map(s => (
            <div key={s.id} className="t-card rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{s.name}</p>
                <p className="font-mono text-[10px] mt-0.5 capitalize" style={{ color: 'var(--t-muted)' }}>
                  {s.phone} · {s.role}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.isActive ? '#22c55e' : 'var(--t-border)' }} />
                <button onClick={() => api.updateStaff(s.id, { isActive: !s.isActive }).then(fetchAll)}
                  className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                  style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
                  {s.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => { if (confirm('Remove this staff member?')) api.deleteStaff(s.id).then(fetchAll); }}
                  className="p-1.5 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* ══════════════════════════════════════════════════════════════════
          WAITLIST
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'waitlist' && (<>
        <div className="p-4 rounded-2xl font-mono text-xs"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#b45309' }}>
          {waitlist.filter(w => !w.notified).length} customer(s) waiting ·{' '}
          {quads.filter(q => q.status === 'available').length} quad(s) available
        </div>
        <div className="flex flex-col gap-3">
          {waitlist.length === 0 && <EmptyState message="Waitlist is empty." />}
          {waitlist.map(w => (
            <div key={w.id} className="t-card rounded-2xl p-4" style={{ opacity: w.notified ? 0.5 : 1 }}>
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{w.customerName}</p>
                {w.notified
                  ? <span className="text-[10px] font-mono" style={{ color: '#16a34a' }}>✓ Notified</span>
                  : <button onClick={() => {
                      api.notifyWaitlist(w.id).then(fetchAll);
                      sendWhatsApp(w.customerPhone, smsTemplates.waitlistReady(w.customerName));
                      notifications.add('info', 'Waitlist notified',
                        `WhatsApp sent to ${w.customerName} — quad available`);
                    }}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1"
                      style={{ background: '#22c55e', color: 'white' }}>
                      📲 Notify via WhatsApp
                    </button>
                }
              </div>
              <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>
                {w.customerPhone} · {w.duration}min requested
              </p>
              <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--t-muted)' }}>
                Added {new Date(w.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <button onClick={() => api.removeFromWaitlist(w.id).then(fetchAll)}
                className="mt-2 text-[10px] font-mono transition-opacity hover:opacity-70"
                style={{ color: '#ef4444' }}>Remove</button>
            </div>
          ))}
        </div>
      </>)}

      {/* ══════════════════════════════════════════════════════════════════
          PRE-BOOKINGS
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'prebookings' && (<>
        <div className="grid grid-cols-3 gap-2 text-center">
          {(['pending', 'confirmed', 'converted'] as const).map(s => (
            <div key={s} className="t-card rounded-xl p-3">
              <p className="font-display font-bold text-lg" style={{ color: 'var(--t-text)' }}>
                {prebookings.filter(p => p.status === s).length}
              </p>
              <p className="font-mono text-[10px] capitalize" style={{ color: 'var(--t-muted)' }}>{s}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {prebookings.length === 0 && <EmptyState message="No pre-bookings yet." />}
          {prebookings.map(pb => {
            const c = prebookColor[pb.status] ?? prebookColor.pending;
            return (
              <div key={pb.id} className="t-card rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{pb.customerName}</p>
                    <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>{pb.customerPhone}</p>
                  </div>
                  <span className="pill capitalize" style={{ background: c.bg, color: c.color }}>{pb.status}</span>
                </div>
                <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>
                  {pb.quadName || 'Any quad'} · {pb.duration}min · {pb.price.toLocaleString()} KES
                </p>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--t-muted)' }}>
                  📅 {new Date(pb.scheduledFor).toLocaleString()}
                </p>
                {pb.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => {
                        api.confirmPrebooking(pb.id).then(fetchAll);
                        const dt = new Date(pb.scheduledFor).toLocaleString('en-KE', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
                        sendWhatsApp(pb.customerPhone, smsTemplates.prebookConfirmed(pb.customerName, pb.quadName || 'a quad', dt));
                        notifications.add('prebook_confirmed', 'Pre-booking confirmed',
                          `${pb.customerName} confirmed for ${dt}`);
                      }}
                      className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1"
                      style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                      <CheckCircle2 className="w-3 h-3" /> Confirm + WhatsApp
                    </button>
                    <button onClick={() => api.cancelPrebooking(pb.id).then(fetchAll)}
                      className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                      <XCircle className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>)}

      {/* ══════════════════════════════════════════════════════════════════
          SETTINGS
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'settings' && (
        <div className="flex flex-col gap-5">
          <Panel>
            <PanelHeading icon={<Lock className="w-4 h-4" />}>Change Admin PIN</PanelHeading>
            <form onSubmit={e => {
              e.preventDefault();
              if (newPin.length < 4) { setPinMsg('PIN must be at least 4 digits'); return; }
              api.setAdminPin(newPin); setNewPin('');
              setPinMsg('PIN updated ✓');
              setTimeout(() => setPinMsg(''), 3000);
            }} className="flex flex-col gap-3">
              <input type="password" inputMode="numeric" maxLength={6} placeholder="New PIN (4–6 digits)"
                value={newPin} onChange={e => setNewPin(e.target.value)}
                className="input font-mono tracking-widest text-center text-xl" />
              {pinMsg && (
                <p className="text-xs font-mono text-center"
                  style={{ color: pinMsg.includes('✓') ? '#16a34a' : '#ef4444' }}>{pinMsg}</p>
              )}
              <button type="submit" className="btn-primary">Update PIN</button>
            </form>
          </Panel>

          <Panel>
            <PanelHeading icon={<Wallet className="w-4 h-4" />}>Data Management</PanelHeading>
            <div className="flex flex-col gap-3">
              <button onClick={() => api.exportBookings()}
                className="w-full flex items-center justify-between p-3 rounded-xl border transition-opacity hover:opacity-75"
                style={{ background: 'var(--t-bg2)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }}>
                <span className="text-sm font-medium">Export Bookings CSV</span>
                <span className="text-xs font-mono" style={{ color: 'var(--t-accent)' }}>Download →</span>
              </button>
              <button onClick={() => {
                if (confirm("Lock admin panel? You'll need your PIN to re-enter.")) {
                  sessionStorage.removeItem('rq:admin_unlocked');
                  setUnlocked(false);
                }
              }} className="w-full flex items-center justify-between p-3 rounded-xl border transition-opacity hover:opacity-75"
                style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.25)', color: '#ef4444' }}>
                <span className="text-sm font-medium">Lock Admin Panel</span>
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </Panel>
        </div>
      )}

    </motion.div>
  );
}
