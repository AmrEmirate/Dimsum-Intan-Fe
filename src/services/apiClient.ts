/**
 * Cloud Multi-Tenant POS & Accounting API Client
 * Berfungsi sebagai layer komunikasi ke backend Express 5 + PostgreSQL Multi-Tenant.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('dimsum_intan_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('dimsum_intan_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('dimsum_intan_token');
};

export const getTenantSlug = (): string | null => {
  // Check URL query param first (e.g. ?tenant=kopisenja)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get('tenant');
    if (querySlug) return querySlug.toLowerCase().trim();

    // Check subdomain (e.g. kopisenja.posmu.cloud)
    const host = window.location.hostname;
    if (host && (host.includes('.posmu.cloud') || host.includes('.vimtk.cloud'))) {
      const parts = host.split('.');
      if (parts.length >= 3 && parts[0] !== 'api' && parts[0] !== 'admin' && parts[0] !== 'www') {
        return parts[0].toLowerCase();
      }
    }
  }

  return localStorage.getItem('dimsum_tenant_slug');
};

export const setTenantSlug = (slug: string): void => {
  localStorage.setItem('dimsum_tenant_slug', slug);
};

export const clearTenantSlug = (): void => {
  localStorage.removeItem('dimsum_tenant_slug');
};

export const getActiveTenantId = (): string | null => {
  return localStorage.getItem('dimsum_active_tenant_id');
};

export const setActiveTenantId = (id: string): void => {
  localStorage.setItem('dimsum_active_tenant_id', id);
};

export const clearActiveTenantId = (): void => {
  localStorage.removeItem('dimsum_active_tenant_id');
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const tenantSlug = getTenantSlug();
  const tenantId = getActiveTenantId();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (tenantSlug) {
    headers['X-Tenant-Slug'] = tenantSlug;
  }

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || `HTTP Error ${response.status}`,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Network failure');
  }
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) =>
    apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  postForm: <T>(endpoint: string, formData: FormData) =>
    apiRequest<T>(endpoint, { method: 'POST', body: formData }),
  put: <T>(endpoint: string, body: any) =>
    apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};
