import { AppView } from '../context/AppContext';
import { Outlet } from '../types';

export interface RouteState {
  view: AppView;
  outletId?: string;
  matchedOutletId?: string;
  outletSlug?: string;
}

// Canonical view to URL slug mapping
export const VIEW_TO_SLUG: Record<AppView, string> = {
  'dashboard-utama': 'dashboard',
  'transaksi-kasir-pos': 'pos',
  'sesi-shift-kasir': 'shift',
  'master-menu-dimsum-hpp': 'barang',
  'kas-kecil-outlet': 'kas-kecil',
  'tagihan-suplai-pabrik': 'tagihan-pabrik',
  'beban-operasional-tetap': 'beban-operasional',
  'laporan-laba-rugi-arus-kas': 'laba-rugi',
  'dompet-penarikan-saldo': 'dompet',
  'pengaturan-payment-gateway': 'payment-gateway',
  'master-cabang-outlet': 'cabang',
  'langganan-billing': 'langganan',
  'superadmin-portal': 'superadmin',
};

// Aliases mapping to AppView
export const SLUG_TO_VIEW: Record<string, AppView> = {
  // Barang & Menu
  barang: 'master-menu-dimsum-hpp',
  menu: 'master-menu-dimsum-hpp',
  hpp: 'master-menu-dimsum-hpp',
  'master-menu': 'master-menu-dimsum-hpp',
  produk: 'master-menu-dimsum-hpp',

  // Kasir POS
  pos: 'transaksi-kasir-pos',
  kasir: 'transaksi-kasir-pos',
  transaksi: 'transaksi-kasir-pos',

  // Sesi Shift
  shift: 'sesi-shift-kasir',
  'sesi-shift': 'sesi-shift-kasir',

  // Dompet Digital & Penarikan
  dompet: 'dompet-penarikan-saldo',
  'tarik-saldo': 'dompet-penarikan-saldo',
  saldo: 'dompet-penarikan-saldo',
  wallet: 'dompet-penarikan-saldo',

  // Kas Kecil
  'kas-kecil': 'kas-kecil-outlet',
  'petty-cash': 'kas-kecil-outlet',

  // Tagihan Suplai Pabrik
  'tagihan-pabrik': 'tagihan-suplai-pabrik',
  pabrik: 'tagihan-suplai-pabrik',
  factory: 'tagihan-suplai-pabrik',

  // Beban Operasional Tetap
  'beban-operasional': 'beban-operasional-tetap',
  beban: 'beban-operasional-tetap',
  expenses: 'beban-operasional-tetap',

  // Laba Rugi
  'laba-rugi': 'laporan-laba-rugi-arus-kas',
  'arus-kas': 'laporan-laba-rugi-arus-kas',
  'profit-loss': 'laporan-laba-rugi-arus-kas',

  // Payment Gateway
  'payment-gateway': 'pengaturan-payment-gateway',
  gateway: 'pengaturan-payment-gateway',

  // Dashboard
  dashboard: 'dashboard-utama',
  home: 'dashboard-utama',

  // Global Management
  cabang: 'master-cabang-outlet',
  outlet: 'master-cabang-outlet',
  outlets: 'master-cabang-outlet',
  langganan: 'langganan-billing',
  billing: 'langganan-billing',
  superadmin: 'superadmin-portal',
};

export const VIEW_TITLES: Record<AppView, string> = {
  'dashboard-utama': 'Ringkasan Eksekutif',
  'transaksi-kasir-pos': 'Kasir POS Penjualan',
  'sesi-shift-kasir': 'Sesi Shift Kasir',
  'master-menu-dimsum-hpp': 'Master Menu Dimsum & HPP',
  'kas-kecil-outlet': 'Kas Kecil (Petty Cash)',
  'tagihan-suplai-pabrik': 'Tagihan Suplai Pabrik',
  'beban-operasional-tetap': 'Beban Operasional Tetap',
  'laporan-laba-rugi-arus-kas': 'Laporan Laba Rugi & Arus Kas',
  'dompet-penarikan-saldo': 'Dompet Digital & Tarik Saldo',
  'pengaturan-payment-gateway': 'Pengaturan Payment Gateway',
  'master-cabang-outlet': 'Kelola Cabang Outlet',
  'langganan-billing': 'Langganan & Billing',
  'superadmin-portal': 'Superadmin Portal',
};

// Global views that don't need outlet slug
export const GLOBAL_VIEWS: AppView[] = [
  'master-cabang-outlet',
  'langganan-billing',
  'superadmin-portal',
];

/**
 * Returns canonical outlet slug (e.g. otlate1, otlate2, otlate3) based on outletId and available outlets.
 */
export const getOutletSlug = (outletId: string, outlets: Outlet[]): string => {
  if (!outletId || outletId === 'all') {
    return 'otlate1';
  }

  const idx = outlets.findIndex((o) => o.id === outletId);
  if (idx >= 0) {
    return `otlate${idx + 1}`;
  }

  // Fallback to code or sanitized id
  const outlet = outlets.find((o) => o.id === outletId);
  if (outlet?.code) {
    return outlet.code.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  return 'otlate1';
};

/**
 * Resolves an outlet slug (e.g. otlate1, outlet1, dpu, gi-01) to an outlet ID.
 */
export const resolveOutletIdFromSlug = (slug: string, outlets: Outlet[]): string | undefined => {
  if (!slug || outlets.length === 0) return undefined;
  const s = slug.toLowerCase().trim();

  // Match otlate1, otlate2, outlet1, outlet-1, etc.
  const otlateMatch = s.match(/^(?:otlate|outlet)-?(\d+)$/i);
  if (otlateMatch) {
    const num = parseInt(otlateMatch[1], 10);
    const targetIdx = num - 1;
    if (targetIdx >= 0 && targetIdx < outlets.length) {
      return outlets[targetIdx].id;
    }
    return outlets[0]?.id;
  }

  // Match by code
  const byCode = outlets.find((o) => o.code.toLowerCase() === s);
  if (byCode) return byCode.id;

  // Match by id
  const byId = outlets.find((o) => o.id.toLowerCase() === s);
  if (byId) return byId.id;

  // Match by name
  const byName = outlets.find((o) => o.name.toLowerCase().replace(/\s+/g, '-') === s);
  if (byName) return byName.id;

  return undefined;
};

/**
 * Parses pathname into view and outletId.
 * Supports patterns:
 * - /otlate1/barang -> view: master-menu-dimsum-hpp, outlet: outlet 1
 * - /otlate1/pos -> view: transaksi-kasir-pos, outlet: outlet 1
 * - /barang -> view: master-menu-dimsum-hpp
 * - /dompet -> view: dompet-penarikan-saldo
 * - /cabang -> view: master-cabang-outlet
 */
export const parsePathToRoute = (
  pathname: string,
  outlets: Outlet[]
): RouteState => {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  if (!cleanPath) {
    return { view: 'dashboard-utama' };
  }

  const segments = cleanPath.split('/').filter(Boolean);

  // Single segment e.g. /barang or /cabang or /otlate1
  if (segments.length === 1) {
    const seg = segments[0].toLowerCase();
    
    // Check if it's a known page slug
    if (SLUG_TO_VIEW[seg]) {
      return { view: SLUG_TO_VIEW[seg] };
    }

    // Check if it's an outlet slug (e.g. /otlate1) -> default to dashboard
    const matchedOutlet = resolveOutletIdFromSlug(seg, outlets);
    if (matchedOutlet) {
      return {
        view: 'dashboard-utama',
        outletSlug: seg,
        matchedOutletId: matchedOutlet,
      };
    }

    return { view: 'dashboard-utama' };
  }

  // Two segments e.g. /otlate1/barang
  if (segments.length >= 2) {
    const [first, second] = segments;
    const matchedOutlet = resolveOutletIdFromSlug(first, outlets);
    const viewFromSecond = SLUG_TO_VIEW[second.toLowerCase()];

    if (viewFromSecond) {
      return {
        view: viewFromSecond,
        outletSlug: first,
        matchedOutletId: matchedOutlet || (outlets[0]?.id ?? undefined),
      };
    }

    // Inverted check in case user typed /barang/otlate1
    const viewFromFirst = SLUG_TO_VIEW[first.toLowerCase()];
    const matchedOutletFromSecond = resolveOutletIdFromSlug(second, outlets);
    if (viewFromFirst) {
      return {
        view: viewFromFirst,
        outletSlug: second,
        matchedOutletId: matchedOutletFromSecond || (outlets[0]?.id ?? undefined),
      };
    }
  }

  return { view: 'dashboard-utama' };
};

/**
 * Builds canonical URL string.
 * Example:
 * view: 'master-menu-dimsum-hpp', outlet: 'outlet-1' -> '/otlate1/barang'
 * view: 'master-cabang-outlet' -> '/cabang'
 */
export const buildCanonicalPath = (
  view: AppView,
  outletId: string,
  outlets: Outlet[]
): string => {
  // Global view doesn't need outlet slug
  if (GLOBAL_VIEWS.includes(view)) {
    return `/${VIEW_TO_SLUG[view] || 'dashboard'}`;
  }

  const pageSlug = VIEW_TO_SLUG[view] || 'dashboard';
  const outletSlug = getOutletSlug(outletId, outlets);

  return `/${outletSlug}/${pageSlug}`;
};
