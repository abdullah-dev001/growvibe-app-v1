import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hp } from '../../helpers/common';

const RecordingControls = ({ 
  recordingDuration, 
  onCancel, 
  onStop 
}) => {
  const MAX_DURATION = 40; // 40 second limit
  const WARNING_THRESHOLD = 30; // Show warning at 30 seconds
  const remainingSeconds = MAX_DURATION - recordingDuration;
  const isWarning = recordingDuration >= WARNING_THRESHOLD;
  const isCritical = recordingDuration >= 35;
  const isAtLimit = recordingDuration >= MAX_DURATION;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-stop at limit
  React.useEffect(() => {
    if (isAtLimit && onStop) {
      onStop();
    }
  }, [isAtLimit, onStop]);

  return (
    <View style={[
      styles.recordingContainer,
      isWarning && styles.recordingContainerWarning,
      isCritical && styles.recordingContainerCritical
    ]}>
      <TouchableOpacity
        style={styles.cancelRecordingButton}
        onPress={onCancel}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelIcon}>✕</Text>
      </TouchableOpacity>
      <View style={styles.recordingInfo}>
        <View style={styles.recordingIndicator}>
          <View style={[
            styles.recordingDot,
            isWarning && styles.recordingDotWarning,
            isCritical && styles.recordingDotCritical
          ]} />
          <Text style={[
            styles.recordingText,
            isWarning && styles.recordingTextWarning,
            isCritical && styles.recordingTextCritical
          ]}>
            Recording {formatDuration(recordingDuration)}
          </Text>
        </View>
        {isWarning && (
          <Text style={[
            styles.warningText,
            isCritical && styles.warningTextCritical
          ]}>
            {isAtLimit 
              ? 'Time limit reached!' 
              : `Only ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} left`
            }
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.stopRecordingButton,
          isWarning && styles.stopRecordingButtonWarning,
          isCritical && styles.stopRecordingButtonCritical
        ]}
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
  recordingContainerWarning: {
    backgroundColor: '#FEF3C7',
  },
  recordingContainerCritical: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
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
  recordingDotWarning: {
    backgroundColor: '#F59E0B',
  },
  recordingDotCritical: {
    backgroundColor: '#DC2626',
  },
  recordingText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#991B1B',
  },
  recordingTextWarning: {
    color: '#92400E',
  },
  recordingTextCritical: {
    color: '#991B1B',
    fontWeight: '600',
  },
  warningText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-SemiBold',
    color: '#92400E',
    marginTop: 2,
  },
  warningTextCritical: {
    color: '#991B1B',
    fontWeight: '700',
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
  stopRecordingButtonWarning: {
    backgroundColor: '#F59E0B',
  },
  stopRecordingButtonCritical: {
    backgroundColor: '#DC2626',
  },
  stopIcon: {
    width: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});

export default RecordingControls;

