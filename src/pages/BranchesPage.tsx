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
                <span>Tambah Cabang Baru</span>
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
              Aktif di Kota Bandung
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
        <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-2xl border border-border-subtle overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('outlets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
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
        <div className="space-y-4">
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

          {filteredOutlets.length === 0 && (
            <div className="text-center py-16 bg-surface-card rounded-3xl border border-dashed border-border-subtle">
              <Store className="w-12 h-12 text-secondary mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-brand-espresso text-base">Tidak ada cabang ditemukan</h3>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                Silakan ubah kata kunci pencarian Anda atau tambahkan cabang baru melalui tombol di atas.
              </p>
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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="bg-surface-card rounded-3xl p-6 border border-border-subtle shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold text-brand-espresso flex items-center justify-center font-black text-sm">
              1
            </div>
            <h3 className="font-bold text-base text-brand-espresso">
              Input Data Cabang di Form
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              Klik tombol <strong>"Tambah Cabang Baru"</strong>. Masukkan kode cabang unik (contoh: <code>DG-04</code>), nama cabang (contoh: Cabang Dago Heritage), kota, alamat lengkap, kontak WhatsApp, dan target omset harian.
            </p>
            <div className="p-3 bg-surface-container rounded-xl text-[11px] text-secondary">
              💡 <em>Cabang langsung tersimpan permanen di cloud database PostgreSQL.</em>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-surface-card rounded-3xl p-6 border border-border-subtle shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-terracotta text-white flex items-center justify-center font-black text-sm">
              2
            </div>
            <h3 className="font-bold text-base text-brand-espresso">
              Daftarkan Akun Kasir Cabang
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              Pilih tab <strong>"Staf & Kasir Cabang"</strong> dan klik <strong>"Daftarkan Staf Baru"</strong>. Buatkan username & password untuk kasir yang bertugas di cabang baru tersebut, lalu pilih cabang penugasannya.
            </p>
            <div className="p-3 bg-surface-container rounded-xl text-[11px] text-secondary">
              🔒 <em>Kasir hanya akan melihat data kas & shift di cabangnya sendiri.</em>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-surface-card rounded-3xl p-6 border border-border-subtle shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-espresso text-brand-gold flex items-center justify-center font-black text-sm">
              3
            </div>
            <h3 className="font-bold text-base text-brand-espresso">
              Kasir Buka Shift & Mulai Transaksi
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              Kasir dapat login menggunakan username baru di perangkat tablet/komputer kasir outlet. Kasir menginput modal awal laci shift, lalu langsung siap melayani pesanan Dine-In & Takeaway.
            </p>
            <div className="p-3 bg-surface-container rounded-xl text-[11px] text-secondary">
              📊 <em>Seluruh omset, kas kecil, dan tagihan pabrik otomatis terkonsolidasi ke laporan keuangan pusat.</em>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FORM TAMBAH / EDIT CABANG */}
      {isOutletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-surface-card rounded-3xl border border-border-subtle shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-gradient-to-r from-brand-espresso to-[#3a2824] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold text-brand-espresso flex items-center justify-center font-bold shadow-md">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-title font-bold text-lg text-white">
                    {editingOutlet ? `Edit: ${editingOutlet.name}` : 'Tambah Cabang Baru'}
                  </h2>
                  <p className="text-[11px] text-white/70">
                    Daftarkan outlet fisik baru Dimsum Intan ke jaringan POS Cloud
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOutletModalOpen(false)}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOutlet} className="p-6 space-y-4">
              {outletError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{outletError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kode Cabang */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Kode Cabang *
                  </label>
                  <input
                    type="text"
                    value={outletCode}
                    onChange={(e) => setOutletCode(e.target.value)}
                    placeholder="Contoh: DU-01 / DG-04"
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-bold text-brand-espresso uppercase focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                {/* Nama Cabang */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Nama Cabang *
                  </label>
                  <input
                    type="text"
                    value={outletName}
                    onChange={(e) => setOutletName(e.target.value)}
                    placeholder="Contoh: Cabang Dago Heritage"
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-bold text-brand-espresso focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                {/* Kota */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Kota / Wilayah *
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

                {/* Nomor Telepon / WA */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    No. Telepon / WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={outletPhone}
                    onChange={(e) => setOutletPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs text-brand-espresso focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                {/* Target Penjualan Harian */}
                <div className="flex flex-col gap-1 sm:col-span-2">
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

                {/* Alamat Lengkap */}
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Alamat Lengkap *
                  </label>
                  <textarea
                    rows={2}
                    value={outletAddress}
                    onChange={(e) => setOutletAddress(e.target.value)}
                    placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota Bandung"
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs text-brand-espresso focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>
              </div>

              {/* Form Buttons */}
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
                  {isSavingOutlet ? 'Menyimpan...' : editingOutlet ? 'Simpan Perubahan' : 'Daftarkan Cabang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FORM TAMBAH KASIR / STAF */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-gradient-to-r from-brand-espresso to-[#3a2824] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold text-brand-espresso flex items-center justify-center font-bold shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-title font-bold text-lg text-white">
                    Daftarkan Akun Staf Baru
                  </h2>
                  <p className="text-[11px] text-white/70">
                    Buat akun login untuk kasir atau supervisor cabang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              {staffError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              <div className="space-y-3.5">
                {/* Nama Lengkap */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Nama Lengkap Staf *
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="Contoh: Rina Kasir Dago"
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-bold text-brand-espresso focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                {/* Username */}
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

                {/* Password */}
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

                {/* Peran / Role */}
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

                {/* Cabang Penugasan (khusus Kasir) */}
                {staffRole === 'KASIR' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-secondary uppercase">
                      Cabang Penugasan Kasir *
                    </label>
                    <select
                      value={staffOutletId}
                      onChange={(e) => setStaffOutletId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-bold text-brand-espresso focus:outline-none focus:border-brand-gold"
                      required
                    >
                      {outlets.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* PIN Supervisor */}
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

              {/* Form Buttons */}
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
