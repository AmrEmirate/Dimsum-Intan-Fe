import React, { useState } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  Share2,
  Smartphone,
  UtensilsCrossed,
  Receipt,
  Copy,
  Check,
  Bluetooth,
  RefreshCw,
  Usb,
} from 'lucide-react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  generateEscPosBuffer,
  printViaBluetooth,
  printViaUsb,
  isWebBluetoothSupported,
  isWebUsbSupported,
} from '../../utils/thermalPrinter';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose }) => {
  const { outlets, currentTenant, showNotification } = useApp();
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>('80mm');
  const [receiptType, setReceiptType] = useState<'customer' | 'kitchen'>('customer');
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [isPrintingBluetooth, setIsPrintingBluetooth] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const brandName = currentTenant?.name || 'POS Kasir';
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
    const text = `*NOTA PEMBAYARAN ${brandName.toUpperCase()}*%0A` +
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
      `%0ATerima kasih telah berbelanja di ${brandName}! 🙏`;
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyRawText = () => {
    const divider = paperSize === '58mm' ? '--------------------------------' : '------------------------------------------';
    const itemsText = order.items
      .map(
        (it) =>
          `${it.name}\n  ${it.quantity}x @ Rp ${it.price.toLocaleString('id-ID')} = Rp ${(it.price * it.quantity).toLocaleString('id-ID')}`
      )
      .join('\n');
    const raw = `${brandName.toUpperCase()}\n${order.outletName}\n${divider}\nNo: ${order.invoiceNumber}\nKasir: ${order.cashierName}\nWaktu: ${new Date(order.createdAt).toLocaleString('id-ID')}\n${divider}\n${itemsText}\n${divider}\nSUBTOTAL: Rp ${order.subtotal.toLocaleString('id-ID')}\n${order.discount > 0 ? `DISKON: -Rp ${order.discount.toLocaleString('id-ID')}\n` : ''}TOTAL: Rp ${order.total.toLocaleString('id-ID')}\nMETODE: ${order.paymentMethod}\n${order.paymentMethod === 'CASH' ? `TUNAI: Rp ${(order.cashReceived || order.total).toLocaleString('id-ID')}\nKEMBALI: Rp ${(order.changeAmount || 0).toLocaleString('id-ID')}\n` : ''}${divider}\nTerima kasih atas kunjungan Anda!\n`;

    navigator.clipboard.writeText(raw);
    setCopiedRaw(true);
    showNotification('Teks struk berhasil disalin!', 'success');
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handlePrintBluetooth = async () => {
    setIsPrintingBluetooth(true);
    setBluetoothStatus('Menyiapkan printer Bluetooth...');

    try {
      const buffer = generateEscPosBuffer(order, {
        brandName,
        outletName: order.outletName,
        outletAddress,
        outletPhone,
        paperSize,
        receiptType,
      });

      const res = await printViaBluetooth(buffer, (status) => {
        setBluetoothStatus(status);
      });

      if (res.success) {
        showNotification(res.message, 'success');
      } else {
        showNotification(res.message, 'error');
        // Gracefully prompt for system print if Bluetooth pairing is rejected or unavailable
        if (!isWebBluetoothSupported()) {
          handlePrint();
        }
      }
    } catch (err: any) {
      showNotification(`Gagal mencetak: ${err?.message || 'Error'}`, 'error');
    } finally {
      setIsPrintingBluetooth(false);
      setBluetoothStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-surface-card rounded-3xl border border-border-subtle shadow-2xl overflow-hidden my-4 sm:my-6 animate-in zoom-in-95 duration-150">
        {/* Modal Top Controls (Hidden in browser print) */}
        <div className="flex flex-col gap-2.5 p-4 sm:p-5 border-b border-border-subtle bg-surface-container-low select-none">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-brand-espresso truncate block">
                  {receiptType === 'customer' ? 'Nota Pembayaran Kasir' : 'Tiket Dapur / Steamer'}
                </span>
                <span className="text-[10px] text-secondary truncate block">
                  {order.invoiceNumber} • {order.outletName}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-secondary hover:text-brand-espresso hover:bg-surface-container rounded-xl cursor-pointer shrink-0 transition-colors"
              title="Tutup Nota"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector: Struk Kasir vs Tiket Dapur */}
          <div className="grid grid-cols-2 gap-1.5 bg-surface-container p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setReceiptType('customer')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                receiptType === 'customer'
                  ? 'bg-surface-card text-brand-espresso shadow-xs'
                  : 'text-secondary hover:text-brand-espresso'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Struk Pelanggan</span>
            </button>
            <button
              type="button"
              onClick={() => setReceiptType('kitchen')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                receiptType === 'kitchen'
                  ? 'bg-brand-espresso text-brand-gold shadow-xs'
                  : 'text-secondary hover:text-brand-espresso'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Tiket Steamer / Dapur</span>
            </button>
          </div>

          {/* Action Buttons: Responsive Multi-Breakpoint Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {/* Kirim WA */}
            {receiptType === 'customer' ? (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                title="Kirim Struk Digital via WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Kirim WA</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCopyRawText}
                className="flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 border border-border-strong text-brand-espresso hover:bg-surface-container rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="truncate">{copiedRaw ? 'Tersalin' : 'Salin Tiket'}</span>
              </button>
            )}

            {/* Direct Bluetooth Thermal Print (58mm / 80mm) */}
            <button
              type="button"
              onClick={handlePrintBluetooth}
              disabled={isPrintingBluetooth}
              className="flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Cetak langsung ke Thermal Mini Printer Bluetooth (ESC/POS)"
            >
              {isPrintingBluetooth ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Bluetooth className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">Cetak BT ({paperSize})</span>
            </button>

            {/* Browser / System Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 bg-brand-espresso hover:bg-black text-brand-gold rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
              title="Cetak menggunakan dialog cetak browser (PDF / USB / Printer Fisik)"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Cetak Nota</span>
            </button>
          </div>

          {/* Bluetooth Status Banner if printing */}
          {bluetoothStatus && (
            <div className="mt-1 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-[11px] font-medium flex items-center gap-2">
              <RefreshCw className="w-3 h-3 text-sky-600 animate-spin shrink-0" />
              <span className="truncate">{bluetoothStatus}</span>
            </div>
          )}

          {/* Paper Size Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle/80 text-[11px]">
            <span className="text-secondary font-medium flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-primary shrink-0" /> Format Kertas Kasir:
            </span>
            <div className="flex items-center bg-surface-container p-0.5 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setPaperSize('80mm')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
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
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
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
          className={`p-5 sm:p-6 bg-white text-gray-900 font-mono text-xs max-h-[60vh] overflow-y-auto no-scrollbar ${
            paperSize === '58mm' ? 'receipt-58mm max-w-[280px] mx-auto text-[11px]' : 'receipt-80mm'
          }`}
          id="thermal-receipt"
        >
          {receiptType === 'customer' ? (
            /* =================== STRUK PELANGGAN =================== */
            <>
              {/* Header Store */}
              <div className="text-center pb-3 border-b border-dashed border-gray-300">
                <h2 className="font-serif-title font-bold text-lg tracking-wider text-black uppercase">
                  {brandName}
                </h2>
                <p className="text-[11px] font-sans text-gray-600 font-semibold">{order.outletName}</p>
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
                  Terima Kasih!
                </p>
                <p>Selamat Menikmati Hidangan Kami</p>
                <p>Kritik & Saran Hubungi Kasir</p>
              </div>
            </>
          ) : (
            /* =================== TIKET DAPUR / KITCHEN =================== */
            <>
              <div className="text-center pb-2 border-b-2 border-black">
                <h2 className="font-bold text-base tracking-widest text-black">
                  *** TIKET DAPUR / KITCHEN ***
                </h2>
                <p className="text-[10px] text-gray-600">{order.outletName}</p>
              </div>

              <div className="py-2.5 border-b border-dashed border-gray-400">
                <div className="text-center my-1">
                  <span className="inline-block px-3 py-1 bg-black text-white font-bold text-base rounded uppercase">
                    {order.orderType === 'dine-in' ? `MEJA: ${order.tableNumber || '-'}` : 'BUNGKUS / TAKEAWAY'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] mt-2">
                  <span>No: {order.invoiceNumber}</span>
                  <span>{new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {order.customerName && (
                  <div className="text-[11px]">
                    <span className="text-gray-600">Pelanggan: </span>
                    <span className="font-bold">{order.customerName}</span>
                  </div>
                )}
              </div>

              {/* Kitchen Item Checklist */}
              <div className="py-3 border-b-2 border-black space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="border-b border-dotted border-gray-300 pb-2">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-sm text-black">
                        [ {item.quantity}x ] {item.name}
                      </span>
                      <span className="text-[10px] border border-black px-1.5 py-0.5 rounded">
                        SIAP
                      </span>
                    </div>
                    {item.notes && (
                      <div className="mt-1 text-[11px] font-bold text-red-700 bg-red-50 p-1 rounded border border-red-200">
                        * Catatan: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 text-center text-[10px] text-gray-500">
                <p className="font-bold">Total Porsi: {order.items.reduce((s, i) => s + i.quantity, 0)} Porsi</p>
                <p>Cek kelengkapan kukusan & saus sebelum disajikan</p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-container-low border-t border-border-subtle flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyRawText}
            className="flex items-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso hover:bg-surface-container transition-all cursor-pointer"
            title="Salin teks nota untuk dicetak atau dikirim manual"
          >
            {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedRaw ? 'Tersalin' : 'Salin Teks Struk'}</span>
          </button>
          <button
            id="btn-close-receipt"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-brand-espresso text-brand-gold text-xs font-bold hover:bg-[#2e211e] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Tutup Nota
          </button>
        </div>
      </div>
    </div>
  );
};
