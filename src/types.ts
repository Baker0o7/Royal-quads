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
  // new fields
  isPrebooked?: boolean;
  prebookTime?: string | null;
  groupSize?: number;
  idPhotoUrl?: string | null;
  waiverSigned?: boolean;
  waiverSignedAt?: string | null;
  overtimeMinutes?: number;
  overtimeCharge?: number;
  depositAmount?: number;
  depositReturned?: boolean;
  operatorId?: number | null;
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
  isActive: number;
}

export interface Package {
  id: number;
  name: string;
  description: string;
  rides: number;
  price: number;
  isActive: number;
}

export interface MaintenanceLog {
  id: number;
  quadId: number;
  quadName: string;
  type: 'service' | 'fuel' | 'repair' | 'inspection';
  description: string;
  cost: number;
  date: string;
  operatorId: number | null;
  operatorName: string | null;
}

export interface DamageReport {
  id: number;
  quadId: number;
  quadName: string;
  bookingId: number | null;
  customerName: string | null;
  description: string;
  photoUrl: string | null;
  severity: 'minor' | 'moderate' | 'severe';
  repairCost: number;
  resolved: boolean;
  date: string;
}

export interface Staff {
  id: number;
  name: string;
  phone: string;
  pin: string;
  role: 'operator' | 'manager';
  isActive: boolean;
}

export interface Shift {
  id: number;
  staffId: number;
  staffName: string;
  startTime: string;
  endTime: string | null;
  notes: string;
}

export interface WaitlistEntry {
  id: number;
  customerName: string;
  customerPhone: string;
  duration: number;
  addedAt: string;
  notified: boolean;
}

export interface Prebooking {
  id: number;
  quadId: number | null;
  quadName: string | null;
  customerName: string;
  customerPhone: string;
  duration: number;
  price: number;
  scheduledFor: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'converted';
  createdAt: string;
}

export interface SalesData {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  overtimeRevenue: number;
}

export const OVERTIME_RATE = 100; // KES per minute

export const PRICING = [
  { duration: 5,  price: 1000, label: '5 min'  },
  { duration: 10, price: 1800, label: '10 min' },
  { duration: 15, price: 2200, label: '15 min' },
  { duration: 20, price: 2500, label: '20 min' },
  { duration: 30, price: 3500, label: '30 min' },
  { duration: 60, price: 6000, label: '1 hour' },
] as const;

export const ADMIN_PIN_KEY = 'rq:admin_pin';
export const DEFAULT_ADMIN_PIN = '1234';
