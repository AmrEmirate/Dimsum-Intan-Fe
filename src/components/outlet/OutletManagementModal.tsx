import React, { useState } from 'react';
import {
  Store,
  Plus,
  MapPin,
  Phone,
  Target,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Outlet } from '../../types';

interface OutletManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OutletManagementModal: React.FC<OutletManagementModalProps> = ({ isOpen, onClose }) => {
  const { outlets, createOutlet, updateOutlet, deleteOutlet, currentUser } = useApp();

  const isOwner = currentUser.role === 'OWNER';

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Bandung');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [targetDailySales, setTargetDailySales] = useState('4500000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenCreateForm = () => {
    setEditingOutlet(null);
    setCode('');
    setName('');
    setCity('Bandung');
    setAddress('');
    setPhone('');
    setTargetDailySales('4500000');
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setCode(outlet.code);
    setName(outlet.name);
    setCity(outlet.city);
    setAddress(outlet.address);
    setPhone(outlet.phone);
    setTargetDailySales(String(outlet.targetDailySales || 4000000));
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim() || !name.trim() || !address.trim() || !phone.trim()) {
      setErrorMsg('Semua kolom bertanda * wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    let success = false;

    if (editingOutlet) {
      success = await updateOutlet(editingOutlet.id, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        phone: phone.trim(),
        targetDailySales: parseFloat(targetDailySales) || 0,
      });
    } else {
      success = await createOutlet({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        phone: phone.trim(),
        targetDailySales: parseFloat(targetDailySales) || 0,
      });
    }

    setIsSubmitting(false);
    if (success) {
      setIsFormOpen(false);
      setEditingOutlet(null);
    }
  };

  const handleDelete = async (outlet: Outlet) => {
    const confirmText = `Apakah Anda yakin ingin menghapus "${outlet.name}" (${outlet.code})?\n\nPerhatian: Cabang yang telah memiliki riwayat shift/transaksi tidak dapat dihapus.`;
    if (!window.confirm(confirmText)) return;

    await deleteOutlet(outlet.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface-card rounded-3xl border border-border-subtle shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-brand-espresso to-[#3a2824] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold text-brand-espresso flex items-center justify-center font-bold shadow-md">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title font-bold text-lg text-white">
                Manajemen Master Cabang
              </h2>
              <p className="text-[11px] text-white/70">
                Kelola daftar cabang outlet aktif & target omset harian Dimsum Intan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-brand-espresso">
                Total Cabang: {outlets.length} Outlet
              </span>
            </div>
            {isOwner && !isFormOpen && (
              <button
                onClick={handleOpenCreateForm}
                className="py-2 px-3.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Cabang Baru</span>
              </button>
            )}
          </div>

          {/* Create / Edit Form */}
          {isFormOpen && (
            <form
              onSubmit={handleSubmit}
              className="p-5 rounded-2xl bg-surface-container-low border border-brand-gold/30 shadow-inner space-y-4 animate-in slide-in-from-top-4 duration-200"
            >
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="text-xs font-bold text-brand-espresso flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-primary" />
                  {editingOutlet ? `Edit Data: ${editingOutlet.name}` : 'Form Pendaftaran Cabang Baru'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-secondary hover:text-brand-espresso text-xs font-semibold"
                >
                  Tutup Form
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Kode Cabang */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Kode Cabang *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: DU-01 / DGO-04"
                    className="w-full p-2.5 rounded-xl bg-surface-card border border-border-subtle text-xs font-bold text-brand-espresso uppercase focus:outline-none focus:border-brand-gold"
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Cabang Dago Heritage"
                    className="w-full p-2.5 rounded-xl bg-surface-card border border-border-subtle text-xs font-bold text-brand-espresso focus:outline-none focus:border-brand-gold"
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
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bandung"
                    className="w-full p-2.5 rounded-xl bg-surface-card border border-border-subtle text-xs text-brand-espresso focus:outline-none focus:border-brand-gold"
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full p-2.5 rounded-xl bg-surface-card border border-border-subtle text-xs text-brand-espresso focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                {/* Target Penjualan Harian */}
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Target Penjualan Harian (Rp)
                  </label>
                  <input
                    type="number"
                    value={targetDailySales}
                    onChange={(e) => setTargetDailySales(e.target.value)}
                    placeholder="4500000"
                    className="w-full p-2.5 rounded-xl bg-surface-card border border-border-subtle text-xs font-bold text-brand-espresso focus:outline-none focus:border-brand-gold"
                  />
                  <span className="text-[10px] text-secondary">
                    Digunakan untuk indikator target omset di dashboard kasir & laporan harian.
                  </span>
                </div>

                {/* Alamat Lengkap */}
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-secondary uppercase">
                    Alamat Lengkap Cabang *
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota"
                    className="w-full p-2.5 rounded-xl bg-surface-card border border-border-subtle text-xs text-brand-espresso focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingOutlet ? 'Simpan Perubahan' : 'Daftarkan Cabang'}
                </button>
              </div>
            </form>
          )}

          {/* Outlets List */}
          <div className="space-y-3">
            {outlets.map((outlet) => (
              <div
                key={outlet.id}
                className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs hover:border-brand-gold/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/20 text-brand-espresso flex items-center justify-center font-bold text-xs shrink-0">
                    {outlet.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-brand-espresso">{outlet.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[10px] font-semibold">
                        {outlet.city}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-[11px] text-secondary">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0 text-primary" />
                        <span className="truncate max-w-xs">{outlet.address}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 shrink-0 text-primary" />
                        <span>{outlet.phone}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                      <Target className="w-3 h-3 shrink-0" />
                      <span>Target Omset: Rp {Number(outlet.targetDailySales || 0).toLocaleString('id-ID')} / hari</span>
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleOpenEditForm(outlet)}
                      className="p-2 rounded-xl text-secondary hover:text-brand-espresso hover:bg-surface-container transition-colors"
                      title="Edit Cabang"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(outlet)}
                      className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Hapus Cabang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-low border-t border-border-subtle flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-brand-espresso text-brand-gold text-xs font-bold hover:bg-[#2e211e] transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
