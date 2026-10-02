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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const { currentUser, switchRole, activeShift, selectedOutletId, outlets, logout } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'OWNER':
        return 'bg-brand-espresso text-brand-gold border border-brand-gold/30';
      case 'SUPERVISOR':
        return 'bg-brand-terracotta text-white border border-brand-terracotta-dark';
      case 'KASIR':
        return 'bg-surface-muted text-brand-espresso border border-border-strong';
    }
  };

  const activeOutletObj = outlets.find((o) => o.id === selectedOutletId);

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface/90 backdrop-blur-md border-b border-border-subtle z-40 flex items-center justify-between px-6 shadow-xs select-none">
      {/* Left items: Active shift status & Factory supply status */}
      <div className="flex items-center gap-3">
        {/* Shift status pill */}
        <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-full border border-border-subtle">
          <Timer className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-brand-espresso tracking-tight">
            {activeShift?.status === 'ACTIVE'
              ? `${activeShift.shiftName}: ${currentTime} WIB`
              : 'Shift Kasir Ditutup'}
          </span>
          {activeShift?.status === 'ACTIVE' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
          )}
        </div>

        {/* Factory Supply readiness status */}
        <div className="hidden lg:flex items-center gap-1.5 bg-status-lunas-bg border border-status-lunas-border px-3 py-1.5 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5 text-status-lunas-text" />
          <span className="text-[11px] font-bold text-status-lunas-text">
            Pabrik Kirim: Ready (PT Dimsum Prima Rasa)
          </span>
        </div>
      </div>

      {/* Right items: Notifications & Interactive Role Switcher */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-brand-espresso transition-colors"
          title="Notifikasi Operasional"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-brand-terracotta ring-2 ring-surface"></span>
        </button>

        {/* Interactive Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2.5 bg-surface-card hover:bg-surface-container-low px-3 py-1.5 rounded-2xl border border-border-subtle shadow-xs transition-all cursor-pointer"
            title="Klik untuk mengganti role pengguna"
          >
            {/* Role Badge Capsule */}
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getRoleBadge(
                currentUser.role
              )}`}
            >
              {currentUser.role}
            </span>

            {/* User details */}
            <div className="flex flex-col text-left leading-tight pr-1">
              <span className="text-xs font-bold text-brand-espresso truncate max-w-[130px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-secondary truncate max-w-[130px]">
                {currentUser.role === 'OWNER'
                  ? '3 Cabang & Pusat'
                  : activeOutletObj?.name || 'Dipatiukur'}
              </span>
            </div>

            <div className="w-7 h-7 rounded-full bg-brand-espresso text-brand-gold flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser.role === 'OWNER' ? (
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
              <div className="px-3 py-1.5 border-b border-border-subtle mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Ganti Role (Simulasi Hak Akses)
                </span>
              </div>

              <button
                onClick={() => {
                  switchRole('OWNER');
                  setIsRoleDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                  currentUser.role === 'OWNER'
                    ? 'bg-brand-espresso text-white'
                    : 'hover:bg-surface-container'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    Hj. Intan Permata
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-gold text-brand-espresso font-black">
                      OWNER
                    </span>
                  </span>
                  <span className="text-[10px] opacity-80 mt-0.5">
                    Akses penuh 3 outlet, HPP, tagihan & laba rugi
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  switchRole('SUPERVISOR');
                  setIsRoleDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                  currentUser.role === 'SUPERVISOR'
                    ? 'bg-brand-terracotta text-white'
                    : 'hover:bg-surface-container'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    Hendra Wijaya (SPV)
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-brand-terracotta font-black">
                      SPV
                    </span>
                  </span>
                  <span className="text-[10px] opacity-80 mt-0.5">
                    Verifikasi kas kecil & otorisasi PIN void
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  switchRole('KASIR');
                  setIsRoleDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                  currentUser.role === 'KASIR'
                    ? 'bg-brand-gold text-brand-espresso font-bold'
                    : 'hover:bg-surface-container'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    Siti Rahma
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-muted text-brand-espresso font-black">
                      KASIR
                    </span>
                  </span>
                  <span className="text-[10px] opacity-80 mt-0.5">
                    Terkunci di Dipatiukur, shift kasir & POS
                  </span>
                </div>
              </button>

              <div className="pt-1.5 mt-1 border-t border-border-subtle">
                <button
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
  );
};

