import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, MapPin, AlertTriangle, CheckCircle2, Navigation } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ActiveRide() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [overtime, setOvertime] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bookings/active')
      .then(res => res.json())
      .then(data => {
        const current = data.find((b: any) => b.id === Number(id));
        if (current) {
          setBooking(current);
          const end = new Date(current.startTime).getTime() + current.duration * 60000;
          const now = Date.now();
          if (end > now) {
            setTimeLeft(Math.floor((end - now) / 1000));
            setOvertime(0);
          } else {
            setTimeLeft(0);
            setOvertime(Math.floor((now - end) / 1000));
          }
        } else {
          // If not active, might be completed
          navigate(`/receipt/${id}`);
        }
        setLoading(false);
      });
  }, [id, navigate]);

  useEffect(() => {
    if (!booking) return;

    const timer = setInterval(() => {
      const end = new Date(booking.startTime).getTime() + booking.duration * 60000;
      const now = Date.now();
      
      if (end > now) {
        setTimeLeft(Math.floor((end - now) / 1000));
        setOvertime(0);
      } else {
        setTimeLeft(0);
        setOvertime(Math.floor((now - end) / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking]);

  const handleComplete = async () => {
    try {
      const res = await fetch(`/api/bookings/${id}/complete`, { method: 'POST' });
      if (res.ok) {
        navigate(`/receipt/${id}`);
      }
    } catch (err) {
      console.error('Failed to complete ride', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-stone-500 animate-pulse">Loading ride details...</div>;
  if (!booking) return <div className="p-8 text-center text-red-500">Ride not found</div>;

  const isOvertime = timeLeft === 0;
  const minutes = Math.floor(isOvertime ? overtime / 60 : timeLeft / 60);
  const seconds = (isOvertime ? overtime : timeLeft) % 60;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-6 items-center justify-center min-h-[70vh]"
    >
      <div className={cn(
        "w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden transition-colors duration-1000",
        isOvertime ? "bg-red-600 text-white" : "bg-stone-900 text-white"
      )}>
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white/10 p-4 rounded-full mb-6 backdrop-blur-sm">
            <Clock className={cn("w-12 h-12", isOvertime ? "animate-pulse" : "")} />
          </div>
          
          <h2 className="text-xl font-medium text-white/80 mb-2">{booking.quadName}</h2>
          
          <div className="font-mono text-7xl font-bold tracking-tighter mb-2">
            {isOvertime && "+"}{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          
          <div className="text-lg font-bold uppercase tracking-widest text-white/60 mb-8">
            {isOvertime ? "Overtime" : "Remaining"}
          </div>

          <div className="w-full bg-white/10 rounded-2xl p-4 flex flex-col gap-2 text-left backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Rider</span>
              <span className="font-bold">{booking.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Duration</span>
              <span className="font-bold">{booking.duration} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Location</span>
              <a 
                href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold flex items-center gap-1 hover:text-emerald-300 transition-colors"
              >
                <MapPin className="w-4 h-4" /> Mambrui
              </a>
            </div>
            {booking.quadImei && (
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/10">
                <span className="text-white/60 text-sm">Live Tracking</span>
                <button 
                  onClick={() => alert(`Tracking IMEI: ${booking.quadImei}\n(This would open the GPS tracking map)`)}
                  className="font-bold flex items-center gap-1 text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  <Navigation className="w-4 h-4" /> Track Quad
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </div>

      {isOvertime && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-start gap-3 border border-red-200 w-full max-w-sm"
        >
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Please return the quad</p>
            <p className="text-sm mt-1">Your rental period has ended. Please return the quad to the starting point.</p>
          </div>
        </motion.div>
      )}

      <button
        onClick={handleComplete}
        className="w-full max-w-sm bg-emerald-600 text-white p-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
      >
        <CheckCircle2 className="w-6 h-6" />
        End Ride Now
      </button>
    </motion.div>
  );
}
