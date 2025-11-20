import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getNotificationsModule } from './helpers/notificationsWrapper';
import { supabase } from './supabaseClient'; // your supabase client

// Cache for notification handler configuration
let notificationHandlerConfigured = false;

// Function to dynamically load notifications module
async function loadNotificationsModule() {
  const Notifications = await getNotificationsModule();
  
  if (!Notifications) {
    return null;
  }

  // Configure foreground notifications only once
  if (!notificationHandlerConfigured) {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      notificationHandlerConfigured = true;
    } catch (error) {
      console.log('Error configuring notification handler:', error.message);
    }
  }
  
  return Notifications;
}

// Function to get Expo push token
export async function registerForPushNotificationsAsync(userId) {
  // Return early if in Expo Go
  if (Constants.executionEnvironment === 'storeClient') {
    console.log('Push notifications not available in Expo Go. Use a development build for push notifications.');
    return null;
  }

  // Dynamically load notifications module
  const Notifications = await loadNotificationsModule();
  
  if (!Notifications) {
    console.log('Push notifications not available. Use a development build for push notifications.');
    return null;
  }

  let token;

  // In theory this should only be false on simulators / web.
  // Some environments may mis-report this, so we don't hard‑fail,
  // we just log a warning and still attempt to register.
  if (!Constants.isDevice) {
    console.log(
      'Warning: Constants.isDevice is false. Push notifications may not work on simulators/emulators.'
    );
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);

    // Save token in Supabase
    await savePushToken(userId, token);
  } catch (error) {
    console.log('Error registering for push notifications:', error.message);
    return null;
  }

  if (Platform.OS === 'android' && Notifications) {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    } catch (error) {
      console.log('Error setting notification channel:', error.message);
    }
  }

  return token;
}

// Save token to Supabase
async function savePushToken(userId, token) {
  const { data, error } = await supabase
    .from('push_token')
    .upsert({ user_Id: userId, token })
    .select();

  if (error) console.log('Error saving push token:', error);
  else console.log('Token saved:', data);
}
