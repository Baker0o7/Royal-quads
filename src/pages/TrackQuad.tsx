import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Navigation, Signal, Battery, Wifi } from 'lucide-react';

export default function TrackQuad() {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col rounded-3xl overflow-hidden shadow-sm"
      style={{ height: '80vh', border: '1px solid var(--t-border)' }}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b"
        style={{
          background: 'color-mix(in srgb, var(--t-bg) 90%, transparent)',
          borderColor: 'var(--t-border)',
          backdropFilter: 'blur(12px)',
        }}>
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl transition-colors hover:opacity-70"
          style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>Live Tracking</p>
          <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>IMEI: {imei}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" style={{ animation: 'pulse 2s infinite' }} />
          <span className="font-mono text-[10px] font-bold" style={{ color: '#16a34a' }}>LIVE</span>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{ background: 'var(--t-bg2)' }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(var(--t-text) 1px,transparent 1px),linear-gradient(90deg,var(--t-text) 1px,transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

        {/* Status indicators */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {[<Signal key="s" className="w-3.5 h-3.5" />, <Battery key="b" className="w-3.5 h-3.5" />, <Wifi key="w" className="w-3.5 h-3.5" />].map((icon, i) => (
            <div key={i} className="p-2 rounded-xl shadow-sm t-card"
              style={{ color: 'var(--t-accent)' }}>
              {icon}
            </div>
          ))}
        </div>

        {/* Quad marker */}
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 flex flex-col items-center">
          <div className="accent-gradient text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg mb-2 flex items-center gap-1 font-mono">
            <Navigation className="w-3 h-3" /> MOVING
          </div>
          <div className="w-14 h-14 hero-card rounded-full flex items-center justify-center shadow-2xl text-2xl"
            style={{ border: '3px solid var(--t-bg)' }}>
            🏍️
          </div>
          <div className="absolute top-8 w-14 h-14 rounded-full animate-ping opacity-10 pointer-events-none"
            style={{ background: 'var(--t-accent)' }} />
        </motion.div>
      </div>

      {/* Stats bar */}
      <div className="px-5 py-4 border-t"
        style={{
          background: 'color-mix(in srgb, var(--t-bg) 90%, transparent)',
          borderColor: 'var(--t-border)',
          backdropFilter: 'blur(12px)',
        }}>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Speed',      value: '24',  unit: 'km/h', emoji: '⚡' },
            { label: 'Satellites', value: '12',  unit: 'GPS',  emoji: '📡' },
            { label: 'Updated',    value: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), unit: '', emoji: '⏱' },
          ].map(({ label, value, unit, emoji }) => (
            <div key={label} className="p-3 rounded-2xl text-center t-card">
              <span className="text-base">{emoji}</span>
              <p className="font-mono font-bold text-sm mt-1 tabular-nums" style={{ color: 'var(--t-text)' }}>{value}</p>
              <p className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>
                {unit || label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
