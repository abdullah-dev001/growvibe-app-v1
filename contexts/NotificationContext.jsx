import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'expo-router';
import NotificationBanner from '../components/NotificationBanner';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [currentNotification, setCurrentNotification] = useState(null);
  const router = useRouter();

  const showNotification = (notification) => {
    setCurrentNotification(notification);
  };

  const hideNotification = () => {
    setCurrentNotification(null);
  };

  const handleNotificationPress = (notification) => {
    const data = notification?.request?.content?.data || {};
    const notificationType = data?.type;

    // Navigate based on notification type
    switch (notificationType) {
      case 'chat':
        if (data?.chatId) {
          router.push({
            pathname: '/screens/chatDetail',
            params: {
              chatId: data.chatId,
              chatName: data.chatName || 'Chat',
              chatImage: data.chatImage || '',
              chatType: 'group',
            },
          });
        }
        break;
      case 'task':
        if (data?.taskId) {
          router.push('/screens/tasks');
        }
        break;
      case 'diary':
        router.push('/screens/diary');
        break;
      case 'application':
        router.push({
          pathname: '/screens/applications',
          params: { initialTab: 'my' },
        });
        break;
      case 'attendance':
        router.push('/screens/attendance');
        break;
      case 'support':
        router.push('/(tabs)/(common)/support');
        break;
      default:
        // For general notifications, could navigate to home or do nothing
        break;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {currentNotification && (
        <NotificationBanner
          notification={currentNotification}
          onDismiss={hideNotification}
          onPress={() => handleNotificationPress(currentNotification)}
        />
      )}
    </NotificationContext.Provider>
  );
};

