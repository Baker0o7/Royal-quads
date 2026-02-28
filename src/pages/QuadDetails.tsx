import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bike, Tag, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function QuadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quad, setQuad] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quads')
      .then(res => res.json())
      .then(data => {
        const current = data.find((q: any) => q.id === Number(id));
        if (current) {
          setQuad(current);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8 text-center text-stone-500 animate-pulse">Loading quad details...</div>;
  if (!quad) return <div className="p-8 text-center text-red-500">Quad not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200">
        {quad.imageUrl ? (
          <img src={quad.imageUrl} alt={quad.name} className="w-full h-64 object-cover" />
        ) : (
          <div className="w-full h-64 bg-stone-100 flex items-center justify-center text-stone-400">
            <Bike className="w-16 h-16" />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">{quad.name}</h1>
              <div className="text-sm text-stone-500 mt-1">ID: #{quad.id}</div>
            </div>
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-bold",
              quad.status === 'available' ? "bg-emerald-100 text-emerald-700" :
              quad.status === 'rented' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
            )}>
              {quad.status.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-col gap-3 mb-8">
            {quad.imei && (
              <div className="flex items-center gap-2 text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
                <Navigation className="w-5 h-5 text-stone-400" />
                <span className="font-mono text-sm">IMEI: {quad.imei}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
              <Tag className="w-5 h-5 text-stone-400" />
              <span className="text-sm">Royal Quads Mambrui Fleet</span>
            </div>
          </div>

          {quad.status === 'available' ? (
            <Link
              to={`/?quad=${quad.id}`}
              className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 className="w-6 h-6" />
              Book This Quad
            </Link>
          ) : (
            <div className="w-full bg-stone-100 text-stone-500 p-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 border border-stone-200">
              <AlertCircle className="w-6 h-6" />
              Currently Unavailable
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
