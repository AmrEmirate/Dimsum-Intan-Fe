import React, { useState, useEffect, useCallback } from 'react';
import {
  Crown,
  Building2,
  Store,
  Users,
  ShoppingBag,
  DollarSign,
  Plus,
  RefreshCw,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  Palette,
  Globe,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TenantInfo } from '../types';
import { api } from '../services/apiClient';

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalOutlets: number;
  totalOrders: number;
  totalGmv: number;
  plans: { plan: string; count: number }[];
}

const THEME_PRESETS = [
  { name: 'Dimsum Orange', color: '#ea580c' },
  { name: 'Kopi Espresso', color: '#78350f' },
  { name: 'Matcha Forest', color: '#15803d' },
  { name: 'Ocean Sapphire', color: '#0284c7' },
  { name: 'Royal Velvet', color: '#7e22ce' },
  { name: 'Charcoal Minimalist', color: '#1f2937' },
];

export const SuperadminPortalPage: React.FC = () => {
  const { showNotification, switchTenantView, currentTenant } = useApp();

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('ALL');

  // Modals state
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingTenant, setEditingTenant] = useState<TenantInfo | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  // Quick Onboarding Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCustomDomain, setFormCustomDomain] = useState('');
  const [formPlan, setFormPlan] = useState<'STARTER' | 'PRO' | 'ENTERPRISE'>('PRO');
  const [formThemeColor, setFormThemeColor] = useState('#ea580c');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formOwnerUsername, setFormOwnerUsername] = useState('');
  const [formOwnerPassword, setFormOwnerPassword] = useState('');
  const [formInitialOutlet, setFormInitialOutlet] = useState('Cabang Utama');
  const [formSeedMenus, setFormSeedMenus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Auto-generate slug as name changes
  const handleNameChange = (val: string) => {
    setFormName(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setFormSlug(generated);
  };

  const fetchPlatformData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, tenantsRes] = await Promise.all([
        api.get<{ success: boolean; data: PlatformStats }>('/superadmin/stats').catch(() => null),
        api.get<{ success: boolean; data: TenantInfo[] }>('/superadmin/tenants').catch(() => null),
      ]);

      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (tenantsRes?.success && Array.isArray(tenantsRes.data)) {
        setTenants(tenantsRes.data);
      }
    } catch (err: any) {
      showNotification('Gagal memuat data portal superadmin', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchPlatformData();
  }, [fetchPlatformData]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formOwnerUsername || !formOwnerPassword || !formOwnerName) {
      showNotification('Harap lengkapi semua field wajib!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; message: string; data: any }>('/superadmin/tenants', {
        name: formName,
        slug: formSlug,
        customDomain: formCustomDomain || undefined,
        plan: formPlan,
        themeColor: formThemeColor,
        ownerName: formOwnerName,
        ownerUsername: formOwnerUsername,
        ownerPassword: formOwnerPassword,
        initialOutletName: formInitialOutlet,
        seedSampleMenus: formSeedMenus,
      });

      if (res.success) {
        showNotification(res.message, 'success');
        setSuccessResult({
          ...res.data,
          ownerPassword: formOwnerPassword,
        });
        setIsOnboardModalOpen(false);
        // Reset form
        setFormName('');
        setFormSlug('');
        setFormCustomDomain('');
        setFormOwnerName('');
        setFormOwnerUsername('');
        setFormOwnerPassword('');
        fetchPlatformData();
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal mendaftarkan tenant', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    try {
      const res = await api.put<{ success: boolean; message: string }>(`/superadmin/tenants/${editingTenant.id}`, {
        name: editingTenant.name,
        themeColor: editingTenant.themeColor,
        plan: editingTenant.plan,
        status: editingTenant.status,
        customDomain: editingTenant.customDomain || '',
      });

      if (res.success) {
        showNotification(res.message, 'success');
        setIsEditModalOpen(false);
        setEditingTenant(null);
        fetchPlatformData();
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal memperbarui tenant', 'error');
    }
  };

  const handleToggleStatus = async (tenant: TenantInfo) => {
    const nextStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await api.put<{ success: boolean; message: string }>(`/superadmin/tenants/${tenant.id}`, {
        status: nextStatus,
      });
      if (res.success) {
        showNotification(`Status ${tenant.name} diubah menjadi ${nextStatus}`, 'success');
        fetchPlatformData();
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal mengubah status tenant', 'error');
    }
  };

  const handleDeleteTenant = async (tenant: TenantInfo) => {
    if (tenant.slug === 'dimsum-intan') {
      showNotification('Tenant bawaan sistem (Dimsum Intan) tidak boleh dihapus!', 'warning');
      return;
    }

    const confirmDelete = window.confirm(
      `PERINGATAN: Anda yakin ingin menghapus tenant "${tenant.name}" (${tenant.slug})?\nSeluruh data cabang, user, menu, dan transaksi akan dihapus secara permanen!`
    );
    if (!confirmDelete) return;

    try {
      const res = await api.delete<{ success: boolean; message: string }>(`/superadmin/tenants/${tenant.id}`);
      if (res.success) {
        showNotification(res.message, 'success');
        fetchPlatformData();
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal menghapus tenant', 'error');
    }
  };

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
    showNotification('Teks berhasil disalin ke clipboard!', 'info');
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customDomain && t.customDomain.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPlan = selectedPlanFilter === 'ALL' || t.plan === selectedPlanFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Platform Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-brand-espresso via-stone-900 to-brand-espresso p-6 sm:p-8 text-white shadow-xl border border-brand-gold/20">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-xs font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5" />
              <span>Multi-Tenant Cloud SaaS Central Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-title font-black text-white tracking-tight">
              Portal Superadmin Platform
            </h1>
            <p className="text-sm text-stone-300 leading-relaxed">
              Pusat kendali operasional multi-tenant. Onboarding klien F&B baru dalam waktu &lt; 10 detik, kontrol lisensi
              paket, dan monitor metrik omset seluruh jaringan bisnis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsOnboardModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso font-black text-sm shadow-lg shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-brand-espresso" />
              <span>+ Daftarkan Toko Baru (&lt; 10 Dtk)</span>
            </button>
            <button
              onClick={fetchPlatformData}
              disabled={isLoading}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Platform Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-xs hover:border-brand-gold/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Total Tenant Bisnis</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-brand-espresso">{stats?.totalTenants ?? 0}</span>
            <span className="text-xs font-bold text-emerald-600">
              ({stats?.activeTenants ?? 0} Aktif)
            </span>
          </div>
          <p className="text-[11px] text-secondary mt-1">Jaringan brand F&B terdaftar</p>
        </div>

        <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-xs hover:border-brand-gold/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Total Cabang Outlet</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-brand-espresso">{stats?.totalOutlets ?? 0}</span>
            <span className="text-xs font-bold text-secondary">Outlet Fisik</span>
          </div>
          <p className="text-[11px] text-secondary mt-1">Tersebar di seluruh tenant</p>
        </div>

        <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-xs hover:border-brand-gold/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Total Transaksi POS</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-brand-espresso">{stats?.totalOrders ?? 0}</span>
            <span className="text-xs font-bold text-secondary">Nota Terbit</span>
          </div>
          <p className="text-[11px] text-secondary mt-1">Diproses oleh seluruh kasir</p>
        </div>

        <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-xs hover:border-brand-gold/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Total Platform GMV</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-brand-espresso">
              Rp {(stats?.totalGmv ?? 0).toLocaleString('id-ID')}
            </span>
          </div>
          <p className="text-[11px] text-secondary mt-1">Akumulasi omset seluruh tenant</p>
        </div>
      </div>

      {/* Tenant Directory Section */}
      <div className="bg-surface-card rounded-3xl border border-border-subtle shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-5 border-b border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama bisnis, subdomain, atau domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-container text-xs font-medium text-brand-espresso focus:outline-none focus:ring-2 focus:ring-brand-gold/50 border border-border-subtle"
              />
            </div>

            <select
              value={selectedPlanFilter}
              onChange={(e) => setSelectedPlanFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-surface-container text-xs font-bold text-brand-espresso focus:outline-none border border-border-subtle cursor-pointer"
            >
              <option value="ALL">Semua Paket</option>
              <option value="STARTER">Starter</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>

          <div className="text-xs text-secondary font-medium">
            Menampilkan <span className="font-bold text-brand-espresso">{filteredTenants.length}</span> dari{' '}
            <span className="font-bold text-brand-espresso">{tenants.length}</span> tenant
          </div>
        </div>

        {/* Tenant Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle text-secondary font-bold uppercase tracking-wider">
                <th className="py-3.5 px-5">Bisnis & Subdomain</th>
                <th className="py-3.5 px-4">Paket & Status</th>
                <th className="py-3.5 px-4">Aset & Data</th>
                <th className="py-3.5 px-4">Total Omset (GMV)</th>
                <th className="py-3.5 px-4">Tanggal Dibuat</th>
                <th className="py-3.5 px-5 text-right">Aksi Superadmin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/70">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-secondary">
                    <Building2 className="w-10 h-10 mx-auto text-secondary/40 mb-2" />
                    <p className="font-bold text-sm">Tidak ada tenant ditemukan</p>
                    <p className="text-xs text-secondary/70">Coba ubah kata kunci pencarian atau daftarkan toko baru.</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const isCurrentScoped = currentTenant?.id === t.id;
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-surface-container-low/70 transition-colors ${
                        isCurrentScoped ? 'bg-brand-gold/10 font-medium' : ''
                      }`}
                    >
                      {/* Name & Domain */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-xs shrink-0"
                            style={{ backgroundColor: t.themeColor || '#ea580c' }}
                          >
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-brand-espresso truncate">{t.name}</span>
                              {t.slug === 'dimsum-intan' && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-espresso font-bold border border-brand-gold/40">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-secondary font-mono">
                              {t.slug}.posmu.cloud
                            </span>
                            {t.customDomain && (
                              <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
                                <Globe className="w-3 h-3" /> {t.customDomain}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan & Status */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              t.plan === 'ENTERPRISE'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : t.plan === 'PRO'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-stone-100 text-stone-800 border border-stone-300'
                            }`}
                          >
                            {t.plan}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              t.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                t.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            {t.status}
                          </span>
                        </div>
                      </td>

                      {/* Counts */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col text-[11px] text-secondary gap-0.5">
                          <span className="font-semibold text-brand-espresso">
                            {t.counts?.outlets ?? 0} Outlet • {t.counts?.users ?? 0} Pengguna
                          </span>
                          <span>
                            {t.counts?.menus ?? 0} Menu • {t.counts?.orders ?? 0} Pesanan
                          </span>
                        </div>
                      </td>

                      {/* Total GMV */}
                      <td className="py-4 px-4">
                        <span className="font-black text-brand-espresso text-sm">
                          Rp {(t.totalGmv ?? 0).toLocaleString('id-ID')}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 text-secondary text-[11px]">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Switch Context Button */}
                          <button
                            type="button"
                            onClick={() => switchTenantView(t.id, t.slug)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isCurrentScoped
                                ? 'bg-brand-espresso text-brand-gold ring-2 ring-brand-gold'
                                : 'bg-surface-container hover:bg-surface-container-high text-brand-espresso border border-border-subtle'
                            }`}
                            title="Beralih ke konteks toko ini untuk melihat POS dan laporannya"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{isCurrentScoped ? 'Sedang Dilihat' : 'Masuk Toko'}</span>
                          </button>

                          {/* Edit Settings Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTenant(t);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary hover:text-brand-espresso border border-border-subtle transition-all cursor-pointer"
                            title="Ubah Konfigurasi Tenant"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Status Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                              t.status === 'ACTIVE'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={t.status === 'ACTIVE' ? 'Nonaktifkan / Suspend' : 'Aktifkan Kembali'}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Tenant Button */}
                          {t.slug !== 'dimsum-intan' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTenant(t)}
                              className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all cursor-pointer"
                              title="Hapus Tenant & Seluruh Datanya"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Quick Onboarding (< 10 Detik) */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/70 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateTenant}
            className="w-full max-w-xl bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 sm:p-7 relative my-8"
          >
            <button
              type="button"
              onClick={() => setIsOnboardModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-secondary hover:bg-surface-container cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-brand-gold mb-1">
              <Sparkles className="w-5 h-5 text-brand-gold" />
              <h3 className="font-serif-title font-black text-xl text-brand-espresso">
                Daftarkan Toko Baru (&lt; 10 Detik)
              </h3>
            </div>
            <p className="text-xs text-secondary mb-5">
              Sistem akan otomatis membuat tenant, initial outlet cabang, dan akun login Owner secara instan.
            </p>

            <div className="space-y-4">
              {/* Business Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-espresso">Nama Brand / Bisnis *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kopi Senja Bahagia"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs font-semibold text-brand-espresso border border-border-subtle focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-espresso">Subdomain SaaS (Slug) *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="kopisenja"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full p-2.5 pr-28 rounded-xl bg-surface-container text-xs font-mono font-bold text-brand-espresso border border-border-subtle focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-secondary font-mono pointer-events-none">
                      .posmu.cloud
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan & Theme Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-espresso">Paket Langganan SaaS</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs font-bold text-brand-espresso border border-border-subtle focus:outline-none cursor-pointer"
                  >
                    <option value="STARTER">Starter (1 Cabang - Subdomain)</option>
                    <option value="PRO">Growth / Pro (Multi Cabang & HPP)</option>
                    <option value="ENTERPRISE">Enterprise (Custom Dedicated)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-espresso">Aksen Warna Tema Brand</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formThemeColor}
                      onChange={(e) => setFormThemeColor(e.target.value)}
                      className="w-10 h-9 rounded-xl border border-border-subtle cursor-pointer p-0.5 bg-surface-container"
                    />
                    <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-1">
                      {THEME_PRESETS.map((preset) => (
                        <button
                          key={preset.color}
                          type="button"
                          onClick={() => setFormThemeColor(preset.color)}
                          className={`w-6 h-6 rounded-lg transition-transform cursor-pointer shrink-0 ${
                            formThemeColor === preset.color ? 'scale-125 ring-2 ring-brand-espresso' : 'opacity-80'
                          }`}
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner Credentials */}
              <div className="bg-surface-container-low p-3.5 rounded-2xl border border-border-subtle space-y-3">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                  Kredensial Akun Pemilik (Owner) Toko
                </span>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-espresso">Nama Lengkap Owner *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formOwnerName}
                    onChange={(e) => setFormOwnerName(e.target.value)}
                    className="w-full p-2 rounded-xl bg-surface-card text-xs font-medium text-brand-espresso border border-border-subtle focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-espresso">Username Login *</label>
                    <input
                      type="text"
                      required
                      placeholder="senja_owner"
                      value={formOwnerUsername}
                      onChange={(e) => setFormOwnerUsername(e.target.value.toLowerCase().trim())}
                      className="w-full p-2 rounded-xl bg-surface-card text-xs font-mono font-bold text-brand-espresso border border-border-subtle focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-espresso">Password Baru *</label>
                    <input
                      type="text"
                      required
                      placeholder="senja123"
                      value={formOwnerPassword}
                      onChange={(e) => setFormOwnerPassword(e.target.value)}
                      className="w-full p-2 rounded-xl bg-surface-card text-xs font-bold text-brand-espresso border border-border-subtle focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Initial Outlet & Sample Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-espresso">Nama Cabang Pertama</label>
                  <input
                    type="text"
                    value={formInitialOutlet}
                    onChange={(e) => setFormInitialOutlet(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs font-medium text-brand-espresso border border-border-subtle focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-espresso">
                    <input
                      type="checkbox"
                      checked={formSeedMenus}
                      onChange={(e) => setFormSeedMenus(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold"
                    />
                    <span>Isi 3 Menu Sampel & HPP Awal</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsOnboardModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso hover:bg-surface-container transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Buat Toko Sekarang (&lt; 10 Dtk)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Celebratory Success Modal with Credentials */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-surface-card rounded-3xl border border-brand-gold/40 shadow-2xl p-6 sm:p-7 relative text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="font-serif-title font-black text-xl text-brand-espresso">
              Toko Berhasil Didaftarkan! 🎉
            </h3>
            <p className="text-xs text-secondary mt-1">
              Bisnis <span className="font-bold text-brand-espresso">{successResult.tenant.name}</span> kini aktif dan
              siap menerima transaksi kasir.
            </p>

            {/* Credentials Card */}
            <div className="mt-5 p-4 rounded-2xl bg-surface-container-low border border-border-subtle text-left space-y-2.5 font-mono text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary block font-sans">
                  URL Toko / Kasir:
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-bold text-brand-espresso truncate">
                    {window.location.origin}/?tenant={successResult.tenant.slug}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        `${window.location.origin}/?tenant=${successResult.tenant.slug}`,
                        'url'
                      )
                    }
                    className="p-1 rounded text-secondary hover:text-brand-espresso cursor-pointer"
                  >
                    {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-secondary block font-sans">
                  Username Owner:
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-bold text-brand-espresso">{successResult.owner.username}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(successResult.owner.username, 'usr')}
                    className="p-1 rounded text-secondary hover:text-brand-espresso cursor-pointer"
                  >
                    {copiedField === 'usr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-secondary block font-sans">
                  Password:
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-bold text-brand-espresso">{successResult.ownerPassword}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(successResult.ownerPassword, 'pwd')}
                    className="p-1 rounded text-secondary hover:text-brand-espresso cursor-pointer"
                  >
                    {copiedField === 'pwd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  switchTenantView(successResult.tenant.id, successResult.tenant.slug);
                  setSuccessResult(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso font-black text-xs transition-all cursor-pointer"
              >
                Buka & Masuk Toko Ini
              </button>
              <button
                type="button"
                onClick={() => setSuccessResult(null)}
                className="py-2.5 px-4 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso hover:bg-surface-container cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Tenant Settings */}
      {isEditModalOpen && editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleUpdateTenant}
            className="w-full max-w-lg bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative"
          >
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingTenant(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-secondary hover:bg-surface-container cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif-title font-black text-lg text-brand-espresso mb-1">
              Ubah Pengaturan Tenant: {editingTenant.name}
            </h3>
            <p className="text-xs text-secondary mb-4">
              Konfigurasi domain kustom, paket lisensi, dan status operasional.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-espresso">Nama Brand / Usaha</label>
                <input
                  type="text"
                  value={editingTenant.name}
                  onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs font-semibold text-brand-espresso border border-border-subtle focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-espresso">Custom Domain (FQDN)</label>
                <input
                  type="text"
                  placeholder="kasir.namabrand.com"
                  value={editingTenant.customDomain || ''}
                  onChange={(e) => setEditingTenant({ ...editingTenant, customDomain: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs font-mono text-brand-espresso border border-border-subtle focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-espresso">Paket Layanan</label>
                  <select
                    value={editingTenant.plan}
                    onChange={(e) => setEditingTenant({ ...editingTenant, plan: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs font-bold text-brand-espresso border border-border-subtle focus:outline-none cursor-pointer"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Growth / Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-espresso">Status Lisensi</label>
                  <select
                    value={editingTenant.status}
                    onChange={(e) => setEditingTenant({ ...editingTenant, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs font-bold text-brand-espresso border border-border-subtle focus:outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE (Aktif)</option>
                    <option value="SUSPENDED">SUSPENDED (Disuspensi)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-espresso">Warna Tema Brand (HEX)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingTenant.themeColor || '#ea580c'}
                    onChange={(e) => setEditingTenant({ ...editingTenant, themeColor: e.target.value })}
                    className="w-10 h-9 rounded-xl border border-border-subtle cursor-pointer p-0.5 bg-surface-container"
                  />
                  <input
                    type="text"
                    value={editingTenant.themeColor || '#ea580c'}
                    onChange={(e) => setEditingTenant({ ...editingTenant, themeColor: e.target.value })}
                    className="flex-1 p-2 rounded-xl bg-surface-container text-xs font-mono font-bold text-brand-espresso border border-border-subtle focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTenant(null);
                }}
                className="px-4 py-2 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-black transition-all cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
