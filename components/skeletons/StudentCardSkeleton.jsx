import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hp } from '../../helpers/common';

const StudentCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Header with Student Name and Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Student Avatar Skeleton */}
          <View style={styles.avatarSkeleton} />
          <View style={styles.headerContent}>
            {/* Name Skeleton */}
            <View style={[styles.skeletonBar, styles.nameSkeleton]} />
            {/* Email Skeleton */}
            <View style={[styles.skeletonBar, styles.emailSkeleton]} />
          </View>
        </View>
        {/* Status Badge Skeleton */}
        <View style={styles.statusBadgeSkeleton} />
      </View>

      {/* Student Details Skeleton */}
      <View style={styles.section}>
        {/* Contact Skeleton */}
        <View style={styles.detailRow}>
          <View style={[styles.skeletonBar, styles.labelSkeleton]} />
          <View style={[styles.skeletonBar, styles.valueSkeleton]} />
        </View>
        {/* Fee Skeleton */}
        <View style={styles.detailRow}>
          <View style={[styles.skeletonBar, styles.feeLabelSkeleton]} />
          <View style={[styles.skeletonBar, styles.feeValueSkeleton]} />
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
          <View style={[styles.buttonSkeleton, styles.buttonSkeletonMedium]} />
          <View style={[styles.buttonSkeleton, styles.buttonSkeletonLarge, styles.buttonMarginLeft]} />
        </View>
      </View>
    </View>
  );
};

export default StudentCardSkeleton;

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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarSkeleton: {
    width: hp(6),
    height: hp(6),
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  skeletonBar: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  nameSkeleton: {
    height: hp(1.8),
    width: '70%',
    marginBottom: 8,
  },
  emailSkeleton: {
    height: hp(1.3),
    width: '60%',
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
  detailRow: {
    marginBottom: 8,
  },
  labelSkeleton: {
    height: hp(1.2),
    width: '40%',
    marginBottom: 8,
  },
  valueSkeleton: {
    height: hp(1.4),
    width: '60%',
  },
  feeLabelSkeleton: {
    height: hp(1.2),
    width: '30%',
    marginBottom: 8,
  },
  feeValueSkeleton: {
    height: hp(1.4),
    width: '40%',
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

