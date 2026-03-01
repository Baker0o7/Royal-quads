import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Navigation, Signal, Battery, Wifi } from 'lucide-react';

export default function TrackQuad() {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col h-[80vh] bg-[#f5f0e8] dark:bg-[#0d0b09] rounded-3xl overflow-hidden border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 shadow-sm">
      <div className="bg-white/80 dark:bg-[#1a1612]/80 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-[#c9b99a]/15 dark:border-[#c9b99a]/8">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-[#f5f0e8] dark:bg-[#2d2318] text-[#7a6e60] hover:text-[#c9972a] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f5f0e8]">Live Tracking</p>
          <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070]">IMEI: {imei}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">LIVE</span>
        </div>
      </div>

      <div className="flex-1 relative bg-[#e8dfc9] dark:bg-[#131009] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,1) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {[<Signal className="w-3.5 h-3.5" />, <Battery className="w-3.5 h-3.5" />, <Wifi className="w-3.5 h-3.5" />].map((icon, i) => (
            <div key={i} className="bg-white/80 dark:bg-[#1a1612]/80 p-2 rounded-xl shadow-sm text-[#c9972a] backdrop-blur-sm border border-[#c9b99a]/20 dark:border-[#c9b99a]/10">{icon}</div>
          ))}
        </div>
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 flex flex-col items-center">
          <div className="bg-gradient-to-br from-[#c9972a] to-[#8a6010] text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg mb-2 flex items-center gap-1 font-mono">
            <Navigation className="w-3 h-3" /> MOVING
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-[#2d2318] to-[#1a1612] rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-[#2d2318] text-2xl">🏍️</div>
          <div className="absolute top-8 w-14 h-14 bg-[#c9972a] rounded-full animate-ping opacity-10 pointer-events-none" />
        </motion.div>
      </div>

      <div className="bg-white/80 dark:bg-[#1a1612]/80 backdrop-blur-md px-5 py-4 border-t border-[#c9b99a]/15 dark:border-[#c9b99a]/8">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Speed', value: '24', unit: 'km/h', emoji: '⚡' },
            { label: 'Satellites', value: '12', unit: 'GPS', emoji: '📡' },
            { label: 'Updated', value: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), unit: '', emoji: '⏱' },
          ].map(({ label, value, unit, emoji }) => (
            <div key={label} className="bg-[#f5f0e8]/80 dark:bg-[#2d2318]/60 p-3 rounded-2xl border border-[#c9b99a]/15 dark:border-[#c9b99a]/8 text-center">
              <span className="text-base">{emoji}</span>
              <p className="font-mono font-bold text-sm text-[#1a1612] dark:text-[#f5f0e8] mt-1 tabular-nums">{value}</p>
              <p className="font-mono text-[9px] text-[#7a6e60] dark:text-[#a09070] uppercase tracking-wider">{unit || label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
