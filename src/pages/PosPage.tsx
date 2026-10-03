import React, { useState } from 'react';
import {
  Search,
  Utensils,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Banknote,
  Receipt,
  Percent,
  X,
  CheckCircle,
  Clock,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MenuCategory, MenuItem, PaymentMethod, Order } from '../types';
import { ReceiptModal } from '../components/common/ReceiptModal';

export const PosPage: React.FC = () => {
  const {
    menuItems,
    cart,
    addToCart,
    updateCartQty,
    updateCartNotes,
    removeFromCart,
    clearCart,
    orderType,
    setOrderType,
    tableNumber,
    setTableNumber,
    customerName,
    setCustomerName,
    processCheckout,
    activeShift,
    showNotification,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Filter menus
  const filteredMenus = menuItems.filter((menu) => {
    const matchesCat = selectedCategory === 'all' || menu.category === selectedCategory;
    const matchesSearch =
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      menu.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenCheckout = (method: PaymentMethod) => {
    if (cart.length === 0) {
      showNotification('Keranjang pesanan masih kosong!', 'warning');
      return;
    }
    setSelectedPaymentMethod(method);
    setCashGiven(finalTotal.toString());
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    const cashVal = parseFloat(cashGiven) || finalTotal;
    if (selectedPaymentMethod === 'CASH' && cashVal < finalTotal) {
      showNotification('Uang yang diterima kurang dari total pembayaran!', 'error');
      return;
    }

    const order = await processCheckout(selectedPaymentMethod, cashVal, discountAmount);
    setIsCheckoutModalOpen(false);
    setDiscountAmount(0);
    if (order) {
      setCompletedOrder(order);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full animate-in fade-in duration-200">
      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Menu Catalog (8 Cols) */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-4">
          {/* Subheader & Order Type Switcher */}
          <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu dimsum, kuah, minuman..."
                className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-xl text-xs text-brand-espresso placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Dine-In vs Takeaway Toggle */}
            <div className="flex items-center bg-surface-container p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setOrderType('dine-in')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  orderType === 'dine-in'
                    ? 'bg-brand-espresso text-brand-gold shadow-xs'
                    : 'text-secondary hover:text-brand-espresso'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Makan di Tempat</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  orderType === 'takeaway'
                    ? 'bg-brand-espresso text-brand-gold shadow-xs'
                    : 'text-secondary hover:text-brand-espresso'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Bungkus (Takeaway)</span>
              </button>
            </div>
          </div>

          {/* Table & Customer Meta Info (Dine-in metadata) */}
          <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {orderType === 'dine-in' ? (
              <div className="md:col-span-4 flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Meja / Area
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full bg-surface-container px-3 py-1.5 rounded-xl text-xs font-bold text-brand-espresso focus:outline-none"
                  placeholder="Contoh: Meja 04"
                />
              </div>
            ) : null}

            <div
              className={`${
                orderType === 'dine-in' ? 'md:col-span-5' : 'md:col-span-8'
              } flex flex-col gap-1`}
            >
              <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Nama Pelanggan / Catatan Meja
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Bpk. Rangga (4 Orang)"
                className="w-full bg-surface-container px-3 py-1.5 rounded-xl text-xs text-brand-espresso focus:outline-none"
              />
            </div>

            <div
              className={`${
                orderType === 'dine-in' ? 'md:col-span-3' : 'md:col-span-4'
              } flex items-center justify-end gap-2 pt-1 md:pt-0`}
            >
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-secondary font-semibold">Kitchen Batch</span>
                <span className="text-xs font-bold text-status-lunas-text">
                  Kukus & Goreng Standby
                </span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>

          {/* Categories Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: `Semua Menu (${menuItems.length})` },
              {
                id: 'mentai',
                label: `Dimsum Mentai (${menuItems.filter((m) => m.category === 'mentai').length})`,
              },
              {
                id: 'kukus',
                label: `Dimsum Kukus (${menuItems.filter((m) => m.category === 'kukus').length})`,
              },
              {
                id: 'goreng',
                label: `Dimsum Goreng (${menuItems.filter((m) => m.category === 'goreng').length})`,
              },
              {
                id: 'minuman',
                label: `Minuman & Ekstra (${menuItems.filter((m) => m.category === 'minuman').length})`,
              },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    active
                      ? 'bg-brand-espresso text-brand-gold shadow-xs'
                      : 'bg-surface-card text-secondary hover:text-brand-espresso border border-border-subtle'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Menu Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredMenus.map((menu) => {
              const isOutOfStock = !menu.isAvailable || menu.stock <= 0;
              return (
                <div
                  key={menu.id}
                  onClick={() => !isOutOfStock && addToCart(menu)}
                  className={`group bg-surface-card rounded-2xl p-3 border border-border-subtle shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden select-none ${
                    isOutOfStock
                      ? 'opacity-60 cursor-not-allowed'
                      : 'cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-surface-container mb-2.5">
                    <img
                      src={menu.image}
                      alt={menu.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {menu.isBestSeller && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brand-terracotta text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        <span>Best Seller</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-brand-espresso/80 backdrop-blur-xs text-white text-[10px] font-semibold">
                      {isOutOfStock ? 'Habis' : `Sisa: ${menu.stock} Porsi`}
                    </div>
                  </div>

                  {/* Menu info */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                      {menu.category.toUpperCase()} SERIES
                    </span>
                    <h3 className="font-serif-title font-bold text-sm text-brand-espresso group-hover:text-primary transition-colors line-clamp-1">
                      {menu.name}
                    </h3>
                    <p className="text-[11px] text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                      {menu.description}
                    </p>
                  </div>

                  {/* Price & Add Action */}
                  <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between">
                    <span className="font-bold text-sm text-brand-espresso tabular-nums">
                      Rp {menu.price.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) addToCart(menu);
                      }}
                      disabled={isOutOfStock}
                      className="w-8 h-8 rounded-full bg-brand-gold text-brand-espresso flex items-center justify-center font-bold shadow-xs group-hover:bg-brand-espresso group-hover:text-brand-gold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Cart & Billing Column (4 Cols) */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-4 sticky top-20">
          <div id="pos-cart-section" className="bg-surface-card rounded-2xl border border-border-subtle shadow-md overflow-hidden flex flex-col">
            {/* Cart Header */}
            <div className="p-4 border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                <h2 className="font-serif-title text-base font-bold text-brand-espresso">
                  Nota Pesanan
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-espresso bg-surface-card px-2.5 py-1 rounded-lg border border-border-subtle">
                  {cart.reduce((s, i) => s + i.quantity, 0)} Item
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="p-1 rounded-lg text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Kosongkan Keranjang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-4 max-h-[380px] overflow-y-auto divide-y divide-border-subtle/80">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-secondary flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-secondary">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium">Keranjang masih kosong</span>
                  <span className="text-[11px] text-secondary/70">
                    Klik item di katalog untuk menambahkan pesanan
                  </span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.menuId} className="py-3 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col pr-2">
                        <span className="text-xs font-bold text-brand-espresso leading-snug">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-secondary">
                          Rp {item.price.toLocaleString('id-ID')} / porsi
                        </span>
                      </div>
                      <span className="text-xs font-bold text-brand-espresso tabular-nums whitespace-nowrap">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Notes Input */}
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => updateCartNotes(item.menuId, e.target.value)}
                      placeholder="Catatan (cth: Saus terpisah, pedas)..."
                      className="text-[11px] bg-surface-container px-2.5 py-1 rounded-lg text-brand-espresso placeholder:text-secondary/70 focus:outline-none"
                    />

                    {/* Quantity Stepper */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 bg-surface-container p-0.5 rounded-lg">
                        <button
                          onClick={() => updateCartQty(item.menuId, -1)}
                          className="w-6 h-6 rounded-md bg-surface-card hover:bg-surface-container-high flex items-center justify-center text-brand-espresso transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.menuId, 1)}
                          className="w-6 h-6 rounded-md bg-surface-card hover:bg-surface-container-high flex items-center justify-center text-brand-espresso transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.menuId)}
                        className="text-[11px] text-red-500 hover:text-red-700 font-semibold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Checkout Button */}
            <div className="p-4 bg-surface-container-low border-t border-border-subtle flex flex-col gap-3">
              {/* Discount Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">Diskon Promo:</span>
                <div className="flex items-center gap-1">
                  {[0, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDiscountAmount(amt)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        discountAmount === amt
                          ? 'bg-brand-espresso text-brand-gold'
                          : 'bg-surface-card text-secondary hover:bg-surface-container'
                      }`}
                    >
                      {amt === 0 ? '0' : `-${amt / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtotal & Total */}
              <div className="space-y-1 text-xs border-t border-border-subtle/80 pt-2">
                <div className="flex justify-between text-secondary">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Diskon:</span>
                    <span className="tabular-nums">-Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-bold text-sm text-brand-espresso">Total Bayar:</span>
                  <span className="font-serif-title font-bold text-xl text-brand-espresso tabular-nums">
                    Rp {finalTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Payment Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleOpenCheckout('CASH')}
                  disabled={cart.length === 0}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-brand-espresso hover:bg-brand-espresso-muted text-brand-gold text-xs font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Bayar Tunai</span>
                </button>
                <button
                  onClick={() => handleOpenCheckout('QRIS')}
                  disabled={cart.length === 0}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Bayar QRIS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Cart Bar for Mobile & Tablet (xl:hidden) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 lg:left-72 right-0 z-30 p-3 bg-surface-card/95 backdrop-blur-md border-t border-border-subtle shadow-2xl xl:hidden animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between gap-3 max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('pos-cart-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col text-left cursor-pointer"
            >
              <span className="text-[11px] font-bold text-secondary flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-primary" />
                {cart.reduce((s, i) => s + i.quantity, 0)} Porsi • Lihat Nota
              </span>
              <span className="font-serif-title font-bold text-base text-brand-espresso">
                Rp {finalTotal.toLocaleString('id-ID')}
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenCheckout('CASH')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-brand-espresso text-brand-gold text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                <span>Tunai</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenCheckout('QRIS')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-brand-gold text-brand-espresso text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Dialog Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative">
            <button
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
              Konfirmasi Pembayaran ({selectedPaymentMethod})
            </h3>
            <p className="text-xs text-secondary mt-1">
              Total tagihan yang harus dibayar:
            </p>

            <div className="my-4 p-4 rounded-2xl bg-surface-container-low text-center">
              <span className="text-xs text-secondary font-semibold">Total Tagihan</span>
              <div className="font-serif-title text-2xl font-bold text-brand-espresso mt-0.5">
                Rp {finalTotal.toLocaleString('id-ID')}
              </div>
            </div>

            {selectedPaymentMethod === 'CASH' ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brand-espresso">
                    Nominal Tunai Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className="w-full p-3 rounded-xl bg-surface-container text-base font-bold text-brand-espresso focus:outline-none"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[finalTotal, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashGiven(amt.toString())}
                      className="py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-bold text-brand-espresso"
                    >
                      {amt === finalTotal ? 'Pas' : `Rp ${amt / 1000}k`}
                    </button>
                  ))}
                </div>

                {/* Change preview */}
                <div className="p-3 rounded-xl bg-surface-container flex justify-between items-center text-xs">
                  <span className="font-semibold text-secondary">Uang Kembalian:</span>
                  <span className="font-bold text-sm text-brand-espresso">
                    Rp {Math.max(0, (parseFloat(cashGiven) || 0) - finalTotal).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-2 space-y-3">
                <div className="p-4 bg-white rounded-2xl border-2 border-brand-espresso shadow-xs">
                  {/* QRIS Pembayaran POS */}
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021226580016ID.CO.DIMSUMINTAN.POS015204581253033605802ID5912Dimsum+Intan6007Bandung62070703A0163046D5E"
                    alt="QRIS Resmi Dimsum Intan"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <span className="text-xs text-secondary text-center max-w-xs">
                  Pindai QRIS menggunakan BCA, Mandiri, GoPay, OVO, atau ShopeePay
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> Menunggu Scan Pelanggan
                </span>
              </div>
            )}

            {/* Submit checkout */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso hover:bg-surface-container"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Selesaikan Transaksi & Cetak Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal after successful checkout */}
      <ReceiptModal
        order={completedOrder}
        isOpen={!!completedOrder}
        onClose={() => setCompletedOrder(null)}
      />
    </div>
  );
};
