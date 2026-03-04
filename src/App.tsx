import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './lib/components/Layout';
import { LoadingScreen } from './lib/components/ui';

// Eagerly loaded (on the critical path — shown immediately)
import Home       from './pages/Home';
import ActiveRide from './pages/ActiveRide';
import Receipt    from './pages/Receipt';
import Profile    from './pages/Profile';
import Waiver     from './pages/Waiver';

// Lazily loaded (heavy pages / less frequently visited)
const Admin       = lazy(() => import('./pages/Admin'));
const Analytics   = lazy(() => import('./pages/Analytics'));
const QuadDetails = lazy(() => import('./pages/QuadDetails'));
const TrackQuad   = lazy(() => import('./pages/TrackQuad'));
const Prebook     = lazy(() => import('./pages/Prebook'));

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen text="Loading…" />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index                   element={<Home />} />
          <Route path="ride/:id"         element={<ActiveRide />} />
          <Route path="receipt/:id"      element={<Receipt />} />
          <Route path="profile"          element={<Profile />} />
          <Route path="waiver/:bookingId" element={<Waiver />} />
          <Route path="admin"            element={<Lazy><Admin /></Lazy>} />
          <Route path="admin/analytics"  element={<Lazy><Analytics /></Lazy>} />
          <Route path="quad/:id"         element={<Lazy><QuadDetails /></Lazy>} />
          <Route path="track/:imei"      element={<Lazy><TrackQuad /></Lazy>} />
          <Route path="prebook"          element={<Lazy><Prebook /></Lazy>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
