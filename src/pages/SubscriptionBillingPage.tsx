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
  Store,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Upload,
  Image as ImageIcon,
  Eye,
  Trash2,
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
    description: 'Kuota 6.000 transaksi per bulan',
    features: [
      '6.000 Transaksi / Bulan',
      'Kasir POS & Cetak Struk Realtime',
      'Manajemen Menu & Stok Bahan Pokok (HPP)',
      'Rekonsiliasi Shift & Tutup Kasir',
    ],
    badge: 'HEMAT',
    accentBorder: 'border-border-subtle hover:border-brand-gold/60',
    headerBg: 'bg-surface-container-low',
    badgeClass: 'bg-surface-container text-secondary',
  },
  {
    code: 'PAKET_150K',
    name: 'Paket 2: Bisnis Pro',
    price: 150000,
    dailyTxLimit: 300,
    monthlyTxLimit: 9000,
    description: 'Kuota 9.000 transaksi per bulan',
    features: [
      '9.000 Transaksi / Bulan',
      'Multi-Outlet & Manajemen Karyawan',
      'Laporan Laba Rugi & Arus Kas Otomatis',
      'Faktur Supplier Pabrik & Beban Operasional',
    ],
    badge: 'PALING POPULER',
    popular: true,
    accentBorder: 'border-brand-gold shadow-md ring-2 ring-brand-gold/20',
    headerBg: 'bg-brand-gold-subtle',
    badgeClass: 'bg-brand-gold text-brand-espresso font-bold',
  },
  {
    code: 'PAKET_200K',
    name: 'Paket 3: Pro Fleet',
    price: 200000,
    dailyTxLimit: 500,
    monthlyTxLimit: 15000,
    description: 'Kuota 15.000 transaksi per bulan',
    features: [
      '15.000 Transaksi / Bulan',
      'Dukungan Transaksi Kasir Volume Tinggi',
      'Dashboard Analitik Performa Multi-Cabang',
      'Integrasi Payment Gateway QRIS & VA Otomatis',
    ],
    badge: 'PRO CABANG',
    accentBorder: 'border-border-subtle hover:border-brand-terracotta/60',
    headerBg: 'bg-surface-container-low',
    badgeClass: 'bg-brand-terracotta/10 text-brand-terracotta font-bold border border-brand-terracotta/30',
  },
  {
    code: 'PAKET_250K',
    name: 'Paket 4: Unlimited VIP',
    price: 250000,
    dailyTxLimit: 0,
    monthlyTxLimit: 0,
    description: 'Unlimited transaksi per bulan (Tanpa Batas Kuota)',
    features: [
      'Transaksi UNLIMITED Tanpa Batas Kuota',
      'Bebas Transaksi Kasir Tanpa Takut Terkunci',
      'Prioritas Sinkronisasi Cloud Engine',
      'Akses Seluruh Fitur POS, Akuntansi & Superadmin',
    ],
    badge: 'UNLIMITED VIP',
    accentBorder: 'border-border-subtle hover:border-brand-espresso/60',
    headerBg: 'bg-surface-container-low',
    badgeClass: 'bg-brand-espresso text-brand-gold font-bold',
  },
];

export const SubscriptionBillingPage: React.FC = () => {
  const {
    billingStatus,
    fetchBillingStatus,
    createCheckout,
    submitManualPayment,
    fetchBillingInvoices,
    createDuitkuSubscriptionCheckout,
    showNotification,
  } = useApp();

  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutType, setCheckoutType] = useState<'CHANGE_PLAN' | 'RENEWAL' | 'ADD_OUTLET' | 'ADD_TX_QUOTA'>('CHANGE_PLAN');
  const [targetPlanCode, setTargetPlanCode] = useState<string>('PAKET_150K');
  const [outletQuantity, setOutletQuantity] = useState(1);
  const [txQuotaOption, setTxQuotaOption] = useState<100 | 250 | 500>(250);
  const [renewalMonths, setRenewalMonths] = useState(1);
  const [selectedOutletId, setSelectedOutletId] = useState<string>('all');
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<{
    invoice: SubscriptionInvoice;
    gateway: string;
    snapToken?: string;
    snapRedirectUrl?: string;
    qrCodeUrl?: string;
    vaNumber?: string;
  } | null>(null);

  // Manual QRIS Proof Submission States
  const [senderName, setSenderName] = useState('');
  const [senderBank, setSenderBank] = useState('BCA');
  const [proofImageBase64, setProofImageBase64] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [selectedProofModal, setSelectedProofModal] = useState<{
    image: string;
    invoiceNumber: string;
    senderName?: string;
    senderBank?: string;
    amount?: number;
    submittedAt?: string;
  } | null>(null);

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
    showNotification('Nomor invoice berhasil disalin!', 'info');
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  // Open Checkout Modal for specific action
  const openCheckout = (type: 'CHANGE_PLAN' | 'RENEWAL' | 'ADD_OUTLET' | 'ADD_TX_QUOTA', defaultPlan?: string) => {
    setCheckoutType(type);
    const activePlan = billingStatus?.plan || 'PAKET_100K';
    if (defaultPlan && defaultPlan !== activePlan) {
      setTargetPlanCode(defaultPlan);
    } else {
      const nextPlan = OFFICIAL_SAAS_PLANS.find((p) => p.code !== activePlan);
      setTargetPlanCode(nextPlan?.code || 'PAKET_150K');
    }
    setSelectedOutletId('all');
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
        targetOutletId: selectedOutletId !== 'all' ? selectedOutletId : undefined,
      });

      if (res.success && res.data) {
        const paymentData = { ...res.data };

        // Attempt Duitku Payment Gateway Checkout
        try {
          const duitkuRes = await createDuitkuSubscriptionCheckout({
            invoiceId: res.data.invoice.id,
            amount: Number(res.data.invoice.amount),
            planName: res.data.invoice.description || 'Paket Langganan Dimsum Intan',
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
              showNotification('Pembayaran berhasil diverifikasi!', 'success');
            },
            onPending: async () => {
              await loadInvoices();
              showNotification('Menunggu konfirmasi pembayaran gateway...', 'info');
            },
            onError: () => {
              showNotification('Terjadi kendala pada gateway pembayaran.', 'error');
            },
          });
        }
      }
    } catch (err) {
      console.error(err);
      showNotification('Gagal membuat tagihan checkout.', 'error');
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  // File selection for transfer proof (Converted to Base64)
  const handleProofFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('File harus berupa gambar (JPG, PNG, WebP)!', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Ukuran file maksimal 5MB!', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit transfer proof for Superadmin approval
  const handleSubmitProofPayment = async () => {
    if (!activePaymentInvoice?.invoice?.id) return;
    if (!senderName.trim()) {
      showNotification('Nama pengirim rekening / e-wallet wajib diisi!', 'warning');
      return;
    }
    if (!proofImageBase64) {
      showNotification('Foto bukti transfer QRIS wajib dilampirkan!', 'warning');
      return;
    }

    setIsSubmittingProof(true);
    try {
      const res = await submitManualPayment({
        invoiceId: activePaymentInvoice.invoice.id,
        senderName: senderName.trim(),
        senderBank,
        proofImage: proofImageBase64,
        notes: paymentNotes.trim(),
      });

      if (res?.success) {
        showNotification(
          'Bukti pembayaran QRIS berhasil dikirim! Menunggu persetujuan Superadmin.',
          'success'
        );
        setActivePaymentInvoice(null);
        setIsCheckoutModalOpen(false);
        setSenderName('');
        setProofImageBase64('');
        setPaymentNotes('');
        await fetchBillingStatus();
        await loadInvoices();
      }
    } catch (err: any) {
      showNotification(err?.message || 'Gagal mengirim bukti pembayaran.', 'error');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const isUnlimited = billingStatus?.isUnlimited || billingStatus?.dailyTxLimitPerOutlet === 0;
  const currentPlan = OFFICIAL_SAAS_PLANS.find(
    (p) => p.code === billingStatus?.plan || p.code === billingStatus?.planDetails?.code
  ) || OFFICIAL_SAAS_PLANS[0];

  const pricePerOutlet = billingStatus?.pricePerOutlet || currentPlan.price || 100000;
  const currentOutlets = billingStatus?.currentOutletsCount ?? 0;
  const maxOutlets = billingStatus?.maxOutlets ?? 1;
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
  let priceDifference = 0;
  if (checkoutType === 'CHANGE_PLAN') {
    const selectedPlanObj = OFFICIAL_SAAS_PLANS.find((p) => p.code === targetPlanCode) || OFFICIAL_SAAS_PLANS[0];
    const currentPrice = billingStatus?.pricePerOutlet || currentPlan.price || 100000;
    priceDifference = Math.max(0, selectedPlanObj.price - currentPrice);
    previewAmount = priceDifference;
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
    <div className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden animate-in fade-in duration-200 pb-16">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-surface-card border border-border-subtle p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-secondary mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Manajemen Lisensi Cloud POS
            </span>
            <span className="text-secondary/40">/</span>
            <span className="text-[11px] font-bold text-brand-espresso">Langganan &amp; Kuota</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif-title text-2xl lg:text-3xl font-bold text-brand-espresso tracking-tight">
              Langganan &amp; Kuota Transaksi
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-gold text-brand-espresso shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              {currentPlan.name}
            </span>
          </div>
          <p className="text-secondary text-sm mt-1">
            Kelola paket langganan resmi Cloud POS, sisa kuota transaksi outlet, dan perpanjangan lisensi Dimsum Intan.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              fetchBillingStatus();
              loadInvoices();
              showNotification('Status lisensi & kuota berhasil diperbarui!', 'info');
            }}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] bg-surface-card hover:bg-surface-container-low text-brand-espresso px-4 py-2.5 rounded-xl border border-border-subtle shadow-xs text-xs font-semibold transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4 text-secondary" />
            <span>Sinkronisasi</span>
          </button>
          <button
            onClick={() => openCheckout('ADD_OUTLET')}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] bg-surface-card hover:bg-surface-container-low text-brand-espresso px-4 py-2.5 rounded-xl border border-border-subtle shadow-xs text-xs font-bold transition-all active:scale-95"
          >
            <Building2 className="w-4 h-4 text-primary" />
            <span>+ Tambah Outlet</span>
          </button>
          <button
            onClick={() => openCheckout('RENEWAL')}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso px-5 py-2.5 rounded-xl shadow-xs text-xs font-bold transition-all active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>Perpanjang Langganan</span>
          </button>
        </div>
      </div>

      {/* 2. REALTIME QUOTA & METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Masa Aktif Lisensi */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-secondary uppercase">
                1. Masa Aktif &amp; Lisensi
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  billingStatus?.isSubscriptionActive
                    ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                    : 'bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border'
                }`}
              >
                {billingStatus?.isSubscriptionActive ? 'AKTIF' : 'KEDALUWARSA'}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-brand-espresso font-serif-title">
                {billingStatus?.daysRemaining !== undefined ? `${billingStatus.daysRemaining} Hari Lagi` : '30 Hari Lagi'}
              </div>
              <p className="text-xs text-secondary">
                Jatuh Tempo:{' '}
                <span className="font-semibold text-brand-espresso">
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
          </div>

          <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between">
            <span className="text-xs text-secondary">Tarif Aktif Bulanan</span>
            <span className="text-sm font-bold text-primary font-mono">
              Rp {pricePerOutlet.toLocaleString('id-ID')} / bln
            </span>
          </div>
        </div>

        {/* Card 2: Kuota Cabang Outlet */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-secondary uppercase">
                2. Kuota Outlet (Cabang)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-gold-subtle text-primary border border-brand-gold/30">
                {currentOutlets} / {maxOutlets} Cabang
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-brand-espresso font-serif-title flex items-baseline gap-2">
                <span>{currentOutlets} / {maxOutlets}</span>
                <span className="text-sm font-normal text-secondary">Slot Lisensi Kasir</span>
              </div>
              <p className="text-xs text-secondary">
                {currentOutlets === 0
                  ? `Belum ada cabang terdaftar (Tersedia ${maxOutlets} slot lisensi siap pakai).`
                  : `Dimsum Intan terhubung dengan ${currentOutlets} terminal outlet operasional.`}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-border-subtle">
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-brand-gold h-full rounded-full transition-all duration-500"
                style={{ width: `${maxOutlets > 0 ? Math.min(100, (currentOutlets / maxOutlets) * 100) : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-secondary">
              <span>Terpakai: {currentOutlets} Cabang ({Math.max(0, maxOutlets - currentOutlets)} Slot Tersedia)</span>
              <button
                onClick={() => openCheckout('ADD_OUTLET')}
                className="font-bold text-primary hover:underline"
              >
                + Tambah Slot
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Utilisasi Kuota Transaksi */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-secondary uppercase">
                3. Utilisasi Kuota Transaksi
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isUnlimited
                    ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                    : monthPercentage > 85
                    ? 'bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border'
                    : 'bg-status-pending-bg text-status-pending-text border border-status-pending-border'
                }`}
              >
                {isUnlimited ? 'UNLIMITED' : `${monthPercentage}% Terpakai`}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-brand-espresso font-serif-title">
                {isUnlimited ? (
                  <span className="flex items-center gap-1.5">
                    <InfinityIcon className="w-6 h-6 text-brand-gold" />
                    <span>Tanpa Batas</span>
                  </span>
                ) : (
                  <span>
                    {monthTxCount.toLocaleString('id-ID')} / {monthlyTxLimit.toLocaleString('id-ID')}{' '}
                    <span className="text-sm font-normal text-secondary">Tx</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary">
                Transaksi Hari Ini:{' '}
                <span className="font-semibold text-brand-espresso">
                  {todayTxCount} / {isUnlimited ? '∞' : dailyTxLimit} Tx
                </span>
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-border-subtle">
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mb-1.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isUnlimited ? 'bg-status-lunas-text' : monthPercentage > 85 ? 'bg-brand-terracotta' : 'bg-brand-gold'
                }`}
                style={{ width: `${monthPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-secondary">
              <span>{isUnlimited ? 'Bebas Transaksi' : `${(monthlyTxLimit - monthTxCount).toLocaleString('id-ID')} Tx Tersisa`}</span>
              <button
                onClick={() => openCheckout('ADD_TX_QUOTA')}
                className="font-bold text-primary hover:underline"
              >
                + Top Up Kuota
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. OFFICIAL 4 SUBSCRIPTION PLANS */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="font-serif-title text-xl font-bold text-brand-espresso">
              Pilihan Paket Resmi Cloud POS
            </h2>
            <p className="text-secondary text-xs mt-0.5">
              Semua paket sudah mencakup sinkronisasi realtime, HPP bahan baku, laporan laba rugi, dan dukungan printer kasir.
            </p>
          </div>
          <span className="text-xs text-secondary">
            Bisa di-upgrade sewaktu-waktu tanpa kehilangan data transaksi outlet.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {OFFICIAL_SAAS_PLANS.map((plan) => {
            const isCurrent = billingStatus?.plan === plan.code;
            return (
              <div
                key={plan.code}
                className={`bg-surface-card rounded-2xl border ${plan.accentBorder} p-5 flex flex-col justify-between transition-all relative overflow-hidden`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <span className="bg-brand-gold text-brand-espresso text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl shadow-xs">
                      POPULER
                    </span>
                  </div>
                )}

                <div>
                  <div className="mb-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2 ${plan.badgeClass}`}>
                      {plan.badge}
                    </span>
                    <h3 className="font-serif-title text-lg font-bold text-brand-espresso">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-secondary mt-0.5">{plan.description}</p>
                  </div>

                  <div className="mb-5 pb-4 border-b border-border-subtle">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-brand-espresso font-mono">
                        Rp {plan.price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-secondary">/ bln</span>
                    </div>
                    <span className="text-[11px] text-secondary mt-1 block">
                      {plan.dailyTxLimit === 0
                        ? 'Unlimited transaksi kasir'
                        : `Batas ritme ${plan.dailyTxLimit} tx / hari`}
                    </span>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-brand-espresso">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  {isCurrent ? (
                    <div className="w-full min-h-[44px] flex items-center justify-center bg-surface-container text-secondary text-xs font-bold rounded-xl border border-border-subtle cursor-default">
                      <Check className="w-4 h-4 mr-1.5 text-primary" />
                      Paket Saat Ini
                    </div>
                  ) : (
                    <button
                      onClick={() => openCheckout('CHANGE_PLAN', plan.code)}
                      className="w-full min-h-[44px] flex items-center justify-center bg-surface-card hover:bg-brand-gold text-brand-espresso hover:text-brand-espresso text-xs font-bold rounded-xl border border-border-strong hover:border-brand-gold shadow-xs transition-all active:scale-95"
                    >
                      <span>Pilih {plan.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. INVOICES & BILLING HISTORY TABLE */}
      <div className="bg-surface-card border border-border-subtle rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif-title text-lg font-bold text-brand-espresso">
              Riwayat Faktur &amp; Tagihan Langganan
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Daftar seluruh faktur langganan Cloud POS Dimsum Intan dan bukti pembayaran resmi.
            </p>
          </div>
          <button
            onClick={loadInvoices}
            disabled={isLoadingInvoices}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-1.5 bg-surface-card hover:bg-surface-container-low text-brand-espresso rounded-xl border border-border-subtle text-xs font-semibold transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-secondary ${isLoadingInvoices ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low text-secondary border-b border-border-subtle uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4">No. Faktur</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Rincian Paket</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-secondary">
                    {isLoadingInvoices ? 'Memuat riwayat faktur...' : 'Belum ada riwayat tagihan langganan.'}
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isPendingApproval = inv.status === 'PENDING_APPROVAL';
                  const isPending = inv.status === 'PENDING';
                  return (
                    <tr key={inv.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand-espresso">
                        <div className="flex items-center gap-1.5">
                          <span>{inv.invoiceNumber || inv.id.slice(0, 10)}</span>
                          <button
                            onClick={() => handleCopy(inv.invoiceNumber || inv.id, inv.id)}
                            title="Salin No. Faktur"
                            className="text-secondary hover:text-brand-espresso"
                          >
                            {copiedInvoice === inv.id ? (
                              <Check className="w-3.5 h-3.5 text-status-lunas-text" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-secondary">
                        {inv.createdAt
                          ? new Date(inv.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 font-medium text-brand-espresso">
                        {inv.description || inv.type || 'Paket Langganan'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-brand-espresso">
                        Rp {Number(inv.amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-secondary">
                        <span className="px-2 py-0.5 rounded-md bg-surface-container text-[11px] font-semibold">
                          {inv.paymentMethod || inv.paymentGatewayRef || 'QRIS'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isPaid
                              ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                              : isPendingApproval
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : isPending
                              ? 'bg-status-pending-bg text-status-pending-text border border-status-pending-border'
                              : 'bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border'
                          }`}
                        >
                          {isPaid ? 'LUNAS' : isPendingApproval ? 'MENUNGGU PERSETUJUAN' : isPending ? 'MENUNGGU PEMBAYARAN' : inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPendingApproval ? (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {(inv.metadata as any)?.proofImage ? (
                              <button
                                onClick={() =>
                                  setSelectedProofModal({
                                    image: (inv.metadata as any).proofImage,
                                    invoiceNumber: inv.invoiceNumber || inv.id,
                                    senderName: (inv.metadata as any).senderName,
                                    senderBank: (inv.metadata as any).senderBank,
                                    amount: Number(inv.amount),
                                    submittedAt: (inv.metadata as any).submittedAt || inv.createdAt,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-700" />
                                <span>Bukti</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-amber-800 font-medium">Verifikasi Admin</span>
                            )}
                          </div>
                        ) : isPending ? (
                          <button
                            onClick={() => {
                              setActivePaymentInvoice({
                                invoice: inv,
                                gateway: inv.paymentMethod || inv.paymentGatewayRef || 'QRIS',
                              });
                              setIsCheckoutModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Bayar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => showNotification(`Faktur ${inv.invoiceNumber} telah terverifikasi lunas.`, 'success')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-secondary text-xs font-semibold rounded-lg transition-all cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Struk</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CHECKOUT & PAYMENT MODAL */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-espresso/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-card border border-border-subtle rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-gold text-brand-espresso flex items-center justify-center shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-title text-lg font-bold text-brand-espresso">
                    {activePaymentInvoice ? 'Pembayaran Tagihan Lisensi' : 'Konfirmasi Transaksi Langganan'}
                  </h3>
                  <p className="text-xs text-secondary">
                    Cloud POS Dimsum Intan • Gateway QRIS &amp; Virtual Account
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCheckoutModalOpen(false);
                  setActivePaymentInvoice(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center text-secondary hover:text-brand-espresso transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Active Payment View vs Configuration Form */}
            {activePaymentInvoice ? (
              <div className="space-y-5">
                <div className="bg-surface-container-low border border-border-subtle p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-secondary uppercase block">Total Pembayaran</span>
                    <span className="text-xl font-bold font-mono text-brand-espresso">
                      Rp {Number(activePaymentInvoice.invoice.amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-status-pending-bg text-status-pending-text border border-status-pending-border">
                    Menunggu Pembayaran
                  </span>
                </div>

                {/* Official QRIS Container */}
                <div className="bg-surface-card border border-border-strong rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs">
                  <div className="p-3 bg-white rounded-2xl border border-border-strong shadow-xs flex flex-col items-center max-w-[240px] w-full">
                    <img
                      src="/qris.jpeg"
                      alt="QRIS Pembayaran Resmi Cloud POS Dimsum Intan"
                      className="w-full h-auto rounded-xl object-contain shadow-xs"
                    />
                    <span className="text-[10px] font-mono font-bold text-brand-espresso mt-2">
                      NMID: ID1024889210928
                    </span>
                    <span className="text-[9px] text-secondary">
                      PT PRO TEKNOLOGI / DIMSUM INTAN
                    </span>
                  </div>
                  <p className="text-xs font-bold text-brand-espresso mt-3">
                    Pindai QRIS Menggunakan BCA, Mandiri, BRI, BNI, GoPay, OVO, atau Dana
                  </p>
                  <p className="text-[11px] text-secondary mt-0.5">
                    Setelah melakukan pembayaran, mohon isi nama pengirim &amp; unggah bukti transfer di bawah ini.
                  </p>
                </div>

                {/* Transfer Proof Submission Form */}
                <div className="space-y-3.5 bg-surface-container-low p-4 rounded-2xl border border-border-subtle">
                  <div className="text-xs font-bold text-brand-espresso flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-brand-gold" />
                    <span>Konfirmasi Bukti Pembayaran QRIS</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-brand-espresso block mb-1">
                      Nama Pengirim Rekening / E-Wallet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Contoh: Budi Santoso / Siti Rahma"
                      className="w-full p-2.5 rounded-xl border border-border-strong bg-surface-card text-xs text-brand-espresso focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-brand-espresso block mb-1">
                        Bank / Platform Pengirim
                      </label>
                      <select
                        value={senderBank}
                        onChange={(e) => setSenderBank(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border-strong bg-surface-card text-xs text-brand-espresso focus:outline-none focus:ring-2 focus:ring-brand-gold cursor-pointer"
                      >
                        <option value="BCA">BCA (Bank Central Asia)</option>
                        <option value="Mandiri">Bank Mandiri</option>
                        <option value="BRI">Bank BRI</option>
                        <option value="BNI">Bank BNI</option>
                        <option value="BSI">BSI (Bank Syariah)</option>
                        <option value="GoPay">GoPay</option>
                        <option value="OVO">OVO</option>
                        <option value="Dana">DANA</option>
                        <option value="ShopeePay">ShopeePay</option>
                        <option value="Lainnya">Bank Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-brand-espresso block mb-1">
                        Unggah Foto Bukti Transfer <span className="text-red-500">*</span>
                      </label>
                      <label className="flex items-center justify-center p-2.5 rounded-xl border border-dashed border-border-strong bg-surface-card hover:bg-surface-container cursor-pointer transition-all text-xs text-secondary gap-1.5 min-h-[42px]">
                        <Upload className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                        <span className="truncate">
                          {proofImageBase64 ? 'Ganti Foto' : 'Pilih Foto Bukti'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProofFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {proofImageBase64 && (
                    <div className="rounded-xl overflow-hidden border border-border-strong p-2.5 bg-surface-card flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={proofImageBase64}
                          alt="Preview Bukti"
                          className="w-12 h-12 object-cover rounded-lg border border-border-subtle"
                        />
                        <div>
                          <span className="text-xs font-bold text-brand-espresso block">Bukti Siap Dikirim</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">Format gambar valid (Base64)</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProofImageBase64('')}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                        title="Hapus Bukti"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-brand-espresso block mb-1">
                      Catatan Tambahan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Contoh: Pembayaran upgrade paket gerai 1"
                      className="w-full p-2.5 rounded-xl border border-border-strong bg-surface-card text-xs text-brand-espresso focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleSubmitProofPayment}
                    disabled={isSubmittingProof || !proofImageBase64 || !senderName.trim()}
                    className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso font-bold text-sm rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmittingProof ? 'Mengirim Bukti Pembayaran...' : 'Kirim Bukti Pembayaran QRIS'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsCheckoutModalOpen(false);
                      setActivePaymentInvoice(null);
                    }}
                    className="w-full min-h-[44px] flex items-center justify-center text-secondary text-xs font-semibold hover:text-brand-espresso transition-colors cursor-pointer"
                  >
                    Tutup dan Bayar Nanti
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Form Selection */}
                {checkoutType === 'CHANGE_PLAN' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-brand-espresso block mb-2">Pilih Paket Tujuan</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {OFFICIAL_SAAS_PLANS.map((p) => {
                          const isCurrent = (billingStatus?.plan || 'PAKET_100K') === p.code;
                          const currentPrice = billingStatus?.pricePerOutlet || currentPlan.price || 100000;
                          const diff = Math.max(0, p.price - currentPrice);
                          return (
                            <button
                              key={p.code}
                              type="button"
                              disabled={isCurrent}
                              onClick={() => !isCurrent && setTargetPlanCode(p.code)}
                              className={`p-3 rounded-xl border text-left text-xs transition-all ${
                                isCurrent
                                  ? 'border-border-subtle bg-surface-container/50 opacity-50 cursor-not-allowed select-none text-secondary'
                                  : targetPlanCode === p.code
                                  ? 'border-brand-gold bg-brand-gold-subtle font-bold text-brand-espresso shadow-xs cursor-pointer ring-2 ring-brand-gold/20'
                                  : 'border-border-subtle bg-surface-card text-secondary hover:bg-surface-container-low cursor-pointer'
                              }`}
                            >
                              <div className="font-serif-title flex items-center justify-between">
                                <span className={isCurrent ? 'line-through text-secondary' : ''}>{p.name}</span>
                                {isCurrent && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-secondary font-mono font-bold">
                                    Sedang Dipakai
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-primary font-bold mt-1">
                                Rp {p.price.toLocaleString('id-ID')}/bln
                              </div>
                              <div className="text-[10px] mt-0.5">
                                {isCurrent ? (
                                  <span className="text-secondary italic">Paket Aktif (Tidak Dapat Dipilih)</span>
                                ) : diff > 0 ? (
                                  <span className="text-brand-terracotta font-bold">+Rp {diff.toLocaleString('id-ID')} (Biaya Selisih)</span>
                                ) : (
                                  <span className="text-secondary">Rp 0</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dropdown Pasangkan ke Outlet / Cabang Mana */}
                    <div>
                      <label className="text-xs font-bold text-brand-espresso block mb-1.5 flex items-center justify-between">
                        <span>Pasangkan Paket ke Cabang / Outlet</span>
                        <span className="text-[10px] text-secondary font-normal">Pilih gerai target</span>
                      </label>
                      <select
                        value={selectedOutletId}
                        onChange={(e) => setSelectedOutletId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border-strong bg-surface-card text-xs font-medium text-brand-espresso focus:outline-none focus:ring-2 focus:ring-brand-gold cursor-pointer"
                      >
                        <option value="all">Semua Cabang (Standar Tenant &amp; Cabang Baru)</option>
                        {billingStatus?.outlets && billingStatus.outlets.length > 0 ? (
                          billingStatus.outlets.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name} ({o.code}) — Kuota: {o.isUnlimited ? 'Unlimited' : `${o.monthlyLimit?.toLocaleString('id-ID')} tx/bln`}
                            </option>
                          ))
                        ) : (
                          <option value="new_primary">
                            Cabang Utama #1 (Belum ada gerai fisik terdaftar — otomatis dipasangkan saat cabang dibuat)
                          </option>
                        )}
                      </select>
                      <p className="text-[11px] text-secondary mt-1">
                        Paket baru dan batas kuota transaksi akan otomatis dipasangkan ke cabang yang Anda pilih.
                      </p>
                    </div>

                    {/* Banner Masa Aktif Tetap (Risiko Outlet) */}
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Masa Aktif Berjalan Tetap (Tidak Diperpanjang)</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Anda hanya membayar biaya selisih upgrade sebesar <strong className="text-amber-950">+Rp {priceDifference.toLocaleString('id-ID')}</strong>. Masa aktif paket tidak diperpanjang dan tetap mengikuti periode berjalan (aktif hingga <strong className="text-amber-950">{billingStatus?.subscriptionExpiresAt ? new Date(billingStatus.subscriptionExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '60 Hari'}</strong>).
                      </p>
                    </div>
                  </div>
                )}

                {checkoutType === 'RENEWAL' && (
                  <div>
                    <label className="text-xs font-bold text-brand-espresso block mb-2">Durasi Perpanjangan</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 3, 12].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setRenewalMonths(m)}
                          className={`p-3 rounded-xl border text-center text-xs transition-all ${
                            renewalMonths === m
                              ? 'border-brand-gold bg-brand-gold-subtle font-bold text-brand-espresso'
                              : 'border-border-subtle bg-surface-card text-secondary hover:bg-surface-container-low'
                          }`}
                        >
                          <div className="font-bold">{m} Bulan</div>
                          <div className="text-[10px] text-secondary mt-0.5">
                            {m === 12 ? 'Diskon Hemat' : 'Reguler'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {checkoutType === 'ADD_OUTLET' && (
                  <div>
                    <label className="text-xs font-bold text-brand-espresso block mb-2">Jumlah Slot Cabang Baru</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setOutletQuantity((prev) => Math.max(1, prev - 1))}
                        className="w-10 h-10 rounded-xl border border-border-strong flex items-center justify-center font-bold text-brand-espresso hover:bg-surface-container-low"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-base text-brand-espresso min-w-[40px] text-center">
                        {outletQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOutletQuantity((prev) => prev + 1)}
                        className="w-10 h-10 rounded-xl border border-border-strong flex items-center justify-center font-bold text-brand-espresso hover:bg-surface-container-low"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {checkoutType === 'ADD_TX_QUOTA' && (
                  <div>
                    <label className="text-xs font-bold text-brand-espresso block mb-2">Pilihan Top Up Kuota Ekstra</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([100, 250, 500] as const).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setTxQuotaOption(q)}
                          className={`p-3 rounded-xl border text-center text-xs transition-all ${
                            txQuotaOption === q
                              ? 'border-brand-gold bg-brand-gold-subtle font-bold text-brand-espresso'
                              : 'border-border-subtle bg-surface-card text-secondary hover:bg-surface-container-low'
                          }`}
                        >
                          <div className="font-bold">+{q} Tx</div>
                          <div className="text-[10px] text-primary font-mono mt-0.5">
                            Rp {q === 100 ? '15.000' : q === 250 ? '25.000' : '45.000'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Breakdown Calculation */}
                <div className="bg-surface-container-low border border-border-subtle p-4 rounded-2xl space-y-2 text-xs">
                  {checkoutType === 'CHANGE_PLAN' && (
                    <>
                      <div className="flex justify-between text-secondary">
                        <span>Paket Berjalan Saat Ini</span>
                        <span className="font-mono text-brand-espresso">
                          {currentPlan.name} (Rp {(billingStatus?.pricePerOutlet || currentPlan.price || 100000).toLocaleString('id-ID')})
                        </span>
                      </div>
                      <div className="flex justify-between text-secondary">
                        <span>Paket Tujuan Baru</span>
                        <span className="font-mono text-brand-espresso">
                          {OFFICIAL_SAAS_PLANS.find((p) => p.code === targetPlanCode)?.name || targetPlanCode} (Rp {(OFFICIAL_SAAS_PLANS.find((p) => p.code === targetPlanCode)?.price || 100000).toLocaleString('id-ID')})
                        </span>
                      </div>
                      <div className="flex justify-between text-brand-espresso font-semibold">
                        <span>Biaya Selisih Upgrade</span>
                        <span className="font-mono text-brand-terracotta font-bold">
                          +Rp {priceDifference.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </>
                  )}
                  {checkoutType !== 'CHANGE_PLAN' && (
                    <div className="flex justify-between text-secondary">
                      <span>Subtotal Biaya</span>
                      <span className="font-mono text-brand-espresso">Rp {previewAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-secondary">
                    <span>MDR QRIS / Pajak (0.7%)</span>
                    <span className="font-mono text-brand-espresso">Rp {mdrFee.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="pt-2 border-t border-border-subtle flex justify-between font-bold text-brand-espresso text-sm">
                    <span>Total Pembayaran</span>
                    <span className="font-mono text-primary font-bold">
                      Rp {totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="flex-1 min-h-[48px] rounded-xl border border-border-subtle text-secondary hover:text-brand-espresso font-semibold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedPayment}
                    disabled={isCreatingCheckout || (checkoutType === 'CHANGE_PLAN' && targetPlanCode === (billingStatus?.plan || 'PAKET_100K'))}
                    className="flex-1 min-h-[48px] rounded-xl bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-espresso font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{isCreatingCheckout ? 'Membuat Tagihan...' : 'Lanjut ke QRIS / VA'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. MODAL DETAIL / INSPEKSI BUKTI TRANSFER QRIS */}
      {selectedProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-espresso/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-card rounded-3xl border border-border-strong shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div>
                <h3 className="font-serif-title font-bold text-base text-brand-espresso">
                  Bukti Pembayaran QRIS
                </h3>
                <p className="text-xs text-secondary font-mono">
                  No. Faktur: {selectedProofModal.invoiceNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedProofModal(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary hover:text-brand-espresso cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-border-strong bg-black/5 flex items-center justify-center max-h-[50vh] p-2">
              <img
                src={selectedProofModal.image}
                alt="Bukti Transfer QRIS"
                className="max-h-[46vh] w-auto object-contain rounded-xl shadow-xs"
              />
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-2xl border border-border-subtle text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-secondary">Nama Pengirim:</span>
                <span className="font-bold text-brand-espresso">{selectedProofModal.senderName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Bank / Platform:</span>
                <span className="font-bold text-brand-espresso">{selectedProofModal.senderBank || 'QRIS'}</span>
              </div>
              {selectedProofModal.amount && (
                <div className="flex justify-between">
                  <span className="text-secondary">Nominal Tagihan:</span>
                  <span className="font-mono font-bold text-brand-espresso">
                    Rp {selectedProofModal.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedProofModal(null)}
              className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold text-brand-espresso transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
