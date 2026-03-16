// frontend/src/services/apiClient.ts
// HTTP client for backend Express endpoints. Auto-attaches Supabase JWT.

import { supabase } from '../config/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message: string;
  error: string | null;
  status: number;
}

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function request<T = any>(method: string, path: string, body?: any): Promise<ApiResponse<T>> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, data: null, message: 'Not authenticated', error: 'No session found. Please log in.', status: 401 };
  }

  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    };
    if (body && method !== 'GET') options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const json = await response.json();

    return {
      success: json.success ?? response.ok,
      data: json.data ?? null,
      message: json.message ?? '',
      error: json.success === false ? (json.message || 'Request failed') : null,
      status: response.status,
    };
  } catch (err: any) {
    return { success: false, data: null, message: '', error: err.message || 'Network error.', status: 0 };
  }
}

const apiClient = {
  get: <T = any>(path: string) => request<T>('GET', path),
  post: <T = any>(path: string, body?: any) => request<T>('POST', path, body),
  put: <T = any>(path: string, body?: any) => request<T>('PUT', path, body),
  patch: <T = any>(path: string, body?: any) => request<T>('PATCH', path, body),
  delete: <T = any>(path: string) => request<T>('DELETE', path),
};

export default apiClient;