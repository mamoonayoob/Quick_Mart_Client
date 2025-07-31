import axios from "axios";
import { getToken } from "./authService";

const API_URL =
  process.env.REACT_APP_API_URL || "https://nextgenretail.site/quickmart/api";

/**
 * Service for sending notifications to users
 */

/**
 * Send a notification to a specific customer
 * @param {string} customerId - ID of the customer to notify
 * @param {string} content - Notification content
 * @param {string} type - Notification type (default: 'general')
 * @returns {Promise} - Promise with notification data
 */
export const sendNotificationToCustomer = async (
  customerId,
  content,
  type = "general"
) => {
  const token = await getToken();
  const response = await axios.post(
    `${API_URL}/notifications/send-to-customer`,
    { customerId, content, type },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Send a notification to all customers
 * @param {string} content - Notification content
 * @param {string} type - Notification type (default: 'announcement')
 * @returns {Promise} - Promise with notification data
 */
export const sendNotificationToAllCustomers = async (
  content,
  type = "announcement"
) => {
  const token = await getToken();
  const response = await axios.post(
    `${API_URL}/notifications/send-to-all-customers`,
    { content, type },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Send a notification related to an order
 * @param {string} orderId - ID of the order
 * @param {string} content - Notification content
 * @param {string} type - Notification type (default: 'order_update')
 * @returns {Promise} - Promise with notification data
 */
export const sendOrderNotification = async (
  orderId,
  content,
  type = "order_update"
) => {
  const token = await getToken();
  const response = await axios.post(
    `${API_URL}/notifications/order`,
    { orderId, content, type },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Get all customers for notification targeting
 * @returns {Promise} - Promise with customer data
 */
export const getCustomersForNotifications = async () => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/notifications/customers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Export as a default object for backward compatibility
const notificationApi = {
  sendNotificationToCustomer,
  sendNotificationToAllCustomers,
  sendOrderNotification,
  getCustomersForNotifications,
};

export default notificationApi;
