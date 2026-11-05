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
  kaskecil: 'kas-kecil-outlet',
  'petty-cash': 'kas-kecil-outlet',
  pettycash: 'kas-kecil-outlet',

  // Tagihan Suplai Pabrik
  'tagihan-pabrik': 'tagihan-suplai-pabrik',
  pabrik: 'tagihan-suplai-pabrik',
  factory: 'tagihan-suplai-pabrik',
  tagihan: 'tagihan-suplai-pabrik',

  // Beban Operasional Tetap
  'beban-operasional': 'beban-operasional-tetap',
  beban: 'beban-operasional-tetap',
  operasional: 'beban-operasional-tetap',
  expenses: 'beban-operasional-tetap',

  // Laba Rugi
  'laba-rugi': 'laporan-laba-rugi-arus-kas',
  labarugi: 'laporan-laba-rugi-arus-kas',
  'arus-kas': 'laporan-laba-rugi-arus-kas',
  'profit-loss': 'laporan-laba-rugi-arus-kas',
  laporan: 'laporan-laba-rugi-arus-kas',
  pl: 'laporan-laba-rugi-arus-kas',

  // Payment Gateway
  'payment-gateway': 'pengaturan-payment-gateway',
  gateway: 'pengaturan-payment-gateway',
  payment: 'pengaturan-payment-gateway',
  qris: 'pengaturan-payment-gateway',

  // Dashboard
  dashboard: 'dashboard-utama',
  home: 'dashboard-utama',

  // Global Management
  cabang: 'master-cabang-outlet',
  outlet: 'master-cabang-outlet',
  outlets: 'master-cabang-outlet',
  langganan: 'langganan-billing',
  billing: 'langganan-billing',
  subscription: 'langganan-billing',
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
 * Returns canonical outlet slug (e.g. semua, otlate1, otlate2) based on outletId and available outlets.
 * When there are 0 outlets or 'all' is selected, returns 'semua'.
 */
export const getOutletSlug = (outletId: string, outlets: Outlet[]): string => {
  if (!outletId || outletId === 'all' || outlets.length === 0) {
    return 'semua';
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

  return 'semua';
};

/**
 * Resolves an outlet slug (e.g. semua, all, pusat, otlate1, outlet1, dpu, gi-01) to an outlet ID.
 * When outlets is empty or slug is a 'semua' alias, returns 'all'.
 */
export const resolveOutletIdFromSlug = (slug: string, outlets: Outlet[]): string | undefined => {
  if (!slug) return undefined;
  const s = slug.toLowerCase().trim();

  // Virtual / All Outlets representations
  if (s === 'semua' || s === 'all' || s === 'pusat' || s === 'semua-outlet' || s === 'hq' || s === 'global') {
    return 'all';
  }

  // If there are no outlets registered yet, any branch slug gracefully falls back to 'all'
  if (outlets.length === 0) {
    return 'all';
  }

  // Match otlate1, otlate2, outlet1, outlet-1, etc.
  const otlateMatch = s.match(/^(?:otlate|outlet)-?(\d+)$/i);
  if (otlateMatch) {
    const num = parseInt(otlateMatch[1], 10);
    const targetIdx = num - 1;
    if (targetIdx >= 0 && targetIdx < outlets.length) {
      return outlets[targetIdx].id;
    }
    return outlets[0]?.id || 'all';
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

  return 'all';
};

/**
 * Parses pathname into view and outletId.
 * Supports patterns:
 * - /semua/barang -> view: master-menu-dimsum-hpp, outlet: 'all'
 * - /otlate1/barang -> view: master-menu-dimsum-hpp, outlet: outlet 1 (or 'all' if 0 outlets)
 * - /barang -> view: master-menu-dimsum-hpp, outlet: 'all' (or outlet 1 if outlets exist)
 * - /cabang -> view: master-cabang-outlet
 */
export const parsePathToRoute = (
  pathname: string,
  outlets: Outlet[]
): RouteState => {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  if (!cleanPath) {
    return {
      view: 'dashboard-utama',
      matchedOutletId: outlets.length > 0 ? outlets[0].id : 'all',
    };
  }

  const segments = cleanPath.split('/').filter(Boolean);

  // Single segment e.g. /barang or /cabang or /semua or /otlate1
  if (segments.length === 1) {
    const seg = segments[0].toLowerCase();
    
    // Check if it's a known page slug
    if (SLUG_TO_VIEW[seg]) {
      return {
        view: SLUG_TO_VIEW[seg],
        matchedOutletId: outlets.length > 0 ? outlets[0].id : 'all',
      };
    }

    // Check if it's an outlet slug (e.g. /otlate1 or /semua) -> default to dashboard
    const matchedOutlet = resolveOutletIdFromSlug(seg, outlets);
    if (matchedOutlet) {
      return {
        view: 'dashboard-utama',
        outletSlug: seg,
        matchedOutletId: matchedOutlet,
      };
    }

    return {
      view: 'dashboard-utama',
      matchedOutletId: outlets.length > 0 ? outlets[0].id : 'all',
    };
  }

  // Two segments e.g. /semua/barang or /otlate1/barang
  if (segments.length >= 2) {
    const [first, second] = segments;
    const matchedOutlet = resolveOutletIdFromSlug(first, outlets);
    const viewFromSecond = SLUG_TO_VIEW[second.toLowerCase()];

    if (viewFromSecond) {
      return {
        view: viewFromSecond,
        outletSlug: first,
        matchedOutletId: matchedOutlet || (outlets.length > 0 ? outlets[0].id : 'all'),
      };
    }

    // Inverted check in case user typed /barang/semua or /barang/otlate1
    const viewFromFirst = SLUG_TO_VIEW[first.toLowerCase()];
    const matchedOutletFromSecond = resolveOutletIdFromSlug(second, outlets);
    if (viewFromFirst) {
      return {
        view: viewFromFirst,
        outletSlug: second,
        matchedOutletId: matchedOutletFromSecond || (outlets.length > 0 ? outlets[0].id : 'all'),
      };
    }
  }

  return {
    view: 'dashboard-utama',
    matchedOutletId: outlets.length > 0 ? outlets[0].id : 'all',
  };
};

/**
 * Builds canonical URL string.
 * Example:
 * - With 0 outlets or 'all' selected: '/semua/barang'
 * - With outlets created and outlet 1 selected: '/otlate1/barang'
 * - Global views: '/cabang', '/langganan', '/superadmin'
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

  // If there are no outlets yet (0 outlet) or 'all' is selected:
  if (outlets.length === 0 || !outletId || outletId === 'all') {
    return `/semua/${pageSlug}`;
  }

  const outletSlug = getOutletSlug(outletId, outlets);
  return `/${outletSlug}/${pageSlug}`;
};
