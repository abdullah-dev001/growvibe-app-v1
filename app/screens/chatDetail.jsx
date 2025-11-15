import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';
import Attachment from '../../assets/icons/Attachment';
import Microphone from '../../assets/icons/Microphone';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp } from '../../helpers/common';

// Mock messages - will be replaced with actual API data later
const MOCK_MESSAGES = [
  {
    id: '1',
    text: 'Hey, how are you doing?',
    senderId: 'other',
    senderName: 'John Doe',
    timestamp: '10:30 AM',
    isRead: true,
  },
  {
    id: '2',
    text: 'I am doing great! Thanks for asking. How about you?',
    senderId: 'me',
    senderName: 'Me',
    timestamp: '10:32 AM',
    isRead: true,
  },
  {
    id: '3',
    text: 'I am good too. Just working on some projects.',
    senderId: 'other',
    senderName: 'John Doe',
    timestamp: '10:35 AM',
    isRead: true,
  },
  {
    id: '4',
    text: 'That sounds great! Let me know if you need any help.',
    senderId: 'me',
    senderName: 'Me',
    timestamp: '10:36 AM',
    isRead: true,
  },
  {
    id: '5',
    text: 'Sure, will do. Thanks!',
    senderId: 'other',
    senderName: 'John Doe',
    timestamp: '10:40 AM',
    isRead: false,
  },
];

const chatDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useSelector((state) => state.auth);
  const flatListRef = useRef(null);

  const chatId = params.chatId;
  const chatName = params.chatName || 'Chat';
  const chatImage = params.chatImage;
  const chatType = params.chatType || 'personal';
  const memberCount = params.memberCount ? parseInt(params.memberCount) : 0;

  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const currentUserId = user?.id || 'me';

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      senderId: currentUserId,
      senderName: 'Me',
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isRead: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageText('');

    // Scroll to bottom after sending
    setTimeout(() => {
      if (flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const handleAttachmentPress = () => {
    // TODO: Implement attachment picker
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    // TODO: Start voice recording
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // TODO: Stop recording and send voice message
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    setRecordingDuration(0);
    // TODO: Cancel recording
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer for recording duration
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUserId;
    const showSenderName = chatType === 'group' && !isMe;

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.messageContainerRight : styles.messageContainerLeft,
        ]}
      >
        {showSenderName && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleRight : styles.messageBubbleLeft,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.messageTextRight : styles.messageTextLeft,
            ]}
          >
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMe ? styles.messageTimeRight : styles.messageTimeLeft,
              ]}
            >
              {item.timestamp}
            </Text>
            {isMe && (
              <Text style={styles.readIndicator}>
                {item.isRead ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backIcon}>
              <Text style={styles.backArrow}>←</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerInfo} activeOpacity={0.7}>
            <View style={styles.headerAvatar}>
              {chatImage ? (
                <Image source={{ uri: chatImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {chatName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerName} numberOfLines={1}>
                {chatName}
              </Text>
              {chatType === 'group' ? (
                <Text style={styles.headerStatus}>
                  {memberCount} members
                </Text>
              ) : (
                <Text style={styles.headerStatus}>Online</Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} activeOpacity={0.7}>
              <Text style={styles.headerActionIcon}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.messagesListEmpty,
          ]}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          }
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          {isRecording ? (
            <View style={styles.recordingContainer}>
              <TouchableOpacity
                style={styles.cancelRecordingButton}
                onPress={handleCancelRecording}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelIcon}>✕</Text>
              </TouchableOpacity>
              <View style={styles.recordingInfo}>
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>
                    Recording {formatDuration(recordingDuration)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.stopRecordingButton}
                onPress={handleStopRecording}
                activeOpacity={0.7}
              >
                <View style={styles.stopIcon} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={handleAttachmentPress}
                activeOpacity={0.7}
              >
                <Attachment size={hp(2.2)} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#9CA3AF"
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={1000}
                />
              </View>
              {messageText.trim() ? (
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendMessage}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sendIcon}>→</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.voiceButton}
                  onPress={handleStartRecording}
                  activeOpacity={0.7}
                >
                  <Microphone size={hp(2.2)} color="#6B7280" strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default chatDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  backIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: hp(2.5),
    color: '#111827',
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    marginRight: 12,
  },
  avatar: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
  },
  avatarPlaceholder: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: hp(2),
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  headerActionIcon: {
    fontSize: hp(2.5),
    color: '#111827',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  messagesListEmpty: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  messageContainerLeft: {
    alignSelf: 'flex-start',
  },
  messageContainerRight: {
    alignSelf: 'flex-end',
  },
  senderName: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  messageBubbleLeft: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: '#1CACF3',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    lineHeight: hp(2.2),
  },
  messageTextLeft: {
    color: '#111827',
  },
  messageTextRight: {
    color: '#FFFFFF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-Regular',
    marginRight: 4,
  },
  messageTimeLeft: {
    color: '#9CA3AF',
  },
  messageTimeRight: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  readIndicator: {
    fontSize: hp(1.1),
    color: '#FFFFFF',
    opacity: 0.8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? hp(3) : hp(6),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 44,
    maxHeight: 100,
  },
  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  textInputContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  textInput: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#111827',
    paddingBottom: hp(0.5),
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendIcon: {
    fontSize: hp(2),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  cancelRecordingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cancelIcon: {
    fontSize: hp(1.8),
    color: '#EF4444',
    fontWeight: '600',
  },
  recordingInfo: {
    flex: 1,
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#991B1B',
  },
  stopRecordingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  stopIcon: {
    width: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
});

