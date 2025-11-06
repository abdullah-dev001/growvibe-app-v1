import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hp } from '../../helpers/common';

const OwnerCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Header with Image, Name and Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Avatar Skeleton */}
          <View style={styles.avatarSkeleton} />
          <View style={styles.headerContent}>
            {/* Name Skeleton */}
            <View style={[styles.skeletonBar, styles.nameSkeleton]} />
            {/* Contact Skeleton */}
            <View style={[styles.skeletonBar, styles.contactSkeleton]} />
          </View>
        </View>
        {/* Status Badge Skeleton */}
        <View style={styles.statusBadgeSkeleton} />
      </View>

      {/* Stats Row Skeleton */}
      <View style={styles.statsRow}>
        <View style={styles.statGroup}>
          <View style={[styles.skeletonBar, styles.statLabelSkeleton]} />
          <View style={[styles.skeletonBar, styles.statValueSkeleton, styles.statValueSmall]} />
        </View>
        <View style={styles.statGroup}>
          <View style={[styles.skeletonBar, styles.statLabelSkeletonSmall]} />
          <View style={[styles.skeletonBar, styles.statValueSkeleton]} />
        </View>
      </View>

      {/* Actions Skeleton */}
      <View style={styles.actionsContainer}>
        {/* Primary Actions Skeleton */}
        <View style={styles.primaryActions}>
          <View style={styles.buttonSkeleton} />
          <View style={[styles.buttonSkeleton, styles.buttonSkeletonMedium]} />
        </View>
        
        {/* Additional Action Buttons Skeleton */}
        <View style={styles.secondaryActions}>
          <View style={[styles.buttonSkeleton, styles.buttonSkeletonLarge]} />
        </View>
      </View>
    </View>
  );
};

export default OwnerCardSkeleton;

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
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    width: hp(6),
    height: hp(6),
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
  contactSkeleton: {
    height: hp(1.3),
    width: '60%',
  },
  statusBadgeSkeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    height: hp(2.5),
    width: hp(10),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabelSkeleton: {
    height: hp(1.4),
    width: hp(12),
  },
  statLabelSkeletonSmall: {
    height: hp(1.4),
    width: hp(8),
  },
  statValueSkeleton: {
    height: hp(1.5),
    width: hp(12),
  },
  statValueSmall: {
    width: hp(4),
    marginLeft: 8,
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
    marginLeft: 8,
  },
  buttonSkeletonLarge: {
    width: hp(14),
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
