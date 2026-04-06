import { describe, it, expect } from 'vitest';
import { validateQuad, validateBooking, validatePromotion } from '../lib/validation';

describe('Validation Schemas', () => {
  describe('QuadSchema', () => {
    it('should validate a valid quad', () => {
      const validQuad = {
        id: 1,
        name: 'Quad 1',
        status: 'available',
        imageUrl: null,
        imei: null,
      };
      expect(validateQuad(validQuad).success).toBe(true);
    });

    it('should reject a quad with empty name', () => {
      const invalidQuad = {
        id: 1,
        name: '',
        status: 'available',
        imageUrl: null,
        imei: null,
      };
      const result = validateQuad(invalidQuad);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalidStatus = {
        id: 1,
        name: 'Quad 1',
        status: 'invalid',
        imageUrl: null,
        imei: null,
      };
      const result = validateQuad(invalidStatus);
      expect(result.success).toBe(false);
    });
  });

  describe('BookingSchema', () => {
    it('should validate a valid booking', () => {
      const validBooking = {
        id: 1,
        quadId: 1,
        userId: null,
        customerName: 'John Doe',
        customerPhone: '254712345678',
        duration: 15,
        price: 500,
        originalPrice: 500,
        promoCode: null,
        startTime: '2026-04-06T10:00:00Z',
        endTime: null,
        status: 'active' as const,
        receiptId: 'RQ-ABC123',
        rating: null,
        feedback: null,
        quadName: 'Quad 1',
      };
      expect(validateBooking(validBooking).success).toBe(true);
    });
  });

  describe('PromotionSchema', () => {
    it('should validate a valid promo', () => {
      const validPromo = {
        id: 1,
        code: 'SUMMER20',
        discountPercentage: 20,
        isActive: 1,
      };
      expect(validatePromotion(validPromo).success).toBe(true);
    });

    it('should reject promo with discount > 100', () => {
      const invalidPromo = {
        id: 1,
        code: 'BIG',
        discountPercentage: 150,
        isActive: 1,
      };
      const result = validatePromotion(invalidPromo);
      expect(result.success).toBe(false);
    });
  });
});
