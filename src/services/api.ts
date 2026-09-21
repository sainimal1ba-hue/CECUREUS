/**
 * CECUREUS — Central Production API Client Service
 *
 * Why this file was created:
 * This module provides the central HTTP client transport for all mobile client requests:
 * 1. Modular Network Architecture: Reads the active endpoint strictly from `@/config/api`
 *    (`process.env.EXPO_PUBLIC_API_URL`). Zero hardcoded loopback or private LAN IPs.
 * 2. Seamless Switching: Switching between immediate Cloudflare Tunnel testing and a
 *    production VPS requires editing only the single `EXPO_PUBLIC_API_URL` entry in `.env`.
 * 3. Network Interceptor: Catches socket disconnects, DNS timeouts, and gateway errors (502/503/504),
 *    triggering the global `NetworkErrorBanner` and providing user-friendly messaging instead of raw Java exceptions.
 * 4. Microservice API Wrappers: Auth, profile, counsellors, mood, assessments, blogs (paginated), and Ally AI.
 */

import { getAuthToken } from './storage';
import { API_BASE_URL, getFallbackApiUrl } from '../config/api';
import { networkEvents } from './networkEvents';

export const DEFAULT_API_URL = API_BASE_URL;

let currentBaseUrl = API_BASE_URL;

export function setApiBaseUrl(url: string) {
  currentBaseUrl = url.replace(/\/$/, '');
}

export function getApiBaseUrl() {
  return currentBaseUrl;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeoutMs?: number;
  idempotencyKey?: string;
}

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Core HTTP Request Wrapper
 * Connects directly to the modular API base URL configured in .env or active tunnel.
 * If transport fails on the active route, automatically attempts fallback before alerting user.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    skipAuth = false,
    timeoutMs = 15000,
    idempotencyKey,
  } = options;

  const resolvedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  if (!skipAuth) {
    const token = await getAuthToken();
    if (token) {
      resolvedHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  if (idempotencyKey) {
    resolvedHeaders['Idempotency-Key'] = idempotencyKey;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Helper to execute a single fetch against a specified base URL
  async function executeFetch(baseUrl: string): Promise<Response> {
    const targetUrl = `${baseUrl}${cleanEndpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(targetUrl, {
        method,
        headers: resolvedHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  let response: Response | null = null;
  let requestSucceeded = false;

  // Attempt 1: Primary active endpoint
  try {
    response = await executeFetch(currentBaseUrl);
    // Treat 502/503/504 as gateway disconnects
    if (response.status !== 502 && response.status !== 503 && response.status !== 504) {
      requestSucceeded = true;
    }
  } catch (err) {
    requestSucceeded = false;
  }

  // Attempt 2: Fallback endpoint if primary failed and a fallback exists
  if (!requestSucceeded) {
    const fallbackUrl = getFallbackApiUrl();
    if (fallbackUrl && fallbackUrl !== currentBaseUrl) {
      try {
        const fallbackRes = await executeFetch(fallbackUrl);
        if (fallbackRes.status !== 502 && fallbackRes.status !== 503 && fallbackRes.status !== 504) {
          response = fallbackRes;
          requestSucceeded = true;
          // Switch to working endpoint so subsequent requests are immediate
          currentBaseUrl = fallbackUrl;
        }
      } catch (fallbackErr) {
        // Fallback also failed
      }
    }
  }

  // If request failed to connect
  if (!requestSucceeded || !response) {
    let errorMsg = 'Unable to reach the CecureUs server. Please check your connection or server status.';
    try {
      const netInfo = await import('@react-native-community/netinfo');
      const state = await netInfo.default.fetch();
      if (state.isConnected === false) {
        errorMsg = 'No internet connection detected on your device. Please check your Wi-Fi or cellular network.';
      }
    } catch {}

    networkEvents.notifyError(errorMsg);
    throw new ApiError(
      errorMsg,
      response?.status || 0,
      'NETWORK_ERROR'
    );
  }

  // Clear any existing connection alerts on successful network transport
  networkEvents.notifyClear();

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const message =
      (typeof data === 'object' && (data?.error?.message || data?.message || data?.error)) ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(
      message,
      response.status,
      typeof data === 'object' ? data?.error?.code || data?.code : undefined,
      typeof data === 'object' ? data?.error?.details || data?.details : undefined
    );
  }

  return data as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN-SPECIFIC API CLIENT MODULES
// ─────────────────────────────────────────────────────────────────────────────

export const authApi = {
  requestPhoneOtp: (data: { phone: string }) =>
    apiRequest('/api/auth/request-otp', {
      method: 'POST',
      body: { phone: data.phone, purpose: 'registration' },
      skipAuth: true,
    }),

  verifyPhoneOtp: (data: { phone: string; code: string }) =>
    apiRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: { phone: data.phone, code: data.code, purpose: 'registration' },
      skipAuth: true,
    }),

  requestEmailOtp: (data: { email: string }) =>
    apiRequest('/api/auth/request-otp', {
      method: 'POST',
      body: { email: data.email, purpose: 'registration' },
      skipAuth: true,
    }),

  verifyEmailOtp: (data: { email: string; code: string }) =>
    apiRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: { email: data.email, code: data.code, purpose: 'registration' },
      skipAuth: true,
    }),

  register: (data: { name: string; phone: string; email?: string; password?: string }) =>
    apiRequest('/api/auth/register', { method: 'POST', body: data, skipAuth: true }),

  registerWithOtp: (data: {
    name: string;
    phone: string;
    email: string;
    password?: string;
    emailOtp?: string;
  }) =>
    apiRequest('/api/auth/register-with-otp', { method: 'POST', body: data, skipAuth: true }),

  login: (data: { phone?: string; identifier?: string; password?: string }) =>
    apiRequest('/api/auth/login', { method: 'POST', body: data, skipAuth: true }),

  loginWithOtp: (data: { identifier: string; code: string }) =>
    apiRequest('/api/auth/login-with-otp', { method: 'POST', body: data, skipAuth: true }),

  requestOtp: (data: { identifier?: string; phone?: string; email?: string; purpose: 'registration' | 'login' | 'password_reset' }) =>
    apiRequest('/api/auth/request-otp', { method: 'POST', body: data, skipAuth: true }),

  verifyOtp: (data: { identifier?: string; phone?: string; email?: string; code: string; purpose: 'registration' | 'login' | 'password_reset' }) =>
    apiRequest('/api/auth/verify-otp', { method: 'POST', body: data, skipAuth: true }),

  logout: () =>
    apiRequest('/api/auth/logout', { method: 'POST' }),

  deleteAccount: () =>
    apiRequest('/api/auth/account', { method: 'DELETE' }),
};

export const profileApi = {
  getProfile: () =>
    apiRequest('/api/profile', { method: 'GET' }),

  updateProfile: (data: { name?: string; email?: string }) =>
    apiRequest('/api/profile', { method: 'PUT', body: data }),
};

export const counsellorApi = {
  list: (params?: { page?: number; limit?: number; specialization?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.specialization) query.append('specialization', params.specialization);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return apiRequest(`/api/counsellors${qs ? `?${qs}` : ''}`, { method: 'GET', skipAuth: true });
  },

  getById: (id: string) =>
    apiRequest(`/api/counsellors/${id}`, { method: 'GET', skipAuth: true }),

  bookSession: (counsellorId: string, data: { sessionType: string; scheduledAt: string; durationMinutes?: number; topics?: string[] }, idempotencyKey?: string) =>
    apiRequest(`/api/counsellors/${counsellorId}/book`, { method: 'POST', body: data, idempotencyKey }),

  getMySessions: (params?: { page?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return apiRequest(`/api/counsellors/sessions${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
};

export const moodApi = {
  getHistory: (params?: { limit?: number; days?: number }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.days) query.append('days', String(params.days));
    const qs = query.toString();
    return apiRequest(`/api/mood${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  logMood: (data: { mood: 'great' | 'good' | 'okay' | 'low' | 'bad'; note?: string }) =>
    apiRequest('/api/mood', { method: 'POST', body: data }),
};

export const assessmentApi = {
  list: (category?: string) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiRequest(`/api/assessments${qs}`, { method: 'GET', skipAuth: true });
  },

  getById: (id: string) =>
    apiRequest(`/api/assessments/${id}`, { method: 'GET', skipAuth: true }),

  submit: (id: string, answers: { questionId: number; selectedOptionIndex: number }[]) =>
    apiRequest(`/api/assessments/${id}/submit`, { method: 'POST', body: { answers } }),

  getMyHistory: () =>
    apiRequest('/api/assessments/history/me', { method: 'GET' }),
};

export const blogsApi = {
  getBlogs: (params?: { page?: number; limit?: number; category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return apiRequest<{
      success: boolean;
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
      blogs: any[];
    }>(`/api/v1/blogs${qs ? `?${qs}` : ''}`, { method: 'GET', skipAuth: true });
  },

  createBlog: (data: {
    title: string;
    summary: string;
    category: string;
    content: string[];
    author?: string;
  }) => apiRequest('/api/v1/blogs', { method: 'POST', body: data }),
};

export const allyApi = {
  getConversations: () =>
    apiRequest('/api/ally/conversations', { method: 'GET', timeoutMs: 20000 }),

  startConversation: (data: { topic?: string; initialMessage?: string }) =>
    apiRequest('/api/ally/conversations', { method: 'POST', body: data, timeoutMs: 45000 }),

  getConversation: (id: string) =>
    apiRequest(`/api/ally/conversations/${id}`, { method: 'GET', timeoutMs: 20000 }),

  sendMessage: (conversationId: string, content: string) =>
    apiRequest(`/api/ally/conversations/${conversationId}/messages`, { method: 'POST', body: { content }, timeoutMs: 45000 }),
};
