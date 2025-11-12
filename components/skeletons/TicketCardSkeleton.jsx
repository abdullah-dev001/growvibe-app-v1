import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hp } from '../../helpers/common';

const TicketCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Header with Title and Priority Skeletons */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={[styles.skeletonBar, styles.titleSkeleton]} />
        </View>
        <View style={styles.statusBadgeSkeleton} />
      </View>

      {/* Description Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeletonBar, styles.descriptionLine1]} />
        <View style={[styles.skeletonBar, styles.descriptionLine2]} />
        <View style={[styles.skeletonBar, styles.descriptionLine3]} />
      </View>

      {/* Footer with Date and Reply Count */}
      <View style={styles.footer}>
        <View style={[styles.skeletonBar, styles.dateSkeleton]} />
        <View style={[styles.skeletonBar, styles.replyCountSkeleton]} />
      </View>

      {/* Action Button Skeleton */}
      <View style={styles.actionsContainer}>
        <View style={styles.buttonSkeleton} />
      </View>
    </View>
  );
};

export default TicketCardSkeleton;

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
  section: {
    marginBottom: 12,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateSkeleton: {
    height: hp(1.2),
    width: '40%',
  },
  replyCountSkeleton: {
    height: hp(1.2),
    width: '25%',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  buttonSkeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    height: hp(3.5),
    width: hp(12),
  },
});

