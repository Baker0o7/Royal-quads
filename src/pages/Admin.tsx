import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, Calendar, Tag, Plus, Power, Edit2, X, Save, QrCode,
  Navigation, Trash2, RefreshCw, Users, Activity, Wrench, AlertOctagon,
  UserCheck, Clock, BarChart3, List, Wallet, CheckCircle2, XCircle, Lock,
  FileText, Search, CreditCard, Copy, Check, Zap, Download, ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { TILL_NUMBER } from '../lib/constants';
import { api } from '../lib/api';
import { EmptyState, ErrorMessage, StatusBadge, Spinner } from '../lib/components/ui';
import { ImagePicker } from '../lib/components/ImagePicker';
import { notifications } from '../lib/notifications';
import { sendWhatsApp, smsTemplates } from '../lib/sms';
import { useToast } from '../lib/components/Toast';
import type {
  Quad, Booking, Promotion, SalesData, MaintenanceLog,
  DamageReport, Staff, WaitlistEntry, Prebooking,
} from '../types';
import { PRICING, OVERTIME_RATE } from '../types';

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

// ─────────────────────────────────────────────────────────────────────────────
// Quick Start — unlimited quads, per-quad guide + payment + commission
// ─────────────────────────────────────────────────────────────────────────────
interface QSEntry {
  id:        number;
  quadId:    number | '';
  payMethod: 'cash' | 'mpesa' | 'shee';
  duration:  number | '';
  price:     number | '';
  guideName: string;
}

function QuickBookModal({ quads, onClose, onBooked }: {
  quads: Quad[];
  onClose: () => void;
  onBooked: () => void;
}) {
  const toast = useToast();
  const [entries, setEntries]   = useState<QSEntry[]>([{ id: 1, quadId: '', payMethod: 'cash', duration: '', price: '', guideName: '' }]);
  const [nextId,  setNextId]    = useState(2);
  const [loading, setLoading]   = useState(false);
  const [copied,  setCopied]    = useState(false);

  const available = quads.filter(q => q.status === 'available');

  const addEntry = () => {
    if (entries.length < available.length) {
      setEntries(e => [...e, { id: nextId, quadId: '', payMethod: 'cash', duration: '', price: '', guideName: '' }]);
      setNextId(n => n + 1);
    }
  };

  const removeEntry = (id: number) => {
    setEntries(e => e.filter(x => x.id !== id));
  };

  const updateEntry = (id: number, patch: Partial<QSEntry>) => {
    setEntries(e => e.map(x => x.id === id ? { ...x, ...patch } : x));
  };

  const totalRevenue = entries.reduce((s, e) => s + (Number(e.price) || 0), 0);
  const commission   = Math.round(totalRevenue * 0.20);
  const usedIds      = new Set(entries.map(e => e.quadId).filter(Boolean));

  const copyTill = () => {
    navigator.clipboard.writeText(TILL_NUMBER).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => toast.error('Failed to copy — please copy manually'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (let i = 0; i < entries.length; i++) {
      const e2 = entries[i];
      if (!e2.quadId || !e2.duration || !e2.price) {
        toast.error(`Complete all fields for Quad ${i + 1}`); return;
      }
    }
    setLoading(true);
    try {
      let firstBookingId: number | null = null;
      for (const e2 of entries) {
        const b = await api.createBooking({
          quadId: e2.quadId as number,
          customerName: 'Walk-in',
          customerPhone: '0000000000',
          duration: Number(e2.duration),
          price: Number(e2.price),
          originalPrice: Number(e2.price),
          mpesaRef: e2.payMethod === 'mpesa' ? 'MPESA-PENDING' : e2.payMethod === 'shee' ? 'SHEE' : 'CASH',
          guideName: e2.guideName.trim() || undefined,
        });
        if (firstBookingId === null) firstBookingId = b.id;
      }
      toast.success(`${entries.length} ride${entries.length > 1 ? 's' : ''} started!`);
      onBooked();
      onClose();
      if (firstBookingId !== null) {
        window.location.href = `/waiver/${firstBookingId}`;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Booking failed');
    } finally { setLoading(false); }
  };

  return (
    <motion.div className="fixed inset-0 z-[9998] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl overflow-y-auto"
        style={{ background: 'var(--t-bg)', maxHeight: '92vh' }}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--t-border)' }} />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold" style={{ color: 'var(--t-text)' }}>Quick Start</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="pill text-xs font-mono font-bold"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                {entries.length} quad{entries.length === 1 ? '' : 's'}
              </span>
              <button onClick={onClose} className="p-2 rounded-xl" style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Quad entries */}
            <div className="flex flex-col gap-4">
              {entries.map((entry, i) => {
                const localAvail = available.filter(q => q.id === entry.quadId || !usedIds.has(q.id));
                return (
                  <div key={entry.id} className="rounded-2xl p-4" style={{ background: 'var(--t-bg2)', border: '1px solid var(--t-border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs"
                          style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                          {i + 1}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>Quad {i + 1}</span>
                      </div>
                      {entries.length > 1 && (
                        <button type="button" onClick={() => removeEntry(entry.id)}
                          className="p-1 rounded-lg transition-opacity hover:opacity-60"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Quad selector */}
                    <select value={entry.quadId} onChange={e => updateEntry(entry.id, { quadId: Number(e.target.value) || '' })}
                      className="input mb-2.5 text-xs">
                      <option value="">Select Quad *</option>
                      {localAvail.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                    </select>

                    {/* Guide name */}
                    <input type="text" placeholder="Guide name (optional)"
                      value={entry.guideName}
                      onChange={e => updateEntry(entry.id, { guideName: e.target.value })}
                      className="input mb-2.5 text-xs" />

                    {/* Duration + Amount */}
                    <div className="grid grid-cols-2 gap-2 mb-2.5">
                      <select value={entry.duration} onChange={e => {
                        const d = Number(e.target.value);
                        const pricing = PRICING.find(p => p.duration === d);
                        updateEntry(entry.id, { duration: d || '', price: pricing?.price ?? entry.price });
                      }} className="input text-xs">
                        <option value="">Duration *</option>
                        {PRICING.map(p => <option key={p.duration} value={p.duration}>{p.label} ({p.price.toLocaleString()} KES)</option>)}
                      </select>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono pointer-events-none" style={{ color: 'var(--t-muted)' }}>KES</span>
                        <input type="number" placeholder="Amount *" value={entry.price}
                          onChange={e => updateEntry(entry.id, { price: Number(e.target.value) || '' })}
                          className="input text-xs pl-10" />
                      </div>
                    </div>

                    {/* Payment method */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['cash', 'mpesa', 'shee'] as const).map(method => (
                        <button type="button" key={method}
                          onClick={() => updateEntry(entry.id, { payMethod: method })}
                          className="py-2 rounded-xl text-xs font-semibold border transition-all"
                          style={{
                            background:   entry.payMethod === method ? 'rgba(34,197,94,0.12)' : 'transparent',
                            color:        entry.payMethod === method ? '#16a34a' : 'var(--t-muted)',
                            borderColor:  entry.payMethod === method ? '#16a34a' : 'var(--t-border)',
                            borderWidth:  entry.payMethod === method ? 2 : 1,
                          }}>
                          {method === 'cash' && '💵 Cash'}
                          {method === 'mpesa' && '📱 M-Pesa'}
                          {method === 'shee' && '✨ Shee'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add another */}
            {entries.length < available.length && (
              <button type="button" onClick={addEntry}
                className="py-3 rounded-xl text-xs font-semibold border transition-all"
                style={{ borderColor: 'rgba(34,197,94,0.3)', color: '#16a34a', background: 'transparent' }}>
                + Add Another Quad
              </button>
            )}

            {/* Commission breakdown */}
            {totalRevenue > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <p className="text-[11px] font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--t-muted)' }}>
                  Revenue Breakdown
                </p>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--t-muted)' }}>Total charged</span>
                  <span className="font-semibold" style={{ color: 'var(--t-text)' }}>{totalRevenue.toLocaleString()} KES</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--t-muted)' }}>Guide commission 20%</span>
                  <span className="font-semibold" style={{ color: '#16a34a' }}>{commission.toLocaleString()} KES</span>
                </div>
                <div className="border-t my-2" style={{ borderColor: 'var(--t-border)' }} />
                <div className="flex justify-between text-xs font-bold">
                  <span style={{ color: 'var(--t-text)' }}>Business keeps</span>
                  <span style={{ color: 'var(--t-accent)' }}>{(totalRevenue - commission).toLocaleString()} KES</span>
                </div>
                {entries.some(e => e.payMethod !== 'cash') && (
                  <div className="mt-2 flex flex-col gap-1">
                    {entries.map((e2, i) => (
                      e2.payMethod !== 'cash' && (
                        <div key={e2.id} className="flex items-center gap-1 text-[11px]">
                          <span style={{ color: 'var(--t-muted)' }}>Quad {i + 1}:</span>
                          <span className="font-semibold" style={{ color: 'var(--t-accent)' }}>
                            {e2.payMethod === 'mpesa' ? 'M-Pesa' : 'Shee'}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Till number reminder */}
            {entries.some(e => e.payMethod === 'mpesa') && (
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--t-bg2)', border: '1px solid var(--t-border)' }}>
                <span className="font-mono text-xs" style={{ color: 'var(--t-muted)' }}>
                  Till: <strong style={{ color: 'var(--t-text)' }}>{TILL_NUMBER}</strong>
                </span>
                <button type="button" onClick={copyTill}
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
                  style={{ background: 'var(--t-bg)', color: copied ? '#16a34a' : 'var(--t-muted)' }}>
                  {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
            )}

            <button type="submit" disabled={loading || available.length === 0}
              className="btn-primary py-3.5 text-sm font-bold">
              {loading ? 'Starting…' : (
                entries.length === 1
                  ? (totalRevenue > 0 ? `Start Ride  ·  ${totalRevenue.toLocaleString()} KES` : 'Start Ride')
                  : (totalRevenue > 0 ? `Start ${entries.length} Rides  ·  ${totalRevenue.toLocaleString()} KES` : `Start ${entries.length} Rides`)
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Cash Report Modal
// ─────────────────────────────────────────────────────────────────────────────
function DailyReportModal({ history, onClose }: {
  history: Booking[];
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [reportDate, setReportDate] = useState(today);

  const rides       = history.filter(b => b.startTime.startsWith(reportDate));
  const baseRevenue = rides.reduce((s, b) => s + b.price, 0);
  const otRevenue   = rides.reduce((s, b) => s + (b.overtimeCharge ?? 0), 0);
  const totalRev    = baseRevenue + otRevenue;
  const avgRev      = rides.length > 0 ? Math.round(totalRev / rides.length) : 0;
  const byQuad      = rides.reduce<Record<string, { count: number; revenue: number }>>((acc, b) => {
    const k = b.quadName;
    acc[k] = acc[k] || { count: 0, revenue: 0 };
    acc[k].count++;
    acc[k].revenue += b.price + (b.overtimeCharge ?? 0);
    return acc;
  }, {});

  return (
    <motion.div className="fixed inset-0 z-[9998] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl overflow-y-auto"
        style={{ background: 'var(--t-bg)', maxHeight: '92vh' }}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--t-border)' }} />
        </div>

        <div className="px-5 pb-8 pt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--t-text)' }}>
              📊 Daily Cash Report
            </h2>
            <button onClick={onClose} className="p-2 rounded-xl" style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <input type="date" value={reportDate}
            onChange={e => setReportDate(e.target.value)} max={today}
            className="input mb-4" />

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Total Rides',   value: rides.length,                  accent: false },
              { label: 'Total Revenue', value: `${totalRev.toLocaleString()} KES`, accent: true  },
              { label: 'Overtime Rev',  value: `${otRevenue.toLocaleString()} KES`, accent: false },
              { label: 'Avg Per Ride',  value: `${avgRev.toLocaleString()} KES`,    accent: false },
            ].map(({ label, value, accent }) => (
              <div key={label} className="p-3 rounded-2xl text-center"
                style={{
                  background:   accent ? 'color-mix(in srgb, var(--t-accent) 12%, var(--t-bg2))' : 'var(--t-bg2)',
                  border:       accent ? '1px solid color-mix(in srgb, var(--t-accent) 30%, transparent)' : '1px solid var(--t-border)',
                }}>
                <p className="font-display font-bold text-lg" style={{ color: accent ? 'var(--t-accent)' : 'var(--t-text)' }}>{value}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--t-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* By quad */}
          {Object.keys(byQuad).length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--t-muted)' }}>By Quad</p>
              <div className="flex flex-col gap-2">
                {Object.entries(byQuad).map(([qName, d]) => (
                  <div key={qName} className="flex justify-between items-center p-3 rounded-xl"
                    style={{ background: 'var(--t-bg2)' }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{qName}</p>
                      <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>{d.count} ride{d.count !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="font-display font-bold text-sm" style={{ color: 'var(--t-accent)' }}>
                      {d.revenue.toLocaleString()} KES
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ride list */}
          {rides.length > 0 ? (
            <div className="mb-4">
              <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--t-muted)' }}>
                All Rides ({rides.length})
              </p>
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                {rides.map(b => (
                  <div key={b.id} className="flex justify-between items-center px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'var(--t-bg2)' }}>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium truncate block" style={{ color: 'var(--t-text)' }}>{b.customerName}</span>
                      <span className="font-mono" style={{ color: 'var(--t-muted)' }}>
                        {b.quadName} · {b.duration}min · {new Date(b.startTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-bold" style={{ color: 'var(--t-accent)' }}>
                        {(b.price + (b.overtimeCharge ?? 0)).toLocaleString()} KES
                      </span>
                      {b.mpesaRef && (
                        <div className="font-mono text-[9px]" style={{ color: 'var(--t-muted)' }}>{b.mpesaRef}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center py-8 font-mono text-sm" style={{ color: 'var(--t-muted)' }}>
              No rides on {reportDate}
            </p>
          )}

          <button onClick={() => window.print()} className="btn-primary w-full">
            <FileText className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Admin() {
  const toast = useToast();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('rq:admin_unlocked') === '1');
  const [tab, setTab]           = useState<Tab>('overview');
  const [historySearch, setHistorySearch] = useState('');
  const [historyDate,   setHistoryDate]   = useState('');
  const [historySort,   setHistorySort]   = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [showQuickBook,    setShowQuickBook]    = useState(false);
  const [showDailyReport,  setShowDailyReport]  = useState(false);
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
  const [firstLoad,  setFirstLoad]  = useState(true);

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
    finally { setFirstLoad(false); }
  }, []);

  const handleUnlock = () => { sessionStorage.setItem('rq:admin_unlocked', '1'); setUnlocked(true); };

  // Tick every second so live countdown re-renders
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

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

      {/* Modals */}
      <AnimatePresence>
        {showQuickBook && (
          <QuickBookModal
            quads={quads}
            onClose={() => setShowQuickBook(false)}
            onBooked={fetchAll}
          />
        )}
        {showDailyReport && (
          <DailyReportModal
            history={history}
            onClose={() => setShowDailyReport(false)}
          />
        )}
      </AnimatePresence>

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
        {firstLoad ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="t-card rounded-2xl p-4 flex flex-col gap-2">
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-7 w-3/4 rounded" />
                </div>
              ))}
            </div>
            <div className="skeleton h-32 w-full rounded-2xl" />
            <div className="skeleton h-24 w-full rounded-2xl" />
          </div>
        ) : (<>
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-heading mb-0" style={{ color: 'var(--t-text)' }}>
              <span className="w-2 h-2 bg-green-500 rounded-full" style={{ animation: 'pulse 2s infinite' }} />
              Live Rides ({activeBookings.length})
            </h2>
            <button onClick={() => setShowQuickBook(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: 'var(--t-accent)', color: 'white' }}>
              <Plus className="w-3.5 h-3.5" /> Quick Start
            </button>
          </div>
          {activeBookings.length === 0
            ? <EmptyState message="No active rides right now." />
            : (
              <div className="flex flex-col gap-3">
                {activeBookings.map(b => {
                  const end      = new Date(b.startTime).getTime() + b.duration * 60_000;
                  const overtime = Date.now() > end;
                  const secsLeft = Math.floor((end - Date.now()) / 1000);
                  const minsLeft = Math.max(0, Math.floor(secsLeft / 60));
                  const secsPart = Math.abs(secsLeft) % 60;
                  const overtimeMins = overtime ? Math.ceil(-secsLeft / 60) : 0;
                  const overtimeKES  = overtimeMins * 100;
                  const progress     = Math.min(1, Math.max(0, (b.duration * 60 - secsLeft) / (b.duration * 60)));
                  return (
                    <div key={b.id} className="t-card rounded-2xl p-4"
                      style={{ borderColor: overtime ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.25)' }}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{b.quadName}</p>
                          <p className="font-mono text-[11px]" style={{ color: 'var(--t-muted)' }}>{b.customerName} · {b.customerPhone}</p>
                        </div>
                        {/* Live countdown badge */}
                        <span className="pill font-mono tabular-nums"
                          style={overtime
                            ? { background: 'rgba(239,68,68,0.12)', color: '#ef4444' }
                            : { background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                          {overtime
                            ? `+${overtimeMins}m ${String(secsPart).padStart(2,'0')}s OT`
                            : `${minsLeft}m ${String(secsPart).padStart(2,'0')}s`}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full overflow-hidden mb-2"
                        style={{ background: 'var(--t-border)' }}>
                        <div className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${overtime ? 100 : progress * 100}%`,
                            background: overtime ? '#ef4444' : 'var(--t-accent)',
                          }} />
                      </div>

                      {overtime && overtimeKES > 0 && (
                        <p className="font-mono text-[11px] mb-1" style={{ color: '#ef4444' }}>
                          ⏰ {overtimeKES.toLocaleString()} KES overtime accrued
                        </p>
                      )}
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
                          <button onClick={async () => { if (confirm('Force complete this ride?')) { try { await api.completeBooking(b.id, 0); fetchAll(); } catch { toast.error('Failed to end ride'); } } }}
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-heading mb-0" style={{ color: 'var(--t-text)' }}>Recent Rides</h2>
            {history.length > 0 && (
              <button
                onClick={() => {
                  const rows = [
                    ['Date', 'Time', 'Customer', 'Phone', 'Quad', 'Duration', 'Price', 'Overtime', 'Total', 'M-Pesa Ref', 'Receipt ID'],
                    ...history.map(b => [
                      new Date(b.startTime).toLocaleDateString('en-KE'),
                      new Date(b.startTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
                      b.customerName,
                      b.customerPhone,
                      b.quadName,
                      `${b.duration} min`,
                      `${b.price}`,
                      `${b.overtimeCharge ?? 0}`,
                      `${b.price + (b.overtimeCharge ?? 0)}`,
                      b.mpesaRef ?? '',
                      b.receiptId,
                    ]),
                  ];
                  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `royal-quads-rides-${new Date().toISOString().slice(0,10)}.csv`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-xl border transition-opacity hover:opacity-70"
                style={{ borderColor: 'var(--t-border)', color: 'var(--t-muted)', background: 'var(--t-bg2)' }}>
                <Download className="w-3 h-3" /> Export CSV
              </button>
            )}
          </div>

          {/* Search + date filter + sort */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <input
              type="text"
              placeholder="Search name, phone, quad…"
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              className="input flex-1 text-xs py-2"
              style={{ minWidth: 0 }}
            />
            <input
              type="date"
              value={historyDate}
              onChange={e => setHistoryDate(e.target.value)}
              className="input text-xs py-2"
              style={{ width: 130 }}
            />
            <select value={historySort} onChange={e => setHistorySort(e.target.value as typeof historySort)}
              className="input text-xs py-2" style={{ width: 110 }}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest $</option>
              <option value="lowest">Lowest $</option>
            </select>
            {(historySearch || historyDate) && (
              <button onClick={() => { setHistorySearch(''); setHistoryDate(''); }}
                className="px-3 rounded-xl border text-xs font-semibold"
                style={{ borderColor: 'var(--t-border)', color: 'var(--t-muted)', background: 'var(--t-bg2)' }}>
                Clear
              </button>
            )}
          </div>

          {(() => {
            const q = historySearch.toLowerCase();
            let filtered = history.filter(b => {
              const matchText = !q || [b.customerName, b.customerPhone, b.quadName, b.receiptId, b.mpesaRef ?? '']
                .some(v => v.toLowerCase().includes(q));
              const matchDate = !historyDate || b.startTime.startsWith(historyDate);
              return matchText && matchDate;
            });
            const sortMap: Record<typeof historySort, (a: Booking, b: Booking) => number> = {
              newest:  (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
              oldest:  (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
              highest: (a, b) => (b.price + (b.overtimeCharge ?? 0)) - (a.price + (a.overtimeCharge ?? 0)),
              lowest:  (a, b) => (a.price + (a.overtimeCharge ?? 0)) - (b.price + (b.overtimeCharge ?? 0)),
            };
            filtered = filtered.sort(sortMap[historySort]);

            // Group by date when no filter active
            const isFiltered = !!(historySearch || historyDate);
            const groups = isFiltered ? null : (() => {
              const g: Record<string, Booking[]> = {};
              filtered.forEach(b => {
                const d = b.startTime.slice(0, 10);
                if (!g[d]) g[d] = [];
                g[d].push(b);
              });
              return g;
            })();

            const shown = filtered.slice(0, isFiltered ? 50 : 20);
            const totalFiltered = filtered.reduce((s, b) => s + b.price + (b.overtimeCharge ?? 0), 0);

            if (filtered.length === 0) {
              return <EmptyState message={isFiltered ? 'No rides match this filter.' : 'No completed rides yet.'} />;
            }

            const renderRow = (b: Booking) => (
              <Link to={`/receipt/${b.id}`} key={b.id}
                className="t-card rounded-xl px-4 py-3 flex justify-between items-center hover:opacity-80 transition-opacity">
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{b.quadName}</p>
                  <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>
                    {b.customerName} · {b.duration}min
                  </p>
                  {b.mpesaRef && (
                    <p className="font-mono text-[9px] mt-0.5" style={{ color: 'var(--t-accent)' }}>
                      📱 {b.mpesaRef}
                    </p>
                  )}
                  {b.guideName && (
                    <p className="font-mono text-[9px]" style={{ color: '#b45309' }}>
                      Guide: {b.guideName}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-sm" style={{ color: 'var(--t-accent)' }}>
                    +{(b.price + (b.overtimeCharge ?? 0)).toLocaleString()} KES
                  </p>
                  {(b.overtimeCharge ?? 0) > 0 && (
                    <p className="font-mono text-[9px]" style={{ color: '#b45309' }}>
                      +{(b.overtimeCharge ?? 0).toLocaleString()} OT
                    </p>
                  )}
                  <p className="font-mono text-[9px] mt-0.5" style={{ color: 'var(--t-muted)' }}>
                    {new Date(b.startTime).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                    {' · '}
                    {new Date(b.startTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </Link>
            );

            return (
              <>
                {isFiltered && (
                  <p className="text-[10px] font-mono mb-2" style={{ color: 'var(--t-muted)' }}>
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''} · {totalFiltered.toLocaleString()} KES total
                  </p>
                )}
                {groups ? (
                  <div className="flex flex-col gap-4">
                    {Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)).map(([date, rides]) => {
                      const dayTotal = rides.reduce((s, b) => s + b.price + (b.overtimeCharge ?? 0), 0);
                      const label = date === new Date().toISOString().slice(0, 10) ? 'Today'
                        : date === new Date(Date.now() - 86400000).toISOString().slice(0, 10) ? 'Yesterday'
                        : new Date(date + 'T12:00:00').toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' });
                      return (
                        <div key={date}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>
                              {label}
                            </p>
                            <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--t-accent)' }}>
                              {dayTotal.toLocaleString()} KES
                            </span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {rides.map(renderRow)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {shown.map(renderRow)}
                  </div>
                )}
              </>
            );
          })()}
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
                  <button onClick={() => api.returnDeposit(b.id).then(fetchAll).catch(() => toast.error('Failed to return deposit'))}
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
          {quads.map(quad => {
            const quadRides = history.filter(b => b.quadId === quad.id);
            const totalRevenue = quadRides.reduce((s, b) => s + b.price + (b.overtimeCharge ?? 0), 0);
            const totalMinutes = quadRides.reduce((s, b) => s + b.duration, 0);
            const expanded = showQr === quad.id;

            return (
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
                          .catch(() => toast.error('Failed to save quad'))
                      } className="p-2 rounded-xl"
                        style={{ background: 'color-mix(in srgb, var(--t-accent) 12%, transparent)', color: 'var(--t-accent)' }}>
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                          {quad.imei && (
                            <p className="font-mono text-[9px] mt-1" style={{ color: 'var(--t-muted)' }}>
                              IMEI: {quad.imei}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={quad.status}
                          onChange={e => api.updateQuadStatus(quad.id, e.target.value).then(fetchAll).catch(() => toast.error('Failed to update status'))}
                          className="input text-[10px] font-semibold w-auto px-2 py-1.5">
                          <option value="available">Available</option>
                          <option value="rented">Rented</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                        <button onClick={() => setShowQr(expanded ? null : quad.id)}
                          className="p-2 rounded-xl transition-all"
                          style={{ background: expanded ? 'color-mix(in srgb, var(--t-accent) 15%, transparent)' : 'var(--t-bg2)', color: expanded ? 'var(--t-accent)' : 'var(--t-muted)' }}>
                          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable stats */}
                    <div className="border-t pt-3" style={{ borderColor: 'var(--t-border)' }}>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 rounded-xl" style={{ background: 'var(--t-bg2)' }}>
                          <p className="font-display font-bold text-sm" style={{ color: 'var(--t-accent)' }}>{quadRides.length}</p>
                          <p className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>Total Rides</p>
                        </div>
                        <div className="text-center p-2 rounded-xl" style={{ background: 'var(--t-bg2)' }}>
                          <p className="font-display font-bold text-sm" style={{ color: 'var(--t-accent)' }}>{totalRevenue.toLocaleString()}</p>
                          <p className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>Revenue KES</p>
                        </div>
                        <div className="text-center p-2 rounded-xl" style={{ background: 'var(--t-bg2)' }}>
                          <p className="font-display font-bold text-sm" style={{ color: 'var(--t-accent)' }}>{totalMinutes.toLocaleString()}</p>
                          <p className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>Minutes</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowQr(showQr === -quad.id ? null : -quad.id)}
                          className="flex-1 py-2 rounded-xl text-[10px] font-semibold border transition-opacity hover:opacity-70"
                          style={{ borderColor: 'var(--t-border)', color: 'var(--t-muted)', background: 'var(--t-bg2)' }}>
                          <QrCode className="w-3 h-3 inline-block mr-1" /> QR Code
                        </button>
                        <button onClick={() => {
                          if (confirm(`Delete "${quad.name}" from fleet? This cannot be undone.`)) {
                            api.deleteQuad(quad.id).then(fetchAll).catch(() => toast.error('Failed to delete quad'));
                          }
                        }}
                          className="px-3 py-2 rounded-xl transition-opacity hover:opacity-70"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {showQr === -quad.id && (
                      <div className="pt-3 border-t flex flex-col items-center gap-2" style={{ borderColor: 'var(--t-border)' }}>
                        <div className="bg-white p-2 rounded-xl shadow-sm">
                          <QRCodeSVG value={`${window.location.origin}/quad/${quad.id}`} size={130} level="H" includeMargin />
                        </div>
                        <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>Scan to book {quad.name}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
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
                <button onClick={() => api.togglePromotion(p.id, !p.isActive).then(fetchAll).catch(() => toast.error('Failed to toggle promotion'))}
                  className="p-2 rounded-xl transition-opacity hover:opacity-70"
                  style={p.isActive
                    ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
                    : { background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button onClick={async () => { if (confirm('Delete this promo?')) { try { await api.deletePromotion(p.id); fetchAll(); } catch { toast.error('Failed to delete promo'); } } }}
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
                <button onClick={() => api.deleteMaintenanceLog(log.id).then(fetchAll).catch(() => toast.error('Failed to delete log'))}
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
                    : <button onClick={() => api.resolveDamageReport(r.id).then(fetchAll).catch(() => toast.error('Failed to resolve report'))}
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
                <button onClick={() => api.updateStaff(s.id, { isActive: !s.isActive }).then(fetchAll).catch(() => toast.error('Failed to update staff'))}
                  className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                  style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
                  {s.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={async () => { if (confirm('Remove this staff member?')) { try { await api.deleteStaff(s.id); fetchAll(); } catch { toast.error('Failed to remove staff'); } } }}
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
                  : <button onClick={async () => {
                      try {
                        await api.notifyWaitlist(w.id);
                        fetchAll();
                      } catch { toast.error('Failed to notify waitlist'); }
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
              <button onClick={() => api.removeFromWaitlist(w.id).then(fetchAll).catch(() => toast.error('Failed to remove from waitlist'))}
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
                    <button onClick={async () => {
                        try {
                          await api.confirmPrebooking(pb.id);
                          fetchAll();
                        } catch { toast.error('Failed to confirm pre-booking'); }
                        const dt = new Date(pb.scheduledFor).toLocaleString('en-KE', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
                        sendWhatsApp(pb.customerPhone, smsTemplates.prebookConfirmed(pb.customerName, pb.quadName || 'a quad', dt));
                        notifications.add('prebook_confirmed', 'Pre-booking confirmed',
                          `${pb.customerName} confirmed for ${dt}`);
                      }}
                      className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1"
                      style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                      <CheckCircle2 className="w-3 h-3" /> Confirm + WhatsApp
                    </button>
                    <button onClick={() => api.cancelPrebooking(pb.id).then(fetchAll).catch(() => toast.error('Failed to cancel pre-booking'))}
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
              if (newPin.length < 4) { toast.error('PIN must be at least 4 digits'); return; }
              api.setAdminPin(newPin); setNewPin('');
              toast.success('Admin PIN updated!');
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
              <button onClick={() => setShowDailyReport(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border transition-opacity hover:opacity-75"
                style={{ background: 'var(--t-bg2)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }}>
                <span className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: 'var(--t-accent)' }} />
                  Daily Cash Report
                </span>
                <span className="text-xs font-mono" style={{ color: 'var(--t-accent)' }}>Open →</span>
              </button>
              <button onClick={() => { api.exportBookings(); toast.success('CSV export started!'); }}
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
