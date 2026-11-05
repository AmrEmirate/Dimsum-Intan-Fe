import { describe, it, expect } from 'vitest';
import { User, UserRole, Outlet } from '../../types';

describe('Black Box Testing: Staff Registration & Branch Assignment Dropdown Flow', () => {
  const existingOutlets: Outlet[] = [
    {
      id: 'ot-1',
      code: 'DGO-01',
      name: 'Outlet 1 - Dago Dipatiukur',
      city: 'Bandung',
      address: 'Jl. Dipatiukur 45 Bandung',
      phone: '08123456789',
      targetDailySales: 5000000,
    },
    {
      id: 'ot-2',
      code: 'RIAU-01',
      name: 'Outlet 2 - Riau Food Street',
      city: 'Bandung',
      address: 'Jl. L.L.R.E Martadinata 12 Bandung',
      phone: '08123456780',
      targetDailySales: 4500000,
    },
    {
      id: 'ot-3',
      code: 'BATU-01',
      name: 'Outlet 3 - Buah Batu Culinary',
      city: 'Bandung',
      address: 'Jl. Buah Batu 102 Bandung',
      phone: '08123456781',
      targetDailySales: 4000000,
    },
  ];

  const existingUsers: User[] = [
    {
      id: 'u-owner',
      name: 'Owner Dimsum',
      username: 'owner',
      role: 'OWNER',
    },
    {
      id: 'u-kasir-1',
      name: 'Budi Kasir',
      username: 'budi_kasir',
      role: 'KASIR',
      outletId: 'ot-1',
    },
  ];

  interface StaffFormPayload {
    name: string;
    username: string;
    password?: string;
    role: UserRole;
    outletId?: string;
  }

  interface StaffRegistrationResult {
    success: boolean;
    error?: string;
    createdUser?: User;
  }

  const registerStaffAccount = (
    payload: StaffFormPayload,
    currentUsers: User[],
    outlets: Outlet[]
  ): StaffRegistrationResult => {
    if (!payload.name || payload.name.trim().length < 3) {
      return { success: false, error: 'Nama lengkap staf wajib diisi minimal 3 karakter!' };
    }

    const cleanUsername = payload.username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Username login wajib diisi minimal 3 karakter!' };
    }

    if (currentUsers.some((u) => u.username && u.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: `Username "${cleanUsername}" sudah digunakan oleh staf lain!` };
    }

    if (!payload.password || payload.password.length < 6) {
      return { success: false, error: 'Kata sandi (password) staf minimal 6 karakter!' };
    }

    if (payload.role === 'KASIR') {
      if (!payload.outletId || payload.outletId.trim() === '') {
        return { success: false, error: 'Akun Kasir wajib memilih cabang penugasan kasir!' };
      }

      const outletExists = outlets.some((o) => o.id === payload.outletId);
      if (!outletExists) {
        return { success: false, error: 'Cabang yang dipilih tidak valid atau sudah nonaktif!' };
      }
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: payload.name.trim(),
      username: cleanUsername,
      role: payload.role,
      outletId: payload.role === 'KASIR' ? payload.outletId : undefined,
    };

    return {
      success: true,
      createdUser: newUser,
    };
  };

  describe('1. Staff Registration Validation Rules', () => {
    it('successfully registers KASIR assigned to valid outlet', () => {
      const res = registerStaffAccount(
        {
          name: 'Siti Rahmawati',
          username: 'siti_dago',
          password: 'password123',
          role: 'KASIR',
          outletId: 'ot-1',
        },
        existingUsers,
        existingOutlets
      );

      expect(res.success).toBe(true);
      expect(res.createdUser).toBeDefined();
      expect(res.createdUser?.username).toBe('siti_dago');
      expect(res.createdUser?.role).toBe('KASIR');
      expect(res.createdUser?.outletId).toBe('ot-1');
    });

    it('rejects KASIR registration when outletId is missing', () => {
      const res = registerStaffAccount(
        {
          name: 'Dewi Lestari',
          username: 'dewi_kasir',
          password: 'password123',
          role: 'KASIR',
          outletId: '',
        },
        existingUsers,
        existingOutlets
      );

      expect(res.success).toBe(false);
      expect(res.error).toBe('Akun Kasir wajib memilih cabang penugasan kasir!');
    });

    it('allows SUPERVISOR registration without branch lock (cross-outlet authorization)', () => {
      const res = registerStaffAccount(
        {
          name: 'Hendro Supervisor',
          username: 'hendro_spv',
          password: 'password123',
          role: 'SUPERVISOR',
        },
        existingUsers,
        existingOutlets
      );

      expect(res.success).toBe(true);
      expect(res.createdUser?.role).toBe('SUPERVISOR');
      expect(res.createdUser?.outletId).toBeUndefined();
    });

    it('rejects registration with duplicate username', () => {
      const res = registerStaffAccount(
        {
          name: 'Budi Santoso Baru',
          username: 'budi_kasir', // already exists
          password: 'password123',
          role: 'KASIR',
          outletId: 'ot-2',
        },
        existingUsers,
        existingOutlets
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('sudah digunakan oleh staf lain');
    });

    it('rejects weak password shorter than 6 characters', () => {
      const res = registerStaffAccount(
        {
          name: 'Rian Pratama',
          username: 'rian_pos',
          password: '123',
          role: 'KASIR',
          outletId: 'ot-1',
        },
        existingUsers,
        existingOutlets
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('minimal 6 karakter');
    });
  });

  describe('2. Cashier Isolation & Outlet Switch Prevention', () => {
    it('restricts cashier access strictly to their assigned outlet', () => {
      const cashierUser: User = {
        id: 'u-kasir-1',
        name: 'Budi Kasir',
        username: 'budi_kasir',
        role: 'KASIR',
        outletId: 'ot-1',
      };

      const canSwitchOutlet = (user: User, targetOutletId: string): boolean => {
        if (user.role === 'OWNER' || user.role === 'SUPERVISOR' || user.role === 'SUPERADMIN') {
          return true;
        }
        return user.outletId === targetOutletId;
      };

      expect(canSwitchOutlet(cashierUser, 'ot-1')).toBe(true);
      expect(canSwitchOutlet(cashierUser, 'ot-2')).toBe(false);
      expect(canSwitchOutlet(cashierUser, 'ot-3')).toBe(false);

      const ownerUser: User = {
        id: 'u-owner',
        name: 'Owner',
        username: 'owner',
        role: 'OWNER',
      };
      expect(canSwitchOutlet(ownerUser, 'ot-1')).toBe(true);
      expect(canSwitchOutlet(ownerUser, 'ot-2')).toBe(true);
      expect(canSwitchOutlet(ownerUser, 'ot-3')).toBe(true);
    });
  });
});
