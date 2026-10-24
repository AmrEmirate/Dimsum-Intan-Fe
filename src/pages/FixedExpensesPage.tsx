import React, { useState } from 'react';
import {
  WalletCards,
  Building,
  Users,
  Zap,
  Wifi,
  Lock,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Check,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FixedExpense, FixedExpenseCategory } from '../types';


export const FixedExpensesPage: React.FC = () => {
  const {
    fixedExpenses,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    toggleFixedExpenseStatus,
    currentUser,
    selectedOutletId,
    outlets,
    showNotification,
  } = useApp();

  const isOwner = currentUser.role === 'OWNER';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<FixedExpenseCategory>('SEWA_LAPAK');
  const [formOutletId, setFormOutletId] = useState('du');
  const [formAmount, setFormAmount] = useState('7500000');
  const [formDueDate, setFormDueDate] = useState('2024-11-05');
  const [formAutoDebet, setFormAutoDebet] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<FixedExpenseCategory>('SEWA_LAPAK');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAutoDebet, setEditAutoDebet] = useState(false);

  const handleOpenEdit = (expense: FixedExpense) => {
    if (!isOwner) {
      showNotification('Hanya OWNER yang berwenang mengubah beban operasional!', 'error');
      return;
    }
    setEditingExpense(expense);
    setEditTitle(expense.title);
    setEditCategory(expense.category);
    setEditAmount(expense.amount.toString());
    setEditDueDate(expense.dueDate);
    setEditAutoDebet(expense.autoDebet);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    await updateFixedExpense(editingExpense.id, {
      title: editTitle,
      category: editCategory,
      amount: parseFloat(editAmount) || 0,
      dueDate: editDueDate,
      autoDebet: editAutoDebet,
    });
    setIsEditModalOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (expense: FixedExpense) => {
    if (!isOwner) {
      showNotification('Hanya OWNER yang berwenang menghapus beban operasional!', 'error');
      return;
    }
    if (window.confirm(`Hapus catatan beban operasional "${expense.title}"?`)) {
      await deleteFixedExpense(expense.id);
    }
  };

  // Calculations
  const filteredExpenses = fixedExpenses.filter((e) => {
    if (selectedOutletId === 'all') return true;
    return e.outletId === selectedOutletId || e.outletId === 'all';
  });


  const totalOpex = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalSewa = filteredExpenses
    .filter((e) => e.category === 'SEWA_LAPAK')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPayroll = filteredExpenses
    .filter((e) => e.category === 'PAYROLL_GAJI')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalUtilities = filteredExpenses
    .filter((e) => ['LISTRIK', 'AIR', 'INTERNET_POS'].includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      showNotification('Hanya OWNER yang berwenang menambah beban operasional tetap!', 'error');
      return;
    }

    const outletName =
      formOutletId === 'all'
        ? 'Konsolidasi Seluruh Outlet'
        : outlets.find((o) => o.id === formOutletId)?.name || 'Cabang Operasional';

    addFixedExpense({
      title: formTitle,
      category: formCategory,
      outletId: formOutletId,
      outletName,
      amount: parseFloat(formAmount) || 0,
      period: 'Oktober 2024',
      status: 'LUNAS',
      dueDate: formDueDate,
      autoDebet: formAutoDebet,
    });

    setIsModalOpen(false);
    setFormTitle('');
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-espresso text-surface p-6 shadow-md border border-brand-espresso-muted/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-gold text-brand-espresso text-[11px] font-bold uppercase tracking-wider">
                <Lock className="w-3 h-3" />
                Hak Akses Penuh: Owner Only
              </span>
              <span className="text-secondary-container text-xs">ID Dokumen: OPEX-REG-2024-Q4</span>
            </div>
            <h1 className="font-serif-title text-2xl font-bold text-white tracking-tight">
              Beban Operasional Tetap (Fixed OPEX)
            </h1>
            <p className="text-xs text-white/70 leading-relaxed">
              Pengelolaan biaya rutin bulanan sewa lapak 3 cabang, payroll gaji karyawan & kasir, tagihan listrik, air, dan internet POS Dimsum Intan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isOwner && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Tambah Beban Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Bento Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Beban */}
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Total Beban Tetap Bulan Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif-title text-2xl font-bold text-brand-espresso">
              Rp {totalOpex.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-secondary mt-1">
              Rerata Harian: Rp {Math.round(totalOpex / 30).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-brand-gold h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Sewa Lapak */}
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Sewa Lapak ({outlets.length > 0 ? `${outlets.length} Cabang` : 'Cabang'})
            </span>
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif-title text-2xl font-bold text-brand-espresso">
              Rp {totalSewa.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-secondary mt-1">
              {outlets.length > 0 ? outlets.map((o) => o.name).join(', ') : 'Alokasi per Cabang Operasional'}
            </span>
          </div>
        </div>

        {/* Payroll Gaji */}
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Payroll Gaji Karyawan
            </span>
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif-title text-2xl font-bold text-brand-espresso">
              Rp {totalPayroll.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-secondary mt-1">
              Kru Dapur & Kasir ({outlets.length} Outlet)
            </span>
          </div>
        </div>

        {/* Utilitas & Internet */}
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Listrik & Cloud POS
            </span>
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif-title text-2xl font-bold text-brand-espresso">
              Rp {totalUtilities.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-secondary mt-1">
              PLN Steamer & CCTV Dedicated
            </span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="font-serif-title text-base font-bold text-brand-espresso">
              Rincian Buku Beban Operasional Tetap
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Daftar pengeluaran rutin bulanan yang masuk ke laporan laba rugi
            </p>
          </div>
          <span className="text-[11px] font-bold text-secondary bg-surface-container px-2.5 py-1 rounded-lg">
            Periode: Oktober 2024
          </span>
        </div>

        {/* Mobile View: Fixed Expenses Card List (< md screen) */}
        <div className="md:hidden divide-y divide-border-subtle p-3">
          {filteredExpenses.length === 0 ? (
            <div className="py-8 text-center text-secondary text-xs">
              Belum ada pos beban operasional tetap.
            </div>
          ) : (
            filteredExpenses.map((expense) => {
              const isLunas = expense.status === 'LUNAS';
              return (
                <div key={expense.id} className="py-3.5 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-xs text-brand-espresso">
                        {expense.title}
                      </span>
                      <div className="text-[10px] text-secondary">
                        {expense.code} • {expense.outletName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif-title font-bold text-sm text-brand-espresso tabular-nums">
                        Rp {expense.amount.toLocaleString('id-ID')}
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isLunas
                            ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                            : 'bg-status-pending-bg text-status-pending-text border border-status-pending-border'
                        }`}
                      >
                        {isLunas ? 'LUNAS' : 'TERJADWAL'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-secondary bg-surface-container-low p-2 rounded-xl">
                    <span className="font-medium">
                      Jatuh Tempo: <strong>{new Date(expense.dueDate).toLocaleDateString('id-ID')}</strong>
                    </span>
                    <span className="text-[10px] font-bold text-brand-espresso">
                      {expense.autoDebet ? '⚡ Autodebet' : 'Manual Transfer'}
                    </span>
                  </div>

                  {isOwner && (
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => toggleFixedExpenseStatus(expense.id)}
                        className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-brand-espresso active:scale-95 transition-all"
                      >
                        {isLunas ? 'Tandai Terjadwal' : 'Tandai Lunas'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(expense)}
                          className="p-1.5 rounded-xl bg-surface-container text-secondary hover:text-brand-espresso"
                          title="Edit Beban"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense)}
                          className="p-1.5 rounded-xl bg-surface-container text-secondary hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Tablet & Desktop View: Table (md+ screen) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-secondary">
                <th className="py-3 px-4">Kode & Deskripsi Beban</th>
                <th className="py-3 px-4">Cabang Terkait</th>
                <th className="py-3 px-4">Kategori Biaya</th>
                <th className="py-3 px-4">Jatuh Tempo & Sistem</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isOwner && <th className="py-3 px-4 text-center">Aksi (Owner)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-brand-espresso">{expense.title}</div>
                    <div className="text-[10px] text-secondary">{expense.code}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-brand-espresso">
                    {expense.outletName}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-brand-espresso">
                      {expense.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-brand-espresso">
                      {new Date(expense.dueDate).toLocaleDateString('id-ID')}
                    </div>
                    <span className="text-[10px] text-secondary">
                      {expense.autoDebet ? '⚡ Autodebet Bank Aktif' : 'Manual Transfer'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-brand-espresso tabular-nums">
                    Rp {expense.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {expense.status === 'LUNAS' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border">
                        LUNAS
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-pending-bg text-status-pending-text border border-status-pending-border">
                        TERJADWAL
                      </span>
                    )}
                  </td>
                  {isOwner && (
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => toggleFixedExpenseStatus(expense.id)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-bold text-brand-espresso transition-colors cursor-pointer"
                        >
                          {expense.status === 'LUNAS' ? 'Tandai Terjadwal' : 'Tandai Lunas'}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(expense)}
                          className="p-1.5 rounded-lg text-secondary hover:text-brand-gold-hover hover:bg-surface-container transition-colors cursor-pointer"
                          title="Ubah nominal / data beban"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense)}
                          className="p-1.5 rounded-lg text-secondary hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus pos beban"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>

      {/* Modal: Tambah Beban */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateExpense}
            className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative"
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
              Tambah Beban Rutin Baru
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Daftarkan pos pengeluaran bulanan tetap (sewa lapak, payroll gaji, utilitas).
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Deskripsi Beban</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Sewa Lapak Cabang Buah Batu"
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brand-espresso">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                  >
                    <option value="SEWA_LAPAK">Sewa Lapak</option>
                    <option value="PAYROLL_GAJI">Payroll Gaji</option>
                    <option value="LISTRIK">Listrik PLN</option>
                    <option value="AIR">Air PDAM</option>
                    <option value="INTERNET_POS">Internet & CCTV</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brand-espresso">Cabang</label>
                  <select
                    value={formOutletId}
                    onChange={(e) => setFormOutletId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                  >
                    <option value="all">Konsolidasi 3 Outlet</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Nominal Beban (Rp)</label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="7500000"
                  className="w-full p-2.5 rounded-xl bg-surface-container text-base font-bold text-brand-espresso focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all"
              >
                Simpan Beban
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Beban (Owner) */}
      {isEditModalOpen && editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleEditSubmit}
            className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative"
          >
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
              Ubah Beban Operasional
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Sesuaikan nominal sewa lapak, kenaikan gaji, atau jadwal pembayaran {editingExpense.code}.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Deskripsi Beban</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Kategori Pos Beban</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as FixedExpenseCategory)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                >
                  <option value="SEWA_LAPAK">Sewa Lapak Cabang</option>
                  <option value="PAYROLL_GAJI">Payroll Gaji Karyawan</option>
                  <option value="LISTRIK">Tagihan Listrik PLN</option>
                  <option value="AIR">Tagihan Air PDAM</option>
                  <option value="INTERNET_POS">Internet & Sistem POS</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Nominal Beban (Rp)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-base font-bold text-brand-espresso focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editAutoDebet}
                  onChange={(e) => setEditAutoDebet(e.target.checked)}
                  className="rounded text-brand-gold focus:ring-brand-gold"
                />
                <span className="text-xs font-bold text-brand-espresso">Autodebet Bank Aktif</span>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all"
              >
                Perbarui Beban
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

