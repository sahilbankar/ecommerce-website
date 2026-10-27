import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../constants';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For HTTP-only cookies like refresh token
});

// Cache & in-flight deduplication store for idempotent GET requests
interface CacheEntry {
  data: any;
  status: number;
  statusText: string;
  headers: any;
  config: any;
  timestamp: number;
}

const apiCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export const clearApiCache = () => {
  apiCache.clear();
};

const getCacheKey = (config: any): string => {
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${config.method || 'get'}:${config.url || ''}:${params}`;
};

// Custom wrapper for deduplicated & cached GET requests
const originalGet = api.get.bind(api);
api.get = function <T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>
): Promise<R> {
  // Only cache and deduplicate public read endpoints like /products, /categories, /coupons
  const isCachable =
    url.startsWith('/products') ||
    url.startsWith('/categories') ||
    url.startsWith('/coupons/active');

  if (!isCachable) {
    return originalGet(url, config);
  }

  const key = getCacheKey({ method: 'get', url, params: config?.params });

  // 1. Return fresh cached response if available
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return Promise.resolve({
      data: cached.data,
      status: cached.status,
      statusText: cached.statusText,
      headers: cached.headers,
      config: cached.config,
    } as unknown as R);
  }

  // 2. Return in-flight request if another identical request is already active
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<R>;
  }

  // 3. Dispatch fresh request and share in-flight promise
  const requestPromise = originalGet<T, R, D>(url, config)
    .then((response) => {
      const resp = response as unknown as AxiosResponse;
      apiCache.set(key, {
        data: resp.data,
        status: resp.status,
        statusText: resp.statusText,
        headers: resp.headers,
        config: resp.config,
        timestamp: Date.now(),
      });
      inFlightRequests.delete(key);
      return response;
    })
    .catch((err) => {
      inFlightRequests.delete(key);
      throw err;
    });

  inFlightRequests.set(key, requestPromise);
  return requestPromise;
};

// Request Interceptor: Attach access token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle auth token refresh / expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is due to expired access token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // In a real application, call the refresh token endpoint
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const accessToken = response.data?.data?.accessToken || response.data?.accessToken;
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear token and redirect or dispatch logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
