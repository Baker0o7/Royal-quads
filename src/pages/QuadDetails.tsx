import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Navigation, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { LoadingScreen, StatusBadge } from '../lib/components/ui';
import type { Quad } from '../types';

export default function QuadDetails() {
  const { id } = useParams<{ id: string }>();
  const [quad, setQuad]     = useState<Quad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getQuads()
      .then(data => setQuad(data.find(q => q.id === Number(id)) ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingScreen text="Loading quad…" />;
  if (!quad) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <p className="text-4xl">🔍</p>
      <p className="font-display text-xl font-bold" style={{ color: 'var(--t-text)' }}>Quad not found</p>
      <Link to="/" className="btn-primary max-w-xs">Go Home</Link>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium w-fit transition-opacity hover:opacity-70"
        style={{ color: 'var(--t-muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="rounded-3xl overflow-hidden shadow-md t-card">
        {quad.imageUrl
          ? <img src={quad.imageUrl} alt={quad.name} className="w-full h-52 object-cover" />
          : (
            <div className="w-full h-52 hero-card flex flex-col items-center justify-center gap-2">
              <img src="/logo.png" alt="Royal Quad Bikes"
                className="w-24 h-24 object-cover rounded-full shadow-2xl float"
                style={{ border: '3px solid rgba(255,255,255,0.15)' }} />
              <p className="font-mono text-[10px] text-white/30 tracking-widest uppercase">Royal Quad Bikes Fleet</p>
            </div>
          )
        }

        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--t-text)' }}>{quad.name}</h1>
              <p className="font-mono text-[10px] mt-0.5 tracking-wider" style={{ color: 'var(--t-muted)' }}>
                Fleet ID #{quad.id}
              </p>
            </div>
            <StatusBadge status={quad.status} />
          </div>

          <div className="flex flex-col gap-2 mb-6">
            {quad.imei && (
              <div className="flex items-center justify-between p-3 rounded-xl border"
                style={{ background: 'var(--t-bg2)', borderColor: 'var(--t-border)' }}>
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 shrink-0" style={{ color: 'var(--t-accent)' }} />
                  <span className="font-mono text-xs" style={{ color: 'var(--t-text)' }}>{quad.imei}</span>
                </div>
                <Link to={`/track/${quad.imei}`}
                  className="text-[10px] font-semibold font-mono transition-opacity hover:opacity-70"
                  style={{ color: 'var(--t-accent)' }}>
                  Track →
                </Link>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 rounded-xl border"
              style={{ background: 'var(--t-bg2)', borderColor: 'var(--t-border)' }}>
              <span className="text-base">🏖️</span>
              <span className="text-sm" style={{ color: 'var(--t-muted)' }}>Royal Quads Mambrui Fleet</span>
            </div>
          </div>

          {quad.status === 'available' ? (
            <Link to={`/?quad=${quad.id}`}
              className="btn-primary flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Book This Quad
            </Link>
          ) : (
            <div className="w-full p-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'var(--t-bg2)', borderColor: 'var(--t-border)', color: 'var(--t-muted)' }}>
              <AlertCircle className="w-4 h-4" /> Currently Unavailable
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
