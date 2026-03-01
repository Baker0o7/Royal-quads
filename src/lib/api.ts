import type { Booking, Quad, User, Promotion, SalesData } from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  // Quads
  getQuads: () => request<Quad[]>('/api/quads'),
  createQuad: (body: { name: string; imageUrl?: string; imei?: string }) =>
    request<Quad>('/api/quads', { method: 'POST', body: JSON.stringify(body) }),
  updateQuad: (id: number, body: { name: string; status: string; imageUrl?: string; imei?: string }) =>
    request<{ success: boolean }>(`/api/quads/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateQuadStatus: (id: number, status: string) =>
    request<{ success: boolean }>(`/api/quads/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Bookings
  createBooking: (body: {
    quadId: number; userId?: number | null; customerName: string;
    customerPhone: string; duration: number; price: number;
    originalPrice: number; promoCode?: string | null;
  }) => request<{ id: number; receiptId: string; startTime: string }>('/api/bookings', { method: 'POST', body: JSON.stringify(body) }),
  getActiveBookings: () => request<Booking[]>('/api/bookings/active'),
  getBookingHistory: () => request<Booking[]>('/api/bookings/history'),
  completeBooking: (id: number) =>
    request<{ success: boolean; endTime: string }>(`/api/bookings/${id}/complete`, { method: 'POST' }),
  submitFeedback: (id: number, rating: number, feedback: string) =>
    request<{ success: boolean }>(`/api/bookings/${id}/feedback`, {
      method: 'POST', body: JSON.stringify({ rating, feedback }),
    }),

  // Sales
  getSales: () => request<SalesData>('/api/sales'),

  // Auth
  login: (phone: string, password: string) =>
    request<User>('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  register: (name: string, phone: string, password: string) =>
    request<User>('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, phone, password }) }),
  getUserHistory: (userId: number) => request<Booking[]>(`/api/users/${userId}/history`),

  // Promotions
  getPromotions: () => request<Promotion[]>('/api/promotions'),
  createPromotion: (code: string, discountPercentage: number) =>
    request<Promotion>('/api/promotions', { method: 'POST', body: JSON.stringify({ code, discountPercentage }) }),
  togglePromotion: (id: number, isActive: boolean) =>
    request<{ success: boolean }>(`/api/promotions/${id}/toggle`, { method: 'POST', body: JSON.stringify({ isActive }) }),
  deletePromotion: (id: number) =>
    request<{ success: boolean }>(`/api/promotions/${id}`, { method: 'DELETE' }),
  validatePromotion: (code: string) => request<Promotion>(`/api/promotions/validate/${code}`),
};
