import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Send from '../../assets/icons/Send';
import { hp } from '../../helpers/common';

const AttachmentPreview = ({ attachment, isUploading, onRemove, onSend }) => {
  return (
    <View style={styles.attachmentPreview}>
      <TouchableOpacity
        style={styles.removeAttachmentButton}
        onPress={onRemove}
        activeOpacity={0.7}
      >
        <Text style={styles.removeAttachmentIcon}>✕</Text>
      </TouchableOpacity>
      {attachment.type?.startsWith('image/') ? (
        <Image
          source={{ uri: attachment.uri }}
          style={styles.attachmentPreviewImage}
          contentFit="cover"
          cachePolicy="disk"
        />
      ) : (
        <View style={styles.attachmentPreviewFile}>
          <Text style={styles.attachmentPreviewFileName} numberOfLines={1}>
            {attachment.name}
          </Text>
          <Text style={styles.attachmentPreviewFileSize}>
            {(attachment.size / 1024).toFixed(1)} KB
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.sendAttachmentButton}
        onPress={onSend}
        activeOpacity={0.7}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Send size={hp(2)} color="#FFFFFF" strokeWidth={2} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    gap: 8,
  },
  removeAttachmentButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeAttachmentIcon: {
    fontSize: hp(1.4),
    color: '#6B7280',
    fontWeight: '600',
  },
  attachmentPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  attachmentPreviewFile: {
    flex: 1,
    justifyContent: 'center',
  },
  attachmentPreviewFileName: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  attachmentPreviewFileSize: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  sendAttachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: hp(2),
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default AttachmentPreview;

