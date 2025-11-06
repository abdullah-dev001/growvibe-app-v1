import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hp } from '../../helpers/common';

const ClassCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Header with Class Name and Status */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Class Name Skeleton */}
          <View style={[styles.skeletonBar, styles.classNameSkeleton]} />
          {/* Student Count Skeleton */}
          <View style={[styles.skeletonBar, styles.studentCountSkeleton]} />
        </View>
        {/* Status Badge Skeleton */}
        <View style={styles.statusBadgeSkeleton} />
      </View>

      {/* Class Incharge Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeletonBar, styles.labelSkeleton]} />
        <View style={styles.inchargeRow}>
          <View style={styles.avatarSkeleton} />
          <View style={[styles.skeletonBar, styles.inchargeNameSkeleton]} />
        </View>
      </View>

      {/* Created Date Skeleton */}
      <View style={styles.dateRow}>
        <View style={[styles.skeletonBar, styles.dateSkeleton]} />
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.actionsContainer}>
        {/* Primary Actions Skeleton */}
        <View style={styles.primaryActions}>
          <View style={styles.buttonSkeleton} />
          <View style={[styles.buttonSkeleton, styles.buttonSkeletonMedium]} />
        </View>
        
        {/* Additional Action Buttons Skeleton */}
        <View style={styles.secondaryActions}>
          <View style={[styles.buttonSkeleton, styles.buttonSkeletonLarge]} />
          <View style={[styles.buttonSkeleton, styles.buttonSkeletonLarge, styles.buttonMarginLeft]} />
          <View style={[styles.buttonSkeleton, styles.buttonSkeletonMedium, styles.buttonMarginLeft]} />
          <View style={[styles.buttonSkeleton, styles.buttonSkeletonMedium, styles.buttonMarginLeft]} />
        </View>
      </View>
    </View>
  );
};

export default ClassCardSkeleton;

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
  classNameSkeleton: {
    height: hp(1.8),
    width: '70%',
    marginBottom: 8,
  },
  studentCountSkeleton: {
    height: hp(1.3),
    width: '40%',
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
  labelSkeleton: {
    height: hp(1.2),
    width: '40%',
    marginBottom: 8,
  },
  inchargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSkeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    width: hp(4),
    height: hp(4),
    marginRight: 12,
  },
  inchargeNameSkeleton: {
    height: hp(1.4),
    width: '50%',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateSkeleton: {
    height: hp(1.4),
    width: hp(20),
  },
  actionsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  primaryActions: {
    flexDirection: 'row',
  },
  buttonSkeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    height: hp(3.5),
    width: hp(10),
  },
  buttonSkeletonMedium: {
    width: hp(12),
  },
  buttonSkeletonLarge: {
    width: hp(14),
  },
  buttonMarginLeft: {
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
    justifyContent: 'flex-end',
  },
});

