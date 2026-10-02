import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MenuItem, MenuCategory } from '../types';

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

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<MenuCategory>('mentai');
  const [formPrice, setFormPrice] = useState('25000');
  const [formCostPrice, setFormCostPrice] = useState('11500');
  const [formStock, setFormStock] = useState('40');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');

  // Calculations
  const totalItems = menuItems.length;
  const avgMargin =
    totalItems > 0
      ? (
          menuItems.reduce((acc, m) => acc + ((m.price - m.costPrice) / m.price) * 100, 0) /
          totalItems
        ).toFixed(1)
      : '0';

  const highestMarginItem = [...menuItems].sort(
    (a, b) => (b.price - b.costPrice) / b.price - (a.price - a.costPrice) / a.price
  )[0];

  const handleOpenAdd = () => {
    if (!isOwner) {
      showNotification('Hanya akun OWNER yang diizinkan menambah menu & HPP!', 'error');
      return;
    }
    setEditingItem(null);
    setFormName('');
    setFormCategory('mentai');
    setFormPrice('25000');
    setFormCostPrice('11500');
    setFormStock('30');
    setFormDescription('');
    setFormImage(
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=500&auto=format&fit=crop&q=80'
    );
    setIsModalOpen(true);
  };

  const handleOpenEdit = (menu: MenuItem) => {
    if (!isOwner) {
      showNotification('Hanya akun OWNER yang diizinkan mengubah harga & HPP menu!', 'error');
      return;
    }
    setEditingItem(menu);
    setFormName(menu.name);
    setFormCategory(menu.category);
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

    if (editingItem) {
      updateMenuItem(editingItem.id, {
        name: formName,
        category: formCategory,
        price,
        costPrice,
        stock,
        description: formDescription,
        image: formImage,
      });
    } else {
      addMenuItem({
        name: formName,
        category: formCategory,
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
                Sinkronisasi ledger harga modal rantai pasok dapur pusat PT Dimsum Prima Rasa & margin jual 3 cabang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
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
                <span>+ Tambah Menu Baru</span>
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
            Kukus (4), Mentai (2), Goreng (3), Minuman (3)
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
              {highestMarginItem?.name || 'Dimsum Mentai'}
            </div>
            <div className="font-serif-title text-lg font-bold text-emerald-700 mt-0.5">
              Margin{' '}
              {highestMarginItem
                ? (
                    ((highestMarginItem.price - highestMarginItem.costPrice) /
                      highestMarginItem.price) *
                    100
                  ).toFixed(1)
                : '54.0'}
              %
            </div>
          </div>
          <span className="text-[10px] text-secondary mt-1">Profit center utama outlet</span>
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

        <div className="overflow-x-auto">
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
                      <button
                        onClick={() => toggleMenuAvailability(item.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          !isOutOfStock
                            ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                            : 'bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border'
                        }`}
                        title="Klik untuk mengubah status ketersediaan"
                      >
                        {!isOutOfStock ? `Tersedia (${item.stock})` : 'Habis'}
                      </button>
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
                            onClick={() => deleteMenuItem(item.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Hapus Menu (Soft delete)"
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
                <label className="text-xs font-bold text-brand-espresso">Nama Menu Dimsum</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Dimsum Mozzarella Mentai"
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
                    <option value="mentai">Dimsum Mentai</option>
                    <option value="kukus">Dimsum Kukus</option>
                    <option value="goreng">Dimsum Goreng</option>
                    <option value="minuman">Minuman & Ekstra</option>
                  </select>
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
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brand-espresso">
                    Modal Beli Pabrik (HPP) (Rp)
                  </label>
                  <input
                    type="number"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    placeholder="11500"
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brand-espresso">
                    Harga Jual Kasir (Rp)
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="25000"
                    className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
                    required
                  />
                </div>
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

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-espresso">URL Foto Menu</label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-brand-espresso focus:outline-none"
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
                Simpan Menu & HPP
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
