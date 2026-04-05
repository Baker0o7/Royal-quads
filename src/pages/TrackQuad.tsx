import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Navigation, RefreshCw, Locate } from 'lucide-react';

const MAMBRUI_CENTER: [number, number] = [-3.3417, 40.1167];
const DEFAULT_ZOOM = 15;

const GPS_STORAGE_KEY = 'rq:gps_positions';

interface GpsPosition {
  lat: number;
  lng: number;
  speed: number;
  timestamp: number;
}

function loadGpsPositions(): Record<string, GpsPosition[]> {
  try {
    return JSON.parse(localStorage.getItem(GPS_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveGpsPosition(imei: string, pos: GpsPosition) {
  try {
    const all = loadGpsPositions();
    const history = all[imei] ?? [];
    const updated = [...history, pos].slice(-100);
    all[imei] = updated;
    localStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) { console.warn('[TrackQuad] saveGpsPosition failed:', e); }
}

function getLatestPosition(imei: string): GpsPosition | null {
  const all = loadGpsPositions();
  const history = all[imei] ?? [];
  return history.length > 0 ? history[history.length - 1] : null;
}

export default function TrackQuad() {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [positions, setPositions] = useState<GpsPosition[]>([]);
  const [latest, setLatest] = useState<GpsPosition | null>(null);
  const [mapError, setMapError] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [center, setCenter] = useState<[number, number]>(MAMBRUI_CENTER);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (!imei) return;
    const all = loadGpsPositions();
    const hist = all[imei] ?? [];
    setPositions(hist);
    const last = hist.length > 0 ? hist[hist.length - 1] : null;
    setLatest(last);
    if (last) setCenter([last.lat, last.lng]);
  }, [imei]);

  useEffect(() => {
    if (!mapRef.current || map) return;
    let L: any;

    import('leaflet').then((leafletModule) => {
      L = leafletModule.default;

      const mapInstance = L.map(mapRef.current!, {
        center,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstance);

      L.control.zoom({ position: 'topright' }).addTo(mapInstance);

      setMap(mapInstance);

      const all = loadGpsPositions();
      const hist = all[imei ?? ''] ?? [];
      if (hist.length > 0) {
        const pts: [number, number][] = hist.map(p => [p.lat, p.lng]);
        const polyline = L.polyline(pts, {
          color: 'var(--t-accent)',
          weight: 3,
          opacity: 0.7,
        }).addTo(mapInstance);

        const lastPos = hist[hist.length - 1];
        const icon = L.divIcon({
          html: `<div style="
            width:36px;height:36px;border-radius:50%;
            background:linear-gradient(135deg,var(--t-accent),var(--t-accent2));
            border:3px solid white;
            box-shadow:0 4px 12px rgba(0,0,0,0.4);
            display:flex;align-items:center;justify-content:center;
            font-size:18px;
          ">🏍️</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        const marker = L.marker([lastPos.lat, lastPos.lng], { icon }).addTo(mapInstance);
        marker.bindPopup(`<b>Royal Quads</b><br>Speed: ${lastPos.speed} km/h`);
        polylineRef.current = polyline;
        markerRef.current = marker;

        mapInstance.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      }
    }).catch((e) => {
      console.warn('[TrackQuad] Leaflet import failed:', e);
      setMapError(true);
    });
  }, [imei]);

  useEffect(() => {
    if (!map || !imei) return;
    const mounted = { current: true };
    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default;
      if (!mounted.current) return;
      const all = loadGpsPositions();
      const hist = all[imei] ?? [];
      if (hist.length === 0) return;

      const lastPos = hist[hist.length - 1];
      setLatest(lastPos);
      setLastUpdate(new Date());

      const pts: [number, number][] = hist.map(p => [p.lat, p.lng]);

      if (polylineRef.current) {
        polylineRef.current.setLatLngs(pts);
      } else {
        const polyline = L.polyline(pts, {
          color: 'var(--t-accent)', weight: 3, opacity: 0.7,
        }).addTo(map);
        polylineRef.current = polyline;
      }

      if (markerRef.current) {
        markerRef.current.setLatLng([lastPos.lat, lastPos.lng]);
        markerRef.current.setPopupContent(
          `<b>Royal Quads</b><br>Speed: ${lastPos.speed} km/h<br>Updated: ${new Date().toLocaleTimeString()}`
        );
      } else {
        const icon = L.divIcon({
          html: `<div style="
            width:36px;height:36px;border-radius:50%;
            background:linear-gradient(135deg,var(--t-accent),var(--t-accent2));
            border:3px solid white;
            box-shadow:0 4px 12px rgba(0,0,0,0.4);
            display:flex;align-items:center;justify-content:center;
            font-size:18px;
          ">🏍️</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        const marker = L.marker([lastPos.lat, lastPos.lng], { icon }).addTo(map);
        marker.bindPopup(`<b>Royal Quads</b><br>Speed: ${lastPos.speed} km/h`);
        markerRef.current = marker;
      }
    }).catch((e) => {
      console.warn('[TrackQuad] GPS update failed:', e);
    });
    return () => { mounted.current = false; };
  }, [positions, imei, map]);

  const simulateUpdate = () => {
    if (!imei) return;
    setUpdating(true);
    const jitter = () => (Math.random() - 0.5) * 0.0005;
    const newPos: GpsPosition = {
      lat: latest
        ? latest.lat + jitter()
        : MAMBRUI_CENTER[0] + (Math.random() - 0.5) * 0.005,
      lng: latest
        ? latest.lng + jitter()
        : MAMBRUI_CENTER[1] + (Math.random() - 0.5) * 0.005,
      speed: Math.round(10 + Math.random() * 30),
      timestamp: Date.now(),
    };
    saveGpsPosition(imei, newPos);
    setPositions(prev => [...prev.slice(-99), newPos]);
    setLastUpdate(new Date());
    setTimeout(() => setUpdating(false), 500);
  };

  const handleLocate = () => {
    if (latest && map) {
      map.setView([latest.lat, latest.lng], DEFAULT_ZOOM);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl transition-colors hover:opacity-70"
          style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold" style={{ color: 'var(--t-text)' }}>Live Tracking</h1>
          <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>
            IMEI: {imei}
          </p>
        </div>
        {latest && (
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" style={{ animation: 'pulse 2s infinite' }} />
            <span className="font-mono text-[10px] font-bold" style={{ color: '#16a34a' }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Map card */}
      <div className="rounded-3xl overflow-hidden shadow-sm"
        style={{ border: '1px solid var(--t-border)', height: '65vh' }}>
        {mapError ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3"
            style={{ background: 'var(--t-bg2)' }}>
            <MapPin className="w-10 h-10" style={{ color: 'var(--t-border)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--t-muted)' }}>Map unavailable</p>
            <p className="text-xs" style={{ color: 'var(--t-muted)' }}>Check your internet connection</p>
          </div>
        ) : (
          <>
            <div ref={mapRef} className="w-full h-full" />
            {/* Map controls overlay */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1000]">
              <button onClick={simulateUpdate}
                className="p-2 rounded-xl shadow-md transition-all active:scale-95"
                style={{ background: 'var(--t-bg)', color: 'var(--t-accent)', border: '1px solid var(--t-border)' }}
                title="Simulate GPS update">
                <RefreshCw className={`w-4 h-4 ${updating ? 'spinner' : ''}`} />
              </button>
              {latest && (
                <button onClick={handleLocate}
                  className="p-2 rounded-xl shadow-md transition-all active:scale-95"
                  style={{ background: 'var(--t-bg)', color: 'var(--t-accent)', border: '1px solid var(--t-border)' }}
                  title="Center on quad">
                  <Locate className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Stats bar */}
      <div className="rounded-2xl p-4 t-card">
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: 'Speed',
              value: latest ? `${latest.speed} km/h` : '—',
              icon: <Navigation className="w-4 h-4" />,
            },
            {
              label: 'Position',
              value: latest
                ? `${latest.lat.toFixed(4)}, ${latest.lng.toFixed(4)}`
                : 'Unknown',
              icon: <MapPin className="w-4 h-4" />,
            },
            {
              label: 'GPS Points',
              value: `${positions.length}`,
              icon: <span className="text-xs">📍</span>,
            },
            {
              label: 'Last Update',
              value: lastUpdate
                ? lastUpdate.toLocaleTimeString()
                : 'Never',
              icon: <RefreshCw className="w-4 h-4" />,
            },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--t-bg2)' }}>
              <div style={{ color: 'var(--t-accent)' }}>{icon}</div>
              <div>
                <p className="font-mono font-bold text-sm" style={{ color: 'var(--t-text)' }}>{value}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Location info */}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--t-border)' }}>
          <p className="text-xs font-mono text-center" style={{ color: 'var(--t-muted)' }}>
            📍 Mambrui Sand Dunes · Malindi, Kenya &nbsp;·&nbsp;
            <a href="https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6" target="_blank" rel="noopener noreferrer"
              className="underline" style={{ color: 'var(--t-accent)' }}>
              Directions
            </a>
          </p>
        </div>
      </div>

      {/* Info notice */}
      <div className="rounded-2xl p-4"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <p className="text-xs" style={{ color: '#b45309' }}>
          💡 GPS tracking requires a GPS-enabled quad with an active IMEI tracker.
          Updates are simulated for demo purposes. Connect a real GPS device for live tracking.
        </p>
      </div>
    </motion.div>
  );
}
