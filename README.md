<div align="center">

# 🏍️ Royal Quads — Mambrui Sand Dunes

**A full-featured quad bike rental management system built for the Mambrui Sand Dunes, Kenya.**

*Built with React · TypeScript · Capacitor Android · localStorage*

---

[![Deploy](https://github.com/Baker0o7/Royal-quads/actions/workflows/deploy.yml/badge.svg)](https://github.com/Baker0o7/Royal-quads/actions)

</div>

---

## ✨ Features

### 🎯 Core Booking
- **Live quad availability** — real-time status (Available / Rented / Maintenance)
- **Flexible pricing tiers** — 5 min · 10 min · 15 min · 20 min · 30 min · 1 hour
- **Promo codes** — percentage discount codes with on/off toggling
- **Group bookings** — track number of riders per session
- **Deposit system** — collect & track deposits, mark as returned
- **QR code booking** — scan a quad's QR to open its booking page directly

### ⏱️ Active Rides
- **Countdown timer** — live ring progress bar showing time remaining
- **Overtime billing** — auto-detects when time is up, bills at 100 KES/min
- **Force-end** — admin can end any ride instantly from the dashboard

### 🧾 Receipts & History
- **Digital receipt** — itemised breakdown with overtime, deposit, promo details
- **Star rating & feedback** — customers rate their experience post-ride
- **Print-ready** — receipt renders cleanly for paper printing

### 📋 Digital Waiver
- **Signature pad** — customers draw their signature on-screen
- **Indemnity agreement** — full legal waiver text displayed before signing
- **Auto-skip** — already-signed bookings skip the waiver on revisit

### 👤 User Accounts
- **Role chooser** — pick Admin, Customer, or Guest at sign-in
- **Google Sign-In** — OAuth via Google Identity Services
- **Phone + password** — traditional account registration & login
- **Guest mode** — book without creating an account
- **Ride history** — full booking history with spend totals per user

### 🛡️ Admin Dashboard (PIN-protected)
| Tab | What it does |
|-----|-------------|
| **Overview** | Live rides, recent bookings, overtime & deposit alerts, today/week/month revenue |
| **Fleet** | Add/edit/remove quads, set status, upload photos, view QR codes, GPS IMEI tracking |
| **Promos** | Create, activate/deactivate, and delete promo codes |
| **Service** | Log fuel fills, services, repairs & inspections with costs |
| **Damage** | Photo damage reports with severity levels, mark as resolved |
| **Staff** | Add operators/managers with PINs, activate/deactivate |
| **Waitlist** | Customers waiting for a quad, mark as notified |
| **Pre-books** | Scheduled bookings — confirm, cancel, convert to live ride |
| **Settings** | Change admin PIN, export CSV, lock dashboard |

### 📊 Analytics
- 7-day revenue & rides bar chart
- Peak hours heatmap (24h)
- Per-quad utilisation & revenue breakdown
- Customer stats — total, returning, top spender
- **CSV export** of all completed bookings

### 🗺️ GPS Tracking
- Live map view per quad (via IMEI)
- Track active rides from the admin dashboard

### 📅 Pre-Booking System
- Customers schedule rides in advance with date/time picker
- Admin confirms or cancels, auto-converts when ride starts

### 🎨 8 Themes
| Theme | Style |
|-------|-------|
| 🏜️ Desert | Warm sand + gold (default) |
| 🌑 Midnight | Deep charcoal dark mode |
| 🌊 Ocean | Cool teal + navy |
| 🌿 Forest | Deep green dark mode |
| 🌅 Sunset | Coral + plum dark mode |
| ❄️ Arctic | Crisp white + ice blue |
| 🌋 Volcanic | Obsidian + magma orange |
| 🌸 Rose | Blush pink + rose gold |

### 📱 Mobile-First / Android APK
- Capacitor wrapper for native Android packaging
- Camera & gallery image picker for ID photos and damage reports
- Touch-optimised tap targets throughout
- Offline-capable — all data stored in device localStorage

---

## 🚀 Run Locally

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Add your Google Client ID to .env (optional — enables Google Sign-In)
echo "GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com" > .env

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Default Admin PIN: `1234`

---

## 📦 Build APK

```bash
# Production web build
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## 🗂️ Project Structure

```
src/
├── pages/
│   ├── Home.tsx          # Booking form
│   ├── ActiveRide.tsx    # Live countdown + overtime
│   ├── Receipt.tsx       # Post-ride receipt & rating
│   ├── Waiver.tsx        # Digital signature waiver
│   ├── Profile.tsx       # Auth (Guest / Customer / Admin)
│   ├── Admin.tsx         # Admin dashboard (9 tabs)
│   ├── Analytics.tsx     # Revenue charts & stats
│   ├── QuadDetails.tsx   # Quad info & booking
│   ├── Prebook.tsx       # Schedule future rides
│   └── TrackQuad.tsx     # GPS map view
├── lib/
│   ├── api.ts            # All data access (localStorage)
│   ├── googleAuth.ts     # Google Identity Services wrapper
│   ├── ThemeContext.tsx  # 8-theme system with CSS vars
│   └── components/
│       ├── Layout.tsx    # Header + nav + footer
│       ├── ThemePicker.tsx
│       ├── ImagePicker.tsx
│       └── ui.tsx        # Shared UI primitives
└── types.ts              # All TypeScript interfaces
```

---

## 📞 Contact

**Royal Quads Mambrui**
- Yusuf Taib — [0784 589 999](tel:0784589999)
- Abubakar Bajaber — [0784 993 996](tel:0784993996)

---

<div align="center">
<sub>Built with ❤️ for the Mambrui Sand Dunes</sub>
</div>
