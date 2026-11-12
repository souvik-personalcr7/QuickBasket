export const getApiBaseUrl = (): string => {
  // If explicitly configured in environment, check if it's safe to use
  if (process.env.NEXT_PUBLIC_API_URL) {
    if (typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:';
      // If deployed over HTTPS (like Vercel), don't allow insecure HTTP port 5000
      if (isHttps && process.env.NEXT_PUBLIC_API_URL.startsWith('http://')) {
        return '/api';
      }
    }
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    // In any browser environment (Vercel, mobile, or localhost), use relative '/api'
    // This talks directly to the Next.js serverless API routes connected to MongoDB Atlas
    return '/api';
  }

  return 'http://localhost:3000/api';
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
