import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';

const VERSION = '4.9.6';
const STORAGE_KEY = `rq:whats_new_seen_${VERSION}`;

const FEATURES = [
  { emoji: '⚡', title: 'Quick Start Multi-Quad', desc: 'Start unlimited rides at once with per-quad guide names, payment methods (Cash/M-Pesa/Shee) and live commission breakdown' },
  { emoji: '⏸️', title: 'Pause & Extend Rides',  desc: 'Pause active rides and resume later. Extend rides with +5/10/15/30 min options' },
  { emoji: '📊', title: 'Enhanced Admin Fleet',   desc: 'Expandable quad cards with total rides, revenue and minutes stats per quad' },
  { emoji: '🔍', title: 'History Search & Sort',  desc: 'Search by name/phone/quad, sort by newest/oldest/highest/lowest, date group headers, CSV export' },
  { emoji: '📋', title: '9-Clause Waiver',       desc: 'Detailed safety waiver with 9 clauses, scroll-to-read enforcement and risk banner' },
  { emoji: '📲', title: 'QR Code Receipts',      desc: 'Every receipt has a QR code for quick verification' },
  { emoji: '💬', title: 'Pre-book Notes',         desc: 'Add special requests and M-Pesa ref when pre-booking a ride' },
  { emoji: '🗺️', title: 'Live GPS Map',           desc: 'Real OpenStreetMap tracking with polyline history, speed & location stats' },
];

export function WhatsNew() {
  const [open, setOpen] = useState(() => {
    try { return !localStorage.getItem(STORAGE_KEY); } catch { return false; }
  });

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setOpen(false);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9994]"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
            onClick={dismiss} />

          <motion.div key="panel"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[9995] mx-auto rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ maxWidth: '28rem', background: 'var(--t-bg)', borderTop: '1px solid var(--t-border)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--t-border)' }} />
            </div>

            {/* Header */}
            <div className="px-6 py-4 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden shadow"
                    style={{ border: '1.5px solid var(--t-border)' }}>
                    <img src="/logo.png" alt="Royal Quad Bikes" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg leading-tight" style={{ color: 'var(--t-text)' }}>
                      What's New
                    </h2>
                    <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>v{VERSION}</p>
                  </div>
                </div>
                <button onClick={dismiss} className="p-2 rounded-xl" style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Features list */}
            <div className="overflow-y-auto flex-1 px-5 pb-2">
              {FEATURES.map((f, i) => (
                <motion.div key={f.title}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i }}
                  className="flex items-start gap-4 py-3.5 border-b last:border-b-0"
                  style={{ borderColor: 'var(--t-border)' }}>
                  <span className="text-2xl shrink-0 mt-0.5">{f.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--t-text)' }}>{f.title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--t-muted)' }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="p-5 pt-3 shrink-0">
              <button onClick={dismiss} className="btn-primary w-full">
                Got it — Let's Go! 🏍️
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
