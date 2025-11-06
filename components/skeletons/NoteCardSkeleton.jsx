import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hp } from '../../helpers/common';

const NoteCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Header with Title and Status Skeletons */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={[styles.skeletonBar, styles.titleSkeleton]} />
          <View style={[styles.statusBadgeSkeleton, styles.statusBadgeLeft]} />
        </View>
        <View style={styles.statusBadgeSkeleton} />
      </View>

      {/* Description Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeletonBar, styles.descriptionLabelSkeleton]} />
        <View style={[styles.skeletonBar, styles.descriptionLine1]} />
        <View style={[styles.skeletonBar, styles.descriptionLine2]} />
        <View style={[styles.skeletonBar, styles.descriptionLine3]} />
      </View>

      {/* Details Skeletons */}
      <View style={styles.section}>
        <View style={styles.detailRow}>
          <View style={[styles.skeletonBar, styles.detailLabel1]} />
          <View style={[styles.skeletonBar, styles.detailValue1]} />
        </View>
        <View style={styles.detailRow}>
          <View style={[styles.skeletonBar, styles.detailLabel2]} />
          <View style={[styles.skeletonBar, styles.detailValue2]} />
        </View>
        <View style={styles.detailRow}>
          <View style={[styles.skeletonBar, styles.detailLabel3]} />
          <View style={[styles.skeletonBar, styles.detailValue3]} />
        </View>
      </View>

      {/* Created Date Skeleton */}
      <View style={styles.dateRow}>
        <View style={[styles.skeletonBar, styles.dateSkeleton]} />
      </View>

      {/* Action Buttons Skeletons */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionsRow}>
          <View style={styles.buttonSkeleton} />
          <View style={[styles.buttonSkeleton, styles.buttonSkeletonMedium]} />
        </View>
      </View>
    </View>
  );
};

export default NoteCardSkeleton;

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
  titleSkeleton: {
    height: hp(1.8),
    width: '70%',
    marginBottom: 8,
  },
  statusBadgeSkeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    height: hp(2.5),
    width: hp(10),
  },
  statusBadgeLeft: {
    alignSelf: 'flex-start',
  },
  section: {
    marginBottom: 16,
  },
  descriptionLabelSkeleton: {
    height: hp(1.2),
    width: '30%',
    marginBottom: 4,
  },
  descriptionLine1: {
    height: hp(1.4),
    width: '100%',
    marginBottom: 4,
  },
  descriptionLine2: {
    height: hp(1.4),
    width: '90%',
    marginBottom: 4,
  },
  descriptionLine3: {
    height: hp(1.4),
    width: '60%',
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel1: {
    height: hp(1.2),
    width: '25%',
    marginBottom: 4,
  },
  detailValue1: {
    height: hp(1.4),
    width: '50%',
  },
  detailLabel2: {
    height: hp(1.2),
    width: '35%',
    marginBottom: 4,
  },
  detailValue2: {
    height: hp(1.4),
    width: '40%',
  },
  detailLabel3: {
    height: hp(1.2),
    width: '30%',
    marginBottom: 4,
  },
  detailValue3: {
    height: hp(1.4),
    width: '45%',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateSkeleton: {
    height: hp(1.2),
    width: '40%',
  },
  actionsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  actionsRow: {
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
});

