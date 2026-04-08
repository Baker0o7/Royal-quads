## 🏍️ Royal Quads v5.1.0 — Kotlin Native Rewrite

### Release Date: 2026-04-08

---

### 🚀 Major: Full Kotlin + Jetpack Compose Architecture

Complete native Android foundation replacing the Capacitor bridge layer. Native performance, offline-first SQLite storage, and full Android system integration.

#### New Kotlin Architecture
- **Jetpack Compose UI** — declarative, fully themed UI system (Material3)
- **Room Database** — local SQLite with 14 entities replacing localStorage
- **Hilt Dependency Injection** — clean, testable, scoped architecture  
- **DataStore Preferences** — typed async key-value storage
- **Repository Pattern** — single source of truth for all data operations
- **Kotlin Coroutines + Flow** — reactive, cancellation-safe async throughout

#### Data Layer (14 Room Entities + DAOs)
Quads · Bookings · Users · Promotions · Packages · MaintenanceLogs · DamageReports · Staff · Shifts · Waitlist · Prebookings · Incidents · LoyaltyAccounts · DynamicPricingRules

#### 8-Theme System (Material3)
🏜️ Desert · 🌑 Midnight · 🌊 Ocean · 🌿 Forest · 🌅 Sunset · ❄️ Arctic · 🌋 Volcanic · 🌸 Rose

---

### ⚡ Build Improvements
- Gradle `--build-cache --parallel` flags for faster CI builds
- KSP replaces KAPT (2x faster annotation processing)
- ABI split: arm64-v8a + armeabi-v7a only (drops ~20MB from APK)
- `minifyEnabled true` + `shrinkResources true` in release builds
- Kotlin 2.0.21 with Compose compiler plugin

---

### 🐛 Bug Fixes (from v5.0.1)
- localStorage quota exceeded handled gracefully
- All async `.then()` chains have `.catch()` handlers
- Clipboard API wrapped in try/catch
- Waiver scroll-enforcement reliable on all screen sizes

---

### Features
1. Quick Start Multi-Quad — start unlimited rides simultaneously
2. Pause & Extend Rides — +5/10/15/30 min quick-select
3. 9-Clause Digital Waiver with scroll-to-read enforcement
4. QR Code Receipts with perforated divider design
5. Admin Fleet View — expandable cards with revenue/stats per quad
6. History Search & Sort — name/phone/quad/receipt, CSV export
7. Analytics Dashboard — revenue trends, peak hours, guide commissions
8. Pre-booking with M-Pesa reference and notes
9. Dynamic Pricing Rules — peak/off-peak multipliers
10. Loyalty Points & Tiers
11. Waitlist management
12. Incident & Damage reporting
13. Staff shifts & clock-in/out
14. Backup & Restore (JSON export)

---

### Install Instructions (Android)
1. Download **Royal-Quads-v5.1.0.apk** from Assets below
2. **Settings → Security → Install unknown apps → enable**
3. Open APK → Install

### Default Admin PIN: `1234`

---
Built from [`$GITHUB_SHA`](https://github.com/Baker0o7/Royal-quads)
