## 🏍️ Royal Quads v5.0.1 — Stability & Performance Release

### Release Date: 2026-04-06

---

### What's New in v5.0.1

#### 🐛 Bug Fixes & Stability
- Fixed localStorage quota exceeded handling — graceful fallback with user notification
- All async operations now have proper `.catch()` error handlers throughout Admin.tsx
- Clipboard API wrapped in try/catch for devices that block it
- Waiver scroll-enforcement now reliable on all screen sizes

#### ⚡ Performance
- React 19 upgrade for faster rendering and concurrent features
- Capacitor 8.1 for improved Android bridge performance
- Tailwind 4 for smaller CSS bundle
- Vite 6 for faster builds

#### 🔒 Security
- Sentry error monitoring active for real-time crash visibility
- Input sanitization hardened via `sanitize.ts`
- Zod 4 schema validation on all form inputs

---

### Features in v5.0.0+

#### 🏍️ Ride Management
- **Quick Start Multi-Quad** — Start unlimited rides simultaneously with per-quad guide names, payment method (Cash / M-Pesa / Shee) and live 20% commission breakdown
- **Pause & Extend Rides** — Pause active rides and resume later; extend with +5/10/15/30 min quick-select
- **Live Ride Timer** — Real-time elapsed time display per active booking

#### 📋 Booking System
- **Pre-booking** — Reserve quads in advance with notes and M-Pesa reference
- **Waiver System** — 9-clause digital safety waiver with scroll-to-read enforcement
- **QR Code Receipts** — Every receipt includes a QR code with perforated divider design

#### 👤 Customer & Admin
- **Admin Fleet View** — Expandable quad cards with total rides, revenue (KES) and minutes stats per quad
- **History Search & Sort** — Search by name/phone/quad/receipt; date filter; CSV export
- **Analytics Dashboard** — Revenue trends, peak hours, guide commissions
- **Loyalty Accounts** — Track repeat customer rewards

#### 💳 Payments
- Cash, M-Pesa, and Shee payment methods
- Dynamic pricing rules
- Promotion & package management

---

### Install Instructions (Android)
1. Download **Royal-Quads-v5.0.1.apk** from the Assets below
2. On your device: **Settings → Security → Install unknown apps → enable**
3. Open the APK → **Install**

### Default Admin PIN: `1234`

---

*Built from commit [`$GITHUB_SHA`](https://github.com/Baker0o7/royal-quads)*
