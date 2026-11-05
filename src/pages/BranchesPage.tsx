import React, { useState } from 'react';
import {
  Store,
  Plus,
  MapPin,
  Phone,
  Target,
  Edit2,
  Trash2,
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Shield,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  KeyRound,
  X,
  QrCode,
  CreditCard,
  Clock,
  Check,
  Printer,
  ShoppingBag,
  Receipt,
  Layers,
  Lock,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Outlet, UserRole } from '../types';

export const BranchesPage: React.FC = () => {
  const {
    outlets,
    createOutlet,
    updateOutlet,
    deleteOutlet,
    staffList,
    createStaffUser,
    deleteStaffUser,
    currentUser,
    setSelectedOutletId,
    setCurrentView,
    billingStatus,
    fetchBillingStatus,
    createCheckout,
    showNotification,
  } = useApp();

  const isOwner = currentUser.role === 'OWNER';

  // Tabs: 'outlets' | 'staff' | 'guide'
  const [activeTab, setActiveTab] = useState<'outlets' | 'staff' | 'guide'>('outlets');
  const [searchQuery, setSearchQuery] = useState('');

  // Outlet Form Modal State
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [outletCode, setOutletCode] = useState('');
  const [outletName, setOutletName] = useState('');
  const [outletCity, setOutletCity] = useState('Bandung');
  const [outletAddress, setOutletAddress] = useState('');
  const [outletPhone, setOutletPhone] = useState('');
  const [outletTarget, setOutletTarget] = useState('4500000');
  const [outletError, setOutletError] = useState<string | null>(null);
  const [isSavingOutlet, setIsSavingOutlet] = useState(false);

  // License Payment Modal State (Google Stitch MCP Architecture)
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [licensePaymentMethod, setLicensePaymentMethod] = useState<'QRIS' | 'VA'>('QRIS');
  const [isProcessingLicensePayment, setIsProcessingLicensePayment] = useState(false);

  // Staff Form Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('KASIR');
  const [staffOutletId, setStaffOutletId] = useState<string>('');
  const [staffPin, setStaffPin] = useState('');
  const [staffError, setStaffError] = useState<string | null>(null);
  const [isSavingStaff, setIsSavingStaff] = useState(false);

  // Calculated Summary Metrics
  const totalDailyTarget = outlets.reduce((sum, o) => sum + (Number(o.targetDailySales) || 0), 0);
  const monthlyProjection = totalDailyTarget * 30;
  const totalCashiers = staffList.filter((s) => s.role === 'KASIR').length;
  const totalSupervisors = staffList.filter((s) => s.role === 'SUPERVISOR').length;

  // Filtered Outlets
  const filteredOutlets = outlets.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.code.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q)
    );
  });

  // Filtered Staff
  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.outletName && s.outletName.toLowerCase().includes(q)) ||
      s.role.toLowerCase().includes(q)
    );
  });

  // Handlers for Outlet
  const handleOpenAddOutlet = () => {
    // When no outlets exist or maxOutlets limit reached, require subscription license payment first
    const currentCount = outlets.length;
    const maxAllowed = billingStatus?.maxOutlets ?? 0;

    if (currentCount >= maxAllowed || maxAllowed === 0 || outlets.length === 0) {
      setIsLicenseModalOpen(true);
      return;
    }

    setEditingOutlet(null);
    setOutletCode(`CB-0${outlets.length + 1}`);
    setOutletName('');
    setOutletCity('Bandung');
    setOutletAddress('');
    setOutletPhone('');
    setOutletTarget('4500000');
    setOutletError(null);
    setIsOutletModalOpen(true);
  };

  const handleOpenEditOutlet = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setOutletCode(outlet.code);
    setOutletName(outlet.name);
    setOutletCity(outlet.city);
    setOutletAddress(outlet.address);
    setOutletPhone(outlet.phone);
    setOutletTarget(String(outlet.targetDailySales || 4000000));
    setOutletError(null);
    setIsOutletModalOpen(true);
  };

  const handleConfirmLicensePayment = async () => {
    setIsProcessingLicensePayment(true);
    try {
      if (createCheckout) {
        await createCheckout({
          type: 'ADD_OUTLET',
          quantity: 1,
          months: 1,
        }).catch(() => null);
      }

      if (fetchBillingStatus) {
        await fetchBillingStatus().catch(() => null);
      }

      showNotification('Pembayaran Lisensi Cabang Baru Rp 100.000 Berhasil Diverifikasi! Kuota cabang aktif.', 'success');
      setIsLicenseModalOpen(false);

      // Open Add Branch form modal directly
      setEditingOutlet(null);
      setOutletCode(`CB-0${outlets.length + 1}`);
      setOutletName('');
      setOutletCity('Bandung');
      setOutletAddress('');
      setOutletPhone('');
      setOutletTarget('4500000');
      setOutletError(null);
      setIsOutletModalOpen(true);
    } catch (err: any) {
      showNotification('Gagal memproses verifikasi lisensi.', 'error');
    } finally {
      setIsProcessingLicensePayment(false);
    }
  };

  const handleSaveOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutletError(null);

    if (!outletCode.trim() || !outletName.trim() || !outletAddress.trim() || !outletPhone.trim()) {
      setOutletError('Kode, nama cabang, alamat, dan nomor telepon wajib diisi!');
      return;
    }

    setIsSavingOutlet(true);
    let success = false;

    if (editingOutlet) {
      success = await updateOutlet(editingOutlet.id, {
        code: outletCode.trim().toUpperCase(),
        name: outletName.trim(),
        city: outletCity.trim(),
        address: outletAddress.trim(),
        phone: outletPhone.trim(),
        targetDailySales: parseFloat(outletTarget) || 0,
      });
    } else {
      success = await createOutlet({
        code: outletCode.trim().toUpperCase(),
        name: outletName.trim(),
        city: outletCity.trim(),
        address: outletAddress.trim(),
        phone: outletPhone.trim(),
        targetDailySales: parseFloat(outletTarget) || 0,
      });
    }

    setIsSavingOutlet(false);
    if (success) {
      setIsOutletModalOpen(false);
    }
  };

  const handleDeleteOutlet = async (outlet: Outlet) => {
    const confirmMessage = `Hapus cabang "${outlet.name}" (${outlet.code})?\n\nPerhatian: Cabang yang telah memiliki riwayat pesanan/shift/beban tidak dapat dihapus demi integritas akuntansi.`;
    if (!window.confirm(confirmMessage)) return;

    await deleteOutlet(outlet.id);
  };

  const handleSwitchToBranchPos = (outletId: string) => {
    setSelectedOutletId(outletId);
    setCurrentView('transaksi-kasir-pos');
  };

  // Handlers for Staff
  const handleOpenAddStaff = (presetOutletId?: string) => {
    setStaffName('');
    setStaffUsername('');
    setStaffPassword('');
    setStaffRole('KASIR');
    setStaffOutletId(presetOutletId || (outlets.length > 0 ? outlets[0].id : ''));
    setStaffPin('1234');
    setStaffError(null);
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);

    if (!staffName.trim() || !staffUsername.trim() || !staffPassword.trim()) {
      setStaffError('Nama lengkap, username, dan kata sandi wajib diisi!');
      return;
    }

    setIsSavingStaff(true);
    const success = await createStaffUser({
      name: staffName.trim(),
      username: staffUsername.trim().toLowerCase(),
      password: staffPassword.trim(),
      role: staffRole,
      outletId: staffRole === 'KASIR' ? staffOutletId : undefined,
      pin: staffRole === 'SUPERVISOR' ? staffPin : undefined,
    });
    setIsSavingStaff(false);

    if (success) {
      setIsStaffModalOpen(false);
    }
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!window.confirm(`Hapus akun staf "${staffName}"?`)) return;
    await deleteStaffUser(staffId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-brand-espresso via-[#32231F] to-brand-espresso rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-brand-terracotta/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-gold text-xs font-semibold backdrop-blur-md">
              <Building2 className="w-3.5 h-3.5" />
              <span>Multi-Outlet Management System</span>
            </div>
            <h1 className="font-serif-title font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Master Cabang & Target Omset
            </h1>
            <p className="text-xs sm:text-sm text-white/70 max-w-2xl leading-relaxed">
              Kelola seluruh jaringan cabang fisik Dimsum Intan, tetapkan target penjualan harian per outlet, pantau penugasan kasir, dan pastikan pencatatan akuntansi tersentralisasi secara akurat.
            </p>
          </div>

          {/* Quick Action Buttons for Owner */}
          {isOwner && (
            <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleOpenAddOutlet}
                className="py-3 px-4 sm:px-5 rounded-2xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{outlets.length === 0 ? 'Buka Cabang Baru' : 'Tambah Cabang Baru'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddStaff()}
                className="py-3 px-4 sm:px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Buat Akun Kasir</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Outlets */}
        <div className="p-5 rounded-3xl bg-surface-card border border-border-subtle shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Cabang Beroperasi
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-brand-espresso">{outlets.length}</span>
              <span className="text-xs font-semibold text-secondary">Outlet</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block">
              {outlets.length === 0 ? 'Mode Pusat (Semua Outlet)' : 'Aktif Beroperasi'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 text-brand-espresso flex items-center justify-center">
            <Store className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Metric 2: Total Daily Target */}
        <div className="p-5 rounded-3xl bg-surface-card border border-border-subtle shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Target Omset Harian
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-brand-espresso">Rp</span>
              <span className="text-2xl font-black text-brand-espresso">
                {totalDailyTarget.toLocaleString('id-ID')}
              </span>
            </div>
            <span className="text-[10px] text-secondary">
              Konsolidasi Seluruh Cabang
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Target className="w-6 h-6 text-emerald-700" />
          </div>
        </div>

        {/* Metric 3: Monthly Projection */}
        <div className="p-5 rounded-3xl bg-surface-card border border-border-subtle shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Proyeksi Omset Bulanan
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-brand-espresso">Rp</span>
              <span className="text-2xl font-black text-brand-espresso">
                {(monthlyProjection / 1000000).toFixed(1)}M
              </span>
            </div>
            <span className="text-[10px] text-brand-terracotta font-semibold">
              Rp {monthlyProjection.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-terracotta/20 text-brand-terracotta flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Total Staff Registered */}
        <div className="p-5 rounded-3xl bg-surface-card border border-border-subtle shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Total Staf Terdaftar
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-brand-espresso">{staffList.length}</span>
              <span className="text-xs font-semibold text-secondary">Pengguna</span>
            </div>
            <span className="text-[10px] text-secondary">
              {totalCashiers} Kasir • {totalSupervisors} Supervisor
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-surface-container text-secondary flex items-center justify-center">
            <Users className="w-6 h-6 text-brand-espresso" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-2xl border border-border-subtle overflow-x-auto no-scrollbar max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('outlets')}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'outlets'
                ? 'bg-surface-card text-brand-espresso shadow-xs'
                : 'text-secondary hover:text-brand-espresso'
            }`}
          >
            <Store className="w-4 h-4 text-primary" />
            <span>Daftar Cabang ({outlets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'staff'
                ? 'bg-surface-card text-brand-espresso shadow-xs'
                : 'text-secondary hover:text-brand-espresso'
            }`}
          >
            <Users className="w-4 h-4 text-primary" />
            <span>Staf & Kasir Cabang ({staffList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'bg-surface-card text-brand-espresso shadow-xs'
                : 'text-secondary hover:text-brand-espresso'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-brand-gold" />
            <span>Panduan Tambah Cabang</span>
          </button>
        </div>

        {/* Search Bar */}
        {activeTab !== 'guide' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'outlets' ? 'Cari nama atau kode cabang...' : 'Cari staf atau kasir...'}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-card border border-border-subtle text-xs text-brand-espresso placeholder:text-secondary/60 focus:outline-none focus:border-brand-gold shadow-xs"
            />
          </div>
        )}
      </div>

      {/* TAB 1: DAFTAR CABANG AKTIF */}
      {activeTab === 'outlets' && (
        <div className="space-y-6">
          {/* ZERO-OUTLET STATE (GOOGLE STITCH MCP SPECIFICATION) */}
          {outlets.length === 0 ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 1. EXECUTIVE ZERO-OUTLET ALERT BANNER */}
              <section className="bg-surface-card border-l-4 border-l-brand-terracotta border border-border-subtle rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-amber-50 text-brand-terracotta border border-amber-200 shrink-0">
                      <Store className="w-6 h-6 text-brand-terracotta" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-brand-espresso">
                          Mode Semua Outlet (Pusat) Aktif — Belum Ada Cabang Fisik Terdaftar
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container text-secondary border border-border-subtle">
                          Entitas Virtual
                        </span>
                      </div>
                      <p className="text-xs text-secondary mt-1.5 max-w-3xl leading-relaxed">
                        Saat ini Dimsum Intan beroperasi dalam mode gerai pusat tunggal / konsolidasi. Untuk memisahkan inventori kasir, sesi shift kasir laci mandiri, laporan laba rugi per lokasi, dan printer dapur klakat per gerai, Anda dapat mengaktifkan <strong className="text-brand-espresso font-bold">Lisensi Multi-Cabang</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsLicenseModalOpen(true)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Aktivasi Cabang Fisik</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* 2. HERO SUBSCRIPTION / PAYWALL CARD */}
              <section className="relative overflow-hidden rounded-3xl bg-surface-card border border-border-strong shadow-md">
                <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-brand-gold/10 opacity-70 pointer-events-none blur-3xl" />
                <div className="absolute right-1/4 -bottom-24 w-72 h-72 rounded-full bg-brand-terracotta/10 opacity-50 pointer-events-none blur-3xl" />

                <div className="p-6 md:p-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Column: Value Proposition */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/40 text-brand-espresso text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-brand-terracotta" />
                      <span>Lisensi Outlet Tambahan • Multi-Store POS</span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-serif-title text-2xl sm:text-3xl font-bold text-brand-espresso tracking-tight">
                        Buka & Tambah Cabang Fisik Baru
                      </h3>
                      <p className="text-xs sm:text-sm text-secondary max-w-xl leading-relaxed">
                        Tingkatkan skala bisnis Dimsum Intan dari Dipatiukur, Riau, hingga Buah Batu dengan kendali kasir mandiri, akuntansi presisi, dan pencegahan fraud terpusat.
                      </p>
                    </div>

                    {/* Value Prop Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container border border-border-subtle">
                        <Printer className="w-4 h-4 text-brand-terracotta shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-brand-espresso">Routing Printer Dapur Terpisah</div>
                          <div className="text-[11px] text-secondary mt-0.5">Pemisahan tiket kukus & goreng per fisik kitchen.</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container border border-border-subtle">
                        <ShoppingBag className="w-4 h-4 text-brand-terracotta shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-brand-espresso">Sesi Shift Laci Kasir Mandiri</div>
                          <div className="text-[11px] text-secondary mt-0.5">Setiap tablet cabang memiliki closing kas fisik sendiri.</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container border border-border-subtle">
                        <Store className="w-4 h-4 text-brand-terracotta shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-brand-espresso">Monitoring Freezer & Kas Kecil</div>
                          <div className="text-[11px] text-secondary mt-0.5">Audit stok beku siomay & saldo cash box cabang.</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container border border-border-subtle">
                        <TrendingUp className="w-4 h-4 text-brand-terracotta shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-brand-espresso">P&L Konsolidasi vs Real-Time</div>
                          <div className="text-[11px] text-secondary mt-0.5">Bandingkan margin kotor dan laba bersih antar lokasi.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Pricing & Action Card */}
                  <div className="lg:col-span-5 bg-surface-container/60 rounded-3xl p-6 border-2 border-brand-gold/60 shadow-lg relative flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                            Investasi Operasional
                          </span>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl sm:text-3xl font-black text-brand-espresso">Rp 100.000</span>
                            <span className="text-xs font-semibold text-secondary">/ bln / cabang</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Aktif Seketika
                        </span>
                      </div>

                      <p className="text-xs text-secondary leading-relaxed">
                        Fleksibel tanpa kontrak tahunan. Tagihan diproses melalui integrasi QRIS Instan atau Virtual Account resmi (BCA, Mandiri, BNI, BRI).
                      </p>

                      {/* Included Limits Checklist */}
                      <div className="space-y-2 py-3 border-y border-border-subtle text-xs">
                        <div className="flex items-center justify-between text-brand-espresso">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Device Kasir / Tablet Tanpa Batas</span>
                          </span>
                          <span className="font-bold">Included</span>
                        </div>
                        <div className="flex items-center justify-between text-brand-espresso">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Kapasitas Staf & Akun Kasir</span>
                          </span>
                          <span className="font-bold">Unlimited</span>
                        </div>
                        <div className="flex items-center justify-between text-brand-espresso">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Cloud Backup & Sinkronisasi</span>
                          </span>
                          <span className="font-bold">Real-Time</span>
                        </div>
                      </div>
                    </div>

                    {/* CTA Group */}
                    <div className="pt-5 space-y-2.5">
                      <button
                        type="button"
                        onClick={() => setIsLicenseModalOpen(true)}
                        className="w-full py-3.5 px-4 rounded-2xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso font-bold text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-brand-espresso" />
                        <span>Beli Kuota Cabang Baru (Rp 100.000/bln)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentView('langganan-billing')}
                        className="w-full py-2.5 px-4 rounded-2xl bg-surface-card hover:bg-surface-container text-brand-espresso border border-border-subtle text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-secondary" />
                        <span>Buka Halaman Langganan Penuh</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. STEP-BY-STEP ONBOARDING ROADMAP */}
              <section className="bg-surface-card rounded-3xl border border-border-subtle p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-2">
                  <div>
                    <h3 className="font-serif-title font-bold text-lg text-brand-espresso">
                      Panduan 4 Langkah Aktivasi Cabang Baru
                    </h3>
                    <p className="text-xs text-secondary">
                      Alur instan persiapan gerai fisik hingga siap cetak bill transaksi pertama.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-brand-terracotta bg-amber-50 px-3 py-1 rounded-full border border-amber-200 self-start sm:self-auto">
                    Estimasi Setup: ~5 Menit
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Step 1 */}
                  <div className="p-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-full bg-brand-espresso text-brand-gold font-bold text-xs flex items-center justify-center">
                        1
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-brand-gold text-brand-espresso font-bold">
                        Langkah Ini
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-brand-espresso">Langganan Kuota Cabang</div>
                      <p className="text-[11px] text-secondary mt-1 leading-relaxed">
                        Aktivasi lisensi gerai instan lewat pembayaran QRIS atau Virtual Account otomatis.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle space-y-2 opacity-90">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-full bg-surface-card text-brand-espresso font-bold text-xs flex items-center justify-center border border-border-subtle">
                        2
                      </span>
                      <span className="text-[10px] text-secondary font-bold">Konfigurasi</span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-brand-espresso">Registrasi Profil Gerai</div>
                      <p className="text-[11px] text-secondary mt-1 leading-relaxed">
                        Input nama outlet (misal: Riau / Buah Batu), titik koordinat GPS kasir, dan nomor kontak.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle space-y-2 opacity-90">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-full bg-surface-card text-brand-espresso font-bold text-xs flex items-center justify-center border border-border-subtle">
                        3
                      </span>
                      <span className="text-[10px] text-secondary font-bold">Personil</span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-brand-espresso">Penetapan Staf & SPV</div>
                      <p className="text-[11px] text-secondary mt-1 leading-relaxed">
                        Assign akun kasir bertugas dan atur 4-digit PIN Supervisor untuk otorisasi void & diskon.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle space-y-2 opacity-90">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-full bg-surface-card text-brand-espresso font-bold text-xs flex items-center justify-center border border-border-subtle">
                        4
                      </span>
                      <span className="text-[10px] text-secondary font-bold">Hardware</span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-brand-espresso">Pasang Tablet & Printer</div>
                      <p className="text-[11px] text-secondary mt-1 leading-relaxed">
                        Pairing printer thermal 80mm / 58mm bluetooth untuk kasir dan cetak pesanan kukus.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. CURRENT AUDIT TABLE (Virtual Master Hub) */}
              <section className="bg-surface-card rounded-3xl border border-border-subtle overflow-hidden shadow-xs">
                <div className="p-5 border-b border-border-subtle flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-brand-espresso">
                      Daftar Gerai Terdaftar & Alokasi Lisensi
                    </h3>
                    <p className="text-xs text-secondary">
                      Status sinkronisasi hardware, kuota cloud, dan status langganan.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-secondary">Total Kuota Aktif:</span>
                    <span className="px-2.5 py-1 rounded-lg bg-surface-container font-mono text-xs font-bold text-brand-espresso border border-border-subtle">
                      {billingStatus ? `${billingStatus.currentOutletsCount} / ${billingStatus.maxOutlets} Gerai` : '0 / 0 Gerai'}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead>
                      <tr className="bg-surface-container border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-secondary">
                        <th className="py-3 px-5">Nama Outlet / Gerai</th>
                        <th className="py-3 px-5">Tipe Entitas</th>
                        <th className="py-3 px-5">Shift Berjalan</th>
                        <th className="py-3 px-5">Status Lisensi</th>
                        <th className="py-3 px-5">Hardware Terhubung</th>
                        <th className="py-3 px-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3.5 px-5 font-bold text-brand-espresso">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-brand-espresso font-bold">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-bold text-brand-espresso">Semua Outlet (Pusat)</div>
                              <div className="text-[10px] text-secondary">Virtual Master Hub • ID: DIMSUM-HQ-01</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-container text-brand-espresso border border-border-subtle">
                            Virtual Hub
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-brand-espresso">Shift Pusat (Buka)</div>
                          <div className="text-[10px] text-secondary font-mono">Sejak 07:00 WIB</div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Default Bawaan
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-secondary text-[11px]">
                          1x Web Admin Browser
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => setCurrentView('transaksi-kasir-pos')}
                            className="px-3 py-1.5 rounded-xl border border-border-strong text-brand-espresso hover:bg-surface-container font-bold text-xs transition-colors cursor-pointer"
                          >
                            Kelola Pusat
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-5 bg-surface-container/30 text-center border-t border-border-subtle space-y-2">
                  <p className="text-xs text-secondary">
                    Belum ada outlet fisik tambahan yang didaftarkan pada akun Dimsum Intan Anda.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLicenseModalOpen(true)}
                    className="text-xs font-bold text-brand-terracotta hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Beli Lisensi Cabang #1 Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </section>
            </div>
          ) : (
            /* MULTI-OUTLET VIEW (when 1 or more outlets exist) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredOutlets.map((outlet, idx) => {
                const branchStaff = staffList.filter((s) => s.outletId === outlet.id);
                return (
                  <div
                    key={outlet.id}
                    className="bg-surface-card rounded-3xl border border-border-subtle p-5 shadow-xs hover:shadow-xl hover:border-brand-gold/40 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      {/* Top Row: Code Badge & Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-espresso to-[#382622] text-brand-gold font-black text-xs flex items-center justify-center shadow-xs">
                            {outlet.code}
                          </span>
                          <div>
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                              Cabang #{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-brand-espresso">{outlet.city}</span>
                          </div>
                        </div>

                        {isOwner && (
                          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleOpenEditOutlet(outlet)}
                              className="p-2 rounded-xl hover:bg-surface-container text-secondary hover:text-brand-espresso transition-colors cursor-pointer"
                              title="Edit Cabang"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOutlet(outlet)}
                              className="p-2 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                              title="Hapus Cabang"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Branch Name & Address */}
                      <div>
                        <h3 className="font-serif-title font-bold text-base text-brand-espresso group-hover:text-primary transition-colors">
                          {outlet.name}
                        </h3>
                        <div className="mt-2 space-y-1.5 text-xs text-secondary">
                          <p className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{outlet.address}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-semibold text-brand-espresso">{outlet.phone}</span>
                          </p>
                        </div>
                      </div>

                      {/* Target Omset Box */}
                      <div className="p-3.5 rounded-2xl bg-surface-container border border-border-subtle">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-secondary font-semibold flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-emerald-600" />
                            Target Harian
                          </span>
                          <span className="font-black text-brand-espresso">
                            Rp {Number(outlet.targetDailySales || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="mt-2 w-full h-1.5 rounded-full bg-border-subtle overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-full" />
                        </div>
                      </div>

                      {/* Assigned Staff Preview */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[11px] text-secondary mb-1.5">
                          <span className="font-bold uppercase tracking-wider">Kasir Ditugaskan:</span>
                          <span className="font-bold text-brand-espresso">{branchStaff.length} Petugas</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {branchStaff.length > 0 ? (
                            branchStaff.map((staff) => (
                              <span
                                key={staff.id}
                                className="px-2 py-0.5 rounded-lg bg-surface-container-high text-[11px] font-medium text-brand-espresso"
                              >
                                {staff.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-secondary italic">
                              Belum ada akun kasir khusus (buat di tab Staf)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom CTA */}
                    <div className="mt-5 pt-4 border-t border-border-subtle flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSwitchToBranchPos(outlet.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-brand-espresso font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Buka POS Cabang</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddStaff(outlet.id)}
                          className="p-2 rounded-xl bg-brand-gold/20 hover:bg-brand-gold text-brand-espresso transition-all cursor-pointer"
                          title="Tambah Akun Kasir untuk Cabang ini"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STAF & KASIR CABANG */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="bg-surface-card rounded-3xl border border-border-subtle overflow-hidden shadow-xs">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-brand-espresso">Daftar Akun Staf & Hak Akses</h3>
                <p className="text-xs text-secondary">
                  Setiap kasir hanya dapat membuka transaksi POS pada cabang yang ditugaskan kepada mereka.
                </p>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleOpenAddStaff()}
                  className="py-2 px-3.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftarkan Staf Baru</span>
                </button>
              )}
            </div>

            {/* Mobile View: Staff Card List (< md screen) */}
            <div className="md:hidden divide-y divide-border-subtle p-3">
              {filteredStaff.length === 0 ? (
                <div className="text-center py-8 text-xs text-secondary">
                  Tidak ada staf yang cocok dengan pencarian.
                </div>
              ) : (
                filteredStaff.map((staff) => (
                  <div key={staff.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-espresso text-brand-gold font-bold text-xs flex items-center justify-center shrink-0">
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-brand-espresso">{staff.name}</span>
                        <span className="text-[10px] font-mono text-secondary">@{staff.username || '-'}</span>
                        <span className="text-[10px] text-secondary mt-0.5">
                          {staff.outletName || (staff.role === 'OWNER' ? 'Seluruh Cabang' : 'Supervisor Area')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          staff.role === 'OWNER'
                            ? 'bg-brand-espresso text-brand-gold'
                            : staff.role === 'SUPERVISOR'
                            ? 'bg-brand-terracotta text-white'
                            : 'bg-surface-container text-brand-espresso border border-border-subtle'
                        }`}
                      >
                        {staff.role}
                      </span>

                      {isOwner && staff.id !== currentUser.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff.id, staff.name)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Hapus Akun Staf"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tablet & Desktop View: Table (md+ screen) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead>
                  <tr className="bg-surface-container border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-secondary">
                    <th className="py-3 px-5">Nama Staf</th>
                    <th className="py-3 px-5">Username</th>
                    <th className="py-3 px-5">Peran / Role</th>
                    <th className="py-3 px-5">Cabang Penugasan</th>
                    <th className="py-3 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-5 font-bold text-brand-espresso">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-espresso text-brand-gold font-bold text-xs flex items-center justify-center shrink-0">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{staff.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono font-semibold text-secondary">
                        @{staff.username || '-'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            staff.role === 'OWNER'
                              ? 'bg-brand-espresso text-brand-gold'
                              : staff.role === 'SUPERVISOR'
                              ? 'bg-brand-terracotta text-white'
                              : 'bg-surface-container text-brand-espresso border border-border-subtle'
                          }`}
                        >
                          {staff.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-brand-espresso">
                        {staff.outletName || (staff.role === 'OWNER' ? 'Seluruh Cabang (Pusat)' : 'Supervisor Area')}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {isOwner && staff.id !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus Akun Staf"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredStaff.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-xs text-secondary">Tidak ada staf yang cocok dengan pencarian.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PANDUAN PENAMBAHAN CABANG */}
      {activeTab === 'guide' && (
        <div className="bg-surface-card rounded-3xl border border-border-subtle p-6 sm:p-8 space-y-6">
          <div className="max-w-3xl space-y-3">
            <h2 className="font-serif-title font-bold text-xl text-brand-espresso">
              Prosedur Standard Operasional (SOP) Pembukaan Cabang Baru
            </h2>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              Panduan lengkap bagi manajemen Dimsum Intan dalam melakukan ekspansi cabang fisik baru agar pencatatan stok, modal shift kasir, dan akuntansi pajak berjalan tanpa kendala.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-espresso">
                <span className="w-6 h-6 rounded-lg bg-brand-gold text-brand-espresso flex items-center justify-center font-bold">1</span>
                <span>Penetapan Target Omset & Kas Kecil Awal</span>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Tentukan target harian realistis berdasarkan traffic lokasi (misal Rp 4.500.000/hari untuk Dipatiukur). Alokasikan modal laci shift awal Rp 200.000 dan saldo kas kecil darurat Rp 1.000.000 di brankas cabang.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-espresso">
                <span className="w-6 h-6 rounded-lg bg-brand-gold text-brand-espresso flex items-center justify-center font-bold">2</span>
                <span>Pembuatan Akun Kasir Spesifik Cabang</span>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Buat akun kasir khusus yang di-lock pada cabang bersangkutan. Kasir tidak diperkenankan berbagi kredensial demi akuntabilitas saat closing shift dan selisih fisik kas harian.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-espresso">
                <span className="w-6 h-6 rounded-lg bg-brand-gold text-brand-espresso flex items-center justify-center font-bold">3</span>
                <span>Penerimaan Faktur Suplai Pabrik Pertama</span>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Pabrik mengirim stok beku awal (siomay ayam, udang, nori, hisit kau) yang dicatat melalui menu "Tagihan Suplai Pabrik". Pastikan cabang menerima dan memverifikasi nota surat jalan fisik.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-espresso">
                <span className="w-6 h-6 rounded-lg bg-brand-gold text-brand-espresso flex items-center justify-center font-bold">4</span>
                <span>Monitoring Realtime Laba Rugi Cabang</span>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Pantau kinerja harian melalui filter cabang di Dashboard & Laporan Laba Rugi. Owner dapat mengevaluasi efisiensi biaya operasional (listrik, sewa, gas) terhadap margin kotor penjualan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE BRANCH LICENSE PAYMENT MODAL (Stitch Architecture)         */}
      {/* ========================================================================= */}
      {isLicenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-espresso/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-card rounded-3xl border border-border-strong shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-gold/20 text-brand-terracotta border border-brand-gold/40">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif-title font-bold text-base text-brand-espresso">
                    Konfirmasi Pembayaran Lisensi Cabang Baru
                  </h4>
                  <p className="text-[11px] text-secondary">
                    Aktivasi Multi-Outlet Dimsum Intan Instant POS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLicenseModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-surface-container flex items-center justify-center text-secondary hover:text-brand-espresso transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Order Breakdown */}
              <div className="bg-surface-container rounded-2xl p-4 border border-border-subtle space-y-2.5">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-brand-espresso">1x Lisensi Gerai Fisik (Cabang #{outlets.length + 1})</div>
                    <div className="text-[11px] text-secondary">Contoh: Outlet Dipatiukur / Riau / Buah Batu</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm text-brand-espresso">Rp 100.000</div>
                    <div className="text-[10px] text-secondary font-semibold">/ 30 Hari</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle flex justify-between items-center text-xs">
                  <span className="text-secondary">Biaya Administrasi & Payment Gateway</span>
                  <span className="text-emerald-700 font-bold">GRATIS (Rp 0)</span>
                </div>

                <div className="pt-2 border-t border-border-strong flex justify-between items-center">
                  <span className="font-bold text-sm text-brand-espresso">Total Tagihan Instan</span>
                  <span className="text-lg font-black text-brand-terracotta">Rp 100.000</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-brand-espresso">Pilih Metode Pembayaran Cepat:</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLicensePaymentMethod('QRIS')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      licensePaymentMethod === 'QRIS'
                        ? 'border-brand-gold bg-brand-gold/10'
                        : 'border-border-subtle bg-surface-container hover:bg-surface-card'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-brand-terracotta shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-brand-espresso">QRIS Dinamis</div>
                      <div className="text-[10px] text-secondary">BCA, GoPay, OVO, ShopeePay</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLicensePaymentMethod('VA')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      licensePaymentMethod === 'VA'
                        ? 'border-brand-gold bg-brand-gold/10'
                        : 'border-border-subtle bg-surface-container hover:bg-surface-card'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-brand-terracotta shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-brand-espresso">Transfer VA</div>
                      <div className="text-[10px] text-secondary">BCA / Mandiri / BRI Direct</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* QRIS / VA Interactive Display */}
              <div className="p-4 bg-surface-container/60 border border-border-subtle rounded-2xl flex flex-col items-center text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Berlaku 15:00 Menit (Auto-Check Gateway)</span>
                </div>

                {licensePaymentMethod === 'QRIS' ? (
                  <div className="p-4 bg-white border border-border-strong rounded-2xl shadow-inner flex flex-col items-center">
                    <div className="w-36 h-36 bg-brand-espresso p-2 rounded-xl flex flex-col justify-between items-center relative">
                      <div className="w-full flex justify-between">
                        <div className="w-7 h-7 bg-surface-canvas rounded-sm p-1">
                          <div className="w-full h-full bg-brand-espresso" />
                        </div>
                        <div className="w-7 h-7 bg-surface-canvas rounded-sm p-1">
                          <div className="w-full h-full bg-brand-espresso" />
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-brand-espresso font-black text-[10px]">
                        QRIS
                      </div>
                      <div className="w-full flex justify-between">
                        <div className="w-7 h-7 bg-surface-canvas rounded-sm p-1">
                          <div className="w-full h-full bg-brand-espresso" />
                        </div>
                        <div className="w-5 h-5 bg-brand-terracotta rounded-full" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-brand-espresso mt-2">
                      NMID: ID1024889210928
                    </span>
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-border-strong rounded-2xl shadow-inner w-full max-w-sm text-left space-y-2">
                    <span className="text-[10px] uppercase font-bold text-secondary block">
                      Nomor Virtual Account Mandiri / BCA:
                    </span>
                    <div className="text-base font-mono font-black text-brand-espresso tracking-wider bg-surface-container p-2 rounded-xl text-center">
                      8801 0812 3456 7890
                    </div>
                    <span className="text-[10px] text-secondary text-center block">
                      Atas Nama: <strong className="text-brand-espresso">PT Pro Teknologi / Dimsum Intan</strong>
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-secondary max-w-xs leading-relaxed">
                  Pindai QR atau transfer via VA di atas. Setelah pembayaran selesai, kuota cabang akan otomatis aktif seketika.
                </p>
              </div>

              {/* Security Guarantee Notice */}
              <div className="flex items-center gap-2 text-[11px] text-secondary justify-center">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Diproses aman secara otomatis oleh Duitku / Midtrans Network</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-surface-container-low border-t border-border-subtle flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsLicenseModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso hover:bg-surface-card transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessingLicensePayment}
                onClick={handleConfirmLicensePayment}
                className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-brand-espresso" />
                <span>{isProcessingLicensePayment ? 'Memverifikasi Pembayaran...' : 'Konfirmasi & Terbitkan Kuota Outlet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH / EDIT CABANG OUTLET                                      */}
      {/* ========================================================================= */}
      {isOutletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-espresso/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-card rounded-3xl border border-border-strong shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                <h3 className="font-serif-title font-bold text-base text-brand-espresso">
                  {editingOutlet ? 'Edit Data Cabang' : 'Pendaftaran Cabang Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOutletModalOpen(false)}
                className="p-1 rounded-lg text-secondary hover:text-brand-espresso transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOutlet} className="p-6 space-y-4">
              {outletError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{outletError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Kode Cabang *
                  </label>
                  <input
                    type="text"
                    value={outletCode}
                    onChange={(e) => setOutletCode(e.target.value)}
                    placeholder="Contoh: DPU, RIAU"
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-bold text-brand-espresso uppercase focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Kota Lokasi *
                  </label>
                  <input
                    type="text"
                    value={outletCity}
                    onChange={(e) => setOutletCity(e.target.value)}
                    placeholder="Bandung"
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs text-brand-espresso focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-secondary uppercase">
                  Nama Cabang Resmi *
                </label>
                <input
                  type="text"
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  placeholder="Contoh: Outlet Dipatiukur"
                  className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-bold text-brand-espresso focus:outline-none focus:border-brand-gold"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-secondary uppercase">
                  Alamat Lengkap Gerai *
                </label>
                <textarea
                  value={outletAddress}
                  onChange={(e) => setOutletAddress(e.target.value)}
                  placeholder="Jl. Dipati Ukur No. 45, Lebakgede, Coblong, Kota Bandung..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs text-brand-espresso focus:outline-none focus:border-brand-gold resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    No. Telepon / WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={outletPhone}
                    onChange={(e) => setOutletPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs text-brand-espresso focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Target Omset Harian (Rp)
                  </label>
                  <input
                    type="number"
                    value={outletTarget}
                    onChange={(e) => setOutletTarget(e.target.value)}
                    placeholder="4500000"
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-bold text-brand-espresso focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsOutletModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso hover:bg-surface-container transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingOutlet}
                  className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSavingOutlet ? 'Menyimpan...' : editingOutlet ? 'Perbarui Cabang' : 'Simpan & Buka Cabang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BUAT AKUN KASIR / STAF BARU                                      */}
      {/* ========================================================================= */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-espresso/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-card rounded-3xl border border-border-strong shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <h3 className="font-serif-title font-bold text-base text-brand-espresso">
                  Pendaftaran Akun Staf Cabang
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 rounded-lg text-secondary hover:text-brand-espresso transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              {staffError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Nama Lengkap Staf *
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="Contoh: Siti Rahmawati"
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-bold text-brand-espresso focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    value={staffUsername}
                    onChange={(e) => setStaffUsername(e.target.value)}
                    placeholder="Contoh: kasir_dago"
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-mono font-bold text-brand-espresso lowercase focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Kata Sandi (Password) *
                  </label>
                  <input
                    type="password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Minimal 6 karakter..."
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs text-brand-espresso focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Peran Pengguna (Role) *
                  </label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as UserRole)}
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-bold text-brand-espresso focus:outline-none focus:border-brand-gold"
                  >
                    <option value="KASIR">KASIR (Hanya Akses POS & Shift di Cabang)</option>
                    <option value="SUPERVISOR">SUPERVISOR (Akses Verifikasi & Void)</option>
                  </select>
                </div>

                {staffRole === 'KASIR' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-secondary uppercase">
                      Cabang Penugasan Kasir *
                    </label>
                    <select
                      value={staffOutletId}
                      onChange={(e) => setStaffOutletId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-bold text-brand-espresso focus:outline-none focus:border-brand-gold"
                      required={outlets.length > 0}
                    >
                      {outlets.length === 0 ? (
                        <option value="">Semua Outlet (Pusat Konsolider)</option>
                      ) : (
                        outlets.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} ({o.code})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {staffRole === 'SUPERVISOR' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-secondary uppercase">
                      PIN Otorisasi (4 Digit) *
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={staffPin}
                      onChange={(e) => setStaffPin(e.target.value)}
                      placeholder="1234"
                      className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-center text-sm font-bold tracking-widest text-brand-espresso focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso hover:bg-surface-container transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingStaff}
                  className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSavingStaff ? 'Mendaftarkan...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
