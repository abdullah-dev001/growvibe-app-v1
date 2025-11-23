import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Attachment from '../../assets/icons/Attachment';
import { hp } from '../../helpers/common';

const AttachmentMessage = ({ 
  messageId, 
  attachmentInfo, 
  messageContent, 
  isMe, 
  downloadingAttachments,
  handleDownloadAttachment,
  onImagePress,
  isPending = false
}) => {
  // Check if it's an image attachment
  let isImageAttachment = false;
  if (attachmentInfo?.type?.startsWith('image/')) {
    isImageAttachment = true;
  } else if (messageContent) {
    try {
      const parsed = JSON.parse(messageContent);
      if (parsed?.type?.startsWith('image/')) {
        isImageAttachment = true;
      }
    } catch {
      // Not JSON, ignore
    }
  }

  if (isImageAttachment) {
    const imageUrl = attachmentInfo?.displayUrl || attachmentInfo?.url;
    
    // Show loading state for pending image messages
    if (isPending || !imageUrl) {
      return (
        <View style={styles.attachmentMessageContainer}>
          <View style={[styles.attachmentImagePreview, { backgroundColor: isMe ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <ActivityIndicator size="small" color={isMe ? '#FFFFFF' : '#1CACF3'} />
          </View>
          <View style={styles.attachmentImageInfo}>
            <Text
              style={[
                styles.attachmentFileName,
                { color: isMe ? '#FFFFFF' : '#111827', opacity: 0.7 },
              ]}
              numberOfLines={1}
            >
              Sending image...
            </Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.attachmentMessageContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (imageUrl && onImagePress) {
              // Open full-size preview
              onImagePress(imageUrl, attachmentInfo.name || messageContent || 'Image');
            }
          }}
          disabled={downloadingAttachments[messageId]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.attachmentImagePreview}
            contentFit="cover"
            cachePolicy="disk"
          />
          {downloadingAttachments[messageId] && (
            <View style={styles.attachmentImageOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.attachmentImageInfo}>
          <Text
            style={[
              styles.attachmentFileName,
              { color: isMe ? '#FFFFFF' : '#111827' },
            ]}
            numberOfLines={1}
          >
            {attachmentInfo.name || messageContent || 'Image'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (attachmentInfo?.url) {
                handleDownloadAttachment(
                  messageId,
                  attachmentInfo.url,
                  attachmentInfo.type,
                  attachmentInfo.name
                );
              }
            }}
            disabled={downloadingAttachments[messageId]}
          >
            <Text style={[styles.attachmentDownloadText, { color: isMe ? '#FFFFFF' : '#1CACF3' }]}>
              {downloadingAttachments[messageId] ? 'Downloading...' : 'Download'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Colors based on whether it's user's message or opponent's
  const iconBg = isMe ? 'rgba(255, 255, 255, 0.2)' : 'rgba(28, 172, 243, 0.15)';
  const iconColor = isMe ? '#FFFFFF' : '#1CACF3';
  const fileNameColor = isMe ? '#FFFFFF' : '#111827';
  const downloadTextColor = isMe ? '#FFFFFF' : '#1CACF3';

  // Parse message content if attachmentInfo is not available (for pending messages)
  let attachmentName = attachmentInfo?.name;
  if (!attachmentName && messageContent) {
    try {
      const parsed = JSON.parse(messageContent);
      attachmentName = parsed.name || 'Attachment';
    } catch {
      attachmentName = 'Attachment';
    }
  }

  return (
    <View style={styles.attachmentFileContainer}>
      <View style={[styles.attachmentIcon, { backgroundColor: iconBg }]}>
        {isPending ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Attachment size={hp(2.2)} color={iconColor} strokeWidth={2} />
        )}
      </View>
      <View style={styles.attachmentInfo}>
        <Text
          style={[
            styles.attachmentFileName,
            { color: fileNameColor },
          ]}
          numberOfLines={1}
        >
          {attachmentName || 'Attachment'}
        </Text>
        {isPending ? (
          <Text style={[styles.attachmentDownloadText, { color: downloadTextColor, opacity: 0.7 }]}>
            Sending...
          </Text>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (attachmentInfo?.url) {
                handleDownloadAttachment(
                  messageId,
                  attachmentInfo.url,
                  attachmentInfo.type,
                  attachmentInfo.name
                );
              }
            }}
            disabled={downloadingAttachments[messageId]}
          >
            <Text style={[styles.attachmentDownloadText, { color: downloadTextColor }]}>
              {downloadingAttachments[messageId] ? 'Downloading...' : 'Download'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  attachmentMessageContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 150,
    maxWidth: '80%',
  },
  attachmentFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
    maxWidth: '100%',
  },
  attachmentImagePreview: {
    width: hp(5),
    height: hp(5),
    borderRadius: 12,
    marginBottom: 8,
  },
  attachmentImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentImageInfo: {
    width: '100%',
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  attachmentInfo: {
    flex: 1,
    minWidth: 0, // Allow text to shrink
  },
  attachmentFileName: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    marginBottom: 2,
  },
  attachmentDownloadText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
});

export default AttachmentMessage;

