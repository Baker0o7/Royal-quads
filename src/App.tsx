/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './lib/components/Layout';
import Home from './pages/Home';
import ActiveRide from './pages/ActiveRide';
import Receipt from './pages/Receipt';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import QuadDetails from './pages/QuadDetails';
import TrackQuad from './pages/TrackQuad';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="ride/:id" element={<ActiveRide />} />
          <Route path="receipt/:id" element={<Receipt />} />
          <Route path="admin" element={<Admin />} />
          <Route path="profile" element={<Profile />} />
          <Route path="quad/:id" element={<QuadDetails />} />
          <Route path="track/:imei" element={<TrackQuad />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
