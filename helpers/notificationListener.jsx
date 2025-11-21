import { useEffect, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { getNotificationsModule } from './notificationsWrapper';

export default function NotificationListener() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const { showNotification } = useNotification();

  useEffect(() => {
    let Notifications = null;
    let mounted = true;

    const setupNotifications = async () => {
      try {
        Notifications = await getNotificationsModule();
        
        if (!Notifications || !mounted) {
          return;
        }

    // Listen when a notification is received while app is foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          // Show banner when notification arrives in foreground
          if (showNotification) {
            showNotification(notification);
          }
    });

    // Listen when user interacts with notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
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
  }, [showNotification]);

  return null;
}
