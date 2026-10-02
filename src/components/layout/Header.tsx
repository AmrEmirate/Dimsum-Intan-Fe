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
  MessageCircle,
  Key,
  X,
  QrCode,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const {
    currentUser,
    switchRole,
    activeShift,
    selectedOutletId,
    outlets,
    logout,
    updatePin,
    whatsappStatus,
    fetchWhatsAppStatus,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
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
      <header className="fixed top-0 left-72 right-0 h-16 bg-surface/90 backdrop-blur-md border-b border-border-subtle z-40 flex items-center justify-between px-6 shadow-xs select-none">
        {/* Left items: Active shift status & Factory supply status & Network status */}
        <div className="flex items-center gap-2.5">
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

          {/* Network Connection Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
            }`}
            title={isOnline ? 'Jaringan Online & Terhubung' : 'Koneksi Internet Terputus!'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* WhatsApp Bot Status Button */}
          <button
            type="button"
            onClick={() => {
              fetchWhatsAppStatus();
              setIsWaModalOpen(true);
            }}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
              whatsappStatus?.isReady
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : whatsappStatus?.hasQr
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
                : 'bg-surface-container text-secondary border-border-subtle hover:bg-surface-container-high'
            }`}
            title="Klik untuk melihat status Bot WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {whatsappStatus?.isReady
                ? 'WA Bot: Aktif'
                : whatsappStatus?.hasQr
                ? 'WA Bot: Scan QR'
                : 'WA Bot: Standby'}
            </span>
          </button>
        </div>

        {/* Right items: Notifications & Interactive Role Switcher */}
        <div className="flex items-center gap-3">
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
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
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
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
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
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
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

                {/* Additional Settings: PIN Update for Owner/SPV */}
                {(currentUser.role === 'OWNER' || currentUser.role === 'SUPERVISOR') && (
                  <div className="pt-1.5 mt-1 border-t border-border-subtle">
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

      {/* Modal: Status WhatsApp Bot */}
      {isWaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setIsWaModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-serif-title font-bold text-lg text-brand-espresso">
                Status Bot WhatsApp Dimsum Intan
              </h3>
            </div>
            <p className="text-xs text-secondary mb-4">
              Layanan otomatisasi pengiriman nota kasir dan notifikasi tagihan via WhatsApp.
            </p>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-border-subtle flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary font-semibold">Status Koneksi:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    whatsappStatus?.isReady
                      ? 'bg-emerald-100 text-emerald-800'
                      : whatsappStatus?.hasQr
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-surface-container text-secondary'
                  }`}
                >
                  {whatsappStatus?.isReady
                    ? 'TERHUBUNG (ONLINE)'
                    : whatsappStatus?.hasQr
                    ? 'MENUNGGU SCAN QR'
                    : 'MODE STANDBY / SIMULASI'}
                </span>
              </div>

              {whatsappStatus?.hasQr && whatsappStatus.qrCode ? (
                <div className="flex flex-col items-center py-2 gap-2 bg-white p-4 rounded-xl border border-border-subtle">
                  <span className="text-xs font-bold text-brand-espresso">
                    Pindai dengan WhatsApp di Ponsel Anda:
                  </span>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      whatsappStatus.qrCode
                    )}`}
                    alt="Scan WA QR"
                    className="w-44 h-44 object-contain"
                  />
                  <span className="text-[10px] text-secondary">
                    Buka WhatsApp &gt; Perangkat Tertaut &gt; Tautkan Perangkat
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-surface-card rounded-xl text-xs text-secondary leading-relaxed">
                  {whatsappStatus?.isReady ? (
                    <p className="text-emerald-700 font-medium">
                      Bot siap mengirimkan nota transaksi POS secara otomatis ke nomor pembeli saat checkout berhasil.
                    </p>
                  ) : (
                    <p>
                      Bot saat ini dalam mode aman (*mock simulation*). Transaksi kasir tetap berjalan lancar dan nota tetap tercatat rapi ke database.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsWaModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-brand-espresso text-brand-gold text-xs font-bold shadow-xs hover:bg-brand-espresso-muted transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
