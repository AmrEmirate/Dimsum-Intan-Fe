import React, { useState } from 'react';
import {
  Timer,
  X,
  Wallet,
  TrendingUp,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  QrCode,
  Sparkles,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeShift, closeShift, currentUser } = useApp();

  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !activeShift) return null;

  const startingCash = Number(activeShift.startingCash || 0);
  const cashSales = Number(activeShift.cashSales || 0);
  const qrisSales = Number(activeShift.qrisSales || 0);
  const pettyCashOut = Number(activeShift.pettyCashOut || 0);

  // Accounting expected cash in physical drawer
  const expectedCash = startingCash + cashSales - pettyCashOut;

  // Actual cash entered by cashier
  const actualCash = actualCashInput ? Number(actualCashInput) : 0;
  const difference = actualCash - expectedCash;

  // Quick button to autofill balanced amount
  const handleAutoFillExact = () => {
    setActualCashInput(String(expectedCash));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualCashInput) return;

    setIsSubmitting(true);
    await closeShift(actualCash, notes.trim() || undefined);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-surface-card border border-border-subtle shadow-2xl p-5 sm:p-6 text-left max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-xl text-secondary hover:text-brand-espresso hover:bg-surface-container transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-brand-terracotta/15 text-brand-terracotta flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 pr-8">
            <h3 className="text-base sm:text-lg font-black text-brand-espresso truncate">
              Rekonsiliasi & Tutup Shift Kasir
            </h3>
            <p className="text-xs text-secondary truncate">
              {activeShift.shiftName} • Kasir: {currentUser.name}
            </p>
          </div>
        </div>

        {/* Formula Akuntansi Aliran Kas Laci */}
        <div className="mt-4 p-4 rounded-2xl bg-surface-container/60 border border-border-subtle space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-secondary block">
            Aliran Kas Laci Tunai (Drawer Cash)
          </span>

          <div className="space-y-1.5 text-xs text-brand-espresso">
            <div className="flex justify-between items-center">
              <span className="text-secondary">Modal Awal Laci:</span>
              <span className="font-semibold">Rp {startingCash.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-700">
              <span>+ Penjualan Tunai Shift Ini:</span>
              <span className="font-semibold">+Rp {cashSales.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-brand-terracotta">
              <span>− Kas Kecil Darurat Keluar:</span>
              <span className="font-semibold">−Rp {pettyCashOut.toLocaleString('id-ID')}</span>
            </div>
            <div className="pt-2 border-t border-border-subtle flex justify-between items-center text-sm font-black">
              <span className="text-brand-espresso">Target Uang Fisik di Laci:</span>
              <span className="text-brand-espresso">Rp {expectedCash.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Non-Cash / QRIS auto-settlement indicator */}
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <QrCode className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="truncate">Penjualan QRIS / Online:</span>
          </div>
          <span className="font-bold shrink-0">Rp {qrisSales.toLocaleString('id-ID')}</span>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Actual Cash Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-espresso">
                Hitungan Uang Fisik Aktual di Laci *
              </label>
              <button
                type="button"
                onClick={handleAutoFillExact}
                className="text-[11px] font-bold text-brand-terracotta hover:underline cursor-pointer flex items-center gap-1"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Isi Nilai Pas</span>
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary">
                Rp
              </span>
              <input
                type="number"
                min={0}
                step={500}
                required
                value={actualCashInput}
                onChange={(e) => setActualCashInput(e.target.value)}
                placeholder={String(expectedCash)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-card border border-border-strong text-base font-black text-brand-espresso focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
              />
            </div>
          </div>

          {/* Difference Calculation Banner */}
          {actualCashInput && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                difference === 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : difference > 0
                  ? 'bg-sky-50 border-sky-300 text-sky-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {difference === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <div>
                  <span className="font-bold block">
                    {difference === 0
                      ? 'Laci Kas Pas (Balanced)'
                      : difference > 0
                      ? 'Selisih Lebih di Laci (+)'
                      : 'Selisih Kurang di Laci (-)'}
                  </span>
                  <span className="text-[11px] opacity-80">
                    {difference === 0
                      ? 'Uang fisik sama persis dengan kalkulasi sistem.'
                      : difference > 0
                      ? 'Terdapat uang fisik lebih dari catatan transaksi.'
                      : 'Uang fisik kurang dari catatan transaksi sistem.'}
                  </span>
                </div>
              </div>

              <span className="font-black text-sm shrink-0">
                {difference === 0
                  ? 'Rp 0'
                  : `${difference > 0 ? '+' : '-'}Rp ${Math.abs(difference).toLocaleString('id-ID')}`}
              </span>
            </div>
          )}

          {/* Notes Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-espresso">
              Catatan Rekonsiliasi Shift (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Seluruh klakat bersih, sisa uang kecil pas, kompor standby..."
              className="w-full p-2.5 rounded-xl bg-surface-card border border-border-subtle text-xs text-brand-espresso focus:outline-none focus:border-brand-gold placeholder:text-secondary/60"
            />
          </div>

          {/* Action Buttons (Touch Target >= 44px, Stacks vertically on phone to prevent collision) */}
          <div className="mt-5 pt-3 border-t border-border-subtle flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] px-5 rounded-xl border border-border-strong text-xs sm:text-sm font-bold text-brand-espresso hover:bg-surface-container transition-colors cursor-pointer text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !actualCashInput}
              className="w-full sm:w-auto min-h-[44px] px-6 rounded-xl bg-brand-terracotta hover:bg-brand-terracotta-dark text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 text-center"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Timer className="w-4 h-4" />
              )}
              <span>Tutup Shift Sekarang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
