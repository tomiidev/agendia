const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: { total: number; page: number; limit: number; totalPages: number };
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

export class ApiError extends Error {
  status: number;
  errors?: Array<{ field: string; message: string }>;

  constructor(message: string, status: number, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Custom fetch client that automatically attaches authorization and business tenant headers.
 * Returns the full ApiResponse object, useful for paginated endpoints that return 'meta'.
 */
export async function apiFetchPaginated<T = any>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${BASE_API_URL}${path}`;

  let token = '';
  let businessId = '';

  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token') || '';
    businessId = localStorage.getItem('activeBusinessId') || '';
  }

  const headers = new Headers(options.headers);
  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  if (token && !options.credentials) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (businessId) {
    headers.set('X-Business-ID', businessId);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, config);

  const result: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    message: 'Error al interpretar la respuesta del servidor.',
  }));

  if (!response.ok || !result.success) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('activeBusinessId');
      window.dispatchEvent(new Event('auth-changed'));
    }

    throw new ApiError(
      result.message || 'Ha ocurrido un error en la solicitud.',
      response.status,
      result.errors
    );
  }

  return result;
}

/**
 * Custom fetch client that automatically attaches authorization and business tenant headers.
 */
export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const result = await apiFetchPaginated<T>(path, options);
  return result.data as T;
}

export default apiFetch;
