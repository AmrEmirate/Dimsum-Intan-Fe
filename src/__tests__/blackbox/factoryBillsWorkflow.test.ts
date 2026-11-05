import { describe, it, expect } from 'vitest';
import { FactoryInvoice } from '../../types';
import { parseRupiahNumber } from '../../utils/currencyUtils';

describe('Black Box Testing: Factory Supplier Invoices & Bahan Baku Debt Workflow', () => {
  interface PaymentPayload {
    invoiceId: string;
    amountPaidInput: string;
    proofImageUrl: string;
    notes?: string;
  }

  interface SettlementResult {
    updatedInvoice: FactoryInvoice;
    paymentAmount: number;
    remainingBalance: number;
    newStatus: 'LUNAS' | 'BELUM_LUNAS' | 'JATUH_TEMPO';
  }

  const recordFactoryPayment = (
    invoice: FactoryInvoice,
    payload: PaymentPayload
  ): SettlementResult => {
    const paymentAmount = parseRupiahNumber(payload.amountPaidInput);

    if (paymentAmount <= 0) {
      throw new Error('Nominal pelunasan pabrik harus lebih besar dari Rp 0!');
    }

    if (invoice.status === 'LUNAS') {
      throw new Error('Faktur pabrik ini sudah lunas sebelumnya!');
    }

    if (paymentAmount > invoice.totalAmount) {
      throw new Error(
        `Nominal pelunasan (Rp ${paymentAmount.toLocaleString('id-ID')}) melebihi total tagihan faktur (Rp ${invoice.totalAmount.toLocaleString('id-ID')})!`
      );
    }

    if (!payload.proofImageUrl || payload.proofImageUrl.trim() === '') {
      throw new Error('Bukti transfer / struk pembayaran wajib dilampirkan!');
    }

    const remainingBalance = Math.max(0, invoice.totalAmount - paymentAmount);
    const newStatus: 'LUNAS' | 'BELUM_LUNAS' | 'JATUH_TEMPO' =
      remainingBalance === 0 ? 'LUNAS' : 'BELUM_LUNAS';

    const updatedInvoice: FactoryInvoice = {
      ...invoice,
      status: newStatus,
      proofImageUrl: payload.proofImageUrl,
      paidAt: newStatus === 'LUNAS' ? new Date().toISOString() : undefined,
    };

    return {
      updatedInvoice,
      paymentAmount,
      remainingBalance,
      newStatus,
    };
  };

  const sampleInvoice: FactoryInvoice = {
    id: 'inv-fac-001',
    invoiceNumber: 'INV/PABRIK/2026/1101',
    supplierName: 'PT Dimsum Intan Manufaktur',
    outletId: 'ot-1',
    outletName: 'Outlet Dago Dipatiukur',
    totalAmount: 3500000,
    status: 'BELUM_LUNAS',
    issueDate: '2026-11-01',
    dueDate: '2026-11-15',
    bankAccount: 'BCA 8720192831 a/n PT Dimsum Intan Manufaktur',
    items: [
      {
        itemName: 'Frozen Dimsum Siomay 100 pcs',
        quantity: 20,
        unit: 'pack',
        unitCost: 120000,
        total: 2400000,
      },
      {
        itemName: 'Kulit Pangsit Premium 1kg',
        quantity: 11,
        unit: 'kg',
        unitCost: 100000,
        total: 1100000,
      },
    ],
  };

  it('records valid full settlement payment with formatted rupiah string and transitions status to LUNAS', () => {
    const res = recordFactoryPayment(sampleInvoice, {
      invoiceId: 'inv-fac-001',
      amountPaidInput: '3.500.000',
      proofImageUrl: 'https://res.cloudinary.com/dimsumintan/image/upload/v1/factory/transfer.jpg',
    });

    expect(res.paymentAmount).toBe(3500000);
    expect(res.remainingBalance).toBe(0);
    expect(res.newStatus).toBe('LUNAS');
    expect(res.updatedInvoice.status).toBe('LUNAS');
    expect(res.updatedInvoice.paidAt).toBeDefined();
    expect(res.updatedInvoice.proofImageUrl).toContain('transfer.jpg');
  });

  it('records partial installment retaining BELUM_LUNAS with remaining balance', () => {
    const res = recordFactoryPayment(sampleInvoice, {
      invoiceId: 'inv-fac-001',
      amountPaidInput: '2.000.000',
      proofImageUrl: 'https://res.cloudinary.com/dimsumintan/image/upload/v1/factory/cicilan1.jpg',
    });

    expect(res.paymentAmount).toBe(2000000);
    expect(res.remainingBalance).toBe(1500000);
    expect(res.newStatus).toBe('BELUM_LUNAS');
  });

  it('rejects overpayment exceeding total invoice amount', () => {
    expect(() =>
      recordFactoryPayment(sampleInvoice, {
        invoiceId: 'inv-fac-001',
        amountPaidInput: '4.000.000',
        proofImageUrl: 'https://example.com/receipt.jpg',
      })
    ).toThrow('melebihi total tagihan faktur');
  });

  it('rejects payment without proof of transfer', () => {
    expect(() =>
      recordFactoryPayment(sampleInvoice, {
        invoiceId: 'inv-fac-001',
        amountPaidInput: '1.000.000',
        proofImageUrl: '',
      })
    ).toThrow('Bukti transfer / struk pembayaran wajib dilampirkan');
  });
});
