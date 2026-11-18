import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Send,
  CreditCard,
  QrCode,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileText,
  Filter,
  Sparkles,
  HelpCircle,
  X,
  Copy,
  Check,
  Search,
  Calculator,
  Calendar,
  Store,
  ExternalLink,
  History,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WalletTransaction, WithdrawalRequest } from '../types';
import { api } from '../services/apiClient';
import { CustomSelect } from '../components/common/CustomSelect';
import { RupiahInput } from '../components/common/RupiahInput';

export const WalletWithdrawalPage: React.FC = () => {
  const {
    walletSummary,
    isLoadingWallet,
    fetchWalletSummary,
    requestWithdrawal,
    updateBankAccount,
    showNotification,
    currentUser,
    setCurrentView,
    outlets,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'mutasi' | 'penarikan'>('mutasi');
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<WalletTransaction | null>(null);

  // Loading States
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);
  const [isSubmittingCalc, setIsSubmittingCalc] = useState(false);
  const [hasCopiedAccount, setHasCopiedAccount] = useState(false);

  // Form Withdrawal Modal State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawNotes, setWithdrawNotes] = useState<string>('');

  // Inline Calculator Widget State
  const [calcAmount, setCalcAmount] = useState<string>('500000');
  const [calcNotes, setCalcNotes] = useState<string>('');

  // Form Bank Account State
  const [formBankName, setFormBankName] = useState<string>('BCA');
  const [formBankAccountNumber, setFormBankAccountNumber] = useState<string>('');
  const [formBankAccountName, setFormBankAccountName] = useState<string>('');

  useEffect(() => {
    fetchWalletSummary();
  }, [fetchWalletSummary]);

  useEffect(() => {
    if (walletSummary?.bankInfo) {
      setFormBankName(walletSummary.bankInfo.bankName || 'BCA');
      setFormBankAccountNumber(walletSummary.bankInfo.bankAccountNumber || '');
      setFormBankAccountName(walletSummary.bankInfo.bankAccountName || '');
    }
  }, [walletSummary?.bankInfo]);

  const currentBalance = walletSummary?.walletBalance || 0;
  const hasBankAccount = Boolean(
    walletSummary?.bankInfo?.bankAccountNumber && walletSummary?.bankInfo?.bankAccountName
  );

  // Quick Amount Presets
  const amountPresets = [50000, 100000, 250000, 500000];

  const handleCopyAccount = () => {
    if (walletSummary?.bankInfo?.bankAccountNumber) {
      navigator.clipboard.writeText(walletSummary.bankInfo.bankAccountNumber);
      setHasCopiedAccount(true);
      showNotification('Nomor rekening berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setHasCopiedAccount(false), 2000);
    }
  };

  const todayKey = new Date().toLocaleDateString('en-CA');
  const todayWithdrawal = (walletSummary?.recentWithdrawals || []).find((w) => {
    if (w.status === 'REJECTED') return false;
    return new Date(w.createdAt).toLocaleDateString('en-CA') === todayKey;
  });
  const hasWithdrawnToday = Boolean(todayWithdrawal);

  const handleOpenWithdraw = () => {
    if (hasWithdrawnToday) {
      showNotification(
        `Penarikan saldo dibatasi maksimal 1 kali per hari (${todayWithdrawal?.withdrawalNumber} sudah diajukan hari ini). Silakan ajukan lagi besok.`,
        'warning'
      );
      return;
    }
    if (!hasBankAccount) {
      showNotification('Harap atur rekening bank tujuan penarikan terlebih dahulu!', 'warning');
      setIsBankModalOpen(true);
      return;
    }
    setWithdrawAmount(String(currentBalance));
    setWithdrawNotes('');
    setIsWithdrawModalOpen(true);
  };

  const handleSubmitWithdrawModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasWithdrawnToday) {
      showNotification('Kuota penarikan hari ini sudah terpakai (maksimal 1× sehari).', 'warning');
      return;
    }
    const amountNum = Math.round(currentBalance);
    if (!amountNum || amountNum <= 0) {
      showNotification('Saldo dompet kosong, belum ada dana QRIS untuk ditarik!', 'error');
      return;
    }
    if (amountNum < 20000) {
      showNotification('Nominal penarikan minimal Rp 20.000!', 'error');
      return;
    }

    setIsSubmittingWithdraw(true);
    const success = await requestWithdrawal({
      amount: amountNum,
      bankName: walletSummary?.bankInfo.bankName || formBankName,
      bankAccountNumber: walletSummary?.bankInfo.bankAccountNumber || formBankAccountNumber,
      bankAccountName: walletSummary?.bankInfo.bankAccountName || formBankAccountName,
      notes: withdrawNotes,
    });
    setIsSubmittingWithdraw(false);

    if (success) {
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      setWithdrawNotes('');
    }
  };

  const handleSubmitCalcWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasWithdrawnToday) {
      showNotification(
        `Penarikan saldo dibatasi maksimal 1 kali per hari (${todayWithdrawal?.withdrawalNumber} sudah diajukan hari ini).`,
        'warning'
      );
      return;
    }
    if (!hasBankAccount) {
      showNotification('Harap atur rekening bank tujuan penarikan terlebih dahulu!', 'warning');
      setIsBankModalOpen(true);
      return;
    }

    const amountNum = Math.round(currentBalance);
    if (!amountNum || amountNum <= 0) {
      showNotification('Saldo dompet kosong, belum ada dana QRIS untuk ditarik!', 'error');
      return;
    }
    if (amountNum < 20000) {
      showNotification('Nominal penarikan minimal Rp 20.000!', 'error');
      return;
    }

    setIsSubmittingCalc(true);
    const success = await requestWithdrawal({
      amount: amountNum,
      bankName: walletSummary?.bankInfo.bankName || formBankName,
      bankAccountNumber: walletSummary?.bankInfo.bankAccountNumber || formBankAccountNumber,
      bankAccountName: walletSummary?.bankInfo.bankAccountName || formBankAccountName,
      notes: calcNotes || 'Penarikan via Kalkulator Widget',
    });
    setIsSubmittingCalc(false);

    if (success) {
      setCalcNotes('');
    }
  };

  const handleSubmitBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBankName || !formBankAccountNumber || !formBankAccountName) {
      showNotification('Semua kolom rekening bank wajib diisi!', 'error');
      return;
    }

    setIsSubmittingBank(true);
    const success = await updateBankAccount({
      bankName: formBankName,
      bankAccountNumber: formBankAccountNumber,
      bankAccountName: formBankAccountName,
    });
    setIsSubmittingBank(false);

    if (success) {
      setIsBankModalOpen(false);
    }
  };

  // Filtered Transactions
  const rawTransactions = walletSummary?.recentTransactions || [];
  const transactions = rawTransactions.filter((tx) => {
    // Type Filter
    if (filterType !== 'ALL' && tx.type !== filterType) {
      return false;
    }
    // Outlet Filter
    if (selectedOutletFilter !== 'ALL') {
      if (tx.outletId !== selectedOutletFilter && tx.outlet?.id !== selectedOutletFilter) {
        return false;
      }
    }
    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(q);
      const matchCat = tx.category?.toLowerCase().includes(q);
      const matchOutlet = tx.outlet?.name?.toLowerCase().includes(q);
      const matchRef = tx.referenceId?.toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchOutlet && !matchRef) {
        return false;
      }
    }
    return true;
  });

  const withdrawals = walletSummary?.recentWithdrawals || [];

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 animate-in fade-in duration-200">
      {/* ================= 1. EXECUTIVE HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-secondary mb-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Konsolidasi Finansial
            </span>
            <span className="text-secondary/40">/</span>
            <span className="text-[11px] font-bold text-brand-terracotta">
              Dompet Digital &amp; Penarikan Saldo
            </span>
          </div>
          <h1 className="font-serif-title text-2xl lg:text-3xl font-bold text-brand-espresso tracking-tight">
            Dompet Digital Kasir &amp; Rekening Penarikan
          </h1>
          <p className="font-sans text-xs text-secondary mt-1 max-w-2xl leading-relaxed">
            Arsip penampungan pendapatan khusus QRIS kasir multi-outlet, siap ditransfer ke rekening bank resmi operasional (wajib tarik habis sekaligus, bukan penyimpanan dana).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => fetchWalletSummary()}
            disabled={isLoadingWallet}
            className="min-h-[44px] px-3.5 py-2.5 bg-surface-card border border-border-strong rounded-xl hover:bg-surface-muted text-brand-espresso font-semibold text-xs shadow-2xs transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            title="Muat ulang saldo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWallet ? 'animate-spin' : ''}`} />
            <span>Segarkan Saldo</span>
          </button>

          <button
            onClick={() => handleOpenWithdraw()}
            className="min-h-[44px] px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>Tarik Saldo ke Bank</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ================= 2. SMART GATEWAY BANNER (BYOK) ================= */}
      <div className="bg-brand-gold-subtle border border-status-pending-border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-status-pending-bg border border-status-pending-border flex items-center justify-center shrink-0 text-brand-gold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-brand-espresso">
                Dompet Penampungan &amp; Pencairan Dana Terpusat
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border font-bold">
                Pencairan Langsung
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5 max-w-3xl leading-relaxed">
              Seluruh penerimaan pembayaran digital &amp; QRIS otomatis masuk ke saldo dompet outlet dan dapat ditarik langsung ke rekening bank terdaftar melalui halaman ini.
            </p>
          </div>
        </div>
      </div>

      {/* ================= 3. 4 METRIC SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Featured Hero Card (Dark Espresso) */}
        <div className="bg-brand-espresso text-surface-card rounded-2xl p-5 flex flex-col justify-between border border-brand-espresso shadow-md relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-brand-gold/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-brand-gold tracking-wider uppercase block">
                Saldo Aktif (Siap Ditarik)
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-status-lunas-border font-medium">
                  Tersedia untuk Transfer
                </span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="my-4">
            <div className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
              Rp {currentBalance.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-surface-variant mt-1">
              Akumulasi pendapatan digital kasir yang telah settle
            </p>
          </div>

          <div className="pt-2.5 border-t border-brand-espresso-muted flex items-center justify-between">
            <span className="text-[11px] text-surface-variant">SLA Bank: Real-Time BI-FAST</span>
            <button
              onClick={() => handleOpenWithdraw()}
              className="text-xs font-bold text-brand-gold hover:text-brand-gold-hover flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Tarik Cepat</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Total Saldo Masuk (QRIS Kasir) */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-secondary tracking-wider uppercase">
              Total Saldo Masuk
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border">
              CREDIT (+)
            </span>
          </div>

          <div className="my-4">
            <div className="text-2xl font-black font-mono text-emerald-700 tracking-tight">
              +Rp {(walletSummary?.totalCredited || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-secondary mt-1 leading-snug">
              Total penerimaan khusus QRIS kasir
            </p>
          </div>

          <div className="pt-2.5 border-t border-border-subtle text-[11px] text-secondary flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Khusus Pembayaran QRIS</span>
          </div>
        </div>

        {/* Card 3: Total Telah Ditarik */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-secondary tracking-wider uppercase">
              Total Telah Ditarik
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-brand-espresso">
              DEBIT (-)
            </span>
          </div>

          <div className="my-4">
            <div className="text-2xl font-black font-mono text-brand-terracotta tracking-tight">
              -Rp {(walletSummary?.totalDebited || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-secondary mt-1 leading-snug">
              Total dana sukses ditransfer ke rekening bank
            </p>
          </div>

          <div className="pt-2.5 border-t border-border-subtle text-[11px] text-secondary flex items-center gap-1.5 font-medium">
            <History className="w-3.5 h-3.5 text-brand-terracotta shrink-0" />
            <span>Pencairan aman ke rekening toko</span>
          </div>
        </div>

        {/* Card 4: Menunggu Transfer */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-secondary tracking-wider uppercase">
              Menunggu Transfer
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-pending-bg text-status-pending-text border border-status-pending-border">
              PENDING
            </span>
          </div>

          <div className="my-4">
            <div className="text-2xl font-black font-mono text-brand-espresso tracking-tight">
              Rp {(walletSummary?.pendingWithdrawalAmount || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-secondary mt-1 leading-snug">
              {walletSummary?.pendingWithdrawalCount || 0} pengajuan dalam proses keuangan
            </p>
          </div>

          <div className="pt-2.5 border-t border-border-subtle text-[11px] text-status-pending-text font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>SLA Kliring Maksimal 1x24 Jam</span>
          </div>
        </div>
      </div>

      {/* ================= 4. REKENING BANK TERDAFTAR CARD ================= */}
      <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-black text-blue-900 text-base tracking-wider shrink-0 shadow-2xs">
              {walletSummary?.bankInfo?.bankName ? walletSummary.bankInfo.bankName.slice(0, 4).toUpperCase() : 'BANK'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-brand-espresso">
                  Rekening Penampungan Utama Pencairan
                </span>
                {hasBankAccount ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    REKENING TERDAFTAR
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border">
                    BELUM DIVERIFIKASI
                  </span>
                )}
              </div>

              {hasBankAccount ? (
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-sm font-mono font-bold text-brand-espresso">
                    {walletSummary?.bankInfo.bankAccountNumber}
                  </span>
                  <button
                    onClick={handleCopyAccount}
                    className="text-xs text-brand-terracotta hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    type="button"
                  >
                    {hasCopiedAccount ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                  <span className="text-xs text-secondary font-medium">
                    • Bank {walletSummary?.bankInfo.bankName}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-secondary mt-1">
                  Atur nomor rekening Anda untuk memulai penarikan omzet kasir langsung ke bank.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsBankModalOpen(true)}
            className="min-h-[40px] px-4 py-2 border border-border-strong hover:bg-surface-muted rounded-xl text-xs font-bold text-brand-espresso transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
            type="button"
          >
            {hasBankAccount ? 'Ubah Rekening Bank' : 'Atur Rekening Sekarang'}
          </button>
        </div>

        {/* 3-Column Info Subgrid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3.5 text-xs text-secondary">
          <div>
            <span className="font-bold text-[11px] block uppercase tracking-wider text-secondary">
              Nama Pemilik Rekening
            </span>
            <span className="font-bold text-brand-espresso text-xs mt-0.5 block truncate">
              {walletSummary?.bankInfo?.bankAccountName || 'Belum Dikonfigurasi'}
            </span>
          </div>
          <div>
            <span className="font-bold text-[11px] block uppercase tracking-wider text-secondary">
              Biaya Transfer Operasional
            </span>
            <span className="font-bold text-emerald-700 text-xs mt-0.5 block">
              Rp 0 (Bebas Biaya Admin - Merchant Prioritas)
            </span>
          </div>
          <div>
            <span className="font-bold text-[11px] block uppercase tracking-wider text-secondary">
              Jadwal Audit Otomatis
            </span>
            <span className="font-bold text-brand-espresso text-xs mt-0.5 block">
              Setiap Penutupan Shift Malam (22:30 WIB)
            </span>
          </div>
        </div>
      </div>

      {/* ================= 5. MAIN WORKSPACE: FULL-WIDTH LEDGER ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MAIN: AUDIT LEDGER TABLE (12 COLS) */}
        <div className="lg:col-span-12 bg-surface-card border border-border-subtle rounded-2xl shadow-2xs flex flex-col overflow-hidden">
          {/* Tab Navigation Header */}
          <div className="flex items-center border-b border-border-subtle px-4 pt-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('mutasi')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'mutasi'
                  ? 'border-brand-terracotta text-brand-terracotta'
                  : 'border-transparent text-secondary hover:text-brand-espresso'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Buku Kas &amp; Riwayat Mutasi Saldo</span>
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-secondary-container text-brand-espresso font-bold font-mono">
                {rawTransactions.length} Entri
              </span>
            </button>

            <button
              onClick={() => setActiveTab('penarikan')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-all cursor-pointer whitespace-nowrap ml-2 ${
                activeTab === 'penarikan'
                  ? 'border-brand-terracotta text-brand-terracotta'
                  : 'border-transparent text-secondary hover:text-brand-espresso'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Riwayat Pengajuan Tarik Saldo</span>
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-surface-container text-secondary font-bold font-mono">
                {withdrawals.length} Pengajuan
              </span>
            </button>
          </div>

          {/* TAB 1: MUTASI SALDO */}
          {activeTab === 'mutasi' && (
            <div className="flex flex-col flex-1">
              {/* Filter Bar */}
              <div className="p-3 sm:p-4 border-b border-border-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface-container-low/40">
                {/* Segmented Type Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      filterType === 'ALL'
                        ? 'bg-brand-espresso text-white'
                        : 'bg-surface-card hover:bg-surface-muted border border-border-strong text-brand-espresso'
                    }`}
                  >
                    Semua Mutasi
                  </button>
                  <button
                    onClick={() => setFilterType('CREDIT')}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      filterType === 'CREDIT'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-surface-card hover:bg-surface-muted border border-border-strong text-brand-espresso'
                    }`}
                  >
                    Saldo Masuk (+)
                  </button>
                  <button
                    onClick={() => setFilterType('DEBIT')}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      filterType === 'DEBIT'
                        ? 'bg-brand-terracotta text-white'
                        : 'bg-surface-card hover:bg-surface-muted border border-border-strong text-brand-espresso'
                    }`}
                  >
                    Saldo Keluar (-)
                  </button>
                </div>

                {/* Outlet & Search Filter */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <CustomSelect
                    size="sm"
                    className="w-auto min-w-[200px]"
                    value={selectedOutletFilter}
                    onChange={(val) => setSelectedOutletFilter(val)}
                    options={[
                      { value: 'ALL', label: 'Semua Cabang (Konsolidasi)' },
                      ...outlets.map((o) => ({
                        value: o.id,
                        label: o.name,
                        badge: o.code,
                      })),
                    ]}
                  />

                  <div className="relative w-full sm:w-44">
                    <input
                      type="text"
                      placeholder="Cari #TRX / Bukti..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="min-h-[36px] w-full text-xs bg-surface-card border border-border-strong rounded-lg pl-8 pr-2.5 py-1.5 text-brand-espresso placeholder-secondary/60 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-secondary" />
                  </div>
                </div>
              </div>

              {/* Mutasi Table */}
              <div className="overflow-x-auto flex-1">
                {transactions.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-high mx-auto flex items-center justify-center text-secondary">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-brand-espresso">
                      Tidak Ada Catatan Mutasi yang Sesuai
                    </h3>
                    <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                      Mutasi saldo otomatis tercatat saat kasir menerima pembayaran pesanan pelanggan atau saat Anda mengajukan penarikan dana ke rekening bank.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary font-mono text-[11px] border-b border-border-subtle uppercase">
                        <th className="py-3 px-3.5 font-bold tracking-wider">Waktu &amp; Tanggal</th>
                        <th className="py-3 px-3 font-bold tracking-wider">Tipe</th>
                        <th className="py-3 px-3 font-bold tracking-wider">Sumber &amp; Outlet</th>
                        <th className="py-3 px-3 text-right font-bold tracking-wider">Saldo Awal</th>
                        <th className="py-3 px-3 text-right font-bold tracking-wider">Mutasi</th>
                        <th className="py-3 px-3 text-right font-bold tracking-wider">Saldo Akhir</th>
                        <th className="py-3 px-3.5 text-center font-bold tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {transactions.map((tx) => {
                        const isCredit = tx.type === 'CREDIT';
                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-brand-gold-subtle/40 transition-colors"
                          >
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="font-bold text-brand-espresso">
                                {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                              <div className="text-[11px] font-mono text-secondary">
                                {new Date(tx.createdAt).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                WIB
                              </div>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] inline-block ${
                                  isCredit
                                    ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                                    : 'bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border'
                                }`}
                              >
                                {isCredit ? '+MASUK' : '-KELUAR'}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-bold text-brand-espresso max-w-xs truncate">
                                {tx.description}
                              </div>
                              <div className="text-[11px] text-secondary mt-0.5">
                                {tx.outlet ? `Cabang: ${tx.outlet.name}` : `Kategori: ${tx.category}`}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right font-mono text-secondary whitespace-nowrap">
                              Rp {Number(tx.balanceBefore).toLocaleString('id-ID')}
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-black whitespace-nowrap">
                              <span
                                className={
                                  isCredit ? 'text-emerald-700' : 'text-brand-terracotta'
                                }
                              >
                                {isCredit ? '+' : '-'}Rp {Number(tx.amount).toLocaleString('id-ID')}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-bold text-brand-espresso whitespace-nowrap">
                              Rp {Number(tx.balanceAfter).toLocaleString('id-ID')}
                            </td>

                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedTxForDetail(tx)}
                                className="px-2.5 py-1 bg-surface-muted hover:bg-border-strong rounded-lg text-[11px] font-bold text-brand-espresso transition-colors cursor-pointer"
                                type="button"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Table Footer */}
              <div className="p-3 border-t border-border-subtle flex items-center justify-between text-xs text-secondary bg-surface-container-low/30">
                <span>
                  Menampilkan <strong className="text-brand-espresso">{transactions.length}</strong> catatan mutasi
                </span>
                <span className="text-[11px] text-secondary font-mono">Audit Real-Time</span>
              </div>
            </div>
          )}

          {/* TAB 2: PENARIKAN SALDO */}
          {activeTab === 'penarikan' && (
            <div className="flex flex-col flex-1">
              <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-container-low/40">
                <div>
                  <h3 className="text-sm font-bold text-brand-espresso">
                    Daftar Permohonan Pencairan Saldo
                  </h3>
                  <p className="text-xs text-secondary">
                    Lacak status persetujuan dan pengiriman dana ke rekening bank operasional.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenWithdraw()}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tarik Saldo Baru</span>
                </button>
              </div>

              <div className="overflow-x-auto flex-1">
                {withdrawals.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-high mx-auto flex items-center justify-center text-secondary">
                      <Send className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-brand-espresso">
                      Belum Ada Permohonan Penarikan
                    </h3>
                    <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                      Kumpulkan omzet transaksi QRIS kasir Anda dan ajukan pencairan ke rekening bank kapan saja.
                    </p>
                    <button
                      onClick={() => handleOpenWithdraw()}
                      className="min-h-[40px] px-4 py-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ajukan Penarikan Sekarang</span>
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary font-mono text-[11px] border-b border-border-subtle uppercase">
                        <th className="py-3 px-3.5 font-bold tracking-wider">No. Penarikan</th>
                        <th className="py-3 px-3 font-bold tracking-wider">Waktu Pengajuan</th>
                        <th className="py-3 px-3 font-bold tracking-wider">Rekening Tujuan</th>
                        <th className="py-3 px-3 text-right font-bold tracking-wider">Nominal Tarik</th>
                        <th className="py-3 px-3 text-center font-bold tracking-wider">Status</th>
                        <th className="py-3 px-3.5 font-bold tracking-wider">Keterangan / Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {withdrawals.map((w) => {
                        return (
                          <tr
                            key={w.id}
                            className="hover:bg-brand-gold-subtle/40 transition-colors"
                          >
                            <td className="py-3 px-3.5 font-mono font-bold text-brand-espresso whitespace-nowrap">
                              {w.withdrawalNumber}
                            </td>

                            <td className="py-3 px-3 font-mono text-secondary whitespace-nowrap">
                              {new Date(w.createdAt).toLocaleString('id-ID', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-bold text-brand-espresso">
                                {w.bankName} - {w.bankAccountNumber}
                              </div>
                              <div className="text-[11px] text-secondary">
                                a/n {w.bankAccountName}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-black text-brand-espresso whitespace-nowrap">
                              Rp {Number(w.amount).toLocaleString('id-ID')}
                              {w.fee > 0 && (
                                <div className="text-[10px] text-secondary font-normal">
                                  Biaya: Rp {Number(w.fee).toLocaleString('id-ID')}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] inline-flex items-center gap-1 ${
                                  w.status === 'PROCESSED'
                                    ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                                    : w.status === 'REJECTED'
                                    ? 'bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border'
                                    : 'bg-status-pending-bg text-status-pending-text border border-status-pending-border'
                                }`}
                              >
                                {w.status === 'PROCESSED' ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    DITRANSFER
                                  </>
                                ) : w.status === 'REJECTED' ? (
                                  <>
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    DITOLAK
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    PENDING
                                  </>
                                )}
                              </span>
                            </td>

                            <td className="py-3 px-3.5">
                              {w.status === 'REJECTED' && (
                                <span className="text-rose-700 text-xs font-semibold">
                                  {w.rejectionReason || 'Alasan administratif keuangan'}
                                </span>
                              )}
                              {w.status === 'PROCESSED' && (
                                <span className="text-emerald-700 text-xs font-semibold">
                                  Sukses ditransfer pada{' '}
                                  {w.processedAt
                                    ? new Date(w.processedAt).toLocaleDateString('id-ID')
                                    : 'Hari ini'}
                                </span>
                              )}
                              {w.status === 'PENDING' && (
                                <span className="text-secondary text-xs">
                                  Sedang diverifikasi bagian keuangan
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* OPERATIONAL NOTICE (12 COLS) */}
        <div className="lg:col-span-12">
          <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 text-xs space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-brand-espresso font-bold">
              <Clock className="w-4 h-4 text-brand-terracotta" />
              <span>Ketentuan Penarikan Saldo Outlet</span>
            </div>
            <p className="text-secondary leading-relaxed">
              Setiap pengajuan penarikan wajib menarik seluruh saldo QRIS aktif (100%) dan dibatasi maksimal 1 kali per hari. Penarikan di atas pukul 22:00 WIB akan diproses melalui batch sistem otomatis buku besar penutupan kasir shift malam.
            </p>
          </div>
        </div>
      </div>

      {/* ================= MODAL 1: FORM PENARIKAN SALDO LENGKAP ================= */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-surface-card border border-border-strong shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-gold/20 text-brand-espresso">
                  <Send className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-brand-espresso font-serif-title">
                  Tarik Saldo ke Rekening Bank
                </h2>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 rounded-lg text-secondary hover:text-brand-espresso cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWithdrawModal} className="space-y-4">
              {/* Saldo Aktif Info */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between">
                <span className="text-xs text-secondary font-medium">Saldo yang Dapat Ditarik:</span>
                <span className="text-base font-black font-mono text-emerald-700">
                  Rp {currentBalance.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Rekening Tujuan Box */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-brand-espresso space-y-1">
                <div className="font-bold flex items-center justify-between">
                  <span>Transfer ke:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWithdrawModalOpen(false);
                      setIsBankModalOpen(true);
                    }}
                    className="text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    Ganti Rekening
                  </button>
                </div>
                <div className="font-mono text-xs font-bold">
                  {walletSummary?.bankInfo.bankName} - {walletSummary?.bankInfo.bankAccountNumber}
                </div>
                <div className="text-secondary text-[11px]">
                  a/n {walletSummary?.bankInfo.bankAccountName}
                </div>
              </div>

              {/* Nominal Penarikan (Wajib Tarik Habis 100%) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-espresso block">
                  Nominal Penarikan (Wajib Tarik Habis 100%)
                </label>
                <div className="p-3 rounded-xl bg-brand-gold-subtle/60 border border-brand-gold/40 flex items-center justify-between">
                  <span className="text-base font-bold font-mono text-brand-espresso">
                    Rp {currentBalance.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-espresso text-brand-gold">
                    100% Saldo Aktif
                  </span>
                </div>
                <p className="text-[11px] text-secondary">
                  Dompet ini bukan penyimpanan uang. Seluruh saldo QRIS aktif akan langsung dicairkan sekaligus (minimal Rp 20.000).
                </p>
              </div>

              {/* Catatan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-espresso">Catatan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Pencairan omzet kasir minggu ke-4"
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-card text-xs text-brand-espresso border border-border-subtle focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
              </div>

              {/* Rincian Ringkasan */}
              <div className="p-3 rounded-xl bg-surface-container-low text-xs space-y-1.5 font-medium border border-border-subtle">
                <div className="flex justify-between text-secondary">
                  <span>Biaya Layanan Transfer:</span>
                  <span className="font-bold text-emerald-700">Rp 0 (Bebas Biaya)</span>
                </div>
                <div className="flex justify-between text-brand-espresso font-bold pt-1 border-t border-border-subtle">
                  <span>Total Diterima di Rekening:</span>
                  <span className="font-mono text-brand-terracotta">
                    Rp {currentBalance.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="min-h-[42px] px-4 py-2.5 rounded-xl text-xs font-bold text-secondary hover:bg-surface-container cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw}
                  className="min-h-[42px] px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingWithdraw ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim Permohonan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Konfirmasi Penarikan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: FORM PENGATURAN REKENING BANK ================= */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-surface-card border border-border-strong shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-brand-espresso font-serif-title">
                  Rekening Bank Pencairan Dana
                </h2>
              </div>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="p-1 rounded-lg text-secondary hover:text-brand-espresso cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBank} className="space-y-4">
              <div className="space-y-1">
                <CustomSelect
                  label="Nama Bank *"
                  size="md"
                  searchable
                  value={formBankName}
                  onChange={(val) => setFormBankName(val)}
                  options={[
                    { value: 'BCA', label: 'BCA (Bank Central Asia)', badge: 'Rekomendasi' },
                    { value: 'Bank Mandiri', label: 'Bank Mandiri', badge: 'BUMN' },
                    { value: 'BRI', label: 'BRI (Bank Rakyat Indonesia)', badge: 'BUMN' },
                    { value: 'BNI', label: 'BNI (Bank Negara Indonesia)', badge: 'BUMN' },
                    { value: 'Bank Syariah Indonesia', label: 'BSI (Bank Syariah Indonesia)', badge: 'Syariah' },
                    { value: 'CIMB Niaga', label: 'CIMB Niaga' },
                    { value: 'Permata Bank', label: 'Permata Bank' },
                    { value: 'Bank Jago', label: 'Bank Jago', badge: 'Digital' },
                    { value: 'SeaBank', label: 'SeaBank', badge: 'Digital' },
                    { value: 'Bank Lainnya', label: 'Bank Lainnya' },
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-espresso">
                  Nomor Rekening Bank *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 8830123456"
                  value={formBankAccountNumber}
                  onChange={(e) => setFormBankAccountNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-card text-xs font-mono font-bold text-brand-espresso border border-border-strong focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-espresso">
                  Nama Pemilik Rekening (Sesuai Buku Tabungan) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: DIMSUM INTAN OFFICIAL"
                  value={formBankAccountName}
                  onChange={(e) => setFormBankAccountName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-card text-xs font-bold uppercase text-brand-espresso border border-border-strong focus:outline-none"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low text-xs text-secondary flex items-start gap-2 border border-border-subtle">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[11px]">
                  Pastikan nama dan nomor rekening sesuai dengan data di buku tabungan agar proses transfer otomatis BI-FAST tidak mengalami penolakan.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="min-h-[42px] px-4 py-2.5 rounded-xl text-xs font-bold text-secondary hover:bg-surface-container cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBank}
                  className="min-h-[42px] px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingBank ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan Rekening...</span>
                    </>
                  ) : (
                    <span>Simpan Rekening</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: DETAIL MUTASI SALDO ================= */}
      {selectedTxForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-surface-card border border-border-strong shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-gold/15 text-brand-espresso">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-brand-espresso font-serif-title">
                    Rincian Audit Mutasi Saldo
                  </h2>
                  <p className="text-[11px] text-secondary">
                    Log pencatatan mutasi transaksi keuangan kasir
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTxForDetail(null)}
                className="p-1 rounded-lg text-secondary hover:text-brand-espresso cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                    Nominal Mutasi
                  </span>
                  <span
                    className={`text-xl font-bold font-mono ${
                      selectedTxForDetail.type === 'CREDIT'
                        ? 'text-emerald-700'
                        : 'text-brand-terracotta'
                    }`}
                  >
                    {selectedTxForDetail.type === 'CREDIT' ? '+' : '-'}Rp{' '}
                    {Number(selectedTxForDetail.amount).toLocaleString('id-ID')}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-mono font-bold text-xs ${
                    selectedTxForDetail.type === 'CREDIT'
                      ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                      : 'bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border'
                  }`}
                >
                  {selectedTxForDetail.type === 'CREDIT' ? 'SALDO MASUK (+)' : 'SALDO KELUAR (-)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-surface-card rounded-xl border border-border-subtle">
                <div>
                  <span className="text-[11px] text-secondary block font-semibold">
                    Waktu Transaksi
                  </span>
                  <span className="font-mono text-brand-espresso font-bold">
                    {new Date(selectedTxForDetail.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-secondary block font-semibold">
                    Kategori Sistem
                  </span>
                  <span className="font-bold text-brand-espresso">
                    {selectedTxForDetail.category}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-secondary block font-semibold">
                    Saldo Sebelum Mutasi
                  </span>
                  <span className="font-mono text-brand-espresso font-semibold">
                    Rp {Number(selectedTxForDetail.balanceBefore).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-secondary block font-semibold">
                    Saldo Setelah Mutasi
                  </span>
                  <span className="font-mono text-brand-espresso font-bold">
                    Rp {Number(selectedTxForDetail.balanceAfter).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-surface-card rounded-xl border border-border-subtle space-y-1.5">
                <span className="text-[11px] text-secondary block font-semibold">
                  Keterangan Sumber &amp; Deskripsi
                </span>
                <p className="font-bold text-brand-espresso">
                  {selectedTxForDetail.description}
                </p>
                {selectedTxForDetail.outlet && (
                  <p className="text-[11px] text-secondary">
                    Cabang Outlet: {selectedTxForDetail.outlet.name} (
                    {selectedTxForDetail.outlet.code})
                  </p>
                )}
                {selectedTxForDetail.referenceId && (
                  <p className="text-[11px] font-mono text-secondary">
                    ID Referensi: {selectedTxForDetail.referenceId}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTxForDetail(null)}
                className="min-h-[42px] px-5 py-2.5 rounded-xl bg-brand-espresso hover:bg-brand-espresso-muted text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
