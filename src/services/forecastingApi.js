import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://nextgenretail.site/quickmart/api";

// Create axios instance with default config
const forecastingApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
forecastingApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
forecastingApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Forecasting API methods
export const forecastingService = {
  // Get forecast for a specific product
  getProductForecast: async (productId, days = 30) => {
    try {
      const response = await forecastingApi.get(
        `/forecast/product/${productId}?days=${days}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching product forecast:", error);
      throw error;
    }
  },

  // Get forecast for all vendor products (vendor ID extracted from JWT token)
  getVendorForecast: async (days = 30) => {
    try {
      const response = await forecastingApi.get(
        `/forecast/vendor?days=${days}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching vendor forecast:", error);
      throw error;
    }
  },

  // Get top predicted products (Admin only)
  getTopPredictedProducts: async (days = 30, limit = 10) => {
    try {
      const response = await forecastingApi.get(
        `/forecast/top-products?days=${days}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching top predicted products:", error);
      throw error;
    }
  },
};

export default forecastingService;
