export type QuadStatus = 'available' | 'rented' | 'maintenance';

export interface Quad {
  id: number;
  name: string;
  status: QuadStatus;
  imageUrl: string | null;
  imei: string | null;
}

export interface Booking {
  id: number;
  quadId: number;
  userId: number | null;
  customerName: string;
  customerPhone: string;
  duration: number;
  price: number;
  originalPrice: number;
  promoCode: string | null;
  startTime: string;
  endTime: string | null;
  status: 'active' | 'completed';
  receiptId: string;
  rating: number | null;
  feedback: string | null;
  quadName: string;
  quadImageUrl?: string | null;
  quadImei?: string | null;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  role: 'user' | 'admin';
}

export interface Promotion {
  id: number;
  code: string;
  discountPercentage: number;
  isActive: number; // SQLite boolean: 0 or 1
}

export interface SalesData {
  total: number;
  today: number;
}

export const PRICING = [
  { duration: 5,  price: 1000, label: '5 min'  },
  { duration: 10, price: 1800, label: '10 min' },
  { duration: 15, price: 2200, label: '15 min' },
  { duration: 20, price: 2500, label: '20 min' },
  { duration: 30, price: 3500, label: '30 min' },
  { duration: 60, price: 6000, label: '1 hour' },
] as const;
