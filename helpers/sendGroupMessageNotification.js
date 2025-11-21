import { supabase } from '../supabaseClient';
import { getUserFullName } from './getUserFullName';
import { sendPushNotificationToUsers } from './sendPushNotification';

/**
 * Send push notification to all group members when a message is sent
 * @param {string} chatId - The chat/group ID
 * @param {string} senderId - The sender's auth ID (will be excluded from notifications)
 * @param {string} messageType - Type of message (text, attachment, voice)
 * @param {string} messageContent - The message content (for text) or description
 * @param {string} chatName - Optional chat/group name for personalization
 * @returns {Promise<number>} - Returns number of notifications sent successfully
 */
export async function sendGroupMessageNotification(chatId, senderId, messageType = 'text', messageContent = '', chatName = null) {
  try {
    if (!chatId || !senderId) {
      console.log('Missing required parameters for group message notification');
      return 0;
    }

    // Get sender's name
    const senderName = await getUserFullName(senderId);

    // Get all group members (excluding sender)
    const { data: members, error: membersError } = await supabase
      .from('chat_member')
      .select('user_Id')
      .eq('chat_Id', chatId)
      .neq('user_Id', senderId);

    if (membersError || !members || members.length === 0) {
      console.log('No group members found or error fetching members');
      return 0;
    }

    const memberIds = members.map(m => m.user_Id).filter(id => id);

    if (memberIds.length === 0) {
      return 0;
    }

    // Create notification message based on message type
    let notificationTitle = 'New Message';
    let notificationBody = '';

    if (chatName) {
      notificationTitle = `New message in ${chatName}`;
    }

    switch (messageType) {
      case 'text':
        const textPreview = messageContent.length > 50 
          ? messageContent.substring(0, 50) + '...' 
          : messageContent;
        notificationBody = `${senderName}: ${textPreview}`;
        break;
      case 'attachment':
        notificationBody = `${senderName} sent an attachment`;
        break;
      case 'voice':
        notificationBody = `${senderName} sent a voice message`;
        break;
      default:
        notificationBody = `${senderName} sent a message`;
    }

    // Send notifications to all group members
    const sentCount = await sendPushNotificationToUsers(
      memberIds,
      notificationTitle,
      notificationBody,
      {
        type: 'group_message',
        chatId: chatId,
        senderId: senderId,
        messageType: messageType,
        chatName: chatName,
      }
    );

    return sentCount;
  } catch (error) {
    console.log('Error sending group message notification:', error);
    return 0;
  }
}

