import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Navigation, Signal, Battery, Clock } from 'lucide-react';

export default function TrackQuad() {
  const { imei } = useParams();
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[80vh] bg-stone-100 rounded-3xl overflow-hidden relative border border-stone-200 shadow-sm"
    >
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-4 shadow-sm z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-stone-600" />
        </button>
        <div>
          <h1 className="font-bold text-lg text-stone-900">Live Tracking</h1>
          <div className="text-xs text-stone-500 font-mono">IMEI: {imei}</div>
        </div>
      </div>

      {/* Map Area (Mock) */}
      <div className="flex-1 relative bg-[#e5e3df] flex items-center justify-center overflow-hidden">
        {/* Mock Map Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        {/* Map UI Elements */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <div className="bg-white p-2 rounded-xl shadow-sm">
            <Signal className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="bg-white p-2 rounded-xl shadow-sm">
            <Battery className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        {/* Mock Quad Marker */}
        <motion.div 
          animate={{ 
            y: [0, -10, 0],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg mb-2 flex items-center gap-1">
            <Navigation className="w-3 h-3" /> Moving
          </div>
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          {/* Pulse effect */}
          <div className="absolute top-8 w-12 h-12 bg-emerald-500 rounded-full animate-ping opacity-20" />
        </motion.div>
      </div>

      {/* Bottom Info Panel */}
      <div className="bg-white p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <div className="text-stone-500 text-xs font-medium mb-1 flex items-center gap-1">
              <Navigation className="w-3 h-3" /> Speed
            </div>
            <div className="font-bold text-xl text-stone-900">24 <span className="text-sm text-stone-500">km/h</span></div>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <div className="text-stone-500 text-xs font-medium mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last Update
            </div>
            <div className="font-bold text-xl text-stone-900">Just now</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
