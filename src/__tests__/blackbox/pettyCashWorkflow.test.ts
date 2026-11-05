import { describe, it, expect } from 'vitest';
import { PettyCashExpense, PettyCashCategory, Outlet } from '../../types';
import { parseRupiahNumber } from '../../utils/currencyUtils';

describe('Black Box Testing: Petty Cash (Kas Kecil) Lifecycle & SOP Audit Workflow', () => {
  const mockOutlet: Outlet = {
    id: 'ot-dago',
    code: 'DGO-01',
    name: 'Outlet 1 - Dago Dipatiukur',
    city: 'Bandung',
    address: 'Jl. Dipatiukur No. 45 Bandung',
    phone: '081234567890',
    targetDailySales: 5000000,
  };

  interface PettyCashSubmissionInput {
    outletId: string;
    cashierName: string;
    category: PettyCashCategory;
    amountInput: string; // Formatted or raw string e.g. "120.000" or "120000"
    description: string;
    receiptImageUrl: string;
    maxLimitPerNote: number;
    currentDrawerCash: number;
  }

  interface SubmissionResult {
    success: boolean;
    error?: string;
    expense?: PettyCashExpense;
    updatedDrawerCash?: number;
  }

  // Pure functional black-box workflow simulator
  const submitPettyCashExpense = (input: PettyCashSubmissionInput): SubmissionResult => {
    const cleanAmount = parseRupiahNumber(input.amountInput);

    if (cleanAmount <= 0) {
      return { success: false, error: 'Nominal pengeluaran harus lebih besar dari Rp 0!' };
    }

    if (cleanAmount > input.maxLimitPerNote) {
      return {
        success: false,
        error: `Nominal melebihi batas maksimal SOP per nota (Rp ${input.maxLimitPerNote.toLocaleString('id-ID')})!`,
      };
    }

    if (cleanAmount > input.currentDrawerCash) {
      return {
        success: false,
        error: 'Saldo uang tunai di laci kasir tidak mencukupi untuk pengeluaran ini!',
      };
    }

    if (!input.description || input.description.trim().length < 5) {
      return {
        success: false,
        error: 'Keterangan pengeluaran wajib diisi minimal 5 karakter!',
      };
    }

    // Strict audit SOP: physical receipt photo is mandatory
    if (!input.receiptImageUrl || input.receiptImageUrl.trim() === '') {
      return {
        success: false,
        error: 'SOP Audit Kasir: Wajib mengunggah foto struk/nota fisik asli!',
      };
    }

    const expense: PettyCashExpense = {
      id: `pc-${Date.now()}`,
      expenseNumber: `EXP/DAGO/${Date.now().toString().slice(-4)}`,
      outletId: input.outletId,
      outletName: mockOutlet.name,
      cashierName: input.cashierName,
      category: input.category,
      amount: cleanAmount,
      description: input.description.trim(),
      receiptImageUrl: input.receiptImageUrl,
      status: 'MENUNGGU_VERIFIKASI',
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      expense,
      updatedDrawerCash: input.currentDrawerCash - cleanAmount,
    };
  };

  const verifyPettyCashExpense = (
    expense: PettyCashExpense,
    action: 'SETUJU' | 'TOLAK',
    reviewerRole: 'SUPERVISOR' | 'OWNER' | 'KASIR',
    rejectionReason?: string
  ): {
    updatedExpense: PettyCashExpense;
    status: 'MENUNGGU_VERIFIKASI' | 'DISETUJUI' | 'DITOLAK';
    refundNeeded: boolean;
  } => {
    if (reviewerRole !== 'SUPERVISOR' && reviewerRole !== 'OWNER') {
      throw new Error('Hanya Supervisor atau Owner yang berhak memverifikasi nota kas kecil!');
    }

    if (action === 'SETUJU') {
      return {
        updatedExpense: {
          ...expense,
          status: 'DISETUJUI',
          verifiedBy: reviewerRole,
          verifiedAt: new Date().toISOString(),
        },
        status: 'DISETUJUI',
        refundNeeded: false,
      };
    } else {
      if (!rejectionReason) {
        throw new Error('Alasan penolakan wajib dicantumkan oleh Supervisor!');
      }
      return {
        updatedExpense: {
          ...expense,
          status: 'DITOLAK',
          verifiedBy: reviewerRole,
          verifiedAt: new Date().toISOString(),
        },
        status: 'DITOLAK',
        refundNeeded: true, // Cash must be returned to drawer upon rejection
      };
    }
  };

  describe('1. Form Submission & SOP Limit Enforcements', () => {
    it('accepts valid petty cash submission with formatted rupiah input and Cloudinary receipt', () => {
      const result = submitPettyCashExpense({
        outletId: 'ot-dago',
        cashierName: 'Asep Kasir',
        category: 'ES_BATU',
        amountInput: '35.000',
        description: 'Beli 2 karung es batu kristal higienis',
        receiptImageUrl: 'https://res.cloudinary.com/dimsumintan/image/upload/v1/receipts/struk_es.jpg',
        maxLimitPerNote: 150000,
        currentDrawerCash: 500000,
      });

      expect(result.success).toBe(true);
      expect(result.expense).toBeDefined();
      expect(result.expense?.amount).toBe(35000);
      expect(result.expense?.status).toBe('MENUNGGU_VERIFIKASI');
      expect(result.updatedDrawerCash).toBe(465000);
    });

    it('rejects submission exceeding maxLimitPerNote (e.g. Rp 175.000 > Rp 150.000 SOP limit)', () => {
      const result = submitPettyCashExpense({
        outletId: 'ot-dago',
        cashierName: 'Asep Kasir',
        category: 'LAINNYA',
        amountInput: '175.000',
        description: 'Beli tabung gas LPG 12kg darurat',
        receiptImageUrl: 'https://res.cloudinary.com/dimsumintan/image/upload/v1/receipts/lpg.jpg',
        maxLimitPerNote: 150000,
        currentDrawerCash: 500000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Nominal melebihi batas maksimal SOP per nota');
      expect(result.expense).toBeUndefined();
    });

    it('rejects submission when receipt photo is missing', () => {
      const result = submitPettyCashExpense({
        outletId: 'ot-dago',
        cashierName: 'Asep Kasir',
        category: 'PLASTIK_KEMASAN',
        amountInput: '50.000',
        description: 'Beli plastik take away tambahan',
        receiptImageUrl: '',
        maxLimitPerNote: 150000,
        currentDrawerCash: 500000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Wajib mengunggah foto struk/nota fisik asli');
    });

    it('rejects submission when drawer cash is insufficient', () => {
      const result = submitPettyCashExpense({
        outletId: 'ot-dago',
        cashierName: 'Asep Kasir',
        category: 'LAINNYA',
        amountInput: '80.000',
        description: 'Beli 2 pouch minyak goreng 2L',
        receiptImageUrl: 'https://res.cloudinary.com/dimsumintan/image/upload/v1/receipts/minyak.jpg',
        maxLimitPerNote: 150000,
        currentDrawerCash: 40000, // Only 40k left in drawer
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Saldo uang tunai di laci kasir tidak mencukupi');
    });

    it('handles custom supervisor configured limit (e.g. raised to Rp 250.000)', () => {
      const result = submitPettyCashExpense({
        outletId: 'ot-dago',
        cashierName: 'Asep Kasir',
        category: 'LAINNYA',
        amountInput: '200.000',
        description: 'Service regulator gas kompor dimsum bocor',
        receiptImageUrl: 'https://res.cloudinary.com/dimsumintan/image/upload/v1/receipts/service.jpg',
        maxLimitPerNote: 250000,
        currentDrawerCash: 1000000,
      });

      expect(result.success).toBe(true);
      expect(result.expense?.amount).toBe(200000);
      expect(result.updatedDrawerCash).toBe(800000);
    });
  });

  describe('2. Supervisor & Owner Verification Lifecycle', () => {
    const pendingExpense: PettyCashExpense = {
      id: 'pc-991',
      expenseNumber: 'EXP/DAGO/0991',
      outletId: 'ot-dago',
      outletName: 'Outlet 1 - Dago Dipatiukur',
      cashierName: 'Asep Kasir',
      category: 'LAINNYA',
      amount: 45000,
      description: 'Beli 3 botol saos cabe chili oil',
      receiptImageUrl: 'https://res.cloudinary.com/dimsumintan/image/upload/v1/receipts/saos.jpg',
      status: 'MENUNGGU_VERIFIKASI',
      createdAt: '2026-11-05T09:00:00Z',
    };

    it('allows SUPERVISOR to approve valid expense', () => {
      const { updatedExpense, status, refundNeeded } = verifyPettyCashExpense(
        pendingExpense,
        'SETUJU',
        'SUPERVISOR'
      );

      expect(status).toBe('DISETUJUI');
      expect(updatedExpense.status).toBe('DISETUJUI');
      expect(updatedExpense.verifiedBy).toBe('SUPERVISOR');
      expect(refundNeeded).toBe(false);
    });

    it('allows OWNER to reject expense with mandatory reason and flags cash refund', () => {
      const { updatedExpense, status, refundNeeded } = verifyPettyCashExpense(
        pendingExpense,
        'TOLAK',
        'OWNER',
        'Foto nota fisik buram dan tidak terbaca stempel toko'
      );

      expect(status).toBe('DITOLAK');
      expect(updatedExpense.status).toBe('DITOLAK');
      expect(updatedExpense.verifiedBy).toBe('OWNER');
      expect(refundNeeded).toBe(true);
    });

    it('blocks KASIR from approving or rejecting their own or other petty cash notes', () => {
      expect(() =>
        verifyPettyCashExpense(pendingExpense, 'SETUJU', 'KASIR')
      ).toThrow('Hanya Supervisor atau Owner yang berhak memverifikasi nota kas kecil');
    });
  });
});
