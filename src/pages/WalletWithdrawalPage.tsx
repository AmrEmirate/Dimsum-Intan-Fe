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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WalletTransaction, WithdrawalRequest } from '../types';
import { api } from '../services/apiClient';

export const WalletWithdrawalPage: React.FC = () => {
  const {
    walletSummary,
    isLoadingWallet,
    fetchWalletSummary,
    requestWithdrawal,
    updateBankAccount,
    simulateDuitkuPay,
    showNotification,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'mutasi' | 'penarikan'>('mutasi');
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');

  // Modal States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  // Form Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawNotes, setWithdrawNotes] = useState<string>('');

  // Form Bank Account State
  const [formBankName, setFormBankName] = useState<string>('');
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

  const handleOpenWithdraw = () => {
    if (!hasBankAccount) {
      showNotification('Harap atur rekening bank tujuan penarikan terlebih dahulu!', 'warning');
      setIsBankModalOpen(true);
      return;
    }
    setWithdrawAmount('');
    setWithdrawNotes('');
    setIsWithdrawModalOpen(true);
  };

  const handleSubmitWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      showNotification('Masukkan nominal penarikan yang valid!', 'error');
      return;
    }
    if (amountNum < 20000) {
      showNotification('Nominal penarikan minimal Rp 20.000!', 'error');
      return;
    }
    if (amountNum > currentBalance) {
      showNotification('Saldo dompet tidak mencukupi untuk penarikan ini!', 'error');
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

  // Trigger Mock POS QRIS Payment (Adds Rp 50.000 to wallet immediately)
  const handleSimulateSales = async () => {
    setIsSimulating(true);
    const mockOrderNum = `INV/PST/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${Math.floor(100 + Math.random() * 900)}`;
    await simulateDuitkuPay(mockOrderNum);
    setIsSimulating(false);
  };

  // Superadmin Action to Process or Reject Withdrawal
  const handleSuperadminProcess = async (id: string, status: 'PROCESSED' | 'REJECTED') => {
    try {
      const res = await api.post<{ success: boolean; message: string }>(
        `/superadmin/withdrawals/${id}/process`,
        { status }
      );
      if (res.success) {
        showNotification(
          `Pengajuan penarikan dana berhasil ${status === 'PROCESSED' ? 'disetujui & ditransfer' : 'ditolak dan direfund ke dompet'}.`,
          'success'
        );
        await fetchWalletSummary();
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal memproses penarikan saldo', 'error');
    }
  };

  // Filtered Transactions
  const transactions = (walletSummary?.recentTransactions || []).filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  const withdrawals = walletSummary?.recentWithdrawals || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-brand-espresso tracking-tight">
                Dompet Digital &amp; Penarikan Saldo
              </h1>
              <p className="text-xs text-secondary mt-0.5">
                Kelola omzet transaksi digital kasir via Payment Gateway Duitku dan tarik dana ke rekening bank Anda.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchWalletSummary()}
            disabled={isLoadingWallet}
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-brand-espresso border border-border-subtle flex items-center gap-1.5 transition-all cursor-pointer"
            title="Muat ulang saldo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWallet ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handleSimulateSales}
            disabled={isSimulating}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-xs font-bold text-orange-600 border border-orange-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Simulasi dana QRIS kasir masuk seketika"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulasi QRIS Masuk</span>
          </button>

          <button
            onClick={handleOpenWithdraw}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Tarik Saldo</span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Tersedia */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-emerald-900/40 to-slate-900 text-white border border-emerald-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Saldo Aktif (Siap Ditarik)
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-emerald-100">
              Rp {currentBalance.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-emerald-300/80 mt-1">
              Bisa ditarik kapan saja ke rekening bank terdaftar
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between">
            <button
              onClick={handleOpenWithdraw}
              className="text-xs font-bold text-white hover:text-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Ajukan Tarik Dana</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Total Saldo Masuk (Omzet POS) */}
        <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-secondary flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              Total Saldo Masuk (QRIS)
            </span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              CREDIT
            </span>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-brand-espresso">
              +Rp {(walletSummary?.totalCredited || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-secondary mt-1">
              Akumulasi pembayaran digital pelanggan kasir
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle text-[11px] text-secondary font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Terverifikasi Gateway Duitku</span>
          </div>
        </div>

        {/* Card 3: Total Saldo Keluar (Sudah Ditarik) */}
        <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-secondary flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              Total Telah Ditarik
            </span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
              DEBIT
            </span>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-brand-espresso">
              -Rp {(walletSummary?.totalDebited || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-secondary mt-1">
              Total dana sukses ditransfer ke rekening bank
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle text-[11px] text-secondary font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Pencairan dana aman ke rekening</span>
          </div>
        </div>

        {/* Card 4: Penarikan Dalam Proses */}
        <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-secondary flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              Menunggu Transfer
            </span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
              PENDING
            </span>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-brand-espresso">
              Rp {(walletSummary?.pendingWithdrawalAmount || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-secondary mt-1">
              {walletSummary?.pendingWithdrawalCount || 0} pengajuan dalam proses admin
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle text-[11px] text-amber-600 font-semibold flex items-center gap-1">
            <span>Diproses maksimal 1x24 jam kerja</span>
          </div>
        </div>
      </div>

      {/* REKENING BANK TERDAFTAR BANNER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-brand-espresso">Rekening Bank Penarikan Saldo</h2>
              {hasBankAccount ? (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  TERVERIFIKASI
                </span>
              ) : (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                  BELUM DIATUR
                </span>
              )}
            </div>
            {hasBankAccount ? (
              <p className="text-xs text-secondary mt-1">
                Bank <span className="font-bold text-brand-espresso">{walletSummary?.bankInfo.bankName}</span> • No. Rek: <span className="font-bold font-mono text-brand-espresso">{walletSummary?.bankInfo.bankAccountNumber}</span> a/n <span className="font-bold text-brand-espresso">{walletSummary?.bankInfo.bankAccountName}</span>
              </p>
            ) : (
              <p className="text-xs text-secondary mt-1">
                Atur rekening bank untuk memudahkan proses transfer pencairan saldo omzet toko Anda.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsBankModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-brand-espresso text-xs font-bold border border-border-subtle transition-all cursor-pointer self-start sm:self-auto"
        >
          {hasBankAccount ? 'Ubah Rekening Bank' : 'Atur Rekening Sekarang'}
        </button>
      </div>

      {/* TABS NAVIGATION: MUTASI VS PENARIKAN */}
      <div className="flex items-center gap-2 border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('mutasi')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-all cursor-pointer ${
            activeTab === 'mutasi'
              ? 'text-brand-espresso border-b-2 border-emerald-500'
              : 'text-secondary hover:text-brand-espresso'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Buku Kas &amp; Riwayat Mutasi Saldo</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-container text-secondary">
            {transactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('penarikan')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-all cursor-pointer ml-4 ${
            activeTab === 'penarikan'
              ? 'text-brand-espresso border-b-2 border-emerald-500'
              : 'text-secondary hover:text-brand-espresso'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Riwayat Pengajuan Tarik Saldo</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-container text-secondary">
            {withdrawals.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT: MUTASI SALDO */}
      {activeTab === 'mutasi' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-xl border border-border-subtle text-xs font-semibold">
              {(['ALL', 'CREDIT', 'DEBIT'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === t
                      ? 'bg-surface-container-high text-brand-espresso font-bold shadow-xs'
                      : 'text-secondary hover:text-brand-espresso'
                  }`}
                >
                  {t === 'ALL' ? 'Semua Mutasi' : t === 'CREDIT' ? 'Saldo Masuk (+)' : 'Saldo Keluar (-)'}
                </button>
              ))}
            </div>

            <span className="text-xs text-secondary font-medium">
              Menampilkan <span className="font-bold text-brand-espresso">{transactions.length}</span> catatan mutasi terakhir
            </span>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-border-subtle bg-surface-container overflow-hidden shadow-xs">
            {transactions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high mx-auto flex items-center justify-center text-secondary">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-brand-espresso">Belum Ada Catatan Mutasi Saldo</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto">
                  Mutasi saldo otomatis tercatat saat kasir menerima pembayaran QRIS Duitku atau saat Anda menarik dana.
                </p>
                <button
                  onClick={handleSimulateSales}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Coba Simulasi QRIS Masuk
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-high/60 text-secondary border-b border-border-subtle font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-3 px-4">Waktu &amp; Tanggal</th>
                      <th className="py-3 px-4">Tipe &amp; Kategori</th>
                      <th className="py-3 px-4">Keterangan Sumber</th>
                      <th className="py-3 px-4 text-right">Saldo Awal</th>
                      <th className="py-3 px-4 text-right">Mutasi Nominal</th>
                      <th className="py-3 px-4 text-right">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {transactions.map((tx) => {
                      const isCredit = tx.type === 'CREDIT';
                      return (
                        <tr key={tx.id} className="hover:bg-surface-container-high/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-secondary whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                                  isCredit
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {isCredit ? '+ MASUK' : '- KELUAR'}
                              </span>
                              <span className="text-[11px] text-secondary font-medium">
                                {tx.category}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-brand-espresso max-w-md line-clamp-1">
                              {tx.description}
                            </div>
                            {tx.outlet && (
                              <div className="text-[10px] text-secondary mt-0.5">
                                Cabang: {tx.outlet.name} ({tx.outlet.code})
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-secondary">
                            Rp {Number(tx.balanceBefore).toLocaleString('id-ID')}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-black">
                            <span className={isCredit ? 'text-emerald-600' : 'text-rose-600'}>
                              {isCredit ? '+' : '-'}Rp {Number(tx.amount).toLocaleString('id-ID')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-bold text-brand-espresso">
                            Rp {Number(tx.balanceAfter).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PENARIKAN SALDO (WITHDRAWALS) */}
      {activeTab === 'penarikan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-espresso">Riwayat Permohonan Penarikan Dana</h3>
            <button
              onClick={handleOpenWithdraw}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tarik Saldo Baru</span>
            </button>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface-container overflow-hidden shadow-xs">
            {withdrawals.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high mx-auto flex items-center justify-center text-secondary">
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-brand-espresso">Belum Ada Pengajuan Penarikan</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto">
                  Anda belum pernah mengajukan penarikan saldo. Kumpulkan omzet dari transaksi QRIS dan cairkan ke rekening bank kapan saja.
                </p>
                <button
                  onClick={handleOpenWithdraw}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Ajukan Penarikan Sekarang
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-high/60 text-secondary border-b border-border-subtle font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-3 px-4">No. Penarikan</th>
                      <th className="py-3 px-4">Waktu Pengajuan</th>
                      <th className="py-3 px-4">Rekening Tujuan</th>
                      <th className="py-3 px-4 text-right">Nominal Tarik</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Keterangan / Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {withdrawals.map((w) => {
                      return (
                        <tr key={w.id} className="hover:bg-surface-container-high/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-brand-espresso">
                            {w.withdrawalNumber}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-secondary whitespace-nowrap">
                            {new Date(w.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-brand-espresso">
                              {w.bankName} - {w.bankAccountNumber}
                            </div>
                            <div className="text-[11px] text-secondary">a/n {w.bankAccountName}</div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-black text-brand-espresso">
                            Rp {Number(w.amount).toLocaleString('id-ID')}
                            {w.fee > 0 && (
                              <div className="text-[10px] text-secondary font-normal">
                                Biaya: Rp {Number(w.fee).toLocaleString('id-ID')}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full font-mono font-bold text-[10px] inline-flex items-center gap-1 ${
                                w.status === 'PROCESSED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : w.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
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

                          <td className="py-3.5 px-4">
                            {w.status === 'REJECTED' && (
                              <span className="text-rose-600 text-xs font-semibold">
                                {w.rejectionReason || 'Alasan administratif'}
                              </span>
                            )}
                            {w.status === 'PROCESSED' && (
                              <span className="text-emerald-700 text-xs font-semibold">
                                Sukses ditransfer pada{' '}
                                {w.processedAt
                                  ? new Date(w.processedAt).toLocaleDateString('id-ID')
                                  : 'hari ini'}
                              </span>
                            )}
                            {w.status === 'PENDING' && (
                              currentUser?.role === 'SUPERADMIN' ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleSuperadminProcess(w.id, 'PROCESSED')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs cursor-pointer transition-all"
                                  >
                                    Setujui Transfer
                                  </button>
                                  <button
                                    onClick={() => handleSuperadminProcess(w.id, 'REJECTED')}
                                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs cursor-pointer transition-all"
                                  >
                                    Tolak &amp; Refund
                                  </button>
                                </div>
                              ) : (
                                <span className="text-secondary text-xs">
                                  Sedang diverifikasi bagian keuangan
                                </span>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: FORM PENARIKAN SALDO */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-surface-container border border-border-subtle shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Send className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-brand-espresso">Tarik Saldo ke Rekening</h2>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 rounded-lg text-secondary hover:text-brand-espresso"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWithdraw} className="space-y-4">
              {/* Saldo Aktif Info */}
              <div className="p-3.5 rounded-xl bg-surface-container-high border border-border-subtle flex items-center justify-between">
                <span className="text-xs text-secondary font-medium">Saldo yang Dapat Ditarik:</span>
                <span className="text-sm font-black font-mono text-emerald-600">
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
                    className="text-blue-600 hover:underline font-bold text-[11px]"
                  >
                    Ganti Rekening
                  </button>
                </div>
                <div className="font-mono text-xs">
                  {walletSummary?.bankInfo.bankName} - {walletSummary?.bankInfo.bankAccountNumber}
                </div>
                <div className="text-secondary text-[11px]">
                  a/n {walletSummary?.bankInfo.bankAccountName}
                </div>
              </div>

              {/* Nominal Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-espresso">
                  Nominal Penarikan (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-secondary">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="20000"
                    max={currentBalance}
                    placeholder="Minimal Rp 20.000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface text-sm font-bold font-mono text-brand-espresso border border-border-subtle focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {amountPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={preset > currentBalance}
                      onClick={() => setWithdrawAmount(String(preset))}
                      className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-40 text-[11px] font-mono font-bold text-secondary cursor-pointer transition-all"
                    >
                      +{preset / 1000}k
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentBalance <= 0}
                    onClick={() => setWithdrawAmount(String(currentBalance))}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[11px] font-bold text-emerald-700 cursor-pointer transition-all ml-auto"
                  >
                    Tarik Semua
                  </button>
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-espresso">Catatan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Pencairan omzet kasir minggu ke-4"
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface text-xs text-brand-espresso border border-border-subtle focus:outline-none"
                />
              </div>

              {/* Rincian Ringkasan */}
              <div className="p-3 rounded-xl bg-surface-container-high text-xs space-y-1.5 font-medium">
                <div className="flex justify-between text-secondary">
                  <span>Biaya Layanan Transfer:</span>
                  <span className="font-bold text-emerald-600">Rp 0 (Gratis)</span>
                </div>
                <div className="flex justify-between text-brand-espresso font-bold pt-1 border-t border-border-subtle">
                  <span>Total Diterima di Rekening:</span>
                  <span className="font-mono text-emerald-600">
                    Rp {(parseFloat(withdrawAmount) || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-secondary hover:bg-surface-container-high cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
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

      {/* MODAL 2: FORM PENGATURAN REKENING BANK */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-surface-container border border-border-subtle shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-brand-espresso">Rekening Bank Pencairan Dana</h2>
              </div>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="p-1 rounded-lg text-secondary hover:text-brand-espresso"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBank} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-espresso">Nama Bank *</label>
                <select
                  value={formBankName}
                  onChange={(e) => setFormBankName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface text-xs font-bold text-brand-espresso border border-border-subtle focus:outline-none cursor-pointer"
                  required
                >
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="Bank Syariah Indonesia">BSI (Bank Syariah Indonesia)</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Permata Bank">Permata Bank</option>
                  <option value="Bank Jago">Bank Jago</option>
                  <option value="SeaBank">SeaBank</option>
                  <option value="Bank Lainnya">Bank Lainnya</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-espresso">
                  Nomor Rekening Bank *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 1234567890"
                  value={formBankAccountNumber}
                  onChange={(e) => setFormBankAccountNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface text-xs font-mono font-bold text-brand-espresso border border-border-subtle focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-espresso">
                  Nama Pemilik Rekening (Sesuai Buku Tabungan) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: DIMSUM PRIMA RASA"
                  value={formBankAccountName}
                  onChange={(e) => setFormBankAccountName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface text-xs font-bold uppercase text-brand-espresso border border-border-subtle focus:outline-none"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-container-high text-xs text-secondary flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-tight text-[11px]">
                  Pastikan nama dan nomor rekening sesuai dengan data di buku tabungan agar proses transfer otomatis tidak mengalami kegagalan.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-secondary hover:bg-surface-container-high cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBank}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingBank ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
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
    </div>
  );
};
