import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requestNotificationPermission } from '../../services/firebaseMessagingService';

/**
 * Component that handles Firebase notification permissions and token registration.
 * This component doesn't render anything visible but handles the notification setup.
 */
const FirebaseNotificationHandler = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Only request notification permission if the user is logged in
    if (user) {
      const setupNotifications = async () => {
        try {
          // Request notification permission and register FCM token
          const fcmToken = await requestNotificationPermission();
          
          if (fcmToken) {
            console.log('Firebase notification setup complete');
          } else {
            console.warn('Failed to set up Firebase notifications');
          }
        } catch (error) {
          console.error('Error setting up Firebase notifications:', error);
        }
      };

      setupNotifications();
    }
  }, [user]);

  // This component doesn't render anything visible
  return null;
};

export default FirebaseNotificationHandler;
