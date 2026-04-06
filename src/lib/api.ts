import type {
  Quad, Booking, User, Promotion, Package, SalesData,
  MaintenanceLog, DamageReport, Staff, Shift, WaitlistEntry, Prebooking,
  IncidentReport, LoyaltyAccount, DynamicPricingRule,
} from '../types';
import { OVERTIME_RATE } from '../types';

// ─── Storage helpers ──────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fallback; }
  catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { console.warn('[api] localStorage save failed:', e); }
}
function nextId(key: string): number { const id = load<number>(key, 0) + 1; save(key, id); return id; }

function normPhone(phone: string): string {
  return phone.replace(/[\s\-().]+/g, '').replace(/^0/, '254');
}

function receiptId(): string {
  return 'RQ-' + Date.now().toString(36).toUpperCase().slice(-6);
}

// ─── Accessors ────────────────────────────────────────────────────────────────
type StoredUser = User & { password: string };

function getQuads(): Quad[] {
  const stored = load<Quad[] | null>('rq:quads', null);
  if (!stored || stored.length === 0) {
    const seed: Quad[] = [1,2,3,4,5].map(i => ({ id: i, name: `Quad ${i}`, status: 'available', imageUrl: null, imei: null }));
    save('rq:quads', seed); save('rq:quad_seq', 5); return seed;
  }
  const activeIds = new Set(load<Booking[]>('rq:bookings', []).filter(b => b.status === 'active').map(b => b.quadId));
  const healed = stored.map(q => q.status === 'rented' && !activeIds.has(q.id) ? { ...q, status: 'available' as const } : q);
  if (healed.some((q, i) => q.status !== stored[i].status)) save('rq:quads', healed);
  return healed;
}
function setQuads(q: Quad[]) { save('rq:quads', q); }
function getBookings(): Booking[] { return load<Booking[]>('rq:bookings', []); }
function setBookings(b: Booking[]) { save('rq:bookings', b); }
function getUsers(): StoredUser[] { return load<StoredUser[]>('rq:users', []); }
function setUsers(u: StoredUser[]) { save('rq:users', u); }
function getPromotions(): Promotion[] { return load<Promotion[]>('rq:promotions', []); }
function setPromotions(p: Promotion[]) { save('rq:promotions', p); }
function getPackages(): Package[] { return load<Package[]>('rq:packages', []); }
function setPackages(p: Package[]) { save('rq:packages', p); }
function getMaintenanceLogs(): MaintenanceLog[] { return load<MaintenanceLog[]>('rq:maintenance', []); }
function setMaintenanceLogs(l: MaintenanceLog[]) { save('rq:maintenance', l); }
function getDamageReports(): DamageReport[] { return load<DamageReport[]>('rq:damage', []); }
function setDamageReports(r: DamageReport[]) { save('rq:damage', r); }
function getStaff(): Staff[] { return load<Staff[]>('rq:staff', []); }
function setStaff(s: Staff[]) { save('rq:staff', s); }
function getShifts(): Shift[] { return load<Shift[]>('rq:shifts', []); }
function setShifts(s: Shift[]) { save('rq:shifts', s); }
function getWaitlist(): WaitlistEntry[] { return load<WaitlistEntry[]>('rq:waitlist', []); }
function setWaitlist(w: WaitlistEntry[]) { save('rq:waitlist', w); }
function getPrebookings(): Prebooking[] { return load<Prebooking[]>('rq:prebookings', []); }
function setPrebookings(p: Prebooking[]) { save('rq:prebookings', p); }
function getIncidents(): IncidentReport[] { return load<IncidentReport[]>('rq:incidents', []); }
function setIncidents(i: IncidentReport[]) { save('rq:incidents', i); }
function getLoyalty(): Record<string, LoyaltyAccount> { return load<Record<string, LoyaltyAccount>>('rq:loyalty', {}); }
function setLoyalty(m: Record<string, LoyaltyAccount>) { save('rq:loyalty', m); }
function getDynamicPricing(): DynamicPricingRule[] { return load<DynamicPricingRule[]>('rq:dynamic_pricing', []); }
function setDynamicPricing(r: DynamicPricingRule[]) { save('rq:dynamic_pricing', r); }

const BACKUP_KEYS = [
  'rq:quads','rq:bookings','rq:prebookings','rq:promotions',
  'rq:incidents','rq:staff','rq:maintenance','rq:loyalty',
  'rq:admin_pin','rq:theme','rq:onboarded',
  'rq:quad_seq','rq:booking_seq','rq:incident_seq','rq:user_seq',
  'rq:dynamic_pricing',
];

// ─── CSV export helper ────────────────────────────────────────────────────────
function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))];
  return lines.join('\n');
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const api = {

  // ── Quads ──
  getQuads: async () => getQuads(),
  createQuad: async (body: { name: string; imageUrl?: string; imei?: string }): Promise<Quad> => {
    if (!body.name?.trim()) throw new Error('Name is required');
    const quad: Quad = { id: nextId('rq:quad_seq'), name: body.name.trim(), status: 'available', imageUrl: body.imageUrl || null, imei: body.imei || null };
    setQuads([...getQuads(), quad]); return quad;
  },
  updateQuad: async (id: number, body: { name: string; status: string; imageUrl?: string; imei?: string }) => {
    setQuads(getQuads().map(q => q.id === id ? { ...q, ...body, status: body.status as Quad['status'], imageUrl: body.imageUrl || null, imei: body.imei || null } : q));
    return { success: true };
  },
  updateQuadStatus: async (id: number, status: string) => {
    setQuads(getQuads().map(q => q.id === id ? { ...q, status: status as Quad['status'] } : q));
    return { success: true };
  },
  deleteQuad: async (id: number) => {
    setQuads(getQuads().filter(q => q.id !== id));
    return { success: true };
  },

  // ── Bookings ──
  createBooking: async (body: {
    quadId: number; userId?: number | null; customerName: string; customerPhone: string;
    duration: number; price: number; originalPrice: number; promoCode?: string | null;
    isPrebooked?: boolean; prebookTime?: string; groupSize?: number;
    idPhotoUrl?: string | null; waiverSigned?: boolean; depositAmount?: number;
    operatorId?: number | null; mpesaRef?: string | null; guideName?: string | null;
  }): Promise<{ id: number; receiptId: string; startTime: string }> => {
    const quads = getQuads();
    const quad = quads.find(q => q.id === body.quadId);
    if (!quad) throw new Error('Quad not found');
    if (quad.status !== 'available') throw new Error('Quad is not available');
    const id = nextId('rq:booking_seq');
    const startTime = new Date().toISOString();
    const guideName = body.guideName?.trim().length ? body.guideName.trim() : null;
    const booking: Booking = {
      id, quadId: body.quadId, userId: body.userId ?? null,
      customerName: body.customerName.trim(), customerPhone: normPhone(body.customerPhone),
      duration: body.duration, price: body.price, originalPrice: body.originalPrice,
      promoCode: body.promoCode ?? null, startTime, endTime: null, status: 'active',
      receiptId: receiptId(), rating: null, feedback: null,
      quadName: quad.name, quadImageUrl: quad.imageUrl, quadImei: quad.imei,
      isPrebooked: body.isPrebooked ?? false, prebookTime: body.prebookTime ?? null,
      groupSize: body.groupSize ?? 1, idPhotoUrl: body.idPhotoUrl ?? null,
      waiverSigned: body.waiverSigned ?? false,
      waiverSignedAt: body.waiverSigned ? new Date().toISOString() : null,
      depositAmount: body.depositAmount ?? 0, depositReturned: false,
      operatorId: body.operatorId ?? null,
      mpesaRef: body.mpesaRef?.trim().toUpperCase() ?? null,
      overtimeMinutes: 0, overtimeCharge: 0,
      guideName, guidePaid: false,
    };
    setBookings([...getBookings(), booking]);
    setQuads(quads.map(q => q.id === body.quadId ? { ...q, status: 'rented' } : q));
    return { id, receiptId: booking.receiptId, startTime };
  },

  getActiveBookings: async (): Promise<Booking[]> => getBookings().filter(b => b.status === 'active'),
  getBookingHistory: async (): Promise<Booking[]> =>
    getBookings().filter(b => b.status === 'completed').sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime()),

  completeBooking: async (id: number, overtimeMinutes = 0) => {
    const endTime = new Date().toISOString();
    const overtimeCharge = overtimeMinutes * OVERTIME_RATE;
    let quadId = 0;
    setBookings(getBookings().map(b => {
      if (b.id === id) { quadId = b.quadId; return { ...b, status: 'completed' as const, endTime, overtimeMinutes, overtimeCharge }; }
      return b;
    }));
    if (quadId) setQuads(getQuads().map(q => q.id === quadId ? { ...q, status: 'available' } : q));
    return { success: true, endTime };
  },
  updateBookingStartTime: async (id: number, newStartTime: string) => {
    setBookings(getBookings().map(b => b.id === id ? { ...b, startTime: newStartTime } : b));
    return { success: true };
  },

  returnDeposit: async (id: number) => {
    setBookings(getBookings().map(b => b.id === id ? { ...b, depositReturned: true } : b));
    return { success: true };
  },

  signWaiver: async (id: number) => {
    setBookings(getBookings().map(b =>
      b.id === id ? { ...b, waiverSigned: true, waiverSignedAt: new Date().toISOString() } : b
    ));
    return { success: true };
  },

  submitFeedback: async (id: number, rating: number, feedback: string) => {
    setBookings(getBookings().map(b => b.id === id ? { ...b, rating, feedback } : b));
    return { success: true };
  },

  // ── Sales / Analytics ──
  getSales: async (): Promise<SalesData> => {
    const completed = getBookings().filter(b => b.status === 'completed');
    const now = new Date();
    const todayStr = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);
    const monthAgo = new Date(now.getTime() - 30 * 86400_000);
    const rev = (b: Booking) => b.price + (b.overtimeCharge || 0);
    return {
      total: completed.reduce((s, b) => s + rev(b), 0),
      today: completed.filter(b => b.endTime && new Date(b.endTime).toDateString() === todayStr).reduce((s, b) => s + rev(b), 0),
      thisWeek: completed.filter(b => b.endTime && new Date(b.endTime) >= weekAgo).reduce((s, b) => s + rev(b), 0),
      thisMonth: completed.filter(b => b.endTime && new Date(b.endTime) >= monthAgo).reduce((s, b) => s + rev(b), 0),
      overtimeRevenue: completed.reduce((s, b) => s + (b.overtimeCharge || 0), 0),
    };
  },

  getRevenueChart: async (): Promise<{ date: string; revenue: number; rides: number }[]> => {
    const completed = getBookings().filter(b => b.status === 'completed' && b.endTime);
    const days: Record<string, { revenue: number; rides: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
      days[key] = { revenue: 0, rides: 0 };
    }
    completed.forEach(b => {
      const key = new Date(b.endTime!).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
      if (days[key]) { days[key].revenue += b.price + (b.overtimeCharge || 0); days[key].rides++; }
    });
    return Object.entries(days).map(([date, v]) => ({ date, ...v }));
  },

  getPeakHours: async (): Promise<{ hour: number; count: number }[]> => {
    const completed = getBookings().filter(b => b.status === 'completed');
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    completed.forEach(b => { const h = new Date(b.startTime).getHours(); hours[h].count++; });
    return hours;
  },

  getQuadUtilisation: async (): Promise<{ quadName: string; rides: number; revenue: number; totalMins: number }[]> => {
    const completed = getBookings().filter(b => b.status === 'completed');
    const map: Record<string, { rides: number; revenue: number; totalMins: number }> = {};
    completed.forEach(b => {
      if (!map[b.quadName]) map[b.quadName] = { rides: 0, revenue: 0, totalMins: 0 };
      map[b.quadName].rides++; map[b.quadName].revenue += b.price; map[b.quadName].totalMins += b.duration;
    });
    return Object.entries(map).map(([quadName, v]) => ({ quadName, ...v })).sort((a, b) => b.revenue - a.revenue);
  },

  getCustomerStats: async (): Promise<{ total: number; returning: number; topSpender: string; topAmount: number }> => {
    const completed = getBookings().filter(b => b.status === 'completed');
    const byPhone: Record<string, { name: string; count: number; spent: number }> = {};
    completed.forEach(b => {
      if (!byPhone[b.customerPhone]) byPhone[b.customerPhone] = { name: b.customerName, count: 0, spent: 0 };
      byPhone[b.customerPhone].count++; byPhone[b.customerPhone].spent += b.price;
    });
    const entries = Object.values(byPhone);
    const returning = entries.filter(e => e.count > 1).length;
    const top = entries.sort((a, b) => b.spent - a.spent)[0];
    return { total: entries.length, returning, topSpender: top?.name || '—', topAmount: top?.spent || 0 };
  },

  exportBookings: () => {
    const rows = getBookings().filter(b => b.status === 'completed').map(b => ({
      receiptId: b.receiptId, date: b.startTime ? new Date(b.startTime).toLocaleDateString() : '',
      customer: b.customerName, phone: b.customerPhone, quad: b.quadName,
      duration: b.duration, price: b.price, overtime: b.overtimeCharge || 0,
      total: b.price + (b.overtimeCharge || 0), promo: b.promoCode || '', rating: b.rating || '',
    }));
    downloadCSV(`royal-quads-${new Date().toISOString().slice(0,10)}.csv`, rows as Record<string, unknown>[]);
  },

  // ── Auth ──
  login: async (phone: string, password: string): Promise<User> => {
    const norm = normPhone(phone);
    const user = getUsers().find(u => normPhone(u.phone) === norm && u.password === password);
    if (!user) throw new Error('Invalid phone number or password');
    const { password: _, ...safe } = user; void _; return safe;
  },
  register: async (name: string, phone: string, password: string): Promise<User> => {
    if (!name?.trim()) throw new Error('Name is required');
    if (!phone?.trim()) throw new Error('Phone number is required');
    if (!password || password.length < 4) throw new Error('Password must be at least 4 characters');
    const norm = normPhone(phone);
    if (norm.length < 9) throw new Error('Enter a valid phone number');
    if (getUsers().find(u => normPhone(u.phone) === norm)) throw new Error('Phone number already registered');
    const user: StoredUser = { id: nextId('rq:user_seq'), name: name.trim(), phone: norm, role: 'user', password };
    setUsers([...getUsers(), user]);
    const { password: _, ...safe } = user; void _; return safe;
  },
  getUserHistory: async (userId: number) => getBookings().filter(b => b.userId === userId).sort((a, b) => b.id - a.id),

  // ── Promotions ──
  getPromotions: async () => getPromotions().slice().reverse(),
  createPromotion: async (code: string, discountPercentage: number): Promise<Promotion> => {
    if (!code?.trim()) throw new Error('Code is required');
    if (discountPercentage < 1 || discountPercentage > 100) throw new Error('Discount must be 1–100%');
    const upper = code.toUpperCase().trim();
    if (getPromotions().find(p => p.code === upper)) throw new Error('Promo code already exists');
    const promo: Promotion = { id: nextId('rq:promo_seq'), code: upper, discountPercentage, isActive: 1 };
    setPromotions([...getPromotions(), promo]); return promo;
  },
  togglePromotion: async (id: number, isActive: boolean) => { setPromotions(getPromotions().map(p => p.id === id ? { ...p, isActive: isActive ? 1 : 0 } : p)); return { success: true }; },
  deletePromotion: async (id: number) => { setPromotions(getPromotions().filter(p => p.id !== id)); return { success: true }; },
  validatePromotion: async (code: string): Promise<Promotion | null> => {
    const promo = getPromotions().find(p => p.code === code.toUpperCase().trim() && p.isActive === 1);
    return promo ?? null;
  },

  // ── Packages ──
  getPackages: async () => getPackages(),
  createPackage: async (body: Omit<Package, 'id'>): Promise<Package> => {
    const pkg: Package = { ...body, id: nextId('rq:pkg_seq') };
    setPackages([...getPackages(), pkg]); return pkg;
  },
  togglePackage: async (id: number, isActive: number) => { setPackages(getPackages().map(p => p.id === id ? { ...p, isActive } : p)); return { success: true }; },
  deletePackage: async (id: number) => { setPackages(getPackages().filter(p => p.id !== id)); return { success: true }; },

  // ── Maintenance ──
  getMaintenanceLogs: async () => getMaintenanceLogs().slice().reverse(),
  addMaintenanceLog: async (log: Omit<MaintenanceLog, 'id'>): Promise<MaintenanceLog> => {
    const entry: MaintenanceLog = { ...log, id: nextId('rq:maint_seq') };
    setMaintenanceLogs([...getMaintenanceLogs(), entry]); return entry;
  },
  deleteMaintenanceLog: async (id: number) => { setMaintenanceLogs(getMaintenanceLogs().filter(l => l.id !== id)); return { success: true }; },

  // ── Damage Reports ──
  getDamageReports: async () => getDamageReports().slice().reverse(),
  addDamageReport: async (report: Omit<DamageReport, 'id'>): Promise<DamageReport> => {
    const entry: DamageReport = { ...report, id: nextId('rq:damage_seq') };
    setDamageReports([...getDamageReports(), entry]); return entry;
  },
  resolveDamageReport: async (id: number) => { setDamageReports(getDamageReports().map(r => r.id === id ? { ...r, resolved: true } : r)); return { success: true }; },
  deleteDamageReport: async (id: number) => { setDamageReports(getDamageReports().filter(r => r.id !== id)); return { success: true }; },

  // ── Staff ──
  getStaff: async () => getStaff(),
  addStaff: async (s: Omit<Staff, 'id'>): Promise<Staff> => {
    const entry: Staff = { ...s, id: nextId('rq:staff_seq') };
    setStaff([...getStaff(), entry]); return entry;
  },
  updateStaff: async (id: number, data: Partial<Staff>) => { setStaff(getStaff().map(s => s.id === id ? { ...s, ...data } : s)); return { success: true }; },
  deleteStaff: async (id: number) => { setStaff(getStaff().filter(s => s.id !== id)); return { success: true }; },
  clockIn: async (staffId: number): Promise<Shift> => {
    const staff = getStaff().find(s => s.id === staffId);
    if (!staff) throw new Error('Staff not found');
    const shift: Shift = { id: nextId('rq:shift_seq'), staffId, staffName: staff.name, startTime: new Date().toISOString(), endTime: null, notes: '' };
    setShifts([...getShifts(), shift]); return shift;
  },
  clockOut: async (shiftId: number, notes = '') => {
    setShifts(getShifts().map(s => s.id === shiftId ? { ...s, endTime: new Date().toISOString(), notes } : s));
    return { success: true };
  },
  getShifts: async () => getShifts().slice().reverse(),
  getActiveShift: async (staffId: number) => getShifts().find(s => s.staffId === staffId && !s.endTime) || null,

  // ── Waitlist ──
  getWaitlist: async () => getWaitlist(),
  addToWaitlist: async (entry: Omit<WaitlistEntry, 'id' | 'addedAt' | 'notified'>): Promise<WaitlistEntry> => {
    const w: WaitlistEntry = { ...entry, id: nextId('rq:wait_seq'), addedAt: new Date().toISOString(), notified: false };
    setWaitlist([...getWaitlist(), w]); return w;
  },
  notifyWaitlist: async (id: number) => { setWaitlist(getWaitlist().map(w => w.id === id ? { ...w, notified: true } : w)); return { success: true }; },
  removeFromWaitlist: async (id: number) => { setWaitlist(getWaitlist().filter(w => w.id !== id)); return { success: true }; },

  // ── Prebookings ──
  getPrebookings: async () => getPrebookings().slice().reverse(),
  createPrebooking: async (body: Omit<Prebooking, 'id' | 'status' | 'createdAt'>): Promise<Prebooking> => {
    const pb: Prebooking = { ...body, id: nextId('rq:prebook_seq'), status: 'pending', createdAt: new Date().toISOString() };
    setPrebookings([...getPrebookings(), pb]); return pb;
  },
  confirmPrebooking: async (id: number) => { setPrebookings(getPrebookings().map(p => p.id === id ? { ...p, status: 'confirmed' } : p)); return { success: true }; },
  cancelPrebooking: async (id: number) => { setPrebookings(getPrebookings().map(p => p.id === id ? { ...p, status: 'cancelled' } : p)); return { success: true }; },
  convertPrebooking: async (id: number) => { setPrebookings(getPrebookings().map(p => p.id === id ? { ...p, status: 'converted' } : p)); return { success: true }; },

  // ── Admin PIN ──
  getAdminPin: () => { try { return localStorage.getItem('rq:admin_pin') || '1234'; } catch { return '1234'; } },
  setAdminPin: (pin: string) => { try { localStorage.setItem('rq:admin_pin', pin); } catch {} },
  verifyAdminPin: (pin: string) => { try { return pin === (localStorage.getItem('rq:admin_pin') || '1234'); } catch { return pin === '1234'; } },

  // ── Incidents ──
  getIncidents: async () => getIncidents().slice().reverse(),
  addIncident: async (body: { quadName: string; customerName: string; type: IncidentReport['type']; description: string; reportedBy: string; bookingId?: number | null }): Promise<IncidentReport> => {
    const entry: IncidentReport = { id: nextId('rq:incident_seq'), ...body, date: new Date().toISOString() };
    setIncidents([...getIncidents(), entry]); return entry;
  },
  deleteIncident: async (id: number) => { setIncidents(getIncidents().filter(i => i.id !== id)); return { success: true }; },

  // ── Loyalty ──
  getLoyaltyAccount: async (phone: string): Promise<LoyaltyAccount | null> => {
    const all = getLoyalty();
    const norm = normPhone(phone);
    return all[norm] ?? null;
  },
  addLoyaltyPoints: async (phone: string, pointsEarned: number) => {
    const all = getLoyalty();
    const norm = normPhone(phone);
    const existing = all[norm];
    if (existing) {
      all[norm] = { phone: norm, points: existing.points + pointsEarned, totalEarned: existing.totalEarned + pointsEarned, totalRides: existing.totalRides + 1 };
    } else {
      all[norm] = { phone: norm, points: pointsEarned, totalEarned: pointsEarned, totalRides: 1 };
    }
    setLoyalty(all);
  },
  redeemLoyaltyPoints: async (phone: string, points: number) => {
    const all = getLoyalty();
    const norm = normPhone(phone);
    if (!all[norm]) return;
    const existing = all[norm];
    all[norm] = { phone: norm, points: Math.max(0, existing.points - points), totalEarned: existing.totalEarned, totalRides: existing.totalRides };
    setLoyalty(all);
  },

  // ── Dynamic Pricing ──
  getDynamicPricing: async (): Promise<DynamicPricingRule[]> => {
    const stored = getDynamicPricing();
    if (stored.length === 0) {
      const defaults: DynamicPricingRule[] = [
        { id: 1, label: 'Early Bird',   startHour: 6,  endHour: 9,  multiplier: 0.9, active: false },
        { id: 2, label: 'Morning',      startHour: 9,  endHour: 12, multiplier: 1.0, active: true  },
        { id: 3, label: 'Afternoon',   startHour: 12, endHour: 16, multiplier: 1.0, active: true  },
        { id: 4, label: 'Peak (4-6pm)',startHour: 16, endHour: 18, multiplier: 1.25, active: false },
        { id: 5, label: 'Sunset',      startHour: 18, endHour: 20, multiplier: 1.5, active: false },
        { id: 6, label: 'Off-peak',    startHour: 20, endHour: 6,  multiplier: 0.8, active: false },
      ];
      setDynamicPricing(defaults); return defaults;
    }
    return stored;
  },
  saveDynamicPricing: async (rules: DynamicPricingRule[]) => { setDynamicPricing(rules); return { success: true }; },
  getCurrentPriceMultiplier: (): number => {
    const hour = new Date().getHours();
    const rules = getDynamicPricing();
    for (const r of rules) {
      if (!r.active) continue;
      if (r.startHour <= r.endHour) {
        if (hour >= r.startHour && hour < r.endHour) return r.multiplier;
      } else {
        if (hour >= r.startHour || hour < r.endHour) return r.multiplier;
      }
    }
    return 1.0;
  },

  // ── Waiver Expiry (30-day) ──
  hasValidWaiver: (phone: string): boolean => {
    try {
      const raw = localStorage.getItem(`rq:waiver:${normPhone(phone)}`);
      if (!raw) return false;
      const signed = new Date(raw);
      if (isNaN(signed.getTime())) return false;
      return (Date.now() - signed.getTime()) < 30 * 86400_000;
    } catch { return false; }
  },
  recordWaiverSigned: (phone: string) => {
    try { localStorage.setItem(`rq:waiver:${normPhone(phone)}`, new Date().toISOString()); } catch {}
  },

  // ── Emergency Contacts ──
  getEmergencyContact: (phone: string): string | null => {
    try { return localStorage.getItem(`rq:emergency:${normPhone(phone)}`); } catch { return null; }
  },
  setEmergencyContact: (phone: string, contact: string) => {
    try { localStorage.setItem(`rq:emergency:${normPhone(phone)}`, contact); } catch {}
  },

  // ── Guide ──
  toggleGuidePaid: async (id: number) => {
    setBookings(getBookings().map(b => b.id === id ? { ...b, guidePaid: !b.guidePaid } : b));
    return { success: true };
  },

  // ── Extend booking ──
  extendBooking: async (id: number, addedMins: number, addedPrice: number) => {
    setBookings(getBookings().map(b => {
      if (b.id !== id) return b;
      return { ...b, duration: (b.duration || 0) + addedMins, price: (b.price || 0) + addedPrice };
    }));
    return { success: true };
  },

  // ── Update M-Pesa ref ──
  updateBookingMpesa: async (id: number, mpesaRef: string) => {
    setBookings(getBookings().map(b => b.id === id ? { ...b, mpesaRef: mpesaRef.trim().toUpperCase() } : b));
    return { success: true };
  },

  // ── Get booking by ID ──
  getBookingById: async (id: number): Promise<Booking | null> => {
    try { return getBookings().find(b => b.id === id) ?? null; } catch { return null; }
  },

  // ── Backup & Restore ──
  exportBackup: (): void => {
    const data: Record<string, unknown> = { _version: 1, _exported: new Date().toISOString() };
    for (const key of BACKUP_KEYS) {
      try { const val = localStorage.getItem(key); if (val !== null) data[key] = JSON.parse(val); } catch {}
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `royal-quads-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  },
  importBackup: async (jsonStr: string): Promise<{ restored: string[] }> => {
    const data = JSON.parse(jsonStr) as Record<string, unknown>;
    const restored: string[] = [];
    const intKeys = new Set(['rq:quad_seq','rq:booking_seq','rq:incident_seq','rq:user_seq']);
    const boolKeys = new Set(['rq:onboarded']);
    for (const key of BACKUP_KEYS) {
      if (data[key] === undefined) continue;
      try {
        if (boolKeys.has(key)) { localStorage.setItem(key, String(data[key] === true)); }
        else if (intKeys.has(key)) { localStorage.setItem(key, String(Number(data[key]))); }
        else { localStorage.setItem(key, JSON.stringify(data[key])); }
        restored.push(key);
      } catch (e) { console.warn(`[api] importBackup skip ${key}:`, e); }
    }
    return { restored };
  },
};
