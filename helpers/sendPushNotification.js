import { supabase } from '../supabaseClient';

/**
 * Send push notification to a specific user
 * @param {string} userId - The user's auth ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to pass with notification
 * @returns {Promise<boolean>} - Returns true if notification was sent successfully
 */
export async function sendPushNotificationToUser(userId, title, body, data = {}) {
  try {
    if (!userId) {
      console.log('No user ID provided for push notification');
      return false;
    }

    // Get user's push token
    const { data: pushTokenData, error: tokenError } = await supabase
      .from('push_token')
      .select('token')
      .eq('user_Id', userId)
      .maybeSingle();

    if (tokenError || !pushTokenData?.token) {
      console.log('No push token found for user:', userId);
      return false;
    }

    // Send push notification directly via Expo Push API
    // This allows sending to a specific token without modifying the edge function
    const message = {
      to: pushTokenData.token,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        type: data.type || 'general',
      },
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (!response.ok || (result.data && result.data[0]?.status === 'error')) {
        console.log('Failed to send push notification:', result);
        return false;
      }

      return true;
    } catch (fetchError) {
      console.log('Error sending push notification:', fetchError);
      return false;
    }

  } catch (error) {
    console.log('Error in sendPushNotificationToUser:', error);
    return false;
  }
}

/**
 * Send push notification to multiple users
 * @param {string[]} userIds - Array of user auth IDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to pass with notification
 * @returns {Promise<number>} - Returns number of notifications sent successfully
 */
export async function sendPushNotificationToUsers(userIds, title, body, data = {}) {
  try {
    if (!userIds || userIds.length === 0) {
      console.log('No user IDs provided for push notification');
      return 0;
    }

    // Get push tokens for all users
    const { data: pushTokenData, error: tokenError } = await supabase
      .from('push_token')
      .select('token')
      .in('user_Id', userIds);

    if (tokenError || !pushTokenData || pushTokenData.length === 0) {
      console.log('No push tokens found for users');
      return 0;
    }

    const tokens = pushTokenData.map((item) => item.token);

    // Send push notifications in batches of 100 (Expo limit)
    const chunkSize = 100;
    let sentCount = 0;

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);
      const messages = chunk.map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: {
          ...data,
          type: data.type || 'general',
        },
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (response.ok) {
        sentCount += chunk.length;
      } else {
        console.log('Failed to send push notification batch:', await response.text());
      }
    }

    return tokens.length;
  } catch (error) {
    console.log('Error in sendPushNotificationToUsers:', error);
    return 0;
  }
}

