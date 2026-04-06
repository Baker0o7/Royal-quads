import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, Users, Clock, Download, BarChart3, Zap, AlertCircle, Star, Plus, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { LoadingScreen } from '../lib/components/ui';
import { useToast } from '../lib/components/Toast';
import type { DynamicPricingRule, IncidentReport, LoyaltyAccount } from '../types';

interface Rev  { date: string; revenue: number; rides: number }
interface Util { quadName: string; rides: number; revenue: number; totalMins: number }
interface Peak { hour: number; count: number }
interface CS   { total: number; returning: number; topSpender: string; topAmount: number }

export default function Analytics() {
  const [chart, setChart]         = useState<Rev[]>([]);
  const [peak, setPeak]           = useState<Peak[]>([]);
  const [util, setUtil]           = useState<Util[]>([]);
  const [customers, setCustomers] = useState<CS | null>(null);
  const [loading, setLoading]     = useState(true);
  const [dynamicRules, setDynamicRules] = useState<DynamicPricingRule[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<LoyaltyAccount[]>([]);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ quadName: '', customerName: '', type: 'mechanical' as IncidentReport['type'], description: '', reportedBy: '' });
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.getRevenueChart(), api.getPeakHours(), api.getQuadUtilisation(),
      api.getCustomerStats(), api.getDynamicPricing(), api.getIncidents(),
    ]).then(([c, p, u, cs, dr, inc]) => {
      setChart(c); setPeak(p); setUtil(u); setCustomers(cs);
      setDynamicRules(dr); setIncidents(inc);
    }).catch((e) => {
      console.warn('[Analytics] Failed to load data:', e);
    }).finally(() => setLoading(false));

    api.getBookingHistory().then(history => {
      const phones = [...new Set(history.map(b => b.customerPhone))];
      Promise.all(phones.map(p => api.getLoyaltyAccount(p)))
        .then(accounts => {
          const valid = accounts.filter((a): a is LoyaltyAccount => a !== null && a.points > 0);
          setLoyaltyAccounts(valid.sort((a, b) => b.points - a.points));
        }).catch(() => {});
    }).catch(() => {});
  }, []);

  if (loading) return <LoadingScreen text="Loading analytics…" />;

  const maxRev   = Math.max(...chart.map(d => d.revenue), 1);
  const maxCount = Math.max(...peak.map(h => h.count), 1);
  const topPeak  = peak.reduce((a, b) => b.count > a.count ? b : a, { hour: 0, count: 0 });
  const totalWeekRev = chart.reduce((s, d) => s + d.revenue, 0);
  const totalWeekRides = chart.reduce((s, d) => s + d.rides, 0);
  const currentMultiplier = api.getCurrentPriceMultiplier();

  const avgRev = totalWeekRides > 0 ? Math.round(totalWeekRev / totalWeekRides) : 0;
  const returnRate = customers && customers.total > 0
    ? Math.round(customers.returning / customers.total * 100) : 0;

  const handleToggleRule = async (rule: DynamicPricingRule) => {
    const updated = dynamicRules.map(r =>
      r.id === rule.id ? { ...r, active: !r.active } : r
    );
    try {
      await api.saveDynamicPricing(updated);
      setDynamicRules(updated);
    } catch { toast.error('Failed to update pricing rule'); }
  };

  const handleAddIncident = async () => {
    if (!incidentForm.quadName.trim() || !incidentForm.description.trim()) {
      toast.error('Quad name and description are required'); return;
    }
    try {
      const incident = await api.addIncident({
        quadName: incidentForm.quadName.trim(),
        customerName: incidentForm.customerName.trim(),
        type: incidentForm.type,
        description: incidentForm.description.trim(),
        reportedBy: incidentForm.reportedBy.trim() || 'Admin',
      });
      setIncidents([incident, ...incidents]);
      setShowIncidentForm(false);
      setIncidentForm({ quadName: '', customerName: '', type: 'mechanical', description: '', reportedBy: '' });
      toast.success('Incident logged');
    } catch { toast.error('Failed to log incident'); }
  };

  const handleDeleteIncident = async (id: number) => {
    try {
      await api.deleteIncident(id);
      setIncidents(incidents.filter(i => i.id !== id));
    } catch { toast.error('Failed to delete incident'); }
  };

  const getTiers = (points: number) => {
    if (points >= 1000) return { name: 'Platinum', color: '#6366f1', icon: '💎' };
    if (points >= 500) return { name: 'Gold', color: '#c9972a', icon: '🥇' };
    if (points >= 200) return { name: 'Silver', color: '#94a3b8', icon: '🥈' };
    return { name: 'Bronze', color: '#cd7f32', icon: '🥉' };
  };

  const tiers = [
    { name: 'Bronze',   pts: 0,    color: '#cd7f32' },
    { name: 'Silver',   pts: 200,  color: '#94a3b8' },
    { name: 'Gold',     pts: 500,  color: '#c9972a' },
    { name: 'Platinum', pts: 1000, color: '#6366f1' },
  ];

  const accountsByTier = (min: number, max: number) =>
    loyaltyAccounts.filter(a => a.points >= min && (max === 999999 || a.points < max));

  const totalPts = loyaltyAccounts.reduce((s, a) => s + a.points, 0);
  const activeMembers = loyaltyAccounts.filter(a => a.points > 0).length;
  const platinumCount = accountsByTier(1000, 999999).length;

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="t-card rounded-2xl p-5">
      <h2 className="section-heading mb-4" style={{ color: 'var(--t-text)' }}>
        <span style={{ color: 'var(--t-accent)' }}>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-xl transition-opacity hover:opacity-70"
            style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: 'var(--t-text)' }}>Analytics</h1>
            <p className="text-xs font-mono" style={{ color: 'var(--t-muted)' }}>Last 7 days</p>
          </div>
        </div>
        <button onClick={() => api.exportBookings()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'var(--t-btn-bg)', color: 'var(--t-btn-text)' }}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* EOD Summary */}
      <div className="t-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-heading mb-0" style={{ color: 'var(--t-text)' }}>
            <span style={{ color: 'var(--t-accent)' }}><TrendingUp className="w-4 h-4" /></span> End-of-Day Report
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Today Revenue', value: chart.length > 0 ? `${chart[chart.length - 1]?.revenue.toLocaleString()} KES` : '0 KES', sub: `${chart[chart.length - 1]?.rides || 0} rides`, accent: true },
            { label: 'Week Revenue', value: `${totalWeekRev.toLocaleString()} KES`, sub: `${totalWeekRides} rides`, accent: false },
            { label: 'Avg per Ride', value: `${avgRev.toLocaleString()} KES`, sub: 'per ride', accent: false },
            { label: 'Month Revenue', value: `${(totalWeekRev * 4).toLocaleString()} KES`, sub: 'est.', accent: false },
          ].map(({ label, value, sub, accent }) => (
            <div key={label} className="p-4 rounded-xl border"
              style={{ background: accent ? 'rgba(201,151,42,0.08)' : 'var(--t-bg2)', borderColor: accent ? 'rgba(201,151,42,0.25)' : 'var(--t-border)' }}>
              <p className="font-display text-2xl font-bold" style={{ color: accent ? '#c9972a' : 'var(--t-text)' }}>{value}</p>
              <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--t-muted)' }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue chart */}
      <Section icon={<TrendingUp className="w-4 h-4" />} title="Daily Revenue (KES) — 7 days">
        {chart.every(d => d.revenue === 0) ? (
          <p className="text-center text-sm py-8" style={{ color: 'var(--t-muted)' }}>No data yet</p>
        ) : (
          <>
            <div className="flex items-end gap-1.5 h-28 mb-2">
              {chart.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {d.revenue > 0 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-white text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                      style={{ background: 'var(--t-hero-to)' }}>
                      {d.revenue.toLocaleString()}
                    </div>
                  )}
                  <div className="w-full rounded-t-md transition-all duration-700"
                    style={{
                      height: `${(d.revenue / maxRev) * 96}px`,
                      minHeight: d.revenue > 0 ? '4px' : '0',
                      background: `linear-gradient(to top, var(--t-accent), var(--t-accent2))`,
                      opacity: d.revenue > 0 ? 1 : 0.15,
                    }} />
                  <span className="text-[9px] font-mono text-center" style={{ color: 'var(--t-muted)' }}>{d.date}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 pt-3 border-t" style={{ borderColor: 'var(--t-border)' }}>
              {[
                { label: 'Week Rides',  value: totalWeekRides },
                { label: 'Week Revenue', value: `${totalWeekRev.toLocaleString()} KES` },
                { label: 'Avg/Day',     value: `${Math.round(totalWeekRev / 7).toLocaleString()} KES` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="font-display font-bold text-sm" style={{ color: 'var(--t-text)' }}>{value}</p>
                  <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      {/* Peak hours */}
      <Section icon={<Clock className="w-4 h-4" />} title="Peak Hours Heatmap">
        {peak.every(h => h.count === 0) ? (
          <p className="text-center text-sm py-4" style={{ color: 'var(--t-muted)' }}>No data yet</p>
        ) : (
          <>
            <div className="flex items-end gap-0.5 h-16 mb-2">
              {peak.map(h => {
                const frac = h.count / maxCount;
                const color = frac > 0.7 ? '#ef4444' : frac > 0.4 ? '#c9972a' : frac > 0.1 ? '#16a34a' : 'var(--t-bg2)';
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(2, frac * 48)}px`, background: color }} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mb-2">
              {[0, 6, 12, 18, 23].map(h => (
                <span key={h} className="text-[9px] font-mono" style={{ color: 'var(--t-muted)' }}>{h}h</span>
              ))}
            </div>
            <div className="flex gap-3 text-[9px] font-mono" style={{ color: 'var(--t-muted)' }}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#16a34a' }} /> Low</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#c9972a' }} /> Medium</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#ef4444' }} /> Peak</span>
            </div>
            {topPeak.count > 0 && (
              <p className="text-xs font-mono mt-2" style={{ color: 'var(--t-muted)' }}>
                Busiest: <span className="font-bold" style={{ color: '#ef4444' }}>{topPeak.hour}:00</span> ({topPeak.count} rides)
              </p>
            )}
          </>
        )}
      </Section>

      {/* Quad utilisation */}
      <Section icon={<BarChart3 className="w-4 h-4" />} title="Quad Utilisation">
        {util.length === 0 ? (
          <p className="text-center text-sm py-4" style={{ color: 'var(--t-muted)' }}>No data yet</p>
        ) : (
          <div className="flex flex-col gap-3">
            {util.map((u, i) => {
              const maxU = util[0]?.revenue || 1;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>{u.quadName}</span>
                    <div className="text-right">
                      <span className="font-display font-bold text-sm" style={{ color: 'var(--t-accent)' }}>
                        {u.revenue.toLocaleString()} KES
                      </span>
                      <span className="font-mono text-[10px] ml-2" style={{ color: 'var(--t-muted)' }}>
                        {u.rides} rides · {u.totalMins} min
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--t-bg2)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(u.revenue / maxU) * 100}%`, background: `linear-gradient(to right, var(--t-accent), var(--t-accent2))` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Customer insights */}
      {customers && (
        <Section icon={<Users className="w-4 h-4" />} title="Customer Insights">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Unique Customers', value: customers.total, icon: '👤', color: '#6366f1' },
              { label: 'Return Rate', value: `${returnRate}%`, sub: `${customers.returning} returning`, icon: '🔄', color: '#16a34a' },
              { label: 'Top Spender', value: customers.topSpender || '—', sub: `${customers.topAmount.toLocaleString()} KES`, icon: '👑', color: '#c9972a' },
              { label: 'Avg per Ride', value: `${avgRev.toLocaleString()} KES`, icon: '📊', color: '#c9972a' },
            ].map(({ label, value, sub, icon: iconEl, color }) => (
              <div key={label} className="p-4 rounded-xl border" style={{ background: `${color}08`, borderColor: `${color}25` }}>
                <p className="text-xl mb-1">{iconEl}</p>
                <p className="font-display font-bold text-lg truncate" style={{ color }}>{value}</p>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--t-muted)' }}>{label}</p>
                {sub && <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>{sub}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Dynamic Pricing */}
      <Section icon={<Zap className="w-4 h-4" />} title="Dynamic Pricing">
        <div className="flex items-center gap-3 p-3 rounded-xl mb-4"
          style={{ background: 'rgba(201,151,42,0.08)', border: '1px solid rgba(201,151,42,0.25)' }}>
          <Zap className="w-4 h-4" style={{ color: '#c9972a' }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>Current Multiplier: <span className="font-display font-bold" style={{ color: '#c9972a' }}>{currentMultiplier}x</span></p>
            <p className="font-mono text-[9px]" style={{ color: 'var(--t-muted)' }}>Live — changes based on time of day</p>
          </div>
          <div className="ml-auto">
            <span className="text-[9px] font-semibold px-2 py-1 rounded-full"
              style={{ background: '#16a34a18', color: '#16a34a' }}>Active</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {dynamicRules.map(rule => {
            const isSurge = rule.multiplier > 1;
            return (
              <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: rule.active ? `${isSurge ? '#ef4444' : '#16a34a'}08` : 'var(--t-bg2)', borderColor: rule.active ? `${isSurge ? '#ef4444' : '#16a34a'}25` : 'var(--t-border)' }}>
                <button onClick={() => handleToggleRule(rule)}
                  className="relative w-10 h-6 rounded-full transition-colors"
                  style={{ background: rule.active ? '#16a34a' : 'var(--t-border)' }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                    style={{ left: rule.active ? '20px' : '2px' }} />
                </button>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: rule.active ? 'var(--t-text)' : 'var(--t-muted)' }}>{rule.label}</p>
                  <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>{rule.startHour}:00 – {rule.endHour}:00</p>
                </div>
                <span className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ background: `${isSurge ? '#ef4444' : '#16a34a'}15`, color: isSurge ? '#ef4444' : '#16a34a' }}>
                  {rule.multiplier}x
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Incidents */}
      <Section icon={<AlertCircle className="w-4 h-4" />} title={`Incident Reports (${incidents.length})`}>
        <button onClick={() => setShowIncidentForm(f => !f)}
          className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ borderColor: '#ef4444', color: '#ef4444' }}>
          <Plus className="w-3.5 h-3.5" /> Log Incident
        </button>

        {showIncidentForm && (
          <div className="mb-4 p-4 rounded-xl border" style={{ background: '#ef444408', borderColor: '#ef444430' }}>
            <div className="flex flex-col gap-2">
              <input type="text" placeholder="Quad Name *" value={incidentForm.quadName}
                onChange={e => setIncidentForm(f => ({ ...f, quadName: e.target.value }))}
                className="input text-sm" />
              <input type="text" placeholder="Customer Name" value={incidentForm.customerName}
                onChange={e => setIncidentForm(f => ({ ...f, customerName: e.target.value }))}
                className="input text-sm" />
              <select value={incidentForm.type}
                onChange={e => setIncidentForm(f => ({ ...f, type: e.target.value as IncidentReport['type'] }))}
                className="input text-sm">
                <option value="mechanical">Mechanical</option>
                <option value="fall">Fall</option>
                <option value="medical">Medical</option>
                <option value="other">Other</option>
              </select>
              <textarea placeholder="Description *" value={incidentForm.description}
                onChange={e => setIncidentForm(f => ({ ...f, description: e.target.value }))}
                className="input text-sm resize-none" rows={2} />
              <input type="text" placeholder="Reported by" value={incidentForm.reportedBy}
                onChange={e => setIncidentForm(f => ({ ...f, reportedBy: e.target.value }))}
                className="input text-sm" />
              <div className="flex gap-2">
                <button onClick={() => setShowIncidentForm(false)}
                  className="flex-1 py-2 rounded-xl border text-xs font-semibold"
                  style={{ borderColor: 'var(--t-border)', color: 'var(--t-muted)' }}>Cancel</button>
                <button onClick={handleAddIncident}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: '#ef4444', color: 'white' }}>Log Incident</button>
              </div>
            </div>
          </div>
        )}

        {incidents.length === 0 ? (
          <p className="text-center text-sm py-4" style={{ color: 'var(--t-muted)' }}>No incidents logged</p>
        ) : (
          <div className="flex flex-col gap-2">
            {incidents.slice(0, 5).map(inc => (
              <div key={inc.id} className="flex items-start gap-3 p-3 rounded-xl border"
                style={{ background: '#ef444408', borderColor: '#ef444430' }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--t-text)' }}>{inc.quadName} — {inc.type}</p>
                  <p className="font-mono text-[10px] truncate" style={{ color: 'var(--t-muted)' }}>{inc.description}</p>
                  <p className="font-mono text-[9px]" style={{ color: 'var(--t-muted)' }}>
                    {new Date(inc.date).toLocaleDateString('en-KE')} · {inc.reportedBy}
                  </p>
                </div>
                <button onClick={() => handleDeleteIncident(inc.id)}
                  className="p-1 rounded hover:opacity-70 transition-opacity shrink-0"
                  style={{ color: '#ef4444' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Loyalty Programme */}
      <Section icon={<Star className="w-4 h-4" />} title="Loyalty Programme">
        <div className="flex items-center gap-3 p-3 rounded-xl mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(201,151,42,0.12), rgba(201,151,42,0.06))', border: '1px solid rgba(201,151,42,0.3)' }}>
          <Star className="w-5 h-5" style={{ color: '#c9972a' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--t-text)' }}>Loyalty Programme</p>
            <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>1 pt per 100 KES · Bronze → Silver → Gold → Platinum</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Members', value: activeMembers, color: '#c9972a' },
            { label: 'Total Pts', value: totalPts, color: '#16a34a' },
            { label: 'Platinum', value: platinumCount, color: '#6366f1' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-3 rounded-xl border"
              style={{ background: `${color}08`, borderColor: `${color}25` }}>
              <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
              <p className="font-mono text-[9px]" style={{ color: 'var(--t-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tier breakdown */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {tiers.map(tier => {
            const count = accountsByTier(tier.pts, tier === tiers[tiers.length - 1] ? 999999 : tiers[tiers.indexOf(tier) + 1].pts).length;
            return (
              <div key={tier.name} className="text-center p-3 rounded-xl border"
                style={{ background: `${tier.color}08`, borderColor: `${tier.color}25` }}>
                <p className="text-lg">{tier.name === 'Bronze' ? '🥉' : tier.name === 'Silver' ? '🥈' : tier.name === 'Gold' ? '🥇' : '💎'}</p>
                <p className="font-display font-bold text-sm" style={{ color: tier.color }}>{count}</p>
                <p className="font-mono text-[9px]" style={{ color: 'var(--t-muted)' }}>{tier.name}</p>
              </div>
            );
          })}
        </div>

        {/* Leaderboard */}
        {loyaltyAccounts.length === 0 ? (
          <p className="text-center text-sm py-4" style={{ color: 'var(--t-muted)' }}>No loyalty accounts yet</p>
        ) : (
          <>
            <p className="text-[10px] font-mono font-bold tracking-widest mb-2" style={{ color: 'var(--t-muted)' }}>LEADERBOARD</p>
            <div className="flex flex-col gap-1.5">
              {loyaltyAccounts.slice(0, 8).map((acc, i) => {
                const tier = getTiers(acc.points);
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                const masked = acc.phone.length >= 10
                  ? `${acc.phone.slice(0, 4)}****${acc.phone.slice(-3)}` : acc.phone;
                return (
                  <div key={acc.phone} className={`flex items-center gap-3 p-2.5 rounded-xl border ${i < 3 ? 'border-opacity-30' : ''}`}
                    style={{ background: i < 3 ? `${tier.color}06` : 'var(--t-bg2)', borderColor: i < 3 ? `${tier.color}30` : 'var(--t-border)' }}>
                    <span className="w-6 text-center font-bold text-sm" style={{ color: i < 3 ? tier.color : 'var(--t-muted)' }}>{medal}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-semibold truncate" style={{ color: 'var(--t-text)' }}>{masked}</p>
                      <p className="font-mono text-[9px]" style={{ color: 'var(--t-muted)' }}>{acc.totalRides} ride{acc.totalRides !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-sm" style={{ color: tier.color }}>{acc.points} pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Section>
    </motion.div>
  );
}
