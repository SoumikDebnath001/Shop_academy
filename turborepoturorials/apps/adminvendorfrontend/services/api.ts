// Admin panel API client. Talks to the backend's /api/v1/admin surface.
// Admins are signed in with an HttpOnly admin session cookie, so every request
// goes out with credentials: 'include' and no token is kept in the browser.

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:2556';
const API_BASE_URL = `${BACKEND_URL}/api/v1/admin`;

export type ApiError = Error & { restart?: boolean; credentials?: unknown };

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok || data.status === false) {
    const error = new Error(data.message || data.error || 'API request failed') as ApiError;
    error.restart = data.restart === true;
    error.credentials = data.credentials;
    throw error;
  }
  return data.data !== undefined ? data.data : data;
};

const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  });
  return handleResponse(response);
};

// Multipart uploads must not set Content-Type - the browser adds the boundary.
const fetchAPIFormData = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...options.headers },
    credentials: 'include',
  });
  return handleResponse(response);
};

type ListParams = { status?: string; search?: string; page?: number; limit?: number };

const toQuery = (paramsObj: ListParams = {}) => {
  const params = new URLSearchParams();
  Object.entries(paramsObj).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.append(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const api = {
  // Auth - password, then email OTP, then Google Authenticator
  login: (email: string, password: string) =>
    fetchAPI('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  verifyOtp: (otp: string) =>
    fetchAPI('/login/verify-otp', { method: 'POST', body: JSON.stringify({ otp }) }),
  totpSetup: () => fetchAPI('/login/totp-setup'),
  verifyTotp: (code: string) =>
    fetchAPI('/login/verify-totp', { method: 'POST', body: JSON.stringify({ code }) }),
  logout: () => fetchAPI('/logout', { method: 'POST' }),
  me: () => fetchAPI('/me'),
  getProfile: () => fetchAPI('/profile'),
  updateProfile: (adminData: Record<string, unknown>) =>
    fetchAPI('/profile', { method: 'PUT', body: JSON.stringify(adminData) }),

  // Dashboard
  getDashboardStats: () => fetchAPI('/dashboard'),

  // Categories
  getCategories: () => fetchAPI('/category'),
  getCategoryById: (id: string) => fetchAPI(`/category/${id}`),
  createCategory: (formData: FormData) =>
    fetchAPIFormData('/category', { method: 'POST', body: formData }),
  updateCategory: (id: string, formData: FormData) =>
    fetchAPIFormData(`/category/${id}`, { method: 'PUT', body: formData }),
  deleteCategory: (id: string) => fetchAPI(`/category/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (paramsObj?: ListParams) => fetchAPI(`/product${toQuery(paramsObj)}`),
  getProductById: (id: string) => fetchAPI(`/product/${id}`),
  createProduct: (formData: FormData) =>
    fetchAPIFormData('/product', { method: 'POST', body: formData }),
  updateProduct: (id: string, formData: FormData) =>
    fetchAPIFormData(`/product/${id}`, { method: 'PUT', body: formData }),
  deleteProduct: (id: string) => fetchAPI(`/product/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (paramsObj?: ListParams) => fetchAPI(`/order${toQuery(paramsObj)}`),
  getOrderById: (id: string) => fetchAPI(`/order/${id}`),
  updateOrderStatus: (id: string, statusData: Record<string, unknown>) =>
    fetchAPI(`/order/${id}/status`, { method: 'PUT', body: JSON.stringify(statusData) }),
};

export const BACKEND_ORIGIN = BACKEND_URL;
