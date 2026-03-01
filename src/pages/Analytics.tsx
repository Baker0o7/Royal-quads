import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, Users, Clock, Download, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { LoadingScreen } from '../lib/components/ui';

interface RevenuePoint { date: string; revenue: number; rides: number }
interface UtilEntry { quadName: string; rides: number; revenue: number; totalMins: number }
interface PeakHour { hour: number; count: number }
interface CustomerStats { total: number; returning: number; topSpender: string; topAmount: number }

export default function Analytics() {
  const [chart, setChart] = useState<RevenuePoint[]>([]);
  const [peak, setPeak] = useState<PeakHour[]>([]);
  const [utilisation, setUtilisation] = useState<UtilEntry[]>([]);
  const [customers, setCustomers] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getRevenueChart(), api.getPeakHours(), api.getQuadUtilisation(), api.getCustomerStats()])
      .then(([c, p, u, cs]) => { setChart(c); setPeak(p); setUtilisation(u); setCustomers(cs); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen text="Loading analytics..." />;

  const maxRevenue = Math.max(...chart.map(d => d.revenue), 1);
  const maxCount = Math.max(...peak.map(h => h.count), 1);
  const peakHours = peak.filter(h => h.count > 0);
  const topPeak = peak.reduce((a, b) => b.count > a.count ? b : a, { hour: 0, count: 0 });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-xl bg-[#f5f0e8] dark:bg-[#2d2318] text-[#7a6e60] hover:text-[#c9972a] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-[#1a1612] dark:text-[#f5f0e8]">Analytics</h1>
            <p className="text-xs font-mono text-[#7a6e60] dark:text-[#a09070]">Last 7 days</p>
          </div>
        </div>
        <button onClick={() => api.exportBookings()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a1612] dark:bg-[#f5f0e8]/10 text-white dark:text-[#f5f0e8] text-xs font-semibold hover:bg-[#2d2318] transition-colors">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Revenue chart */}
      <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
        <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]">
          <TrendingUp className="w-4 h-4 text-[#c9972a]" /> Daily Revenue (KES)
        </h2>
        {chart.every(d => d.revenue === 0) ? (
          <p className="text-center text-sm text-[#7a6e60] dark:text-[#a09070] py-8">No data yet</p>
        ) : (
          <div className="flex items-end gap-1.5 h-32">
            {chart.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="relative w-full group">
                  <div className="w-full bg-gradient-to-t from-[#c9972a] to-[#e8b84b] rounded-t-md transition-all duration-700"
                    style={{ height: `${(d.revenue / maxRevenue) * 112}px`, minHeight: d.revenue > 0 ? '4px' : '0' }} />
                  {d.revenue > 0 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1a1612] text-white text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {d.revenue.toLocaleString()} KES
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-mono text-[#7a6e60] dark:text-[#a09070] text-center">{d.date}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex gap-4 pt-3 border-t border-[#c9b99a]/10 dark:border-[#c9b99a]/5">
          {[
            { label: 'Total Rides', value: chart.reduce((s, d) => s + d.rides, 0) },
            { label: 'Avg/Day', value: `${Math.round(chart.reduce((s, d) => s + d.revenue, 0) / 7).toLocaleString()} KES` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-display font-bold text-sm text-[#1a1612] dark:text-[#f5f0e8]">{value}</p>
              <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Peak hours */}
      <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
        <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]">
          <Clock className="w-4 h-4 text-[#c9972a]" /> Peak Hours Heatmap
        </h2>
        {peakHours.length === 0 ? (
          <p className="text-center text-sm text-[#7a6e60] dark:text-[#a09070] py-4">No data yet</p>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-1">
              {peak.map(h => (
                <div key={h.hour} className="flex flex-col items-center gap-0.5">
                  <div className="w-full aspect-square rounded-sm transition-colors"
                    style={{ backgroundColor: h.count === 0 ? undefined : `rgba(201,151,42,${0.15 + (h.count / maxCount) * 0.85})` }}
                    title={`${h.hour}:00 — ${h.count} ride${h.count !== 1 ? 's' : ''}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {[0, 6, 12, 18, 23].map(h => <span key={h} className="text-[9px] font-mono text-[#7a6e60] dark:text-[#a09070]">{h}h</span>)}
            </div>
            {topPeak.count > 0 && (
              <p className="mt-3 text-xs text-[#7a6e60] dark:text-[#a09070] font-mono">
                Busiest: <span className="text-[#c9972a] font-bold">{topPeak.hour}:00</span> ({topPeak.count} rides)
              </p>
            )}
          </>
        )}
      </div>

      {/* Quad utilisation */}
      <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
        <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]">
          <BarChart3 className="w-4 h-4 text-[#c9972a]" /> Quad Utilisation
        </h2>
        {utilisation.length === 0 ? (
          <p className="text-center text-sm text-[#7a6e60] dark:text-[#a09070] py-4">No data yet</p>
        ) : (
          <div className="flex flex-col gap-3">
            {utilisation.map((u, i) => {
              const maxRev = utilisation[0].revenue || 1;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-[#1a1612] dark:text-[#f5f0e8]">{u.quadName}</span>
                    <div className="text-right">
                      <span className="font-display font-bold text-sm text-[#c9972a]">{u.revenue.toLocaleString()} KES</span>
                      <span className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] ml-2">{u.rides} rides</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#f5f0e8] dark:bg-[#2d2318] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#c9972a] to-[#e8b84b] rounded-full transition-all duration-700"
                      style={{ width: `${(u.revenue / maxRev) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer stats */}
      {customers && (
        <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 p-5 backdrop-blur-sm">
          <h2 className="font-display text-sm font-bold mb-4 flex items-center gap-2 text-[#1a1612] dark:text-[#f5f0e8]">
            <Users className="w-4 h-4 text-[#c9972a]" /> Customer Insights
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Unique Customers', value: customers.total },
              { label: 'Returning Riders', value: customers.returning, sub: customers.total ? `${Math.round(customers.returning / customers.total * 100)}% retention` : '' },
              { label: 'Top Spender', value: customers.topSpender, sub: `${customers.topAmount.toLocaleString()} KES` },
              { label: 'Avg Spend', value: customers.total ? `${Math.round(customers.topAmount / (customers.total || 1)).toLocaleString()} KES` : '—' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-[#f5f0e8]/60 dark:bg-[#2d2318]/60 p-3 rounded-xl border border-[#c9b99a]/15 dark:border-[#c9b99a]/8">
                <p className="font-display font-bold text-base text-[#1a1612] dark:text-[#f5f0e8] truncate">{value}</p>
                <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] mt-0.5">{label}</p>
                {sub && <p className="font-mono text-[10px] text-[#c9972a] mt-0.5">{sub}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
