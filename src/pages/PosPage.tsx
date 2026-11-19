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
  Ban,
  AlertTriangle,
  Timer,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MenuCategory, MenuItem, PaymentMethod, Order } from '../types';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { CloseShiftModal } from '../components/common/CloseShiftModal';
import { RupiahInput } from '../components/common/RupiahInput';

export const PosPage: React.FC = () => {
  const {
    menuItems,
    menuRecipes,
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
    fetchWalletSummary,
    setCurrentView,
  } = useApp();

  const isShiftActive = activeShift?.status === 'ACTIVE';

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [discountType, setDiscountType] = useState<'RP' | 'PERCENT'>('RP');
  const [discountInput, setDiscountInput] = useState<string>('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState<boolean>(false);
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState<boolean>(false);

  // Duitku / Midtrans POS QR states
  const [duitkuQrData, setDuitkuQrData] = useState<{
    qrString?: string;
    orderId?: string;
    paymentUrl?: string;
    providerName?: string;
    gateway?: string;
    isLoading?: boolean;
  } | null>(null);
  const [isCheckingDuitku, setIsCheckingDuitku] = useState<boolean>(false);

  // Cart calculations
  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const parsedDiscountVal = Math.max(0, parseFloat(discountInput) || 0);
  const discountAmount =
    discountType === 'PERCENT'
      ? Math.min(subtotal, Math.round((subtotal * Math.min(100, parsedDiscountVal)) / 100))
      : Math.min(subtotal, parsedDiscountVal);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Filter menus: hanya tampilkan menu yang sudah memiliki konfigurasi BOM (resep bahan baku)
  const configuredBomMenuIds = new Set(menuRecipes.map((r) => r.menuId));
  const filteredMenus = menuItems.filter((menu) => {
    const hasBom = configuredBomMenuIds.has(menu.id);
    if (!hasBom) return false;
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
      const res: any = await createDuitkuPosQr({
        orderId: tempOrderId,
        amount: finalTotal,
        customerName: customerName || 'Pelanggan POS',
      });
      const data = res?.data || res;
      if (res?.success && (data?.qrString || data?.paymentUrl)) {
        setDuitkuQrData({
          qrString: data.qrString,
          orderId: data.merchantOrderId || data.orderId || tempOrderId,
          paymentUrl: data.paymentUrl,
          providerName: data.providerName || 'QRIS Dinamis Toko',
          gateway: data.gateway,
          isLoading: false,
        });
      } else {
        setDuitkuQrData(null);
        showNotification(res?.message || 'Gagal membuat QRIS dinamis.', 'error');
      }
    } catch (err) {
      setDuitkuQrData(null);
      showNotification('Koneksi ke gateway pembayaran bermasalah.', 'error');
    }
  };

  const handleOpenCheckout = (method: PaymentMethod) => {
    if (!isShiftActive) {
      showNotification('Shift kasir belum dibuka atau sudah ditutup! Buka sesi shift kasir terlebih dahulu.', 'warning');
      return;
    }
    if (cart.length === 0) {
      showNotification('Keranjang pesanan masih kosong!', 'warning');
      return;
    }
    setSelectedPaymentMethod(method);
    setCashGiven(finalTotal.toString());
    setIsMobileCartOpen(false);
    setIsCheckoutModalOpen(true);
    if (method === 'DUITKU_QRIS') {
      generateDuitkuQr();
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

  const handleConfirmPayment = async () => {
    // Validasi kuota transaksi bulanan cabang (murni per bulan, tanpa batas harian)
    if (billingStatus) {
      const currentOutlet = getActiveOutlet();
      const currentOutletStat = billingStatus.outlets?.find((o) => o.id === currentOutlet?.id);
      const isOutletUnlimited = currentOutletStat
        ? Boolean(currentOutletStat.isUnlimited)
        : Boolean(billingStatus.isUnlimited || billingStatus.monthlyTxLimitPerOutlet === 0);
      if (!isOutletUnlimited) {
        const monthlyLimit =
          currentOutletStat?.monthlyLimit ??
          billingStatus.effectiveMonthlyTxLimit ??
          1500;
        const monthCount = (currentOutletStat ? currentOutletStat.monthOrders : billingStatus.monthOrdersCount) ?? 0;
        if (monthCount >= monthlyLimit) {
          showNotification(
            `Batas kuota transaksi bulanan cabang telah tercapai (${monthCount}/${monthlyLimit.toLocaleString('id-ID')} transaksi bulan ini)! Silakan upgrade paket di menu Langganan.`,
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
    setDiscountInput('');
    setDuitkuQrData(null);
    if (order) {
      setCompletedOrder(order);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in duration-200">
      {/* Shift Kasir Guard Banner (wajib buka shift sebelum transaksi / setelah tutup shift) */}
      {!isShiftActive && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Timer className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-950">
                Sesi Shift Kasir Belum Dibuka / Sudah Ditutup
              </p>
              <p className="text-[11px] sm:text-xs text-amber-800">
                Kasir wajib membuka sesi shift terlebih dahulu sebelum dapat menginput pesanan dan memproses pembayaran.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('sesi-shift-kasir')}
            className="px-4 py-2.5 rounded-xl bg-brand-espresso hover:bg-[#2e211e] text-brand-gold text-xs font-bold shadow-xs cursor-pointer shrink-0 min-h-[40px]"
          >
            Buka Sesi Shift Kasir
          </button>
        </div>
      )}

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

          {/* Customer Meta Info & Kitchen Batch Bar (Responsive, Anti-Collision) */}
          <div className="bg-surface-card rounded-2xl p-3 sm:p-4 border border-border-subtle shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex-1 flex flex-col gap-1 min-w-0">
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

            <div className="flex items-center justify-between xl:justify-end gap-3 pt-1.5 xl:pt-0 border-t xl:border-t-0 border-border-subtle/60 shrink-0">
              <div className="flex flex-col text-left xl:text-right">
                <span className="text-[10px] text-secondary font-semibold">Kitchen Batch</span>
                <span className="text-xs font-bold text-status-lunas-text whitespace-nowrap">
                  Kukus & Goreng Standby
                </span>
              </div>
              {activeShift && activeShift.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModalOpen(true)}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-surface-card hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                  title="Rekonsiliasi Kas Laci & Tutup Shift"
                >
                  <Timer className="w-3.5 h-3.5 text-brand-terracotta shrink-0" />
                  <span>Tutup Shift</span>
                </button>
              )}
            </div>
          </div>

          {/* Sticky Categories Horizontal Pills Bar */}
          <div className="sticky top-16 z-20 -mx-3 px-3 sm:mx-0 sm:px-0 py-1.5 bg-surface-canvas/90 backdrop-blur-md">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
              {[
                { id: 'all', label: `Semua (${menuItems.length})` },
                ...Array.from(new Set(menuItems.map((m) => m.category).filter(Boolean))).map((cat) => ({
                  id: cat,
                  label: `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${
                    menuItems.filter((m) => m.category === cat).length
                  })`,
                })),
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
              const isLowStock = !isOutOfStock && menu.stock <= 5;
              const isWarningStock = !isOutOfStock && menu.stock > 5 && menu.stock <= 10;
              const cartItem = cart.find((i) => i.menuId === menu.id);
              const inCartQty = cartItem?.quantity || 0;

              return (
                <div
                  key={menu.id}
                  onClick={() => {
                    if (!isShiftActive) {
                      showNotification('Buka sesi shift kasir terlebih dahulu sebelum input pesanan!', 'warning');
                      return;
                    }
                    if (!isOutOfStock) addToCart(menu);
                  }}
                  className={`group bg-surface-card rounded-2xl p-2 sm:p-3 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden select-none ${
                    isOutOfStock
                      ? 'opacity-60 cursor-not-allowed border-dashed border-red-300 bg-red-50/10'
                      : isLowStock
                      ? 'border-amber-400/80 hover:border-amber-500 cursor-pointer active:scale-[0.98]'
                      : 'border-border-subtle hover:border-border-strong cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative w-full h-24 sm:h-32 rounded-xl overflow-hidden bg-surface-container mb-2">
                    <img
                      src={menu.image}
                      alt={menu.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        isOutOfStock ? 'grayscale contrast-75' : ''
                      }`}
                    />
                    {menu.isBestSeller && !isOutOfStock && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-terracotta text-white text-[9px] sm:text-[10px] font-bold shadow-xs flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>Best</span>
                      </div>
                    )}
                    {inCartQty > 0 && (
                      <div className="absolute top-1.5 right-1.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-espresso text-brand-gold text-[9px] sm:text-[10px] font-black border border-brand-gold/40 shadow-xs animate-in zoom-in-50 duration-150">
                        {inCartQty}x
                      </div>
                    )}

                    {/* Low Stock & Out of Stock Badges (Stitch MCP Architecture) */}
                    {isOutOfStock ? (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-2 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-1">
                          <Ban className="w-3 h-3" />
                          <span>Habis</span>
                        </span>
                      </div>
                    ) : isLowStock ? (
                      <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black shadow-md flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>Sisa {menu.stock}</span>
                      </div>
                    ) : isWarningStock ? (
                      <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[9px] sm:text-[10px] font-bold shadow-xs">
                        <span>Stok: {menu.stock}</span>
                      </div>
                    ) : (
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-espresso/80 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-semibold">
                        Sisa: {menu.stock}
                      </div>
                    )}
                  </div>

                  {/* Menu info: 2 lines to prevent cut off titles */}
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-secondary truncate">
                      {menu.category.toUpperCase()}
                    </span>
                    <h3
                      className={`font-serif-title font-bold text-xs sm:text-sm text-brand-espresso group-hover:text-primary transition-colors line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] leading-snug ${
                        isOutOfStock ? 'line-through text-secondary' : ''
                      }`}
                      title={menu.name}
                    >
                      {menu.name}
                    </h3>
                    <p className="hidden sm:block text-[11px] text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                      {menu.description}
                    </p>
                  </div>

                  {/* Price & Add Action (Ergonomic Touch Targets) */}
                  <div className="mt-2 pt-1.5 sm:pt-2 border-t border-border-subtle flex items-center justify-between gap-1">
                    <span className="font-bold text-xs sm:text-sm text-brand-espresso tabular-nums truncate">
                      Rp {menu.price.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isShiftActive) {
                          showNotification('Buka sesi shift kasir terlebih dahulu sebelum input pesanan!', 'warning');
                          return;
                        }
                        if (!isOutOfStock) addToCart(menu);
                      }}
                      disabled={isOutOfStock || !isShiftActive}
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-xs transition-colors active:scale-90 cursor-pointer shrink-0 ${
                        isOutOfStock
                          ? 'bg-surface-muted text-secondary cursor-not-allowed'
                          : 'bg-brand-gold text-brand-espresso group-hover:bg-brand-espresso group-hover:text-brand-gold'
                      }`}
                      title={isOutOfStock ? 'Stok Habis' : `Tambah ${menu.name} ke Nota`}
                    >
                      {isOutOfStock ? (
                        <Ban className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
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
                    type="button"
                    onClick={() => setIsClearCartModalOpen(true)}
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
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-brand-espresso leading-snug break-words">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-secondary">
                          Rp {item.price.toLocaleString('id-ID')} / porsi
                        </span>
                      </div>
                      <span className="text-xs font-bold text-brand-espresso tabular-nums whitespace-nowrap shrink-0">
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
              {/* Discount Selector (Nominal Rp atau Persentase %) */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-secondary">Diskon Promo:</span>
                  <div className="inline-flex rounded-lg bg-surface-card border border-border-subtle p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('RP');
                        setDiscountInput('');
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                        discountType === 'RP'
                          ? 'bg-brand-espresso text-brand-gold'
                          : 'text-secondary hover:text-brand-espresso'
                      }`}
                    >
                      Rp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('PERCENT');
                        setDiscountInput('');
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                        discountType === 'PERCENT'
                          ? 'bg-brand-espresso text-brand-gold'
                          : 'text-secondary hover:text-brand-espresso'
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={discountInput}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
                      setDiscountInput(clean);
                    }}
                    placeholder="0"
                    className="w-24 px-2 py-1 rounded-lg bg-surface-card border border-border-subtle text-xs font-bold text-brand-espresso focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  />
                  <div className="flex items-center gap-1 flex-wrap">
                    {(discountType === 'PERCENT' ? [0, 10, 20] : [0, 5000, 10000]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDiscountInput(String(val))}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                          parsedDiscountVal === val
                            ? 'bg-brand-espresso text-brand-gold'
                            : 'bg-surface-card text-secondary hover:bg-surface-container border border-border-subtle'
                        }`}
                      >
                        {val === 0 ? '0' : discountType === 'PERCENT' ? `${val}%` : `-${val / 1000}k`}
                      </button>
                    ))}
                  </div>
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
                    <span>Diskon{discountType === 'PERCENT' ? ` (${Math.min(100, parsedDiscountVal)}%)` : ''}:</span>
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

              {/* Payment Action Buttons (3 Metode: Tunai, QRIS Toko, QRIS Aplikasi) */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenCheckout('CASH')}
                  disabled={cart.length === 0}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl bg-brand-espresso hover:bg-[#2e211e] text-brand-gold text-[11px] font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer min-h-[48px]"
                >
                  <Banknote className="w-4 h-4 shrink-0" />
                  <span className="truncate">Tunai</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCheckout('QRIS')}
                  disabled={cart.length === 0}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 text-[11px] font-black shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer min-h-[48px]"
                >
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span className="truncate">QRIS Toko</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCheckout('DUITKU_QRIS')}
                  disabled={cart.length === 0}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer min-h-[48px]"
                >
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span className="truncate">QRIS Aplikasi</span>
                </button>
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
                    type="button"
                    onClick={() => setIsClearCartModalOpen(true)}
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
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-brand-espresso leading-snug break-words">{item.name}</h4>
                      <span className="text-[11px] text-secondary">
                        Rp {item.price.toLocaleString('id-ID')} / porsi
                      </span>
                    </div>
                    <span className="text-xs font-bold text-brand-espresso tabular-nums whitespace-nowrap shrink-0">
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
              {/* Promo discounts (Rp / %) */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-secondary font-medium">Diskon Promo:</span>
                  <div className="inline-flex rounded-lg bg-surface-card border border-border-subtle p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('RP');
                        setDiscountInput('');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        discountType === 'RP'
                          ? 'bg-brand-espresso text-brand-gold'
                          : 'text-secondary'
                      }`}
                    >
                      Rp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('PERCENT');
                        setDiscountInput('');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        discountType === 'PERCENT'
                          ? 'bg-brand-espresso text-brand-gold'
                          : 'text-secondary'
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={discountInput}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
                      setDiscountInput(clean);
                    }}
                    placeholder="0"
                    className="w-24 px-2.5 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-xs font-bold text-brand-espresso"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(discountType === 'PERCENT' ? [0, 10, 20] : [0, 5000, 10000]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDiscountInput(String(val))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          parsedDiscountVal === val
                            ? 'bg-brand-espresso text-brand-gold'
                            : 'bg-surface-card text-secondary border border-border-subtle'
                        }`}
                      >
                        {val === 0 ? 'Normal' : discountType === 'PERCENT' ? `${val}%` : `-${val / 1000}k`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subtotal and Total */}
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-bold text-sm text-brand-espresso">Total Bayar:</span>
                <span className="font-serif-title font-bold text-2xl text-brand-espresso tabular-nums">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Pay Tunai / QRIS Toko / QRIS Aplikasi buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenCheckout('CASH')}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-brand-espresso text-brand-gold text-[11px] font-bold shadow-md active:scale-95 transition-all cursor-pointer min-h-[48px]"
                >
                  <Banknote className="w-4 h-4 shrink-0" />
                  <span>Tunai</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCheckout('QRIS')}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-[11px] font-black shadow-md active:scale-95 transition-all cursor-pointer min-h-[48px]"
                >
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span>QRIS Toko</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCheckout('DUITKU_QRIS')}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-emerald-600 text-white text-[11px] font-bold shadow-md active:scale-95 transition-all cursor-pointer min-h-[48px]"
                >
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span>QRIS Aplikasi</span>
                </button>
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

            {/* Payment Method Switcher Tabs: Tunai, QRIS Toko, QRIS Aplikasi */}
            <div className="grid grid-cols-3 gap-1.5 my-3 p-1 rounded-2xl bg-surface-container-low border border-border-subtle">
              <button
                type="button"
                onClick={() => handleSwitchPaymentMethod('CASH')}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer min-h-[48px] ${
                  selectedPaymentMethod === 'CASH'
                    ? 'bg-brand-espresso text-brand-gold shadow-sm'
                    : 'text-secondary hover:text-brand-espresso'
                }`}
              >
                <Banknote className="w-4 h-4 shrink-0" />
                <span>Tunai</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchPaymentMethod('QRIS')}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer min-h-[48px] ${
                  selectedPaymentMethod === 'QRIS'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-sm'
                    : 'text-secondary hover:text-brand-espresso'
                }`}
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <span>QRIS Toko</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchPaymentMethod('DUITKU_QRIS')}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer min-h-[48px] ${
                  selectedPaymentMethod === 'DUITKU_QRIS'
                    ? 'bg-emerald-600 text-white font-black shadow-sm'
                    : 'text-secondary hover:text-brand-espresso'
                }`}
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <span>QRIS Aplikasi</span>
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
                <RupiahInput
                  label="Nominal Tunai Diterima"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="Contoh: 50.000"
                />

                {/* Quick Cash Buttons (Responsive 3 cols on mobile, 5 cols on sm+) */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[finalTotal, 20000, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashGiven(amt.toString())}
                      className="py-1.5 rounded-lg bg-surface-container hover:bg-brand-gold/20 text-[11px] font-bold text-brand-espresso transition-colors cursor-pointer border border-border-subtle text-center truncate min-h-[36px]"
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
              /* QRIS Aplikasi (Payment Gateway Dinamis) */
              <div className="flex flex-col items-center py-2 space-y-3">
                {duitkuQrData?.isLoading ? (
                  <div className="p-6 text-center text-xs text-secondary font-medium">
                    Membuat QRIS Payment Gateway...
                  </div>
                ) : duitkuQrData?.qrString ? (
                  <>
                    <div className="p-3 bg-white rounded-3xl border-2 border-emerald-600 shadow-md max-w-[240px]">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(duitkuQrData.qrString)}`}
                        alt="QRIS Aplikasi Payment Gateway"
                        className="w-48 h-48 object-contain rounded-xl"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <span className="text-xs font-bold text-brand-espresso block">
                        {duitkuQrData.providerName || 'QRIS Payment Gateway'}
                      </span>
                      <p className="text-[11px] text-secondary">
                        Order ID: {duitkuQrData.orderId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckDuitkuPayment}
                      disabled={isCheckingDuitku}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {isCheckingDuitku ? 'Memeriksa...' : 'Cek Status Pembayaran Gateway'}
                    </button>
                  </>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2 w-full">
                    <p className="text-xs font-bold text-amber-900">
                      Payment Gateway QRIS Aplikasi belum aktif / kunci API belum diatur.
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Atur kunci Duitku/Midtrans pada menu Dompet & Tarik Saldo, atau gunakan metode Tunai / QRIS Toko.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* QRIS Toko (Statis di meja kasir - tanpa file lama yang salah) */
              <div className="flex flex-col items-center py-3 space-y-3">
                <div className="w-full p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-1.5">
                  <QrCode className="w-8 h-8 text-amber-600 mx-auto" />
                  <span className="text-xs font-bold text-brand-espresso block">
                    Pembayaran via QRIS Fisik / Stand Toko
                  </span>
                  <p className="text-[11px] text-secondary leading-relaxed">
                    Minta pelanggan memindai QRIS fisik toko senilai{' '}
                    <strong className="text-brand-espresso">Rp {finalTotal.toLocaleString('id-ID')}</strong>, lalu cek mutasi masuk sebelum konfirmasi.
                  </p>
                </div>
              </div>
            )}

            {/* Submit checkout buttons */}
            <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="w-full sm:w-auto min-h-[44px] px-5 rounded-xl border border-border-strong text-xs sm:text-sm font-bold text-brand-espresso hover:bg-surface-container transition-colors cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className={`w-full sm:w-auto min-h-[44px] px-6 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 text-center ${
                  selectedPaymentMethod === 'QRIS'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black'
                    : 'bg-brand-espresso hover:bg-[#2e211e] text-brand-gold font-bold'
                }`}
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  {selectedPaymentMethod === 'QRIS'
                    ? 'Konfirmasi QRIS Lunas & Cetak'
                    : 'Konfirmasi Bayar Tunai & Cetak'}
                </span>
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

      {/* Confirmation Modal for Clearing Cart (Tactile UI) */}
      <ConfirmationModal
        isOpen={isClearCartModalOpen}
        type="danger"
        title="Kosongkan Keranjang Belanja?"
        message="Apakah Anda yakin ingin menghapus seluruh pesanan di nota kasir ini? Seluruh item yang sudah dipilih akan direset."
        confirmLabel="Ya, Kosongkan"
        cancelLabel="Batal"
        onConfirm={() => {
          clearCart();
          setIsClearCartModalOpen(false);
          setIsMobileCartOpen(false);
        }}
        onCancel={() => setIsClearCartModalOpen(false)}
      />

      {/* Close Shift Reconciliation Modal (Stitch MCP Architecture) */}
      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
      />
    </div>
  );
};
