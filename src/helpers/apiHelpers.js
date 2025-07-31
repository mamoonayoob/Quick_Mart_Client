import axios from "axios";

const BASE_URL = "https://nextgenretail.site/quickmart/api/";

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to request headers if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Token attached to request:", token.substring(0, 15) + "...");
    } else {
      console.log("No token available for request");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error(
      `Error response from ${error.config?.url}:`,
      error.response?.status,
      error.response?.data
    );
    return Promise.reject(error);
  }
);

// Generic API request methods
export const apiGet = async (url) => {
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error(`GET request to ${url} failed:`, error.message);
    throw error;
  }
};

export const apiPost = async (url, data) => {
  try {
    const response = await api.post(url, data);
    return response.data;
  } catch (error) {
    console.error(`POST request to ${url} failed:`, error.message);
    throw error;
  }
};

export const apiPut = async (url, data) => {
  try {
    const response = await api.put(url, data);
    return response.data;
  } catch (error) {
    console.error(`PUT request to ${url} failed:`, error.message);
    throw error;
  }
};

export const apiDelete = async (url) => {
  try {
    const response = await api.delete(url);
    return response.data;
  } catch (error) {
    console.error(`DELETE request to ${url} failed:`, error.message);
    throw error;
  }
};

// Form data API request methods for file uploads
export const apiPostFormData = async (url, formData) => {
  try {
    const response = await api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`POST form data to ${url} failed:`, error.message);
    throw error;
  }
};

export const apiPutFormData = async (url, formData) => {
  try {
    const response = await api.put(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`PUT form data to ${url} failed:`, error.message);
    throw error;
  }
};

// ==================== AUTHENTICATION API FUNCTIONS ====================

/**
 * Register a new user
 * @param {Object} userData - User data including name, email, password, phone
 * @returns {Promise} - Response with user data and token
 */
export const registerUser = async (userData) => {
  return apiPost("auth/register", userData);
};

/**
 * Login user
 * @param {Object} credentials - Login credentials (email, password)
 * @returns {Promise} - Response with user data and token
 */
export const loginUser = async (credentials) => {
  return apiPost("auth/login", credentials);
};

/**
 * Get current user profile
 * @returns {Promise} - Response with user profile data
 */
export const getUserProfile = async () => {
  return apiGet("auth/profile");
};

/**
 * Update user profile with form data (for file uploads)
 * @param {FormData} formData - Form data with user profile updates including files
 * @returns {Promise} - Response with updated user data
 */
export const updateUserProfileWithFile = async (formData) => {
  return apiPutFormData("auth/profile", formData);
};

/**
 * Update user profile with JSON data (no file uploads)
 * @param {Object} profileData - JSON data with user profile updates
 * @returns {Promise} - Response with updated user data
 */
export const updateUserProfile = async (profileData) => {
  return apiPut("auth/profile", profileData);
};

/**
 * Change user password
 * @param {Object} passwordData - Object containing currentPassword and newPassword
 * @returns {Promise} - Response with success message
 */
export const changePassword = async (passwordData) => {
  return apiPut("auth/password", passwordData);
};

// ==================== PRODUCTS API FUNCTIONS ====================

/**
 * Get all products with pagination support
 * @param {Object} params - Query parameters including page, limit, sort, etc.
 * @returns {Promise} - Response with products array and pagination info
 */
export const getAllProducts = async (params = {}) => {
  // If no limit is specified, use a large number to get all products
  // or set a reasonable default that's larger than 10
  if (!params.limit) {
    params.limit = 100; // Get up to 100 products by default instead of 10
  }
  return apiGet("products", { params });
};

/**
 * Get product by ID
 * @param {string} productId - Product ID
 * @returns {Promise} - Response with product data
 */
export const getProductById = async (productId) => {
  return apiGet(`products/${productId}`);
};

/**
 * Create a new product (Vendor only)
 * @param {FormData} formData - Form data with product details and images
 * @returns {Promise} - Response with created product data
 */
export const createProduct = async (formData) => {
  return apiPostFormData("products", formData);
};

/**
 * Update a product (Vendor only)
 * @param {string} productId - Product ID
 * @param {FormData} formData - Form data with product updates
 * @returns {Promise} - Response with updated product data
 */
export const updateProduct = async (productId, formData) => {
  return apiPutFormData(`products/${productId}`, formData);
};

/**
 * Delete a product (Vendor only)
 * @param {string} productId - Product ID
 * @returns {Promise} - Response with success message
 */
export const deleteProduct = async (productId) => {
  return apiDelete(`products/${productId}`);
};

/**
 * Add a review to a product
 * @param {string} productId - Product ID
 * @param {Object} reviewData - Review data including rating and comment
 * @returns {Promise} - Response with updated product including new review
 */
export const addProductReview = async (productId, reviewData) => {
  return apiPost(`products/${productId}/reviews`, reviewData);
};

/**
 * Get products by category
 * @param {string} category - Category name
 * @returns {Promise} - Response with products array
 */
export const getProductsByCategory = async (category) => {
  return apiGet(`products/category/${category}`);
};

/**
 * Search products
 * @param {string} query - Search query
 * @returns {Promise} - Response with products array
 */
export const searchProducts = async (query) => {
  return apiGet(`products/search?q=${query}`);
};

/**
 * Cart API Functions
 */

/**
 * Add a product to cart
 * @param {Object} cartData - Cart data including productId and quantity
 * @returns {Promise} - Response with updated cart
 */
export const addToCart = async (cartData) => {
  return apiPost("users/cart", cartData);
};

/**
 * Get user's cart
 * @returns {Promise} - Response with cart items
 */
export const getCart = async () => {
  return apiGet("users/cart");
};

/**
 * Update cart item quantity
 * @param {string} productId - Product ID in cart
 * @param {number} quantity - New quantity
 * @returns {Promise} - Response with updated cart
 */
export const updateCartItem = async (productId, quantity) => {
  return apiPut(`users/cart/${productId}`, { quantity });
};

/**
 * Remove item from cart
 * @param {string} productId - Product ID in cart
 * @returns {Promise} - Response with updated cart
 */
export const removeFromCart = async (productId) => {
  return apiDelete(`users/cart/${productId}`);
};

/**
 * Clear the entire cart
 * @returns {Promise} - Response with success message
 */
export const clearCart = async () => {
  return apiDelete("users/cart");
};

/**
 * Notifications API Functions
 */

/**
 * Get user notifications
 * @returns {Promise} - Response with notifications
 */
export const getNotifications = async () => {
  return apiGet("users/notifications");
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise} - Response with updated notification
 */
export const markNotificationAsRead = async (notificationId) => {
  return apiPut(`users/notifications/${notificationId}/read`);
};

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise} - Response with success message
 */
export const deleteNotification = async (notificationId) => {
  return apiDelete(`users/notifications/${notificationId}`);
};

/**
 * Wishlist API Functions
 */

/**
 * Get user's wishlist
 * @returns {Promise} - Response with wishlist items
 */
export const getWishlist = async () => {
  return apiGet("users/wishlist");
};

/**
 * Add product to wishlist
 * @param {Object} wishlistData - Wishlist data including productId
 * @returns {Promise} - Response with updated wishlist
 */
export const addToWishlist = async (productId) => {
  return await apiPost("/users/wishlist", { productId });
};

/**
 * Remove product from wishlist
 * @param {string} productId - Product ID
 * @returns {Promise} - Response with updated wishlist
 */
export const removeFromWishlist = async (productId) => {
  return await apiDelete(`/users/wishlist/${productId}`);
};

// Orders API Helpers

/**
 * Get all orders for current user
 * @returns {Promise} - Response with orders
 */
export const getOrders = async () => {
  return apiGet("orders");
};

/**
 * Get order details by ID
 * @param {string} orderId - Order ID
 * @returns {Promise} - Response with order details
 */
export const getOrderById = async (orderId) => {
  return apiGet(`orders/${orderId}`);
};

/**
 * Get order history with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise} - Response with paginated order history
 */
export const getOrderHistory = async (page = 1, limit = 10) => {
  return apiGet(`orders/history?page=${page}&limit=${limit}`);
};

/**
 * Create a new order
 * @param {Object} orderData - Order data including items, shipping address, delivery location, payment method
 * @returns {Promise} - Response with created order
 */
export const createOrder = async (orderData) => {
  // Determine the endpoint based on payment method
  let endpoint = "orders";

  // If it's a card payment and we have a payment method ID, use the card payment endpoint
  if (orderData.paymentMethod === "card" && orderData.paymentMethodId) {
    endpoint = "orders/card-payment";
  } else if (orderData.paymentMethod === "wallet") {
    endpoint = "orders/wallet-payment";
  }

  return apiPost(endpoint, orderData);
};

/**
 * Update order status (vendor/admin only)
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @returns {Promise} - Response with updated order
 */
export const updateOrderStatus = async (orderId, status) => {
  return apiPut(`orders/${orderId}/status`, { status });
};

/**
 * Update payment status for an order (admin only)
 * @param {string} orderId - Order ID
 * @param {Object} paymentData - Payment data including paymentId and status
 * @returns {Promise} - Response with updated payment
 */
export const updatePaymentStatus = async (orderId, paymentData) => {
  return apiPut(`orders/${orderId}/payment`, paymentData);
};

/**
 * Update order payment information after successful payment
 * @param {string} orderId - Order ID
 * @param {Object} paymentData - Payment data including paymentId and status
 * @returns {Promise} - Response with updated order
 */
export const updateOrderPayment = async (orderId, paymentData) => {
  return apiPut(`orders/${orderId}/payment-update`, paymentData);
};

/**
 * Payment API Functions
 */

/**
 * Create a payment intent for Stripe
 * @param {Object} paymentData - Payment data including amount, currency, and orderId
 * @returns {Promise} - Response with client secret
 */
export const createPaymentIntent = async (paymentData) => {
  return apiPost("payment/create-payment-intent", paymentData);
};

/**
 * Get available payment methods
 * @returns {Promise} - Response with payment methods
 */
export const getPaymentMethods = async () => {
  return apiGet("payment/methods");
};

/**
 * Send user message to chatbot and get bot response
 * @param {string} userMessage - The message from the user
 * @returns {Promise} - Response with bot reply
 */
export const getChatbotResponse = async (userMessage) => {
  try {
    const response = await apiPost("chat", { message: userMessage }); // endpoint: /api/chat
    return response.response || "Sorry, I didn't get that.";
  } catch (error) {
    console.error("Chatbot API error:", error.message);
    return "Server error while getting chatbot response.";
  }
};
// export const getChatbotResponse = async (message) => {
//   try {
//     const response = await axios.post("chat", { message });
//     console.log("abc", message);
//     return response.data;
//   } catch (error) {
//     console.error("Chatbot API error:", error);
//     throw error;
//   }
// };

export default api;
