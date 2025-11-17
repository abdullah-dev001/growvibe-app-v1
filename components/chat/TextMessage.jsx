import React from 'react';
import { StyleSheet, Text } from 'react-native';

const TextMessage = ({ messageContent, isMe }) => {
  return (
    <Text
      style={[
        styles.messageText,
        isMe ? styles.messageTextRight : styles.messageTextLeft,
      ]}
    >
      {messageContent}
    </Text>
  );
};

const styles = StyleSheet.create({
  messageText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  messageTextLeft: {
    color: '#111827',
  },
  messageTextRight: {
    color: '#FFFFFF',
  },
});

export default TextMessage;

