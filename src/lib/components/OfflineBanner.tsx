import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineBanner() {
  const [offline, setOffline]           = useState(!navigator.onLine);
  const [justReconnected, setJustRecon] = useState(false);

  useEffect(() => {
    const goOffline = () => { setOffline(true); setJustRecon(false); };
    const goOnline  = () => {
      setOffline(false);
      setJustRecon(true);
      setTimeout(() => setJustRecon(false), 3000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(offline || justReconnected) && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed top-14 left-0 right-0 z-[9990] flex justify-center px-4 pointer-events-none"
        >
          <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-lg text-xs font-semibold"
            style={offline ? {
              background: 'rgba(239,68,68,0.95)',
              color: 'white',
              backdropFilter: 'blur(12px)',
            } : {
              background: 'rgba(22,163,74,0.95)',
              color: 'white',
              backdropFilter: 'blur(12px)',
            }}>
            {offline
              ? <><WifiOff className="w-3.5 h-3.5" /> No internet — app running from local data</>
              : <><Wifi    className="w-3.5 h-3.5" /> Back online!</>
            }
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
