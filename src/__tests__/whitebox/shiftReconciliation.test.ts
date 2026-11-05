import { describe, it, expect } from 'vitest';
import { Order, PettyCashExpense, ShiftSession } from '../../types';

describe('White Box Testing: Shift Session Cash Drawer Reconciliation Engine', () => {
  interface ShiftReconciliationResult {
    startingCash: number;
    totalCashSales: number;
    totalNonCashSales: number;
    totalPettyCashOut: number;
    expectedCash: number;
    physicalCashCounted: number;
    difference: number;
    status: 'BALANCED' | 'SHORT' | 'OVER';
  }

  const computeShiftReconciliation = (
    shift: ShiftSession,
    orders: Order[],
    pettyCashList: PettyCashExpense[],
    physicalCashCounted: number
  ): ShiftReconciliationResult => {
    // Only paid orders during this shift at this outlet
    const shiftOrders = orders.filter(
      (o) => o.status === 'PAID' && o.outletId === shift.outletId
    );

    const totalCashSales = shiftOrders
      .filter((o) => o.paymentMethod === 'CASH')
      .reduce((sum, o) => sum + o.total, 0);

    const totalNonCashSales = shiftOrders
      .filter((o) => o.paymentMethod !== 'CASH')
      .reduce((sum, o) => sum + o.total, 0);

    // Only approved petty cash expenses count against drawer cash
    const totalPettyCashOut = pettyCashList
      .filter((p) => p.status === 'DISETUJUI' && p.outletId === shift.outletId)
      .reduce((sum, p) => sum + p.amount, 0);

    const expectedCash = shift.startingCash + totalCashSales - totalPettyCashOut;
    const difference = physicalCashCounted - expectedCash;

    let status: 'BALANCED' | 'SHORT' | 'OVER' = 'BALANCED';
    if (difference < 0) status = 'SHORT';
    else if (difference > 0) status = 'OVER';

    return {
      startingCash: shift.startingCash,
      totalCashSales,
      totalNonCashSales,
      totalPettyCashOut,
      expectedCash,
      physicalCashCounted,
      difference,
      status,
    };
  };

  const sampleShift: ShiftSession = {
    id: 'shift-101',
    shiftName: 'Shift Pagi',
    outletId: 'ot-dago',
    outletName: 'Outlet Dago',
    cashierId: 'u-kasir-1',
    cashierName: 'Asep Kasir',
    terminalId: 'POS-01',
    startTime: '2026-11-05T07:00:00Z',
    startingCash: 500000,
    cashSales: 0,
    qrisSales: 0,
    pettyCashOut: 0,
    expectedCash: 500000,
    status: 'ACTIVE',
  };

  const sampleOrders: Order[] = [
    {
      id: 'ord-1',
      invoiceNumber: 'INV/DIM/001',
      outletId: 'ot-dago',
      outletName: 'Outlet Dago',
      orderType: 'dine-in',
      items: [],
      subtotal: 60000,
      discount: 0,
      total: 60000,
      hppTotal: 30000,
      paymentMethod: 'CASH',
      cashierName: 'Asep Kasir',
      status: 'PAID',
      createdAt: '2026-11-05T08:00:00Z',
    },
    {
      id: 'ord-2',
      invoiceNumber: 'INV/DIM/002',
      outletId: 'ot-dago',
      outletName: 'Outlet Dago',
      orderType: 'takeaway',
      items: [],
      subtotal: 90000,
      discount: 0,
      total: 90000,
      hppTotal: 45000,
      paymentMethod: 'CASH',
      cashierName: 'Asep Kasir',
      status: 'PAID',
      createdAt: '2026-11-05T09:30:00Z',
    },
    {
      id: 'ord-3',
      invoiceNumber: 'INV/DIM/003',
      outletId: 'ot-dago',
      outletName: 'Outlet Dago',
      orderType: 'dine-in',
      items: [],
      subtotal: 120000,
      discount: 0,
      total: 120000,
      hppTotal: 60000,
      paymentMethod: 'QRIS', // Non-cash, not in cash drawer
      cashierName: 'Asep Kasir',
      status: 'PAID',
      createdAt: '2026-11-05T10:00:00Z',
    },
    {
      id: 'ord-4',
      invoiceNumber: 'INV/DIM/004',
      outletId: 'ot-other', // Different outlet, must be excluded
      outletName: 'Outlet Riau',
      orderType: 'dine-in',
      items: [],
      subtotal: 75000,
      discount: 0,
      total: 75000,
      hppTotal: 35000,
      paymentMethod: 'CASH',
      cashierName: 'Budi Kasir',
      status: 'PAID',
      createdAt: '2026-11-05T08:15:00Z',
    },
  ];

  const samplePettyCash: PettyCashExpense[] = [
    {
      id: 'pc-1',
      expenseNumber: 'EXP/DAGO/01',
      outletId: 'ot-dago',
      outletName: 'Outlet Dago',
      cashierName: 'Asep Kasir',
      category: 'ES_BATU',
      amount: 30000,
      description: 'Beli es batu kristal',
      receiptImageUrl: 'https://example.com/receipt.jpg',
      status: 'DISETUJUI', // Approved
      createdAt: '2026-11-05T08:30:00Z',
    },
    {
      id: 'pc-2',
      expenseNumber: 'EXP/DAGO/02',
      outletId: 'ot-dago',
      outletName: 'Outlet Dago',
      cashierName: 'Asep Kasir',
      category: 'LAINNYA',
      amount: 50000,
      description: 'Beli bensin motor delivery',
      receiptImageUrl: 'https://example.com/receipt2.jpg',
      status: 'DITOLAK', // Rejected, must NOT deduct cash drawer
      createdAt: '2026-11-05T09:00:00Z',
    },
  ];

  describe('1. Cash Drawer Aggregation & Mathematical Isolation', () => {
    it('computes exact expected cash: Modal (500k) + Cash (60k+90k) - Petty Cash (30k) = 620k', () => {
      // Expected = 500.000 + 150.000 - 30.000 = 620.000
      const res = computeShiftReconciliation(sampleShift, sampleOrders, samplePettyCash, 620000);

      expect(res.startingCash).toBe(500000);
      expect(res.totalCashSales).toBe(150000);
      expect(res.totalNonCashSales).toBe(120000);
      expect(res.totalPettyCashOut).toBe(30000);
      expect(res.expectedCash).toBe(620000);
      expect(res.physicalCashCounted).toBe(620000);
      expect(res.difference).toBe(0);
      expect(res.status).toBe('BALANCED');
    });

    it('correctly detects cash drawer shortage (selisih kurang)', () => {
      // Physical count is 600.000 vs expected 620.000 (short 20.000)
      const res = computeShiftReconciliation(sampleShift, sampleOrders, samplePettyCash, 600000);

      expect(res.difference).toBe(-20000);
      expect(res.status).toBe('SHORT');
    });

    it('correctly detects cash drawer surplus (selisih lebih)', () => {
      // Physical count is 635.000 vs expected 620.000 (surplus 15.000)
      const res = computeShiftReconciliation(sampleShift, sampleOrders, samplePettyCash, 635000);

      expect(res.difference).toBe(15000);
      expect(res.status).toBe('OVER');
    });

    it('ignores rejected petty cash expenses and cross-outlet orders', () => {
      const res = computeShiftReconciliation(sampleShift, sampleOrders, samplePettyCash, 620000);
      expect(res.totalPettyCashOut).toBe(30000); // 50k rejected is omitted
      expect(res.totalCashSales).toBe(150000); // 75k from ot-other is omitted
    });
  });
});
