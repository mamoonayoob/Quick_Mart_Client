/**
 * Utility functions for handling deep linking to conversations and notifications
 */

/**
 * Parse deep link parameters from URL
 * @param {string} url - The URL to parse
 * @returns {Object} - Object containing parsed parameters
 */
export const parseDeepLink = (url) => {
  try {
    // Create URL object to easily parse parameters
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    // Extract parameters
    const type = params.get('type'); // 'message' or 'notification'
    const id = params.get('id'); // message or notification ID
    const conversationId = params.get('conversationId');
    const orderId = params.get('orderId');
    const userId = params.get('userId');
    
    return {
      type,
      id,
      conversationId,
      orderId,
      userId
    };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return {};
  }
};

/**
 * Create a deep link URL for a message
 * @param {Object} params - Parameters for the deep link
 * @returns {string} - Deep link URL
 */
export const createMessageDeepLink = ({ conversationId, messageId, orderId, userId }) => {
  const baseUrl = window.location.origin;
  const url = new URL(`${baseUrl}/messages`);
  
  url.searchParams.append('type', 'message');
  
  if (conversationId) url.searchParams.append('conversationId', conversationId);
  if (messageId) url.searchParams.append('id', messageId);
  if (orderId) url.searchParams.append('orderId', orderId);
  if (userId) url.searchParams.append('userId', userId);
  
  return url.toString();
};

/**
 * Create a deep link URL for a notification
 * @param {Object} params - Parameters for the deep link
 * @returns {string} - Deep link URL
 */
export const createNotificationDeepLink = ({ notificationId, type, referenceId }) => {
  const baseUrl = window.location.origin;
  const url = new URL(`${baseUrl}/notifications`);
  
  url.searchParams.append('type', 'notification');
  
  if (notificationId) url.searchParams.append('id', notificationId);
  if (type) url.searchParams.append('notificationType', type);
  if (referenceId) url.searchParams.append('referenceId', referenceId);
  
  return url.toString();
};

/**
 * Handle deep link navigation
 * @param {Object} params - Parsed deep link parameters
 * @param {Function} navigate - React Router navigate function
 */
export const handleDeepLink = (params, navigate) => {
  const { type, id, conversationId, orderId, userId } = params;
  
  if (!type) return;
  
  if (type === 'message') {
    // Navigate to the appropriate message view
    if (conversationId) {
      navigate(`/messages/conversation/${conversationId}`);
    } else if (orderId) {
      navigate(`/messages/order/${orderId}`);
    } else if (userId) {
      navigate(`/messages/user/${userId}`);
    } else {
      navigate('/messages');
    }
  } else if (type === 'notification') {
    // Navigate to the notification or its reference
    if (id) {
      navigate(`/notifications/${id}`);
    } else {
      navigate('/notifications');
    }
  }
};
