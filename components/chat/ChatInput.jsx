import React from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Attachment from '../../assets/icons/Attachment';
import Microphone from '../../assets/icons/Microphone';
import Send from '../../assets/icons/Send';
import { hp } from '../../helpers/common';

const ChatInput = ({
  messageText,
  isSendingMessage,
  isUploading,
  onTextChange,
  onSendMessage,
  onAttachmentPress,
  onStartRecording,
}) => {
  return (
    <View style={styles.inputWrapper}>
      <TouchableOpacity
        style={styles.attachmentButton}
        onPress={onAttachmentPress}
        activeOpacity={0.7}
        disabled={isUploading}
      >
        <Attachment size={hp(2.2)} color={isUploading ? "#9CA3AF" : "#6B7280"} strokeWidth={2} />
      </TouchableOpacity>
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          value={messageText}
          onChangeText={onTextChange}
          multiline
          maxLength={4000}
          editable={!isUploading}
        />
      </View>
      {messageText.trim() ? (
        <TouchableOpacity
          style={[styles.sendButton, (isSendingMessage || isUploading) && styles.sendButtonDisabled]}
          onPress={onSendMessage}
          activeOpacity={0.7}
          disabled={isSendingMessage || isUploading}
        >
          {isSendingMessage ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={hp(2)} color="#FFFFFF" strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={onStartRecording}
          activeOpacity={0.7}
          disabled={isUploading}
        >
          <Microphone size={hp(2.2)} color={isUploading ? "#9CA3AF" : "#6B7280"} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  sendButtonDisabled: {
    opacity: 0.6,
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
});

export default ChatInput;

