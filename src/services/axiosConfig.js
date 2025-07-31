import axios from "axios";
import { getToken, refreshTokenIfNeeded, isTokenExpired } from "./authService";

const API_URL =
  process.env.REACT_APP_API_URL || "https://nextgenretail.site/quickmart/api";

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get the token
    let token = getToken();

    // Check if token exists and is expired
    if (token && isTokenExpired(token)) {
      try {
        // Try to refresh the token
        token = await refreshTokenIfNeeded();
      } catch (error) {
        console.error("Failed to refresh token:", error);
        // Token refresh failed, but we'll continue with the request
        // The server will return 401 if the token is invalid
      }
    }

    // If we have a token, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an expired token (401) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const token = await refreshTokenIfNeeded();

        // If we got a new token, update the request and retry
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Redirect to login page or dispatch logout action if needed
        // This would typically be handled by your auth context
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
