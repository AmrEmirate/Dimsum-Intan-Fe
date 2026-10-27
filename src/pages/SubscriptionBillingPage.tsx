import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  Zap,
  ShieldCheck,
  RefreshCw,
  QrCode,
  Receipt,
  X,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Infinity as InfinityIcon,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SubscriptionInvoice } from '../types';

export const OFFICIAL_SAAS_PLANS = [
  {
    code: 'PAKET_100K',
    name: 'Paket 1: Hemat',
    price: 100000,
    dailyTxLimit: 200,
    monthlyTxLimit: 6000,
    description: '200 transaksi per hari dihitung per bulan (6.000 tx/bln)',
    features: [
      '200 Transaksi / Hari (Akumulasi 6.000 Tx/Bulan)',
      'Kasir POS & Struk Realtime',
      'Manajemen Menu & Stok Bahan Pokok (HPP)',
      'Rekonsiliasi Shift & Tutup Kasir',
    ],
    color: 'from-cyan-500 to-blue-500',
    borderGlow: 'border-cyan-500/30 hover:border-cyan-500/60',
    badge: 'HEMAT',
  },
  {
    code: 'PAKET_150K',
    name: 'Paket 2: Bisnis',
    price: 150000,
    dailyTxLimit: 300,
    monthlyTxLimit: 9000,
    description: '300 transaksi per hari dihitung per bulan (9.000 tx/bln)',
    features: [
      '300 Transaksi / Hari (Akumulasi 9.000 Tx/Bulan)',
      'Multi-Outlet & Manajemen Karyawan',
      'Laporan Laba Rugi & Arus Kas Otomatis',
      'Faktur Supplier Pabrik & Beban Operasional',
    ],
    color: 'from-blue-500 to-indigo-500',
    borderGlow: 'border-blue-500/40 hover:border-blue-500/70',
    badge: 'POPULER',
    popular: true,
  },
  {
    code: 'PAKET_200K',
    name: 'Paket 3: Pro',
    price: 200000,
    dailyTxLimit: 500,
    monthlyTxLimit: 15000,
    description: '500 transaksi per hari dihitung per bulan (15.000 tx/bln)',
    features: [
      '500 Transaksi / Hari (Akumulasi 15.000 Tx/Bulan)',
      'Dukungan Transaksi Kasir Volume Tinggi',
      'Dashboard Analitik Performa Outlet',
      'Integrasi Payment Gateway QRIS & VA',
    ],
    color: 'from-amber-500 to-orange-500',
    borderGlow: 'border-amber-500/40 hover:border-amber-500/70',
    badge: 'PRO FLEET',
  },
  {
    code: 'PAKET_250K',
    name: 'Paket 4: Unlimited',
    price: 250000,
    dailyTxLimit: 0,
    monthlyTxLimit: 0,
    description: 'Unlimited transaksi selama sebulan (Tanpa Batas Kuota)',
    features: [
      'Transaksi UNLIMITED Tanpa Batas Kuota',
      'Bebas Transaksi Kasir Tanpa Takut Terkunci',
      'Prioritas Sinkronisasi Cloud Engine',
      'Semua Fitur POS, Akuntansi & Superadmin',
    ],
    color: 'from-purple-500 to-pink-500',
    borderGlow: 'border-purple-500/40 hover:border-purple-500/70',
    badge: 'UNLIMITED VIP',
  },
];

export const SubscriptionBillingPage: React.FC = () => {
  const {
    billingStatus,
    fetchBillingStatus,
    createCheckout,
    simulatePayInvoice,
    fetchBillingInvoices,
    createDuitkuSubscriptionCheckout,
  } = useApp();

  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutType, setCheckoutType] = useState<'CHANGE_PLAN' | 'RENEWAL' | 'ADD_OUTLET' | 'ADD_TX_QUOTA'>('CHANGE_PLAN');
  const [targetPlanCode, setTargetPlanCode] = useState<string>('PAKET_100K');
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
  const openCheckout = (type: 'CHANGE_PLAN' | 'RENEWAL' | 'ADD_OUTLET' | 'ADD_TX_QUOTA', defaultPlan?: string) => {
    setCheckoutType(type);
    if (defaultPlan) {
      setTargetPlanCode(defaultPlan);
    } else if (billingStatus?.plan) {
      setTargetPlanCode(billingStatus.plan);
    }
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
        targetPlan: targetPlanCode,
      });

      if (res.success && res.data) {
        const paymentData = { ...res.data };

        // Attempt Duitku Payment Gateway Checkout
        try {
          const duitkuRes = await createDuitkuSubscriptionCheckout({
            invoiceId: res.data.invoice.id,
            amount: Number(res.data.invoice.amount),
            planName: res.data.invoice.planName || 'Paket Langganan Dimsum Intan',
          });

          if (duitkuRes.success) {
            paymentData.gateway = 'DUITKU';
            if (duitkuRes.paymentUrl) paymentData.snapRedirectUrl = duitkuRes.paymentUrl;
            if (duitkuRes.qrString) paymentData.qrCodeUrl = duitkuRes.qrString;
          }
        } catch (duitkuErr) {
          console.warn('Fallback to standard gateway:', duitkuErr);
        }

        setActivePaymentInvoice(paymentData);
        await loadInvoices();

        // If Midtrans Snap is integrated and snapToken is available
        if (paymentData.gateway === 'MIDTRANS' && paymentData.snapToken && (window as any).snap) {
          (window as any).snap.pay(paymentData.snapToken, {
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

  const isUnlimited = billingStatus?.isUnlimited || billingStatus?.dailyTxLimitPerOutlet === 0;
  const currentPlan = OFFICIAL_SAAS_PLANS.find(
    (p) => p.code === billingStatus?.plan || p.code === billingStatus?.planDetails?.code
  ) || OFFICIAL_SAAS_PLANS[0];

  const pricePerOutlet = billingStatus?.pricePerOutlet || currentPlan.price;
  const currentOutlets = billingStatus?.currentOutletsCount || 1;
  const maxOutlets = billingStatus?.maxOutlets || 1;
  const dailyTxLimit = isUnlimited ? 0 : (billingStatus?.effectiveDailyTxLimit ?? billingStatus?.dailyTxLimitPerOutlet ?? 200);
  const monthlyTxLimit = isUnlimited ? 0 : (billingStatus?.effectiveMonthlyTxLimit ?? (dailyTxLimit * 30));
  const todayTxCount = billingStatus?.todayOrdersCount || 0;
  const monthTxCount = billingStatus?.monthOrdersCount || 0;

  const monthPercentage = isUnlimited
    ? 100
    : monthlyTxLimit > 0
    ? Math.min(100, Math.round((monthTxCount / monthlyTxLimit) * 100))
    : 0;

  // Compute calculated amounts for preview
  let previewAmount = pricePerOutlet;
  if (checkoutType === 'CHANGE_PLAN') {
    const selectedPlanObj = OFFICIAL_SAAS_PLANS.find((p) => p.code === targetPlanCode) || OFFICIAL_SAAS_PLANS[0];
    previewAmount = selectedPlanObj.price * maxOutlets;
  } else if (checkoutType === 'ADD_OUTLET') {
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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Langganan &amp; Kuota Platform</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {currentPlan.name}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                4 Pilihan Paket Resmi: <span className="text-cyan-400 font-bold">100K (200 Tx/hr)</span> •{' '}
                <span className="text-blue-400 font-bold">150K (300 Tx/hr)</span> •{' '}
                <span className="text-amber-400 font-bold">200K (500 Tx/hr)</span> •{' '}
                <span className="text-purple-400 font-bold">250K (Unlimited)</span> — Kuota dihitung per bulan
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
              1. Masa Aktif &amp; Paket
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
            <span className="text-xs text-slate-400">Tarif Aktif</span>
            <span className="text-sm font-bold text-orange-400 font-mono">
              Rp {pricePerOutlet.toLocaleString('id-ID')} / bln
            </span>
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
              <span className="text-sm font-normal text-slate-400">Slot Cabang Aktif</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (currentOutlets / maxOutlets) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {currentOutlets >= maxOutlets
                ? 'Kuota cabang penuh. Tambah slot cabang untuk membuka cabang outlet baru.'
                : `Tersedia slot untuk ${maxOutlets - currentOutlets} cabang outlet baru.`}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => openCheckout('ADD_OUTLET')}
              className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Building2 className="w-3.5 h-3.5" />
              Tambah Slot Cabang (+Rp {pricePerOutlet.toLocaleString('id-ID')}/bln)
            </button>
          </div>
        </div>

        {/* Card 3: Kuota Transaksi Bulanan */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-lg group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              3. Kuota Transaksi (Hitung Bulanan)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              {todayTxCount} Tx Hari Ini
            </span>
          </div>

          <div className="space-y-2 mb-6">
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
              {isUnlimited ? (
                <div className="flex items-center gap-2 text-purple-400">
                  <InfinityIcon className="w-7 h-7" />
                  <span>UNLIMITED</span>
                </div>
              ) : (
                <>
                  <span>{monthTxCount} / {monthlyTxLimit}</span>
                  <span className="text-xs font-normal text-slate-400 font-sans">Tx Bulan Ini</span>
                </>
              )}
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isUnlimited
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-full'
                    : monthPercentage >= 90
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: isUnlimited ? '100%' : `${monthPercentage}%` }}
              />
            </div>

            <p className="text-xs text-slate-400">
              {isUnlimited ? (
                <span className="text-purple-300 font-semibold">
                  Transaksi tanpa batas kuota selama sebulan. Bebas transaksi kasir kapan saja.
                </span>
              ) : monthTxCount >= monthlyTxLimit ? (
                <span className="text-rose-400 font-bold">
                  Batas kuota bulanan ({monthlyTxLimit} Tx) telah tercapai! Silakan top-up atau upgrade paket.
                </span>
              ) : (
                `Dihitung dari ${dailyTxLimit} tx/hari. Tersisa ${monthlyTxLimit - monthTxCount} transaksi bulan ini.`
              )}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => openCheckout('CHANGE_PLAN')}
              className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              Pilih / Upgrade Paket
            </button>
          </div>
        </div>
      </div>

      {/* 4 PILIHAN PAKET RESMI SAAS */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold text-white">4 Pilihan Paket Lisensi Resmi Cloud POS</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Seluruh kuota transaksi harian dihitung akumulatif per bulan (30 hari). Fleksibel untuk hari ramai &amp; sepi.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-3 py-1 bg-slate-800 text-slate-300 rounded-lg self-start sm:self-auto border border-slate-700">
            Biaya flat per cabang / bulan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {OFFICIAL_SAAS_PLANS.map((pkg) => {
            const isCurrent =
              pkg.code === billingStatus?.plan ||
              pkg.code === billingStatus?.planDetails?.code ||
              (pkg.code === 'PAKET_100K' && (billingStatus?.plan === 'STARTER' || billingStatus?.plan === 'REGULAR')) ||
              (pkg.code === 'PAKET_150K' && billingStatus?.plan === 'GROWTH') ||
              (pkg.code === 'PAKET_200K' && billingStatus?.plan === 'PRO') ||
              (pkg.code === 'PAKET_250K' && (billingStatus?.plan === 'ENTERPRISE' || billingStatus?.plan === 'UNLIMITED'));

            return (
              <div
                key={pkg.code}
                className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 border relative overflow-hidden ${
                  isCurrent
                    ? 'bg-slate-800/80 border-orange-500 shadow-xl shadow-orange-500/10 ring-2 ring-orange-500/20'
                    : `bg-slate-950/60 ${pkg.borderGlow}`
                }`}
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-white bg-gradient-to-r ${pkg.color}`}
                  >
                    {pkg.badge}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      AKTIF
                    </span>
                  )}
                </div>

                {/* Title & Price */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-base font-bold text-white tracking-tight">{pkg.name}</h3>
                  <div className="text-2xl font-black text-white font-mono">
                    Rp {pkg.price.toLocaleString('id-ID')}
                    <span className="text-xs font-normal text-slate-400"> /bln</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-orange-400">
                    {pkg.dailyTxLimit === 0 ? 'Unlimited Transaksi' : `${pkg.dailyTxLimit} Tx/Hari`}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {pkg.dailyTxLimit === 0
                      ? 'Bebas transaksi tanpa batas selama sebulan'
                      : `Dihitung perbulan = ${pkg.monthlyTxLimit.toLocaleString('id-ID')} tx/bln`}
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 py-4 border-t border-slate-800/80 text-xs text-slate-300 flex-1">
                  {pkg.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight text-[11px]">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-slate-800/80 mt-auto">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-800 text-emerald-400 text-xs font-bold font-mono border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Paket Sedang Digunakan
                    </button>
                  ) : (
                    <button
                      onClick={() => openCheckout('CHANGE_PLAN', pkg.code)}
                      className={`w-full py-2.5 rounded-xl text-white text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 shadow-md bg-gradient-to-r ${pkg.color} hover:brightness-110 cursor-pointer`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Pilih / Upgrade Paket Ini
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BREAKDOWN TRANSAKSI PER CABANG */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-white mb-0.5">Status Pemakaian Transaksi per Cabang Outlet</h2>
            <p className="text-xs text-slate-400">
              Transaksi kasir dihitung akumulatif per bulan (30 hari). Reset otomatis setiap pergantian bulan kalender.
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-slate-400 px-3 py-1 bg-slate-800/80 rounded-lg self-start sm:self-auto border border-slate-700">
            Total Transaksi Bulan Ini: <span className="text-white">{monthTxCount} Tx</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {billingStatus?.outlets?.map((o) => {
            const isOutletUnlimited = o.isUnlimited || isUnlimited || o.dailyLimit === 0;
            const outletMonthlyLimit = isOutletUnlimited ? 0 : (o.monthlyLimit || (o.dailyLimit * 30));
            const outletMonthOrders = o.monthOrders || 0;
            const pct = isOutletUnlimited
              ? 100
              : outletMonthlyLimit > 0
              ? Math.min(100, Math.round((outletMonthOrders / outletMonthlyLimit) * 100))
              : 0;

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
                    <span className="font-bold text-white">{o.todayOrders} Tx</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Bulan ini:</span>
                    <span className="font-bold text-white">
                      {isOutletUnlimited ? `${outletMonthOrders} Tx (Unlimited)` : `${outletMonthOrders} / ${outletMonthlyLimit} Tx`}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOutletUnlimited
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                          : pct >= 90
                          ? 'bg-rose-500'
                          : pct >= 70
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Sisa kuota bulan ini:</span>
                    <span className={isOutletUnlimited ? 'text-purple-400 font-bold' : 'text-emerald-400 font-semibold'}>
                      {isOutletUnlimited ? 'UNLIMITED' : `${o.remainingMonth || Math.max(0, outletMonthlyLimit - outletMonthOrders)} Tx`}
                    </span>
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
              Daftar transaksi langganan, ganti paket, tambah outlet, dan top up kuota via Payment Gateway
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
                        {inv.type === 'CHANGE_PLAN' || inv.type === 'UPGRADE_PLAN'
                          ? 'UPGRADE / GANTI PAKET'
                          : inv.type === 'ADD_OUTLET'
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setCheckoutType('CHANGE_PLAN')}
                    className={`py-2 rounded-lg transition-all ${
                      checkoutType === 'CHANGE_PLAN'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ganti Paket
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
                    Top Up Kuota
                  </button>
                </div>

                {/* Specific Options: CHANGE_PLAN */}
                {checkoutType === 'CHANGE_PLAN' && (
                  <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <label className="block text-xs font-semibold text-slate-300">
                      Pilih Paket SaaS yang Ingin Diaktifkan:
                    </label>
                    <div className="space-y-2">
                      {OFFICIAL_SAAS_PLANS.map((pkg) => (
                        <div
                          key={pkg.code}
                          onClick={() => setTargetPlanCode(pkg.code)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            targetPlanCode === pkg.code
                              ? 'bg-orange-500/10 border-orange-500 shadow-md ring-1 ring-orange-500/30'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{pkg.name}</span>
                              <span className="text-[10px] font-mono font-bold text-orange-400">
                                {pkg.dailyTxLimit === 0 ? 'Unlimited' : `${pkg.dailyTxLimit} Tx/Hari`}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {pkg.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold font-mono text-white">
                              Rp {pkg.price.toLocaleString('id-ID')}
                            </div>
                            <div className="text-[10px] text-slate-400">/ cabang / bln</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specific Options: ADD_OUTLET */}
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
                      Tarif: <span className="text-white font-bold">Rp {pricePerOutlet.toLocaleString('id-ID')} / cabang / bulan</span>.
                      Setiap cabang langsung mewarisi batas kuota paket aktif Anda ({isUnlimited ? 'Unlimited' : `${dailyTxLimit} Tx/Hari dihitung perbulan`}).
                    </p>
                  </div>
                )}

                {/* Specific Options: ADD_TX_QUOTA */}
                {checkoutType === 'ADD_TX_QUOTA' && (
                  <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <label className="block text-xs font-semibold text-slate-300">
                      Pilihan Paket Kuota Transaksi Tambahan:
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { count: 100 as const, price: 15000, label: '+100 Tx/hari (+3.000/bln)' },
                        { count: 250 as const, price: 25000, label: '+250 Tx/hari (+7.500/bln)' },
                        { count: 500 as const, price: 45000, label: '+500 Tx/hari (+15.000/bln)' },
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
                      Kuota tambahan ini akan ditambahkan ke batas kuota transaksi bulanan seluruh cabang.
                    </p>
                  </div>
                )}

                {/* Specific Options: RENEWAL */}
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
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
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
                    <span>
                      {activePaymentInvoice.gateway === 'DUITKU'
                        ? 'QRIS DUITKU PAYMENT GATEWAY'
                        : 'QRIS STANDAR PEMBAYARAN NASIONAL'}
                    </span>
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

                  {activePaymentInvoice.snapRedirectUrl && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <a
                        href={activePaymentInvoice.snapRedirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Halaman Checkout Duitku</span>
                      </a>
                    </div>
                  )}
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