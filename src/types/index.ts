export type UserRole = 'SUPERADMIN' | 'OWNER' | 'SUPERVISOR' | 'KASIR';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  customDomain?: string | null;
  logoUrl?: string | null;
  themeColor?: string;
  themeConfig?: any;
  plan: string;
  status: string;
  subscriptionExpiresAt?: string | null;
  counts?: {
    outlets: number;
    users: number;
    menus: number;
    orders: number;
  };
  totalGmv?: number;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  role: UserRole;
  outletId?: string;
  outletName?: string;
  tenantId?: string;
  tenant?: TenantInfo | null;
  avatar?: string;
  createdAt?: string;
}

export interface Outlet {
  id: 'du' | 'riau' | 'batu' | string;
  code: string;
  name: string;
  city: string;
  address: string;
  manager?: string;
  phone: string;
  targetDailySales: number;
}

export type MenuCategory = 'mentai' | 'kukus' | 'goreng' | 'minuman';

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  category: MenuCategory;
  price: number;
  costPrice: number; // HPP dari pabrik
  stock: number;
  description: string;
  image: string;
  isAvailable: boolean;
  isBestSeller?: boolean;
  isSoftDeleted?: boolean;
}

export type OrderType = 'dine-in' | 'takeaway';
export type PaymentMethod = 'CASH' | 'QRIS';

export interface OrderCartItem {
  menuId: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  outletId: string;
  outletName: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  items: OrderCartItem[];
  subtotal: number;
  discount: number;
  total: number;
  hppTotal: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeAmount?: number;
  cashierName: string;
  status: 'PAID' | 'VOIDED';
  voidReason?: string;
  voidAuthorizedBy?: string;
  createdAt: string;
}

export interface ShiftSession {
  id: string;
  shiftName: string;
  outletId: string;
  outletName: string;
  cashierId: string;
  cashierName: string;
  terminalId: string;
  startTime: string;
  endTime?: string;
  startingCash: number; // Modal awal di laci kasir
  cashSales: number;    // Penjualan tunai selama shift
  qrisSales: number;    // Penjualan QRIS
  pettyCashOut: number; // Pengeluaran kas kecil darurat dari laci
  expectedCash: number; // Formula: startingCash + cashSales - pettyCashOut
  actualEndingCash?: number; // Fisik uang saat tutup shift
  difference?: number;       // actualEndingCash - expectedCash
  notes?: string;
  status: 'ACTIVE' | 'CLOSED';
}

export type PettyCashCategory = 'ES_BATU' | 'GALON_AIR' | 'PLASTIK_KEMASAN' | 'KEBERSIHAN' | 'LAINNYA';

export interface PettyCashExpense {
  id: string;
  expenseNumber: string;
  outletId: string;
  outletName: string;
  cashierName: string;
  amount: number;
  category: PettyCashCategory;
  description: string;
  receiptImageUrl: string;
  status: 'MENUNGGU_VERIFIKASI' | 'DISETUJUI' | 'DITOLAK';
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface FactoryInvoiceItem {
  itemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
}

export interface FactoryInvoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  outletId: string;
  outletName: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  status: 'LUNAS' | 'BELUM_LUNAS' | 'JATUH_TEMPO';
  items: FactoryInvoiceItem[];
  proofImageUrl?: string;
  paidAt?: string;
  bankAccount: string;
}

export type FixedExpenseCategory = 'SEWA_LAPAK' | 'PAYROLL_GAJI' | 'LISTRIK' | 'AIR' | 'INTERNET_POS';

export interface FixedExpense {
  id: string;
  code: string;
  title: string;
  category: FixedExpenseCategory;
  outletId: string;
  outletName: string;
  amount: number;
  period: string; // Misal: "Oktober 2024"
  status: 'LUNAS' | 'TERJADWAL';
  dueDate: string;
  autoDebet: boolean;
}
