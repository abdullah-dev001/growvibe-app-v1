import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AttachmentMessage from './AttachmentMessage';
import SenderAvatar from './SenderAvatar';
import TextMessage from './TextMessage';
import VoiceMessage from './VoiceMessage';

const MessageItem = ({
  item,
  currentUserId,
  chatType,
  attachmentData,
  voiceData,
  setVoiceData,
  downloadingAttachments,
  playingVoiceId,
  voiceProgress,
  handleDownloadAttachment,
  handlePlayVoice,
  onImagePress,
}) => {
  const messageContent = item.content || '';
  const messageType = item.message_Type || item.message_type || 'text';
  const senderId = item.sender_Id || item.senderId;
  const senderName = item.sender_name || 'Unknown';
  const senderImage = item.sender_image;
  const createdAt = item.created_at || item.timestamp;
  const duration = item.duration;
  const messageId = item.id;
  
  const isMe = senderId === currentUserId;
  const showSenderName = chatType === 'group' && !isMe;

  // Format timestamp
  const formattedTime = createdAt
    ? new Date(createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // Get attachment data if available
  const attachmentInfo = attachmentData[messageId];
  // Get voice data if available
  const voiceInfo = voiceData[messageId] || null;

  return (
    <View
      style={[
        styles.messageContainer,
        isMe ? styles.messageContainerRight : styles.messageContainerLeft,
      ]}
    >
      {showSenderName && (
        <View style={styles.senderInfo}>
          <SenderAvatar senderImage={senderImage} senderName={senderName} />
          <Text style={styles.senderName}>{senderName}</Text>
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.messageBubbleRight : styles.messageBubbleLeft,
        ]}
      >
        {messageType === 'voice' ? (
          <VoiceMessage
            messageId={messageId}
            duration={duration}
            isMe={isMe}
            playingVoiceId={playingVoiceId}
            voiceData={voiceData}
            setVoiceData={setVoiceData}
            voiceProgress={voiceProgress}
            handlePlayVoice={handlePlayVoice}
          />
        ) : messageType === 'attachment' ? (
          <AttachmentMessage
            messageId={messageId}
            attachmentInfo={attachmentInfo}
            messageContent={messageContent}
            isMe={isMe}
            downloadingAttachments={downloadingAttachments}
            handleDownloadAttachment={handleDownloadAttachment}
            onImagePress={onImagePress}
          />
        ) : (
          <TextMessage messageContent={messageContent} isMe={isMe} />
        )}
        <View style={styles.messageFooter}>
          {item.isPending && (
            <ActivityIndicator 
              size="small" 
              color={isMe ? 'rgba(255, 255, 255, 0.7)' : '#9CA3AF'} 
              style={styles.sendingIndicator}
            />
          )}
          <Text
            style={[
              styles.messageTime,
              isMe ? styles.messageTimeRight : styles.messageTimeLeft,
              item.isPending && styles.messageTimePending,
            ]}
          >
            {item.isPending ? 'Sending...' : formattedTime}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  messageContainerLeft: {
    alignItems: 'flex-start',
  },
  messageContainerRight: {
    alignItems: 'flex-end',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  messageBubbleLeft: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: '#1CACF3',
    borderBottomRightRadius: 4,
  },
  messageFooter: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
  },
  messageTimeLeft: {
    color: '#6B7280',
  },
  messageTimeRight: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  messageTimePending: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  sendingIndicator: {
    marginRight: 4,
  },
});

export default MessageItem;

