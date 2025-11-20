import Constants from 'expo-constants';

// Wrapper to safely import expo-notifications
// This prevents errors in Expo Go where push notifications don't work
let Notifications = null;
let isLoaded = false;

export async function getNotificationsModule() {
  // Skip in Expo Go
  if (Constants.executionEnvironment === 'storeClient') {
    return null;
  }

  if (isLoaded) {
    return Notifications;
  }

  try {
    // Use dynamic import to prevent errors in Expo Go
    const module = await import('expo-notifications');
    Notifications = module;
    isLoaded = true;
    return Notifications;
  } catch (error) {
    // Silently fail in Expo Go
    console.log('Notifications module not available in this environment');
    return null;
  }
}

export function isNotificationsAvailable() {
  return Constants.executionEnvironment !== 'storeClient' && isLoaded;
}

