import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Navigation, Signal, Battery, Clock, Wifi } from 'lucide-react';

export default function TrackQuad() {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[80vh] bg-stone-100 rounded-3xl overflow-hidden border border-stone-200 shadow-sm">

      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm z-10">
        <button onClick={() => navigate(-1)}
          className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors text-stone-600">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-stone-900">Live Tracking</h1>
          <div className="text-xs text-stone-400 font-mono">IMEI: {imei}</div>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-emerald-600">LIVE</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative bg-[#e8e3d8] flex items-center justify-center overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />

        {/* "Roads" */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[2px] bg-stone-300/60" />
          <div className="absolute w-[2px] h-full bg-stone-300/60" />
        </div>

        {/* Signal overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {[<Signal className="w-4 h-4" />, <Battery className="w-4 h-4" />, <Wifi className="w-4 h-4" />].map((icon, i) => (
            <div key={i} className="bg-white/90 p-2 rounded-xl shadow-sm text-emerald-500 backdrop-blur-sm">{icon}</div>
          ))}
        </div>

        {/* Quad Marker */}
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 flex flex-col items-center">
          <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg mb-2 flex items-center gap-1">
            <Navigation className="w-3 h-3" /> Moving
          </div>
          <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white text-2xl">
            🏍️
          </div>
          <div className="absolute top-8 w-14 h-14 bg-emerald-500 rounded-full animate-ping opacity-15 pointer-events-none" />
        </motion.div>
      </div>

      {/* Info Panel */}
      <div className="bg-white px-5 py-5 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,.06)] z-10">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Speed',   value: '24', unit: 'km/h', icon: '🏎️' },
            { label: 'GPS',     value: '12',  unit: 'satellites', icon: '📡' },
            { label: 'Updated', value: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), unit: '', icon: '⏱️' },
          ].map(({ label, value, unit, icon }) => (
            <div key={label} className="bg-stone-50 p-3 rounded-2xl border border-stone-100 text-center">
              <div className="text-lg mb-1">{icon}</div>
              <div className="text-xs text-stone-400 font-medium">{label}</div>
              <div className="font-bold text-stone-900 text-sm mt-0.5 tabular-nums">
                {value} {unit && <span className="text-xs text-stone-400 font-normal">{unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
