import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getTenantSlug,
  setTenantSlug,
  clearTenantSlug,
  getActiveTenantId,
  setActiveTenantId,
  clearActiveTenantId,
  ApiError,
} from '../../services/apiClient';

// Polyfill localStorage for node environment
if (typeof localStorage === 'undefined') {
  let store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe('White Box Testing: apiClient.ts (Token & Multi-Tenant State Storage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('White Box: Authentication Token Storage', () => {
    it('should return null when token is not set', () => {
      expect(getAuthToken()).toBeNull();
    });

    it('should store and retrieve auth token in localStorage', () => {
      setAuthToken('jwt-sample-token-12345');
      expect(getAuthToken()).toBe('jwt-sample-token-12345');
    });

    it('should clear token on clearAuthToken()', () => {
      setAuthToken('jwt-sample-token-12345');
      clearAuthToken();
      expect(getAuthToken()).toBeNull();
    });
  });

  describe('White Box: Tenant Slug Storage', () => {
    it('should store and retrieve tenant slug', () => {
      setTenantSlug('dimsum-intan');
      expect(getTenantSlug()).toBe('dimsum-intan');
    });

    it('should clear tenant slug on clearTenantSlug()', () => {
      setTenantSlug('dimsum-intan');
      clearTenantSlug();
      expect(getTenantSlug()).toBeNull();
    });
  });

  describe('White Box: Active Tenant ID Storage', () => {
    it('should store and retrieve active tenant UUID', () => {
      setActiveTenantId('tenant-uuid-8899');
      expect(getActiveTenantId()).toBe('tenant-uuid-8899');
    });

    it('should clear active tenant UUID', () => {
      setActiveTenantId('tenant-uuid-8899');
      clearActiveTenantId();
      expect(getActiveTenantId()).toBeNull();
    });
  });

  describe('White Box: ApiError Class Properties', () => {
    it('should properly encapsulate status code, message, and error payload', () => {
      const errorData = { code: 'INVALID_CREDENTIALS', attemptsLeft: 2 };
      const err = new ApiError(401, 'Username atau password salah', errorData);

      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('ApiError');
      expect(err.status).toBe(401);
      expect(err.message).toBe('Username atau password salah');
      expect(err.data).toEqual(errorData);
    });
  });
});
