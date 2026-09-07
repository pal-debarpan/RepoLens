/**
 * RepoLens Centralized API Client
 *
 * All backend communication goes through this module.
 * - Base URL from VITE_API_URL environment variable
 * - Automatic Authorization: Bearer <token> injection
 * - Structured error handling for all HTTP status codes
 * - Type-safe response parsing
 */

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

// ─── Token Storage ────────────────────────────────────────────────────────────

const TOKEN_KEY = 'repolens_access_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore (private browsing)
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// ─── API Error ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly raw?: unknown,
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

function toHumanError(status: number, detail: string): string {
  if (status === 400) return detail || 'Invalid request.';
  if (status === 401) return 'Authentication required. Please sign in again.';
  if (status === 403) return 'You do not have permission to access this resource.';
  if (status === 404) return detail || 'Resource not found.';
  if (status === 409) return detail || 'Conflict — this resource already exists.';
  if (status === 413) return detail || 'Repository is too large to process.';
  if (status === 422) return detail || 'Invalid input data.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status === 500) return 'Internal server error. Please try again.';
  if (status === 502) return 'Authentication service is temporarily unreachable.';
  if (status === 503) return 'Service is temporarily unavailable.';
  if (status === 0) return 'Network error — is the backend server running?';
  return detail || `Unexpected error (${status})`;
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Set to true to skip auth header (e.g. login/signup) */
  noAuth?: boolean;
  /** Set to true for multipart/form-data (do not set Content-Type) */
  multipart?: boolean;
  /** Raw FormData for file uploads */
  formData?: FormData;
}

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, noAuth = false, multipart = false, formData } = opts;

  const reqHeaders: Record<string, string> = { ...headers };

  if (!multipart && !formData) {
    reqHeaders['Content-Type'] = 'application/json';
    reqHeaders['Accept'] = 'application/json';
  }

  if (!noAuth) {
    const token = getStoredToken();
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let fetchBody: BodyInit | undefined;
  if (formData) {
    fetchBody = formData;
  } else if (body !== undefined) {
    fetchBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: reqHeaders,
      body: fetchBody,
    });
  } catch (networkErr) {
    throw new ApiError(0, 'Network error — is the backend server running?', networkErr);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown;
  const ct = response.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    data = await response.json().catch(() => ({}));
  } else {
    data = await response.text().catch(() => '');
  }

  if (!response.ok) {
    const detail =
      (data as { detail?: string })?.detail ??
      (typeof data === 'string' ? data : '') ??
      '';
    const human = toHumanError(response.status, detail);
    throw new ApiError(response.status, human, data);
  }

  return data as T;
}

// ─── Exported Helpers ─────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, opts?: Omit<FetchOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'GET' }),

  post: <T>(path: string, body?: unknown, opts?: Omit<FetchOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),

  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', formData, multipart: true }),

  patch: <T>(path: string, body?: unknown, opts?: Omit<FetchOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),

  delete: <T>(path: string, opts?: Omit<FetchOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
};

