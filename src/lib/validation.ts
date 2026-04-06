import { z } from 'zod';

export const QuadSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
  status: z.enum(['available', 'rented', 'maintenance']),
  imageUrl: z.string().url().nullable(),
  imei: z.string().nullable(),
});

export const BookingSchema = z.object({
  id: z.number(),
  quadId: z.number(),
  userId: z.number().nullable(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  duration: z.number().positive(),
  price: z.number().min(0),
  originalPrice: z.number().min(0),
  promoCode: z.string().nullable(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().nullable(),
  status: z.enum(['active', 'completed']),
  receiptId: z.string(),
  rating: z.number().min(1).max(5).nullable(),
  feedback: z.string().nullable(),
  quadName: z.string(),
  quadImageUrl: z.string().url().nullable().optional(),
  quadImei: z.string().nullable().optional(),
  isPrebooked: z.boolean().optional(),
  prebookTime: z.string().datetime().nullable().optional(),
  groupSize: z.number().int().positive().optional(),
  idPhotoUrl: z.string().url().nullable().optional(),
  waiverSigned: z.boolean().optional(),
  waiverSignedAt: z.string().datetime().nullable().optional(),
  overtimeMinutes: z.number().int().min(0).optional(),
  overtimeCharge: z.number().min(0).optional(),
  depositAmount: z.number().min(0).optional(),
  mpesaRef: z.string().nullable().optional(),
  depositReturned: z.boolean().optional(),
  operatorId: z.number().nullable().optional(),
  guideName: z.string().nullable().optional(),
  guidePaid: z.boolean().optional(),
});

export const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  role: z.enum(['user', 'admin']),
});

export const PromotionSchema = z.object({
  id: z.number(),
  code: z.string().min(1, 'Promo code is required'),
  discountPercentage: z.number().min(0).max(100),
  isActive: z.number().int().min(0).max(1),
});

export const PackageSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Package name is required'),
  description: z.string(),
  rides: z.number().int().positive(),
  price: z.number().min(0),
  isActive: z.number().int().min(0).max(1),
});

export const MaintenanceLogSchema = z.object({
  id: z.number(),
  quadId: z.number(),
  quadName: z.string(),
  type: z.enum(['service', 'fuel', 'repair', 'inspection']),
  description: z.string(),
  cost: z.number().min(0),
  date: z.string().datetime(),
  operatorId: z.number().nullable(),
  operatorName: z.string().nullable(),
});

export const DamageReportSchema = z.object({
  id: z.number(),
  quadId: z.number(),
  quadName: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  photoUrl: z.string().url().nullable(),
  reportedAt: z.string().datetime(),
  resolved: z.boolean(),
  resolvedAt: z.string().datetime().nullable(),
});

export const StaffSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Staff name is required'),
  phone: z.string().min(1, 'Phone is required'),
  pin: z.string().min(4, 'PIN must be at least 4 digits'),
  role: z.enum(['operator', 'manager']),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export const PrebookingSchema = z.object({
  id: z.number(),
  quadId: z.number(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  scheduledTime: z.string().datetime(),
  duration: z.number().positive(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export function validateQuad(data: unknown) {
  return QuadSchema.safeParse(data);
}

export function validateBooking(data: unknown) {
  return BookingSchema.safeParse(data);
}

export function validateUser(data: unknown) {
  return UserSchema.safeParse(data);
}

export function validatePromotion(data: unknown) {
  return PromotionSchema.safeParse(data);
}

export function validatePackage(data: unknown) {
  return PackageSchema.safeParse(data);
}
