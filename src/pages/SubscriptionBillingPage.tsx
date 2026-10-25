import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  QrCode,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Receipt,
  ArrowRight,
  ExternalLink,
  X,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SubscriptionInvoice } from '../types';

export const SubscriptionBillingPage: React.FC = () => {
  const { billingStatus, fetchBillingStatus, createCheckout, simulatePayInvoice, fetchBillingInvoices } = useApp();

  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutType, setCheckoutType] = useState<'ADD_OUTLET' | 'ADD_TX_QUOTA' | 'RENEWAL'>('ADD_OUTLET');
  const [outletQuantity, setOutletQuantity] = useState(1);
  const [txQuotaOption, setTxQuotaOption] = useState<100 | 250 | 500>(250);
  const [renewalMonths, setRenewalMonths] = useState(1);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<{
    invoice: SubscriptionInvoice;
    gateway: string;
    snapToken?: string;
    snapRedirectUrl?: string;
    qrCodeUrl?: string;
    vaNumber?: string;
  } | null>(null);

  const [isVerifyingPay, setIsVerifyingPay] = useState(false);

  // Load Invoices
  const loadInvoices = async () => {
    setIsLoadingInvoices(true);
    const data = await fetchBillingInvoices();
    setInvoices(data);
    setIsLoadingInvoices(false);
  };

  useEffect(() => {
    fetchBillingStatus();
    loadInvoices();
  }, [fetchBillingStatus]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInvoice(id);
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  // Open Checkout Modal for specific action
  const openCheckout = (type: 'ADD_OUTLET' | 'ADD_TX_QUOTA' | 'RENEWAL') => {
    setCheckoutType(type);
    setActivePaymentInvoice(null);
    setIsCheckoutModalOpen(true);
  };

  // Submit Checkout & Trigger Payment Gateway
  const handleProceedPayment = async () => {
    setIsCreatingCheckout(true);
    try {
      const res = await createCheckout({
        type: checkoutType,
        quantity: outletQuantity,
        extraTxQuota: txQuotaOption,
        months: renewalMonths,
      });

      if (res.success && res.data) {
        setActivePaymentInvoice(res.data);
        await loadInvoices();

        // If Midtrans Snap is integrated and snapToken is available
        if (res.data.gateway === 'MIDTRANS' && res.data.snapToken && (window as any).snap) {
          (window as any).snap.pay(res.data.snapToken, {
            onSuccess: async () => {
              await fetchBillingStatus();
              await loadInvoices();
              setIsCheckoutModalOpen(false);
            },
            onPending: async () => {
              await loadInvoices();
            },
            onError: () => {
              alert('Terjadi kendala pada gateway pembayaran.');
            },
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  // Instant Verification / Test Pay
  const handleVerifyInstantPayment = async () => {
    if (!activePaymentInvoice?.invoice?.id) return;
    setIsVerifyingPay(true);
    const success = await simulatePayInvoice(activePaymentInvoice.invoice.id);
    setIsVerifyingPay(false);
    if (success) {
      setActivePaymentInvoice(null);
      setIsCheckoutModalOpen(false);
      await fetchBillingStatus();
      await loadInvoices();
    }
  };

  const pricePerOutlet = billingStatus?.pricePerOutlet || 100000;
  const currentOutlets = billingStatus?.currentOutletsCount || 1;
  const maxOutlets = billingStatus?.maxOutlets || 1;
  const dailyTxLimit = billingStatus?.effectiveDailyTxLimit || 250;
  const todayTxCount = billingStatus?.todayOrdersCount || 0;
  const txPercentage = Math.min(100, Math.round((todayTxCount / dailyTxLimit) * 100));

  // Compute calculated amounts for preview
  let previewAmount = pricePerOutlet;
  if (checkoutType === 'ADD_OUTLET') {
    previewAmount = pricePerOutlet * outletQuantity;
  } else if (checkoutType === 'ADD_TX_QUOTA') {
    previewAmount = txQuotaOption <= 100 ? 15000 : txQuotaOption <= 250 ? 25000 : 45000;
  } else if (checkoutType === 'RENEWAL') {
    previewAmount = pricePerOutlet * maxOutlets * renewalMonths;
  }

  const mdrFee = Math.round(previewAmount * 0.007); // 0.7% MDR QRIS Resmi BI
  const totalAmount = previewAmount + mdrFee;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl text-white shadow-lg shadow-orange-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Langganan &amp; Kuota Platform</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Model langganan resmi <span className="text-orange-400 font-bold">Rp 100.000 / Cabang / Bulan</span> • Syarat kuota dasar{' '}
                <span className="text-cyan-400 font-bold">250 Transaksi / Hari per Cabang</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchBillingStatus();
              loadInvoices();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            Sinkronisasi Status
          </button>
          <button
            onClick={() => openCheckout('RENEWAL')}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
          >
            <Zap className="w-4 h-4" />
            Perpanjang Langganan
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Status Langganan & Masa Aktif */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-lg group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              1. Masa Aktif Langganan
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                billingStatus?.isSubscriptionActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {billingStatus?.isSubscriptionActive ? '● AKTIF' : '■ KEDALUWARSA'}
            </span>
          </div>

          <div className="space-y-2 mb-6">
            <div className="text-2xl font-black text-white font-mono">
              {billingStatus?.daysRemaining !== undefined ? `${billingStatus.daysRemaining} Hari Tersisa` : 'Aktif'}
            </div>
            <p className="text-xs text-slate-400">
              Jatuh Tempo:{' '}
              <span className="text-slate-200 font-semibold font-mono">
                {billingStatus?.subscriptionExpiresAt
                  ? new Date(billingStatus.subscriptionExpiresAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '30 Hari ke Depan'}
              </span>
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Tarif per Cabang</span>
            <span className="text-sm font-bold text-orange-400 font-mono">Rp 100.000 / bln</span>
          </div>
        </div>

        {/* Card 2: Kuota Cabang Outlet */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-lg group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              2. Kuota Cabang (Outlet)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {currentOutlets} / {maxOutlets} Cabang
            </span>
          </div>

          <div className="space-y-2 mb-6">
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
              <span>{maxOutlets}</span>
              <span className="text-sm font-normal text-slate-400">Kuota Outlet Berbayar</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (currentOutlets / maxOutlets) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {currentOutlets >= maxOutlets
                ? 'Kuota cabang penuh. Tambah kuota untuk membuka cabang baru.'
                : `Masih tersedia ${maxOutlets - currentOutlets} slot cabang baru.`}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => openCheckout('ADD_OUTLET')}
              className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Kuota Cabang (Rp 100.000/bln)
            </button>
          </div>
        </div>

        {/* Card 3: Kuota Transaksi Harian */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-lg group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              3. Kuota Transaksi Hari Ini
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              {todayTxCount} / {dailyTxLimit} Tx
            </span>
          </div>

          <div className="space-y-2 mb-6">
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
              <span>{dailyTxLimit}</span>
              <span className="text-sm font-normal text-slate-400">Tx / Hari per Cabang</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  txPercentage >= 90
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${txPercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {todayTxCount >= dailyTxLimit
                ? 'Batas harian tercapai. Tambah kuota untuk melanjutkan kasir.'
                : `Tersisa ${dailyTxLimit - todayTxCount} transaksi kasir untuk hari ini.`}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => openCheckout('ADD_TX_QUOTA')}
              className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              Beli Tambahan Kuota Transaksi
            </button>
          </div>
        </div>
      </div>

      {/* BREAKDOWN TRANSAKSI PER CABANG */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
        <h2 className="text-base font-bold text-white mb-1">Status Pemakaian Transaksi per Cabang</h2>
        <p className="text-xs text-slate-400 mb-6">
          Setiap cabang mendapatkan kuota dasar 250 transaksi per hari (reset otomatis setiap pukul 00:00 WIB)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {billingStatus?.outlets?.map((o) => {
            const pct = Math.min(100, Math.round((o.todayOrders / o.dailyLimit) * 100));
            return (
              <div key={o.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-400" />
                    <span className="font-bold text-white text-sm">{o.name}</span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-300">{o.code}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Hari ini:</span>
                    <span className="font-bold text-white">
                      {o.todayOrders} / {o.dailyLimit} Tx
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Sisa kuota</span>
                    <span className="text-emerald-400 font-semibold">{o.remaining} transaksi</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABEL RIWAYAT INVOICE PAYMENT GATEWAY */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-lg">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Riwayat Tagihan &amp; Payment Gateway</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar transaksi langganan, tambah outlet, dan top up kuota via Payment Gateway
            </p>
          </div>
          <button
            onClick={loadInvoices}
            disabled={isLoadingInvoices}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingInvoices ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-xs font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">No. Invoice</th>
                <th className="py-3.5 px-6">Tipe Pembayaran</th>
                <th className="py-3.5 px-6">Deskripsi</th>
                <th className="py-3.5 px-6">Nominal</th>
                <th className="py-3.5 px-6">Metode</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors font-mono text-xs">
                    <td className="py-4 px-6 text-cyan-400 font-bold flex items-center gap-2">
                      <span>{inv.invoiceNumber}</span>
                      <button
                        onClick={() => handleCopy(inv.invoiceNumber, inv.id)}
                        className="text-slate-500 hover:text-slate-300"
                        title="Salin nomor invoice"
                      >
                        {copiedInvoice === inv.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6 font-sans">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {inv.type === 'ADD_OUTLET'
                          ? 'TAMBAH CABANG'
                          : inv.type === 'ADD_TX_QUOTA'
                          ? 'TOP-UP TRANSAKSI'
                          : 'PERPANJANG LANGGANAN'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-sans text-slate-300">{inv.description}</td>
                    <td className="py-4 px-6 font-bold text-white">
                      Rp {Number(inv.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {inv.paymentMethod || 'QRIS / Midtrans'}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {inv.status === 'PAID' ? '● LUNAS' : '○ PENDING'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {inv.status === 'PENDING' ? (
                        <button
                          onClick={() => {
                            setActivePaymentInvoice({
                              invoice: inv,
                              gateway: 'SIMULATOR',
                              qrCodeUrl: `00020101021226670014ID.LINKAJA.WWW01189360091800000000000215${inv.invoiceNumber}0303UMI51440014ID.CO.QRIS.WWW0215ID10200000000005204549953033605406${Math.round(
                                Number(inv.amount)
                              )}5802ID5912DIMSUM_INTAN6007BANDUNG61054011562070703A016304ABCD`,
                              vaNumber: `88019${Math.floor(10000000 + Math.random() * 90000000)}`,
                            });
                            setIsCheckoutModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Bayar Sekarang
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs">
                          {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('id-ID') : 'Terverifikasi'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Belum ada riwayat tagihan invoice
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHECKOUT & PAYMENT GATEWAY */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {activePaymentInvoice ? 'Instruksi Pembayaran Digital' : 'Pilihan Paket & Checkout Tagihan'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Payment Gateway Terintegrasi • Potongan Ringan MDR QRIS Resmi BI (0.7%)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCheckoutModalOpen(false);
                  setActivePaymentInvoice(null);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: Form vs Payment Display */}
            {!activePaymentInvoice ? (
              <div className="space-y-6">
                {/* Mode Selector */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setCheckoutType('ADD_OUTLET')}
                    className={`py-2 rounded-lg transition-all ${
                      checkoutType === 'ADD_OUTLET'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tambah Cabang
                  </button>
                  <button
                    onClick={() => setCheckoutType('ADD_TX_QUOTA')}
                    className={`py-2 rounded-lg transition-all ${
                      checkoutType === 'ADD_TX_QUOTA'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tambah Transaksi
                  </button>
                  <button
                    onClick={() => setCheckoutType('RENEWAL')}
                    className={`py-2 rounded-lg transition-all ${
                      checkoutType === 'RENEWAL'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Perpanjang
                  </button>
                </div>

                {/* Specific Options */}
                {checkoutType === 'ADD_OUTLET' && (
                  <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <label className="block text-xs font-semibold text-slate-300">
                      Jumlah Tambahan Cabang Outlet:
                    </label>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setOutletQuantity(num)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                            outletQuantity === num
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          +{num} Cabang
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tarif flat: <span className="text-white font-bold">Rp 100.000 / cabang / bulan</span>. Setiap
                      cabang langsung mendapatkan kuota 250 transaksi / hari.
                    </p>
                  </div>
                )}

                {checkoutType === 'ADD_TX_QUOTA' && (
                  <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <label className="block text-xs font-semibold text-slate-300">
                      Pilihan Paket Kuota Transaksi Tambahan Harian:
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { count: 100 as const, price: 15000, label: '+100 Tx/hari' },
                        { count: 250 as const, price: 25000, label: '+250 Tx/hari' },
                        { count: 500 as const, price: 45000, label: '+500 Tx/hari' },
                      ].map((pkg) => (
                        <button
                          key={pkg.count}
                          type="button"
                          onClick={() => setTxQuotaOption(pkg.count)}
                          className={`p-3 rounded-xl text-center border transition-all ${
                            txQuotaOption === pkg.count
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold font-mono">{pkg.label}</div>
                          <div className="text-[11px] mt-1 text-slate-300 font-semibold">
                            Rp {pkg.price.toLocaleString('id-ID')}
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Kuota tambahan ini akan ditambahkan ke batas transaksi harian kasir per cabang.
                    </p>
                  </div>
                )}

                {checkoutType === 'RENEWAL' && (
                  <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <label className="block text-xs font-semibold text-slate-300">
                      Pilih Durasi Perpanjangan Langganan:
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { months: 1, label: '1 Bulan' },
                        { months: 3, label: '3 Bulan' },
                        { months: 12, label: '1 Tahun (12 Bln)' },
                      ].map((item) => (
                        <button
                          key={item.months}
                          type="button"
                          onClick={() => setRenewalMonths(item.months)}
                          className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                            renewalMonths === item.months
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Meng-cover seluruh {maxOutlets} cabang aktif seharga Rp {pricePerOutlet.toLocaleString('id-ID')}{' '}
                      / cabang / bulan.
                    </p>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Subtotal Tagihan:</span>
                    <span className="text-white font-bold">Rp {previewAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Potongan Biaya QRIS BI (0.7% MDR):</span>
                    <span className="text-emerald-400 font-semibold">Rp {mdrFee.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-bold">
                    <span className="text-white">Total Tagihan:</span>
                    <span className="text-orange-400 text-base">Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={handleProceedPayment}
                  disabled={isCreatingCheckout}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
                >
                  {isCreatingCheckout ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Menghubungkan ke Payment Gateway...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Lanjutkan ke Pembayaran Digital (QRIS / VA)
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* PAYMENT DISPLAY (QRIS & VA) */
              <div className="space-y-6 text-center">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-mono flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Invoice Terbit: {activePaymentInvoice.invoice.invoiceNumber}</span>
                </div>

                {/* QRIS Display Container */}
                <div className="p-6 bg-white rounded-2xl inline-block shadow-2xl border border-slate-200">
                  <div className="flex items-center justify-center gap-2 mb-3 pb-2 border-b border-slate-200 text-slate-900 font-black text-xs tracking-wider">
                    <QrCode className="w-4 h-4 text-rose-600" />
                    <span>QRIS STANDAR PEMBAYARAN NASIONAL</span>
                  </div>

                  {/* QRIS SVG / Visual Representation */}
                  <div className="w-48 h-48 mx-auto bg-slate-950 p-2 rounded-xl flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        activePaymentInvoice.qrCodeUrl || activePaymentInvoice.invoice.invoiceNumber
                      )}`}
                      alt="QRIS Digital Code"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>

                  <div className="mt-3 text-[11px] font-mono font-bold text-slate-800">
                    Total: Rp {Number(activePaymentInvoice.invoice.amount).toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Scan via BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, Dana
                  </div>
                </div>

                {/* Virtual Account / Bank Transfer Option */}
                {activePaymentInvoice.vaNumber && (
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono flex items-center justify-between">
                    <span className="text-slate-400">Nomor Virtual Account:</span>
                    <span className="text-cyan-400 font-bold tracking-wider">{activePaymentInvoice.vaNumber}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleVerifyInstantPayment}
                    disabled={isVerifyingPay}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    {isVerifyingPay ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Memverifikasi Bank...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Konfirmasi / Simulasikan Pembayaran Sukses
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setIsCheckoutModalOpen(false);
                      setActivePaymentInvoice(null);
                    }}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
