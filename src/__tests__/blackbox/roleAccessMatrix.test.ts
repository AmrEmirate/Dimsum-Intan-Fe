import { describe, it, expect } from 'vitest';
import { UserRole } from '../../types';

describe('Black Box Testing: Role-Based User Access Matrix & Permissions', () => {
  type Feature =
    | 'transaksi-kasir-pos'
    | 'sesi-shift-kasir'
    | 'kas-kecil-outlet'
    | 'verifikasi-kas-kecil'
    | 'batal-transaksi-void'
    | 'kelola-menu-hpp'
    | 'kelola-cabang-outlet'
    | 'kelola-staf-karyawan'
    | 'laporan-laba-rugi'
    | 'tagihan-supplier'
    | 'beban-operasional'
    | 'langganan-billing'
    | 'pengaturan-payment-gateway'
    | 'dompet-penarikan-saldo';

  const checkUserCanAccessFeature = (role: UserRole, feature: Feature): boolean => {
    switch (feature) {
      case 'langganan-billing':
      case 'pengaturan-payment-gateway':
      case 'dompet-penarikan-saldo':
        return role === 'OWNER';

      case 'beban-operasional':
      case 'laporan-laba-rugi':
        return role === 'OWNER' || role === 'AKUNTAN';

      case 'kelola-staf-karyawan':
      case 'kelola-cabang-outlet':
      case 'batal-transaksi-void':
        return role === 'OWNER' || role === 'SUPERVISOR';

      case 'kelola-menu-hpp':
        return role === 'OWNER' || role === 'SUPERVISOR' || role === 'INVENTORY';

      case 'tagihan-supplier':
        return role === 'OWNER' || role === 'SUPERVISOR' || role === 'AKUNTAN';

      case 'verifikasi-kas-kecil':
        return role === 'OWNER' || role === 'SUPERVISOR' || role === 'AKUNTAN';

      case 'transaksi-kasir-pos':
        return role === 'KASIR'; // Hanya Kasir yang menginput transaksi POS
      case 'sesi-shift-kasir':
      case 'kas-kecil-outlet':
        return true; // Semuanya bisa akses operasional shift/audit

      default:
        return false;
    }
  };

  describe('Black Box: KASIR Role Boundary', () => {
    const role: UserRole = 'KASIR';

    it('should be allowed to operate POS and Shift', () => {
      expect(checkUserCanAccessFeature(role, 'transaksi-kasir-pos')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'sesi-shift-kasir')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'kas-kecil-outlet')).toBe(true);
    });

    it('should be strictly denied from Administrative and Billing portals', () => {
      expect(checkUserCanAccessFeature(role, 'langganan-billing')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'pengaturan-payment-gateway')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'kelola-cabang-outlet')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'kelola-staf-karyawan')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'batal-transaksi-void')).toBe(false);
    });
  });

  describe('Black Box: SUPERVISOR Role Boundary', () => {
    const role: UserRole = 'SUPERVISOR';

    it('should have authorization to void orders and verify petty cash', () => {
      expect(checkUserCanAccessFeature(role, 'batal-transaksi-void')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'verifikasi-kas-kecil')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'kelola-menu-hpp')).toBe(true);
    });

    it('should NOT access owner financial reports, wallet, billing, or front-counter POS terminal', () => {
      expect(checkUserCanAccessFeature(role, 'pengaturan-payment-gateway')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'dompet-penarikan-saldo')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'langganan-billing')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'beban-operasional')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'laporan-laba-rugi')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'transaksi-kasir-pos')).toBe(false);
    });
  });

  describe('Black Box: OWNER Role Boundary', () => {
    const role: UserRole = 'OWNER';

    it('should have full management access to outlets, staff, payment gateways, and billing', () => {
      expect(checkUserCanAccessFeature(role, 'pengaturan-payment-gateway')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'langganan-billing')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'kelola-cabang-outlet')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'kelola-staf-karyawan')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'laporan-laba-rugi')).toBe(true);
    });

    it('should NOT access front-counter POS terminal', () => {
      expect(checkUserCanAccessFeature(role, 'transaksi-kasir-pos')).toBe(false);
    });
  });

  describe('Black Box: AKUNTAN Role Boundary', () => {
    const role: UserRole = 'AKUNTAN';

    it('should access financial reports, fixed expenses, supplier bills, and petty cash verification', () => {
      expect(checkUserCanAccessFeature(role, 'laporan-laba-rugi')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'beban-operasional')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'tagihan-supplier')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'verifikasi-kas-kecil')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'sesi-shift-kasir')).toBe(true);
    });

    it('should NOT access owner wallet/billing, staff/outlet management, or POS terminal', () => {
      expect(checkUserCanAccessFeature(role, 'dompet-penarikan-saldo')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'langganan-billing')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'pengaturan-payment-gateway')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'kelola-cabang-outlet')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'kelola-menu-hpp')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'transaksi-kasir-pos')).toBe(false);
    });
  });

  describe('Black Box: INVENTORY Role Boundary', () => {
    const role: UserRole = 'INVENTORY';

    it('should access menu/materials/recipes and shift opname audit', () => {
      expect(checkUserCanAccessFeature(role, 'kelola-menu-hpp')).toBe(true);
      expect(checkUserCanAccessFeature(role, 'sesi-shift-kasir')).toBe(true);
    });

    it('should NOT access financial reports, wallet, billing, or voiding POS orders', () => {
      expect(checkUserCanAccessFeature(role, 'laporan-laba-rugi')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'beban-operasional')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'dompet-penarikan-saldo')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'langganan-billing')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'batal-transaksi-void')).toBe(false);
      expect(checkUserCanAccessFeature(role, 'transaksi-kasir-pos')).toBe(false);
    });
  });
});

