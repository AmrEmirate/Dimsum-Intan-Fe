import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Timer,
  CheckCircle2,
  Bell,
  UserCheck,
  ChevronDown,
  Shield,
  User as UserIcon,
  LogOut,
  Wifi,
  WifiOff,
  Key,
  X,
  QrCode,
  Menu,
  Store,
  Crown,
  AlertTriangle,
  CheckCheck,
  Flame,
  ReceiptText,
  ChevronRight,
  Package,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import { useApp, AppView } from '../../context/AppContext';
import { UserRole } from '../../types';
import { OutletManagementModal } from '../outlet/OutletManagementModal';
import { OutletDropdown } from '../common/OutletDropdown';
import { CloseShiftModal } from '../common/CloseShiftModal';

interface OperationalNotif {
  id: string;
  category: 'kas_kecil' | 'stok' | 'tagihan' | 'shift';
  urgency: 'high' | 'medium' | 'info';
  title: string;
  description: string;
  badge: string;
  view: AppView;
}

export const Header: React.FC = () => {
  const {
    currentUser,
    switchRole,
    activeShift,
    selectedOutletId,
    outlets,
    logout,
    updatePin,
    setIsSidebarOpen,
    setCurrentView,
    currentTenant,
    menuItems,
    pettyCashList,
    factoryInvoices,
    fixedExpenses,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'urgent' | 'kas_kecil' | 'stok'>('all');
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dimsum_read_notif_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isOutletModalOpen, setIsOutletModalOpen] = useState<boolean>(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [isUpdatingPin, setIsUpdatingPin] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('dimsum_read_notif_ids', JSON.stringify(readNotifIds));
    } catch {
      // Ignore storage errors
    }
  }, [readNotifIds]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const operationalNotifs = useMemo<OperationalNotif[]>(() => {
    const list: OperationalNotif[] = [];

    // 1. Pending petty cash verification
    if (pettyCashList && pettyCashList.length > 0) {
      pettyCashList
        .filter((p) => p.status === 'MENUNGGU_VERIFIKASI')
        .forEach((p) => {
          list.push({
            id: `pc-${p.id}`,
            category: 'kas_kecil',
            urgency: 'high',
            title: `Approval Kas Kecil: ${p.expenseNumber}`,
            description: `Pengeluaran Rp ${p.amount.toLocaleString('id-ID')} (${p.description}) butuh verifikasi.`,
            badge: 'Persetujuan Kasir',
            view: 'kas-kecil-outlet',
          });
        });
    }

    // 2. Low stock dimsum alert
    if (menuItems && menuItems.length > 0) {
      menuItems
        .filter((m) => m.stock <= 5)
        .forEach((m) => {
          const isZero = m.stock === 0;
          list.push({
            id: `stock-${m.id}`,
            category: 'stok',
            urgency: isZero ? 'high' : 'medium',
            title: isZero ? `Stok Habis: ${m.name}` : `Stok Menipis: ${m.name}`,
            description: isZero
              ? 'Porsi habis (0). Segera restock dari gudang/pesan pabrik.'
              : `Sisa ${m.stock} porsi di cabang kasir. Segera siapkan stok.`,
            badge: isZero ? 'Habis (0)' : `Sisa ${m.stock}`,
            view: 'master-menu-dimsum-hpp',
          });
        });
    }

    // 3. Unpaid factory supplier invoices
    if (factoryInvoices && factoryInvoices.length > 0) {
      factoryInvoices
        .filter((f) => f.status === 'BELUM_LUNAS' || f.status === 'JATUH_TEMPO')
        .forEach((f) => {
          const itemSummary = f.items && f.items.length > 0 ? f.items[0].itemName : 'Suplai Dimsum';
          list.push({
            id: `inv-${f.id}`,
            category: 'tagihan',
            urgency: f.status === 'JATUH_TEMPO' ? 'high' : 'medium',
            title: `Tagihan Pabrik: ${f.invoiceNumber}`,
            description: `Faktur ${itemSummary} senilai Rp ${f.totalAmount.toLocaleString('id-ID')} belum lunas.`,
            badge: f.dueDate ? `Tempo ${f.dueDate}` : 'Belum Lunas',
            view: 'tagihan-suplai-pabrik',
          });
        });
    }

    // 4. Unpaid fixed OPEX
    if (fixedExpenses && fixedExpenses.length > 0) {
      fixedExpenses
        .filter((e) => e.status === 'TERJADWAL')
        .forEach((e) => {
          list.push({
            id: `opex-${e.id}`,
            category: 'tagihan',
            urgency: 'medium',
            title: `Beban OPEX: ${e.title}`,
            description: `Beban rutin Rp ${e.amount.toLocaleString('id-ID')} jatuh tempo pada ${e.dueDate}.`,
            badge: `Tempo ${e.dueDate}`,
            view: 'beban-operasional-tetap',
          });
        });
    }

    // 5. Shift reminder for cashier if no active shift
    if (currentUser.role === 'KASIR' && (!activeShift || activeShift.status !== 'ACTIVE')) {
      list.push({
        id: 'shift-reminder',
        category: 'shift',
        urgency: 'high',
        title: 'Sesi Kasir Belum Dibuka',
        description: 'Buka sesi shift dan input modal laci kasir sebelum melayani transaksi POS.',
        badge: 'Wajib Buka Shift',
        view: 'sesi-shift-kasir',
      });
    }

    return list;
  }, [pettyCashList, menuItems, factoryInvoices, fixedExpenses, currentUser.role, activeShift]);

  const unreadNotifs = useMemo(() => {
    return operationalNotifs.filter((n) => !readNotifIds.includes(n.id));
  }, [operationalNotifs, readNotifIds]);

  const unreadCount = unreadNotifs.length;
  const urgentCount = useMemo(() => operationalNotifs.filter((n) => n.urgency === 'high').length, [operationalNotifs]);
  const pettyCashNotifsCount = useMemo(() => operationalNotifs.filter((n) => n.category === 'kas_kecil').length, [operationalNotifs]);
  const stockNotifsCount = useMemo(() => operationalNotifs.filter((n) => n.category === 'stok').length, [operationalNotifs]);

  const displayedNotifs = useMemo(() => {
    if (notifFilter === 'urgent') {
      return operationalNotifs.filter((n) => n.urgency === 'high');
    }
    if (notifFilter === 'kas_kecil') {
      return operationalNotifs.filter((n) => n.category === 'kas_kecil');
    }
    if (notifFilter === 'stok') {
      return operationalNotifs.filter((n) => n.category === 'stok');
    }
    return operationalNotifs;
  }, [operationalNotifs, notifFilter]);

  const handleSelectNotif = (notif: OperationalNotif) => {
    setReadNotifIds((prev) => (prev.includes(notif.id) ? prev : [...prev, notif.id]));
    setIsNotificationOpen(false);
    setCurrentView(notif.view);
  };

  const markAllAsRead = () => {
    setReadNotifIds(operationalNotifs.map((n) => n.id));
  };

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-amber-500 text-stone-950 border border-amber-300 font-black shadow-xs';
      case 'OWNER':
        return 'bg-brand-espresso text-brand-gold border border-brand-gold/30';
      case 'SUPERVISOR':
        return 'bg-brand-terracotta text-white border border-brand-terracotta-dark';
      case 'KASIR':
        return 'bg-surface-muted text-brand-espresso border border-border-strong';
    }
  };

  const getNotifIconStyle = (notif: OperationalNotif) => {
    if (notif.urgency === 'high') return 'bg-red-100 text-red-700';
    if (notif.category === 'kas_kecil') return 'bg-amber-100 text-amber-800';
    if (notif.category === 'stok') return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-700';
  };

  const getNotifIcon = (category: OperationalNotif['category']) => {
    switch (category) {
      case 'kas_kecil':
        return <Wallet className="w-4 h-4" />;
      case 'stok':
        return <Flame className="w-4 h-4" />;
      case 'tagihan':
        return <ReceiptText className="w-4 h-4" />;
      case 'shift':
        return <Timer className="w-4 h-4" />;
    }
  };

  const getBadgeStyle = (urgency: OperationalNotif['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
    }
  };

  const activeOutletObj = outlets.find((o) => o.id === selectedOutletId);

  const handleUpdatePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length < 4) return;
    setIsUpdatingPin(true);
    const ok = await updatePin(newPinInput);
    setIsUpdatingPin(false);
    if (ok) {
      setIsPinModalOpen(false);
      setNewPinInput('');
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface/90 backdrop-blur-md border-b border-border-subtle z-40 flex items-center justify-between px-2.5 sm:px-6 shadow-xs select-none">
        {/* Left items: Mobile hamburger & Active shift status & Network status */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Hamburger toggle button for Mobile/Tablet */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-brand-espresso hover:bg-surface-container active:scale-95 transition-all cursor-pointer shrink-0"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Shift status pill - Interactive for Cashier/Owner */}
          <button
            type="button"
            onClick={() => {
              if (activeShift?.status === 'ACTIVE') {
                setIsCloseShiftModalOpen(true);
              }
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full border border-border-subtle shrink-0 transition-all ${
              activeShift?.status === 'ACTIVE'
                ? 'bg-surface-container-high hover:bg-amber-100/60 cursor-pointer active:scale-95'
                : 'bg-surface-container-high opacity-70 cursor-default'
            }`}
            title={activeShift?.status === 'ACTIVE' ? 'Klik untuk rekonsiliasi kas & tutup shift' : 'Shift Kasir Sedang Tutup'}
          >
            <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold text-brand-espresso tracking-tight whitespace-nowrap">
              {activeShift?.status === 'ACTIVE' ? (
                <>
                  <span className="sm:hidden">Shift Aktif</span>
                  <span className="hidden sm:inline">
                    {activeShift.shiftName}: {currentTime} WIB
                  </span>
                </>
              ) : (
                'Shift Tutup'
              )}
            </span>
            {activeShift?.status === 'ACTIVE' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5 shrink-0"></span>
            )}
          </button>

          {/* Network Connection Indicator - Compact icon on mobile, full pill on sm+ */}
          <div
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
            }`}
            title={isOnline ? 'Jaringan Online & Terhubung' : 'Koneksi Internet Terputus!'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Right items: Outlet Switcher, Notifications & Interactive Role Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Quick Outlet Selector on Desktop/Tablet Topbar */}
          <OutletDropdown variant="compact" className="hidden md:block" />

          {/* Quick Activate Branch CTA for Owner when 0 outlets */}
          {currentUser.role === 'OWNER' && outlets.length === 0 && (
            <button
              type="button"
              onClick={() => setCurrentView('master-cabang-outlet')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Aktivasi Kuota Cabang Baru"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Aktivasi Cabang</span>
            </button>
          )}

          {/* Operational Notification Bell & Popover */}
          <div className="relative shrink-0" ref={notifRef}>
            <button
              id="btn-operational-notification"
              type="button"
              onClick={() => {
                setIsNotificationOpen((prev) => !prev);
                setIsRoleDropdownOpen(false);
              }}
              className={`relative p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                isNotificationOpen
                  ? 'bg-surface-container text-brand-espresso ring-2 ring-brand-gold/40'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-brand-espresso'
              }`}
              title="Pusat Notifikasi Operasional"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-terracotta text-white text-[10px] font-black flex items-center justify-center ring-2 ring-surface shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-surface"
                  title="Semua operasional lancar"
                />
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {isNotificationOpen && (
              <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-16px)] sm:w-96 max-w-sm sm:max-w-none bg-surface-card border border-border-subtle rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
                {/* Popover Header */}
                <div className="p-3.5 border-b border-border-subtle bg-surface-container/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-brand-gold/20 text-brand-espresso">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-espresso">Notifikasi Operasional</h4>
                      <p className="text-[10px] text-secondary">
                        {unreadCount > 0 ? `${unreadCount} perlu ditindaklanjuti` : 'Semua sudah beres'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-brand-terracotta hover:underline flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-container cursor-pointer"
                        title="Tandai semua notifikasi sudah dibaca"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Tandai Dibaca</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsNotificationOpen(false)}
                      className="p-1 rounded-lg text-secondary hover:text-brand-espresso hover:bg-surface-container cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-3 pt-2.5 pb-2 border-b border-border-subtle flex items-center gap-1.5 bg-surface overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setNotifFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      notifFilter === 'all'
                        ? 'bg-brand-espresso text-brand-gold'
                        : 'bg-surface-container text-secondary hover:text-brand-espresso'
                    }`}
                  >
                    Semua ({operationalNotifs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilter('urgent')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      notifFilter === 'urgent'
                        ? 'bg-red-600 text-white'
                        : 'bg-surface-container text-secondary hover:text-brand-espresso'
                    }`}
                  >
                    Penting ({urgentCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilter('kas_kecil')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      notifFilter === 'kas_kecil'
                        ? 'bg-brand-gold text-brand-espresso'
                        : 'bg-surface-container text-secondary hover:text-brand-espresso'
                    }`}
                  >
                    Kas Kecil ({pettyCashNotifsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilter('stok')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      notifFilter === 'stok'
                        ? 'bg-amber-600 text-white'
                        : 'bg-surface-container text-secondary hover:text-brand-espresso'
                    }`}
                  >
                    Stok ({stockNotifsCount})
                  </button>
                </div>

                {/* Notif Items List */}
                <div className="overflow-y-auto divide-y divide-border-subtle flex-1 p-1 max-h-[360px]">
                  {displayedNotifs.length === 0 ? (
                    <div className="py-8 px-4 text-center flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-brand-espresso">Operasional Terkendali!</p>
                      <p className="text-[11px] text-secondary mt-0.5 max-w-[220px]">
                        Tidak ada antrian persetujuan kas kecil, stok menipis, atau tagihan mendesak.
                      </p>
                    </div>
                  ) : (
                    displayedNotifs.map((notif) => {
                      const isUnread = !readNotifIds.includes(notif.id);
                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleSelectNotif(notif)}
                          className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                            isUnread
                              ? 'bg-surface-container/70 hover:bg-surface-container'
                              : 'hover:bg-surface-container/40 opacity-80 hover:opacity-100'
                          }`}
                        >
                          {/* Notif Icon */}
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${getNotifIconStyle(notif)}`}>
                            {getNotifIcon(notif.category)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className={`text-xs text-brand-espresso truncate ${isUnread ? 'font-black' : 'font-semibold'}`}>
                                {notif.title}
                              </h5>
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-brand-terracotta shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-secondary line-clamp-2 mt-0.5">
                              {notif.description}
                            </p>
                            <div className="mt-1.5 flex items-center justify-between">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${getBadgeStyle(notif.urgency)}`}>
                                {notif.badge}
                              </span>
                              <span className="text-[10px] font-bold text-brand-terracotta flex items-center gap-0.5 hover:underline">
                                <span>Buka & Proses</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Popover Footer Quick Access */}
                <div className="p-2.5 border-t border-border-subtle bg-surface-container/30 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationOpen(false);
                      setCurrentView('transaksi-kasir-pos');
                    }}
                    className="font-bold text-brand-espresso hover:text-brand-terracotta cursor-pointer transition-colors"
                  >
                    Kasir POS &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationOpen(false);
                      setCurrentView('laporan-laba-rugi-arus-kas');
                    }}
                    className="font-bold text-brand-espresso hover:text-brand-terracotta cursor-pointer transition-colors"
                  >
                    Laba Rugi &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Role Switcher Pill */}
          <div className="relative shrink-0" ref={roleRef}>
            <button
              id="btn-user-profile"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsRoleDropdownOpen((prev) => !prev);
              }}
              className="flex items-center gap-2 bg-surface-card hover:bg-surface-container-low px-2.5 sm:px-3 py-1.5 rounded-2xl border border-border-subtle shadow-xs transition-all cursor-pointer"
              title="Klik untuk mengganti role pengguna atau pengaturan"
            >
              {/* Role Badge Capsule */}
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getRoleBadge(
                  currentUser.role
                )}`}
              >
                {currentUser.role}
              </span>

              {/* User details (hidden on small mobile to avoid overflow) */}
              <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
                <span className="text-xs font-bold text-brand-espresso truncate max-w-[130px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-secondary truncate max-w-[130px]">
                  {currentUser.role === 'SUPERADMIN'
                    ? (currentTenant ? `Tenant: ${currentTenant.name}` : 'Platform Global')
                    : currentUser.role === 'OWNER'
                    ? (outlets.length > 0 ? `${outlets.length} Cabang & Pusat` : 'Pusat (0 Cabang Fisik)')
                    : activeOutletObj?.name || 'Cabang Kasir'}
                </span>
              </div>

              <div className="w-7 h-7 rounded-full bg-brand-espresso text-brand-gold flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser.role === 'SUPERADMIN' ? (
                  <Crown className="w-4 h-4 text-brand-gold" />
                ) : currentUser.role === 'OWNER' ? (
                  <Shield className="w-4 h-4" />
                ) : currentUser.role === 'SUPERVISOR' ? (
                  <UserCheck className="w-4 h-4" />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-secondary" />
            </button>

            {/* Role Switcher Dropdown */}
            {isRoleDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface-card border border-border-subtle rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-border-subtle mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                    Informasi Akun
                  </span>
                  <p className="text-xs font-bold text-brand-espresso mt-0.5">{currentUser.name}</p>
                  <p className="text-[11px] text-secondary">
                    {currentTenant ? currentTenant.name : (currentUser.outletName || 'Platform Global')}
                  </p>
                  <div className="mt-1">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-espresso text-brand-gold font-bold">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                {/* Additional Settings: Superadmin Portal */}
                {currentUser.role === 'SUPERADMIN' && (
                  <div className="pt-1.5 mt-1 border-t border-border-subtle">
                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        setCurrentView('superadmin-portal');
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-black text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-amber-600" />
                      <span>Portal Superadmin SaaS</span>
                    </button>
                  </div>
                )}

                {/* Additional Settings: PIN Update for Owner/SPV */}
                {(currentUser.role === 'OWNER' || currentUser.role === 'SUPERVISOR') && (
                  <div className="pt-1.5 mt-1 border-t border-border-subtle space-y-1">
                    {currentUser.role === 'OWNER' && (
                      <button
                        onClick={() => {
                          setIsRoleDropdownOpen(false);
                          setCurrentView('master-cabang-outlet');
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-bold text-brand-espresso hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <Store className="w-4 h-4 text-primary" />
                        <span>Kelola Master Cabang</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        setIsPinModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-bold text-brand-espresso hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <Key className="w-4 h-4 text-primary" />
                      <span>Ubah PIN Otorisasi</span>
                    </button>
                  </div>
                )}

                <div className="pt-1.5 mt-1 border-t border-border-subtle">
                  <button
                    id="btn-logout"
                    onClick={() => {
                      setIsRoleDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Akun (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal: Ubah PIN Otorisasi */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleUpdatePinSubmit}
            className="w-full max-w-sm bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative"
          >
            <button
              type="button"
              onClick={() => setIsPinModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-primary mb-1">
              <Key className="w-5 h-5" />
              <h3 className="font-serif-title font-bold text-lg text-brand-espresso">
                Ubah PIN Otorisasi
              </h3>
            </div>
            <p className="text-xs text-secondary mb-4">
              PIN digunakan untuk otorisasi pembatalan nota (Void) dan penghapusan kas kecil.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-brand-espresso">PIN Baru (4-6 Angka)</label>
              <input
                type="password"
                maxLength={6}
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="Masukkan PIN baru..."
                className="w-full p-3 rounded-xl bg-surface-container text-center text-lg font-bold tracking-widest text-brand-espresso focus:outline-none"
                required
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUpdatingPin || newPinInput.length < 4}
                className="px-4 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {isUpdatingPin ? 'Menyimpan...' : 'Simpan PIN'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Manajemen Cabang */}
      <OutletManagementModal
        isOpen={isOutletModalOpen}
        onClose={() => setIsOutletModalOpen(false)}
      />

      {/* Close Shift Reconciliation Modal (Stitch MCP Architecture) */}
      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
      />
    </>
  );
};
