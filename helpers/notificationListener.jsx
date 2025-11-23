import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNotification } from '../contexts/NotificationContext';
import { getNotificationsModule } from './notificationsWrapper';

export default function NotificationListener() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const { showNotification } = useNotification();
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?.id;

  useEffect(() => {
    let Notifications = null;
    let mounted = true;

    const setupNotifications = async () => {
      try {
        Notifications = await getNotificationsModule();
        
        if (!Notifications || !mounted) {
          return;
        }

        // Remove old listeners if they exist
        if (notificationListener.current) {
          try {
            Notifications.removeNotificationSubscription(notificationListener.current);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        if (responseListener.current) {
          try {
            Notifications.removeNotificationSubscription(responseListener.current);
          } catch (e) {
            // Ignore cleanup errors
          }
        }

        // Listen when a notification is received while app is foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          // Only show notification if it's for the current user
          if (!mounted || !currentUserId) return;
          
          // Check if notification is for current user by checking data payload
          const notificationData = notification.request?.content?.data || notification.request?.trigger?.payload?.data || {};
          const notificationUserId = notificationData.userId || notificationData.user_Id || notificationData.recipientId;
          
          // If notification has a specific user ID, only show if it matches current user
          // If no user ID in notification, show it (for general notifications)
          if (notificationUserId && notificationUserId !== currentUserId) {
            return; // Skip notification for other users
          }
          
          // Show banner when notification arrives in foreground
          if (showNotification) {
            showNotification(notification);
          }
        });

        // Listen when user interacts with notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          // Only handle if notification is for current user
          if (!mounted || !currentUserId) return;
          
          const notificationData = response.notification?.request?.content?.data || response.notification?.request?.trigger?.payload?.data || {};
          const notificationUserId = notificationData.userId || notificationData.user_Id || notificationData.recipientId;
          
          // If notification has a specific user ID, only handle if it matches current user
          if (notificationUserId && notificationUserId !== currentUserId) {
            return; // Skip notification for other users
          }
          
          // Handle navigation when user taps notification (handled by NotificationBanner onPress)
        });
      } catch (error) {
        // Silently fail if notifications can't be loaded (e.g., in Expo Go)
        console.log('Notifications not available in this environment');
      }
    };

    setupNotifications();

    return () => {
      mounted = false;
      if (Notifications) {
        try {
          if (notificationListener.current) {
            Notifications.removeNotificationSubscription(notificationListener.current);
          }
          if (responseListener.current) {
            Notifications.removeNotificationSubscription(responseListener.current);
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [showNotification, currentUserId]); // Re-setup when user changes

  return null;
}
