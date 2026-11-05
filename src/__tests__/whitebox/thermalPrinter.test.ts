import { describe, it, expect } from 'vitest';
import {
  padLine,
  centerText,
  generateEscPosBuffer,
  isWebBluetoothSupported,
  isWebUsbSupported,
} from '../../utils/thermalPrinter';
import { Order } from '../../types';

describe('White Box Testing: Thermal Mini ESC/POS Receipt Generator (58mm & 80mm)', () => {
  const sampleOrder: Order = {
    id: 'ord-test-01',
    invoiceNumber: 'INV/DGO/20261105/001',
    outletId: 'out-01',
    outletName: 'Dimsum Intan Dago',
    orderType: 'dine-in',
    customerName: 'Bpk. Hendra',
    tableNumber: '4',
    items: [
      { menuId: 'm1', name: 'Siomay Ayam Udang', price: 20000, costPrice: 9000, quantity: 2, notes: 'Kukus hangat' },
      { menuId: 'm2', name: 'Hakau Kristal', price: 25000, costPrice: 12000, quantity: 1 },
      { menuId: 'm3', name: 'Es Liang Teh', price: 8000, costPrice: 2000, quantity: 2 },
    ],
    subtotal: 81000,
    discount: 5000,
    total: 76000,
    hppTotal: 34000,
    paymentMethod: 'CASH',
    cashReceived: 100000,
    changeAmount: 24000,
    cashierName: 'Asep Kasir',
    status: 'PAID',
    createdAt: '2026-11-05T12:00:00.000Z',
  };

  it('padLine should accurately pad spaces between left and right text', () => {
    const line32 = padLine('Subtotal', 'Rp 81.000', 32);
    expect(line32.length).toBe(32);
    expect(line32.startsWith('Subtotal')).toBe(true);
    expect(line32.endsWith('Rp 81.000')).toBe(true);

    const line48 = padLine('TOTAL BAYAR', 'Rp 76.000', 48);
    expect(line48.length).toBe(48);
    expect(line48.startsWith('TOTAL BAYAR')).toBe(true);
    expect(line48.endsWith('Rp 76.000')).toBe(true);
  });

  it('padLine should handle strings that exceed width without crash', () => {
    const longLeft = 'Menu Paket Komplit Spesial Dimsum Sultan Premium Goreng Kukus';
    const result = padLine(longLeft, 'Rp 100.000', 32);
    expect(result.endsWith('Rp 100.000')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(32);
  });

  it('centerText should properly center text with balanced whitespace', () => {
    const centered = centerText('DIMSUM INTAN', 32);
    expect(centered.length).toBe(32);
    expect(centered.trim()).toBe('DIMSUM INTAN');
  });

  it('generateEscPosBuffer should generate valid ESC/POS byte array for 58mm customer receipt', () => {
    const buffer = generateEscPosBuffer(sampleOrder, {
      brandName: 'Dimsum Intan',
      outletName: 'Cabang Dago',
      outletAddress: 'Jl. Ir H Djuanda No. 12',
      outletPhone: '0812-3456-7890',
      paperSize: '58mm',
      receiptType: 'customer',
    });

    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(100);

    // Decode byte sequence to text
    const text = new TextDecoder().decode(buffer);
    expect(text).toContain('DIMSUM INTAN');
    expect(text).toContain('Cabang Dago');
    expect(text).toContain('INV/DGO/20261105/001');
    expect(text).toContain('Siomay Ayam Udang');
    expect(text).toContain('Hakau Kristal');
    expect(text).toContain('Subtotal');
    expect(text).toContain('Diskon Promo');
    expect(text).toContain('TOTAL BAYAR');
    expect(text).toContain('Metode Bayar');
    expect(text).toContain('CASH');
    expect(text).toContain('Kembalian');
    expect(text).toContain('Terima Kasih!');
  });

  it('generateEscPosBuffer should generate valid ESC/POS byte array for 80mm kitchen ticket', () => {
    const buffer = generateEscPosBuffer(sampleOrder, {
      brandName: 'Dimsum Intan',
      outletName: 'Cabang Dago',
      paperSize: '80mm',
      receiptType: 'kitchen',
    });

    expect(buffer).toBeInstanceOf(Uint8Array);
    const text = new TextDecoder().decode(buffer);
    expect(text).toContain('*** TIKET DAPUR ***');
    expect(text).toContain('MEJA: 4');
    expect(text).toContain('Jam Order');
    expect(text).toContain('[ 2x ] Siomay Ayam Udang');
    expect(text).toContain('* NOTE: Kukus hangat');
    expect(text).toContain('TOTAL PORSI');
    expect(text).toContain('5 Porsi');
  });

  it('generateEscPosBuffer should indicate VOID status when order is cancelled', () => {
    const voidOrder: Order = { ...sampleOrder, status: 'VOIDED' };
    const buffer = generateEscPosBuffer(voidOrder, {
      brandName: 'Dimsum Intan',
      paperSize: '58mm',
      receiptType: 'customer',
    });
    const text = new TextDecoder().decode(buffer);
    expect(text).toContain('*** NOTA DIBATALKAN (VOID) ***');
  });

  it('feature detection checks should return booleans in node test environment', () => {
    expect(typeof isWebBluetoothSupported()).toBe('boolean');
    expect(typeof isWebUsbSupported()).toBe('boolean');
  });
});
