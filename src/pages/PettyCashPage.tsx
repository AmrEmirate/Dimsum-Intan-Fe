import React, { useState } from 'react';
import {
  Wallet,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Trash2,
  X,
  Upload,
  Camera,
  Edit2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PettyCashCategory, PettyCashExpense } from '../types';
import { PinAuthorizationModal } from '../components/common/PinAuthorizationModal';

export const PettyCashPage: React.FC = () => {
  const {
    pettyCashList,
    addPettyCash,
    updatePettyCash,
    verifyPettyCash,
    deletePettyCash,
    currentUser,
    selectedOutletId,
    outlets,
    showNotification,
  } = useApp();

  const isKasir = currentUser.role === 'KASIR';
  const isSupervisorOrOwner = currentUser.role === 'SUPERVISOR' || currentUser.role === 'OWNER';

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [previewReceiptImage, setPreviewReceiptImage] = useState<string | null>(null);

  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<PettyCashCategory>('ES_BATU');
  const [formDescription, setFormDescription] = useState('');
  const [formReceiptUrl, setFormReceiptUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Edit state (before verified)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PettyCashExpense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<PettyCashCategory>('ES_BATU');
  const [editDescription, setEditDescription] = useState('');

  const handleOpenEdit = (item: PettyCashExpense) => {
    setItemToEdit(item);
    setEditAmount(item.amount.toString());
    setEditCategory(item.category as PettyCashCategory);
    setEditDescription(item.description);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit) return;
    const amt = parseFloat(editAmount);
    if (!amt || amt <= 0) {
      showNotification('Nominal kas kecil tidak valid!', 'error');
      return;
    }
    if (amt > 150000) {
      showNotification('Batas SOP: Pengeluaran darurat maksimal Rp 150.000 per nota!', 'error');
      return;
    }

    const ok = await updatePettyCash(itemToEdit.id, amt, editCategory, editDescription);
    if (ok) {
      setIsEditModalOpen(false);
      setItemToEdit(null);
    }
  };

  // Delete authorization state
  const [itemToDelete, setItemToDelete] = useState<PettyCashExpense | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);


  // RBAC Filter: Kasir can only see their own outlet (Dipatiukur)
  const filteredList = pettyCashList.filter((item) => {
    if (isKasir) return item.outletId === 'du';
    if (selectedOutletId === 'all') return true;
    return item.outletId === selectedOutletId;
  });

  const totalSpent = filteredList
    .filter((p) => p.status === 'DISETUJUI')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingCount = filteredList.filter((p) => p.status === 'MENUNGGU_VERIFIKASI').length;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);

    if (!amount || amount <= 0) {
      showNotification('Nominal kas kecil tidak valid!', 'error');
      return;
    }

    if (amount > 150000) {
      showNotification(
        'Batas SOP: Pengeluaran darurat laci kasir maksimal Rp 150.000 per nota!',
        'error'
      );
      return;
    }

    const ok = await addPettyCash(
      amount,
      formCategory,
      formDescription,
      selectedFile || formReceiptUrl || 'https://images.unsplash.com/photo-1554415707-9e49017aed81?w=500&auto=format&fit=crop&q=80'
    );

    if (ok) {
      setIsFormModalOpen(false);
      setFormAmount('');
      setFormDescription('');
      setFormReceiptUrl('');
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleTriggerDelete = (item: PettyCashExpense) => {
    if (isKasir) {
      showNotification('Kasir tidak diizinkan menghapus data kas kecil!', 'error');
      return;
    }
    setItemToDelete(item);
    setIsPinModalOpen(true);
  };

  const handlePinDeleteSuccess = async (pin: string) => {
    if (itemToDelete) {
      const success = await deletePettyCash(itemToDelete.id, pin);
      if (success) {
        setIsPinModalOpen(false);
        setItemToDelete(null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden bg-brand-espresso text-surface rounded-3xl p-6 shadow-md border border-brand-espresso-muted/30">
        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div className="flex flex-col max-w-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-gold text-brand-espresso text-[11px] font-bold uppercase tracking-wider">
                Audit Finansial
              </span>
              <span className="text-secondary-container text-xs">• Buku Kas Laci Harian</span>
              {isKasir && (
                <span className="text-[10px] font-bold text-brand-gold bg-white/10 px-2 py-0.5 rounded-full">
                  Outlet 01 - Dipatiukur (Terkunci)
                </span>
              )}
            </div>
            <h1 className="font-serif-title text-2xl font-bold text-white tracking-tight">
              Manajemen Kas Kecil Outlet <span className="text-brand-gold italic">(Petty Cash)</span>
            </h1>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">
              Pencatatan real-time pengeluaran tak terduga laci kasir untuk es batu, galon air, kantong plastik. Batas transaksi darurat maks. Rp 150.000/nota dengan bukti struk fisik sah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-stretch xl:self-auto">
            <button
              onClick={() => setIsTopUpModalOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors border border-white/10"
            >
              <Wallet className="w-4 h-4 text-brand-gold" />
              <span>Ajukan Top-Up Plafon</span>
            </button>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Catat Pengeluaran Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Saldo Kas Aktif */}
        <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Plafon Kas Kecil
            </span>
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif-title text-2xl font-bold text-brand-espresso">
              Rp 6.000.000
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-secondary">
              <span>Alokasi 3 Outlet:</span>
              <span className="text-status-lunas-text font-bold">Aktif & Aman</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pengeluaran Disetujui */}
        <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Pengeluaran Terverifikasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif-title text-2xl font-bold text-emerald-800">
              Rp {totalSpent.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-secondary mt-1">
              Disetujui oleh Supervisor/Owner
            </span>
          </div>
        </div>

        {/* Card 3: Menunggu Verifikasi */}
        <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Menunggu Verifikasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif-title text-2xl font-bold text-amber-800">
              {pendingCount} Nota
            </div>
            <span className="text-[10px] text-secondary mt-1">
              Menunggu tanda tangan digital SPV
            </span>
          </div>
        </div>

        {/* Card 4: SOP Guardrail Rule */}
        <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Batas Maks per Nota
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif-title text-2xl font-bold text-red-600">
              Rp 150.000
            </div>
            <span className="text-[10px] text-secondary mt-1">
              SOP Audit: Wajib foto struk nota fisik
            </span>
          </div>
        </div>
      </div>

      {/* Petty Cash Table */}
      <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif-title text-base font-bold text-brand-espresso">
              Histori Transaksi Kas Kecil Outlet
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Rekap pencatatan mutasi kas darurat laci kasir seluruh cabang
            </p>
          </div>
          {isSupervisorOrOwner && (
            <span className="text-xs font-bold text-status-lunas-text bg-status-lunas-bg border border-status-lunas-border px-3 py-1 rounded-xl">
              Hak Otorisasi Supervisor Aktif: Dapat Menyetujui / Menolak Nota
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-secondary">
                <th className="py-3 px-4">No. Kas / Waktu</th>
                <th className="py-3 px-4">Outlet & Kasir</th>
                <th className="py-3 px-4">Kategori & Keterangan</th>
                <th className="py-3 px-4 text-center">Foto Bukti Nota</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3 px-4 text-center">Status Audit</th>
                <th className="py-3 px-4 text-center">Aksi & Otorisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-brand-espresso">{item.expenseNumber}</div>
                    <div className="text-[10px] text-secondary">
                      {new Date(item.createdAt).toLocaleDateString('id-ID')} •{' '}
                      {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-brand-espresso">{item.outletName}</div>
                    <div className="text-[10px] text-secondary">Kasir: {item.cashierName}</div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-brand-espresso">
                      {item.category.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-brand-espresso mt-1 font-medium leading-relaxed">
                      {item.description}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setPreviewReceiptImage(item.receiptImageUrl)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-brand-espresso text-xs font-semibold transition-colors"
                      title="Lihat foto struk"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-primary" />
                      <span>Lihat Struk</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-brand-espresso tabular-nums">
                    Rp {item.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.status === 'DISETUJUI' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border">
                        DISETUJUI
                      </span>
                    ) : item.status === 'DITOLAK' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border">
                        DITOLAK
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-pending-bg text-status-pending-text border border-status-pending-border">
                        MENUNGGU VERIF
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {isSupervisorOrOwner && item.status === 'MENUNGGU_VERIFIKASI' && (
                        <>
                          <button
                            onClick={() => verifyPettyCash(item.id, 'DISETUJUI')}
                            className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            title="Setujui Pengeluaran"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => verifyPettyCash(item.id, 'DITOLAK')}
                            className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Tolak Pengeluaran"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {item.status === 'MENUNGGU_VERIFIKASI' && (

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 rounded-lg bg-surface-container hover:bg-brand-gold/20 text-secondary hover:text-brand-espresso transition-colors cursor-pointer"
                          title="Perbaiki / Edit Catatan Kas Kecil"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isSupervisorOrOwner && (
                        <button
                          onClick={() => handleTriggerDelete(item)}
                          className="p-1 rounded-lg bg-surface-container hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer"
                          title="Hapus Catatan (Wajib PIN Supervisor)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Input Pengeluaran Baru */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative my-6"
          >
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
              Catat Pengeluaran Kas Kecil Laci
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Mencatat pengeluaran darurat laci kasir (maks. Rp 150.000) dan upload foto struk fisik.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">
                  Nominal Pengeluaran (Rp) - Maks Rp 150.000
                </label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="Contoh: 35000"
                  max={150000}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-base font-bold text-brand-espresso focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Kategori Kebutuhan</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                >
                  <option value="ES_BATU">Es Batu Kristal</option>
                  <option value="GALON_AIR">Galon Air Mineral</option>
                  <option value="PLASTIK_KEMASAN">Plastik & Kresek HD Takeaway</option>
                  <option value="KEBERSIHAN">Sabun Cuci & Kebersihan</option>
                  <option value="LAINNYA">Lain-lain Darurat</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Keterangan / Keperluan</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Cth: Beli es batu kristal 2 kantong di warung samping..."
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-brand-espresso">
                  Foto Struk / Bukti Nota Fisik
                </label>
                
                {filePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border-strong bg-surface-container p-2 flex items-center gap-3">
                    <img
                      src={filePreview}
                      alt="Pratinjau Nota"
                      className="w-16 h-16 object-cover rounded-xl border border-border-subtle"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-brand-espresso truncate">
                        {selectedFile?.name || 'Foto Nota Kamera'}
                      </p>
                      <p className="text-[10px] text-secondary">
                        {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Siap diunggah'}
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="mt-1 text-[11px] font-bold text-red-600 hover:text-red-700 underline"
                      >
                        Ganti Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border-strong rounded-2xl p-4 text-center bg-surface-container-low flex flex-col items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95">
                      <Camera className="w-4 h-4" />
                      <span>Ambil Foto Nota (Kamera / File)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    <span className="text-[10px] text-secondary">
                      Bisa langsung jepret via kamera smartphone atau pilih dari galeri
                    </span>
                    <div className="w-full pt-2 border-t border-border-subtle/80">
                      <input
                        type="text"
                        value={formReceiptUrl}
                        onChange={(e) => setFormReceiptUrl(e.target.value)}
                        placeholder="Atau tempel URL gambar jika ada..."
                        className="w-full p-2 rounded-xl bg-surface-card text-[11px] border border-border-subtle text-brand-espresso placeholder:text-secondary/70 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all"
              >
                Simpan & Ajukan Verifikasi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Top-Up Plafon */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative">
            <button
              onClick={() => setIsTopUpModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
              Pengajuan Top-Up Plafon Kas Kecil
            </h3>
            <p className="text-xs text-secondary mt-1">
              Permohonan transfer pengisian saldo laci kasir dari rekening pusat.
            </p>
            <div className="my-4 p-4 rounded-xl bg-surface-container-low space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary">Plafon Sekarang:</span>
                <span className="font-bold text-brand-espresso">Rp 6.000.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Rekomendasi Top-Up:</span>
                <span className="font-bold text-emerald-700">Rp 2.000.000 / Cabang</span>
              </div>
            </div>
            <button
              onClick={() => {
                showNotification('Permohonan Top-Up telah dikirim ke WhatsApp Owner!', 'success');
                setIsTopUpModalOpen(false);
              }}
              className="w-full py-3 rounded-xl bg-brand-espresso hover:bg-brand-espresso-muted text-brand-gold text-xs font-bold shadow-md transition-all"
            >
              Kirim Notifikasi Pengajuan ke Owner
            </button>
          </div>
        </div>
      )}

      {/* Modal: Preview Foto Struk Nota */}
      {previewReceiptImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/80 backdrop-blur-sm p-4">
          <div className="relative max-w-lg w-full bg-surface-card rounded-3xl p-4 shadow-2xl">
            <button
              onClick={() => setPreviewReceiptImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-brand-espresso block mb-2">
              Bukti Fisik Struk Nota Belanja
            </span>
            <img
              src={previewReceiptImage}
              alt="Struk Belanja Kas Kecil"
              className="w-full h-80 object-cover rounded-2xl border border-border-subtle"
            />
          </div>
        </div>
      )}

      {/* Modal: Edit Kas Kecil (Sebelum diverifikasi) */}
      {isEditModalOpen && itemToEdit && (
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
              Perbaiki Data Kas Kecil
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Koreksi nominal atau keterangan pengeluaran darurat {itemToEdit.expenseNumber} sebelum diverifikasi.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Nominal Pengeluaran (Rp)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-base font-bold text-brand-espresso focus:outline-none"
                  required
                />
                <span className="text-[10px] text-secondary">Batas maksimal SOP: Rp 150.000 / nota</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Kategori Kebutuhan</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as PettyCashCategory)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                >
                  <option value="ES_BATU">Es Batu Kristal</option>
                  <option value="GALON_AIR">Galon Air Mineral</option>
                  <option value="PLASTIK_KEMASAN">Kantong Plastik / Kresek</option>
                  <option value="KEBERSIHAN">Sabun Cuci / Tisu / Kebersihan</option>
                  <option value="LAINNYA">Kebutuhan Operasional Darurat Lainnya</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Keterangan / Alasan Belanja</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                  required
                />
              </div>
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
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Supervisor PIN Authorization Modal for deleting petty cash */}
      <PinAuthorizationModal
        isOpen={isPinModalOpen}
        title="Otorisasi Hapus Kas Kecil"
        description={`Masukkan PIN Supervisor untuk menghapus data pengeluaran ${itemToDelete?.expenseNumber} dari buku kas laci.`}
        onSuccess={handlePinDeleteSuccess}
        onClose={() => {
          setIsPinModalOpen(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
};

