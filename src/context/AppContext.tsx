import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  UserRole,
  User,
  Outlet,
  MenuItem,
  Order,
  OrderCartItem,
  OrderType,
  PaymentMethod,
  ShiftSession,
  PettyCashExpense,
  FactoryInvoice,
  FixedExpense,
} from '../types';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../services/apiClient';

export type AppView =
  | 'dashboard-utama'
  | 'transaksi-kasir-pos'
  | 'sesi-shift-kasir'
  | 'master-menu-dimsum-hpp'
  | 'kas-kecil-outlet'
  | 'tagihan-suplai-pabrik'
  | 'beban-operasional-tetap'
  | 'laporan-laba-rugi-arus-kas';

interface NotificationState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
  // User & Auth State
  currentUser: User;
  isAuthenticated: boolean;
  login: (username: string, password?: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;

  // Outlet State
  outlets: Outlet[];
  selectedOutletId: string; // 'all' | 'du' | 'riau' | 'batu'
  setSelectedOutletId: (id: string) => void;
  getActiveOutlet: () => Outlet | undefined;

  // View Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // Notifications
  notification: NotificationState | null;
  showNotification: (message: string, type?: NotificationState['type']) => void;

  // POS & Cart
  menuItems: MenuItem[];
  cart: OrderCartItem[];
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  addToCart: (menu: MenuItem) => void;
  updateCartQty: (menuId: string, delta: number) => void;
  updateCartNotes: (menuId: string, notes: string) => void;
  removeFromCart: (menuId: string) => void;
  clearCart: () => void;
  processCheckout: (
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    discount?: number
  ) => Promise<Order | null>;

  // Orders History & Voiding
  orders: Order[];
  voidOrder: (orderId: string, reason: string, supervisorPin: string) => Promise<boolean>;
  verifyPin: (pin: string) => boolean;

  // Shift & Cash Reconciliation
  activeShift: ShiftSession | null;
  shiftHistory: ShiftSession[];
  openShift: (startingCash: number) => Promise<void>;
  closeShift: (actualEndingCash: number, notes?: string) => Promise<void>;
  fetchShiftHistory: () => Promise<void>;

  // Petty Cash
  pettyCashList: PettyCashExpense[];
  addPettyCash: (
    amount: number,
    category: PettyCashExpense['category'],
    description: string,
    receiptImage?: File | string | null
  ) => Promise<boolean>;
  updatePettyCash: (
    id: string,
    amount: number,
    category: PettyCashExpense['category'],
    description: string
  ) => Promise<boolean>;
  verifyPettyCash: (id: string, status: 'DISETUJUI' | 'DITOLAK') => Promise<void>;
  deletePettyCash: (id: string, pin: string) => Promise<boolean>;

  // Master Menu & HPP
  addMenuItem: (menu: Omit<MenuItem, 'id' | 'code'>) => Promise<void>;
  updateMenuItem: (id: string, menu: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  toggleMenuAvailability: (id: string) => Promise<void>;

  // Factory Invoices
  factoryInvoices: FactoryInvoice[];
  addFactoryInvoice: (invoice: Omit<FactoryInvoice, 'id' | 'invoiceNumber'>) => Promise<void>;
  markInvoicePaid: (id: string, proofImageUrl?: string) => Promise<void>;
  deleteFactoryInvoice: (id: string) => Promise<boolean>;

  // Fixed OPEX
  fixedExpenses: FixedExpense[];
  addFixedExpense: (expense: Omit<FixedExpense, 'id' | 'code'>) => Promise<void>;
  updateFixedExpense: (id: string, expense: Partial<FixedExpense>) => Promise<boolean>;
  toggleFixedExpenseStatus: (id: string) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<boolean>;

  // Financial Reports
  fetchProfitLossReport: (outletId?: string) => Promise<any>;

  // Security & Settings
  updatePin: (newPin: string) => Promise<boolean>;

  // WhatsApp Integration Status
  whatsappStatus: { isReady: boolean; hasQr: boolean; qrCode: string | null } | null;
  fetchWhatsAppStatus: () => Promise<void>;

  // Refresh helper
  refreshData: () => Promise<void>;
}


const DEFAULT_USER: User = {
  id: 'usr_owner_01',
  name: 'Hj. Intan Permata',
  role: 'OWNER',
  outletName: 'Seluruh Outlet (Pusat)',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(getAuthToken() && localStorage.getItem('dimsum_current_user'));
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('dimsum_current_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [selectedOutletId, setSelectedOutletIdState] = useState<string>(() => {
    return localStorage.getItem('dimsum_outlet_id') || 'all';
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [currentView, setCurrentView] = useState<AppView>('dashboard-utama');
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // 2. Domain Data from Backend
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftSession | null>(null);
  const [shiftHistory, setShiftHistory] = useState<ShiftSession[]>([]);
  const [pettyCashList, setPettyCashList] = useState<PettyCashExpense[]>([]);
  const [factoryInvoices, setFactoryInvoices] = useState<FactoryInvoice[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [whatsappStatus, setWhatsappStatus] = useState<{ isReady: boolean; hasQr: boolean; qrCode: string | null } | null>(null);

  // 3. Cart State
  const [cart, setCart] = useState<OrderCartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableNumber, setTableNumber] = useState('Meja 04 (Lantai 1)');
  const [customerName, setCustomerName] = useState('');

  // Notifications Helper
  const showNotification = (message: string, type: NotificationState['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotification({ id, message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  };

  // Persist Current User & Selected Outlet
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('dimsum_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dimsum_current_user');
    }
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('dimsum_outlet_id', selectedOutletId);
  }, [selectedOutletId]);

  // Fetch WhatsApp Status
  const fetchWhatsAppStatus = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: any }>('/whatsapp/status').catch(() => null);
      if (res?.success) {
        setWhatsappStatus(res.data);
      }
    } catch (err) {
      console.warn('[WA Status Error]', err);
    }
  }, []);

  // Fetch Shift History
  const fetchShiftHistory = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: ShiftSession[] }>('/shifts/history').catch(() => null);
      if (res?.success && Array.isArray(res.data)) {
        setShiftHistory(res.data);
      }
    } catch (err) {
      console.warn('[Shift History Fetch Error]', err);
    }
  }, []);

  // Initial Fetch & Refresh from Backend API
  const refreshData = useCallback(async () => {
    try {
      // 1. Fetch Outlets
      const outletRes = await api.get<{ success: boolean; data: Outlet[] }>('/outlets').catch(() => null);
      if (outletRes?.success && Array.isArray(outletRes.data)) {
        setOutlets(outletRes.data);
      }

      // 2. Fetch Menus
      const menuRes = await api.get<{ success: boolean; data: MenuItem[] }>('/menus').catch(() => null);
      if (menuRes?.success && Array.isArray(menuRes.data)) {
        setMenuItems(menuRes.data);
      }

      // 3. Fetch Orders
      const orderRes = await api.get<{ success: boolean; data: Order[] }>('/pos/orders').catch(() => null);
      if (orderRes?.success && Array.isArray(orderRes.data)) {
        setOrders(orderRes.data);
      }

      // 4. Fetch Active Shift
      const shiftRes = await api.get<{ success: boolean; data: ShiftSession | null }>('/shifts/current').catch(() => null);
      if (shiftRes?.success) {
        setActiveShift(shiftRes.data);
      }

      // 5. Fetch Shift History
      await fetchShiftHistory();

      // 6. Fetch Petty Cash
      const pcRes = await api.get<{ success: boolean; data: PettyCashExpense[] }>('/petty-cash').catch(() => null);
      if (pcRes?.success && Array.isArray(pcRes.data)) {
        setPettyCashList(pcRes.data);
      }

      // 7. Fetch Factory Invoices
      const invRes = await api.get<{ success: boolean; data: FactoryInvoice[] }>('/factory-invoices').catch(() => null);
      if (invRes?.success && Array.isArray(invRes.data)) {
        setFactoryInvoices(invRes.data);
      }

      // 8. Fetch Fixed Expenses
      const expRes = await api.get<{ success: boolean; data: FixedExpense[] }>('/fixed-expenses').catch(() => null);
      if (expRes?.success && Array.isArray(expRes.data)) {
        setFixedExpenses(expRes.data);
      }

      // 9. Fetch WhatsApp Integration Status
      await fetchWhatsAppStatus();
    } catch (err: any) {
      console.warn('[Data Fetch Error]', err);
    }
  }, [fetchShiftHistory, fetchWhatsAppStatus]);

  // Full Login Method (Supports username/password or quick-role fill)
  const login = async (username: string, password?: string, role?: UserRole): Promise<boolean> => {
    try {
      const payload: any = { username, password };
      if (role && !username) payload.role = role;

      const res = await api.post<{
        success: boolean;
        message: string;
        token: string;
        user: User;
      }>('/auth/login', payload);

      if (res.success && res.token) {
        setAuthToken(res.token);
        setIsAuthenticated(true);
        const u = res.user;
        const avatarMap: Record<UserRole, string> = {
          OWNER: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
          SUPERVISOR: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          KASIR: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        };
        const updatedUser: User = {
          id: u.id,
          name: u.name,
          role: u.role,
          outletId: u.outletId,
          outletName: u.outletName,
          avatar: avatarMap[u.role] || avatarMap.OWNER,
        };
        setCurrentUser(updatedUser);

        if (u.role === 'KASIR') {
          setSelectedOutletIdState(u.outletId || 'du');
          setCurrentView('transaksi-kasir-pos');
        } else if (u.role === 'SUPERVISOR') {
          setSelectedOutletIdState('du');
          setCurrentView('dashboard-utama');
        } else {
          setSelectedOutletIdState('all');
          setCurrentView('dashboard-utama');
        }

        showNotification(`Selamat datang, ${u.name}! Berhasil masuk sebagai ${u.role}.`, 'success');
        await refreshData();
        return true;
      }
    } catch (err: any) {
      showNotification(`Gagal masuk: ${err.message || 'Kredensial salah'}`, 'error');
    }
    return false;
  };

  // Logout Method
  const logout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    localStorage.removeItem('dimsum_current_user');
    localStorage.removeItem('dimsum_outlet_id');
    showNotification('Anda telah berhasil keluar dari sistem.', 'info');
  };

  // Switch Role Shortcut
  const switchRole = async (role: UserRole) => {
    try {
      const res = await api.post<{
        success: boolean;
        message: string;
        token: string;
        user: User;
      }>('/auth/login', { role });

      if (res.success && res.token) {
        setAuthToken(res.token);
        setIsAuthenticated(true);
        const u = res.user;
        const avatarMap: Record<UserRole, string> = {
          OWNER: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
          SUPERVISOR: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          KASIR: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        };
        const updatedUser: User = {
          id: u.id,
          name: u.name,
          role: u.role,
          outletId: u.outletId,
          outletName: u.outletName,
          avatar: avatarMap[u.role] || avatarMap.OWNER,
        };
        setCurrentUser(updatedUser);

        if (role === 'KASIR') {
          setSelectedOutletIdState(u.outletId || 'du');
          if (
            currentView !== 'transaksi-kasir-pos' &&
            currentView !== 'sesi-shift-kasir' &&
            currentView !== 'kas-kecil-outlet'
          ) {
            setCurrentView('transaksi-kasir-pos');
          }
          showNotification(`Beralih ke KASIR (${updatedUser.outletName})`, 'info');
        } else if (role === 'SUPERVISOR') {
          showNotification(`Beralih ke SUPERVISOR (Otorisasi & Monitoring)`, 'info');
        } else {
          showNotification(`Beralih ke OWNER (Akses Penuh Seluruh Sistem)`, 'success');
        }

        await refreshData();
      }
    } catch (err: any) {
      showNotification(`Gagal beralih peran: ${err.message}`, 'error');
    }
  };

  // Mount Effect: Authenticate & Load Data
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, refreshData]);


  const setSelectedOutletId = (id: string) => {
    if (currentUser.role === 'KASIR' && currentUser.outletId && id !== currentUser.outletId) {
      showNotification('Akun Kasir terkunci hanya untuk outlet yang ditugaskan!', 'warning');
      return;
    }
    setSelectedOutletIdState(id);
  };

  const getActiveOutlet = (): Outlet | undefined => {
    if (outlets.length === 0) return undefined;
    return outlets.find((o) => o.id === selectedOutletId) || outlets[0];
  };

  // Supervisor PIN Validation (Default fallback PINs: 1234 or 9999)
  const verifyPin = (pin: string): boolean => {
    return pin === '1234' || pin === '9999';
  };

  // Cart Management
  const addToCart = (menu: MenuItem) => {
    if (!menu.isAvailable || menu.stock <= 0) {
      showNotification(`Maaf, ${menu.name} sedang habis!`, 'warning');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.menuId === menu.id);
      if (existing) {
        if (existing.quantity >= menu.stock) {
          showNotification(`Stok tersisa hanya ${menu.stock} porsi`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.menuId === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          menuId: menu.id,
          name: menu.name,
          price: menu.price,
          costPrice: menu.costPrice,
          quantity: 1,
          notes: '',
        },
      ];
    });
  };

  const updateCartQty = (menuId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.menuId === menuId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderCartItem[]
    );
  };

  const updateCartNotes = (menuId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.menuId === menuId ? { ...item, notes } : item))
    );
  };

  const removeFromCart = (menuId: string) => {
    setCart((prev) => prev.filter((item) => item.menuId !== menuId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
  };

  // Process Checkout via Backend API
  const processCheckout = async (
    paymentMethod: PaymentMethod,
    cashReceived: number = 0,
    discount: number = 0
  ): Promise<Order | null> => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const finalTotal = Math.max(0, subtotal - discount);
    const hppTotal = cart.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
    const changeAmount = paymentMethod === 'CASH' ? Math.max(0, cashReceived - finalTotal) : 0;

    const currentOutlet = getActiveOutlet() || outlets[0];
    const targetOutletId = currentOutlet ? currentOutlet.id : 'du';

    try {
      const payload = {
        outletId: targetOutletId,
        orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
        customerName: customerName || (orderType === 'dine-in' ? 'Pelanggan Meja' : 'Pelanggan Takeaway'),
        items: cart,
        subtotal,
        discount,
        total: finalTotal,
        hppTotal,
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? cashReceived : finalTotal,
        changeAmount,
      };

      const res = await api.post<{ success: boolean; message: string; data: Order }>('/pos/orders', payload);

      if (res.success && res.data) {
        const created = res.data;
        setOrders((prev) => [created, ...prev]);

        // Deduct local stock
        setMenuItems((prev) =>
          prev.map((menu) => {
            const cartItem = cart.find((c) => c.menuId === menu.id);
            if (cartItem) {
              const newStock = Math.max(0, menu.stock - cartItem.quantity);
              return { ...menu, stock: newStock, isAvailable: newStock > 0 };
            }
            return menu;
          })
        );

        // Update active shift if any
        if (activeShift) {
          const addCash = paymentMethod === 'CASH' ? finalTotal : 0;
          const addQris = paymentMethod === 'QRIS' ? finalTotal : 0;
          setActiveShift((prev) =>
            prev
              ? {
                  ...prev,
                  cashSales: prev.cashSales + addCash,
                  qrisSales: prev.qrisSales + addQris,
                  expectedCash: prev.expectedCash + addCash,
                }
              : null
          );
        }

        clearCart();
        showNotification(`Transaksi ${created.invoiceNumber} berhasil diselesaikan! (Tersimpan ke Database)`, 'success');
        return created;
      }
    } catch (error: any) {
      showNotification(`Gagal memproses transaksi: ${error.message}`, 'error');
    }
    return null;
  };

  // Void Order via Backend API (Supervisor PIN)
  const voidOrder = async (orderId: string, reason: string, supervisorPin: string): Promise<boolean> => {
    try {
      const res = await api.post<{ success: boolean; message: string }>(
        `/pos/orders/${orderId}/void`,
        { pin: supervisorPin, reason }
      );

      if (res.success) {
        showNotification(res.message, 'info');
        await refreshData();
        return true;
      }
    } catch (error: any) {
      showNotification(`Gagal membatalkan transaksi: ${error.message}`, 'error');
    }
    return false;
  };

  // Shift Actions via Backend API
  const openShift = async (startingCash: number) => {
    const currentOutlet = getActiveOutlet() || outlets[0];
    const targetOutletId = currentOutlet ? currentOutlet.id : 'du';

    try {
      const res = await api.post<{ success: boolean; message: string; data: ShiftSession }>(
        '/shifts/open',
        { outletId: targetOutletId, startingCash }
      );

      if (res.success && res.data) {
        setActiveShift(res.data);
        showNotification(res.message, 'success');
      }
    } catch (error: any) {
      showNotification(`Gagal membuka shift: ${error.message}`, 'error');
    }
  };

  const closeShift = async (actualEndingCash: number, notes?: string) => {
    try {
      const res = await api.post<{ success: boolean; message: string; data: ShiftSession }>(
        '/shifts/close',
        { actualEndingCash, notes }
      );

      if (res.success && res.data) {
        setActiveShift(res.data);
        showNotification(res.message, 'success');
      }
    } catch (error: any) {
      showNotification(`Gagal menutup shift: ${error.message}`, 'error');
    }
  };

  // Petty Cash Actions via Backend API
  const addPettyCash = async (
    amount: number,
    category: PettyCashExpense['category'],
    description: string,
    receiptImage?: File | string | null
  ): Promise<boolean> => {
    const currentOutlet = getActiveOutlet() || outlets[0];
    const targetOutletId = currentOutlet ? currentOutlet.id : 'du';

    try {
      let res: { success: boolean; message: string; data: PettyCashExpense };
      if (typeof File !== 'undefined' && receiptImage instanceof File) {
        const formData = new FormData();
        formData.append('outletId', targetOutletId);
        formData.append('amount', String(amount));
        formData.append('category', category);
        formData.append('description', description);
        formData.append('receipt', receiptImage);
        res = await api.postForm<{ success: boolean; message: string; data: PettyCashExpense }>(
          '/petty-cash',
          formData
        );
      } else {
        res = await api.post<{ success: boolean; message: string; data: PettyCashExpense }>(
          '/petty-cash',
          {
            outletId: targetOutletId,
            amount,
            category,
            description,
            receiptImageUrl: typeof receiptImage === 'string' ? receiptImage : undefined,
          }
        );
      }

      if (res.success && res.data) {
        setPettyCashList((prev) => [res.data, ...prev]);
        showNotification(res.message, 'success');
        if (activeShift) {
          setActiveShift((prev) =>
            prev
              ? {
                  ...prev,
                  pettyCashOut: prev.pettyCashOut + amount,
                  expectedCash: prev.expectedCash - amount,
                }
              : null
          );
        }
        return true;
      }
    } catch (error: any) {
      showNotification(`Gagal mencatat kas kecil: ${error.message}`, 'error');
    }
    return false;
  };

  const verifyPettyCash = async (id: string, status: 'DISETUJUI' | 'DITOLAK') => {
    try {
      const res = await api.patch<{ success: boolean; message: string; data: any }>(
        `/petty-cash/${id}/verify`,
        { status }
      );

      if (res.success) {
        setPettyCashList((prev) =>
          prev.map((pc) => (pc.id === id ? { ...pc, status, verifiedBy: currentUser.name } : pc))
        );
        showNotification(res.message, 'info');
      }
    } catch (error: any) {
      showNotification(`Gagal verifikasi kas kecil: ${error.message}`, 'error');
    }
  };

  const deletePettyCash = async (id: string, pin: string): Promise<boolean> => {
    try {
      const res = await api.delete<{ success: boolean; message: string }>(
        `/petty-cash/${id}`,
        { pin }
      );

      if (res.success) {
        setPettyCashList((prev) => prev.filter((p) => p.id !== id));
        showNotification(res.message, 'info');
        return true;
      }
    } catch (error: any) {
      showNotification(`Gagal menghapus kas kecil: ${error.message}`, 'error');
    }
    return false;
  };

  // Master Menu Actions via Backend API
  const addMenuItem = async (menu: Omit<MenuItem, 'id' | 'code'>) => {
    try {
      const res = await api.post<{ success: boolean; message: string; data: MenuItem }>(
        '/menus',
        menu
      );

      if (res.success && res.data) {
        setMenuItems((prev) => [res.data, ...prev]);
        showNotification(res.message, 'success');
      }
    } catch (error: any) {
      showNotification(`Gagal menambahkan menu: ${error.message}`, 'error');
    }
  };

  const updateMenuItem = async (id: string, partial: Partial<MenuItem>) => {
    try {
      const res = await api.put<{ success: boolean; message: string; data: MenuItem }>(
        `/menus/${id}`,
        partial
      );

      if (res.success && res.data) {
        setMenuItems((prev) => prev.map((m) => (m.id === id ? { ...m, ...res.data } : m)));
        showNotification(res.message, 'success');
      }
    } catch (error: any) {
      showNotification(`Gagal memperbarui menu: ${error.message}`, 'error');
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const res = await api.delete<{ success: boolean; message: string }>(`/menus/${id}`);

      if (res.success) {
        setMenuItems((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isSoftDeleted: true, isAvailable: false } : m))
        );
        showNotification(res.message, 'info');
      }
    } catch (error: any) {
      showNotification(`Gagal menghapus menu: ${error.message}`, 'error');
    }
  };

  const toggleMenuAvailability = async (id: string) => {
    try {
      const res = await api.patch<{ success: boolean; message: string; data: MenuItem }>(
        `/menus/${id}/toggle`
      );

      if (res.success && res.data) {
        setMenuItems((prev) => prev.map((m) => (m.id === id ? { ...m, isAvailable: res.data.isAvailable } : m)));
        showNotification(res.message, 'info');
      }
    } catch (error: any) {
      showNotification(`Gagal mengubah status menu: ${error.message}`, 'error');
    }
  };

  // Factory Invoices via Backend API
  const addFactoryInvoice = async (invoice: Omit<FactoryInvoice, 'id' | 'invoiceNumber'>) => {
    try {
      const res = await api.post<{ success: boolean; message: string; data: FactoryInvoice }>(
        '/factory-invoices',
        invoice
      );

      if (res.success && res.data) {
        setFactoryInvoices((prev) => [res.data, ...prev]);
        showNotification(res.message, 'success');
      }
    } catch (error: any) {
      showNotification(`Gagal mencatat faktur pabrik: ${error.message}`, 'error');
    }
  };

  const markInvoicePaid = async (id: string, proofImageUrl?: string) => {
    try {
      const res = await api.patch<{ success: boolean; message: string; data: FactoryInvoice }>(
        `/factory-invoices/${id}/pay`,
        { proofImageUrl }
      );

      if (res.success && res.data) {
        setFactoryInvoices((prev) =>
          prev.map((inv) => (inv.id === id ? { ...inv, status: 'LUNAS', paidAt: new Date().toISOString().slice(0, 10) } : inv))
        );
        showNotification(res.message, 'success');
      }
    } catch (error: any) {
      showNotification(`Gagal menandai faktur lunas: ${error.message}`, 'error');
    }
  };

  // Fixed Expenses via Backend API
  const addFixedExpense = async (expense: Omit<FixedExpense, 'id' | 'code'>) => {
    try {
      const res = await api.post<{ success: boolean; message: string; data: FixedExpense }>(
        '/fixed-expenses',
        expense
      );

      if (res.success && res.data) {
        setFixedExpenses((prev) => [res.data, ...prev]);
        showNotification(res.message, 'success');
      }
    } catch (error: any) {
      showNotification(`Gagal mencatat beban operasional: ${error.message}`, 'error');
    }
  };

  const toggleFixedExpenseStatus = async (id: string) => {
    try {
      const res = await api.patch<{ success: boolean; message: string; data: FixedExpense }>(
        `/fixed-expenses/${id}/status`
      );

      if (res.success && res.data) {
        setFixedExpenses((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: res.data.status } : e))
        );
        showNotification(res.message, 'info');
      }
    } catch (error: any) {
      showNotification(`Gagal mengubah status beban: ${error.message}`, 'error');
    }
  };

  // Update Petty Cash (before verified)
  const updatePettyCash = async (
    id: string,
    amount: number,
    category: PettyCashExpense['category'],
    description: string
  ): Promise<boolean> => {
    try {
      const res = await api.put<{ success: boolean; message: string; data: PettyCashExpense }>(
        `/petty-cash/${id}`,
        { amount, category, description }
      );

      if (res.success && res.data) {
        setPettyCashList((prev) => prev.map((p) => (p.id === id ? { ...p, ...res.data } : p)));
        showNotification(res.message, 'success');
        await refreshData();
        return true;
      }
    } catch (error: any) {
      showNotification(`Gagal memperbarui kas kecil: ${error.message}`, 'error');
    }
    return false;
  };

  // Delete Factory Invoice
  const deleteFactoryInvoice = async (id: string): Promise<boolean> => {
    try {
      const res = await api.delete<{ success: boolean; message: string }>(`/factory-invoices/${id}`);
      if (res.success) {
        setFactoryInvoices((prev) => prev.filter((inv) => inv.id !== id));
        showNotification(res.message, 'info');
        return true;
      }
    } catch (error: any) {
      showNotification(`Gagal menghapus faktur: ${error.message}`, 'error');
    }
    return false;
  };

  // Update Fixed Expense
  const updateFixedExpense = async (id: string, partial: Partial<FixedExpense>): Promise<boolean> => {
    try {
      const res = await api.put<{ success: boolean; message: string; data: FixedExpense }>(
        `/fixed-expenses/${id}`,
        partial
      );
      if (res.success && res.data) {
        setFixedExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...res.data } : e)));
        showNotification(res.message, 'success');
        return true;
      }
    } catch (error: any) {
      showNotification(`Gagal memperbarui beban: ${error.message}`, 'error');
    }
    return false;
  };

  // Delete Fixed Expense
  const deleteFixedExpense = async (id: string): Promise<boolean> => {
    try {
      const res = await api.delete<{ success: boolean; message: string }>(`/fixed-expenses/${id}`);
      if (res.success) {
        setFixedExpenses((prev) => prev.filter((e) => e.id !== id));
        showNotification(res.message, 'info');
        return true;
      }
    } catch (error: any) {
      showNotification(`Gagal menghapus beban: ${error.message}`, 'error');
    }
    return false;
  };

  // Financial Report from Backend
  const fetchProfitLossReport = async (outletId?: string): Promise<any> => {
    try {
      const query = outletId && outletId !== 'all' ? `?outletId=${outletId}` : '';
      const res = await api.get<{ success: boolean; data: any }>(`/reports/profit-loss${query}`);
      if (res.success) {
        return res.data;
      }
    } catch (err: any) {
      console.warn('[Profit Loss Fetch Error]', err);
    }
    return null;
  };

  // Update PIN Security
  const updatePin = async (newPin: string): Promise<boolean> => {
    try {
      const res = await api.put<{ success: boolean; message: string }>('/auth/pin', { newPin });
      if (res.success) {
        showNotification(res.message, 'success');
        return true;
      }
    } catch (err: any) {
      showNotification(`Gagal memperbarui PIN: ${err.message}`, 'error');
    }
    return false;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        switchRole,
        outlets,
        selectedOutletId,
        setSelectedOutletId,
        getActiveOutlet,
        currentView,
        setCurrentView,
        notification,
        showNotification,
        menuItems: menuItems.filter((m) => !m.isSoftDeleted),
        cart,
        orderType,
        setOrderType,
        tableNumber,
        setTableNumber,
        customerName,
        setCustomerName,
        addToCart,
        updateCartQty,
        updateCartNotes,
        removeFromCart,
        clearCart,
        processCheckout,
        orders,
        voidOrder,
        verifyPin,
        updatePin,
        activeShift,
        shiftHistory,
        openShift,
        closeShift,
        fetchShiftHistory,
        pettyCashList,
        addPettyCash,
        updatePettyCash,
        verifyPettyCash,
        deletePettyCash,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleMenuAvailability,
        factoryInvoices,
        addFactoryInvoice,
        markInvoicePaid,
        deleteFactoryInvoice,
        fixedExpenses,
        addFixedExpense,
        updateFixedExpense,
        toggleFixedExpenseStatus,
        deleteFixedExpense,
        fetchProfitLossReport,
        whatsappStatus,
        fetchWhatsAppStatus,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
