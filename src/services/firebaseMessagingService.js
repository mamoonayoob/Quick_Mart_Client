import { messaging } from "../firebase/config";
import { getToken as getFirebaseToken, onMessage } from "firebase/messaging";
import axios from "axios";
import { getToken } from "./authService"; // Assuming you have an auth service that provides tokens

const API_URL =
  process.env.REACT_APP_API_URL || "https://nextgenretail.site/quickmart/api";

// Request permission and get FCM token
export const requestNotificationPermission = async () => {
  console.log(
    "Requesting notification permission" +
      process.env.REACT_APP_FIREBASE_VAPID_KEY
  );
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      // Get FCM token
      const fcmToken = await getFirebaseToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      });

      // Send FCM token to backend
      await registerFCMToken(fcmToken);

      return fcmToken;
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
};

// Register FCM token with backend
export const registerFCMToken = async (fcmToken) => {
  try {
    const authToken = await getToken();
    await axios.post(
      `${API_URL}/notifications/register-token`,
      { fcmToken },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return true;
  } catch (error) {
    console.error("Error registering FCM token:", error);
    return false;
  }
};

// Listen for foreground messages
export const setupForegroundNotifications = (callback) => {
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("Message received in foreground:", payload);

    // Create notification
    if (payload.notification) {
      const { title, body } = payload.notification;

      // Show browser notification
      if (Notification.permission === "granted") {
        const notification = new Notification(title, {
          body,
          icon: "/logo192.png", // Assuming you have this icon
        });

        notification.onclick = () => {
          // Handle notification click
          window.focus();
          notification.close();

          // Navigate to appropriate page based on payload data
          if (payload.data) {
            // Handle deep linking
            if (
              payload.data.type === "message" &&
              payload.data.conversationId
            ) {
              window.location.href = `/messages/conversation/${payload.data.conversationId}`;
            } else if (
              payload.data.type === "notification" &&
              payload.data.id
            ) {
              window.location.href = `/notifications/${payload.data.id}`;
            } else if (payload.data.url) {
              window.location.href = payload.data.url;
            }
          }
        };
      }
    }

    // Call the callback with the payload
    if (callback) {
      callback(payload);
    }
  });

  return unsubscribe;
};

// Handle background messages
// Note: This is handled in firebase-messaging-sw.js service worker
