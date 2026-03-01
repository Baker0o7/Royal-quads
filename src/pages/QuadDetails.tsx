import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Navigation, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { LoadingScreen, StatusBadge } from '../lib/components/ui';
import type { Quad } from '../types';

export default function QuadDetails() {
  const { id } = useParams<{ id: string }>();
  const [quad, setQuad] = useState<Quad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getQuads().then(data => { setQuad(data.find(q => q.id === Number(id)) ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingScreen text="Loading quad details..." />;
  if (!quad) return <div className="p-8 text-center text-red-500 text-sm">Quad not found.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7a6e60] dark:text-[#a09070] hover:text-[#c9972a] transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="bg-white/70 dark:bg-[#1a1612]/70 rounded-3xl overflow-hidden border border-[#c9b99a]/20 dark:border-[#c9b99a]/8 shadow-md backdrop-blur-sm">
        {quad.imageUrl
          ? <img src={quad.imageUrl} alt={quad.name} className="w-full h-52 object-cover" />
          : (
            <div className="w-full h-52 bg-gradient-to-br from-[#2d2318] to-[#1a1612] flex flex-col items-center justify-center gap-2">
              <span className="text-6xl float">🏍️</span>
              <p className="font-mono text-[10px] text-[#c9b99a]/40 tracking-widest uppercase">Royal Quads Fleet</p>
            </div>
          )
        }
        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h1 className="font-display text-2xl font-bold text-[#1a1612] dark:text-[#f5f0e8]">{quad.name}</h1>
              <p className="font-mono text-[10px] text-[#7a6e60] dark:text-[#a09070] mt-0.5 tracking-wider">Fleet ID #{quad.id}</p>
            </div>
            <StatusBadge status={quad.status} />
          </div>

          <div className="flex flex-col gap-2 mb-6">
            {quad.imei && (
              <div className="flex items-center justify-between bg-[#f5f0e8]/60 dark:bg-[#2d2318]/60 p-3 rounded-xl border border-[#c9b99a]/15 dark:border-[#c9b99a]/8">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#c9972a] shrink-0" />
                  <span className="font-mono text-xs text-[#1a1612] dark:text-[#f5f0e8]">{quad.imei}</span>
                </div>
                <Link to={`/track/${quad.imei}`}
                  className="text-[10px] font-semibold text-[#c9972a] hover:text-[#e8b84b] transition-colors font-mono">
                  Track →
                </Link>
              </div>
            )}
            <div className="flex items-center gap-2 bg-[#f5f0e8]/60 dark:bg-[#2d2318]/60 p-3 rounded-xl border border-[#c9b99a]/15 dark:border-[#c9b99a]/8">
              <span className="text-base">🏖️</span>
              <span className="text-sm text-[#7a6e60] dark:text-[#a09070]">Royal Quads Mambrui Fleet</span>
            </div>
          </div>

          {quad.status === 'available'
            ? <Link to={`/?quad=${quad.id}`} className="btn-primary block text-center">
                <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Book This Quad</span>
              </Link>
            : <div className="w-full bg-[#f5f0e8] dark:bg-[#2d2318] text-[#7a6e60] dark:text-[#a09070] p-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border border-[#c9b99a]/20 dark:border-[#c9b99a]/10">
                <AlertCircle className="w-4 h-4" /> Currently Unavailable
              </div>
          }
        </div>
      </div>
    </motion.div>
  );
}
