import { getToken } from "./authService"; // Assuming you have an auth service that provides tokens
import websocketService from "./websocketService";

let socket;

// Initialize socket connection
export const initSocket = async (userId, userToken) => {
  try {
    // First priority: use explicitly passed userId and token
    // Second priority: get from Redux store via authService
    // Last resort: try localStorage
    let token = userToken;
    if (!token) {
      token = await getToken();
    }

    // Ensure we have a valid userId - never use 'anonymous' for logged-in users
    let socketUserId = userId;
    if (!socketUserId) {
      // Try to get userId from localStorage
      socketUserId = localStorage.getItem("userId");

      // If still no userId, try to get from user object in localStorage
      if (!socketUserId) {
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.id) {
              socketUserId = user.id;
              console.log(
                "Using userId from localStorage user object:",
                socketUserId
              );
            }
          }
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
        }
      }
    }

    // Validate we have both userId and token before connecting
    if (!socketUserId && token) {
      console.error(
        "Warning: Attempting to connect WebSocket with token but no userId"
      );
    }

    if (!token) {
      console.error(
        "Warning: Attempting to connect WebSocket without authentication token"
      );
    }

    // Log connection attempt for debugging
    console.log(
      `Initializing WebSocket with userId: ${
        socketUserId || "unknown"
      }, token present: ${!!token}`
    );

    // Use the WebSocket service with proper credentials
    websocketService.connect(socketUserId, token);
    socket = true; // Just a flag to indicate socket is initialized

    // Add connection listener for compatibility
    websocketService.addEventListener("connection", (data) => {
      if (data.status === "connected") {
        console.log("Socket connected successfully with userId:", socketUserId);
      } else if (data.status === "disconnected") {
        console.log("Socket disconnected");
      }
    });

    // Add error listener for compatibility
    websocketService.addEventListener("error", (data) => {
      console.error("Socket connection error:", data.error);
    });

    return socket;
  } catch (error) {
    console.error("Failed to initialize socket:", error);
    return null;
  }
};

// Get the socket instance
export const getSocket = () => {
  if (!socket) {
    console.warn("Socket not initialized. Call initSocket() first.");
  }
  return socket;
};

// Disconnect socket
export const disconnectSocket = () => {
  websocketService.disconnect();
  socket = null;
};

// Send a message
export const sendMessage = (eventName, data) => {
  if (websocketService.isConnected()) {
    websocketService.sendMessage(data);
  } else {
    console.warn("Socket not initialized. Cannot send message.");
  }
};

// Listen for messages
export const onMessage = (eventName, callback) => {
  const callbackId = `socketService_${eventName}_${Date.now()}`;
  websocketService.addEventListener(eventName, callback);
  return callbackId; // Return ID so it can be used to remove the listener later
};

// Remove event listener
export const offMessage = (eventName, callbackId) => {
  // Note: callbackId is now the actual callback function
  // This is a breaking change in the API, but it's necessary for Socket.IO compatibility
  websocketService.removeEventListener(eventName, callbackId);
};

// Get socket status
export const getSocketStatus = () => {
  return websocketService.getStatus();
};
