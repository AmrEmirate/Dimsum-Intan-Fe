import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { OutletManagementModal } from '../outlet/OutletManagementModal';

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
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isOutletModalOpen, setIsOutletModalOpen] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [isUpdatingPin, setIsUpdatingPin] = useState<boolean>(false);

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

          {/* Shift status pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-surface-container-high px-2 sm:px-3 py-1.5 rounded-full border border-border-subtle shrink-0">
            <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold text-brand-espresso tracking-tight whitespace-nowrap truncate max-w-[80px] sm:max-w-none">
              {activeShift?.status === 'ACTIVE' ? (
                <>
                  <span>{activeShift.shiftName}</span>
                  <span className="hidden sm:inline">: {currentTime} WIB</span>
                </>
              ) : (
                'Shift Tutup'
              )}
            </span>
            {activeShift?.status === 'ACTIVE' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5 shrink-0"></span>
            )}
          </div>

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

        {/* Right items: Notifications & Interactive Role Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Notification Bell */}
          <button
            className="relative p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-brand-espresso transition-colors cursor-pointer shrink-0"
            title="Notifikasi Operasional"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-brand-terracotta ring-2 ring-surface"></span>
          </button>

          {/* Interactive Role Switcher Pill */}
          <div className="relative shrink-0">
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
                    ? `${outlets.length} Cabang & Pusat`
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
    </>
  );
};
