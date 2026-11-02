import { describe, it, expect } from 'vitest';
import { Order } from '../../types';

describe('White Box Testing: Receipt Formatting & Dynamic Brand White-Labeling', () => {
  const sampleOrderCash: Order = {
    id: 'ord-101',
    invoiceNumber: 'INV/DU01/20261102/001',
    outletId: 'out-01',
    outletName: 'Cabang Dipati Ukur',
    orderType: 'dine-in',
    customerName: 'Pelanggan Meja 5',
    tableNumber: '5',
    items: [
      { menuId: 'm1', name: 'Dimsum Mentai', price: 25000, costPrice: 12000, quantity: 2 },
      { menuId: 'm2', name: 'Es Teh Manis', price: 5000, costPrice: 1500, quantity: 2 },
    ],
    subtotal: 60000,
    discount: 10000,
    total: 50000,
    hppTotal: 27000,
    paymentMethod: 'CASH',
    cashReceived: 100000,
    changeAmount: 50000,
    cashierName: 'Asep Kasir',
    status: 'PAID',
    createdAt: '2026-11-02T12:30:00.000Z',
  };

  const sampleOrderQris: Order = {
    ...sampleOrderCash,
    id: 'ord-102',
    invoiceNumber: 'INV/DU01/20261102/002',
    paymentMethod: 'QRIS',
    cashReceived: undefined,
    changeAmount: undefined,
  };

  // Logic replicated from ReceiptModal.tsx
  const buildWhatsAppReceiptText = (order: Order, brandName: string) => {
    const itemsText = order.items
      .map((it) => `- ${it.name} (${it.quantity}x) = Rp ${(it.price * it.quantity).toLocaleString('id-ID')}`)
      .join('%0A');

    return (
      `*NOTA PEMBAYARAN ${brandName.toUpperCase()}*%0A` +
      `No. Nota: ${order.invoiceNumber}%0A` +
      `Outlet: ${order.outletName}%0A` +
      `Waktu: ${new Date(order.createdAt).toLocaleString('id-ID')}%0A` +
      `Kasir: ${order.cashierName}%0A` +
      `--------------------------------%0A` +
      `${itemsText}%0A` +
      `--------------------------------%0A` +
      `Subtotal: Rp ${order.subtotal.toLocaleString('id-ID')}%0A` +
      (order.discount > 0 ? `Diskon: -Rp ${order.discount.toLocaleString('id-ID')}%0A` : '') +
      `*TOTAL BAYAR: Rp ${order.total.toLocaleString('id-ID')}*%0A` +
      `Metode: ${order.paymentMethod}%0A` +
      (order.paymentMethod === 'CASH'
        ? `Tunai: Rp ${(order.cashReceived || order.total).toLocaleString('id-ID')}%0AKembalian: Rp ${(order.changeAmount || 0).toLocaleString('id-ID')}%0A`
        : '') +
      `%0ATerima kasih telah berbelanja di ${brandName}! 🙏`
    );
  };

  it('should dynamically inject customized brand name into WhatsApp receipt', () => {
    const textCustom = buildWhatsAppReceiptText(sampleOrderCash, 'Kopi Senja Utama');
    expect(textCustom).toContain('*NOTA PEMBAYARAN KOPI SENJA UTAMA*');
    expect(textCustom).toContain('Terima kasih telah berbelanja di Kopi Senja Utama! 🙏');
    expect(textCustom).not.toContain('DIMSUM INTAN');
  });

  it('should include Cash Received and Change for CASH transactions', () => {
    const text = buildWhatsAppReceiptText(sampleOrderCash, 'Dimsum Intan');
    expect(text).toContain('Metode: CASH');
    expect(text).toContain('Tunai: Rp 100.000');
    expect(text).toContain('Kembalian: Rp 50.000');
  });

  it('should omit Cash Received and Change for QRIS transactions', () => {
    const text = buildWhatsAppReceiptText(sampleOrderQris, 'Dimsum Intan');
    expect(text).toContain('Metode: QRIS');
    expect(text).not.toContain('Tunai:');
    expect(text).not.toContain('Kembalian:');
  });

  it('should display discount row only when discount is greater than 0', () => {
    const textWithDiscount = buildWhatsAppReceiptText(sampleOrderCash, 'Toko');
    expect(textWithDiscount).toContain('Diskon: -Rp 10.000');

    const orderNoDiscount: Order = { ...sampleOrderCash, discount: 0 };
    const textNoDiscount = buildWhatsAppReceiptText(orderNoDiscount, 'Toko');
    expect(textNoDiscount).not.toContain('Diskon:');
  });
});
