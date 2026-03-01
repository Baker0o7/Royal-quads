import type {
  Quad, Booking, User, Promotion, Package, SalesData,
  MaintenanceLog, DamageReport, Staff, Shift, WaitlistEntry, Prebooking
} from '../types';
import { OVERTIME_RATE } from '../types';

// ─── Storage helpers ──────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fallback; }
  catch { return fallback; }
}
function save(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }
function nextId(key: string): number { const id = load<number>(key, 0) + 1; save(key, id); return id; }

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

  // ── Bookings ──
  createBooking: async (body: {
    quadId: number; userId?: number | null; customerName: string; customerPhone: string;
    duration: number; price: number; originalPrice: number; promoCode?: string | null;
    isPrebooked?: boolean; prebookTime?: string; groupSize?: number;
    idPhotoUrl?: string | null; waiverSigned?: boolean; depositAmount?: number;
    operatorId?: number | null;
  }): Promise<{ id: number; receiptId: string; startTime: string }> => {
    const quads = getQuads();
    const quad = quads.find(q => q.id === body.quadId);
    if (!quad) throw new Error('Quad not found');
    if (quad.status !== 'available') throw new Error('Quad is not available');
    const id = nextId('rq:booking_seq');
    const receiptId = 'RQ-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const startTime = new Date().toISOString();
    const booking: Booking = {
      id, quadId: body.quadId, userId: body.userId ?? null,
      customerName: body.customerName.trim(), customerPhone: body.customerPhone,
      duration: body.duration, price: body.price, originalPrice: body.originalPrice,
      promoCode: body.promoCode ?? null, startTime, endTime: null, status: 'active',
      receiptId, rating: null, feedback: null,
      quadName: quad.name, quadImageUrl: quad.imageUrl, quadImei: quad.imei,
      isPrebooked: body.isPrebooked ?? false, prebookTime: body.prebookTime ?? null,
      groupSize: body.groupSize ?? 1, idPhotoUrl: body.idPhotoUrl ?? null,
      waiverSigned: body.waiverSigned ?? false,
      waiverSignedAt: body.waiverSigned ? new Date().toISOString() : null,
      depositAmount: body.depositAmount ?? 0, depositReturned: false,
      operatorId: body.operatorId ?? null,
      overtimeMinutes: 0, overtimeCharge: 0,
    };
    setBookings([...getBookings(), booking]);
    setQuads(quads.map(q => q.id === body.quadId ? { ...q, status: 'rented' } : q));
    return { id, receiptId, startTime };
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

  returnDeposit: async (id: number) => {
    setBookings(getBookings().map(b => b.id === id ? { ...b, depositReturned: true } : b));
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
    const user = getUsers().find(u => u.phone === phone && u.password === password);
    if (!user) throw new Error('Invalid phone number or password');
    const { password: _, ...safe } = user; void _; return safe;
  },
  register: async (name: string, phone: string, password: string): Promise<User> => {
    if (!name?.trim()) throw new Error('Name is required');
    if (!phone?.trim()) throw new Error('Phone is required');
    if (!password || password.length < 4) throw new Error('Password must be at least 4 characters');
    if (getUsers().find(u => u.phone === phone)) throw new Error('Phone number already registered');
    const user: StoredUser = { id: nextId('rq:user_seq'), name: name.trim(), phone, role: 'user', password };
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
  validatePromotion: async (code: string): Promise<Promotion> => {
    const promo = getPromotions().find(p => p.code === code.toUpperCase().trim() && p.isActive === 1);
    if (!promo) throw new Error('Invalid or inactive promo code'); return promo;
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
  getAdminPin: () => localStorage.getItem('rq:admin_pin') || '1234',
  setAdminPin: (pin: string) => { localStorage.setItem('rq:admin_pin', pin); },
  verifyAdminPin: (pin: string) => pin === (localStorage.getItem('rq:admin_pin') || '1234'),
};
