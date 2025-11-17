import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hp } from '../../helpers/common';

const RecordingControls = ({ 
  recordingDuration, 
  onCancel, 
  onStop 
}) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.recordingContainer}>
      <TouchableOpacity
        style={styles.cancelRecordingButton}
        onPress={onCancel}
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
        onPress={onStop}
        activeOpacity={0.7}
      >
        <View style={styles.stopIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default RecordingControls;

