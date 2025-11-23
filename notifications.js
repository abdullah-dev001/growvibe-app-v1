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
  if (!userId || !token) {
    console.log('Missing userId or token for savePushToken');
    return;
  }

  try {
    // First, delete any existing token for this device (to prevent conflicts with previous users)
    const { error: deleteError } = await supabase
      .from('push_token')
      .delete()
      .eq('token', token);

    if (deleteError) {
      console.log('Error deleting old push token:', deleteError);
    }

    // Also delete any existing token for this user (in case they're logging in on a different device)
    const { error: deleteUserTokenError } = await supabase
      .from('push_token')
      .delete()
      .eq('user_Id', userId);

    if (deleteUserTokenError) {
      console.log('Error deleting user push token:', deleteUserTokenError);
    }

    // Now insert the token for the current user
    const { data, error } = await supabase
      .from('push_token')
      .insert({ user_Id: userId, token })
      .select();

    if (error) {
      console.log('Error saving push token:', error);
      // If insert fails due to unique constraint, try update
      if (error.code === '23505') {
        const { error: updateError } = await supabase
          .from('push_token')
          .update({ user_Id: userId })
          .eq('token', token);
        
        if (updateError) {
          console.log('Error updating push token:', updateError);
        }
      }
    } else {}
  } catch (err) {
    console.log('Error in savePushToken:', err);
  }
}

// Delete push token from Supabase on logout
export async function deletePushToken(userId) {
  if (!userId) return;
  
  try {
    const { error } = await supabase
      .from('push_token')
      .delete()
      .eq('user_Id', userId);

    if (error) {
      console.log('Error deleting push token:', error);
    }
  } catch (err) {
    console.log('Error in deletePushToken:', err);
  }
}
