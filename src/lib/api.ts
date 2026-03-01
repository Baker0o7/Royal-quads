/**
 * Local storage API — works fully offline on Android (no Express server needed).
 * All data persists in localStorage under namespaced keys.
 */

import type { Quad, Booking, User, Promotion, SalesData } from '../types';

// ─── Storage helpers ──────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function nextId(key: string): number {
  const id = load<number>(key, 0) + 1;
  save(key, id);
  return id;
}

// ─── Data accessors ───────────────────────────────────────────────────────────
function getQuads(): Quad[] {
  const stored = load<Quad[] | null>('rq:quads', null);

  // First launch — seed 5 default quads
  if (!stored || stored.length === 0) {
    const seed: Quad[] = [1, 2, 3, 4, 5].map(i => ({
      id: i, name: `Quad ${i}`, status: 'available' as const, imageUrl: null, imei: null,
    }));
    save('rq:quads', seed);
    save('rq:quad_seq', 5);
    return seed;
  }

  // Heal: reset any 'rented' quad that has no active booking (e.g. app was closed mid-ride)
  const activeQuadIds = new Set(
    load<Booking[]>('rq:bookings', [])
      .filter(b => b.status === 'active')
      .map(b => b.quadId)
  );
  const healed = stored.map(q =>
    q.status === 'rented' && !activeQuadIds.has(q.id) ? { ...q, status: 'available' as const } : q
  );
  if (healed.some((q, i) => q.status !== stored[i].status)) save('rq:quads', healed);
  return healed;
}
function setQuads(q: Quad[]) { save('rq:quads', q); }

type StoredUser = User & { password: string };
function getUsers(): StoredUser[] { return load<StoredUser[]>('rq:users', []); }
function setUsers(u: StoredUser[]) { save('rq:users', u); }

function getBookings(): Booking[] { return load<Booking[]>('rq:bookings', []); }
function setBookings(b: Booking[]) { save('rq:bookings', b); }

function getPromotions(): Promotion[] { return load<Promotion[]>('rq:promotions', []); }
function setPromotions(p: Promotion[]) { save('rq:promotions', p); }

// ─── Public API ───────────────────────────────────────────────────────────────
export const api = {

  // ── Quads ──
  getQuads: async (): Promise<Quad[]> => getQuads(),

  createQuad: async (body: { name: string; imageUrl?: string; imei?: string }): Promise<Quad> => {
    if (!body.name?.trim()) throw new Error('Name is required');
    const quad: Quad = {
      id: nextId('rq:quad_seq'),
      name: body.name.trim(),
      status: 'available',
      imageUrl: body.imageUrl || null,
      imei: body.imei || null,
    };
    setQuads([...getQuads(), quad]);
    return quad;
  },

  updateQuad: async (id: number, body: { name: string; status: string; imageUrl?: string; imei?: string }) => {
    setQuads(getQuads().map(q => q.id === id
      ? { ...q, name: body.name.trim(), status: body.status as Quad['status'], imageUrl: body.imageUrl || null, imei: body.imei || null }
      : q));
    return { success: true };
  },

  updateQuadStatus: async (id: number, status: string) => {
    setQuads(getQuads().map(q => q.id === id ? { ...q, status: status as Quad['status'] } : q));
    return { success: true };
  },

  // ── Bookings ──
  createBooking: async (body: {
    quadId: number; userId?: number | null; customerName: string;
    customerPhone: string; duration: number; price: number;
    originalPrice: number; promoCode?: string | null;
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
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone,
      duration: body.duration, price: body.price,
      originalPrice: body.originalPrice,
      promoCode: body.promoCode ?? null,
      startTime, endTime: null, status: 'active',
      receiptId, rating: null, feedback: null,
      quadName: quad.name, quadImageUrl: quad.imageUrl, quadImei: quad.imei,
    };

    setBookings([...getBookings(), booking]);
    setQuads(quads.map(q => q.id === body.quadId ? { ...q, status: 'rented' } : q));
    return { id, receiptId, startTime };
  },

  getActiveBookings: async (): Promise<Booking[]> =>
    getBookings().filter(b => b.status === 'active'),

  getBookingHistory: async (): Promise<Booking[]> =>
    getBookings()
      .filter(b => b.status === 'completed')
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime()),

  completeBooking: async (id: number) => {
    const endTime = new Date().toISOString();
    let quadId = 0;
    setBookings(getBookings().map(b => {
      if (b.id === id) { quadId = b.quadId; return { ...b, status: 'completed' as const, endTime }; }
      return b;
    }));
    if (quadId) setQuads(getQuads().map(q => q.id === quadId ? { ...q, status: 'available' } : q));
    return { success: true, endTime };
  },

  submitFeedback: async (id: number, rating: number, feedback: string) => {
    setBookings(getBookings().map(b => b.id === id ? { ...b, rating, feedback } : b));
    return { success: true };
  },

  // ── Sales ──
  getSales: async (): Promise<SalesData> => {
    const completed = getBookings().filter(b => b.status === 'completed');
    const today = new Date().toDateString();
    return {
      total: completed.reduce((s, b) => s + b.price, 0),
      today: completed
        .filter(b => b.endTime && new Date(b.endTime).toDateString() === today)
        .reduce((s, b) => s + b.price, 0),
    };
  },

  // ── Auth ──
  login: async (phone: string, password: string): Promise<User> => {
    const user = getUsers().find(u => u.phone === phone && u.password === password);
    if (!user) throw new Error('Invalid phone number or password');
    const { password: _, ...safe } = user; void _;
    return safe;
  },

  register: async (name: string, phone: string, password: string): Promise<User> => {
    if (!name?.trim()) throw new Error('Name is required');
    if (!phone?.trim()) throw new Error('Phone is required');
    if (!password || password.length < 4) throw new Error('Password must be at least 4 characters');
    if (getUsers().find(u => u.phone === phone)) throw new Error('Phone number already registered');

    const user: StoredUser = {
      id: nextId('rq:user_seq'),
      name: name.trim(), phone,
      role: 'user', password,
    };
    setUsers([...getUsers(), user]);
    const { password: _, ...safe } = user; void _;
    return safe;
  },

  getUserHistory: async (userId: number): Promise<Booking[]> =>
    getBookings().filter(b => b.userId === userId).sort((a, b) => b.id - a.id),

  // ── Promotions ──
  getPromotions: async (): Promise<Promotion[]> =>
    getPromotions().slice().reverse(),

  createPromotion: async (code: string, discountPercentage: number): Promise<Promotion> => {
    if (!code?.trim()) throw new Error('Code is required');
    if (discountPercentage < 1 || discountPercentage > 100) throw new Error('Discount must be 1–100%');
    const upper = code.toUpperCase().trim();
    if (getPromotions().find(p => p.code === upper)) throw new Error('Promo code already exists');
    const promo: Promotion = { id: nextId('rq:promo_seq'), code: upper, discountPercentage, isActive: 1 };
    setPromotions([...getPromotions(), promo]);
    return promo;
  },

  togglePromotion: async (id: number, isActive: boolean) => {
    setPromotions(getPromotions().map(p => p.id === id ? { ...p, isActive: isActive ? 1 : 0 } : p));
    return { success: true };
  },

  deletePromotion: async (id: number) => {
    setPromotions(getPromotions().filter(p => p.id !== id));
    return { success: true };
  },

  validatePromotion: async (code: string): Promise<Promotion> => {
    const promo = getPromotions().find(p => p.code === code.toUpperCase().trim() && p.isActive === 1);
    if (!promo) throw new Error('Invalid or inactive promo code');
    return promo;
  },
};
