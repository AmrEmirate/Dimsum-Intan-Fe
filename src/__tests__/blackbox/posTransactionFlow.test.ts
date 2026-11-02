import { describe, it, expect } from 'vitest';
import { MenuItem, PaymentMethod, OrderType } from '../../types';

describe('Black Box Testing: POS Transaction Flow & Checkout Contract', () => {
  interface CartItem extends MenuItem {
    quantity: number;
    notes?: string;
  }

  interface CheckoutOrderPayload {
    outletId: string;
    orderType: OrderType;
    tableNumber?: string;
    customerName: string;
    items: {
      menuId: string;
      name: string;
      price: number;
      costPrice: number;
      quantity: number;
      notes?: string;
    }[];
    subtotal: number;
    discount: number;
    total: number;
    hppTotal: number;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    changeAmount?: number;
  }

  const buildCheckoutPayload = (params: {
    outletId: string;
    orderType: OrderType;
    tableNumber?: string;
    customerName?: string;
    cart: CartItem[];
    discount?: number;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
  }): CheckoutOrderPayload => {
    if (!params.cart || params.cart.length === 0) {
      throw new Error('Keranjang pesanan tidak boleh kosong!');
    }

    const subtotal = params.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = params.discount || 0;
    const finalTotal = Math.max(0, subtotal - discount);
    const hppTotal = params.cart.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);

    const isCash = params.paymentMethod === 'CASH';
    const cash = isCash ? (params.cashReceived || finalTotal) : finalTotal;
    const change = isCash ? Math.max(0, cash - finalTotal) : 0;

    return {
      outletId: params.outletId,
      orderType: params.orderType,
      tableNumber: params.tableNumber,
      customerName: params.customerName || (params.orderType === 'dine-in' ? 'Pelanggan Dine In' : 'Pelanggan Takeaway'),
      items: params.cart.map((it) => ({
        menuId: it.id,
        name: it.name,
        price: it.price,
        costPrice: it.costPrice,
        quantity: it.quantity,
        notes: it.notes,
      })),
      subtotal,
      discount,
      total: finalTotal,
      hppTotal,
      paymentMethod: params.paymentMethod,
      cashReceived: cash,
      changeAmount: change,
    };
  };

  const sampleCart: CartItem[] = [
    {
      id: 'm1',
      code: 'DIM-001',
      name: 'Dimsum Mentai',
      category: 'mentai',
      price: 25000,
      costPrice: 12000,
      stock: 50,
      description: '',
      image: '',
      isAvailable: true,
      quantity: 2,
    },
    {
      id: 'm2',
      code: 'MIN-001',
      name: 'Es Jeruk Segar',
      category: 'minuman',
      price: 8000,
      costPrice: 2500,
      stock: 100,
      description: '',
      image: '',
      isAvailable: true,
      quantity: 1,
    },
  ];

  describe('Black Box: Payload Generation & Validation', () => {
    it('should throw error when checkout is attempted with empty cart', () => {
      expect(() => {
        buildCheckoutPayload({
          outletId: 'out-01',
          orderType: 'takeaway',
          cart: [],
          paymentMethod: 'CASH',
        });
      }).toThrow('Keranjang pesanan tidak boleh kosong!');
    });

    it('should generate valid payload for CASH Dine-in order with change calculation', () => {
      const payload = buildCheckoutPayload({
        outletId: 'out-01',
        orderType: 'dine-in',
        tableNumber: '12',
        customerName: 'Keluarga Budi',
        cart: sampleCart,
        discount: 5000,
        paymentMethod: 'CASH',
        cashReceived: 60000,
      });

      // subtotal: 25.000*2 + 8.000 = 58.000
      expect(payload.subtotal).toBe(58000);
      expect(payload.discount).toBe(5000);
      expect(payload.total).toBe(53000);
      expect(payload.cashReceived).toBe(60000);
      expect(payload.changeAmount).toBe(7000);
      expect(payload.items.length).toBe(2);
      expect(payload.tableNumber).toBe('12');
    });

    it('should generate valid payload for QRIS Takeaway order with zero change', () => {
      const payload = buildCheckoutPayload({
        outletId: 'out-01',
        orderType: 'takeaway',
        cart: sampleCart,
        paymentMethod: 'DUITKU_QRIS',
      });

      expect(payload.paymentMethod).toBe('DUITKU_QRIS');
      expect(payload.total).toBe(58000);
      expect(payload.cashReceived).toBe(58000);
      expect(payload.changeAmount).toBe(0);
      expect(payload.tableNumber).toBeUndefined();
    });
  });
});

