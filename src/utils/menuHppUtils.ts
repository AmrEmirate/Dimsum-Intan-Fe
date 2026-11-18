import { MenuItem } from '../types';

export interface MarginMetrics {
  profit: number;
  marginPct: number;
  clampedMarginPct: number;
  status: 'loss' | 'low' | 'healthy';
}

export interface MenuHppValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Filter out soft-deleted menu items so deleted items do not appear in KPIs or tables.
 */
export function filterActiveMenus(items: MenuItem[]): MenuItem[] {
  return items.filter((m) => !m.isSoftDeleted);
}

/**
 * Safely compute profit per portion, margin percentage, clamped progress width, and status.
 * Guards against division by zero when price <= 0.
 */
export function calculateMarginMetrics(price: number, costPrice: number): MarginMetrics {
  const safePrice = Number.isFinite(price) ? price : 0;
  const safeCost = Number.isFinite(costPrice) ? costPrice : 0;
  const profit = safePrice - safeCost;

  if (safePrice <= 0) {
    return {
      profit,
      marginPct: 0,
      clampedMarginPct: 0,
      status: profit < 0 ? 'loss' : 'low',
    };
  }

  const marginPct = (profit / safePrice) * 100;
  const clampedMarginPct = Math.max(0, Math.min(100, marginPct));
  const status: MarginMetrics['status'] =
    marginPct < 0 ? 'loss' : marginPct < 25 ? 'low' : 'healthy';

  return {
    profit,
    marginPct,
    clampedMarginPct,
    status,
  };
}

/**
 * Compute average gross margin percentage across active menu items with valid selling price (> 0).
 */
export function calculateAverageMargin(items: MenuItem[]): number {
  const validItems = items.filter((m) => m.price > 0);
  if (validItems.length === 0) return 0;

  const totalMargin = validItems.reduce(
    (acc, m) => acc + calculateMarginMetrics(m.price, m.costPrice).marginPct,
    0
  );
  return totalMargin / validItems.length;
}

/**
 * Find the menu item with the highest gross margin percentage among items with price > 0.
 */
export function findHighestMarginItem(items: MenuItem[]): MenuItem | null {
  const validItems = items.filter((m) => m.price > 0);
  if (validItems.length === 0) return null;

  return [...validItems].sort(
    (a, b) =>
      calculateMarginMetrics(b.price, b.costPrice).marginPct -
      calculateMarginMetrics(a.price, a.costPrice).marginPct
  )[0];
}

/**
 * Validate Master Menu & HPP form inputs before persisting to API.
 */
export function validateMenuHppForm(input: {
  name: string;
  price: number;
  costPrice: number;
  stock: number;
}): MenuHppValidationResult {
  if (!input.name.trim()) {
    return { isValid: false, error: 'Nama menu produk tidak boleh kosong!' };
  }
  if (!Number.isFinite(input.price) || input.price <= 0) {
    return { isValid: false, error: 'Harga jual kasir harus lebih dari Rp 0!' };
  }
  if (!Number.isFinite(input.costPrice) || input.costPrice < 0) {
    return { isValid: false, error: 'Modal beli pabrik (HPP) tidak boleh negatif!' };
  }
  if (input.costPrice > input.price) {
    return {
      isValid: false,
      error: 'HPP tidak boleh melebihi Harga Jual Kasir (menyebabkan margin rugi)!',
    };
  }
  if (!Number.isFinite(input.stock) || input.stock < 0) {
    return { isValid: false, error: 'Stok awal tidak boleh negatif!' };
  }

  return { isValid: true };
}

/**
 * Calculate total estimated HPP from BOM recipe rows and raw material unit costs.
 */
export function calculateBomCost(
  recipeRows: Array<{ rawMaterialId: string; quantityUsed: number }>,
  rawMaterials: Array<{ id: string; costPerUnit: number }>
): number {
  return recipeRows.reduce((sum, row) => {
    if (!row.rawMaterialId || !Number.isFinite(row.quantityUsed) || row.quantityUsed <= 0) {
      return sum;
    }
    const mat = rawMaterials.find((rm) => rm.id === row.rawMaterialId);
    if (!mat || !Number.isFinite(mat.costPerUnit)) return sum;
    return sum + mat.costPerUnit * row.quantityUsed;
  }, 0);
}
