import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, Users, Clock, Download, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { LoadingScreen } from '../lib/components/ui';

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

  useEffect(() => {
    Promise.all([
      api.getRevenueChart(), api.getPeakHours(), api.getQuadUtilisation(), api.getCustomerStats(),
    ]).then(([c, p, u, cs]) => {
      setChart(c); setPeak(p); setUtil(u); setCustomers(cs);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen text="Loading analytics…" />;

  const maxRev   = Math.max(...chart.map(d => d.revenue), 1);
  const maxCount = Math.max(...peak.map(h => h.count), 1);
  const topPeak  = peak.reduce((a, b) => b.count > a.count ? b : a, { hour: 0, count: 0 });
  const totalWeekRev = chart.reduce((s, d) => s + d.revenue, 0);
  const totalWeekRides = chart.reduce((s, d) => s + d.rides, 0);

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

      {/* Revenue chart */}
      <Section icon={<TrendingUp className="w-4 h-4" />} title="Daily Revenue (KES)">
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
            <div className="grid grid-cols-12 gap-1 mb-1">
              {peak.map(h => (
                <div key={h.hour} className="aspect-square rounded-sm transition-colors"
                  style={{
                    background: h.count === 0
                      ? 'var(--t-bg2)'
                      : `color-mix(in srgb, var(--t-accent) ${Math.round(15 + (h.count / maxCount) * 85)}%, var(--t-bg2))`,
                  }}
                  title={`${h.hour}:00 — ${h.count} ride${h.count !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
            <div className="flex justify-between mb-2">
              {[0, 6, 12, 18, 23].map(h => (
                <span key={h} className="text-[9px] font-mono" style={{ color: 'var(--t-muted)' }}>{h}h</span>
              ))}
            </div>
            {topPeak.count > 0 && (
              <p className="text-xs font-mono" style={{ color: 'var(--t-muted)' }}>
                Busiest hour: <span className="font-bold" style={{ color: 'var(--t-accent)' }}>{topPeak.hour}:00</span>
                {' '}({topPeak.count} rides)
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
              const maxU = util[0].revenue || 1;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>{u.quadName}</span>
                    <div className="text-right">
                      <span className="font-display font-bold text-sm" style={{ color: 'var(--t-accent)' }}>
                        {u.revenue.toLocaleString()} KES
                      </span>
                      <span className="font-mono text-[10px] ml-2" style={{ color: 'var(--t-muted)' }}>
                        {u.rides} rides
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--t-bg2)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(u.revenue / maxU) * 100}%`,
                        background: `linear-gradient(to right, var(--t-accent), var(--t-accent2))`,
                      }} />
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
              { label: 'Unique Customers', value: customers.total },
              { label: 'Returning Riders',  value: customers.returning,
                sub: customers.total ? `${Math.round(customers.returning / customers.total * 100)}% retention` : '' },
              { label: 'Top Spender',       value: customers.topSpender,
                sub: `${customers.topAmount.toLocaleString()} KES` },
              { label: 'Customers w/ 2+ Rides', value: customers.returning },
            ].map(({ label, value, sub }) => (
              <div key={label} className="p-3 rounded-xl border" style={{ background: 'var(--t-bg2)', borderColor: 'var(--t-border)' }}>
                <p className="font-display font-bold text-base truncate" style={{ color: 'var(--t-text)' }}>{value}</p>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--t-muted)' }}>{label}</p>
                {sub && <p className="font-mono text-[10px]" style={{ color: 'var(--t-accent)' }}>{sub}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </motion.div>
  );
}
