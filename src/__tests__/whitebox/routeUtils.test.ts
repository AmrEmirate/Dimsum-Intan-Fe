import { describe, it, expect } from 'vitest';
import {
  parsePathToRoute,
  buildCanonicalPath,
  getOutletSlug,
  resolveOutletIdFromSlug,
  VIEW_TO_SLUG,
  SLUG_TO_VIEW,
} from '../../utils/routeUtils';
import { Outlet } from '../../types';

describe('White-Box Testing: Route Utils & URL Synchronization', () => {
  const mockOutlets: Outlet[] = [
    {
      id: 'outlet-demo-mall-gi',
      name: 'Mall Grand Indonesia Branch',
      code: 'GI-01',
      city: 'Jakarta Pusat',
      address: 'Jl. MH Thamrin No. 1, Jakarta Pusat',
      phone: '081234567890',
      targetDailySales: 5000000,
    },
    {
      id: 'outlet-riau-branch',
      name: 'Riau Branch',
      code: 'RIU',
      city: 'Bandung',
      address: 'Jl. Riau No. 45, Bandung',
      phone: '081234567891',
      targetDailySales: 4000000,
    },
  ];

  describe('buildCanonicalPath', () => {
    it('should build /otlate1/barang for master-menu-dimsum-hpp on outlet 1', () => {
      const url = buildCanonicalPath('master-menu-dimsum-hpp', 'outlet-demo-mall-gi', mockOutlets);
      expect(url).toBe('/otlate1/barang');
    });

    it('should build /otlate2/pos for transaksi-kasir-pos on outlet 2', () => {
      const url = buildCanonicalPath('transaksi-kasir-pos', 'outlet-riau-branch', mockOutlets);
      expect(url).toBe('/otlate2/pos');
    });

    it('should build /otlate1/dompet for dompet-penarikan-saldo', () => {
      const url = buildCanonicalPath('dompet-penarikan-saldo', 'outlet-demo-mall-gi', mockOutlets);
      expect(url).toBe('/otlate1/dompet');
    });

    it('should build /cabang without outlet slug for global views', () => {
      const url = buildCanonicalPath('master-cabang-outlet', 'outlet-demo-mall-gi', mockOutlets);
      expect(url).toBe('/cabang');
    });

    it('should build /langganan without outlet slug for subscription billing', () => {
      const url = buildCanonicalPath('langganan-billing', 'outlet-demo-mall-gi', mockOutlets);
      expect(url).toBe('/langganan');
    });
  });

  describe('parsePathToRoute', () => {
    it('should parse /otlate1/barang into master-menu-dimsum-hpp and outlet 1', () => {
      const route = parsePathToRoute('/otlate1/barang', mockOutlets);
      expect(route.view).toBe('master-menu-dimsum-hpp');
      expect(route.matchedOutletId).toBe('outlet-demo-mall-gi');
    });

    it('should parse /otlate2/pos into transaksi-kasir-pos and outlet 2', () => {
      const route = parsePathToRoute('/otlate2/pos', mockOutlets);
      expect(route.view).toBe('transaksi-kasir-pos');
      expect(route.matchedOutletId).toBe('outlet-riau-branch');
    });

    it('should parse /otlate1/dompet into dompet-penarikan-saldo', () => {
      const route = parsePathToRoute('/otlate1/dompet', mockOutlets);
      expect(route.view).toBe('dompet-penarikan-saldo');
      expect(route.matchedOutletId).toBe('outlet-demo-mall-gi');
    });

    it('should parse single segment /barang with fallback to current outlet', () => {
      const route = parsePathToRoute('/barang', mockOutlets);
      expect(route.view).toBe('master-menu-dimsum-hpp');
    });

    it('should parse /cabang into master-cabang-outlet', () => {
      const route = parsePathToRoute('/cabang', mockOutlets);
      expect(route.view).toBe('master-cabang-outlet');
    });

    it('should handle root path / with fallback to dashboard-utama', () => {
      const route = parsePathToRoute('/', mockOutlets);
      expect(route.view).toBe('dashboard-utama');
    });
  });

  describe('resolveOutletIdFromSlug', () => {
    it('should resolve otlate1 to first outlet', () => {
      const id = resolveOutletIdFromSlug('otlate1', mockOutlets);
      expect(id).toBe('outlet-demo-mall-gi');
    });

    it('should resolve otlate2 to second outlet', () => {
      const id = resolveOutletIdFromSlug('otlate2', mockOutlets);
      expect(id).toBe('outlet-riau-branch');
    });

    it('should resolve by outlet code (gi-01)', () => {
      const id = resolveOutletIdFromSlug('gi-01', mockOutlets);
      expect(id).toBe('outlet-demo-mall-gi');
    });

    it('should resolve "semua" and "pusat" to "all"', () => {
      expect(resolveOutletIdFromSlug('semua', mockOutlets)).toBe('all');
      expect(resolveOutletIdFromSlug('pusat', mockOutlets)).toBe('all');
      expect(resolveOutletIdFromSlug('all', mockOutlets)).toBe('all');
    });
  });

  describe('Zero-Outlet State (Dimsum Intan with 0 registered branches)', () => {
    it('should build /semua/barang when no outlets exist', () => {
      const url = buildCanonicalPath('master-menu-dimsum-hpp', 'all', []);
      expect(url).toBe('/semua/barang');
    });

    it('should build /semua/pos when no outlets exist', () => {
      const url = buildCanonicalPath('transaksi-kasir-pos', 'all', []);
      expect(url).toBe('/semua/pos');
    });

    it('should parse /semua/barang into master-menu-dimsum-hpp and "all"', () => {
      const route = parsePathToRoute('/semua/barang', []);
      expect(route.view).toBe('master-menu-dimsum-hpp');
      expect(route.matchedOutletId).toBe('all');
    });

    it('should gracefully resolve /otlate1/barang to "all" when 0 outlets exist', () => {
      const route = parsePathToRoute('/otlate1/barang', []);
      expect(route.view).toBe('master-menu-dimsum-hpp');
      expect(route.matchedOutletId).toBe('all');
    });
  });
});
