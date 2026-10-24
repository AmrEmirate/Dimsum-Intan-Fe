import React, { useState } from 'react';
import {
  Factory,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Calendar,
  Lock,
  Upload,
  ReceiptText,
  FileCheck,
  CreditCard,
  X,
  Building2,
  Trash2,
  Pencil,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FactoryInvoice } from '../types';

export const FactoryBillsPage: React.FC = () => {
  const {
    factoryInvoices,
    addFactoryInvoice,
    updateFactoryInvoice,
    markInvoicePaid,
    deleteFactoryInvoice,
    currentUser,
    selectedOutletId,
    outlets,
    showNotification,
  } = useApp();

  const isOwner = currentUser.role === 'OWNER';

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<FactoryInvoice | null>(null);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<FactoryInvoice | null>(
    null
  );

  const [formOutletId, setFormOutletId] = useState('du');
  const [formDueDate, setFormDueDate] = useState('2024-11-15');
  const [formTotalAmount, setFormTotalAmount] = useState('21000000');
  const [formItemName, setFormItemName] = useState('Dimsum Siomay Beku (Pouch 100 pcs)');
  const [formQty, setFormQty] = useState('15');
  const [formUnitCost, setFormUnitCost] = useState('650000');

  // Supplier Profile States (Persisted in localStorage)
  const [supplierBank, setSupplierBank] = useState<string>(
    () => localStorage.getItem('dimsum_supplier_bank') || 'BCA 7788-990-112'
  );
  const [supplierName, setSupplierName] = useState<string>(
    () => localStorage.getItem('dimsum_supplier_name') || 'PT Dimsum Prima Rasa'
  );
  const [supplierStatus, setSupplierStatus] = useState<string>(
    () => localStorage.getItem('dimsum_supplier_status') || 'Lancar'
  );

  // Edit Supplier Profile Modal States
  const [isEditSupplierModalOpen, setIsEditSupplierModalOpen] = useState(false);
  const [tempSupplierBank, setTempSupplierBank] = useState(supplierBank);
  const [tempSupplierName, setTempSupplierName] = useState(supplierName);
  const [tempSupplierStatus, setTempSupplierStatus] = useState(supplierStatus);

  // Edit Form States
  const [editOutletId, setEditOutletId] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editTotalAmount, setEditTotalAmount] = useState('');
  const [editItemName, setEditItemName] = useState('');
  const [editQty, setEditQty] = useState('1');
  const [editUnitCost, setEditUnitCost] = useState('0');
  const [editStatus, setEditStatus] = useState<'LUNAS' | 'BELUM_LUNAS' | 'JATUH_TEMPO'>('BELUM_LUNAS');

  // Calculations
  const filteredInvoices = factoryInvoices.filter((inv) => {
    if (selectedOutletId === 'all') return true;
    return inv.outletId === selectedOutletId;
  });

  const totalMonthlyBills = filteredInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = filteredInvoices
    .filter((i) => i.status === 'LUNAS')
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const totalUnpaid = filteredInvoices
    .filter((i) => i.status !== 'LUNAS')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      showNotification('Hanya OWNER yang berwenang mendaftarkan faktur pabrik!', 'error');
      return;
    }

    const targetOutlet = outlets.find((o) => o.id === formOutletId) || outlets[0];
    const total = parseFloat(formTotalAmount) || 0;
    const qty = parseInt(formQty) || 1;
    const unitCost = parseFloat(formUnitCost) || 0;

    addFactoryInvoice({
      supplierName: `${supplierName} (Pusat)`,
      outletId: targetOutlet?.id || (outlets[0]?.id ?? ''),
      outletName: targetOutlet?.name || (outlets[0]?.name ?? 'Pusat / Operasional'),
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: formDueDate,
      totalAmount: total,
      status: 'BELUM_LUNAS',
      bankAccount: `${supplierBank} a.n ${supplierName}`,
      items: [
        {
          itemName: formItemName,
          quantity: qty,
          unit: 'Pouch',
          unitCost,
          total: qty * unitCost,
        },
      ],
    });

    setIsAddModalOpen(false);
  };

  const handleOpenEditSupplier = () => {
    if (!isOwner) {
      showNotification('Hanya OWNER yang berwenang mengubah rekening suplier!', 'error');
      return;
    }
    setTempSupplierBank(supplierBank);
    setTempSupplierName(supplierName);
    setTempSupplierStatus(supplierStatus);
    setIsEditSupplierModalOpen(true);
  };

  const handleSaveSupplierProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      showNotification('Hanya OWNER yang berwenang mengubah rekening suplier!', 'error');
      return;
    }
    setSupplierBank(tempSupplierBank);
    setSupplierName(tempSupplierName);
    setSupplierStatus(tempSupplierStatus);
    localStorage.setItem('dimsum_supplier_bank', tempSupplierBank);
    localStorage.setItem('dimsum_supplier_name', tempSupplierName);
    localStorage.setItem('dimsum_supplier_status', tempSupplierStatus);
    setIsEditSupplierModalOpen(false);
    showNotification('Data rekening suplier pabrik berhasil diperbarui!', 'success');
  };

  const handlePay = (invoice: FactoryInvoice) => {
    if (!isOwner) {
      showNotification('Hanya OWNER yang berhak melakukan pelunasan tagihan pabrik!', 'error');
      return;
    }
    markInvoicePaid(invoice.id);
  };

  const handleOpenEdit = (inv: FactoryInvoice) => {
    if (!isOwner) {
      showNotification('Hanya OWNER yang berwenang mengedit faktur pabrik!', 'error');
      return;
    }
    setEditingInvoice(inv);
    setEditOutletId(inv.outletId);
    setEditDueDate(inv.dueDate.slice(0, 10));
    setEditTotalAmount(inv.totalAmount.toString());
    const firstItem = inv.items[0];
    setEditItemName(firstItem?.itemName || 'Dimsum Beku');
    setEditQty(firstItem?.quantity ? firstItem.quantity.toString() : '1');
    setEditUnitCost(firstItem?.unitCost ? firstItem.unitCost.toString() : inv.totalAmount.toString());
    setEditStatus(inv.status);
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const targetOutlet = outlets.find((o) => o.id === editOutletId) || outlets[0];
    const total = parseFloat(editTotalAmount) || 0;
    const qty = parseInt(editQty) || 1;
    const unitCost = parseFloat(editUnitCost) || 0;

    await updateFactoryInvoice(editingInvoice.id, {
      outletId: targetOutlet?.id || editOutletId,
      outletName: targetOutlet?.name || editingInvoice.outletName,
      dueDate: editDueDate,
      totalAmount: total,
      status: editStatus,
      items: [
        {
          itemName: editItemName,
          quantity: qty,
          unit: 'Pouch',
          unitCost,
          total: qty * unitCost,
        },
      ],
    });

    setEditingInvoice(null);
  };

  const handleDeleteInvoice = async (invoice: FactoryInvoice) => {
    if (!isOwner) {
      showNotification('Hanya OWNER yang berhak menghapus draf tagihan pabrik!', 'error');
      return;
    }
    if (window.confirm(`Hapus draf faktur ${invoice.invoiceNumber} dari database?`)) {
      await deleteFactoryInvoice(invoice.id);
    }
  };

  return (

    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Banner Header with Owner Guardrail */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-espresso text-surface p-6 shadow-md border border-brand-espresso-muted/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-gold text-brand-espresso text-[11px] font-bold uppercase tracking-wider">
                <Lock className="w-3 h-3" />
                Akses Terkunci: Owner Only (Hj. Intan Permata)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Rekanan: PT Dimsum Prima Rasa
              </span>
            </div>
            <h1 className="font-serif-title text-2xl font-bold text-white tracking-tight">
              Tagihan Suplai Pabrik Dimsum
            </h1>
            <p className="text-xs text-white/70 leading-relaxed">
              Pengelolaan faktur masuk kiriman dimsum beku & siomay dari PT Dimsum Prima Rasa ke seluruh cabang operasional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isOwner && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Input Faktur Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4-Card Bento Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Bulan Ini */}
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Total Tagihan Bulan Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif-title text-2xl font-bold text-brand-espresso">
              Rp {totalMonthlyBills.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-secondary mt-1">
              {filteredInvoices.length} Pengiriman • {outlets.length} Cabang
            </div>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 2: Sudah Lunas */}
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Sudah Dilunasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif-title text-2xl font-bold text-emerald-700">
              Rp {totalPaid.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-secondary mt-1">Transfer bank sukses diverifikasi</span>
          </div>
        </div>

        {/* Card 3: Belum Lunas / Outstanding */}
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Tagihan Outstanding
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif-title text-2xl font-bold text-amber-800">
              Rp {totalUnpaid.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-secondary mt-1">Menunggu jatuh tempo transfer</span>
          </div>
        </div>

        {/* Card 4: Suplier Profile */}
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex flex-col justify-between relative group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Rekening Suplier Pabrik
            </span>
            <div className="flex items-center gap-1.5">
              {isOwner && (
                <button
                  type="button"
                  onClick={handleOpenEditSupplier}
                  title="Edit Data Rekening Suplier"
                  className="w-7 h-7 rounded-lg bg-surface-container hover:bg-brand-gold/20 text-brand-espresso flex items-center justify-center transition-all cursor-pointer border border-border-subtle hover:border-brand-gold"
                >
                  <Pencil className="w-3.5 h-3.5 text-brand-espresso" />
                </button>
              )}
              <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-brand-espresso">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-bold text-xs text-brand-espresso">{supplierBank}</div>
            <div className="text-[10px] text-secondary mt-0.5">a.n {supplierName}</div>
            <div className="flex items-center justify-between mt-2">
              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  supplierStatus.toLowerCase().includes('lancar')
                    ? 'text-status-lunas-text bg-status-lunas-bg border-status-lunas-border'
                    : supplierStatus.toLowerCase().includes('menipis') || supplierStatus.toLowerCase().includes('tunda')
                    ? 'text-status-tempo-text bg-status-tempo-bg border-status-tempo-border'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}
              >
                Status Suplai: {supplierStatus}
              </span>
              {isOwner && (
                <button
                  type="button"
                  onClick={handleOpenEditSupplier}
                  className="text-[10px] font-semibold text-brand-gold-hover hover:underline cursor-pointer"
                >
                  Ubah
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table: Invoices */}
      <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="font-serif-title text-base font-bold text-brand-espresso">
              Daftar Faktur Masuk Kiriman Pabrik
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Riwayat surat jalan & tagihan batch kiriman dimsum frozen
            </p>
          </div>
          <span className="text-[11px] font-bold text-secondary bg-surface-container px-2.5 py-1 rounded-lg">
            SOP: Pelunasan H-2 sebelum jatuh tempo
          </span>
        </div>

        {/* Mobile View: Factory Bills Card List (< md screen) */}
        <div className="md:hidden divide-y divide-border-subtle p-3">
          {filteredInvoices.length === 0 ? (
            <div className="py-8 text-center text-secondary text-xs">
              Belum ada faktur kiriman pabrik tercatat.
            </div>
          ) : (
            filteredInvoices.map((inv) => {
              const isLunas = inv.status === 'LUNAS';
              return (
                <div key={inv.id} className="py-3.5 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-xs text-brand-espresso">
                        {inv.invoiceNumber}
                      </span>
                      <div className="text-[10px] text-secondary">
                        Terbit: {new Date(inv.issueDate).toLocaleDateString('id-ID')} • {inv.outletName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif-title font-bold text-sm text-brand-espresso tabular-nums">
                        Rp {inv.totalAmount.toLocaleString('id-ID')}
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isLunas
                            ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                            : 'bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border'
                        }`}
                      >
                        {isLunas ? 'LUNAS' : 'BELUM LUNAS'}
                      </span>
                    </div>
                  </div>

                  {/* Batch Summary */}
                  <div className="bg-surface-container-low p-2 rounded-xl text-xs flex flex-col gap-1">
                    <div className="text-secondary truncate">
                      {inv.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-secondary">
                        Jatuh Tempo: <strong>{new Date(inv.dueDate).toLocaleDateString('id-ID')}</strong>
                      </span>
                      <button
                        onClick={() => setSelectedInvoiceForDetail(inv)}
                        className="text-primary hover:underline font-bold"
                      >
                        Rincian ({inv.items.length} item) &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {isLunas ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terbayar
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 font-bold">Harap Segera Dibayar</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isLunas && isOwner && (
                        <button
                          onClick={() => handlePay(inv)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                        >
                          Lunasi
                        </button>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1.5 rounded-xl bg-surface-container text-secondary hover:text-brand-espresso"
                          title="Edit Faktur"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          className="p-1.5 rounded-xl bg-surface-container text-secondary hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tablet & Desktop View: Full Table (md+ screen) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-secondary">
                <th className="py-3 px-4">No. Faktur & Tanggal</th>
                <th className="py-3 px-4">Outlet Tujuan</th>
                <th className="py-3 px-4">Batch Rincian Barang</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Total Tagihan (Rp)</th>
                <th className="py-3 px-4 text-center">Status Pembayaran</th>
                <th className="py-3 px-4 text-center">Aksi (Owner)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-brand-espresso">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-secondary">
                      Terbit: {new Date(inv.issueDate).toLocaleDateString('id-ID')}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-brand-espresso">
                    {inv.outletName}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-medium text-brand-espresso truncate">
                      {inv.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                    </div>
                    <button
                      onClick={() => setSelectedInvoiceForDetail(inv)}
                      className="text-[10px] text-primary hover:underline font-bold mt-0.5"
                    >
                      Lihat Rincian ({inv.items.length} item)
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-brand-espresso">
                      {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                    </span>
                    {inv.status !== 'LUNAS' && (
                      <div className="text-[10px] text-amber-700 font-bold">Harap Segera Dibayar</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-brand-espresso tabular-nums">
                    Rp {inv.totalAmount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {inv.status === 'LUNAS' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border">
                        LUNAS
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border">
                        BELUM LUNAS
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {inv.status !== 'LUNAS' && isOwner && (
                        <button
                          onClick={() => handlePay(inv)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          Lunasi Sekarang
                        </button>
                      )}
                      {inv.status === 'LUNAS' && (
                        <span className="text-[11px] text-secondary font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terbayar
                        </span>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1.5 rounded-lg text-secondary hover:text-brand-espresso hover:bg-surface-container transition-colors cursor-pointer"
                          title="Edit Faktur"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          className="p-1.5 rounded-lg text-secondary hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus draf faktur"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal: Input Faktur Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateInvoice}
            className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative my-6"
          >
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
              Input Faktur Masuk Kiriman Pabrik
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Catat tagihan suplai bahan beku dimsum dari PT Dimsum Prima Rasa.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Outlet Tujuan Kiriman</label>
                <select
                  value={formOutletId}
                  onChange={(e) => setFormOutletId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
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

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Nama Produk Batch</label>
                <input
                  type="text"
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brand-espresso">Jumlah (Pouch)</label>
                  <input
                    type="number"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brand-espresso">Harga per Pouch (Rp)</label>
                  <input
                    type="number"
                    value={formUnitCost}
                    onChange={(e) => setFormUnitCost(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Total Tagihan (Rp)</label>
                <input
                  type="number"
                  value={formTotalAmount}
                  onChange={(e) => setFormTotalAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-base font-bold text-brand-espresso focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all"
              >
                Simpan Faktur
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Rincian Faktur */}
      {selectedInvoiceForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedInvoiceForDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
              Rincian Kiriman: {selectedInvoiceForDetail.invoiceNumber}
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Tujuan: {selectedInvoiceForDetail.outletName}
            </p>

            <div className="mt-4 divide-y divide-border-subtle">
              {selectedInvoiceForDetail.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between text-xs">
                  <div>
                    <div className="font-bold text-brand-espresso">{item.itemName}</div>
                    <div className="text-[11px] text-secondary">
                      {item.quantity} {item.unit} x Rp {item.unitCost.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <span className="font-bold text-brand-espresso tabular-nums">
                    Rp {item.total.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border-subtle flex justify-between items-baseline">
              <span className="text-xs font-bold text-secondary">Total Tagihan:</span>
              <span className="font-serif-title text-xl font-bold text-brand-espresso">
                Rp {selectedInvoiceForDetail.totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              onClick={() => setSelectedInvoiceForDetail(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-surface-container text-xs font-bold text-brand-espresso hover:bg-surface-container-high"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal: Edit Faktur */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleUpdateInvoice}
            className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative my-6"
          >
            <button
              type="button"
              onClick={() => setEditingInvoice(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-brand-gold text-brand-espresso text-[10px] font-bold">
                {editingInvoice.invoiceNumber}
              </span>
            </div>
            <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
              Edit Faktur Tagihan Pabrik
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Perbarui rincian barang, tanggal jatuh tempo, cabang tujuan, atau total tagihan.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Outlet Tujuan Kiriman</label>
                <select
                  value={editOutletId}
                  onChange={(e) => setEditOutletId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brand-espresso">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brand-espresso">Status Faktur</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs font-bold text-brand-espresso focus:outline-none"
                  >
                    <option value="BELUM_LUNAS">BELUM LUNAS</option>
                    <option value="LUNAS">LUNAS</option>
                    <option value="JATUH_TEMPO">JATUH TEMPO</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Nama Produk Batch</label>
                <input
                  type="text"
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brand-espresso">Jumlah (Pouch)</label>
                  <input
                    type="number"
                    value={editQty}
                    onChange={(e) => {
                      const q = e.target.value;
                      setEditQty(q);
                      const cost = parseFloat(editUnitCost) || 0;
                      const parsedQ = parseInt(q) || 0;
                      if (parsedQ > 0 && cost > 0) {
                        setEditTotalAmount((parsedQ * cost).toString());
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brand-espresso">Harga per Pouch (Rp)</label>
                  <input
                    type="number"
                    value={editUnitCost}
                    onChange={(e) => {
                      const cost = e.target.value;
                      setEditUnitCost(cost);
                      const parsedCost = parseFloat(cost) || 0;
                      const parsedQ = parseInt(editQty) || 0;
                      if (parsedQ > 0 && parsedCost > 0) {
                        setEditTotalAmount((parsedQ * parsedCost).toString());
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Total Tagihan (Rp)</label>
                <input
                  type="number"
                  value={editTotalAmount}
                  onChange={(e) => setEditTotalAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-base font-bold text-brand-espresso focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Rekening Suplier Pabrik */}
      {isEditSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveSupplierProfile}
            className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 text-brand-espresso"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-espresso">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-title text-base font-bold text-brand-espresso">
                    Edit Rekening Suplier Pabrik
                  </h3>
                  <p className="text-[11px] text-secondary">
                    Perbarui nomor rekening dan info suplier pabrik
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditSupplierModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-elevated flex items-center justify-center text-secondary hover:text-brand-espresso transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">
                  Bank & Nomor Rekening
                </label>
                <input
                  type="text"
                  value={tempSupplierBank}
                  onChange={(e) => setTempSupplierBank(e.target.value)}
                  placeholder="Contoh: BCA 7788-990-112"
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso border border-transparent focus:border-brand-gold focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">
                  Atas Nama (a.n) Rekening
                </label>
                <input
                  type="text"
                  value={tempSupplierName}
                  onChange={(e) => setTempSupplierName(e.target.value)}
                  placeholder="Contoh: PT Dimsum Prima Rasa"
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso border border-transparent focus:border-brand-gold focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">
                  Status Suplai Pabrik
                </label>
                <select
                  value={tempSupplierStatus}
                  onChange={(e) => setTempSupplierStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso border border-transparent focus:border-brand-gold focus:outline-none cursor-pointer"
                >
                  <option value="Lancar">Lancar</option>
                  <option value="Restok Menipis">Restok Menipis</option>
                  <option value="Menunggu Pengiriman">Menunggu Pengiriman</option>
                  <option value="Tertunda Sementara">Tertunda Sementara</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditSupplierModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso hover:bg-surface-container transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all cursor-pointer"
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
