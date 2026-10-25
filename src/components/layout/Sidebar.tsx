import React, { useState } from 'react';
import {
  LayoutGrid,
  Clock,
  Store,
  UtensilsCrossed,
  Receipt,
  Factory,
  WalletCards,
  BarChart3,
  Store as StoreIcon,
  RefreshCw,
  Lock,
  LogOut,
  X,
  Settings,
  Building2,
  Crown,
  Globe,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { useApp, AppView } from '../../context/AppContext';
import { OutletManagementModal } from '../outlet/OutletManagementModal';
import { UserRole } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    outlets,
    selectedOutletId,
    setSelectedOutletId,
    currentView,
    setCurrentView,
    isSidebarOpen,
    setIsSidebarOpen,
    activeShift,
    logout,
    getActiveOutlet,
    currentTenant,
    switchTenantView,
  } = useApp();

  const handleSelectView = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const isSuperAdmin = currentUser.role === 'SUPERADMIN';
  const isKasir = currentUser.role === 'KASIR';
  const isSupervisor = currentUser.role === 'SUPERVISOR';
  const isOwner = currentUser.role === 'OWNER';

  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);

  // Navigation Items with RBAC
  const navItems: {
    id: AppView;
    label: string;
    section: 'superadmin' | 'utama' | 'pos' | 'akuntansi';
    icon: React.ComponentType<{ className?: string }>;
    allowedRoles: UserRole[];
    badge?: string;
  }[] = [
    {
      id: 'superadmin-portal',
      label: 'Portal Superadmin SaaS',
      section: 'superadmin',
      icon: Crown,
      allowedRoles: ['SUPERADMIN'],
      badge: 'Platform',
    },
    {
      id: 'dashboard-utama',
      label: 'Dashboard Utama',
      section: 'utama',
      icon: LayoutGrid,
      allowedRoles: ['SUPERADMIN', 'OWNER', 'SUPERVISOR'],
    },
    {
      id: 'master-cabang-outlet',
      label: 'Master Cabang (Outlet)',
      section: 'utama',
      icon: Building2,
      allowedRoles: ['SUPERADMIN', 'OWNER', 'SUPERVISOR'],
      badge: `${outlets.length} Cabang`,
    },
    {
      id: 'sesi-shift-kasir',
      label: 'Sesi Shift Kasir',
      section: 'pos',
      icon: Clock,
      allowedRoles: ['SUPERADMIN', 'OWNER', 'SUPERVISOR', 'KASIR'],
      badge: activeShift?.status === 'ACTIVE' ? 'Aktif' : undefined,
    },
    {
      id: 'transaksi-kasir-pos',
      label: 'Transaksi Kasir (POS)',
      section: 'pos',
      icon: Store,
      allowedRoles: ['SUPERADMIN', 'OWNER', 'SUPERVISOR', 'KASIR'],
    },
    {
      id: 'master-menu-dimsum-hpp',
      label: 'Master Menu & HPP',
      section: 'pos',
      icon: UtensilsCrossed,
      allowedRoles: ['SUPERADMIN', 'OWNER', 'SUPERVISOR'],
    },
    {
      id: 'kas-kecil-outlet',
      label: 'Kas Kecil (Petty Cash)',
      section: 'akuntansi',
      icon: Receipt,
      allowedRoles: ['SUPERADMIN', 'OWNER', 'SUPERVISOR', 'KASIR'],
    },
    {
      id: 'tagihan-suplai-pabrik',
      label: 'Tagihan Suplai Pabrik',
      section: 'akuntansi',
      icon: Factory,
      allowedRoles: ['SUPERADMIN', 'OWNER'],
    },
    {
      id: 'beban-operasional-tetap',
      label: 'Beban Operasional Tetap',
      section: 'akuntansi',
      icon: WalletCards,
      allowedRoles: ['SUPERADMIN', 'OWNER'],
    },
    {
      id: 'laporan-laba-rugi-arus-kas',
      label: 'Laba Rugi & Arus Kas',
      section: 'akuntansi',
      icon: BarChart3,
      allowedRoles: ['SUPERADMIN', 'OWNER'],
    },
    {
      id: 'langganan-billing',
      label: 'Langganan & Kuota',
      section: 'akuntansi',
      icon: CreditCard,
      allowedRoles: ['SUPERADMIN', 'OWNER'],
      badge: '100rb/bln',
    },
  ];

  const brandName = currentTenant?.name || 'Dimsum Intan';
  const brandSlug = currentTenant?.slug ? `${currentTenant.slug}.posmu.cloud` : 'POS & Accounting';
  const brandColor = currentTenant?.themeColor || '#ea580c';

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-brand-espresso/60 backdrop-blur-xs z-40 lg:hidden transition-opacity cursor-pointer"
          aria-label="Tutup Menu Navigasi"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col justify-between py-4 border-r border-border-subtle shadow-2xl lg:shadow-sm select-none transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="px-5 pb-4 flex items-center justify-between border-b border-border-subtle/70">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl p-1.5 flex items-center justify-center shadow-sm shrink-0 font-black text-white text-base"
                style={{ backgroundColor: brandColor }}
              >
                {currentTenant?.logoUrl ? (
                  <img
                    src={currentTenant.logoUrl}
                    alt={brandName}
                    className="w-full h-full object-contain filter drop-shadow"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  brandName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-serif-title font-bold text-base text-brand-espresso tracking-tight truncate">
                  {brandName}
                </span>
                <span className="text-[10px] font-bold text-secondary tracking-wider truncate uppercase">
                  {brandSlug}
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-secondary hover:bg-surface-container hover:text-brand-espresso transition-colors cursor-pointer"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Superadmin Context Pill (if Superadmin is viewing a tenant) */}
          {isSuperAdmin && (
            <div className="px-4 pt-2.5 pb-0">
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Platform Admin Mode</span>
                </div>
                <button
                  onClick={() => switchTenantView(null, null)}
                  className="text-[10px] bg-amber-200/70 hover:bg-amber-300 text-amber-900 font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                  title="Kembali ke tampilan global platform"
                >
                  Global View
                </button>
              </div>
            </div>
          )}

          {/* Branch / Outlet Selector Box */}
          <div className="px-4 py-3">
            <div className="bg-surface-card rounded-xl p-2.5 border border-border-subtle shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <StoreIcon className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                    Cabang Aktif
                  </span>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              <div className="mt-1.5 relative">
                {isKasir ? (
                  <div className="flex items-center justify-between py-1 px-1.5 rounded-lg bg-surface-container text-xs font-semibold text-brand-espresso">
                    <span>{currentUser.outletName || getActiveOutlet()?.name || 'Cabang Kasir'}</span>
                    <div className="flex items-center gap-1 text-[10px] text-secondary bg-surface-card px-1.5 py-0.5 rounded">
                      <Lock className="w-3 h-3 text-secondary" /> Terkunci
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-brand-espresso focus:outline-none cursor-pointer py-1"
                  >
                    <option value="all">
                      Semua Outlet {outlets.length > 0 ? `(${outlets.length} Cabang)` : ''}
                    </option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {(isOwner || isSuperAdmin) && (
                <button
                  type="button"
                  onClick={() => handleSelectView('master-cabang-outlet')}
                  className="mt-2 w-full py-1.5 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-bold text-brand-espresso flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-border-subtle"
                  title="Kelola Master Cabang & Target Omset"
                >
                  <Settings className="w-3.5 h-3.5 text-primary" />
                  <span>Kelola Cabang</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation List */}
          <nav className="flex-1 px-4 mt-1 overflow-y-auto space-y-1">
            {/* Section: Superadmin Platform */}
            {isSuperAdmin && (
              <>
                <div className="pt-2 pb-1">
                  <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" /> Platform SaaS
                  </span>
                </div>
                {navItems
                  .filter((item) => item.section === 'superadmin')
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`nav-${item.id}`}
                        onClick={() => handleSelectView(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                            : 'text-amber-800 hover:bg-amber-100/70 font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-amber-700" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-black">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </>
            )}

            {/* Section: Utama */}
            {(isOwner || isSupervisor || isSuperAdmin) && (
              <div className="pt-3 pb-1">
                <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-secondary/80">
                  Utama
                </span>
              </div>
            )}
            {navItems
              .filter(
                (item) =>
                  item.section === 'utama' &&
                  (isSuperAdmin || item.allowedRoles.includes(currentUser.role))
              )
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => handleSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-gold text-brand-espresso font-bold shadow-xs'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}

            {/* Section: POS & Operasional */}
            <div className="pt-3 pb-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-secondary/80">
                POS & Operasional
              </span>
            </div>
            {navItems
              .filter(
                (item) =>
                  item.section === 'pos' &&
                  (isSuperAdmin || item.allowedRoles.includes(currentUser.role))
              )
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => handleSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-gold text-brand-espresso font-bold shadow-xs'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

            {/* Section: Finansial & Akuntansi */}
            {(isOwner || isSuperAdmin) && (
              <div className="pt-3 pb-1">
                <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-secondary/80">
                  Finansial & Akuntansi
                </span>
              </div>
            )}
            {navItems
              .filter(
                (item) =>
                  item.section === 'akuntansi' &&
                  (isSuperAdmin || item.allowedRoles.includes(currentUser.role))
              )
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => handleSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-gold text-brand-espresso font-bold shadow-xs'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
          </nav>

          {/* Cloud Sync Status Indicator */}
          <div className="px-4 pt-3 border-t border-border-subtle/70">
            <div className="bg-surface-container p-2.5 rounded-xl flex items-center justify-between border border-border-subtle">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-secondary animate-[spin_6s_linear_infinite]" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-brand-espresso leading-none">
                    Multi-Tenant Cloud Sync
                  </span>
                  <span className="text-[10px] text-secondary mt-0.5">
                    PostgreSQL Row-Isolated
                  </span>
                </div>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>

            {/* Logout Button */}
            <button
              id="sidebar-btn-logout"
              onClick={() => {
                logout();
                setIsSidebarOpen(false);
              }}
              className="w-full mt-2.5 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-700 hover:bg-red-50 hover:text-red-800 border border-red-200/60 transition-all active:scale-[0.99] cursor-pointer"
              title="Keluar dari akun saat ini"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Akun (Logout)</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Manajemen Cabang / Outlet */}
      <OutletManagementModal
        isOpen={isOutletModalOpen}
        onClose={() => setIsOutletModalOpen(false)}
      />
    </>
  );
};
