import axios from "axios";
import { getToken } from "./authService"; // Assuming you have an auth service that provides tokens

const API_URL =
  process.env.REACT_APP_API_URL || "https://nextgenretail.site/quickmart/api";

// Create axios instance with auth token
const createAuthHeader = async () => {
  const token = await getToken();
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
};

// Customer Message Services
export const sendMessageToVendor = async (orderId, content) => {
  const config = await createAuthHeader();
  return axios.post(
    `${API_URL}/messages/customer-to-vendor`,
    { orderId, content },
    config
  );
};

export const sendMessageToAdmin = async (content, orderId) => {
  const config = await createAuthHeader();
  return axios.post(
    `${API_URL}/messages/customer-to-admin`,
    { content, orderId },
    config
  );
};

export const getCustomerMessages = async () => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/customer`, config);
};

export const getVendorByOrderId = async (orderId) => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/vendor/${orderId}`, config);
};

// Vendor Message Services
export const sendMessageToCustomer = async (orderId, content) => {
  const config = await createAuthHeader();
  return axios.post(
    `${API_URL}/messages/vendor-to-customer`,
    { orderId, content },
    config
  );
};

export const getVendorMessages = async () => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/vendor`, config);
};

// Admin Message Services
export const sendMessageToCustomerFromAdmin = async (
  customerId,
  content,
  orderId
) => {
  const config = await createAuthHeader();
  return axios.post(
    `${API_URL}/messages/admin-to-customer`,
    { customerId, content, orderId },
    config
  );
};

export const sendMessageToAllAdmins = async (content) => {
  const config = await createAuthHeader();
  return axios.post(`${API_URL}/messages/admin-to-admins`, { content }, config);
};

export const getAdminMessages = async () => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/admin`, config);
};

// Common Message Services
export const getMessagesByOrderId = async (orderId) => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/order/${orderId}`, config);
};

export const markMessageAsRead = async (messageId) => {
  const config = await createAuthHeader();
  return axios.put(
    `${API_URL}/messages/${messageId}/read`,
    { messageId },
    config
  );
};

export const getUnreadMessageCount = async () => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/unread/count`, config);
};

// Enhanced General Messaging Functions (Customer-Vendor Communication)

// Send general message from customer to any vendor (not order-based)
export const sendGeneralMessageToVendor = async (vendorId, content) => {
  const config = await createAuthHeader();
  return axios.post(
    `${API_URL}/messages/customer-to-vendor/general`,
    { vendorId, content },
    config
  );
};

// Send general message from vendor to any customer (not order-based)
export const sendGeneralMessageToCustomer = async (customerId, content) => {
  const config = await createAuthHeader();
  return axios.post(
    `${API_URL}/messages/vendor-to-customer/general`,
    { customerId, content },
    config
  );
};

// Get all general conversations for customer (both order-based and general)
export const getCustomerConversations = async () => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/customer/conversations`, config);
};

// Get all general conversations for vendor (both order-based and general)
export const getVendorConversations = async () => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/vendor/conversations`, config);
};

// Get conversation history between customer and vendor
export const getConversationHistory = async (
  otherUserId,
  conversationType = "general"
) => {
  const config = await createAuthHeader();
  return axios.get(
    `${API_URL}/messages/conversation/${otherUserId}?type=${conversationType}`,
    config
  );
};

// Get all vendors for customer to browse and message
export const getAllVendorsForMessaging = async () => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/vendors/directory`, config);
};

// Get all customers for vendor to browse and message
export const getAllCustomersForMessaging = async () => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/customers/directory`, config);
};

// Search users (vendors/customers) for messaging
export const searchUsersForMessaging = async (searchTerm, userType = "all") => {
  const config = await createAuthHeader();
  return axios.get(
    `${API_URL}/messages/users/search?q=${encodeURIComponent(
      searchTerm
    )}&type=${userType}`,
    config
  );
};

// ============================================
// UNIVERSAL MESSAGING FUNCTIONS (ALL ROLES)
// ============================================

// Send general message from vendor to delivery boy
export const sendGeneralMessageToDeliveryBoy = async (
  deliveryBoyId,
  content
) => {
  const config = await createAuthHeader();
  return axios.post(
    `${API_URL}/messages/vendor-to-delivery/general`,
    { deliveryBoyId, content },
    config
  );
};

// Send general message from delivery boy to vendor
export const sendDeliveryMessageToVendor = async (vendorId, content) => {
  const config = await createAuthHeader();
  return axios.post(
    `${API_URL}/messages/delivery-to-vendor/general`,
    { vendorId, content },
    config
  );
};

// Send general message from delivery boy to customer
export const sendDeliveryMessageToCustomer = async (customerId, content) => {
  const config = await createAuthHeader();
  return axios.post(
    `${API_URL}/messages/delivery-to-customer/general`,
    { customerId, content },
    config
  );
};

// Get all delivery boys for vendor messaging
export const getAllDeliveryBoysForMessaging = async () => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/delivery/directory`, config);
};

// Get all vendors for delivery boy messaging (renamed to avoid conflict)
export const getAllVendorsForDeliveryMessaging = async () => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/vendors/directory`, config);
};

// Get delivery boy conversations
export const getDeliveryConversations = async () => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/delivery/conversations`, config);
};

// Universal message sending function (auto-detects roles)
export const sendUniversalMessage = async (
  receiverId,
  content,
  receiverRole
) => {
  const config = await createAuthHeader();
  return axios.post(
    `${API_URL}/messages/universal/send`,
    { receiverId, content, receiverRole },
    config
  );
};

// Get universal conversations for any role
export const getUniversalConversations = async () => {
  const config = await createAuthHeader();
  return axios.get(`${API_URL}/messages/universal/conversations`, config);
};

// Get all users for messaging (customers, vendors, delivery boys)
export const getAllUsersForMessaging = async (excludeRole = null) => {
  const config = await createAuthHeader();
  const params = excludeRole ? `?exclude=${excludeRole}` : "";
  return axios.get(`${API_URL}/messages/users/all${params}`, config);
};
