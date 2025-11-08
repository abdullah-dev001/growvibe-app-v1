import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hp } from '../../helpers/common';

const LeaderboardCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderContent}>
          <View style={[styles.skeletonBar, styles.titleSkeleton]} />
          <View style={[styles.skeletonBar, styles.dateSkeleton]} />
        </View>
        <View style={styles.cardActions}>
          <View style={[styles.skeletonBar, styles.editButtonSkeleton]} />
          <View style={[styles.skeletonBar, styles.deleteButtonSkeleton]} />
        </View>
      </View>

      {/* Students Section */}
      <View style={styles.studentsSection}>
        <View style={[styles.skeletonBar, styles.studentsLabelSkeleton]} />
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.studentItem}>
            <View style={[styles.skeletonBar, styles.rankBadgeSkeleton]} />
            <View style={styles.studentInfo}>
              <View style={[styles.skeletonBar, styles.avatarSkeleton]} />
              <View style={styles.studentDetails}>
                <View style={[styles.skeletonBar, styles.studentNameSkeleton]} />
                <View style={[styles.skeletonBar, styles.studentEmailSkeleton]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default LeaderboardCardSkeleton;

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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderContent: {
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
  dateSkeleton: {
    height: hp(1.2),
    width: '40%',
  },
  cardActions: {
    flexDirection: 'row',
  },
  editButtonSkeleton: {
    height: hp(2.5),
    width: hp(8),
    marginRight: 8,
  },
  deleteButtonSkeleton: {
    height: hp(2.5),
    width: hp(8),
  },
  studentsSection: {
    marginTop: 12,
  },
  studentsLabelSkeleton: {
    height: hp(1.4),
    width: '30%',
    marginBottom: 12,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  rankBadgeSkeleton: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSkeleton: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentNameSkeleton: {
    height: hp(1.5),
    width: '60%',
    marginBottom: 6,
  },
  studentEmailSkeleton: {
    height: hp(1.2),
    width: '80%',
  },
});

