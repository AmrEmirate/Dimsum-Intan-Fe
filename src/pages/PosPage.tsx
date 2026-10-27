import React, { useState } from 'react';
import {
  Search,
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
  CreditCard,
  RefreshCw,
  Wallet,
  ExternalLink,
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
    billingStatus,
    getActiveOutlet,
    createDuitkuPosQr,
    checkDuitkuStatus,
    simulateDuitkuPay,
    fetchWalletSummary,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Duitku POS QR states
  const [duitkuQrData, setDuitkuQrData] = useState<{
    qrString?: string;
    orderId?: string;
    paymentUrl?: string;
    isLoading?: boolean;
  } | null>(null);
  const [isCheckingDuitku, setIsCheckingDuitku] = useState<boolean>(false);
  const [isSimulatingDuitku, setIsSimulatingDuitku] = useState<boolean>(false);

  // Cart calculations
  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0);
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

  const generateDuitkuQr = async () => {
    setDuitkuQrData({ isLoading: true });
    try {
      const tempOrderId = `INV/POS-${Date.now().toString().slice(-6)}`;
      const res = await createDuitkuPosQr({
        orderId: tempOrderId,
        amount: finalTotal,
        customerName: customerName || 'Pelanggan POS',
      });
      if (res.success && res.qrString) {
        setDuitkuQrData({
          qrString: res.qrString,
          orderId: res.orderId || tempOrderId,
          paymentUrl: res.paymentUrl,
          isLoading: false,
        });
      } else {
        setDuitkuQrData(null);
        showNotification('Gagal membuat QRIS Duitku dinamis.', 'error');
      }
    } catch (err) {
      setDuitkuQrData(null);
      showNotification('Koneksi ke gateway Duitku bermasalah.', 'error');
    }
  };

  const handleOpenCheckout = async (method: PaymentMethod) => {
    if (cart.length === 0) {
      showNotification('Keranjang pesanan masih kosong!', 'warning');
      return;
    }
    setSelectedPaymentMethod(method);
    setCashGiven(finalTotal.toString());
    setIsMobileCartOpen(false);
    setIsCheckoutModalOpen(true);

    if (method === 'DUITKU_QRIS') {
      await generateDuitkuQr();
    } else {
      setDuitkuQrData(null);
    }
  };

  const handleSwitchPaymentMethod = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    if (method === 'DUITKU_QRIS' && !duitkuQrData?.qrString) {
      await generateDuitkuQr();
    }
  };

  const handleCheckDuitkuPayment = async () => {
    if (!duitkuQrData?.orderId) return;
    setIsCheckingDuitku(true);
    try {
      const res = await checkDuitkuStatus(duitkuQrData.orderId);
      if (res.success && res.status === 'SUCCESS') {
        showNotification('Pembayaran QRIS Duitku terverifikasi berhasil!', 'success');
        await handleConfirmPayment();
        await fetchWalletSummary();
      } else {
        showNotification(`Status Duitku: ${res.status || 'Menunggu Pembayaran Pelanggan'}.`, 'info');
      }
    } catch (e) {
      showNotification('Gagal memeriksa status gateway Duitku.', 'error');
    } finally {
      setIsCheckingDuitku(false);
    }
  };

  const handleSimulateDuitkuCustomerPayment = async () => {
    if (!duitkuQrData?.orderId) return;
    setIsSimulatingDuitku(true);
    try {
      const isSuccess = await simulateDuitkuPay(duitkuQrData.orderId);
      if (isSuccess) {
        showNotification('Simulasi pembayaran pelanggan berhasil diverifikasi!', 'success');
        await handleConfirmPayment();
        await fetchWalletSummary();
      } else {
        showNotification('Gagal simulasi pembayaran gateway Duitku', 'error');
      }
    } catch (err) {
      showNotification('Gagal menjalankan simulasi pembayaran.', 'error');
    } finally {
      setIsSimulatingDuitku(false);
    }
  };

  const handleConfirmPayment = async () => {
    // Validasi kuota transaksi bulanan cabang (dihitung per bulan)
    if (billingStatus) {
      const isUnlimited = billingStatus.isUnlimited || billingStatus.dailyTxLimitPerOutlet === 0;
      if (!isUnlimited) {
        const dailyLimit = (billingStatus.dailyTxLimitPerOutlet || 200) + (billingStatus.extraDailyTxLimit || 0);
        const monthlyLimit = dailyLimit * 30;
        const currentOutlet = getActiveOutlet();
        const currentOutletStat = billingStatus.outlets?.find((o) => o.id === currentOutlet?.id);
        const monthCount = (currentOutletStat ? currentOutletStat.monthOrders : billingStatus.monthOrdersCount) ?? 0;
        if (monthCount >= monthlyLimit) {
          showNotification(
            `Batas kuota transaksi bulanan cabang telah tercapai (${monthCount}/${monthlyLimit} transaksi bulan ini - dihitung dari ${dailyLimit} tx/hari)! Silakan top-up kuota transaksi atau upgrade paket di menu Langganan.`,
            'error'
          );
          return;
        }
      }
    }

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
    <div className="flex flex-col gap-4 w-full animate-in fade-in duration-200">
      {/* 2-Column Responsive Layout: Side-by-Side on Tablet & Desktop (md+), Mobile Stacked */}
      <div className="grid grid-cols-12 gap-3.5 sm:gap-4 lg:gap-5 items-start">
        {/* LEFT COLUMN: Menu Catalog (Tablet md: 7 cols, Desktop xl: 8 cols) */}
        <div className="col-span-12 md:col-span-7 xl:col-span-8 flex flex-col gap-3.5">
          {/* Subheader & Order Type Switcher */}
          <div className="bg-surface-card rounded-2xl p-3 sm:p-4 border border-border-subtle shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu dimsum, kuah, minuman..."
                className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-xl text-xs text-brand-espresso placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-brand-espresso text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mode Takeaway Badge */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container border border-border-subtle shrink-0">
              <ShoppingBag className="w-4 h-4 text-brand-espresso" />
              <span className="text-xs font-bold text-brand-espresso">Takeaway (Bungkus)</span>
            </div>
          </div>

          {/* Customer Meta Info */}
          <div className="bg-surface-card rounded-2xl p-3 sm:p-4 border border-border-subtle shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            <div className="sm:col-span-8 flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Nama Pelanggan / Catatan Pesanan
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Bpk. Rangga / Pesanan Bungkus"
                className="w-full bg-surface-container px-3 py-1.5 rounded-xl text-xs text-brand-espresso focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4 flex items-center justify-between sm:justify-end gap-2 pt-0.5 sm:pt-0">
              <div className="flex flex-col text-left sm:text-right">
                <span className="text-[10px] text-secondary font-semibold">Kitchen Batch</span>
                <span className="text-xs font-bold text-status-lunas-text">
                  Kukus & Goreng Standby
                </span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>

          {/* Sticky Categories Horizontal Pills Bar */}
          <div className="sticky top-16 z-20 -mx-3 px-3 sm:mx-0 sm:px-0 py-1.5 bg-surface-canvas/90 backdrop-blur-md">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
              {[
                { id: 'all', label: `Semua (${menuItems.length})` },
                {
                  id: 'mentai',
                  label: `Mentai (${menuItems.filter((m) => m.category === 'mentai').length})`,
                },
                {
                  id: 'kukus',
                  label: `Kukus (${menuItems.filter((m) => m.category === 'kukus').length})`,
                },
                {
                  id: 'goreng',
                  label: `Goreng (${menuItems.filter((m) => m.category === 'goreng').length})`,
                },
                {
                  id: 'minuman',
                  label: `Minuman (${menuItems.filter((m) => m.category === 'minuman').length})`,
                },
              ].map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-brand-espresso text-brand-gold shadow-xs scale-[1.02]'
                        : 'bg-surface-card text-secondary hover:text-brand-espresso border border-border-subtle active:scale-95'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu Catalog Grid: 2 Cols on Mobile, 2 on Tablet, 3 on Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
            {filteredMenus.map((menu) => {
              const isOutOfStock = !menu.isAvailable || menu.stock <= 0;
              const cartItem = cart.find((i) => i.menuId === menu.id);
              const inCartQty = cartItem?.quantity || 0;

              return (
                <div
                  key={menu.id}
                  onClick={() => !isOutOfStock && addToCart(menu)}
                  className={`group bg-surface-card rounded-2xl p-2 sm:p-3 border border-border-subtle shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden select-none ${
                    isOutOfStock
                      ? 'opacity-60 cursor-not-allowed'
                      : 'cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative w-full h-24 sm:h-32 rounded-xl overflow-hidden bg-surface-container mb-2">
                    <img
                      src={menu.image}
                      alt={menu.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {menu.isBestSeller && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-terracotta text-white text-[9px] sm:text-[10px] font-bold shadow-xs flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>Best</span>
                      </div>
                    )}
                    {inCartQty > 0 && (
                      <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-brand-espresso text-brand-gold text-[10px] font-black border border-brand-gold/40 shadow-xs animate-in zoom-in-50 duration-150">
                        {inCartQty}x di Nota
                      </div>
                    )}
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-espresso/80 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-semibold">
                      {isOutOfStock ? 'Habis' : `Sisa: ${menu.stock}`}
                    </div>
                  </div>

                  {/* Menu info */}
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-secondary">
                      {menu.category.toUpperCase()}
                    </span>
                    <h3 className="font-serif-title font-bold text-xs sm:text-sm text-brand-espresso group-hover:text-primary transition-colors line-clamp-1">
                      {menu.name}
                    </h3>
                    <p className="hidden sm:block text-[11px] text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                      {menu.description}
                    </p>
                  </div>

                  {/* Price & Add Action */}
                  <div className="mt-2 pt-1.5 sm:pt-2 border-t border-border-subtle flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-brand-espresso tabular-nums">
                      Rp {menu.price.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) addToCart(menu);
                      }}
                      disabled={isOutOfStock}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-gold text-brand-espresso flex items-center justify-center font-bold shadow-xs group-hover:bg-brand-espresso group-hover:text-brand-gold transition-colors active:scale-90 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Cart & Billing Column (Side-by-Side on Tablet md: 5 cols, Desktop xl: 4 cols) */}
        <div className="hidden md:flex md:col-span-5 xl:col-span-4 flex-col gap-4 sticky top-20">
          <div id="pos-cart-section" className="bg-surface-card rounded-2xl border border-border-subtle shadow-md overflow-hidden flex flex-col max-h-[calc(100vh-10.5rem)] lg:max-h-[calc(100vh-6.5rem)]">
            {/* Cart Header */}
            <div className="p-3.5 sm:p-4 border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                <h2 className="font-serif-title text-base font-bold text-brand-espresso">
                  Nota Pesanan
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-espresso bg-surface-card px-2.5 py-1 rounded-lg border border-border-subtle">
                  {totalCartQty} Item
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="p-1 rounded-lg text-secondary hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Kosongkan Keranjang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 divide-y divide-border-subtle/80 min-h-[180px]">
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
                  <div key={item.menuId} className="py-2.5 flex flex-col gap-1.5">
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
                      placeholder="Catatan (cth: Saus pisah, pedas)..."
                      className="text-[11px] bg-surface-container px-2.5 py-1 rounded-lg text-brand-espresso placeholder:text-secondary/70 focus:outline-none"
                    />

                    {/* Quantity Stepper */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 bg-surface-container p-0.5 rounded-lg">
                        <button
                          onClick={() => updateCartQty(item.menuId, -1)}
                          className="w-6 h-6 rounded-md bg-surface-card hover:bg-surface-container-high flex items-center justify-center text-brand-espresso transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.menuId, 1)}
                          className="w-6 h-6 rounded-md bg-surface-card hover:bg-surface-container-high flex items-center justify-center text-brand-espresso transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.menuId)}
                        className="text-[11px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Checkout Button */}
            <div className="p-3.5 sm:p-4 bg-surface-container-low border-t border-border-subtle flex flex-col gap-2.5">
              {/* Discount Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">Diskon Promo:</span>
                <div className="flex items-center gap-1">
                  {[0, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDiscountAmount(amt)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
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
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => handleOpenCheckout('DUITKU_QRIS')}
                  disabled={cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>QRIS Dinamis Duitku</span>
                  <span className="text-[10px] bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded-full font-bold">Masuk Saldo</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenCheckout('CASH')}
                    disabled={cart.length === 0}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-espresso hover:bg-brand-espresso-muted text-brand-gold text-xs font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Bayar Tunai</span>
                  </button>
                  <button
                    onClick={() => handleOpenCheckout('QRIS')}
                    disabled={cart.length === 0}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-card hover:bg-surface-container text-secondary text-xs font-bold border border-border-subtle transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QRIS Statis</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Cart Capsule for Mobile Phone (< md screen) */}
      {cart.length > 0 && (
        <div className="fixed bottom-[4.75rem] left-3 right-3 sm:left-6 sm:right-6 max-w-lg mx-auto z-30 md:hidden animate-in slide-in-from-bottom duration-200">
          <div className="bg-brand-espresso text-brand-gold rounded-2xl p-2.5 pl-4 shadow-2xl border border-brand-gold/30 flex items-center justify-between gap-3 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center gap-2.5 text-left cursor-pointer flex-1"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-gold text-brand-espresso flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                {totalCartQty}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-white/70 font-semibold leading-tight">
                  {cart.length} Jenis Menu • Buka Nota
                </span>
                <span className="font-serif-title font-bold text-base text-brand-gold leading-tight">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              Lihat Nota &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Mobile Slide-Up Cart Bottom Sheet Drawer (< md screen) */}
      {isMobileCartOpen && (
        <>
          <div
            onClick={() => setIsMobileCartOpen(false)}
            className="fixed inset-0 bg-brand-espresso/60 backdrop-blur-xs z-50 md:hidden transition-opacity cursor-pointer"
            aria-label="Tutup Nota"
          />

          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] bg-surface-card rounded-t-3xl border-t border-border-subtle shadow-2xl flex flex-col md:hidden animate-in slide-in-from-bottom duration-300">
            {/* Pull Bar Handle */}
            <div className="w-12 h-1.5 bg-border-strong rounded-full mx-auto mt-2.5 mb-1 cursor-pointer" onClick={() => setIsMobileCartOpen(false)} />

            {/* Sheet Header */}
            <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                <h3 className="font-serif-title text-base font-bold text-brand-espresso">
                  Nota Pesanan ({totalCartQty} Item)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="p-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Semua</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1.5 rounded-full text-secondary hover:bg-surface-container cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Order Details */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-border-subtle/80 space-y-3">
              {/* Order Metadata Pills */}
              <div className="pb-3 flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-brand-espresso">
                  Pesanan: Takeaway (Bungkus)
                </span>
                <span className="text-[11px] text-secondary">
                  {customerName ? `Pelanggan: ${customerName}` : 'Tamu Standar'}
                </span>
              </div>

              {cart.map((item) => (
                <div key={item.menuId} className="pt-3 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-brand-espresso">{item.name}</h4>
                      <span className="text-[11px] text-secondary">
                        Rp {item.price.toLocaleString('id-ID')} / porsi
                      </span>
                    </div>
                    <span className="text-xs font-bold text-brand-espresso tabular-nums">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Notes input */}
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => updateCartNotes(item.menuId, e.target.value)}
                    placeholder="Catatan pesanan (cth: tidak pedas, saus pisah)..."
                    className="w-full text-xs bg-surface-container px-3 py-1.5 rounded-xl text-brand-espresso placeholder:text-secondary/70 focus:outline-none"
                  />

                  {/* Stepper & Trash */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 bg-surface-container px-2 py-1 rounded-xl">
                      <button
                        onClick={() => updateCartQty(item.menuId, -1)}
                        className="w-7 h-7 rounded-lg bg-surface-card flex items-center justify-center font-bold text-brand-espresso shadow-xs active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.menuId, 1)}
                        className="w-7 h-7 rounded-lg bg-surface-card flex items-center justify-center font-bold text-brand-espresso shadow-xs active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.menuId)}
                      className="text-xs text-red-500 font-semibold px-2 py-1 hover:bg-red-50 rounded-lg"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Checkout Actions inside Bottom Sheet */}
            <div className="p-4 safe-area-pb pb-6 bg-surface-container-low border-t border-border-subtle flex flex-col gap-3">
              {/* Promo discounts */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary font-medium">Diskon Promo:</span>
                <div className="flex items-center gap-1.5">
                  {[0, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDiscountAmount(amt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        discountAmount === amt
                          ? 'bg-brand-espresso text-brand-gold'
                          : 'bg-surface-card text-secondary border border-border-subtle'
                      }`}
                    >
                      {amt === 0 ? 'Normal' : `-${amt / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtotal and Total */}
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-bold text-sm text-brand-espresso">Total Bayar:</span>
                <span className="font-serif-title font-bold text-2xl text-brand-espresso tabular-nums">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Pay Tunai / QRIS buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenCheckout('DUITKU_QRIS')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>QRIS Duitku Dinamis</span>
                  <span className="text-[10px] bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded-full font-bold">Masuk Saldo</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCheckout('CASH')}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-brand-espresso text-brand-gold text-xs font-bold shadow-md active:scale-95 transition-all"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Bayar Tunai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCheckout('QRIS')}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-surface-card border border-border-subtle text-secondary text-xs font-bold shadow-sm active:scale-95 transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QRIS Statis</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Checkout Dialog Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
              Konfirmasi Pembayaran
            </h3>
            <p className="text-xs text-secondary mt-1">
              Pilih metode transaksi pelanggan:
            </p>

            {/* Payment Method Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1.5 my-3 p-1 rounded-2xl bg-surface-container-low border border-border-subtle">
              <button
                type="button"
                onClick={() => handleSwitchPaymentMethod('DUITKU_QRIS')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center ${
                  selectedPaymentMethod === 'DUITKU_QRIS'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-secondary hover:text-brand-espresso'
                }`}
              >
                QRIS Duitku
              </button>
              <button
                type="button"
                onClick={() => handleSwitchPaymentMethod('CASH')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center ${
                  selectedPaymentMethod === 'CASH'
                    ? 'bg-brand-espresso text-brand-gold shadow-sm'
                    : 'text-secondary hover:text-brand-espresso'
                }`}
              >
                Tunai (Cash)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchPaymentMethod('QRIS')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center ${
                  selectedPaymentMethod === 'QRIS'
                    ? 'bg-brand-gold text-brand-espresso shadow-sm'
                    : 'text-secondary hover:text-brand-espresso'
                }`}
              >
                QRIS Statis
              </button>
            </div>

            <div className="my-3 p-3.5 rounded-2xl bg-surface-container-low text-center">
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
                <div className="grid grid-cols-5 gap-1.5">
                  {[finalTotal, 20000, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashGiven(amt.toString())}
                      className="py-1.5 rounded-lg bg-surface-container hover:bg-brand-gold/20 text-[11px] font-bold text-brand-espresso transition-colors cursor-pointer border border-border-subtle text-center truncate"
                    >
                      {amt === finalTotal ? 'Uang Pas' : `Rp ${amt / 1000}k`}
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
            ) : selectedPaymentMethod === 'DUITKU_QRIS' ? (
              /* Duitku Dynamic QRIS */
              <div className="flex flex-col items-center py-2 space-y-3">
                {duitkuQrData?.isLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                    <p className="text-xs text-secondary font-medium">Menyiapkan QRIS Duitku Dinamis...</p>
                  </div>
                ) : duitkuQrData?.qrString ? (
                  <>
                    <div className="p-3 bg-white rounded-2xl border-2 border-amber-500/80 shadow-md">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          duitkuQrData.qrString
                        )}`}
                        alt="QRIS Dinamis Duitku"
                        className="w-40 h-40 object-contain"
                      />
                    </div>

                    <div className="flex flex-col items-center text-center px-2">
                      <span className="text-[11px] font-mono font-bold text-brand-espresso">
                        Order Ref: {duitkuQrData.orderId}
                      </span>
                      <span className="text-[10px] text-secondary mt-0.5">
                        Pindai via BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, Dana
                      </span>
                    </div>

                    <div className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-[11px] text-center font-medium">
                      💡 Dana penjualan otomatis masuk ke <strong>Dompet Saldo POS</strong> secara real-time.
                    </div>

                    {/* Duitku actions */}
                    <div className="w-full grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCheckDuitkuPayment}
                        disabled={isCheckingDuitku}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-subtle text-xs font-bold text-brand-espresso transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDuitku ? 'animate-spin' : ''}`} />
                        <span>Cek Status</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSimulateDuitkuCustomerPayment}
                        disabled={isSimulatingDuitku}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isSimulatingDuitku ? 'Memproses...' : 'Simulasi Bayar'}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-6 flex flex-col items-center gap-2">
                    <p className="text-xs text-red-500 font-semibold">Gagal memuat QRIS Duitku.</p>
                    <button
                      type="button"
                      onClick={generateDuitkuQr}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
                    >
                      Coba Buat Ulang
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Static QRIS */
              <div className="flex flex-col items-center py-2 space-y-3">
                <div className="p-4 bg-white rounded-2xl border-2 border-brand-espresso shadow-xs">
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
