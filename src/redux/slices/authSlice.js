import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginUser as loginUserApi,
  registerUser as registerUserApi,
  getUserProfile,
} from "../../helpers/apiHelpers";

// Get user data from localStorage
const getUserFromStorage = () => {
  const userString = localStorage.getItem("user");
  if (!userString) return null;
  try {
    return JSON.parse(userString);
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
    localStorage.removeItem("user"); // Clear invalid data
    return null;
  }
};

// Get token from localStorage
const getTokenFromStorage = () => {
  return localStorage.getItem("token") || null;
};

// Login user async thunk
export const loginUser = createAsyncThunk(
  "auth/login",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await loginUserApi(userData);

      // Store token and user data in localStorage only if we have valid data
      if (response && response.token && response.user) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        console.log("User authenticated:", response.user.role);
      } else {
        console.error("Invalid response format from login API", response);
        return rejectWithValue(
          "Invalid response from server. Please try again."
        );
      }

      return response;
    } catch (error) {
      console.error("Login error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    }
  }
);

// Register user async thunk
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await registerUserApi(userData);

      // Store token and user data in localStorage only if we have valid data
      if (response && response.token && response.user) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        console.log("User registered:", response.user);
      } else {
        console.error("Invalid response format from register API", response);
        return rejectWithValue(
          "Invalid response from server. Please try again."
        );
      }

      return response;
    } catch (error) {
      console.error("Registration error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    }
  }
);

// Get user profile async thunk
export const fetchUserProfile = createAsyncThunk(
  "auth/profile",
  async (_, { rejectWithValue, getState }) => {
    try {
      // Only proceed if we have a token
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const response = await getUserProfile();

      // Update user data in localStorage only if we have valid user data
      if (response && response.data && response.success) {
        localStorage.setItem("user", JSON.stringify(response.data));
        return response;
      } else {
        console.error("Invalid user data in profile response", response);
        return rejectWithValue("Invalid user data received from server");
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      if (error.response?.status === 401) {
        // Token expired or invalid, logout the user
        return rejectWithValue("Session expired. Please login again.");
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile"
      );
    }
  }
);

// Initial state
const initialState = {
  user: getUserFromStorage(),
  token: getTokenFromStorage(),
  role: getUserFromStorage()?.role || "customer", // Default role is customer
  isAuthenticated: !!getTokenFromStorage(),
  loading: false,
  error: null,
};

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Reset state
      state.user = null;
      state.token = null;
      state.role = "customer";
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;

        // Ensure role is properly set and logged
        const userRole = action.payload.user.role || "customer";
        state.role = userRole;
        state.isAuthenticated = true;

        // Log role assignment for debugging
        console.log(
          `Auth: Login successful - Role set to '${userRole}'`,
          action.payload.user
        );

        // Ensure localStorage is updated with the correct role
        try {
          // Update user in localStorage to ensure role persistence
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          const updatedUser = { ...storedUser, ...action.payload.user };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          console.log(
            "Auth: Updated localStorage user data with role:",
            updatedUser.role
          );
        } catch (error) {
          console.error("Auth: Error updating localStorage user data:", error);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role || "customer";
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Profile cases
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload?.user;
        state.role = action.payload?.user?.role || "customer";
        // Don't update token or isAuthenticated as they should already be set
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // If we get a 401 error, the token is invalid, so logout
        if (action.payload === "Session expired. Please login again.") {
          state.user = null;
          state.token = null;
          state.role = "customer";
          state.isAuthenticated = false;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
