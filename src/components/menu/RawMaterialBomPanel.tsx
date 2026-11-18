import React, { useState } from 'react';
import {
  Package,
  Plus,
  Trash2,
  ChefHat,
  Save,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RawMaterialBomPanel: React.FC = () => {
  const {
    rawMaterials,
    menuItems,
    menuRecipes,
    createRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    saveMenuRecipe,
    selectedOutletId,
  } = useApp();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('10');
  const [isSavingMat, setIsSavingMat] = useState(false);

  // Recipe Editor State
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [recipeRows, setRecipeRows] = useState<Array<{ rawMaterialId: string; quantityUsed: string }>>([]);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSavingMat(true);
    const ok = await createRawMaterial({
      name: name.trim(),
      unit: unit.trim() || 'pcs',
      costPerUnit: Number(costPerUnit) || 0,
      currentStock: Number(currentStock) || 0,
      minStock: Number(minStock) || 0,
      outletId: selectedOutletId !== 'all' ? selectedOutletId : null,
    });
    setIsSavingMat(false);
    if (ok) {
      setName('');
      setCostPerUnit('');
      setCurrentStock('');
    }
  };

  const handleSelectMenuForRecipe = (menuId: string) => {
    setSelectedMenuId(menuId);
    const existing = menuRecipes
      .filter((r) => r.menuId === menuId)
      .map((r) => ({ rawMaterialId: r.rawMaterialId, quantityUsed: String(r.quantityUsed) }));
    setRecipeRows(existing);
  };

  const handleSaveRecipe = async () => {
    if (!selectedMenuId) return;
    setIsSavingRecipe(true);
    await saveMenuRecipe(
      selectedMenuId,
      recipeRows
        .filter((r) => r.rawMaterialId && Number(r.quantityUsed) > 0)
        .map((r) => ({ rawMaterialId: r.rawMaterialId, quantityUsed: Number(r.quantityUsed) }))
    );
    setIsSavingRecipe(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-2">
      {/* 1. Master Bahan Baku */}
      <div className="rounded-3xl bg-surface-card border border-border-subtle p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-terracotta/15 text-brand-terracotta flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-brand-espresso">
                Master Bahan Baku & Kemasan
              </h3>
              <p className="text-[11px] text-secondary">
                Stok acuan untuk audit opname kasir setiap tutup shift malam.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-container text-brand-espresso">
            {rawMaterials.length} Bahan
          </span>
        </div>

        {/* Form Tambah Bahan Baku */}
        <form onSubmit={handleAddMaterial} className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-2xl bg-surface-container/60 border border-border-subtle">
          <input
            type="text"
            required
            placeholder="Nama (mis. Foil)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-2 sm:col-span-2 px-3 py-2 rounded-xl bg-white border border-border-subtle text-xs font-semibold text-brand-espresso"
          />
          <input
            type="text"
            required
            placeholder="Satuan (pcs/gr)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-border-subtle text-xs font-semibold text-brand-espresso"
          />
          <input
            type="number"
            min="0"
            placeholder="Modal/Unit (Rp)"
            value={costPerUnit}
            onChange={(e) => setCostPerUnit(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-border-subtle text-xs font-semibold text-brand-espresso"
          />
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Stok Awal"
            value={currentStock}
            onChange={(e) => setCurrentStock(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-border-subtle text-xs font-semibold text-brand-espresso"
          />
          <button
            type="submit"
            disabled={isSavingMat}
            className="col-span-2 sm:col-span-5 min-h-[40px] rounded-xl bg-brand-terracotta hover:bg-brand-terracotta-dark text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan Baku</span>
          </button>
        </form>

        {/* Tabel Bahan Baku */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-[10px] uppercase text-secondary">
                <th className="py-2 pr-2">Bahan</th>
                <th className="py-2 px-2 text-right">Stok</th>
                <th className="py-2 px-2 text-right">Modal/Unit</th>
                <th className="py-2 pl-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {rawMaterials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-secondary">
                    Belum ada bahan baku. Tambahkan misal: Dimsum Ayam, Aluminium Foil, Saus Mentai, Sumpit.
                  </td>
                </tr>
              ) : (
                rawMaterials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-surface-container/40">
                    <td className="py-2.5 pr-2 font-bold text-brand-espresso">
                      <div className="flex items-center gap-1.5">
                        <span>{mat.name}</span>
                        {mat.isLowStock && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold tabular-nums">
                      {mat.currentStock} {mat.unit}
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-secondary">
                      Rp {mat.costPerUnit.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const add = window.prompt(`Tambah stok masuk untuk ${mat.name} (${mat.unit}):`, '50');
                            if (add && Number(add) > 0) {
                              updateRawMaterial(mat.id, { addStock: Number(add) });
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] hover:bg-emerald-100 cursor-pointer"
                        >
                          +Stok
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRawMaterial(mat.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Hapus bahan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Resep Menu (BOM) */}
      <div className="rounded-3xl bg-surface-card border border-border-subtle p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-gold/20 text-brand-espresso flex items-center justify-center shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-brand-espresso">
              Resep Komposisi Menu (BOM)
            </h3>
            <p className="text-[11px] text-secondary">
              Hubungkan setiap menu POS ke pemakaian bahan baku per 1 porsi terjual.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-brand-espresso block mb-1">
              Pilih Menu POS
            </label>
            <select
              value={selectedMenuId}
              onChange={(e) => handleSelectMenuForRecipe(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-bold text-brand-espresso"
            >
              <option value="">-- Pilih Menu untuk Diatur Resepnya --</option>
              {menuItems.map((m) => {
                const count = menuRecipes.filter((r) => r.menuId === m.id).length;
                return (
                  <option key={m.id} value={m.id}>
                    {m.name} ({count} bahan terhubung)
                  </option>
                );
              })}
            </select>
          </div>

          {selectedMenuId && (
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-surface-container/50 border border-border-subtle">
              {recipeRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={row.rawMaterialId}
                    onChange={(e) => {
                      const next = [...recipeRows];
                      next[idx].rawMaterialId = e.target.value;
                      setRecipeRows(next);
                    }}
                    className="flex-1 px-2.5 py-2 rounded-xl bg-white border border-border-subtle text-xs font-semibold text-brand-espresso"
                  >
                    <option value="">-- Pilih Bahan --</option>
                    {rawMaterials.map((rm) => (
                      <option key={rm.id} value={rm.id}>
                        {rm.name} ({rm.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Qty"
                    value={row.quantityUsed}
                    onChange={(e) => {
                      const next = [...recipeRows];
                      next[idx].quantityUsed = e.target.value;
                      setRecipeRows(next);
                    }}
                    className="w-24 px-2.5 py-2 rounded-xl bg-white border border-border-subtle text-xs font-bold text-brand-espresso"
                  />
                  <button
                    type="button"
                    onClick={() => setRecipeRows(recipeRows.filter((_, i) => i !== idx))}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setRecipeRows([...recipeRows, { rawMaterialId: '', quantityUsed: '1' }])
                  }
                  className="px-3 py-2 rounded-xl border border-border-strong text-xs font-bold text-brand-espresso hover:bg-white flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Tambah Baris Bahan</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingRecipe}
                  onClick={handleSaveRecipe}
                  className="px-4 py-2 rounded-xl bg-brand-espresso text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingRecipe ? 'Menyimpan...' : 'Simpan Resep'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
