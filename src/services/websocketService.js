/* eslint-disable import/no-anonymous-default-export */
/**
 * Socket.IO Service for real-time messaging
 * This service handles Socket.IO connections and message handling
 */
import io from "socket.io-client";

/**
 * Decode JWT token to extract payload
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
const decodeJwt = (token) => {
  if (!token) return null;

  try {
    // JWT token consists of three parts separated by dots
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // The payload is the second part, base64 encoded
    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding JWT token:", error);
    return null;
  }
};

let socket = null;
let reconnectTimer = null;
let RECONNECT_DELAY = 3000; // 3 seconds initial delay
const MAX_RECONNECT_DELAY = 30000; // 30 seconds maximum delay
// const RECONNECT_FACTOR = 1.5; // Exponential backoff factor
// let reconnectAttempts = 0; // Track number of reconnect attempts
const listeners = new Map();

/**
 * Initialize Socket.IO connection
 * @param {string} userId - User ID for authentication
 * @param {string} token - JWT token for authentication
 * @returns {Socket} - Socket.IO instance
 */
const initializeSocketIO = (userId, token) => {
  try {
    // Extract userId from token if we have a token but no userId
    if (!userId && token) {
      const decodedToken = decodeJwt(token);
      if (decodedToken && decodedToken.id) {
        userId = decodedToken.id;
        console.log("Extracted userId from token:", userId);
      }
    }

    // If we still don't have a userId, try to get it from localStorage
    if (!userId) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          userId = userObj.id || userObj._id;
          console.log("Using userId from localStorage:", userId);
        } catch (err) {
          console.error("Error parsing user from localStorage:", err);
        }
      }
    }

    // If we still don't have a userId and no token, use anonymous
    // But if we have a token, we should never use anonymous
    if (!userId && !token) {
      userId = "anonymous";
      console.log("Using anonymous userId as fallback");
    }

    // Get the API URL from environment variables
    const apiUrl =
      process.env.REACT_APP_API_URL ||
      "https://nextgenretail.site/quickmart/api";

    // Determine Socket.IO server URL
    let socketUrl;

    // Check if we're in development or production
    if (process.env.NODE_ENV === "development") {
      // In development, use explicit localhost Socket.IO URL
      socketUrl = "https://nextgenretail.site/quickmart/";
    } else {
      // In production, derive from API URL
      socketUrl = apiUrl;
    }

    console.log("Attempting Socket.IO connection to:", socketUrl);

    // Close any existing socket before creating a new one
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    // Create new Socket.IO connection with authentication data
    socket = io("https://nextgenretail.site/quickmart/", {
      query: { userId, token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionDelayMax: MAX_RECONNECT_DELAY,
      randomizationFactor: 0.5,
      timeout: 10000, // 10 seconds connection timeout
      autoConnect: true,
    });

    // Set up event handlers
    socket.on("connect", () => {
      console.log("Socket.IO connection established with ID:", socket.id);

      // Reset reconnect attempts on successful connection
      // reconnectAttempts = 0;

      // Reset reconnect delay
      RECONNECT_DELAY = 3000;

      // Notify listeners of successful connection
      notifyListeners("connection", { status: "connected" });

      // Authenticate with the server
      socket.emit("authenticate", { userId, token });
    });

    socket.on("authenticated", (data) => {
      console.log("Socket authenticated:", data);
      notifyListeners("authenticated", data);
    });

    socket.on("new_message", (data) => {
      console.log("New message received:", data);
      notifyListeners("message", data);
    });

    socket.on("unread_count", (data) => {
      console.log("Unread count updated:", data);
      notifyListeners("unread_count", data);
    });

    socket.on("error", (error) => {
      console.error("Socket.IO error:", error);
      notifyListeners("error", { error });
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);
      notifyListeners("connection", {
        status: "disconnected",
        reason: reason,
      });
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`Socket.IO reconnected after ${attemptNumber} attempts`);
      // reconnectAttempts = attemptNumber;
      notifyListeners("connection", { status: "connected" });

      // Re-authenticate after reconnection
      socket.emit("authenticate", { userId, token });
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      // reconnectAttempts = attemptNumber;
      console.log(`Socket.IO reconnect attempt ${attemptNumber}`);
      notifyListeners("connection", {
        status: "reconnecting",
        attempt: attemptNumber,
      });
    });

    socket.on("reconnect_failed", () => {
      console.log("Socket.IO reconnection failed after all attempts");
      notifyListeners("connection", {
        status: "reconnect_failed",
        message: "Maximum reconnection attempts reached.",
      });
    });

    return socket;
  } catch (error) {
    console.error("Error in initializeSocketIO:", error);
    return null;
  }
};

/**
 * Connect to Socket.IO server
 * @param {string} userId - User ID for authentication
 * @param {string} token - JWT token for authentication
 */
const connect = (userId, token) => {
  socket = initializeSocketIO(userId, token);
};

/**
 * Disconnect from Socket.IO server
 */
const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  // Clear reconnect timer if it exists
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

/**
 * Send message through Socket.IO
 * @param {Object} data - Message data
 */
const sendMessage = (data) => {
  if (socket && socket.connected) {
    // Use the 'send_message' event as defined in the backend
    socket.emit("send_message", data);
  } else {
    console.error("Socket.IO not connected. Cannot send message.");
  }
};

/**
 * Add event listener for Socket.IO events
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 */
const addEventListener = (event, callback) => {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);
};

/**
 * Remove event listener for Socket.IO events
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 */
const removeEventListener = (event, callback) => {
  if (listeners.has(event)) {
    listeners.get(event).delete(callback);
  }
};

/**
 * Notify all listeners of an event
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const notifyListeners = (event, data) => {
  if (listeners.has(event)) {
    listeners.get(event).forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Also notify 'all' listeners
  if (listeners.has("all")) {
    listeners.get("all").forEach((callback) => {
      try {
        callback({ event, data });
      } catch (error) {
        console.error(`Error in 'all' event listener:`, error);
      }
    });
  }
};

/**
 * Check if Socket.IO is connected
 * @returns {boolean} - Connection status
 */
const isConnected = () => {
  return socket && socket.connected;
};

/**
 * Get the current Socket.IO connection status
 * @returns {string} - Status: 'connected', 'connecting', 'disconnected', or 'not_initialized'
 */
const getStatus = () => {
  if (!socket) return "not_initialized";

  if (socket.connected) {
    return "connected";
  } else if (socket.connecting) {
    return "connecting";
  } else {
    return "disconnected";
  }
};

// Export the public API
export default {
  connect,
  disconnect,
  sendMessage,
  addEventListener,
  removeEventListener,
  isConnected,
  getStatus,
};
