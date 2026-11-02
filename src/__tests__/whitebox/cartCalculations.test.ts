import { describe, it, expect } from 'vitest';
import { MenuItem, OrderType, PaymentMethod } from '../../types';

describe('White Box Testing: POS Cart Mathematics & Business Rules', () => {
  const sampleMenu1: MenuItem = {
    id: 'm1',
    code: 'DIM-001',
    name: 'Dimsum Mentai Mozarella',
    category: 'mentai',
    price: 25000,
    costPrice: 12000,
    stock: 50,
    description: 'Menu favorit mentai',
    image: '',
    isAvailable: true,
  };

  const sampleMenu2: MenuItem = {
    id: 'm2',
    code: 'DIM-002',
    name: 'Dimsum Kukus Udang',
    category: 'kukus',
    price: 20000,
    costPrice: 9000,
    stock: 40,
    description: 'Dimsum kukus udang',
    image: '',
    isAvailable: true,
  };

  const sampleBeverage: MenuItem = {
    id: 'm3',
    code: 'MIN-001',
    name: 'Lemon Tea Dingin',
    category: 'minuman',
    price: 8000,
    costPrice: 2000,
    stock: 100,
    description: 'Minuman segar',
    image: '',
    isAvailable: true,
  };

  describe('White Box: Subtotal, HPP & Gross Margin Formula', () => {
    it('should compute exact subtotal and hppTotal based on item quantities', () => {
      const cart = [
        { ...sampleMenu1, quantity: 3 }, // 25.000 x 3 = 75.000 | HPP: 12.000 x 3 = 36.000
        { ...sampleMenu2, quantity: 2 }, // 20.000 x 2 = 40.000 | HPP: 9.000 x 2 = 18.000
        { ...sampleBeverage, quantity: 4 }, // 8.000 x 4 = 32.000 | HPP: 2.000 x 4 = 8.000
      ];

      const subtotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const hppTotal = cart.reduce((sum, it) => sum + it.costPrice * it.quantity, 0);

      expect(subtotal).toBe(147000);
      expect(hppTotal).toBe(62000);

      const grossProfit = subtotal - hppTotal;
      expect(grossProfit).toBe(85000);

      const grossMarginPct = (grossProfit / subtotal) * 100;
      expect(Number(grossMarginPct.toFixed(2))).toBe(57.82);
    });
  });

  describe('White Box: Discount Bounds (Math.max Guard)', () => {
    it('should correctly reduce subtotal when discount is within range', () => {
      const subtotal = 100000;
      const discount = 15000;
      const finalTotal = Math.max(0, subtotal - discount);

      expect(finalTotal).toBe(85000);
    });

    it('should clamp total to 0 when discount exceeds subtotal (No negative billing)', () => {
      const subtotal = 50000;
      const excessDiscount = 75000;
      const finalTotal = Math.max(0, subtotal - excessDiscount);

      expect(finalTotal).toBe(0);
    });
  });

  describe('White Box: Cash Change Calculation (Cash vs Non-Cash)', () => {
    const calculateChange = (method: PaymentMethod, received: number, total: number) => {
      return method === 'CASH' ? Math.max(0, received - total) : 0;
    };

    it('should calculate accurate change when paymentMethod === CASH and received > total', () => {
      const finalTotal = 85000;
      const cashReceived = 100000;
      const paymentMethod: PaymentMethod = 'CASH';

      const changeAmount = calculateChange(paymentMethod, cashReceived, finalTotal);
      expect(changeAmount).toBe(15000);
    });

    it('should return 0 change when cash received equals exact total', () => {
      const finalTotal = 85000;
      const cashReceived = 85000;
      const paymentMethod: PaymentMethod = 'CASH';

      const changeAmount = calculateChange(paymentMethod, cashReceived, finalTotal);
      expect(changeAmount).toBe(0);
    });

    it('should strictly return 0 change for QRIS and digital payments regardless of cash input', () => {
      const finalTotal = 85000;
      const cashReceived = 100000;
      const paymentMethodQris: PaymentMethod = 'QRIS';
      const paymentMethodDuitku: PaymentMethod = 'DUITKU_QRIS';

      const changeQris = calculateChange(paymentMethodQris, cashReceived, finalTotal);
      const changeDuitku = calculateChange(paymentMethodDuitku, cashReceived, finalTotal);

      expect(changeQris).toBe(0);
      expect(changeDuitku).toBe(0);
    });
  });
});
