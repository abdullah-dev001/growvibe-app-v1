import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hp } from '../../helpers/common';

const BranchCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Header with Branch Name and Status */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Branch Name Skeleton */}
          <View style={[styles.skeletonBar, styles.branchNameSkeleton]} />
          {/* Address Skeleton */}
          <View style={[styles.skeletonBar, styles.addressSkeleton]} />
        </View>
        
        {/* Status Badge Skeleton */}
        <View style={styles.statusBadgeSkeleton} />
      </View>

      {/* Branch Details */}
      <View style={styles.section}>
        {/* Contact Skeleton */}
        <View style={styles.detailRow}>
          <View style={[styles.skeletonBar, styles.detailLabelSkeleton]} />
          <View style={[styles.skeletonBar, styles.detailValueSkeleton]} />
        </View>

        {/* Subscription Fee Skeleton */}
        <View style={styles.detailRow}>
          <View style={[styles.skeletonBar, styles.feeLabelSkeleton]} />
          <View style={[styles.skeletonBar, styles.feeValueSkeleton]} />
        </View>
      </View>

      {/* Created Date Skeleton */}
      <View style={styles.dateRow}>
        <View style={styles.dateContainer}>
          <View style={[styles.skeletonBar, styles.dateSkeleton]} />
        </View>
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.actionsRow}>
        {/* Edit Button Skeleton */}
        <View style={styles.buttonSkeletonSmall} />
        {/* Delete Button Skeleton */}
        <View style={[styles.buttonSkeletonSmall, styles.buttonSkeletonMedium]} />
      </View>
    </View>
  );
};

export default BranchCardSkeleton;

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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  skeletonBar: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  branchNameSkeleton: {
    height: hp(2.3),
    width: '75%',
    marginBottom: 8,
  },
  addressSkeleton: {
    height: hp(1.4),
    width: '85%',
  },
  statusBadgeSkeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    height: hp(2.2),
    width: hp(8),
  },
  section: {
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabelSkeleton: {
    height: hp(1.4),
    width: '30%',
    marginBottom: 4,
  },
  detailValueSkeleton: {
    height: hp(1.5),
    width: '60%',
  },
  feeLabelSkeleton: {
    height: hp(1.4),
    width: '40%',
    marginBottom: 4,
  },
  feeValueSkeleton: {
    height: hp(1.5),
    width: '25%',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSkeleton: {
    height: hp(1.4),
    width: hp(12),
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  buttonSkeletonSmall: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    height: hp(3.2),
    width: hp(8),
  },
  buttonSkeletonMedium: {
    width: hp(10),
    marginLeft: 8,
  },
});
