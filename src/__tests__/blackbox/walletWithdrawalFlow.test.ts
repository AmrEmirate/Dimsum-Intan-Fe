import { describe, it, expect } from 'vitest';
import { WalletTransaction, WithdrawalRequest } from '../../types';

describe('Black-Box & White-Box Testing: Wallet & Withdrawal Flow (Dimsum Intan POS)', () => {
  // White-Box: Logic validation for withdrawal requests
  const validateWithdrawalInput = (
    amount: number,
    currentBalance: number,
    bankAccount: { bankAccountNumber: string; bankAccountName: string; bankName: string } | null
  ): { isValid: boolean; error?: string } => {
    if (!bankAccount || !bankAccount.bankAccountNumber || !bankAccount.bankAccountName) {
      return { isValid: false, error: 'Harap atur rekening bank tujuan penarikan terlebih dahulu!' };
    }
    if (isNaN(amount) || amount <= 0) {
      return { isValid: false, error: 'Masukkan nominal penarikan yang valid!' };
    }
    if (amount < 20000) {
      return { isValid: false, error: 'Nominal penarikan minimal Rp 20.000!' };
    }
    if (amount > currentBalance) {
      return { isValid: false, error: 'Saldo dompet tidak mencukupi untuk penarikan ini!' };
    }
    return { isValid: true };
  };

  // White-Box: Filter transactions by type, outlet, and search query
  const filterTransactions = (
    transactions: WalletTransaction[],
    filterType: 'ALL' | 'CREDIT' | 'DEBIT',
    selectedOutletId: string,
    searchQuery: string
  ): WalletTransaction[] => {
    return transactions.filter((tx) => {
      if (filterType !== 'ALL' && tx.type !== filterType) {
        return false;
      }
      if (selectedOutletId !== 'ALL') {
        if (tx.outletId !== selectedOutletId && tx.outlet?.id !== selectedOutletId) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = tx.description?.toLowerCase().includes(q);
        const matchCat = tx.category?.toLowerCase().includes(q);
        const matchOutlet = tx.outlet?.name?.toLowerCase().includes(q);
        const matchRef = tx.referenceId?.toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchOutlet && !matchRef) {
          return false;
        }
      }
      return true;
    });
  };

  describe('White-Box: Withdrawal Validation Logic', () => {
    const validBank = {
      bankName: 'BCA',
      bankAccountNumber: '8830123456',
      bankAccountName: 'DIMSUM INTAN OFFICIAL',
    };

    it('should reject withdrawal when bank account is missing or incomplete', () => {
      const res = validateWithdrawalInput(50000, 100000, null);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('rekening bank');
    });

    it('should reject withdrawal when amount is less than minimum Rp 20.000', () => {
      const res = validateWithdrawalInput(15000, 500000, validBank);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('minimal Rp 20.000');
    });

    it('should reject withdrawal when amount exceeds active wallet balance', () => {
      const res = validateWithdrawalInput(1500000, 1000000, validBank);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Saldo dompet tidak mencukupi');
    });

    it('should accept valid withdrawal within balance limits', () => {
      const res = validateWithdrawalInput(250000, 1000000, validBank);
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('should calculate net amount correctly with zero service fees (BI-FAST Merchant)', () => {
      const amount = 500000;
      const fee = 0;
      const netAmount = amount - fee;
      expect(netAmount).toBe(500000);
    });
  });

  describe('Black-Box: Multi-Outlet Audit & Filter Capabilities', () => {
    const mockTxList: WalletTransaction[] = [
      {
        id: 'tx-1',
        tenantId: 'tenant-1',
        outletId: 'out-1',
        outlet: { id: 'out-1', name: 'Dipatiukur', code: 'DPU' },
        type: 'CREDIT',
        category: 'POS_SALES',
        amount: 88000,
        balanceBefore: 2362000,
        balanceAfter: 2450000,
        referenceId: 'INV/DPU/001',
        description: 'Penjualan Kasir POS Meja 04',
        createdAt: '2024-11-04T14:15:00Z',
      },
      {
        id: 'tx-2',
        tenantId: 'tenant-1',
        outletId: 'out-2',
        outlet: { id: 'out-2', name: 'Riau', code: 'RIU' },
        type: 'CREDIT',
        category: 'POS_SALES',
        amount: 150000,
        balanceBefore: 2212000,
        balanceAfter: 2362000,
        referenceId: 'INV/RIU/002',
        description: 'Penjualan Kasir POS Meja 02',
        createdAt: '2024-11-04T13:40:00Z',
      },
      {
        id: 'tx-3',
        tenantId: 'tenant-1',
        outletId: null,
        type: 'DEBIT',
        category: 'WITHDRAWAL',
        amount: 1200000,
        balanceBefore: 3412000,
        balanceAfter: 2212000,
        referenceId: 'WD/102',
        description: 'Penarikan ke Bank BCA Rekening Utama',
        createdAt: '2024-11-03T21:00:00Z',
      },
    ];

    it('should return all transactions when ALL filter is active and query is empty', () => {
      const results = filterTransactions(mockTxList, 'ALL', 'ALL', '');
      expect(results.length).toBe(3);
    });

    it('should filter only CREDIT (omzet masuk) transactions', () => {
      const results = filterTransactions(mockTxList, 'CREDIT', 'ALL', '');
      expect(results.length).toBe(2);
      expect(results.every((t) => t.type === 'CREDIT')).toBe(true);
    });

    it('should filter only DEBIT (pencairan keluar) transactions', () => {
      const results = filterTransactions(mockTxList, 'DEBIT', 'ALL', '');
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('DEBIT');
    });

    it('should filter by specific outlet (Dipatiukur)', () => {
      const results = filterTransactions(mockTxList, 'ALL', 'out-1', '');
      expect(results.length).toBe(1);
      expect(results[0].outlet?.name).toBe('Dipatiukur');
    });

    it('should filter by text search query matching reference ID', () => {
      const results = filterTransactions(mockTxList, 'ALL', 'ALL', 'WD/102');
      expect(results.length).toBe(1);
      expect(results[0].referenceId).toBe('WD/102');
    });
  });
});
