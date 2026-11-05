export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    // Dynamically use the same host IP (e.g. 192.168.x.x) for mobile testing over Wi-Fi
    const hostname = window.location.hostname;
    return `http://${hostname}:5000/api/v1`;
  }
  return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let authHeader: Record<string, string> = {};
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (match && match[1]) {
      authHeader = { Authorization: `Bearer ${match[1]}` };
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...authHeader,
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // sends HTTP-only auth cookies
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Request failed with status ${response.status}`,
        errors: data.errors,
      };
    }

    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}
