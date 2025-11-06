import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hp } from '../../helpers/common';

const SchoolCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Header with Status Badge */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* School Name Skeleton */}
          <View style={[styles.skeletonBar, styles.schoolNameSkeleton]} />
          {/* Address Skeleton */}
          <View style={[styles.skeletonBar, styles.addressSkeleton]} />
        </View>
        
        {/* Status Badge Skeleton */}
        <View style={styles.statusBadgeSkeleton} />
      </View>

      {/* School Details */}
      <View style={styles.section}>
        {/* Contact Skeleton */}
        <View style={styles.detailRow}>
          <View style={[styles.skeletonBar, styles.detailLabelSkeleton]} />
          <View style={[styles.skeletonBar, styles.detailValueSkeleton]} />
        </View>

        {/* Total Users Skeleton */}
        <View style={styles.detailRow}>
          <View style={[styles.skeletonBar, styles.usersLabelSkeleton]} />
          <View style={[styles.skeletonBar, styles.usersValueSkeleton]} />
        </View>

        {/* Created Date Skeleton */}
        <View style={styles.detailRow}>
          <View style={[styles.skeletonBar, styles.dateLabelSkeleton]} />
          <View style={[styles.skeletonBar, styles.dateValueSkeleton]} />
        </View>

        {/* Owner Email Skeleton */}
        <View style={styles.detailRow}>
          <View style={[styles.skeletonBar, styles.detailLabelSkeleton]} />
          <View style={[styles.skeletonBar, styles.emailValueSkeleton]} />
        </View>

        {/* Subscription Fee Skeleton */}
        <View style={styles.detailRow}>
          <View style={[styles.skeletonBar, styles.feeLabelSkeleton]} />
          <View style={[styles.skeletonBar, styles.feeValueSkeleton]} />
        </View>
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.actionsContainer}>
        {/* Primary Actions */}
        <View style={styles.primaryActions}>
          {/* Edit Button Skeleton */}
          <View style={styles.buttonSkeletonSmall} />
          {/* Delete Button Skeleton */}
          <View style={[styles.buttonSkeletonSmall, styles.buttonSkeletonMedium]} />
        </View>

        {/* Additional Action Buttons */}
        <View style={styles.secondaryActions}>
          {/* Edit Owner Button Skeleton */}
          <View style={[styles.buttonSkeletonSmall, styles.buttonSkeletonMedium]} />
          {/* View Payments Button Skeleton */}
          <View style={[styles.buttonSkeletonSmall, styles.buttonSkeletonLarge, styles.buttonMarginLeft]} />
          {/* View Branches Button Skeleton */}
          <View style={[styles.buttonSkeletonSmall, styles.buttonSkeletonLargeAlt, styles.buttonMarginLeft]} />
        </View>
      </View>
    </View>
  );
};

export default SchoolCardSkeleton;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  skeletonBar: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  schoolNameSkeleton: {
    height: hp(2.3),
    width: '80%',
    marginBottom: 8,
  },
  addressSkeleton: {
    height: hp(1.4),
    width: '90%',
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
  usersLabelSkeleton: {
    height: hp(1.4),
    width: '25%',
    marginBottom: 4,
  },
  usersValueSkeleton: {
    height: hp(1.5),
    width: '20%',
  },
  dateLabelSkeleton: {
    height: hp(1.4),
    width: '35%',
    marginBottom: 4,
  },
  dateValueSkeleton: {
    height: hp(1.5),
    width: '40%',
  },
  emailValueSkeleton: {
    height: hp(1.5),
    width: '70%',
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
  actionsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  primaryActions: {
    flexDirection: 'row',
  },
  buttonSkeletonSmall: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    height: hp(3.2),
    width: hp(8),
  },
  buttonSkeletonMedium: {
    width: hp(10),
  },
  buttonSkeletonLarge: {
    width: hp(14),
  },
  buttonSkeletonLargeAlt: {
    width: hp(13),
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