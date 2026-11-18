import { describe, it, expect } from 'vitest';
import {
  filterActiveMenus,
  calculateMarginMetrics,
  calculateAverageMargin,
  findHighestMarginItem,
  validateMenuHppForm,
  calculateBomCost,
} from '../../utils/menuHppUtils';
import { MenuItem } from '../../types';

const makeMenu = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: 'm1',
  code: 'DM01',
  name: 'Dimsum Ayam',
  category: 'Kukus',
  price: 25000,
  costPrice: 11500,
  stock: 20,
  description: '',
  image: '',
  isAvailable: true,
  ...overrides,
});

describe('White-Box: menuHppUtils', () => {
  it('filters out soft-deleted menu items', () => {
    const items = [
      makeMenu({ id: 'm1', isSoftDeleted: false }),
      makeMenu({ id: 'm2', isSoftDeleted: true }),
      makeMenu({ id: 'm3' }),
    ];
    const active = filterActiveMenus(items);
    expect(active.map((m) => m.id)).toEqual(['m1', 'm3']);
  });

  it('guards against division by zero when price <= 0', () => {
    const metrics = calculateMarginMetrics(0, 10000);
    expect(Number.isNaN(metrics.marginPct)).toBe(false);
    expect(Number.isFinite(metrics.marginPct)).toBe(true);
    expect(metrics.marginPct).toBe(0);
    expect(metrics.clampedMarginPct).toBe(0);
    expect(metrics.status).toBe('loss');
  });

  it('clamps margin progress bar and classifies loss, low, and healthy margins', () => {
    const loss = calculateMarginMetrics(10000, 15000);
    expect(loss.profit).toBe(-5000);
    expect(loss.marginPct).toBe(-50);
    expect(loss.clampedMarginPct).toBe(0);
    expect(loss.status).toBe('loss');

    const low = calculateMarginMetrics(20000, 16000);
    expect(low.marginPct).toBe(20);
    expect(low.status).toBe('low');

    const healthy = calculateMarginMetrics(25000, 10000);
    expect(healthy.marginPct).toBe(60);
    expect(healthy.clampedMarginPct).toBe(60);
    expect(healthy.status).toBe('healthy');
  });

  it('calculates average margin and highest margin item safely', () => {
    const items = [
      makeMenu({ id: 'm1', price: 0, costPrice: 5000 }), // ignored safely
      makeMenu({ id: 'm2', price: 20000, costPrice: 10000 }), // 50%
      makeMenu({ id: 'm3', price: 25000, costPrice: 5000 }), // 80%
    ];
    expect(calculateAverageMargin(items)).toBe(65);
    expect(findHighestMarginItem(items)?.id).toBe('m3');
    expect(calculateAverageMargin([])).toBe(0);
    expect(findHighestMarginItem([])).toBeNull();
  });

  it('calculates BOM cost from raw materials and recipe quantities', () => {
    const rawMaterials = [
      { id: 'rm1', costPerUnit: 2000 },
      { id: 'rm2', costPerUnit: 500 },
    ];
    const bomCost = calculateBomCost(
      [
        { rawMaterialId: 'rm1', quantityUsed: 4 },
        { rawMaterialId: 'rm2', quantityUsed: 2 },
        { rawMaterialId: 'missing', quantityUsed: 5 },
      ],
      rawMaterials
    );
    expect(bomCost).toBe(9000);
  });
});
