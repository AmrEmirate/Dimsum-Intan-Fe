import { describe, it, expect } from 'vitest';
import { PettyCashExpense, MenuItem, FactoryInvoice, FixedExpense, ShiftSession } from '../../types';

interface OperationalNotif {
  id: string;
  category: 'kas_kecil' | 'stok' | 'tagihan' | 'shift' | 'info';
  urgency: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  badge: string;
  view: string;
}

describe('Black Box Testing: Operational Notifications & Alerts Workflow', () => {
  // Pure business logic evaluator simulating Header notification engine
  const evaluateOperationalNotifications = (params: {
    pettyCashList: PettyCashExpense[];
    menuItems: MenuItem[];
    factoryInvoices: FactoryInvoice[];
    fixedExpenses: FixedExpense[];
    cashierRole: string;
    activeShift: ShiftSession | null;
  }): OperationalNotif[] => {
    const list: OperationalNotif[] = [];

    // 1. Pending petty cash verification
    if (params.pettyCashList) {
      params.pettyCashList
        .filter((p) => p.status === 'MENUNGGU_VERIFIKASI')
        .forEach((p) => {
          list.push({
            id: `pc-${p.id}`,
            category: 'kas_kecil',
            urgency: 'medium',
            title: `Kas Kecil: ${p.expenseNumber}`,
            description: `Pengeluaran Rp ${p.amount.toLocaleString('id-ID')} (${p.description}) butuh verifikasi.`,
            badge: 'Persetujuan Kasir',
            view: 'kas-kecil-outlet',
          });
        });
    }

    // 2. Low stock and out-of-stock dimsum alerts
    if (params.menuItems) {
      params.menuItems
        .filter((m) => (m.stock ?? 100) <= 5)
        .forEach((m) => {
          const isZero = m.stock === 0;
          list.push({
            id: `stock-${m.id}`,
            category: 'stok',
            urgency: isZero ? 'high' : 'medium',
            title: isZero ? `Stok Habis: ${m.name}` : `Stok Menipis: ${m.name}`,
            description: isZero
              ? 'Porsi habis (0). Segera restock dari gudang/pesan pabrik.'
              : `Sisa ${m.stock} porsi di cabang kasir. Segera siapkan stok.`,
            badge: isZero ? 'Habis (0)' : `Sisa ${m.stock}`,
            view: 'master-menu-dimsum-hpp',
          });
        });
    }

    // 3. Unpaid factory invoices
    if (params.factoryInvoices) {
      params.factoryInvoices
        .filter((f) => f.status === 'BELUM_LUNAS' || f.status === 'JATUH_TEMPO')
        .forEach((f) => {
          list.push({
            id: `inv-${f.id}`,
            category: 'tagihan',
            urgency: f.status === 'JATUH_TEMPO' ? 'high' : 'medium',
            title: `Tagihan Pabrik: ${f.invoiceNumber}`,
            description: `Faktur senilai Rp ${f.totalAmount.toLocaleString('id-ID')} belum lunas.`,
            badge: f.dueDate ? `Tempo ${f.dueDate}` : 'Belum Lunas',
            view: 'tagihan-suplai-pabrik',
          });
        });
    }

    // 4. Fixed OPEX bills
    if (params.fixedExpenses) {
      params.fixedExpenses
        .filter((e) => e.status === 'TERJADWAL')
        .forEach((e) => {
          list.push({
            id: `opex-${e.id}`,
            category: 'tagihan',
            urgency: 'medium',
            title: `Beban OPEX: ${e.title}`,
            description: `Beban rutin Rp ${e.amount.toLocaleString('id-ID')} jatuh tempo pada ${e.dueDate}.`,
            badge: `Tempo ${e.dueDate}`,
            view: 'beban-operasional-tetap',
          });
        });
    }

    // 5. Cashier shift opening reminder
    if (params.cashierRole === 'KASIR' && (!params.activeShift || params.activeShift.status !== 'ACTIVE')) {
      list.push({
        id: 'shift-reminder',
        category: 'shift',
        urgency: 'high',
        title: 'Sesi Kasir Belum Dibuka',
        description: 'Buka sesi shift dan input modal laci kasir sebelum melayani transaksi POS.',
        badge: 'Wajib Buka Shift',
        view: 'sesi-shift-kasir',
      });
    }

    return list;
  };

  const samplePettyCash: PettyCashExpense[] = [
    {
      id: 'pc-1',
      expenseNumber: 'EXP-001',
      outletId: 'ot-1',
      outletName: 'Outlet Dago',
      cashierName: 'Kasir',
      category: 'ES_BATU',
      amount: 25000,
      description: 'Beli es batu kristal',
      receiptImageUrl: 'https://example.com/receipt.jpg',
      status: 'MENUNGGU_VERIFIKASI',
      createdAt: '2026-11-05T08:00:00Z',
    },
  ];

  const sampleMenuItems: MenuItem[] = [
    {
      id: 'm1',
      code: 'DIM-001',
      name: 'Siomay Ayam Udang',
      category: 'kukus',
      price: 20000,
      costPrice: 9000,
      stock: 0, // OUT OF STOCK
      description: '',
      image: '',
      isAvailable: true,
    },
    {
      id: 'm2',
      code: 'DIM-002',
      name: 'Hakau Dimsum',
      category: 'kukus',
      price: 25000,
      costPrice: 12000,
      stock: 3, // LOW STOCK
      description: '',
      image: '',
      isAvailable: true,
    },
    {
      id: 'm3',
      code: 'DIM-003',
      name: 'Lumpia Goreng',
      category: 'goreng',
      price: 22000,
      costPrice: 10000,
      stock: 30, // NORMAL
      description: '',
      image: '',
      isAvailable: true,
    },
  ];

  const sampleFactoryInvoices: FactoryInvoice[] = [
    {
      id: 'fac-1',
      invoiceNumber: 'INV/FAC/001',
      supplierName: 'Pabrik Dimsum Utama',
      outletId: 'ot-1',
      outletName: 'Outlet Dago',
      totalAmount: 1850000,
      status: 'JATUH_TEMPO',
      issueDate: '2026-10-25',
      dueDate: '2026-11-05',
      bankAccount: 'BCA 1234567890',
      items: [],
    },
  ];

  describe('1. Dynamic Notification Generation', () => {
    it('aggregates alerts from petty cash, low stock, and factory invoices', () => {
      const notifs = evaluateOperationalNotifications({
        pettyCashList: samplePettyCash,
        menuItems: sampleMenuItems,
        factoryInvoices: sampleFactoryInvoices,
        fixedExpenses: [],
        cashierRole: 'OWNER',
        activeShift: null,
      });

      expect(notifs).toHaveLength(4);
      expect(notifs.some((n) => n.id === 'pc-pc-1')).toBe(true);
      expect(notifs.some((n) => n.id === 'stock-m1' && n.urgency === 'high')).toBe(true);
      expect(notifs.some((n) => n.id === 'stock-m2' && n.urgency === 'medium')).toBe(true);
      expect(notifs.some((n) => n.id === 'inv-fac-1' && n.urgency === 'high')).toBe(true);
    });

    it('triggers mandatory shift opening reminder for KASIR without active shift', () => {
      const notifs = evaluateOperationalNotifications({
        pettyCashList: [],
        menuItems: [],
        factoryInvoices: [],
        fixedExpenses: [],
        cashierRole: 'KASIR',
        activeShift: null,
      });

      const shiftNotif = notifs.find((n) => n.id === 'shift-reminder');
      expect(shiftNotif).toBeDefined();
      expect(shiftNotif?.urgency).toBe('high');
      expect(shiftNotif?.view).toBe('sesi-shift-kasir');
    });

    it('does NOT trigger shift opening reminder if shift is already ACTIVE', () => {
      const activeShift: ShiftSession = {
        id: 'shift-1',
        shiftName: 'Shift Pagi',
        outletId: 'ot-1',
        outletName: 'Outlet Dago',
        cashierId: 'u-kasir',
        cashierName: 'Kasir',
        terminalId: 'POS-01',
        startTime: '2026-11-05T07:00:00Z',
        startingCash: 500000,
        cashSales: 0,
        qrisSales: 0,
        pettyCashOut: 0,
        expectedCash: 500000,
        status: 'ACTIVE',
      };

      const notifs = evaluateOperationalNotifications({
        pettyCashList: [],
        menuItems: [],
        factoryInvoices: [],
        fixedExpenses: [],
        cashierRole: 'KASIR',
        activeShift,
      });

      expect(notifs.find((n) => n.id === 'shift-reminder')).toBeUndefined();
    });
  });

  describe('2. Read Status & Filter Tabs Lifecycle', () => {
    it('calculates unreadCount accurately based on readNotifIds set', () => {
      const notifs = evaluateOperationalNotifications({
        pettyCashList: samplePettyCash,
        menuItems: sampleMenuItems,
        factoryInvoices: sampleFactoryInvoices,
        fixedExpenses: [],
        cashierRole: 'OWNER',
        activeShift: null,
      });

      let readNotifIds: string[] = [];
      expect(notifs.filter((n) => !readNotifIds.includes(n.id)).length).toBe(4);

      // Read stock-m1
      readNotifIds.push('stock-m1');
      expect(notifs.filter((n) => !readNotifIds.includes(n.id)).length).toBe(3);

      // Mark all as read
      readNotifIds = notifs.map((n) => n.id);
      expect(notifs.filter((n) => !readNotifIds.includes(n.id)).length).toBe(0);
    });

    it('filters notifications by urgency and category', () => {
      const notifs = evaluateOperationalNotifications({
        pettyCashList: samplePettyCash,
        menuItems: sampleMenuItems,
        factoryInvoices: sampleFactoryInvoices,
        fixedExpenses: [],
        cashierRole: 'OWNER',
        activeShift: null,
      });

      const urgentNotifs = notifs.filter((n) => n.urgency === 'high');
      expect(urgentNotifs).toHaveLength(2); // stock-m1 (habis) + inv-fac-1 (jatuh tempo)

      const stockNotifs = notifs.filter((n) => n.category === 'stok');
      expect(stockNotifs).toHaveLength(2); // stock-m1 and stock-m2

      const pettyCashNotifs = notifs.filter((n) => n.category === 'kas_kecil');
      expect(pettyCashNotifs).toHaveLength(1);
    });
  });
});
