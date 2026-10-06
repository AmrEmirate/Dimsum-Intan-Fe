import React, { useState } from 'react';
import { Printer, X, CheckCircle2, Share2, Smartphone } from 'lucide-react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose }) => {
  const { outlets } = useApp();
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>('80mm');

  if (!isOpen || !order) return null;

  const currentOutlet = outlets.find((o) => o.id === order.outletId);
  const outletAddress = currentOutlet?.address || order.outletName;
  const outletPhone = currentOutlet?.phone || '0812-3344-5500';

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const itemsText = order.items
      .map((it) => `- ${it.name} (${it.quantity}x) = Rp ${(it.price * it.quantity).toLocaleString('id-ID')}`)
      .join('%0A');
    const text = `*NOTA PEMBAYARAN DIMSUM INTAN*%0A` +
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
      (order.paymentMethod === 'CASH' ? `Tunai: Rp ${(order.cashReceived || order.total).toLocaleString('id-ID')}%0AKembalian: Rp ${(order.changeAmount || 0).toLocaleString('id-ID')}%0A` : '') +
      `%0AHatur nuhun tos jajan di Dimsum Intan! 🙏`;
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl overflow-hidden my-6">
        {/* Modal Top Controls (Not in print) */}
        <div className="flex flex-col gap-2 px-6 py-4 border-b border-border-subtle bg-surface-container-low">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-sm text-brand-espresso">Nota Pembayaran Sah</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Kirim Struk Digital via WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Kirim WA</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-espresso hover:bg-brand-espresso-muted text-brand-gold rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak ({paperSize})</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-secondary hover:bg-surface-container rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Paper Size Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle/80 text-[11px]">
            <span className="text-secondary font-medium flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-primary" /> Format Kertas Kasir:
            </span>
            <div className="flex items-center bg-surface-container p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setPaperSize('80mm')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  paperSize === '80mm'
                    ? 'bg-brand-espresso text-brand-gold shadow-xs'
                    : 'text-secondary hover:text-brand-espresso'
                }`}
              >
                80mm (Standar POS)
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('58mm')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  paperSize === '58mm'
                    ? 'bg-brand-espresso text-brand-gold shadow-xs'
                    : 'text-secondary hover:text-brand-espresso'
                }`}
              >
                58mm (Mini BT)
              </button>
            </div>
          </div>
        </div>

        {/* Thermal Receipt Body (Target of @media print) */}
        <div
          className={`p-6 bg-white text-gray-900 font-mono text-xs ${
            paperSize === '58mm' ? 'receipt-58mm max-w-[280px] mx-auto text-[11px]' : 'receipt-80mm'
          }`}
          id="thermal-receipt"
        >
          {/* Header Store */}
          <div className="text-center pb-3 border-b border-dashed border-gray-300">
            <h2 className="font-serif-title font-bold text-lg tracking-wider text-black">
              DIMSUM INTAN
            </h2>
            <p className="text-[11px] font-sans text-gray-600">{order.outletName}</p>
            <p className="text-[10px] text-gray-500">{outletAddress}</p>
            <p className="text-[10px] text-gray-500">Telp: {outletPhone}</p>
          </div>

          {/* Meta order */}
          <div className="py-2.5 border-b border-dashed border-gray-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">No. Nota:</span>
              <span className="font-bold">{order.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Waktu:</span>
              <span>{new Date(order.createdAt).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kasir:</span>
              <span>{order.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tipe Pesanan:</span>
              <span className="font-bold uppercase">
                {order.orderType === 'dine-in' ? `${order.tableNumber || 'Dine-In'}` : 'Takeaway (Bungkus)'}
              </span>
            </div>
            {order.customerName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Pelanggan:</span>
                <span>{order.customerName}</span>
              </div>
            )}
            {order.status === 'VOIDED' && (
              <div className="mt-1 py-1 px-2 bg-red-100 border border-red-300 text-red-700 text-center font-bold text-[11px] rounded">
                *** NOTA DIBATALKAN (VOID) ***
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="py-3 border-b border-dashed border-gray-300 space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex justify-between font-medium">
                  <span className="truncate max-w-[200px]">{item.name}</span>
                  <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 pl-2">
                  <span>
                    {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                    {item.notes ? ` (${item.notes})` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2.5 border-b border-dashed border-gray-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp {order.subtotal.toLocaleString('id-ID')}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon:</span>
                <span>-Rp {order.discount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200">
              <span>TOTAL BAYAR:</span>
              <span>Rp {order.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="py-2.5 border-b border-dashed border-gray-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Metode Bayar:</span>
              <span className="font-bold uppercase">{order.paymentMethod}</span>
            </div>
            {order.paymentMethod === 'CASH' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Uang Tunai:</span>
                  <span>Rp {(order.cashReceived || order.total).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-500">Kembalian:</span>
                  <span>Rp {(order.changeAmount || 0).toLocaleString('id-ID')}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer Note */}
          <div className="pt-4 text-center space-y-1 text-[10px] text-gray-500">
            <p className="font-serif-title font-bold text-xs text-gray-800">
              Hatur Nuhun!
            </p>
            <p>Nikmati Kelezatan Dimsum Intan Asli</p>
            <p>Kritik & Saran: WhatsApp {outletPhone}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-container-low border-t border-border-subtle flex justify-end gap-2">
          <button
            id="btn-close-receipt"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-surface-card border border-border-strong text-xs font-bold text-brand-espresso hover:bg-surface-container cursor-pointer"
          >
            Tutup Nota
          </button>
        </div>
      </div>
    </div>
  );
};
