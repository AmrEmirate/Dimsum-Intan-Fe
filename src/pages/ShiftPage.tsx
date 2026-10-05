import React, { useState } from 'react';
import {
  Clock,
  Coins,
  BadgeAlert,
  ArrowRight,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Lock,
  History,
  QrCode,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ShiftPage: React.FC = () => {
  const {
    activeShift,
    shiftHistory,
    openShift,
    closeShift,
    currentUser,
    selectedOutletId,
    outlets,
    showNotification,
  } = useApp();

  const [isOpenShiftModal, setIsOpenShiftModal] = useState(false);
  const [isCloseShiftModal, setIsCloseShiftModal] = useState(false);
  const [startCashInput, setStartCashInput] = useState('500000');
  const [actualCashInput, setActualCashInput] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  const outletObj = outlets.find((o) => o.id === selectedOutletId) || outlets[0];
  const outletName = outletObj?.name || (selectedOutletId === 'all' ? 'Semua Outlet' : 'Outlet Utama');

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseFloat(startCashInput) || 0;
    if (cash <= 0) {
      showNotification('Modal awal uang laci harus lebih dari Rp 0!', 'warning');
      return;
    }
    openShift(cash);
    setIsOpenShiftModal(false);
  };

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(actualCashInput) || 0;
    closeShift(actual, closingNotes);
    setIsCloseShiftModal(false);
    setActualCashInput('');
    setClosingNotes('');
  };

  const expectedCash = activeShift ? Number(activeShift.expectedCash || 0) : 0;
  const currentDiff = actualCashInput ? (parseFloat(actualCashInput) || 0) - expectedCash : 0;
  const safeHistory = Array.isArray(shiftHistory) ? shiftHistory : [];

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* 1. Header & Context Card */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-espresso text-surface p-6 shadow-md border border-brand-espresso-muted/30">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-status-lunas-bg text-status-lunas-text text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {activeShift?.status === 'ACTIVE' ? 'Shift Kasir Aktif' : 'Shift Belum Dibuka'}
              </span>
              <span className="text-secondary/60 text-xs">/</span>
              <span className="text-brand-gold font-bold text-xs">{outletName}</span>
              <span className="text-secondary/60 text-xs">/</span>
              <span className="text-white/70 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> POS Terminal 01
              </span>
            </div>
            <h1 className="font-serif-title text-2xl font-bold text-white tracking-tight">
              Rekonsiliasi Shift & Laci Kasir
            </h1>
            <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
              Periksa keselarasan fisik uang tunai di drawer terhadap mutasi penjualan, penerimaan modal, dan pengeluaran darurat kas kecil.
            </p>
          </div>

          {/* Active Cashier Card */}
          <div className="flex items-center gap-4 bg-white/10 border border-white/15 p-3 rounded-2xl backdrop-blur-md self-start xl:self-auto">
            <div className="flex items-center gap-3 pr-4 border-r border-white/15">
              <div className="w-10 h-10 rounded-xl bg-brand-gold text-brand-espresso flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-white/70 uppercase font-bold tracking-wider">
                  Kasir Bertugas
                </span>
                <span className="text-xs font-bold text-white">{currentUser?.name || 'Kasir'}</span>
                <span className="text-[10px] text-brand-gold">
                  {currentUser?.role === 'OWNER' ? 'Owner / Admin' : 'ID: KSR-DU-084'}
                </span>
              </div>
            </div>

            <div className="flex flex-col pl-1">
              <span className="text-[10px] text-white/70 uppercase font-bold tracking-wider">
                Status Shift
              </span>
              <span className="text-xs font-bold text-brand-gold tabular-nums">
                {activeShift?.status === 'ACTIVE' ? 'Sedang Berjalan' : 'Standby'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Drawer Flow Equation Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-primary" /> Formula Aliran Kas Laci (Drawer Flow Equation)
          </span>
          <span className="text-[11px] text-secondary">Perhitungan real-time terintegrasi POS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3 items-stretch">
          {/* Card 1: Modal Awal */}
          <div className="rounded-2xl bg-surface-card p-3 sm:p-4 border border-border-subtle shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-center text-secondary">
              <span className="text-[11px] font-bold uppercase">1. Modal Awal Laci</span>
              <Coins className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-3">
              <div className="font-serif-title font-bold text-lg text-brand-espresso tabular-nums">
                Rp {Number(activeShift?.startingCash || 0).toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-secondary">Uang kembalian laci pagi</span>
            </div>
          </div>

          {/* Card 2: Penjualan Tunai (+) */}
          <div className="rounded-2xl bg-surface-card p-4 border border-border-subtle shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-center text-secondary">
              <span className="text-[11px] font-bold uppercase text-emerald-700">(+) Penjualan Tunai</span>
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                +
              </span>
            </div>
            <div className="mt-3">
              <div className="font-serif-title font-bold text-lg text-emerald-700 tabular-nums">
                Rp {Number(activeShift?.cashSales || 0).toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-secondary">Kas masuk dari transaksi tunai</span>
            </div>
          </div>

          {/* Card 3: Pengeluaran Darurat (-) */}
          <div className="rounded-2xl bg-surface-card p-4 border border-border-subtle shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-center text-secondary">
              <span className="text-[11px] font-bold uppercase text-red-600">(-) Kas Kecil Laci</span>
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center">
                -
              </span>
            </div>
            <div className="mt-3">
              <div className="font-serif-title font-bold text-lg text-red-600 tabular-nums">
                Rp {Number(activeShift?.pettyCashOut || 0).toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-secondary">Es batu, galon air, kresek</span>
            </div>
          </div>

          {/* Card 4: Uang Kas Sistem (=) */}
          <div className="rounded-2xl bg-brand-gold-subtle p-4 border border-brand-gold/40 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-center text-brand-espresso">
              <span className="text-[11px] font-bold uppercase">(=) Kas Sistem di Laci</span>
              <span className="w-5 h-5 rounded-full bg-brand-gold text-brand-espresso text-xs font-black flex items-center justify-center">
                =
              </span>
            </div>
            <div className="mt-3">
              <div className="font-serif-title font-bold text-lg text-brand-espresso tabular-nums">
                Rp {expectedCash.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-brand-espresso-muted font-medium">
                Wajib ada di laci saat cek fisik
              </span>
            </div>
          </div>

          {/* Card 5: Penjualan QRIS (Terpisah dari laci) */}
          <div className="col-span-2 sm:col-span-1 rounded-2xl bg-surface-card p-3 sm:p-4 border border-border-subtle shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-center text-secondary">
              <span className="text-[11px] font-bold uppercase">Penjualan QRIS</span>
              <QrCode className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-3">
              <div className="font-serif-title font-bold text-lg text-brand-espresso tabular-nums">
                Rp {Number(activeShift?.qrisSales || 0).toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-secondary">Langsung masuk rekening bank</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Shift Control & Cash Variance Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Action Card for Open/Close Shift */}
        <div className="lg:col-span-5 bg-surface-card rounded-2xl border border-border-subtle p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-serif-title font-bold text-lg text-brand-espresso">
              Tindakan Sesi Shift
            </h3>
            <p className="text-xs text-secondary mt-1">
              Berdasarkan Blueprint, sesi shift kasir tidak dapat dihapus demi audit keamanan kas internal.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-surface-container-low space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary">Status Sekarang:</span>
                <span className="font-bold text-brand-espresso">
                  {activeShift?.status === 'ACTIVE' ? 'Shift Sedang Aktif' : 'Shift Ditutup'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Waktu Dimulai:</span>
                <span className="font-medium text-brand-espresso">
                  {activeShift?.startTime
                    ? new Date(activeShift.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '-'}{' '}
                  WIB
                </span>
              </div>
              {activeShift?.actualEndingCash !== undefined && activeShift?.actualEndingCash !== null && (
                <div className="flex justify-between border-t border-border-subtle pt-2">
                  <span className="text-secondary">Fisik Terakhir Diinput:</span>
                  <span className="font-bold text-brand-espresso tabular-nums">
                    Rp {Number(activeShift.actualEndingCash).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {activeShift?.status === 'ACTIVE' ? (
              <button
                onClick={() => setIsCloseShiftModal(true)}
                className="w-full py-3 rounded-xl bg-brand-terracotta hover:bg-brand-terracotta-dark text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Tutup Shift & Rekonsiliasi Uang Fisik</span>
              </button>
            ) : (
              <button
                onClick={() => setIsOpenShiftModal(true)}
                className="w-full py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Buka Shift Baru (Input Modal Laci)</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Variance / Reconciliation Result Card */}
        <div className="lg:col-span-7 bg-surface-card rounded-2xl border border-border-subtle p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-serif-title font-bold text-lg text-brand-espresso">
                Status Selisih Kas (Audit Variance)
              </h3>
              <span className="text-[10px] font-bold text-secondary uppercase bg-surface-container px-2 py-0.5 rounded-full">
                Audit Trail Anti-Fraud
              </span>
            </div>

            {activeShift?.difference !== undefined && activeShift?.difference !== null ? (
              <div className="mt-4">
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    activeShift.difference === 0
                      ? 'bg-status-lunas-bg border-status-lunas-border text-status-lunas-text'
                      : activeShift.difference < 0
                      ? 'bg-status-unpaid-bg border-status-unpaid-border text-status-unpaid-text'
                      : 'bg-status-pending-bg border-status-pending-border text-status-pending-text'
                  }`}
                >
                  {activeShift.difference === 0 ? (
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 flex-shrink-0 text-amber-600" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {activeShift.difference === 0
                        ? 'Kas Seimbang Sempurna (Rp 0 Selisih)'
                        : activeShift.difference < 0
                        ? `Selisih Kurang Fisik Kas: Rp ${Math.abs(
                            Number(activeShift.difference)
                          ).toLocaleString('id-ID')}`
                        : `Selisih Lebih Fisik Kas: Rp ${Number(activeShift.difference).toLocaleString(
                            'id-ID'
                          )}`}
                    </h4>
                    <p className="text-xs opacity-90 mt-1">
                      Uang Fisik Dihitung: Rp{' '}
                      {Number(activeShift.actualEndingCash || 0).toLocaleString('id-ID')} vs Sistem: Rp{' '}
                      {Number(activeShift.expectedCash || 0).toLocaleString('id-ID')}
                    </p>
                    {activeShift.notes && (
                      <p className="text-[11px] font-semibold mt-2 pt-1 border-t border-current/20">
                        Catatan Kasir: "{activeShift.notes}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 py-8 text-center text-secondary border border-dashed border-border-subtle rounded-2xl">
                <Coins className="w-8 h-8 mx-auto text-secondary/60 mb-2" />
                <p className="text-xs font-medium">Shift sedang berjalan aktif</p>
                <p className="text-[11px] text-secondary/70 mt-0.5">
                  Lakukan tutup shift saat pergantian kasir untuk membandingkan uang fisik di drawer.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle text-[11px] text-secondary flex items-center justify-between">
            <span>Kebijakan Shift: Setiap kasir bertanggung jawab atas uang laci</span>
            <span className="font-bold text-brand-espresso">SOP Dimsum Intan</span>
          </div>
        </div>
      </div>

      {/* 4. Riwayat Sesi Shift Selesai (Closed Shifts Audit Log) */}
      <div className="bg-surface-card rounded-3xl p-6 border border-border-subtle shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-serif-title text-base font-bold text-brand-espresso">
                Riwayat Sesi Shift Ditutup (Audit Log Rekonsiliasi)
              </h3>
              <p className="text-[11px] text-secondary">
                Catatan mutasi uang laci kasir pada shift-shift sebelumnya
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-container text-brand-espresso">
            {safeHistory.length} Sesi Tercatat
          </span>
        </div>

        {/* Mobile View: Shift History Cards (< md screen) */}
        <div className="md:hidden divide-y divide-border-subtle">
          {safeHistory.length === 0 ? (
            <div className="py-8 text-center text-secondary text-xs">
              Belum ada riwayat shift yang ditutup.
            </div>
          ) : (
            safeHistory.map((s) => {
              const diff = Number(s.difference ?? 0);
              const startCash = Number(s.startingCash || 0);
              const cashSales = Number(s.cashSales || 0);
              const endingCash = Number(s.actualEndingCash ?? 0);

              let timeRange = '-';
              try {
                const start = s.startTime ? new Date(s.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
                const end = s.endTime ? new Date(s.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
                timeRange = `${start} - ${end}`;
              } catch {
                timeRange = '-';
              }

              return (
                <div key={s.id} className="py-3.5 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-brand-espresso">{s.shiftName || 'Shift'}</div>
                      <div className="text-[10px] text-secondary">
                        {timeRange} • {s.cashierName || 'Kasir'}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        diff === 0
                          ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                          : diff < 0
                          ? 'bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border'
                          : 'bg-status-pending-bg text-status-pending-text border border-status-pending-border'
                      }`}
                    >
                      {diff === 0
                        ? 'SEIMBANG'
                        : diff < 0
                        ? `-Rp ${Math.abs(diff).toLocaleString('id-ID')}`
                        : `+Rp ${diff.toLocaleString('id-ID')}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-2.5 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-secondary block">Modal & Penjualan</span>
                      <span className="font-semibold text-brand-espresso">
                        Rp {startCash.toLocaleString('id-ID')} + <span className="text-emerald-700">Rp {cashSales.toLocaleString('id-ID')}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-secondary block">Kas Fisik Laci</span>
                      <span className="font-bold text-brand-espresso">
                        Rp {endingCash.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {s.notes && (
                    <p className="text-[11px] text-secondary italic">
                      "{s.notes}"
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Tablet & Desktop View: Table (md+ screen) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-secondary">
                <th className="py-3 px-4">Shift & Waktu</th>
                <th className="py-3 px-4">Outlet & Kasir</th>
                <th className="py-3 px-4 text-right">Modal Awal</th>
                <th className="py-3 px-4 text-right">Penjualan Tunai</th>
                <th className="py-3 px-4 text-right">Kas Kecil</th>
                <th className="py-3 px-4 text-right">Sistem vs Fisik</th>
                <th className="py-3 px-4 text-center">Selisih Kas</th>
                <th className="py-3 px-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {safeHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-secondary">
                    Belum ada riwayat shift yang ditutup.
                  </td>
                </tr>
              ) : (
                safeHistory.map((s) => {
                  const diff = Number(s.difference ?? 0);
                  const startCash = Number(s.startingCash || 0);
                  const cashSales = Number(s.cashSales || 0);
                  const pettyCashVal = Number(s.pettyCashOut || 0);
                  const endingCash = Number(s.actualEndingCash ?? 0);
                  const expectedCashVal = Number(s.expectedCash || 0);

                  let timeRange = '-';
                  try {
                    const start = s.startTime ? new Date(s.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
                    const end = s.endTime ? new Date(s.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
                    timeRange = `${start} - ${end}`;
                  } catch {
                    timeRange = '-';
                  }

                  return (
                    <tr key={s.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-brand-espresso">{s.shiftName || 'Shift'}</div>
                        <div className="text-[10px] text-secondary">
                          {timeRange}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-brand-espresso">{s.outletName || 'Outlet'}</div>
                        <div className="text-[10px] text-secondary">{s.cashierName || 'Kasir'} ({s.terminalId || 'POS-01'})</div>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-secondary">
                        Rp {startCash.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-semibold text-emerald-700">
                        +Rp {cashSales.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-red-600">
                        -Rp {pettyCashVal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <div className="font-bold text-brand-espresso">
                          Fisik: Rp {endingCash.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-secondary">
                          Sistem: Rp {expectedCashVal.toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            diff === 0
                              ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                              : diff < 0
                              ? 'bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border'
                              : 'bg-status-pending-bg text-status-pending-text border border-status-pending-border'
                          }`}
                        >
                          {diff === 0
                            ? 'SEIMBANG'
                            : diff < 0
                            ? `-Rp ${Math.abs(diff).toLocaleString('id-ID')}`
                            : `+Rp ${diff.toLocaleString('id-ID')}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-[11px] text-secondary">
                        {s.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Buka Shift */}
      {isOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleOpenShiftSubmit}
            className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative"
          >
            <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
              Buka Sesi Shift Kasir Baru
            </h3>
            <p className="text-xs text-secondary mt-1">
              Masukkan nominal uang modal awal (uang kembalian) yang diserahkan ke dalam laci kasir.
            </p>

            <div className="my-5 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-espresso">
                Modal Awal Laci (Rp)
              </label>
              <input
                type="number"
                value={startCashInput}
                onChange={(e) => setStartCashInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface-container text-base font-bold text-brand-espresso focus:outline-none"
                placeholder="500000"
                required
              />
              <span className="text-[11px] text-secondary">Standar modal kembalian: Rp 500.000</span>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpenShiftModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all"
              >
                Buka Shift Sekarang
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Tutup Shift & Rekonsiliasi */}
      {isCloseShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCloseShiftSubmit}
            className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative"
          >
            <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
              Tutup Shift & Cek Fisik Kas Laci
            </h3>
            <p className="text-xs text-secondary mt-1">
              Hitung uang fisik di laci kasir saat ini untuk mendeteksi selisih otomatis.
            </p>

            <div className="my-4 p-3 rounded-xl bg-surface-container text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-secondary">Kas Wajib Sistem:</span>
                <span className="font-bold text-brand-espresso tabular-nums">
                  Rp {expectedCash.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">
                  Total Uang Fisik di Laci Kasir (Rp)
                </label>
                <input
                  type="number"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  placeholder="Contoh: 2080000"
                  className="w-full p-3 rounded-xl bg-surface-container text-base font-bold text-brand-espresso focus:outline-none"
                  required
                />
              </div>

              {actualCashInput && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold flex justify-between items-center ${
                    currentDiff === 0
                      ? 'bg-status-lunas-bg text-status-lunas-text'
                      : currentDiff < 0
                      ? 'bg-status-unpaid-bg text-status-unpaid-text'
                      : 'bg-status-pending-bg text-status-pending-text'
                  }`}
                >
                  <span>Selisih Terhitung:</span>
                  <span className="font-bold tabular-nums">
                    {currentDiff === 0
                      ? 'Rp 0 (SEIMBANG)'
                      : currentDiff < 0
                      ? `-Rp ${Math.abs(currentDiff).toLocaleString('id-ID')} (KURANG)`
                      : `+Rp ${currentDiff.toLocaleString('id-ID')} (LEBIH)`}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">
                  Catatan Rekonsiliasi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Catatan bila ada selisih uang atau kondisi kasir..."
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCloseShiftModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-terracotta hover:bg-brand-terracotta-dark text-white text-xs font-bold shadow-md transition-all"
              >
                Konfirmasi Tutup Shift
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
