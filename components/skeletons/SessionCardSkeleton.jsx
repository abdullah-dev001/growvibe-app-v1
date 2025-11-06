import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hp } from '../../helpers/common';

const SessionCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Header with Session Name and Status */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Session Name Skeleton */}
          <View style={[styles.skeletonBar, styles.sessionNameSkeleton]} />
          {/* Duration Skeleton */}
          <View style={[styles.skeletonBar, styles.durationSkeleton]} />
        </View>
        {/* Status Badge Skeleton */}
        <View style={styles.statusBadgeSkeleton} />
      </View>

      {/* Session Dates Skeleton */}
      <View style={styles.section}>
        <View style={styles.datesRow}>
          <View style={styles.dateColumn}>
            <View style={[styles.skeletonBar, styles.dateLabelSkeleton]} />
            <View style={[styles.skeletonBar, styles.dateValueSkeleton]} />
          </View>
          <View style={[styles.dateColumn, styles.dateColumnRight]}>
            <View style={[styles.skeletonBar, styles.dateLabelSkeleton]} />
            <View style={[styles.skeletonBar, styles.dateValueSkeleton]} />
          </View>
        </View>
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.actionsRow}>
        <View style={styles.buttonSkeleton} />
        <View style={[styles.buttonSkeleton, styles.buttonSkeletonMedium]} />
      </View>
    </View>
  );
};

export default SessionCardSkeleton;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
  },
  skeletonBar: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  sessionNameSkeleton: {
    height: hp(1.8),
    width: '70%',
    marginBottom: 8,
  },
  durationSkeleton: {
    height: hp(1.3),
    width: '50%',
  },
  statusBadgeSkeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    height: hp(2.5),
    width: hp(10),
  },
  section: {
    marginBottom: 16,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateColumn: {
    flex: 1,
  },
  dateColumnRight: {
    marginLeft: 16,
  },
  dateLabelSkeleton: {
    height: hp(1.2),
    width: '60%',
    marginBottom: 8,
  },
  dateValueSkeleton: {
    height: hp(1.4),
    width: '80%',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  buttonSkeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    height: hp(3.5),
    width: hp(10),
  },
  buttonSkeletonMedium: {
    width: hp(12),
    marginLeft: 8,
  },
});

