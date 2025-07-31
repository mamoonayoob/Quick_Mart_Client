import axios from "axios";

// Base API URL - should be set from environment variables in production
const API_BASE_URL = "https://nextgenretail.site/quickmart/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Admin API endpoints
const adminApi = {
  // Dashboard
  getDashboardStats: () => api.get("/dashboard/stats"),
  getSalesData: (period = "monthly", year) => {
    let url = `/dashboard/sales?period=${period}`;
    if (year) url += `&year=${year}`;
    return api.get(url);
  },
  getCategorySales: () => api.get("/dashboard/category-sales"),
  getRecentOrders: (limit = 10) =>
    api.get(`/dashboard/recent-orders?limit=${limit}`),
  getTopProducts: () => api.get("/dashboard/top-products"),

  // Products
  getProducts: (params) => api.get("/admin/products", { params }),
  getProduct: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post("/admin/products", data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),

  // Users
  getUsers: (params) => api.get("/admin/users", { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post("/admin/users", data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Orders
  getOrders: (params) => api.get("/admin/orders", { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) =>
    api.patch(`/admin/orders/${id}/status`, { status }),

  // Analytics
  getAnalyticsSales: (params) => api.get("/admin/analytics/sales", { params }),
  getAnalyticsCategories: (params) =>
    api.get("/admin/analytics/categories", { params }),
  getAnalyticsCustomers: (params) =>
    api.get("/admin/analytics/customers", { params }),

  // System Health
  getSystemHealth: () => api.get("/admin/system/health"),

  // Settings
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data) => api.put("/admin/settings", data),
  updateProfile: (data) => api.put("/admin/profile", data),
  changePassword: (data) => api.put("/admin/change-password", data),
  updateNotificationSettings: (data) =>
    api.put("/admin/notification-settings", data),
};

// User API endpoints
const userApi = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  changePassword: (data) => api.put("/users/change-password", data),
};

// Product API endpoints (for user-facing features)
const productApi = {
  getProducts: (params) => api.get("/products", { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getFeaturedProducts: () => api.get("/products/featured"),
  getCategoryProducts: (category) => api.get(`/products/category/${category}`),
  searchProducts: (query) => api.get(`/products/search?q=${query}`),
};

// Cart API endpoints
const cartApi = {
  getCart: () => api.get("/cart"),
  addToCart: (productId, quantity) =>
    api.post("/cart", { productId, quantity }),
  updateCartItem: (itemId, quantity) =>
    api.put(`/cart/${itemId}`, { quantity }),
  removeFromCart: (itemId) => api.delete(`/cart/${itemId}`),
  clearCart: () => api.delete("/cart"),
};

// Order API endpoints (for user-facing features)
const orderApi = {
  createOrder: (orderData) => api.post("/orders", orderData),
  getUserOrders: () => api.get("/orders"),
  getOrderDetails: (id) => api.get(`/orders/${id}`),
};

// Wishlist API endpoints
const wishlistApi = {
  getWishlist: () => api.get("/wishlist"),
  addToWishlist: (productId) => api.post("/wishlist", { productId }),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
};

// Vendor API endpoints
const vendorApi = {
  // Authentication
  login: (credentials) => api.post("/vendor/auth/login", credentials),
  changePassword: (data) => api.put("/vendor/auth/change-password", data),

  // Dashboard
  getDashboardStats: () => api.get("/vendor/dashboard/stats"),
  getRecentOrders: () => api.get("/vendor/dashboard/recent-orders"),
  getTopProducts: () => api.get("/vendor/dashboard/top-products"),

  // Products
  getProducts: (params) => api.get("/vendor/products", { params }),
  getProduct: (id) => api.get(`/vendor/products/${id}`),
  addProduct: (data) => api.post("/vendor/products", data),
  updateProduct: (id, data) => api.put(`/vendor/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/vendor/products/${id}`),
  updateProductStatus: (id, status) =>
    api.patch(`/vendor/products/${id}/status`, { status }),
  updateProductInventory: (id, data) =>
    api.put(`/vendor/products/${id}/inventory`, data),
  uploadProductImage: (formData) =>
    api.post("/vendor/products/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  getLowStockAlerts: () => api.get("/vendor/inventory/low-stock"),

  // Orders
  getOrders: (params) => api.get("/vendor/orders", { params }),
  getOrder: (id) => api.get(`/vendor/orders/${id}`),
  updateOrderStatus: (id, status) =>
    api.patch(`/vendor/orders/${id}/status`, { status }),

  // Delivery
  getPendingDeliveries: () => api.get("/vendor/orders/pending-delivery"),
  getDeliveryPersonnel: () => api.get("/vendor/delivery-users"),
  assignDelivery: ({ orderId, deliveryPersonId, note }) =>
    api.post(`/vendor/orders/${orderId}/assign-delivery`, {
      deliveryPersonId,
      note,
    }),

  // Analytics
  getAnalytics: (params) => api.get("/vendor/analytics", { params }),
};

// Delivery API endpoints (for delivery personnel)
const deliveryApi = {
  // Task Management - matching Postman collection
  getMyTasks: () => api.get("/delivery/my-tasks"),
  getMyDeliveries: () => api.get("/delivery/my-tasks"), // Keep for backward compatibility

  // Dashboard Stats - matching Postman collection
  getDashboardStats: () => api.get("/delivery/dashboard/stats"),
  getEarnings: (
    period = "monthly",
    year = new Date().getFullYear(),
    month = new Date().getMonth() + 1
  ) =>
    api.get(
      `/delivery/dashboard/earnings?period=${period}&year=${year}&month=${month}`
    ),

  // Task Actions - matching Postman collection
  acceptTask: (taskId) => api.put(`/delivery/tasks/${taskId}/accept`),
  rejectTask: (taskId, reason) =>
    api.put(`/delivery/tasks/${taskId}/reject`, { reason }),
  startTask: (taskId) => api.put(`/delivery/tasks/${taskId}/start`),
  updateTaskLocation: (taskId, location) =>
    api.put(`/delivery/tasks/${taskId}/location`, location),
  completeTask: (taskId, data) =>
    api.put(`/delivery/tasks/${taskId}/complete`, data),
  cancelTask: (taskId, reason) =>
    api.put(`/delivery/tasks/${taskId}/cancel`, { reason }),
  markUnableToDeliver: (taskId, reason) =>
    api.put(`/delivery/tasks/${taskId}/unable-to-deliver`, { reason }),

  // Get all delivered orders (for stats matching)
  getAllDeliveredOrders: () => api.get("/delivery/all-delivered-orders"),

  // Legacy endpoints for backward compatibility
  updateDeliveryStatus: (deliveryId, status) =>
    api.put(`/delivery/tasks/${deliveryId}/status`, { status }),
  getDeliveryDetails: (deliveryId) => api.get(`/delivery/tasks/${deliveryId}`),
  updateLocation: (deliveryId, location) =>
    api.put(`/delivery/tasks/${deliveryId}/location`, location),
};

export {
  api as default,
  adminApi,
  userApi,
  productApi,
  cartApi,
  orderApi,
  wishlistApi,
  vendorApi,
  deliveryApi,
};
