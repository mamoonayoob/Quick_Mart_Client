import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  initSocket,
  disconnectSocket,
  onMessage,
  offMessage,
  getSocketStatus,
} from "../services/socketService";
import {
  sendMessageToVendor,
  sendMessageToCustomer,
  sendMessageToAdmin,
  sendMessageToAllAdmins,
  getCustomerMessages,
  getVendorMessages,
  getAdminMessages,
  markMessageAsRead,
  getUnreadMessageCount,
} from "../services/messageService";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService";
import {
  requestNotificationPermission,
  setupForegroundNotifications,
} from "../services/firebaseMessagingService";
import { useAuth } from "./AuthContext"; // Assuming you have an auth context with user info

const MessageContext = createContext();

export const useMessages = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
  const { user } = useAuth(); // Assuming you have an auth context with user info
  const [messages, setMessages] = useState([]);
  const [customerMessages, setCustomerMessages] = useState([]);
  const [vendorMessages, setVendorMessages] = useState([]);
  const [adminMessages, setAdminMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeConversation, setActiveConversation] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [socketStatus, setSocketStatus] = useState("not_initialized");
  const [socketListeners, setSocketListeners] = useState([]);

  // Send message function
  const sendMessage = useCallback(async (messageData) => {
    try {
      let response;

      // Determine which service function to use based on recipient type
      if (messageData.recipientType === "vendor") {
        response = await sendMessageToVendor(
          messageData.orderId,
          messageData.message
        );
      } else if (messageData.recipientType === "customer") {
        response = await sendMessageToCustomer(
          messageData.orderId,
          messageData.message
        );
      } else if (messageData.recipientType === "admin") {
        response = await sendMessageToAdmin(
          messageData.message,
          messageData.orderId
        );
      }

      // Update local state with the new message
      if (response && response.data) {
        const newMessage = response.data.data;

        // Add to appropriate message list based on recipient type
        if (messageData.recipientType === "vendor") {
          setCustomerMessages((prev) => [newMessage, ...prev]);
        } else if (messageData.recipientType === "customer") {
          setVendorMessages((prev) => [newMessage, ...prev]);
        } else if (messageData.recipientType === "admin") {
          setAdminMessages((prev) => [newMessage, ...prev]);
        }
      }

      return response?.data;
    } catch (error) {
      setError("Failed to send message");
      console.error("Error sending message:", error);
      return null;
    }
  }, []);

  // Send broadcast message (admin only)
  const sendBroadcastMessage = useCallback(async (message) => {
    try {
      const response = await sendMessageToAllAdmins(message);
      return response.data;
    } catch (error) {
      setError("Failed to send broadcast message");
      console.error("Error sending broadcast message:", error);
      return null;
    }
  }, []);

  // Mark message as read
  const markAsRead = useCallback(async (messageId) => {
    try {
      await markMessageAsRead(messageId);

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));

      return true;
    } catch (error) {
      console.error("Error marking message as read:", error);
      return false;
    }
  }, []);

  // Fetch customer messages
  const fetchCustomerMessages = useCallback(async () => {
    if (!user) return [];

    setLoading(true);
    setError(null);

    try {
      const response = await getCustomerMessages();
      console.log("customerMessages11", response.data?.data);
      setCustomerMessages(response.data?.data || []);
      return response.data;
    } catch (error) {
      setError("Failed to fetch customer messages");
      console.error("Error fetching customer messages:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch vendor messages
  const fetchVendorMessages = useCallback(async () => {
    if (!user) return [];

    setLoading(true);
    setError(null);

    try {
      const response = await getVendorMessages();
      setVendorMessages(response.data?.data || []);
      return response.data;
    } catch (error) {
      setError("Failed to fetch vendor messages");
      console.error("Error fetching vendor messages:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch admin messages
  const fetchAdminMessages = useCallback(async () => {
    if (!user) return [];

    setLoading(true);
    setError(null);

    try {
      const response = await getAdminMessages();
      setAdminMessages(response.data?.data || []);
      return response.data;
    } catch (error) {
      setError("Failed to fetch admin messages");
      console.error("Error fetching admin messages:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages based on user role
  const fetchMessages = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let response;

      if (user.role === "customer") {
        response = await getCustomerMessages();
        setCustomerMessages(response.data || []);
      } else if (user.role === "vendor") {
        response = await getVendorMessages();
        setVendorMessages(response.data || []);
      } else if (user.role === "admin") {
        response = await getAdminMessages();
        setAdminMessages(response.data || []);
      }

      if (response && response.data) {
        setMessages(response.data);
      }
    } catch (err) {
      setError("Failed to fetch messages");
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const count = await getUnreadMessageCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [user]);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (params = {}) => {
      if (!user) return { notifications: [] };

      setNotificationLoading(true);
      try {
        const response = await getNotifications(params);
        setNotifications(response.notifications || []);
        return response;
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return { notifications: [] };
      } finally {
        setNotificationLoading(false);
      }
    },
    [user]
  );

  // Mark notification as read
  const markNotificationRead = useCallback(
    async (notificationId) => {
      try {
        await markNotificationAsRead(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );

        // Refresh unread count
        fetchUnreadCount();

        return true;
      } catch (error) {
        console.error("Error marking notification as read:", error);
        return false;
      }
    },
    [fetchUnreadCount]
  );

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );

      // Reset unread count
      setUnreadCount(0);

      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }, []);

  // Initialize socket connection and event listeners
  useEffect(() => {
    if (!user) return;

    // Connect to socket with user ID
    initSocket(user?.id).then(() => {
      // Update socket status periodically
      const statusInterval = setInterval(() => {
        const status = getSocketStatus();
        setSocketStatus(status);
      }, 5000);

      // Store interval ID for cleanup
      return () => clearInterval(statusInterval);
    });

    // Track listener IDs for cleanup
    const listenerIds = [];

    // Listen for new messages
    const newMessageListener = onMessage("new_message", (message) => {
      console.log("New message received:", message);
      // Update messages state with new message
      setMessages((prevMessages) => {
        // Check if message already exists to avoid duplicates
        const exists = prevMessages.some((msg) => msg._id === message._id);
        if (exists) return prevMessages;
        return [...prevMessages, message];
      });

      // Update unread count if message is not from current user
      if (message.senderId !== user.id) {
        setUnreadCount((prev) => prev + 1);

        // Also update the appropriate message list based on user role
        if (user.role === "customer") {
          setCustomerMessages((prev) => [...prev, message]);
        } else if (user.role === "vendor") {
          setVendorMessages((prev) => [...prev, message]);
        } else if (user.role === "admin") {
          setAdminMessages((prev) => [...prev, message]);
        }
      }
    });
    listenerIds.push({ event: "new_message", id: newMessageListener });

    // Listen for read receipts
    const messageReadListener = onMessage("message_read", (data) => {
      console.log("Message read receipt:", data);
      // Update message read status
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === data.messageId ? { ...msg, isRead: true } : msg
        )
      );

      // Also update the appropriate message list based on user role
      if (user.role === "customer") {
        setCustomerMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, isRead: true } : msg
          )
        );
      } else if (user.role === "vendor") {
        setVendorMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, isRead: true } : msg
          )
        );
      } else if (user.role === "admin") {
        setAdminMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, isRead: true } : msg
          )
        );
      }
    });
    listenerIds.push({ event: "message_read", id: messageReadListener });

    // Listen for new notifications
    const notificationListener = onMessage(
      "new_notification",
      (notification) => {
        console.log("New notification received:", notification);
        // Add new notification to state
        setNotifications((prev) => {
          // Check if notification already exists to avoid duplicates
          const exists = prev.some((n) => n._id === notification._id);
          if (exists) return prev;
          return [notification, ...prev];
        });

        // Update unread count
        if (!notification.isRead) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    );
    listenerIds.push({ event: "new_notification", id: notificationListener });

    // Store listener IDs for cleanup
    setSocketListeners(listenerIds);

    // Initialize Firebase messaging
    requestNotificationPermission();

    // Listen for Firebase notifications
    const unsubscribe = setupForegroundNotifications((payload) => {
      // Handle foreground notification
      console.log("Received foreground message:", payload);

      // Update unread count
      setUnreadCount((prev) => prev + 1);

      // Add notification to state if it has the right format
      if (payload.notification) {
        const newNotification = {
          _id: payload.data?.notificationId || Date.now().toString(),
          title: payload.notification.title,
          content: payload.notification.body,
          createdAt: new Date().toISOString(),
          isRead: false,
          type: payload.data?.type || "message",
          link: payload.data?.link || null,
          sender: payload.data?.senderId
            ? {
                _id: payload.data.senderId,
                name: payload.data.senderName || "Unknown",
              }
            : null,
        };

        setNotifications((prev) => [newNotification, ...prev]);
      }
    });

    // Clean up
    return () => {
      // Remove all socket listeners
      socketListeners.forEach((listener) => {
        offMessage(listener.event, listener.id);
      });
      disconnectSocket();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch notifications on initial load
  useEffect(() => {
    if (user) {
      fetchNotifications({ limit: 10 });
    }
  }, [user, fetchNotifications]);

  // Fetch messages and unread count on initial load
  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchUnreadCount();
    }
  }, [user, fetchMessages, fetchUnreadCount]);

  // Provide context value
  const value = {
    messages,
    customerMessages,
    vendorMessages,
    adminMessages,
    loading,
    error,
    unreadCount,
    activeConversation,
    setActiveConversation,
    sendMessage,
    sendBroadcastMessage,
    fetchMessages,
    fetchCustomerMessages,
    fetchVendorMessages,
    fetchAdminMessages,
    fetchUnreadCount,
    markAsRead,
    // Notification related
    notifications,
    notificationLoading,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    // Socket status
    socketStatus,
  };

  return (
    <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
  );
};

export default MessageContext;
