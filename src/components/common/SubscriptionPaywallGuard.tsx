import React from 'react';
import { ShieldAlert, Zap, Building2, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SubscriptionPaywallGuardProps {
  featureName?: string;
  description?: string;
}

export const SubscriptionPaywallGuard: React.FC<SubscriptionPaywallGuardProps> = ({
  featureName = 'Fitur Operasional Kasir & Keuangan',
  description = 'Fitur ini memerlukan paket langganan Cloud POS Dimsum Intan yang aktif untuk digunakan.',
}) => {
  const { setCurrentView, billingStatus } = useApp();

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 animate-in fade-in duration-200">
      <div className="bg-surface-card border-2 border-brand-gold/40 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        {/* Glow / Accent Background */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-gold/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          {/* Badge & Lock Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold mb-5 shadow-inner">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-brand-espresso" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-900 border border-amber-500/30 mb-3">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span>Akses Terkunci • Langganan Belum Aktif</span>
          </div>

          <h2 className="font-serif-title text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-espresso tracking-tight">
            {featureName} Terkunci
          </h2>

          <p className="text-secondary text-xs sm:text-sm sm:leading-relaxed mt-3 max-w-xl">
            {description} Akun Anda saat ini belum memiliki langganan aktif. Silakan pilih paket langganan resmi untuk membuka seluruh operasional kasir POS, pencatatan resep HPP, shift kasir, dan pembukuan keuangan.
          </p>

          {/* Benefits Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 my-6 sm:my-8 text-left">
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-border-subtle flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-brand-espresso block">Mesin Kasir POS &amp; Cetak Struk</span>
                <span className="text-[11px] text-secondary">Proses order cepat, QRIS dinamis, dan struk thermal.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-border-subtle flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-brand-espresso block">Manajemen Menu &amp; Resep HPP</span>
                <span className="text-[11px] text-secondary">Kalkulasi modal HPP, margin profit, dan stok otomatis.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-border-subtle flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-brand-espresso block">Shift Kasir &amp; Kas Kecil</span>
                <span className="text-[11px] text-secondary">Rekonsiliasi uang kas fisik dan shift kasir anti selisih.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-border-subtle flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-brand-espresso block">Laporan Realtime &amp; Dompet Payout</span>
                <span className="text-[11px] text-secondary">Laba rugi otomatis dan pencairan saldo payment gateway.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCurrentView('langganan-billing')}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 shrink-0" />
              <span>Pilih Paket &amp; Aktifkan Langganan Sekarang</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('master-cabang-outlet')}
              className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-2xl bg-surface-container-low hover:bg-surface-container text-brand-espresso font-semibold text-xs sm:text-sm border border-border-subtle transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-secondary shrink-0" />
              <span>Lihat Pengaturan Cabang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
