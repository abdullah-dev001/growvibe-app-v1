import { useEffect, useRef } from 'react';
import { getNotificationsModule } from './notificationsWrapper';

export default function NotificationListener() {
  const notificationListener = useRef();
  const responseListener = useRef();

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
          console.log('Notification received:', notification);
        });

        // Listen when user interacts with notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification response:', response);
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
  }, []);

  return null;
}
