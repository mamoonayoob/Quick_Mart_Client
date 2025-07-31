import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL || "https://nextgenretail.site/quickmart/api";

// Get token from local storage
export const getToken = () => localStorage.getItem("token");

// Set token in local storage
const setToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};

// Get current user from local storage
const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  }
  return null;
};

// Set current user in local storage
const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }
};

// Login user
const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });
  if (response.data.token) {
    setToken(response.data.token);
    setCurrentUser(response.data.user);
  }
  return response.data;
};

// Register user
const register = async (userData) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  return response.data;
};

// Logout user
const logout = () => {
  setToken(null);
  setCurrentUser(null);
};

// Get auth header
const getAuthHeader = () => {
  const token = getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// Check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp < Date.now() / 1000;
  } catch (error) {
    return true;
  }
};

// Refresh token if needed
const refreshTokenIfNeeded = async () => {
  const token = getToken();
  if (token && isTokenExpired(token)) {
    try {
      const response = await axios.post(
        `${API_URL}/auth/refresh-token`,
        {},
        {
          headers: getAuthHeader(),
        }
      );
      setToken(response.data.token);
      return response.data.token;
    } catch (error) {
      logout();
      throw new Error("Session expired. Please login again.");
    }
  }
  return token;
};

const authService = {
  login,
  register,
  logout,
  getToken,
  setToken,
  getCurrentUser,
  setCurrentUser,
  getAuthHeader,
  isTokenExpired,
  refreshTokenIfNeeded,
};

export default authService;
