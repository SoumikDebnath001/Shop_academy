const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:2556';
const API_BASE_URL = `${BACKEND_URL}/api/v1`;
const AUTH_BASE_URL = `${BACKEND_URL}/auth`;

// Redirect target that starts the Google OAuth flow on the backend
export const GOOGLE_LOGIN_URL = `${AUTH_BASE_URL}/google`;

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok || data.status === false) {
    const error: any = new Error(data.message || data.error || 'API request failed');
    error.restart = data.restart === true;
    error.credentials = data.credentials;
    throw error;
  }
  return data.data !== undefined ? data.data : data;
};

// Store users are signed in with the Google login cookie, admins with the admin session cookie.
// Both cookies are HttpOnly, so no token is kept in the browser storage.
const fetchAPIFormData = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...options.headers },
    credentials: 'include',
  });
  return handleResponse(response);
};

const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  return handleResponse(response);
};

export const api = {
  // Browse
  getCategories: () => fetchAPI('/user/category'),
  getProducts: (paramsObj?: { category?: string, search?: string, type?: string, page?: number, limit?: number }) => {
    const params = new URLSearchParams();
    if (paramsObj?.category && paramsObj.category !== 'all') params.append('category', paramsObj.category);
    if (paramsObj?.search) params.append('search', paramsObj.search);
    if (paramsObj?.type && paramsObj.type !== 'all') params.append('type', paramsObj.type);
    if (paramsObj?.page) params.append('page', paramsObj.page.toString());
    if (paramsObj?.limit) params.append('limit', paramsObj.limit.toString());
    return fetchAPI(`/user/product?${params.toString()}`);
  },
  getProductById: (id: string) => fetchAPI(`/user/product/${id}`),
  getCategoryById: (id: string) => fetchAPI(`/user/category/${id}`),

  // Cart
  getCart: () => fetchAPI('/user/cart'),

  // Admin Inventory - Products
  createProduct: (formData: FormData) => 
    fetchAPIFormData('/admin/product', {
      method: 'POST',
      body: formData,
    }),
  updateProduct: (id: string, formData: FormData) => 
    fetchAPIFormData(`/admin/product/${id}`, {
      method: 'PUT',
      body: formData,
    }),
  deleteProduct: (id: string) => 
    fetchAPI(`/admin/product/${id}`, {
      method: 'DELETE',
    }),

  // Admin Inventory - Categories
  createCategory: (formData: FormData) => 
    fetchAPIFormData('/admin/category', {
      method: 'POST',
      body: formData,
    }),
  updateCategory: (id: string, formData: FormData) => 
    fetchAPIFormData(`/admin/category/${id}`, {
      method: 'PUT',
      body: formData,
    }),
  deleteCategory: (id: string) => 
    fetchAPI(`/admin/category/${id}`, {
      method: 'DELETE',
    }),

  addToCart: (productId: string, quantity: number, size?: string, color?: string) => 
    fetchAPI('/user/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, size, color }),
    }),
  updateCartItem: (itemId: string, quantity: number) =>
    fetchAPI(`/user/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  removeFromCart: (itemId: string) => fetchAPI(`/user/cart/${itemId}`, { method: 'DELETE' }),
  clearCart: () => fetchAPI('/user/cart', { method: 'DELETE' }),

  // Admin Dashboard
  getDashboardStats: () => fetchAPI('/admin/dashboard'),

  // Admin Orders
  getAdminOrders: (paramsObj?: { status?: string, search?: string, page?: number, limit?: number }) => {
    const params = new URLSearchParams();
    if (paramsObj?.status) params.append('status', paramsObj.status);
    if (paramsObj?.search) params.append('search', paramsObj.search);
    if (paramsObj?.page) params.append('page', paramsObj.page.toString());
    if (paramsObj?.limit) params.append('limit', paramsObj.limit.toString());
    return fetchAPI(`/admin/order?${params.toString()}`);
  },
  getAdminOrderById: (id: string) => fetchAPI(`/admin/order/${id}`),
  updateOrderStatus: (id: string, statusData: any) =>
    fetchAPI(`/admin/order/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    }),

  // Auth (Google login, cookie based)
  getMe: async () => {
    const response = await fetch(`${AUTH_BASE_URL}/me`, { credentials: 'include' });
    return response.json();
  },
  logout: () =>
    fetch(`${AUTH_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    }),

  // Admin Auth (password -> email OTP -> Google Authenticator)
  adminLogin: (email: string, password: string) =>
    fetchAPI('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  adminVerifyOtp: (otp: string) =>
    fetchAPI('/admin/login/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    }),
  adminTotpSetup: () => fetchAPI('/admin/login/totp-setup'),
  adminVerifyTotp: (code: string) =>
    fetchAPI('/admin/login/verify-totp', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  adminMe: () => fetchAPI('/admin/me'),
  adminLogout: () => fetchAPI('/admin/logout', { method: 'POST' }),
  adminRegister: (adminData: any) =>
    fetchAPI('/admin/register', {
      method: 'POST',
      body: JSON.stringify(adminData),
    }),
  getAdminProfile: () => fetchAPI('/admin/profile'),
  updateAdminProfile: (adminData: any) =>
    fetchAPI('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(adminData),
    }),

  // User Profile
  getProfile: () => fetchAPI('/user/profile'),
  updateProfile: (userData: any) =>
    fetchAPI('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  deleteAccount: () => {
    return fetchAPI('/user/profile', {
      method: 'DELETE',
    });
  },
  
  // Order
  placeOrder: (orderData: any) =>
    fetchAPI('/user/order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
    
  // Address
  getAddresses: () => fetchAPI('/user/address'),
  getAddressById: (id: string) => fetchAPI(`/user/address/${id}`),
  createAddress: (addressData: any) => fetchAPI('/user/address', { method: 'POST', body: JSON.stringify(addressData) }),
  updateAddress: (id: string, addressData: any) => fetchAPI(`/user/address/${id}`, { method: 'PUT', body: JSON.stringify(addressData) }),
  deleteAddress: (id: string) => fetchAPI(`/user/address/${id}`, { method: 'DELETE' }),
  setDefaultAddress: (id: string) => fetchAPI(`/user/address/${id}/default`, { method: 'PUT' }),

  // Orders
  getOrders: () => fetchAPI('/user/order'),
  getOrderById: (id: string) => fetchAPI(`/user/order/${id}`),
  cancelOrder: (id: string, reason?: string) =>
    fetchAPI(`/user/order/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),

  // Payments
  createPayment: (paymentData: any) =>
    fetchAPI('/user/payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  getPayments: () => fetchAPI('/user/payment'),
  getPaymentById: (id: string) => fetchAPI(`/user/payment/${id}`),
};
