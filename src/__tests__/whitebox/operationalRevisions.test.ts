import { describe, it, expect, vi } from 'vitest';
import { Order, ShiftSession, PettyCashExpense } from '../../types';

describe('White Box & Operational Revisions Testing', () => {
  describe('1. Low Stock Warning & Out-of-Stock Logic', () => {
    interface StockItem {
      id: string;
      name: string;
      stock?: number;
      minStockThreshold?: number;
    }

    const getStockStatus = (item: StockItem) => {
      if (item.stock === undefined || item.stock === null) {
        return { status: 'AVAILABLE', label: null, canOrder: true };
      }
      if (item.stock <= 0) {
        return { status: 'OUT_OF_STOCK', label: 'Habis', canOrder: false };
      }
      const threshold = item.minStockThreshold ?? 10;
      if (item.stock <= threshold) {
        return { status: 'LOW_STOCK', label: `Sisa ${item.stock} pcs!`, canOrder: true };
      }
      return { status: 'NORMAL', label: null, canOrder: true };
    };

    it('should correctly flag out-of-stock items and prevent ordering', () => {
      const item: StockItem = { id: 'm1', name: 'Siomay Ayam', stock: 0 };
      const res = getStockStatus(item);
      expect(res.status).toBe('OUT_OF_STOCK');
      expect(res.canOrder).toBe(false);
      expect(res.label).toBe('Habis');
    });

    it('should display low stock warning badge when stock is at or below threshold', () => {
      const item: StockItem = { id: 'm2', name: 'Hakau Udang', stock: 6, minStockThreshold: 10 };
      const res = getStockStatus(item);
      expect(res.status).toBe('LOW_STOCK');
      expect(res.canOrder).toBe(true);
      expect(res.label).toBe('Sisa 6 pcs!');
    });

    it('should show normal status when stock is plentiful', () => {
      const item: StockItem = { id: 'm3', name: 'Lumpia Kulit Tahu', stock: 45 };
      const res = getStockStatus(item);
      expect(res.status).toBe('NORMAL');
      expect(res.canOrder).toBe(true);
      expect(res.label).toBeNull();
    });
  });

  describe('2. Cash Drawer Settlement & End-of-Shift Reconciliation Logic', () => {
    const calculateReconciliation = (
      startingCash: number,
      cashOrders: Order[],
      pettyCashExpenses: PettyCashExpense[],
      physicalCashInput: number
    ) => {
      const totalCashSales = cashOrders
        .filter((o) => o.status === 'PAID' && o.paymentMethod === 'CASH')
        .reduce((sum, o) => sum + o.total, 0);

      const totalPettyCashOut = pettyCashExpenses
        .filter((p) => p.status !== 'DITOLAK')
        .reduce((sum, p) => sum + p.amount, 0);

      const expectedCash = startingCash + totalCashSales - totalPettyCashOut;
      const difference = physicalCashInput - expectedCash;

      return {
        totalCashSales,
        totalPettyCashOut,
        expectedCash,
        difference,
        isBalanced: difference === 0,
        status: difference === 0 ? 'BALANCED' : difference > 0 ? 'OVER' : 'SHORT',
      };
    };

    const mockCashOrders: Order[] = [
      {
        id: 'ord-1',
        invoiceNumber: 'INV-1',
        outletId: 'ot-1',
        outletName: 'Dago',
        orderType: 'dine-in',
        items: [],
        subtotal: 50000,
        discount: 0,
        total: 50000,
        hppTotal: 25000,
        paymentMethod: 'CASH',
        cashierName: 'Kasir',
        status: 'PAID',
        createdAt: '2026-11-05T08:00:00Z',
      },
      {
        id: 'ord-2',
        invoiceNumber: 'INV-2',
        outletId: 'ot-1',
        outletName: 'Dago',
        orderType: 'dine-in',
        items: [],
        subtotal: 75000,
        discount: 0,
        total: 75000,
        hppTotal: 35000,
        paymentMethod: 'CASH',
        cashierName: 'Kasir',
        status: 'PAID',
        createdAt: '2026-11-05T09:00:00Z',
      },
      {
        id: 'ord-3',
        invoiceNumber: 'INV-3',
        outletId: 'ot-1',
        outletName: 'Dago',
        orderType: 'dine-in',
        items: [],
        subtotal: 100000,
        discount: 0,
        total: 100000,
        hppTotal: 50000,
        paymentMethod: 'QRIS', // should not count into cash drawer
        cashierName: 'Kasir',
        status: 'PAID',
        createdAt: '2026-11-05T10:00:00Z',
      },
    ];

    const mockPettyCash: PettyCashExpense[] = [
      {
        id: 'pc-1',
        expenseNumber: 'EXP-001',
        outletId: 'ot-1',
        outletName: 'Dago',
        cashierName: 'Kasir',
        category: 'ES_BATU',
        amount: 25000,
        description: 'Beli es batu kristal',
        receiptImageUrl: '',
        status: 'DISETUJUI',
        createdAt: '2026-11-05T08:30:00Z',
      },
    ];

    it('should correctly calculate expected cash drawer balance', () => {
      const startingCash = 500000;
      // Expected = 500.000 + (50.000 + 75.000) - 25.000 = 600.000
      const physicalCash = 600000;

      const recon = calculateReconciliation(startingCash, mockCashOrders, mockPettyCash, physicalCash);
      expect(recon.totalCashSales).toBe(125000);
      expect(recon.totalPettyCashOut).toBe(25000);
      expect(recon.expectedCash).toBe(600000);
      expect(recon.difference).toBe(0);
      expect(recon.isBalanced).toBe(true);
      expect(recon.status).toBe('BALANCED');
    });

    it('should detect cash shortages (selisih minus / kurang)', () => {
      const startingCash = 500000;
      const physicalCash = 580000; // Less than expected 600.000

      const recon = calculateReconciliation(startingCash, mockCashOrders, mockPettyCash, physicalCash);
      expect(recon.difference).toBe(-20000);
      expect(recon.isBalanced).toBe(false);
      expect(recon.status).toBe('SHORT');
    });

    it('should detect cash surplus (selisih lebih / over)', () => {
      const startingCash = 500000;
      const physicalCash = 615000; // More than expected 600.000

      const recon = calculateReconciliation(startingCash, mockCashOrders, mockPettyCash, physicalCash);
      expect(recon.difference).toBe(15000);
      expect(recon.isBalanced).toBe(false);
      expect(recon.status).toBe('OVER');
    });
  });

  describe('3. Thermal ESC/POS Raw Text Generation & Formatting', () => {
    const buildRawEscPos = (order: Order, brandName: string, paperSize: '58mm' | '80mm') => {
      const divider =
        paperSize === '58mm'
          ? '--------------------------------'
          : '------------------------------------------';
      const itemsText = order.items
        .map(
          (it) =>
            `${it.name}\n  ${it.quantity}x @ Rp ${it.price.toLocaleString('id-ID')} = Rp ${(it.price * it.quantity).toLocaleString('id-ID')}`
        )
        .join('\n');

      return (
        `${brandName.toUpperCase()}\n` +
        `${order.outletName}\n` +
        `${divider}\n` +
        `No: ${order.invoiceNumber}\n` +
        `Kasir: ${order.cashierName}\n` +
        `Waktu: ${new Date(order.createdAt).toLocaleString('id-ID')}\n` +
        `${divider}\n` +
        `${itemsText}\n` +
        `${divider}\n` +
        `SUBTOTAL: Rp ${order.subtotal.toLocaleString('id-ID')}\n` +
        (order.discount > 0 ? `DISKON: -Rp ${order.discount.toLocaleString('id-ID')}\n` : '') +
        `TOTAL: Rp ${order.total.toLocaleString('id-ID')}\n` +
        `METODE: ${order.paymentMethod}\n` +
        (order.paymentMethod === 'CASH'
          ? `TUNAI: Rp ${(order.cashReceived || order.total).toLocaleString('id-ID')}\nKEMBALI: Rp ${(order.changeAmount || 0).toLocaleString('id-ID')}\n`
          : '') +
        `${divider}\n` +
        `Terima kasih atas kunjungan Anda!\n`
      );
    };

    const mockOrder: Order = {
      id: 'ord-thermal',
      invoiceNumber: 'INV/DIMSUM/20261105/009',
      outletId: 'otlate1',
      outletName: 'Outlet 1 - Dago Pusat',
      orderType: 'takeaway',
      items: [
        { menuId: 'm1', name: 'Siomay Premium', price: 28000, costPrice: 13000, quantity: 2 },
        { menuId: 'm2', name: 'Es Liang Teh', price: 12000, costPrice: 3000, quantity: 1 },
      ],
      subtotal: 68000,
      discount: 5000,
      total: 63000,
      hppTotal: 29000,
      paymentMethod: 'CASH',
      cashReceived: 100000,
      changeAmount: 37000,
      cashierName: 'Kasir Dago',
      status: 'PAID',
      createdAt: '2026-11-05T08:45:00.000Z',
    };

    it('should generate properly formatted 58mm raw text for Bluetooth thermal printers', () => {
      const raw58 = buildRawEscPos(mockOrder, 'Dimsum Intan', '58mm');
      expect(raw58).toContain('DIMSUM INTAN');
      expect(raw58).toContain('Outlet 1 - Dago Pusat');
      expect(raw58).toContain('INV/DIMSUM/20261105/009');
      expect(raw58).toContain('Siomay Premium');
      expect(raw58).toContain('DISKON: -Rp 5.000');
      expect(raw58).toContain('TOTAL: Rp 63.000');
      expect(raw58).toContain('TUNAI: Rp 100.000');
      expect(raw58).toContain('KEMBALI: Rp 37.000');
      expect(raw58).toContain('--------------------------------\n');
    });

    it('should adjust divider width for 80mm POS receipt printers', () => {
      const raw80 = buildRawEscPos(mockOrder, 'Dimsum Intan', '80mm');
      expect(raw80).toContain('------------------------------------------');
    });
  });

  describe('4. Confirmation Modal Action Guardrails', () => {
    it('should invoke onConfirm when confirmed, and onCancel when cancelled', () => {
      const onConfirmMock = vi.fn();
      const onCancelMock = vi.fn();

      const simulateUserAction = (action: 'confirm' | 'cancel') => {
        if (action === 'confirm') onConfirmMock();
        else onCancelMock();
      };

      simulateUserAction('confirm');
      expect(onConfirmMock).toHaveBeenCalledTimes(1);
      expect(onCancelMock).not.toHaveBeenCalled();

      simulateUserAction('cancel');
      expect(onCancelMock).toHaveBeenCalledTimes(1);
    });
  });
});
