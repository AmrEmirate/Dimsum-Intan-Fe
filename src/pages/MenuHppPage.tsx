import React, { useState, useRef } from 'react';
import {
  Lock,
  PlusCircle,
  TrendingUp,
  UtensilsCrossed,
  Percent,
  AlertCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  X,
  FileSpreadsheet,
  PackagePlus,
  Trash,
  Upload,
  Download,
  FileUp,
  FileDown,
  Sparkles,
  Layers,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MenuItem, MenuCategory } from '../types';
import { CustomSelect } from '../components/common/CustomSelect';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { ImageUpload } from '../components/common/ImageUpload';
import { RupiahInput } from '../components/common/RupiahInput';
import {
  exportToCsv,
  exportToJson,
  parseCsv,
  downloadMenuCsvTemplate,
} from '../utils/exportUtils';

interface ParsedImportItem {
  name: string;
  category: MenuCategory;
  price: number;
  costPrice: number;
  stock: number;
  description: string;
  margin: number;
  isValid: boolean;
  errorReason?: string;
  isWarning?: boolean;
  warningReason?: string;
}

export const MenuHppPage: React.FC = () => {
  const {
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuAvailability,
    currentUser,
    showNotification,
  } = useApp();

  const isOwner = currentUser.role === 'OWNER';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MenuItem | null>(null);

  // Bulk Import State (Google Stitch Architecture)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedImportRows, setParsedImportRows] = useState<ParsedImportItem[]>([]);
  const [importMode, setImportMode] = useState<'UPSERT' | 'APPEND'>('UPSERT');
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Waste & Spoilage Modal
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [wasteMenuId, setWasteMenuId] = useState('');
  const [wasteQty, setWasteQty] = useState('1');
  const [wasteReason, setWasteReason] = useState('Kukusan gosong / terlalu lama');

  // Quick Restock State
  const [quickStockItem, setQuickStockItem] = useState<MenuItem | null>(null);
  const [quickStockQty, setQuickStockQty] = useState('10');

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<MenuCategory>('Makanan Utama');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategoryText, setCustomCategoryText] = useState<string>('');
  const [formPrice, setFormPrice] = useState('25000');
  const [formCostPrice, setFormCostPrice] = useState('11500');
  const [formStock, setFormStock] = useState('40');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');

  // Daftar Kategori Menu Tersedia (Default Universal F&B + Kategori Tenant)
  const existingCategories = Array.from(
    new Set([
      'Makanan Utama',
      'Minuman',
      'Snack & Camilan',
      'Paket Hemat',
      'Mentai',
      'Kukus',
      'Goreng',
      ...menuItems.map((m) => m.category).filter(Boolean),
    ])
  );

  // Calculations
  const totalItems = menuItems.length;
  const avgMargin =
    totalItems > 0
      ? (
          menuItems.reduce((acc, m) => acc + ((m.price - m.costPrice) / m.price) * 100, 0) /
          totalItems
        ).toFixed(1)
      : '0';

  const highestMarginItem =
    menuItems.length > 0
      ? [...menuItems].sort(
          (a, b) => (b.price - b.costPrice) / b.price - (a.price - a.costPrice) / a.price
        )[0]
      : null;

  const categoryCounts = menuItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const categorySummaryText =
    Object.keys(categoryCounts).length > 0
      ? Object.entries(categoryCounts)
          .map(([cat, count]) => `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${count})`)
          .join(', ')
      : 'Belum ada resep terdaftar';

  const handleOpenAdd = () => {
    if (!isOwner) {
      showNotification('Hanya akun OWNER yang diizinkan menambah menu & HPP!', 'error');
      return;
    }
    setEditingItem(null);
    setFormName('');
    setIsCustomCategory(false);
    setCustomCategoryText('');
    setFormCategory('Makanan Utama');
    setFormPrice('25000');
    setFormCostPrice('11500');
    setFormStock('30');
    setFormDescription('');
    setFormImage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (menu: MenuItem) => {
    if (!isOwner) {
      showNotification('Hanya akun OWNER yang diizinkan mengubah harga & HPP menu!', 'error');
      return;
    }
    setEditingItem(menu);
    setFormName(menu.name);
    setIsCustomCategory(false);
    setCustomCategoryText('');
    setFormCategory(menu.category || 'Makanan Utama');
    setFormPrice(menu.price.toString());
    setFormCostPrice(menu.costPrice.toString());
    setFormStock(menu.stock.toString());
    setFormDescription(menu.description);
    setFormImage(menu.image);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formPrice) || 0;
    const costPrice = parseFloat(formCostPrice) || 0;
    const stock = parseInt(formStock) || 0;
    const finalCategory = isCustomCategory
      ? customCategoryText.trim() || 'Lainnya'
      : formCategory;

    if (editingItem) {
      updateMenuItem(editingItem.id, {
        name: formName,
        category: finalCategory,
        price,
        costPrice,
        stock,
        description: formDescription,
        image: formImage,
      });
    } else {
      addMenuItem({
        name: formName,
        category: finalCategory,
        price,
        costPrice,
        stock,
        description: formDescription,
        image: formImage,
        isAvailable: true,
      });
    }

    setIsModalOpen(false);
  };

  const handleExportMenuHpp = () => {
    const headers = [
      'Kode Menu',
      'Nama Menu',
      'Kategori',
      'Harga Jual (Rp)',
      'HPP Modal Pabrik (Rp)',
      'Laba Kotor per Porsi (Rp)',
      'Margin (%)',
      'Stok Saat Ini (Porsi)',
      'Status Ketersediaan',
    ];

    const rows = menuItems.map((item) => {
      const profit = item.price - item.costPrice;
      const margin = ((profit / item.price) * 100).toFixed(1);
      return [
        item.code,
        item.name,
        item.category,
        item.price,
        item.costPrice,
        profit,
        `${margin}%`,
        item.stock,
        item.isAvailable && item.stock > 0 ? 'Tersedia' : 'Habis / Nonaktif',
      ];
    });

    exportToCsv(
      `Master_Menu_HPP_Dimsum_Intan_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows
    );
    showNotification('Katalog Menu & HPP berhasil diunduh ke Excel!', 'success');
  };

  const handleExportJson = () => {
    exportToJson(
      `Master_Menu_HPP_Dimsum_Intan_${new Date().toISOString().slice(0, 10)}`,
      menuItems
    );
    showNotification('Data menu berhasil diekspor ke JSON!', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const rawRows = parseCsv(text);
      if (rawRows.length < 2) {
        showNotification('File CSV kosong atau tidak memiliki data!', 'error');
        return;
      }

      // Skip header row
      const dataRows = rawRows.slice(1);
      const parsed: ParsedImportItem[] = dataRows.map((row) => {
        const name = (row[0] || '').trim();
        const rawCategory = (row[1] || '').trim();
        const category: MenuCategory = rawCategory ? (rawCategory as MenuCategory) : 'Makanan Utama';
        const price = parseFloat(row[2]?.replace(/[^0-9.]/g, '') || '0') || 0;
        const costPrice = parseFloat(row[3]?.replace(/[^0-9.]/g, '') || '0') || 0;
        const stock = parseInt(row[4]?.replace(/[^0-9]/g, '') || '0', 10) || 0;
        const description = (row[5] || '').trim();

        const profit = price - costPrice;
        const margin = price > 0 ? (profit / price) * 100 : 0;

        let isValid = true;
        let errorReason: string | undefined;
        let isWarning = false;
        let warningReason: string | undefined;

        if (!name) {
          isValid = false;
          errorReason = 'Nama menu kosong';
        } else if (price <= 0) {
          isValid = false;
          errorReason = 'Harga jual harus > 0';
        } else if (costPrice <= 0) {
          isValid = false;
          errorReason = 'HPP harus > 0';
        } else if (margin < 0) {
          isValid = false;
          errorReason = 'HPP melebihi harga jual (Rugi)';
        } else if (margin < 25) {
          isWarning = true;
          warningReason = 'Margin rendah (< 25%)';
        }

        return {
          name,
          category,
          price,
          costPrice,
          stock,
          description,
          margin: parseFloat(margin.toFixed(1)),
          isValid,
          errorReason,
          isWarning,
          warningReason,
        };
      });

      setParsedImportRows(parsed);
      showNotification(`Terdeteksi ${parsed.length} baris data dari ${file.name}.`, 'info');
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    const validItems = parsedImportRows.filter((r) => r.isValid);
    if (validItems.length === 0) {
      showNotification('Tidak ada data menu yang valid untuk diimpor!', 'error');
      return;
    }

    setIsProcessingImport(true);
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of validItems) {
      const existing = menuItems.find(
        (m) => m.name.toLowerCase().trim() === item.name.toLowerCase().trim()
      );

      if (existing && importMode === 'UPSERT') {
        await updateMenuItem(existing.id, {
          ...existing,
          category: item.category,
          price: item.price,
          costPrice: item.costPrice,
          stock: item.stock > 0 ? item.stock : existing.stock,
          description: item.description || existing.description,
          isAvailable: true,
        });
        updatedCount++;
      } else {
        await addMenuItem({
          name: item.name,
          category: item.category,
          price: item.price,
          costPrice: item.costPrice,
          stock: item.stock,
          isAvailable: item.stock > 0,
          description: item.description,
          image: '',
        });
        createdCount++;
      }
    }

    setIsProcessingImport(false);
    setIsImportModalOpen(false);
    setImportFile(null);
    setParsedImportRows([]);

    showNotification(
      `Impor Berhasil! ${createdCount} menu baru ditambahkan, ${updatedCount} menu diperbarui.`,
      'success'
    );
  };

  const handleRecordWaste = (e: React.FormEvent) => {
    e.preventDefault();
    const item = menuItems.find((m) => m.id === wasteMenuId);
    if (!item) {
      showNotification('Silakan pilih produk dimsum terlebih dahulu!', 'warning');
      return;
    }
    const qty = parseInt(wasteQty) || 0;
    if (qty <= 0) {
      showNotification('Jumlah porsi waste harus lebih dari 0!', 'warning');
      return;
    }

    const newStock = Math.max(0, item.stock - qty);
    updateMenuItem(item.id, {
      ...item,
      stock: newStock,
      isAvailable: newStock > 0,
    });

    // Save waste record to localStorage for audit
    const existing = JSON.parse(localStorage.getItem('dimsum_waste_logs') || '[]');
    existing.unshift({
      id: `waste-${Date.now()}`,
      menuName: item.name,
      quantity: qty,
      reason: wasteReason,
      lossAmount: qty * item.costPrice,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('dimsum_waste_logs', JSON.stringify(existing.slice(0, 50)));

    setIsWasteModalOpen(false);
    showNotification(
      `Waste ${qty} porsi ${item.name} berhasil dicatat & stok dikurangi!`,
      'info'
    );
  };

  const handleQuickAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStockItem) return;
    const added = parseInt(quickStockQty) || 0;
    if (added <= 0) return;

    const newStock = quickStockItem.stock + added;
    updateMenuItem(quickStockItem.id, {
      ...quickStockItem,
      stock: newStock,
      isAvailable: true,
    });

    setQuickStockItem(null);
    showNotification(
      `Stok ${quickStockItem.name} berhasil ditambah +${added} porsi!`,
      'success'
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Security & Role Context Banner */}
      <div className="relative overflow-hidden bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-espresso flex items-center justify-center text-brand-gold shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="font-serif-title text-xl font-bold text-brand-espresso">
                  Master Menu & HPP Pabrik
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-brand-espresso text-brand-gold text-[10px] font-black uppercase tracking-wider">
                  Owner Only
                </span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Sinkronisasi ledger harga modal rantai pasok dapur pusat PT Dimsum Prima Rasa & margin jual seluruh cabang
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 bg-brand-gold/15 hover:bg-brand-gold/30 text-brand-espresso text-xs font-bold px-3.5 py-2 rounded-xl border border-brand-gold/40 shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Impor Massal Data Menu & HPP dari CSV / Excel"
              >
                <FileUp className="w-4 h-4 text-brand-terracotta" />
                <span>Impor Massal (CSV)</span>
              </button>
            )}

            <button
              onClick={handleExportMenuHpp}
              className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-brand-espresso text-xs font-semibold px-3.5 py-2 rounded-xl border border-border-subtle shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Unduh Katalog Menu & HPP ke Excel / CSV"
            >
              <FileDown className="w-4 h-4 text-emerald-700" />
              <span>Ekspor CSV / Excel</span>
            </button>

            <button
              onClick={handleExportJson}
              className="hidden sm:flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-brand-espresso text-xs font-semibold px-3 py-2 rounded-xl border border-border-subtle shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Ekspor Data JSON"
            >
              <span>JSON</span>
            </button>

            <button
              onClick={() => {
                setWasteMenuId(menuItems[0]?.id || '');
                setIsWasteModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-red-200 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Catat Produk Basi / Kukusan Rusak"
            >
              <Trash className="w-4 h-4 text-red-600" />
              <span>Catat Waste</span>
            </button>
            {!isOwner && (
              <div className="flex items-center gap-1.5 bg-status-pending-bg text-status-pending-text px-3 py-1.5 rounded-xl text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Mode Tinjau: Hak Akses Edit Terkunci (Hanya Owner)</span>
              </div>
            )}
            {isOwner && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Tambah Menu</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Bento Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Gross Margin */}
        <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Rata-Rata Gross Margin
            </span>
            <span className="p-1.5 rounded-lg bg-status-lunas-bg text-status-lunas-text">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-serif-title text-2xl font-bold text-brand-espresso">
              {avgMargin}%
            </span>
            <span className="text-xs text-status-lunas-text font-bold">Target &gt; 50%</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-brand-gold h-full rounded-full" style={{ width: `${avgMargin}%` }} />
          </div>
          <span className="text-[10px] text-secondary mt-1">
            Standar industri makanan siap saji
          </span>
        </div>

        {/* KPI 2: Total Variasi */}
        <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Total Variasi Menu
            </span>
            <span className="p-1.5 rounded-lg bg-surface-container text-brand-espresso">
              <UtensilsCrossed className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="font-serif-title text-2xl font-bold text-brand-espresso">
              {totalItems}
            </span>
            <span className="text-xs text-secondary ml-1 font-semibold">Resep Terdaftar</span>
          </div>
          <span className="text-[10px] text-secondary mt-1">
            {categorySummaryText}
          </span>
        </div>

        {/* KPI 3: Margin Tertinggi */}
        <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Margin Tertinggi
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="font-bold text-xs text-brand-espresso truncate">
              {highestMarginItem ? highestMarginItem.name : '-'}
            </div>
            <div className="font-serif-title text-lg font-bold text-emerald-700 mt-0.5">
              {highestMarginItem
                ? `Margin ${(((highestMarginItem.price - highestMarginItem.costPrice) / highestMarginItem.price) * 100).toFixed(1)}%`
                : '0%'}
            </div>
          </div>
          <span className="text-[10px] text-secondary mt-1">
            {highestMarginItem ? 'Profit center utama outlet' : 'Belum ada data menu'}
          </span>
        </div>

        {/* KPI 4: Ketersediaan Bahan */}
        <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Ketersediaan Menu
            </span>
            <span className="p-1.5 rounded-lg bg-surface-container text-primary">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="font-serif-title text-2xl font-bold text-brand-espresso">
              {menuItems.filter((m) => m.isAvailable && m.stock > 0).length} / {totalItems}
            </span>
            <span className="text-xs text-emerald-700 ml-1 font-bold">Tersedia</span>
          </div>
          <span className="text-[10px] text-secondary mt-1">
            Status live tersinkron ke layar kasir
          </span>
        </div>
      </div>

      {/* Main Menu & HPP Table */}
      <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="font-serif-title text-base font-bold text-brand-espresso">
              Daftar Menu & Perhitungan Margin HPP
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Rincian harga modal beli pabrik vs harga jual kasir di seluruh cabang
            </p>
          </div>
          <span className="text-[11px] font-bold text-secondary bg-surface-container px-2.5 py-1 rounded-lg">
            Formula: Margin % = (Harga Jual - HPP) / Harga Jual
          </span>
        </div>

        {/* Mobile View: Menu Cards (< md screen) */}
        <div className="md:hidden divide-y divide-border-subtle p-3">
          {menuItems.map((item) => {
            const profitPerPortion = item.price - item.costPrice;
            const marginPct = ((profitPerPortion / item.price) * 100).toFixed(1);
            const isOutOfStock = !item.isAvailable || item.stock <= 0;

            return (
              <div key={item.id} className="py-3.5 flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-border-subtle shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-brand-espresso truncate">
                        {item.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                        {marginPct}%
                      </span>
                    </div>
                    <span className="text-[10px] text-secondary uppercase font-semibold block">
                      {item.code} • {item.category}
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xs font-bold text-brand-espresso">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-secondary">
                        (HPP: Rp {item.costPrice.toLocaleString('id-ID')})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                  <button
                    onClick={() => toggleMenuAvailability(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      !isOutOfStock
                        ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                        : 'bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border'
                    }`}
                  >
                    {!isOutOfStock ? `Tersedia (Stok: ${item.stock})` : 'Stok Habis'}
                  </button>

                  {isOwner && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-brand-espresso transition-all active:scale-95"
                      >
                        Edit HPP
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmItem(item)}
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                        title="Hapus Menu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tablet & Desktop View: Table (md+ screen) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-secondary">
                <th className="py-3 px-4">Menu & Kategori</th>
                <th className="py-3 px-4 text-right">Modal Pabrik (HPP)</th>
                <th className="py-3 px-4 text-right">Harga Jual Kasir</th>
                <th className="py-3 px-4 text-right">Laba Kotor / Porsi</th>
                <th className="py-3 px-4 text-center">Gross Margin (%)</th>
                <th className="py-3 px-4 text-center">Stok & Status</th>
                {isOwner && <th className="py-3 px-4 text-center">Aksi (Owner)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {menuItems.map((item) => {
                const profitPerPortion = item.price - item.costPrice;
                const marginPct = ((profitPerPortion / item.price) * 100).toFixed(1);
                const isOutOfStock = !item.isAvailable || item.stock <= 0;

                return (
                  <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                    {/* Menu and info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover border border-border-subtle"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-brand-espresso">{item.name}</span>
                          <span className="text-[10px] text-secondary uppercase tracking-wider">
                            {item.code} • {item.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* HPP */}
                    <td className="py-3 px-4 text-right font-medium text-secondary tabular-nums">
                      Rp {item.costPrice.toLocaleString('id-ID')}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right font-bold text-brand-espresso tabular-nums">
                      Rp {item.price.toLocaleString('id-ID')}
                    </td>

                    {/* Profit per Portion */}
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">
                      +Rp {profitPerPortion.toLocaleString('id-ID')}
                    </td>

                    {/* Margin % */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {marginPct}%
                      </span>
                    </td>

                    {/* Stock & Availability */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => toggleMenuAvailability(item.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            !isOutOfStock
                              ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                              : 'bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border'
                          }`}
                          title="Klik untuk toggle status ketersediaan"
                        >
                          {!isOutOfStock ? `Tersedia (${item.stock})` : 'Habis'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickStockItem(item);
                            setQuickStockQty('10');
                          }}
                          title="Tambah stok cepat (Opname / Restok)"
                          className="p-1 rounded-lg bg-surface-container hover:bg-brand-gold/20 text-brand-espresso border border-border-subtle cursor-pointer transition-colors"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Actions (Owner) */}
                    {isOwner && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-brand-espresso transition-colors"
                            title="Edit Menu & HPP"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            title="Hapus Menu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah / Edit Menu */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative my-6"
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif-title font-bold text-xl text-brand-espresso">
              {editingItem ? 'Perbarui Menu & HPP' : 'Tambah Menu & HPP Baru'}
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Atur harga modal beli pabrik dan harga jual untuk memastikan margin keuntungan terjaga.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Nama Menu Produk</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Dimsum Mentai, Kopi Latte, Burger Spesial"
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-brand-espresso">Kategori</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(!isCustomCategory)}
                      className="text-[10px] text-orange-600 hover:underline font-semibold"
                    >
                      {isCustomCategory ? '← Pilih dari daftar' : '+ Kategori Baru'}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <input
                      type="text"
                      value={customCategoryText}
                      onChange={(e) => setCustomCategoryText(e.target.value)}
                      placeholder="Ketik kategori baru..."
                      className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none border border-orange-500/50"
                      required
                    />
                  ) : (
                    <CustomSelect
                      size="sm"
                      value={formCategory}
                      onChange={(val) => {
                        if (val === '__NEW__') {
                          setIsCustomCategory(true);
                          setCustomCategoryText('');
                        } else {
                          setFormCategory(val);
                        }
                      }}
                      options={[
                        ...existingCategories.map((cat) => ({
                          value: cat,
                          label: cat,
                          badge: `${menuItems.filter((m) => m.category === cat).length} menu`,
                        })),
                        {
                          value: '__NEW__',
                          label: '+ Tambah Kategori Baru...',
                        },
                      ]}
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brand-espresso">Stok Porsi Awal</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <RupiahInput
                  label="Modal Beli Pabrik (HPP)"
                  value={formCostPrice}
                  onChange={(e) => setFormCostPrice(e.target.value)}
                  placeholder="Contoh: 11.500"
                  required
                />

                <RupiahInput
                  label="Harga Jual Kasir"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="Contoh: 25.000"
                  required
                />
              </div>

              {/* Calculated Margin Live Indicator */}
              <div className="p-3 rounded-xl bg-surface-container flex justify-between items-center text-xs">
                <span className="text-secondary">Margin Kotor Terhitung:</span>
                <span className="font-bold text-emerald-700">
                  Rp{' '}
                  {(
                    (parseFloat(formPrice) || 0) - (parseFloat(formCostPrice) || 0)
                  ).toLocaleString('id-ID')}{' '}
                  (
                  {(
                    (((parseFloat(formPrice) || 0) - (parseFloat(formCostPrice) || 0)) /
                      (parseFloat(formPrice) || 1)) *
                    100
                  ).toFixed(1)}
                  %)
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Deskripsi Menu</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Isi 4 pcs dengan balutan..."
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                />
              </div>

              <ImageUpload
                value={formImage}
                onChange={(url) => setFormImage(url)}
                label="Foto Menu Dimsum (Upload dari Laptop)"
                placeholder="Pilih file foto menu dari laptop Anda..."
                helperText="Pilih foto langsung dari laptop / galeri HP. Foto otomatis diunggah dan disimpan aman ke Cloudinary CDN."
              />
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
                Simpan Menu & HPP
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Modal: Catat Waste / Basi / Rusak */}
      {isWasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleRecordWaste}
            className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2 text-red-600">
                <Trash className="w-5 h-5" />
                <h3 className="font-serif-title font-bold text-lg text-brand-espresso">
                  Catat Produk Basi / Waste
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWasteModalOpen(false)}
                className="p-1.5 text-secondary hover:bg-surface-container rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-secondary mt-2">
              Pencatatan produk kukusan yang basi, gosong, atau rusak agar stok sistem sinkron dengan fisik.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-1">
                <CustomSelect
                  label="Pilih Produk Dimsum"
                  size="sm"
                  searchable={menuItems.length > 5}
                  value={wasteMenuId}
                  onChange={(val) => setWasteMenuId(val)}
                  options={menuItems.map((m) => ({
                    value: m.id,
                    label: m.name,
                    badge: `Stok: ${m.stock} pcs`,
                    sublabel: `Kategori: ${m.category} • HPP: Rp ${Number(m.costPrice).toLocaleString('id-ID')}`,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">Jumlah Porsi Rusak/Basi</label>
                <input
                  type="number"
                  min={1}
                  value={wasteQty}
                  onChange={(e) => setWasteQty(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs font-bold text-brand-espresso focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <CustomSelect
                  label="Alasan Kerusakan / Waste"
                  size="sm"
                  value={wasteReason}
                  onChange={(val) => setWasteReason(val)}
                  options={[
                    { value: 'Kukusan gosong / terlalu lama', label: 'Kukusan gosong / terlalu lama' },
                    { value: 'Basi / bau asam (Melebihi jam pajang)', label: 'Basi / bau asam (Melebihi jam pajang)' },
                    { value: 'Kulit dimsum sobek / rusak saat handling', label: 'Kulit dimsum sobek / rusak saat handling' },
                    { value: 'Jatuh ke lantai saat penyajian', label: 'Jatuh ke lantai saat penyajian' },
                    { value: 'Kualitas dari pabrik tidak standar', label: 'Kualitas dari pabrik tidak standar' },
                  ]}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWasteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso cursor-pointer hover:bg-surface-container"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Simpan & Potong Stok
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Tambah Stok Cepat */}
      {quickStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-espresso/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleQuickAddStock}
            className="w-full max-w-sm bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-6 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2 text-primary">
                <PackagePlus className="w-5 h-5" />
                <h3 className="font-serif-title font-bold text-base text-brand-espresso">
                  Tambah Stok Cepat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickStockItem(null)}
                className="p-1.5 text-secondary hover:bg-surface-container rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-secondary mt-2">
              Menambahkan stok porsi untuk <strong>{quickStockItem.name}</strong> (Stok saat ini: {quickStockItem.stock} porsi).
            </p>

            <div className="mt-4 flex flex-col gap-1">
              <label className="text-xs font-bold text-brand-espresso">Jumlah Tambahan (Porsi)</label>
              <input
                type="number"
                min={1}
                value={quickStockQty}
                onChange={(e) => setQuickStockQty(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface-container text-base font-bold text-brand-espresso focus:outline-none"
                required
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickStockItem(null)}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso cursor-pointer hover:bg-surface-container"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Tambah Stok
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: IMPOR MASSAL MENU & HPP DIMSUM (Google Stitch Architecture)       */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-espresso/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-card rounded-3xl border border-border-strong shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-gold/20 text-brand-terracotta border border-brand-gold/40">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-title font-bold text-base text-brand-espresso">
                    Impor Data Massal Menu & HPP Dimsum
                  </h3>
                  <p className="text-[11px] text-secondary">
                    Unggah file CSV untuk menambahkan atau memperbarui katalog menu dan HPP sekaligus
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setParsedImportRows([]);
                }}
                className="w-8 h-8 rounded-xl hover:bg-surface-container flex items-center justify-center text-secondary hover:text-brand-espresso transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Template Callout Card */}
              <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-brand-espresso">Format File Standar Pabrik & POS</div>
                    <div className="text-[11px] text-secondary mt-0.5">
                      Gunakan format kolom: Nama Menu, Kategori, Harga Jual, Modal HPP, Stok Awal, Deskripsi.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadMenuCsvTemplate}
                  className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-container-high border border-border-strong text-xs font-bold text-brand-espresso flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  <span>Unduh Template CSV</span>
                </button>
              </div>

              {/* Drag & Drop File Zone */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {!importFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-brand-gold/60 hover:border-brand-gold bg-brand-gold-subtle/40 hover:bg-brand-gold-subtle/70 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 text-brand-terracotta flex items-center justify-center mb-1">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-brand-espresso">
                      Klik untuk memilih file CSV atau drag & drop ke sini
                    </div>
                    <div className="text-[11px] text-secondary max-w-sm">
                      Mendukung file ekstensi <strong className="text-brand-espresso">.csv</strong> dari Microsoft Excel, Google Sheets, atau sistem gudang
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-surface-container border border-border-strong flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-brand-espresso truncate max-w-xs sm:max-w-md">
                          {importFile.name}
                        </div>
                        <div className="text-[10px] text-secondary font-mono mt-0.5">
                          {(importFile.size / 1024).toFixed(1)} KB • Terdeteksi {parsedImportRows.length} Baris Data
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-border-strong text-xs font-bold text-brand-espresso hover:bg-surface-card transition-colors cursor-pointer"
                    >
                      Ganti File
                    </button>
                  </div>
                )}
              </div>

              {/* Mode Switcher */}
              <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-secondary block">
                  Metode Penanganan Data Duplikat:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      importMode === 'UPSERT'
                        ? 'border-brand-gold bg-brand-gold/15 text-brand-espresso font-bold'
                        : 'border-border-subtle bg-surface-card text-secondary'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="UPSERT"
                      checked={importMode === 'UPSERT'}
                      onChange={() => setImportMode('UPSERT')}
                      className="text-brand-terracotta"
                    />
                    <div>
                      <div>Perbarui Menu Lama (Upsert)</div>
                      <div className="text-[10px] text-secondary font-normal">
                        Update harga jual & HPP jika nama menu sudah terdaftar
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      importMode === 'APPEND'
                        ? 'border-brand-gold bg-brand-gold/15 text-brand-espresso font-bold'
                        : 'border-border-subtle bg-surface-card text-secondary'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="APPEND"
                      checked={importMode === 'APPEND'}
                      onChange={() => setImportMode('APPEND')}
                      className="text-brand-terracotta"
                    />
                    <div>
                      <div>Hanya Tambah Baru (Append)</div>
                      <div className="text-[10px] text-secondary font-normal">
                        Menu dengan nama yang sama akan dilewati
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Realtime Parsed Preview Table */}
              {parsedImportRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-espresso">
                      Pratinjau Data ({parsedImportRows.length} Menu)
                    </span>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        {parsedImportRows.filter((r) => r.isValid).length} Siap Impor
                      </span>
                      {parsedImportRows.some((r) => !r.isValid) && (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold">
                          {parsedImportRows.filter((r) => !r.isValid).length} Error
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-border-subtle rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs min-w-[500px]">
                      <thead className="bg-surface-container sticky top-0 border-b border-border-subtle text-[10px] font-bold uppercase tracking-wider text-secondary">
                        <tr>
                          <th className="py-2.5 px-3">Nama Dimsum</th>
                          <th className="py-2.5 px-3">Kategori</th>
                          <th className="py-2.5 px-3 text-right">Harga Jual</th>
                          <th className="py-2.5 px-3 text-right">Modal HPP</th>
                          <th className="py-2.5 px-3 text-right">Margin</th>
                          <th className="py-2.5 px-3 text-right">Stok</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {parsedImportRows.map((item, idx) => (
                          <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                            <td className="py-2.5 px-3 font-bold text-brand-espresso">
                              {item.name || <span className="text-red-500 italic">Kosong</span>}
                            </td>
                            <td className="py-2.5 px-3 text-secondary">{item.category}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-brand-espresso">
                              Rp {item.price.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-secondary">
                              Rp {item.costPrice.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                              {item.margin}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-brand-espresso">
                              {item.stock}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.isValid ? (
                                item.isWarning ? (
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                                    title={item.warningReason}
                                  >
                                    Peringatan
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Valid
                                  </span>
                                )
                              ) : (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-red-200"
                                  title={item.errorReason}
                                >
                                  {item.errorReason || 'Error'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-surface-container-low border-t border-border-subtle flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setParsedImportRows([]);
                }}
                className="px-4 py-2.5 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso hover:bg-surface-card transition-colors cursor-pointer"
              >
                Batalkan
              </button>

              <button
                type="button"
                disabled={
                  isProcessingImport ||
                  parsedImportRows.filter((r) => r.isValid).length === 0
                }
                onClick={handleExecuteImport}
                className="px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-brand-espresso" />
                <span>
                  {isProcessingImport
                    ? 'Memproses Impor...'
                    : `Impor ${parsedImportRows.filter((r) => r.isValid).length} Menu ke Sistem`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal for Menu Deletion (Tactile UI) */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirmItem)}
        type="danger"
        title="Hapus Menu dari Katalog?"
        message={`Apakah Anda yakin ingin menghapus "${deleteConfirmItem?.name}"? Menu ini tidak akan ditampilkan lagi di katalog kasir POS dan perhitungan HPP.`}
        confirmLabel="Ya, Hapus Menu"
        cancelLabel="Batal"
        onConfirm={() => {
          if (deleteConfirmItem) {
            deleteMenuItem(deleteConfirmItem.id);
            setDeleteConfirmItem(null);
            showNotification('Menu berhasil dihapus dari sistem', 'success');
          }
        }}
        onCancel={() => setDeleteConfirmItem(null)}
      />
    </div>
  );
};
