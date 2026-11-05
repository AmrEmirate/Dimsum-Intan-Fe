import React, { useState, useRef, useEffect } from 'react';
import {
  Store,
  ChevronDown,
  Check,
  Building2,
  Lock,
  Plus,
  MapPin,
  Target,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface OutletDropdownProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'compact';
  onManageOutlets?: () => void;
}

export const OutletDropdown: React.FC<OutletDropdownProps> = ({
  className = '',
  variant = 'header',
  onManageOutlets,
}) => {
  const {
    outlets,
    selectedOutletId,
    setSelectedOutletId,
    currentUser,
    setCurrentView,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isKasir = currentUser.role === 'KASIR';
  const isOwner = currentUser.role === 'OWNER';
  const isSuperAdmin = currentUser.role === 'SUPERADMIN';

  // Find currently selected outlet object
  const activeOutlet = outlets.find((o) => o.id === selectedOutletId);
  const isAllSelected = selectedOutletId === 'all' || !activeOutlet;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle branch switch
  const handleSelectOutlet = (id: string) => {
    setSelectedOutletId(id);
    setIsOpen(false);
  };

  const handleOpenManagement = () => {
    setIsOpen(false);
    if (onManageOutlets) {
      onManageOutlets();
    } else {
      setCurrentView('master-cabang-outlet');
    }
  };

  // If user is Kasir, outlet is locked to their designated outlet
  if (isKasir) {
    return (
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-surface-container border border-border-subtle ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block">
              Cabang Kasir
            </span>
            <span className="text-xs sm:text-sm font-bold text-brand-espresso truncate block">
              {currentUser.outletName || activeOutlet?.name || 'Cabang Kasir'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-secondary bg-surface-card px-2 py-0.5 rounded-lg border border-border-subtle shrink-0">
          <Lock className="w-3 h-3 text-secondary" />
          <span>Terkunci</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group flex items-center justify-between gap-2 rounded-2xl transition-all cursor-pointer select-none text-left active:scale-[0.99] ${
          variant === 'sidebar'
            ? 'w-full p-2.5 bg-surface-card hover:bg-surface-container border border-border-subtle hover:border-border-strong shadow-xs'
            : variant === 'compact'
            ? 'px-3 py-1.5 bg-surface-card hover:bg-surface-container-low border border-border-subtle shadow-xs'
            : 'px-3 sm:px-3.5 py-1.5 sm:py-2 bg-surface-card hover:bg-surface-container-low border border-border-subtle hover:border-border-strong shadow-xs'
        } ${isOpen ? 'ring-2 ring-brand-terracotta/20 border-brand-terracotta shadow-md' : ''}`}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {/* Store Icon Capsule */}
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isAllSelected
                ? 'bg-amber-100 text-amber-800'
                : 'bg-brand-gold/20 text-brand-espresso'
            }`}
          >
            {isAllSelected ? (
              <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            ) : (
              <Store className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            )}
          </div>

          {/* Text labels */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-secondary leading-none">
                {isAllSelected ? 'Konteks Cabang' : 'Cabang Aktif'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-xs sm:text-sm font-black text-brand-espresso truncate block ${
                  variant === 'compact'
                    ? 'max-w-[100px] md:max-w-[130px] lg:max-w-[180px] xl:max-w-[240px]'
                    : ''
                }`}
              >
                {isAllSelected
                  ? outlets.length > 0
                    ? `Semua Outlet (${outlets.length})`
                    : 'Semua Outlet (Pusat)'
                  : activeOutlet.name}
              </span>
              {!isAllSelected && activeOutlet?.city && (
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-surface-container text-[10px] font-bold text-secondary uppercase tracking-tight">
                  {activeOutlet.city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chevron Icon with 180 deg rotation */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <ChevronDown
            className={`w-4 h-4 text-secondary transition-transform duration-200 stroke-[2.5] ${
              isOpen ? 'rotate-180 text-brand-terracotta' : 'group-hover:text-brand-espresso'
            }`}
          />
        </div>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute z-50 mt-2 rounded-2xl bg-surface-card border border-border-subtle shadow-2xl p-2 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 ${
            variant === 'sidebar'
              ? 'left-0 right-0'
              : 'right-0 sm:left-0 sm:right-auto min-w-[280px] sm:min-w-[320px] max-w-[95vw]'
          }`}
        >
          {/* Header Title inside Dropdown */}
          <div className="px-3 py-2 border-b border-border-subtle/80 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
              Pilih Konteks Outlet Dimsum
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-secondary">
              {outlets.length} Cabang Terdaftar
            </span>
          </div>

          <div className="mt-1 space-y-1 max-h-[300px] overflow-y-auto no-scrollbar p-0.5">
            {/* Option 1: Semua Outlet (Pusat Konsolidasi) */}
            <button
              type="button"
              role="option"
              aria-selected={isAllSelected}
              onClick={() => handleSelectOutlet('all')}
              className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer active:scale-[0.99] ${
                isAllSelected
                  ? 'bg-brand-gold/20 text-brand-espresso font-bold ring-1 ring-brand-gold/50'
                  : 'hover:bg-surface-container text-brand-espresso font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs sm:text-sm font-bold truncate">
                    Semua Outlet (Pusat Konsolidasi)
                  </span>
                  <span className="block text-[11px] text-secondary font-normal">
                    Laporan keuangan & stok agregat seluruh cabang
                  </span>
                </div>
              </div>
              {isAllSelected && (
                <Check className="w-4 h-4 text-brand-terracotta stroke-[3] shrink-0" />
              )}
            </button>

            {/* Divider */}
            {outlets.length > 0 && (
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-secondary/70">
                Daftar Gerai Cabang
              </div>
            )}

            {/* Individual Branch Outlets */}
            {outlets.map((o) => {
              const isSelected = selectedOutletId === o.id;
              const targetFormatted = Number(o.targetDailySales || 0).toLocaleString('id-ID');

              return (
                <button
                  key={o.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectOutlet(o.id)}
                  className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer active:scale-[0.99] ${
                    isSelected
                      ? 'bg-brand-gold/20 text-brand-espresso font-bold ring-1 ring-brand-gold/50'
                      : 'hover:bg-surface-container text-brand-espresso font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-brand-terracotta text-white'
                          : 'bg-surface-container text-primary'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="block text-xs sm:text-sm font-bold truncate">
                          {o.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-surface-container text-[9px] font-black uppercase text-secondary">
                          {o.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-secondary font-normal truncate">
                        <span className="flex items-center gap-0.5 shrink-0">
                          <MapPin className="w-3 h-3" />
                          <span>{o.city}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 truncate">
                          <Target className="w-3 h-3 text-status-lunas-text" />
                          <span>Target: Rp {targetFormatted}/hari</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-brand-terracotta stroke-[3] shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Zero outlets empty state card */}
            {outlets.length === 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center space-y-1">
                <p className="font-bold">Belum Ada Cabang Fisik</p>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Buka cabang baru untuk menetapkan target omset kasir dan laporan per outlet.
                </p>
              </div>
            )}
          </div>

          {/* Quick Action Footer for Owner */}
          {(isOwner || isSuperAdmin) && (
            <div className="mt-2 pt-2 border-t border-border-subtle/80">
              <button
                type="button"
                onClick={handleOpenManagement}
                className="w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-brand-espresso flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-border-subtle active:scale-[0.99]"
              >
                <Plus className="w-3.5 h-3.5 text-brand-terracotta" />
                <span>
                  {outlets.length === 0 ? 'Buka Cabang Pertama' : 'Kelola Seluruh Cabang'}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
