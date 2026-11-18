import { describe, it, expect } from 'vitest';
import {
  validateMenuHppForm,
  filterActiveMenus,
  calculateMarginMetrics,
  calculateBomCost,
} from '../../utils/menuHppUtils';
import { MenuItem } from '../../types';

describe('Black-Box: Master Menu & HPP User Flows', () => {
  it('rejects invalid menu HPP submissions (empty name, zero price, negative HPP, HPP > price)', () => {
    expect(
      validateMenuHppForm({ name: '   ', price: 25000, costPrice: 10000, stock: 10 }).isValid
    ).toBe(false);

    expect(
      validateMenuHppForm({ name: 'Dimsum', price: 0, costPrice: 10000, stock: 10 }).isValid
    ).toBe(false);

    expect(
      validateMenuHppForm({ name: 'Dimsum', price: 25000, costPrice: -100, stock: 10 }).isValid
    ).toBe(false);

    const lossResult = validateMenuHppForm({
      name: 'Dimsum',
      price: 20000,
      costPrice: 25000,
      stock: 10,
    });
    expect(lossResult.isValid).toBe(false);
    expect(lossResult.error).toContain('melebihi Harga Jual');
  });

  it('accepts valid menu HPP submission and computes accurate profit & margin', () => {
    const valid = validateMenuHppForm({
      name: 'Dimsum Mentai',
      price: 28000,
      costPrice: 12000,
      stock: 25,
    });
    expect(valid.isValid).toBe(true);

    const metrics = calculateMarginMetrics(28000, 12000);
    expect(metrics.profit).toBe(16000);
    expect(metrics.marginPct.toFixed(1)).toBe('57.1');
    expect(metrics.status).toBe('healthy');
  });

  it('excludes soft-deleted menus from active catalog after deletion', () => {
    const stateAfterDelete: MenuItem[] = [
      {
        id: '1',
        code: 'DM01',
        name: 'Dimsum Ayam',
        category: 'Kukus',
        price: 25000,
        costPrice: 11000,
        stock: 15,
        description: '',
        image: '',
        isAvailable: true,
        isSoftDeleted: false,
      },
      {
        id: '2',
        code: 'DM02',
        name: 'Menu Dihapus',
        category: 'Goreng',
        price: 22000,
        costPrice: 10000,
        stock: 0,
        description: '',
        image: '',
        isAvailable: false,
        isSoftDeleted: true,
      },
    ];

    const visible = filterActiveMenus(stateAfterDelete);
    expect(visible).toHaveLength(1);
    expect(visible[0].name).toBe('Dimsum Ayam');
  });

  it('computes BOM HPP accurately for syncing to Master Menu HPP', () => {
    const bomHpp = calculateBomCost(
      [
        { rawMaterialId: 'dimsum-pcs', quantityUsed: 4 },
        { rawMaterialId: 'foil', quantityUsed: 1 },
        { rawMaterialId: 'saus-mentai', quantityUsed: 1 },
      ],
      [
        { id: 'dimsum-pcs', costPerUnit: 2200 },
        { id: 'foil', costPerUnit: 600 },
        { id: 'saus-mentai', costPerUnit: 1500 },
      ]
    );
    expect(bomHpp).toBe(10900);
  });
});
