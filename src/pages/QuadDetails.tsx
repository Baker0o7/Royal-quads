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
  if (!quad)   return <div className="p-8 text-center text-red-500 text-sm">Quad not found.</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
      <Link to="/" className="flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors text-sm font-medium w-fit">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-sm border border-stone-200 dark:border-stone-800">
        {quad.imageUrl
          ? <img src={quad.imageUrl} alt={quad.name} className="w-full h-56 object-cover" />
          : <div className="w-full h-56 bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-6xl">🏍️</div>
        }
        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h1 className="text-2xl font-bold">{quad.name}</h1>
              <p className="text-stone-400 text-xs mt-1">Fleet ID #{quad.id}</p>
            </div>
            <StatusBadge status={quad.status} />
          </div>
          <div className="flex flex-col gap-2 mb-7">
            {quad.imei && (
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-100 dark:border-stone-700">
                <Navigation className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="font-mono text-xs">IMEI: {quad.imei}</span>
                <Link to={`/track/${quad.imei}`} className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Live Track →</Link>
              </div>
            )}
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-100 dark:border-stone-700">
              <span className="text-lg">🏖️</span>
              <span className="text-sm">Royal Quads Mambrui Fleet</span>
            </div>
          </div>
          {quad.status === 'available'
            ? <Link to={`/?quad=${quad.id}`}
                className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
                <CheckCircle2 className="w-5 h-5" /> Book This Quad
              </Link>
            : <div className="w-full bg-stone-100 dark:bg-stone-800 text-stone-400 p-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700">
                <AlertCircle className="w-5 h-5" /> Currently Unavailable
              </div>
          }
        </div>
      </div>
    </motion.div>
  );
}
