import axios from "axios";
import { getToken } from "./authService"; // Assuming you have an auth service for token management

const API_URL =
  process.env.REACT_APP_API_URL || "https://nextgenretail.site/quickmart/api";

/**
 * Service for handling notification-related API calls
 */

/**
 * Fetch all notifications for the current user
 * @param {Object} params - Query parameters (page, limit, etc.)
 * @returns {Promise} - Promise with notifications data
 */
export const getNotifications = async (params = {}) => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return response.data;
};

/**
 * Fetch unread notification count
 * @returns {Promise} - Promise with unread count
 */
export const getUnreadCount = async () => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/notifications/unread/count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.count;
};

/**
 * Mark a notification as read
 * @param {string} notificationId - ID of the notification to mark as read
 * @returns {Promise} - Promise with updated notification
 */
export const markNotificationAsRead = async (notificationId) => {
  const token = await getToken();
  const response = await axios.patch(
    `${API_URL}/notifications/${notificationId}/read`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Mark all notifications as read
 * @returns {Promise} - Promise with operation result
 */
export const markAllNotificationsAsRead = async () => {
  const token = await getToken();
  const response = await axios.patch(
    `${API_URL}/notifications/read-all`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Delete a notification
 * @param {string} notificationId - ID of the notification to delete
 * @returns {Promise} - Promise with operation result
 */
export const deleteNotification = async (notificationId) => {
  const token = await getToken();
  const response = await axios.delete(
    `${API_URL}/notifications/${notificationId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

/**
 * Update notification preferences
 * @param {Object} preferences - User notification preferences
 * @returns {Promise} - Promise with updated preferences
 */
export const updatePreferences = async (preferences) => {
  const token = await getToken();
  const response = await axios.put(
    `${API_URL}/notifications/preferences`,
    preferences,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Get notification preferences
 * @returns {Promise} - Promise with user notification preferences
 */
export const getPreferences = async () => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/notifications/preferences`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Also export as a default object for backward compatibility
const notificationService = {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  updatePreferences,
  getPreferences,
};

export default notificationService;
