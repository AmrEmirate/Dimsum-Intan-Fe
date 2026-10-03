import React from 'react';
import {
  Store,
  Clock,
  Receipt,
  LayoutGrid,
  Menu,
  UtensilsCrossed,
} from 'lucide-react';
import { useApp, AppView } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    isSidebarOpen,
    setIsSidebarOpen,
    cart,
    activeShift,
    currentUser,
  } = useApp();

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isSupervisorOrOwner =
    currentUser.role === 'OWNER' || currentUser.role === 'SUPERVISOR';

  const handleNavClick = (view: AppView) => {
    setCurrentView(view);
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <nav
      aria-label="Navigasi Bawah Mobile & Tablet"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-card/95 backdrop-blur-lg border-t border-border-subtle shadow-[0_-4px_20px_rgba(43,30,22,0.08)] select-none safe-area-pb"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1 items-center">
        {/* 1. Kasir POS */}
        <button
          type="button"
          onClick={() => handleNavClick('transaksi-kasir-pos')}
          className={`flex flex-col items-center justify-center h-full relative cursor-pointer transition-all ${
            currentView === 'transaksi-kasir-pos'
              ? 'text-brand-espresso font-bold'
              : 'text-secondary hover:text-brand-espresso'
          }`}
        >
          <div className="relative">
            <div
              className={`p-1 rounded-xl transition-all ${
                currentView === 'transaksi-kasir-pos'
                  ? 'bg-brand-gold text-brand-espresso shadow-xs'
                  : 'bg-transparent'
              }`}
            >
              <Store className="w-5 h-5" />
            </div>
            {totalCartItems > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-brand-terracotta text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-surface-card animate-pulse shadow-xs">
                {totalCartItems > 99 ? '99+' : totalCartItems}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            Kasir
          </span>
        </button>

        {/* 2. Sesi Shift */}
        <button
          type="button"
          onClick={() => handleNavClick('sesi-shift-kasir')}
          className={`flex flex-col items-center justify-center h-full relative cursor-pointer transition-all ${
            currentView === 'sesi-shift-kasir'
              ? 'text-brand-espresso font-bold'
              : 'text-secondary hover:text-brand-espresso'
          }`}
        >
          <div className="relative">
            <div
              className={`p-1 rounded-xl transition-all ${
                currentView === 'sesi-shift-kasir'
                  ? 'bg-brand-gold text-brand-espresso shadow-xs'
                  : 'bg-transparent'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            {activeShift?.status === 'ACTIVE' && (
              <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface-card animate-ping" />
            )}
            {activeShift?.status === 'ACTIVE' && (
              <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface-card" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            Shift
          </span>
        </button>

        {/* 3. Kas Kecil */}
        <button
          type="button"
          onClick={() => handleNavClick('kas-kecil-outlet')}
          className={`flex flex-col items-center justify-center h-full relative cursor-pointer transition-all ${
            currentView === 'kas-kecil-outlet'
              ? 'text-brand-espresso font-bold'
              : 'text-secondary hover:text-brand-espresso'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              currentView === 'kas-kecil-outlet'
                ? 'bg-brand-gold text-brand-espresso shadow-xs'
                : 'bg-transparent'
            }`}
          >
            <Receipt className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            Kas Kecil
          </span>
        </button>

        {/* 4. Dashboard (Owner/SPV) or Menu HPP (Kasir) */}
        {isSupervisorOrOwner ? (
          <button
            type="button"
            onClick={() => handleNavClick('dashboard-utama')}
            className={`flex flex-col items-center justify-center h-full relative cursor-pointer transition-all ${
              currentView === 'dashboard-utama'
                ? 'text-brand-espresso font-bold'
                : 'text-secondary hover:text-brand-espresso'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                currentView === 'dashboard-utama'
                  ? 'bg-brand-gold text-brand-espresso shadow-xs'
                  : 'bg-transparent'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-none">
              Dashboard
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleNavClick('master-menu-dimsum-hpp')}
            className={`flex flex-col items-center justify-center h-full relative cursor-pointer transition-all ${
              currentView === 'master-menu-dimsum-hpp'
                ? 'text-brand-espresso font-bold'
                : 'text-secondary hover:text-brand-espresso'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                currentView === 'master-menu-dimsum-hpp'
                  ? 'bg-brand-gold text-brand-espresso shadow-xs'
                  : 'bg-transparent'
              }`}
            >
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-none">
              Menu
            </span>
          </button>
        )}

        {/* 5. Menu Lainnya (Drawer Toggle) */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`flex flex-col items-center justify-center h-full relative cursor-pointer transition-all ${
            isSidebarOpen
              ? 'text-brand-espresso font-bold'
              : 'text-secondary hover:text-brand-espresso'
          }`}
          title="Buka Menu Lengkap"
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              isSidebarOpen
                ? 'bg-brand-gold text-brand-espresso shadow-xs'
                : 'bg-transparent'
            }`}
          >
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            Lainnya
          </span>
        </button>
      </div>
    </nav>
  );
};
